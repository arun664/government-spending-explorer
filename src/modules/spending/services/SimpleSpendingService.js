import * as d3 from 'd3'
import { CATEGORY_COLORS } from './UnifiedDataService.js'

/**
 * Simple Spending Data Service
 * Direct CSV processing with sector combination for map visualization
 */

/**
 * Load and process spending data from matrix CSV files
 * Uses the actual data files available in the data directory
 */
export async function loadSpendingData(indicatorCode = 'GE') {
  try {
    console.log(`Loading spending data for ${indicatorCode}...`)
    
    // Map indicator codes to actual data files
    const dataFileMap = {
      'GE': 'total_government_expense_matrix.csv',
      'GECE': 'compensation_of_employees_matrix.csv', 
      'GEG': 'grants_expense_matrix.csv',
      'GEI': 'interest_expense_matrix.csv',
      'GES': 'social_benefits_matrix.csv',
      'GEOM': 'other_expense_matrix.csv',
      'GEUGS': 'use_of_goods_and_services_matrix.csv'
    }
    
    const dataFile = dataFileMap[indicatorCode] || 'total_government_expense_matrix.csv'
    
    // Load CSV data
    const csvData = await d3.csv(`/data/${dataFile}`)
    console.log(`Loaded ${csvData.length} rows from ${dataFile}`)
    
    // Process data: each row is a country with years as columns
    const countryData = {}
    const allValues = []
    
    csvData.forEach(row => {
      const countryName = row.Country
      if (!countryName || countryName === 'Country') return
      
      // Initialize country data
      const yearData = {}
      
      // Process each year column (2005-2022)
      Object.keys(row).forEach(key => {
        if (key === 'Country') return
        
        const year = parseInt(key)
        const value = parseFloat(row[key])
        
        // Skip invalid years or values
        if (isNaN(year) || isNaN(value) || year < 2005 || year > 2022) return
        
        yearData[year] = value
        allValues.push(value)
      })
      
      // Only add countries with data
      if (Object.keys(yearData).length > 0) {
        countryData[countryName] = {
          name: countryName,
          code: generateCountryCode(countryName),
          data: yearData,
          unitMeasure: 'Millions USD'
        }
      }
    })
    
    // Calculate global statistics
    const globalStats = {
      minSpending: Math.min(...allValues),
      maxSpending: Math.max(...allValues),
      avgSpending: allValues.reduce((a, b) => a + b, 0) / allValues.length,
      totalCountries: Object.keys(countryData).length,
      totalDataPoints: allValues.length
    }
    
    console.log('Processed spending data:', {
      countries: Object.keys(countryData).length,
      totalDataPoints: allValues.length,
      valueRange: [globalStats.minSpending, globalStats.maxSpending],
      sampleCountries: Object.keys(countryData).slice(0, 5)
    })
    
    return {
      indicator: indicatorCode,
      name: getIndicatorName(indicatorCode),
      description: `Government spending data for ${getIndicatorName(indicatorCode)}`,
      category: 'overview',
      countries: countryData,
      globalStats
    }
    
  } catch (error) {
    console.error('Error loading spending data:', error)
    throw error
  }
}

/**
 * Get country spending for map visualization
 */
export function getCountrySpendingValue(spendingData, countryName, yearRange = [2015, 2023]) {
  if (!spendingData.countries || !countryName) return null
  
  // Try to find country data with flexible matching
  let countryData = spendingData.countries[countryName]
  
  // Try alternative names if direct match fails
  if (!countryData) {
    const alternativeNames = getAlternativeCountryNames(countryName)
    for (const altName of alternativeNames) {
      if (spendingData.countries[altName]) {
        countryData = spendingData.countries[altName]
        break
      }
    }
  }
  
  if (!countryData || !countryData.data) return null
  
  // Get values within year range
  const valuesInRange = []
  Object.entries(countryData.data).forEach(([year, value]) => {
    const y = parseInt(year)
    if (y >= yearRange[0] && y <= yearRange[1] && !isNaN(value)) {
      valuesInRange.push(value)
    }
  })
  
  if (valuesInRange.length === 0) return null
  
  // Return average spending for the year range
  return valuesInRange.reduce((sum, value) => sum + value, 0) / valuesInRange.length
}

/**
 * Load spending data with sector-specific filtering
 * @param {string} indicatorCode - The indicator code to load
 * @param {string} selectedSector - Optional sector to filter by
 * @returns {Object} Processed spending data with sector filtering applied
 */
export async function loadSpendingDataWithSectorFilter(indicatorCode = 'GE', selectedSector = null) {
  try {
    console.log(`Loading spending data for ${indicatorCode} with sector filter: ${selectedSector}...`)
    
    // Load CSV data
    const { getDataPath } = await import('../../../utils/pathUtils.js')
    const csvData = await d3.csv(getDataPath(`48-indicators/IMF_GFSE_${indicatorCode}_G14.csv`))
    console.log(`Loaded ${csvData.length} rows from CSV`)
    
    // Process data: group by country and year, filter by sector if specified
    const countryData = {}
    const allValues = []
    
    csvData.forEach(row => {
      const country = row.REF_AREA_LABEL
      const year = parseInt(row.TIME_PERIOD)
      const value = parseFloat(row.OBS_VALUE)
      const unitMeasure = row.UNIT_MEASURE
      const sector = row.SECTOR_LABEL || row.SECTOR || 'General Government'
      
      // Skip invalid data
      if (!country || isNaN(year) || isNaN(value)) return
      
      // If sector filter is specified, only include matching sectors
      if (selectedSector && sector !== selectedSector) return
      
      // Initialize country if not exists
      if (!countryData[country]) {
        countryData[country] = {
          name: country,
          code: row.REF_AREA || country.substring(0, 3).toUpperCase(),
          yearlyData: {},
          unitMeasure: unitMeasure
        }
      }
      
      // Initialize year if not exists
      if (!countryData[country].yearlyData[year]) {
        countryData[country].yearlyData[year] = {
          values: [],
          unitMeasure: unitMeasure
        }
      }
      
      // Add value to this year
      countryData[country].yearlyData[year].values.push(value)
    })
    
    // Process each country: combine values for each year
    Object.keys(countryData).forEach(countryName => {
      const country = countryData[countryName]
      const processedYearData = {}
      
      Object.keys(country.yearlyData).forEach(year => {
        const yearData = country.yearlyData[year]
        
        // Sum all values for this year (after sector filtering)
        const totalSpending = yearData.values.reduce((sum, value) => sum + value, 0)
        
        processedYearData[year] = totalSpending
        allValues.push(totalSpending)
      })
      
      // Replace yearly data with processed totals
      country.data = processedYearData
      delete country.yearlyData // Clean up
    })
    
    // Calculate global statistics
    const globalStats = {
      minSpending: Math.min(...allValues),
      maxSpending: Math.max(...allValues),
      avgSpending: allValues.reduce((sum, val) => sum + val, 0) / allValues.length,
      totalCountries: Object.keys(countryData).length,
      totalDataPoints: allValues.length
    }
    
    console.log(`Processed spending data:`, {
      countries: Object.keys(countryData).length,
      totalDataPoints: allValues.length,
      globalStats
    })
    
    return {
      name: getIndicatorName(indicatorCode),
      code: indicatorCode,
      category: 'overview',
      countries: countryData,
      globalStats: globalStats,
      sectorFilter: selectedSector
    }
    
  } catch (error) {
    console.error('Error loading spending data:', error)
    throw error
  }
}

/**
 * Get alternative country names for matching
 */
function getAlternativeCountryNames(countryName) {
  const alternatives = []
  
  // Common mappings
  const mappings = {
    'United States of America': ['United States', 'USA'],
    'United States': ['United States of America', 'USA'],
    'Russia': ['Russian Federation'],
    'Russian Federation': ['Russia'],
    'South Korea': ['Korea, Republic of'],
    'Korea, Republic of': ['South Korea'],
    'Iran': ['Iran, Islamic Republic of'],
    'Venezuela': ['Venezuela, Bolivarian Republic of'],
    'Bolivia': ['Bolivia, Plurinational State of'],
    'Tanzania': ['Tanzania, United Republic of'],
    'Czech Republic': ['Czechia'],
    'Czechia': ['Czech Republic'],
    'UAE': ['United Arab Emirates'],
    'United Arab Emirates': ['UAE'],
    'UK': ['United Kingdom'],
    'United Kingdom': ['UK']
  }
  
  if (mappings[countryName]) {
    alternatives.push(...mappings[countryName])
  }
  
  // Add the original name
  alternatives.push(countryName)
  
  return alternatives
}

/**
 * Get indicator display name
 */
function getIndicatorName(code) {
  const names = {
    'GE': 'Total Government Expense',
    'GECE': 'Compensation of Employees',
    'GEG': 'Total Grants',
    'GEI': 'Total Interest',
    'GES': 'Total Social Benefits',
    'GEOM': 'Use of Goods and Services'
  }
  
  return names[code] || `Indicator ${code}`
}

/**
 * Create color scale for map visualization using category colors
 */
export function createColorScale(minValue, maxValue, category = 'overview') {
  // Get the base color for this category
  const baseColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.overview
  
  // Create a more contrasted sequential scale
  const lightColor = d3.color(baseColor).brighter(2).toString()
  const darkColor = d3.color(baseColor).darker(0.5).toString()
  
  return d3.scaleSequential()
    .domain([minValue, maxValue])
    .interpolator(d3.interpolateRgb(lightColor, darkColor))
}

/**
 * Load spending data with category analysis for multi-category visualization
 * @param {Array} indicatorCodes - Array of indicator codes to analyze
 * @param {Array} yearRange - Year range for analysis
 * @returns {Object} Processed data with category dominance information
 */
export async function loadCategorySpendingData(indicatorCodes = ['GE', 'GECE', 'GEG', 'GEI', 'GES', 'GEOM'], yearRange = [2015, 2023]) {
  try {
    console.log(`Loading category spending data for indicators: ${indicatorCodes.join(', ')}`)
    
    const { INDICATOR_METADATA, CATEGORY_COLORS } = await import('./UnifiedDataService.js')
    
    // Load data for each indicator
    const indicatorDataPromises = indicatorCodes.map(async (code) => {
      try {
        const { getDataPath } = await import('../../../utils/pathUtils.js')
        const csvData = await d3.csv(getDataPath(`48-indicators/IMF_GFSE_${code}_G14.csv`))
        return { code, csvData, metadata: INDICATOR_METADATA[code] }
      } catch (error) {
        console.warn(`Failed to load ${code}:`, error)
        return null
      }
    })
    
    const indicatorResults = (await Promise.all(indicatorDataPromises)).filter(Boolean)
    
    // Process data by country
    const countryData = {}
    const categoryTotals = {}
    
    indicatorResults.forEach(({ code, csvData, metadata }) => {
      const category = metadata.category
      
      csvData.forEach(row => {
        const country = row.REF_AREA_LABEL
        const year = parseInt(row.TIME_PERIOD)
        const value = parseFloat(row.OBS_VALUE)
        
        if (!country || isNaN(year) || isNaN(value)) return
        if (year < yearRange[0] || year > yearRange[1]) return
        
        // Initialize country data
        if (!countryData[country]) {
          countryData[country] = {
            name: country,
            code: row.REF_AREA || country.substring(0, 3).toUpperCase(),
            categories: {},
            totalSpending: 0,
            dominantCategory: null,
            categoryPercentages: {}
          }
        }
        
        // Initialize category for country
        if (!countryData[country].categories[category]) {
          countryData[country].categories[category] = []
        }
        
        // Add value to category
        countryData[country].categories[category].push(value)
        
        // Track global category totals
        if (!categoryTotals[category]) {
          categoryTotals[category] = []
        }
        categoryTotals[category].push(value)
      })
    })
    
    // Calculate category averages and determine dominant categories
    Object.keys(countryData).forEach(countryName => {
      const country = countryData[countryName]
      let maxCategoryValue = 0
      let dominantCategory = 'overview'
      
      // Calculate average spending per category
      Object.keys(country.categories).forEach(category => {
        const values = country.categories[category]
        const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length
        country.categories[category] = avgValue
        country.totalSpending += avgValue
        
        // Track dominant category
        if (avgValue > maxCategoryValue) {
          maxCategoryValue = avgValue
          dominantCategory = category
        }
      })
      
      country.dominantCategory = dominantCategory
      
      // Calculate category percentages
      Object.keys(country.categories).forEach(category => {
        country.categoryPercentages[category] = 
          country.totalSpending > 0 ? (country.categories[category] / country.totalSpending) * 100 : 0
      })
    })
    
    // Calculate global statistics
    const allTotalSpending = Object.values(countryData).map(c => c.totalSpending).filter(v => v > 0)
    const globalStats = {
      minSpending: Math.min(...allTotalSpending),
      maxSpending: Math.max(...allTotalSpending),
      avgSpending: allTotalSpending.reduce((a, b) => a + b, 0) / allTotalSpending.length,
      totalCountries: Object.keys(countryData).length,
      totalDataPoints: allTotalSpending.length
    }
    
    console.log('Category spending data processed:', {
      countries: Object.keys(countryData).length,
      categories: Object.keys(categoryTotals),
      globalStats
    })
    
    return {
      name: 'Multi-Category Government Spending Analysis',
      description: 'Government spending analysis across multiple categories',
      category: 'multi-category',
      countries: countryData,
      globalStats,
      categoryColors: CATEGORY_COLORS,
      indicators: indicatorCodes,
      yearRange
    }
    
  } catch (error) {
    console.error('Error loading category spending data:', error)
    throw error
  }
}

/**
 * Get country spending value for category-based map visualization
 */
export function getCountrySpendingValueForCategory(categoryData, countryName, visualizationMode = 'dominant') {
  if (!categoryData.countries || !countryName) return null
  
  // Try to find country data with flexible matching
  let countryData = categoryData.countries[countryName]
  
  // Try alternative names if direct match fails
  if (!countryData) {
    const alternativeNames = getAlternativeCountryNames(countryName)
    for (const altName of alternativeNames) {
      if (categoryData.countries[altName]) {
        countryData = categoryData.countries[altName]
        break
      }
    }
  }
  
  if (!countryData) return null
  
  switch (visualizationMode) {
    case 'dominant':
      // Return the dominant category and its value
      return {
        category: countryData.dominantCategory,
        value: countryData.categories[countryData.dominantCategory] || 0,
        totalSpending: countryData.totalSpending,
        percentages: countryData.categoryPercentages
      }
    
    case 'total':
      // Return total spending across all categories
      return {
        category: 'overview',
        value: countryData.totalSpending,
        totalSpending: countryData.totalSpending,
        percentages: countryData.categoryPercentages
      }
    
    default:
      return {
        category: countryData.dominantCategory,
        value: countryData.categories[countryData.dominantCategory] || 0,
        totalSpending: countryData.totalSpending,
        percentages: countryData.categoryPercentages
      }
  }
}

/**
 * Create category-based color scale for spending visualization
 */
export function createCategoryColorScale(spendingData) {
  // If we have category information, use category colors
  if (spendingData.category && CATEGORY_COLORS[spendingData.category]) {
    const categoryColor = CATEGORY_COLORS[spendingData.category]
    
    // Create more contrasted colors
    const lightColor = d3.color(categoryColor).brighter(2).toString()
    const darkColor = d3.color(categoryColor).darker(0.5).toString()
    
    return d3.scaleSequential()
      .domain([spendingData.globalStats.minSpending, spendingData.globalStats.maxSpending])
      .interpolator(d3.interpolateRgb(lightColor, darkColor))
  }
  
  // Fallback to a more visible color scale
  return d3.scaleSequential()
    .domain([spendingData.globalStats.minSpending, spendingData.globalStats.maxSpending])
    .interpolator(d3.interpolateBlues)
}

/**
 * Create category-based color function for multi-category visualization
 */
export function createCategoryColorFunction(categoryData) {
  const categoryColors = categoryData.categoryColors || {}
  
  return (countryName, visualizationMode = 'dominant') => {
    const countryInfo = getCountrySpendingValueForCategory(categoryData, countryName, visualizationMode)
    
    if (!countryInfo || countryInfo.value === 0) {
      return '#e8e8e8' // Slightly darker gray for no data to make it visible
    }
    
    if (visualizationMode === 'dominant') {
      // Use the dominant category color
      const categoryColor = categoryColors[countryInfo.category] || categoryColors.overview
      
      // Create intensity based on spending value relative to global max
      const intensity = Math.min(countryInfo.value / categoryData.globalStats.maxSpending, 1)
      
      // Use more contrasted colors - light to dark based on spending
      const lightColor = d3.color(categoryColor).brighter(2).toString()
      const darkColor = d3.color(categoryColor).darker(0.5).toString()
      
      return d3.interpolateRgb(lightColor, darkColor)(intensity * 0.8 + 0.2)
    }
    
    // For other modes, use a default approach
    return categoryColors.overview || '#667eea'
  }
}
/*
*
 * Generate country code from country name
 */
function generateCountryCode(countryName) {
  const codeMap = {
    'United States': 'USA',
    'United Kingdom': 'GBR', 
    'Russian Federation': 'RUS',
    'China': 'CHN',
    'Japan': 'JPN',
    'Germany': 'DEU',
    'France': 'FRA',
    'Italy': 'ITA',
    'Canada': 'CAN',
    'Australia': 'AUS',
    'Brazil': 'BRA',
    'India': 'IND',
    'South Korea': 'KOR',
    'Spain': 'ESP',
    'Mexico': 'MEX',
    'Indonesia': 'IDN',
    'Netherlands': 'NLD',
    'Saudi Arabia': 'SAU',
    'Turkey': 'TUR',
    'Switzerland': 'CHE'
  }
  
  return codeMap[countryName] || countryName.substring(0, 3).toUpperCase()
}

/**
 * Format spending values with B/M suffixes
 */
export function formatSpendingValue(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  
  const absValue = Math.abs(value)
  
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1)}B`
  } else if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1)}M`
  } else {
    return `${value.toFixed(1)}K`
  }
}