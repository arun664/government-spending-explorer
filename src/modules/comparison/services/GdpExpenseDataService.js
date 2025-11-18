/**
 * GdpExpenseDataService - Load and process GDP and Government Expense data
 * 
 * Features:
 * - Load GDP data from gdp_vals.csv (GDP in current US$)
 * - Load total government expense from expense_clean_usd.csv (USD-converted values)
 * - Calculate world averages
 * - Format data for chart visualization
 * 
 * Data Sources:
 * - GDP: gdp_vals.csv - World Bank GDP data in current US$
 * - Expense: expense_clean_usd.csv - Government spending converted to USD for comparison
 */

import * as d3 from 'd3'
import { getDataPath } from '../../../utils/pathUtils.js'

/**
 * Sector data files and metadata
 */
const SECTOR_FILES = [
  'social_benefits_matrix.csv',
  'compensation_of_employees_matrix.csv',
  'interest_expense_matrix.csv',
  'use_of_goods_and_services_matrix.csv',
  'grants_expense_matrix.csv',
  'other_expense_matrix.csv'
]

const SECTOR_METADATA = {
  'social_benefits': { 
    name: 'Social Benefits', 
    color: '#4e79a7', 
    icon: '👥',
    description: 'Social security and welfare payments'
  },
  'compensation_of_employees': { 
    name: 'Employee Compensation', 
    color: '#f28e2c', 
    icon: '💼',
    description: 'Salaries and benefits for government employees'
  },
  'interest_expense': { 
    name: 'Interest Payments', 
    color: '#e15759', 
    icon: '💰',
    description: 'Interest on government debt'
  },
  'use_of_goods_and_services': { 
    name: 'Goods & Services', 
    color: '#76b7b2', 
    icon: '🏭',
    description: 'Government purchases of goods and services'
  },
  'grants_expense': { 
    name: 'Grants', 
    color: '#59a14f', 
    icon: '🎁',
    description: 'Grants to other governments and organizations'
  },
  'other_expense': { 
    name: 'Other Expenses', 
    color: '#edc949', 
    icon: '📊',
    description: 'Miscellaneous government expenses'
  }
}

/**
 * Load GDP data from gdp_vals.csv
 * Note: This contains actual GDP values in current US$
 * We calculate growth rates from the values
 */
async function loadGDPGrowthData() {
  try {
    const data = await d3.csv(getDataPath('gdp_vals.csv'))
    
    if (data.length === 0) {
      throw new Error('No GDP data loaded from CSV')
    }
    
    // Regional aggregate codes to filter out
    const regionalCodes = new Set([
      'ARB', 'CSS', 'CEB', 'EAR', 'EAS', 'EAP', 'TEA', 'EMU', 'ECS', 'ECA', 'TEC',
      'EUU', 'FCS', 'HPC', 'HIC', 'IBD', 'IBT', 'IDB', 'IDX', 'IDA', 'LTE', 'LCN',
      'LAC', 'TLA', 'LDC', 'LMY', 'LIC', 'LMC', 'MEA', 'MNA', 'TMN', 'MIC', 'NAC',
      'OED', 'OSS', 'PSS', 'PST', 'PRE', 'SST', 'SAS', 'TSA', 'SSF', 'SSA', 'TSS',
      'UMC', 'WLD', 'AFE', 'AFW'
    ])
    
    // Transform to our format
    const gdpGrowthData = []
    const countryDataMap = new Map()
    
    data.forEach(row => {
      const countryName = row['Country Name']
      const countryCode = row['Country Code']
      
      // Skip regional aggregates
      if (regionalCodes.has(countryCode)) return
      
      // Get year columns (starting from column index 4)
      const headers = Object.keys(row)
      const yearColumns = headers.slice(4).filter(h => !isNaN(parseInt(h)))
      
      if (!countryDataMap.has(countryCode)) {
        countryDataMap.set(countryCode, {
          countryName,
          countryCode,
          yearlyData: []
        })
      }
      
      const countryData = countryDataMap.get(countryCode)
      
      // Parse GDP values for each year
      yearColumns.forEach(yearStr => {
        const year = parseInt(yearStr)
        const gdpValue = parseFloat(row[yearStr])
        
        if (!isNaN(gdpValue) && gdpValue > 0) {
          countryData.yearlyData.push({ year, gdpValue })
        }
      })
    })
    
    // Calculate growth rates from GDP values
    countryDataMap.forEach(countryData => {
      // Sort by year
      countryData.yearlyData.sort((a, b) => a.year - b.year)
      
      // Calculate growth rates
      for (let i = 1; i < countryData.yearlyData.length; i++) {
        const current = countryData.yearlyData[i]
        const previous = countryData.yearlyData[i - 1]
        
        if (previous.gdpValue > 0) {
          const growth = ((current.gdpValue - previous.gdpValue) / previous.gdpValue) * 100
          
          gdpGrowthData.push({
            countryName: countryData.countryName,
            countryCode: countryData.countryCode,
            year: current.year,
            growth: growth,
            gdpValue: current.gdpValue
          })
        }
      }
    })
    
    return gdpGrowthData
  } catch (error) {
    console.error('Error loading GDP data:', error)
    throw new Error('Failed to load GDP growth data')
  }
}

/**
 * Load GDP data (actual absolute values from World Bank)
 * Uses gdp_vals.csv which contains GDP in current US$
 */
async function loadGDPAbsoluteData() {
  try {
    // Load actual GDP values from World Bank data
    const data = await d3.csv(getDataPath('gdp_vals.csv'))
    
    if (data.length === 0) {
      throw new Error('No GDP data loaded from CSV')
    }
    
    // Transform to our format
    const gdpData = []
    const headers = Object.keys(data[0])
    // Filter for year columns (1960-2024)
    const years = headers.filter(h => !isNaN(parseInt(h)) && parseInt(h) >= 2005 && parseInt(h) <= 2023)
    
    data.forEach(row => {
      const countryName = row['Country Name']
      const countryCode = row['Country Code']
      
      if (!countryName || !countryCode) return
      
      years.forEach(year => {
        const rawValue = row[year]
        if (!rawValue || rawValue === '') return
        
        // Parse value (handles scientific notation like 1.09E+11)
        const value = parseFloat(rawValue)
        
        if (!isNaN(value) && value > 0) {
          // Convert GDP from actual USD to millions USD for consistent units with expense data
          // GDP values are in actual USD (e.g., 2.60E+13)
          // Divide by 1,000,000 to get millions USD
          gdpData.push({
            countryName,
            countryCode,
            year: parseInt(year),
            value: value / 1_000_000 // Convert to millions USD
          })
        }
      })
    })
    
    console.log(`Loaded ${gdpData.length} GDP data points from gdp_vals.csv`)
    
    // Log sample data for verification
    const sampleUSA = gdpData.find(d => d.countryName === 'United States' && d.year === 2022)
    if (sampleUSA) {
      console.log('Sample GDP data (USA 2022):', {
        valueInMillions: sampleUSA.value,
        formatted: `$${(sampleUSA.value / 1_000_000).toFixed(2)}T USD`
      })
    }
    
    return gdpData
  } catch (error) {
    console.error('Failed to load GDP data:', error)
    throw new Error('Failed to load GDP data')
  }
}

/**
 * Load total government expense data from expense_clean_usd.csv
 * Uses USD-converted values for proper comparison with GDP data
 * Calculates total by summing all expense categories per country-year
 */
async function loadTotalExpenseData() {
  try {
    const data = await d3.csv(getDataPath('expense_clean_usd.csv'))
    
    console.log(`📊 Loading expense data from expense_clean_usd.csv (${data.length} rows)`)
    
    // Filter for "Expense" category only (which is the total)
    // Don't sum all categories as that would double-count
    const expenseData = []
    
    data.forEach(row => {
      const countryName = row['Country Name']
      const year = parseInt(row['Year'])
      const valueUSD = parseFloat(row['Value_USD']) // Use USD-converted value
      const category = row['Expense Category']
      
      // Only use the "Expense" category which represents total government spending
      if (category !== 'Expense') return
      
      if (!countryName || isNaN(year) || isNaN(valueUSD)) return
      
      // Value_USD is in millions USD - keep as millions for consistent units with GDP
      expenseData.push({
        countryName,
        year,
        value: valueUSD // In millions USD, same unit as GDP
      })
    })
    
    console.log(`✅ Calculated total expenses for ${expenseData.length} country-year combinations`)
    console.log(`Sample data (first 3):`, expenseData.slice(0, 3))
    
    // Log sample for verification
    const sampleUSA = expenseData.find(d => d.countryName === 'United States' && d.year === 2022)
    if (sampleUSA) {
      console.log('Sample expense data (USA 2022):', {
        value: sampleUSA.value,
        formatted: `$${(sampleUSA.value / 1e12).toFixed(2)}T`
      })
    }
    
    return expenseData
  } catch (error) {
    console.error('Failed to load expense data:', error)
    throw new Error('Failed to load expense data from expense_clean_usd.csv')
  }
}

/**
 * Calculate world average for a given year
 */
function calculateWorldAverage(data, year) {
  const yearData = data.filter(d => d.year === year)
  if (yearData.length === 0) return null
  
  const sum = yearData.reduce((acc, d) => acc + d.value, 0)
  return sum / yearData.length
}

/**
 * Get data for a specific country or world average
 */
export function getCountryData(allData, countryName, years) {
  if (countryName === 'WORLD') {
    // Calculate world average for each year
    const result = years.map(year => {
      const avg = calculateWorldAverage(allData, year)
      return avg ? { year, value: avg } : null
    }).filter(d => d !== null)
    
    console.log(`getCountryData for WORLD: ${result.length} data points`)
    return result
  } else {
    // Get specific country data
    const countryData = allData.filter(d => d.countryName === countryName)
    console.log(`getCountryData for ${countryName}: found ${countryData.length} raw data points`)
    
    const result = countryData
      .map(d => ({ year: d.year, value: d.value }))
      .sort((a, b) => a.year - b.year)
    
    console.log(`getCountryData for ${countryName}: returning ${result.length} formatted data points`)
    if (result.length > 0) {
      console.log(`  First point:`, result[0])
      console.log(`  Last point:`, result[result.length - 1])
    }
    
    return result
  }
}

/**
 * Get list of available countries
 */
export function getAvailableCountries(data) {
  const countries = new Map()
  
  data.forEach(d => {
    if (d.countryName && !countries.has(d.countryName)) {
      countries.set(d.countryName, {
        name: d.countryName,
        code: d.countryCode
      })
    }
  })
  
  return Array.from(countries.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  )
}

/**
 * Get all available years
 */
export function getAvailableYears(data) {
  const years = new Set()
  data.forEach(d => years.add(d.year))
  return Array.from(years).sort((a, b) => a - b)
}

/**
 * Load all GDP and Expense data
 */
export async function loadGdpExpenseData() {
  try {
    const [gdpData, expenseData, gdpGrowthData] = await Promise.all([
      loadGDPAbsoluteData(),
      loadTotalExpenseData(),
      loadGDPGrowthData()
    ])
    
    // Get available countries from GDP data (more complete than expense data)
    // This ensures we include all countries like United States
    const countries = getAvailableCountries(gdpGrowthData)
    const years = getAvailableYears(expenseData)
    
    console.log(`Loaded ${countries.length} countries from GDP data`)
    console.log('Sample countries:', countries.slice(0, 10).map(c => c.name))
    
    return {
      gdpData,
      expenseData,
      gdpGrowthData,
      countries,
      years
    }
  } catch (error) {
    throw error
  }
}

/**
 * Detect anomalies in government expense patterns
 * Anomalies include:
 * - Unusually high expense-to-GDP ratios (>40%)
 * - Sudden spikes in spending (>50% year-over-year increase)
 * - Unusually low ratios (<15%)
 * 
 * @param {Array} gdpData - Array of GDP data points
 * @param {Array} expenseData - Array of expense data points
 * @returns {Array} Array of anomalies with country, year, type, value, severity
 */
export function detectAnomalies(gdpData, expenseData) {
  const anomalies = []
  
  // Create a map for quick GDP lookup
  const gdpMap = new Map()
  gdpData.forEach(d => {
    const key = `${d.countryName}-${d.year}`
    gdpMap.set(key, d.value)
  })
  
  // Group expense data by country for year-over-year comparison
  const countryExpenseMap = new Map()
  expenseData.forEach(d => {
    if (!countryExpenseMap.has(d.countryName)) {
      countryExpenseMap.set(d.countryName, [])
    }
    countryExpenseMap.get(d.countryName).push(d)
  })
  
  // Check each country's expense patterns
  countryExpenseMap.forEach((countryData, countryName) => {
    // Sort by year
    const sortedData = countryData.sort((a, b) => a.year - b.year)
    
    sortedData.forEach((expensePoint, idx) => {
      const key = `${expensePoint.countryName}-${expensePoint.year}`
      const gdpValue = gdpMap.get(key)
      
      if (gdpValue && gdpValue > 0) {
        const ratio = (expensePoint.value / gdpValue) * 100
        
        // Anomaly 1: Unusually high expense-to-GDP ratio (>40%)
        if (ratio > 40) {
          let severity = 'low'
          let type = 'High Spending Ratio'
          if (ratio > 50) {
            severity = 'high'
            type = 'Very High Spending'
          } else if (ratio > 45) {
            severity = 'medium'
            type = 'High Spending'
          }
          
          anomalies.push({
            country: expensePoint.countryName,
            year: expensePoint.year,
            type: type,
            value: expensePoint.value,
            ratio: ratio,
            severity: severity
          })
        }
        
        // Anomaly 2: Unusually low expense-to-GDP ratio (<15%)
        if (ratio < 15) {
          anomalies.push({
            country: expensePoint.countryName,
            year: expensePoint.year,
            type: 'Low Spending Ratio',
            value: expensePoint.value,
            ratio: ratio,
            severity: 'low'
          })
        }
      }
      
      // Anomaly 3: Sudden spike in spending (year-over-year)
      if (idx > 0) {
        const prevExpense = sortedData[idx - 1].value
        const change = ((expensePoint.value - prevExpense) / prevExpense) * 100
        
        if (change > 50) {
          let severity = 'medium'
          let type = 'Spending Spike'
          if (change > 100) {
            severity = 'high'
            type = 'Major Spending Spike'
          }
          
          anomalies.push({
            country: expensePoint.countryName,
            year: expensePoint.year,
            type: type,
            value: expensePoint.value,
            change: change,
            severity: severity
          })
        }
        
        // Anomaly 4: Sudden drop in spending
        if (change < -40) {
          anomalies.push({
            country: expensePoint.countryName,
            year: expensePoint.year,
            type: 'Spending Drop',
            value: expensePoint.value,
            change: change,
            severity: 'medium'
          })
        }
      }
    })
  })
  
  // Sort by severity and year (most recent first)
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
    if (severityDiff !== 0) return severityDiff
    return b.year - a.year
  })
}

/**
 * Calculate expense-to-GDP ratios for all country-year combinations
 * @param {Array} gdpData - Array of GDP data points
 * @param {Array} expenseData - Array of expense data points
 * @returns {Map} Map of country-year to ratio
 */
export function calculateExpenseToGdpRatios(gdpData, expenseData) {
  const ratios = new Map()
  
  // Create a map for quick GDP lookup
  const gdpMap = new Map()
  gdpData.forEach(d => {
    const key = `${d.countryName}-${d.year}`
    gdpMap.set(key, d.value)
  })
  
  // Calculate ratio for each expense data point
  expenseData.forEach(expensePoint => {
    const key = `${expensePoint.countryName}-${expensePoint.year}`
    const gdpValue = gdpMap.get(key)
    
    if (gdpValue && gdpValue > 0) {
      const ratio = (expensePoint.value / gdpValue) * 100
      ratios.set(key, ratio)
    }
  })
  
  return ratios
}

/**
 * Get top government spenders by total expense
 * @param {Array} expenseData - Array of expense data points
 * @param {Array} gdpData - Array of GDP data points (optional, for ratio calculation)
 * @param {number} limit - Number of top spenders to return
 * @returns {Array} Array of top spenders with country, totalExpense, avgRatio, years
 */
export function getTopSpenders(expenseData, gdpData = null, limit = 5) {
  // Aggregate by country
  const countryMap = new Map()
  
  expenseData.forEach(d => {
    if (!countryMap.has(d.countryName)) {
      countryMap.set(d.countryName, {
        country: d.countryName,
        totalExpense: 0,
        years: [],
        expenseValues: [],
        gdpValues: []
      })
    }
    
    const countryData = countryMap.get(d.countryName)
    countryData.totalExpense += d.value
    countryData.years.push(d.year)
    countryData.expenseValues.push(d.value)
  })
  
  // Calculate average ratios if GDP data is provided
  if (gdpData) {
    const gdpMap = new Map()
    gdpData.forEach(d => {
      const key = `${d.countryName}-${d.year}`
      gdpMap.set(key, d.value)
    })
    
    countryMap.forEach((countryData, countryName) => {
      const ratios = []
      countryData.years.forEach((year, idx) => {
        const key = `${countryName}-${year}`
        const gdpValue = gdpMap.get(key)
        if (gdpValue && gdpValue > 0) {
          const ratio = (countryData.expenseValues[idx] / gdpValue) * 100
          ratios.push(ratio)
        }
      })
      
      countryData.avgRatio = ratios.length > 0 
        ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length 
        : 0
    })
  }
  
  // Sort by total expense and return top N
  const topSpenders = Array.from(countryMap.values())
    .sort((a, b) => b.totalExpense - a.totalExpense)
    .slice(0, limit)
    .map(d => ({
      country: d.country,
      totalExpense: d.totalExpense,
      avgRatio: d.avgRatio || 0,
      years: [...new Set(d.years)].sort()
    }))
  
  return topSpenders
}

/**
 * Calculate statistical summary for a dataset
 * @param {Array} data - Array of numeric values or objects with 'value' property
 * @returns {Object} Statistical summary with mean, median, stdDev, min, max
 */
export function calculateStatistics(data) {
  if (!data || data.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 }
  }
  
  // Extract values
  const values = data.map(d => typeof d === 'number' ? d : d.value).filter(v => !isNaN(v))
  
  if (values.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 }
  }
  
  // Sort for median calculation
  const sorted = [...values].sort((a, b) => a - b)
  
  // Mean
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  
  // Median
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid]
  
  // Standard deviation
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  // Min and Max
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  
  return { mean, median, stdDev, min, max }
}

/**
 * Analyze global trends in the data
 * @param {Array} data - Array of data points with year and value
 * @returns {string} Trend description
 */
export function analyzeGlobalTrends(data) {
  if (!data || data.length === 0) {
    return 'Insufficient data for trend analysis'
  }
  
  // Group by year and calculate averages
  const yearMap = new Map()
  data.forEach(d => {
    if (!yearMap.has(d.year)) {
      yearMap.set(d.year, { sum: 0, count: 0 })
    }
    const yearData = yearMap.get(d.year)
    yearData.sum += d.value
    yearData.count += 1
  })
  
  // Calculate year averages
  const yearAverages = Array.from(yearMap.entries())
    .map(([year, data]) => ({
      year,
      average: data.sum / data.count
    }))
    .sort((a, b) => a.year - b.year)
  
  if (yearAverages.length < 2) {
    return 'Insufficient years for trend analysis'
  }
  
  // Calculate year-over-year changes
  const changes = []
  for (let i = 1; i < yearAverages.length; i++) {
    const change = ((yearAverages[i].average - yearAverages[i - 1].average) / yearAverages[i - 1].average) * 100
    changes.push(change)
  }
  
  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length
  
  // Determine trend
  if (avgChange > 5) {
    return `Strong upward trend (avg ${avgChange.toFixed(1)}% increase per year)`
  } else if (avgChange > 2) {
    return `Moderate upward trend (avg ${avgChange.toFixed(1)}% increase per year)`
  } else if (avgChange > -2) {
    return `Stable trend (avg ${Math.abs(avgChange).toFixed(1)}% change per year)`
  } else if (avgChange > -5) {
    return `Moderate downward trend (avg ${Math.abs(avgChange).toFixed(1)}% decrease per year)`
  } else {
    return `Strong downward trend (avg ${Math.abs(avgChange).toFixed(1)}% decrease per year)`
  }
}

/**
 * Load sector breakdown data for a specific country and year
 * @param {string} countryName - Name of the country
 * @param {number} year - Year to load data for
 * @returns {Promise<Array>} Array of sector objects with name, value, percentage, color, icon, yearOverYearChange
 */
export async function loadSectorBreakdown(countryName, year) {
  try {
    // Load all sector CSV files
    const sectorDataPromises = SECTOR_FILES.map(async (filename) => {
      try {
        const data = await d3.csv(getDataPath(filename))
        
        // Extract sector key from filename (e.g., 'social_benefits_matrix.csv' -> 'social_benefits')
        const sectorKey = filename.replace('_matrix.csv', '').replace('_expense', '')
        const metadata = SECTOR_METADATA[sectorKey]
        
        if (!metadata) {
          console.warn(`No metadata found for sector: ${sectorKey}`)
          return null
        }
        
        // Find the country row
        const countryRow = data.find(row => {
          const rowCountry = row['Country'] || row['Country Name']
          return rowCountry === countryName
        })
        
        if (!countryRow) {
          return null
        }
        
        // Get value for the specified year
        const yearStr = year.toString()
        const value = parseFloat(countryRow[yearStr])
        
        if (isNaN(value) || value <= 0) {
          return null
        }
        
        // Get previous year value for YoY calculation
        const prevYearStr = (year - 1).toString()
        const prevValue = parseFloat(countryRow[prevYearStr])
        let yearOverYearChange = null
        
        if (!isNaN(prevValue) && prevValue > 0) {
          yearOverYearChange = ((value - prevValue) / prevValue) * 100
        }
        
        return {
          key: sectorKey,
          name: metadata.name,
          value: value,
          color: metadata.color,
          icon: metadata.icon,
          description: metadata.description,
          yearOverYearChange: yearOverYearChange
        }
      } catch (error) {
        console.warn(`Failed to load sector file ${filename}:`, error.message)
        return null
      }
    })
    
    // Wait for all sector data to load
    const sectorResults = await Promise.all(sectorDataPromises)
    
    // Filter out null results (missing data)
    const validSectors = sectorResults.filter(sector => sector !== null)
    
    if (validSectors.length === 0) {
      console.warn(`No sector data available for ${countryName} in ${year}`)
      return []
    }
    
    // Calculate total expense across all sectors
    const totalExpense = validSectors.reduce((sum, sector) => sum + sector.value, 0)
    
    // Calculate percentage for each sector
    const sectorsWithPercentage = validSectors.map(sector => ({
      ...sector,
      percentage: (sector.value / totalExpense) * 100
    }))
    
    // Sort by value (descending)
    const sortedSectors = sectorsWithPercentage.sort((a, b) => b.value - a.value)
    
    return sortedSectors
  } catch (error) {
    console.error(`Error loading sector breakdown for ${countryName} (${year}):`, error)
    return []
  }
}

export default {
  loadGdpExpenseData,
  getCountryData,
  getAvailableCountries,
  getAvailableYears,
  detectAnomalies,
  calculateExpenseToGdpRatios,
  getTopSpenders,
  calculateStatistics,
  analyzeGlobalTrends,
  loadSectorBreakdown
}
