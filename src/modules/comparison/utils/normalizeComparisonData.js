/**
 * normalizeComparisonData.js - Data normalization for GDP vs Spending comparison
 * 
 * Normalizes GDP and Spending data to millions USD for consistent comparison
 * - GDP: Converts from actual USD to millions USD (divide by 1,000,000)
 * - Spending: Already in millions USD from expense_clean_usd.csv
 */

import * as d3 from 'd3'
import { getDataPath } from '../../../utils/pathUtils.js'

/**
 * Load and normalize GDP data from gdp_vals.csv
 * OPTIMIZED: Filters during parsing to reduce memory usage
 * @param {Array} yearRange - [minYear, maxYear] to filter (default [2005, 2023])
 * @param {Array} countries - Optional array of country names to filter
 * @returns {Promise<Array>} Array of {country, year, gdp} in millions USD
 */
async function loadNormalizedGDPData(yearRange = [2005, 2023], countries = []) {
  try {
    console.time('⏱️ GDP data loading')
    const data = await d3.csv(getDataPath('gdp_vals.csv'))
    console.timeEnd('⏱️ GDP data loading')
    
    if (data.length === 0) {
      throw new Error('No GDP data loaded from CSV')
    }
    
    console.time('⏱️ GDP data processing')
    const gdpData = []
    const headers = Object.keys(data[0])
    const [minYear, maxYear] = yearRange
    
    // Filter for year columns within range (optimization: filter years early)
    const years = headers.filter(h => {
      const year = parseInt(h)
      return !isNaN(year) && year >= minYear && year <= maxYear
    })
    
    console.log(`📊 GDP Processing: ${data.length} countries for ${years.length} years...`)
    
    // Log first row for debugging
    if (data.length > 0) {
      const firstRow = data[0]
      console.log('📋 GDP CSV First Row Sample:', {
        country: firstRow['Country Name'],
        year2022: firstRow['2022'],
        parsed: parseFloat(firstRow['2022'])
      })
    }
    
    // Regional aggregate codes to skip
    const regionalCodes = new Set([
      'ARB', 'CSS', 'CEB', 'EAR', 'EAS', 'EAP', 'TEA', 'EMU', 'ECS', 'ECA', 'TEC',
      'EUU', 'FCS', 'HPC', 'HIC', 'IBD', 'IBT', 'IDB', 'IDX', 'IDA', 'LTE', 'LCN',
      'LAC', 'TLA', 'LDC', 'LMY', 'LIC', 'LMC', 'MEA', 'MNA', 'TMN', 'MIC', 'NAC',
      'OED', 'OSS', 'PSS', 'PST', 'PRE', 'SST', 'SAS', 'TSA', 'SSF', 'SSA', 'TSS',
      'UMC', 'WLD', 'AFE', 'AFW'
    ])
    
    data.forEach(row => {
      const countryName = row['Country Name']
      const countryCode = row['Country Code']
      
      // Skip if no country info or regional aggregate
      if (!countryName || !countryCode || regionalCodes.has(countryCode)) return
      
      // Apply country filter if specified (optimization: skip early)
      if (countries.length > 0 && !countries.includes(countryName)) return
      
      years.forEach(year => {
        const rawValue = row[year]
        if (!rawValue || rawValue === '') return
        
        // Parse value (handles scientific notation like 2.60E+13)
        const value = parseFloat(rawValue)
        
        if (!isNaN(value) && value > 0) {
          // CRITICAL: Convert GDP from actual USD to millions USD
          // Example: 26,000,000,000,000 USD → 26,000,000 millions USD
          const normalizedGDP = value / 1_000_000
          
          gdpData.push({
            country: countryName,
            countryCode: countryCode,
            year: parseInt(year),
            gdp: normalizedGDP // Convert to millions USD
          })
          
          // Log USA 2022 for verification
          if (countryName === 'United States' && parseInt(year) === 2022) {
            console.log('🔍 GDP Normalization (USA 2022):', {
              rawValue: value,
              rawFormatted: value.toExponential(2),
              normalizedToMillions: normalizedGDP,
              normalizedFormatted: `${(normalizedGDP / 1_000_000).toFixed(2)}T`
            })
          }
        }
      })
    })
    
    console.timeEnd('⏱️ GDP data processing')
    console.log(`✅ Loaded ${gdpData.length} GDP data points (normalized to millions USD)`)
    
    return gdpData
  } catch (error) {
    console.error('Failed to load GDP data:', error)
    throw new Error('Failed to load GDP data')
  }
}

/**
 * Load and normalize Spending data from expense_clean_usd.csv
 * OPTIMIZED: Filters during parsing to reduce memory usage
 * @param {Array} yearRange - [minYear, maxYear] to filter (default [2005, 2023])
 * @param {Array} countries - Optional array of country names to filter
 * @returns {Promise<Array>} Array of {country, year, spending} in millions USD
 */
async function loadNormalizedSpendingData(yearRange = [2005, 2023], countries = []) {
  try {
    console.time('⏱️ Spending data loading')
    const data = await d3.csv(getDataPath('expense_clean_usd.csv'))
    console.timeEnd('⏱️ Spending data loading')
    
    console.log(`📊 Spending Processing: ${data.length} rows from expense_clean_usd.csv`)
    console.time('⏱️ Spending data processing')
    
    // Log first row for debugging
    if (data.length > 0) {
      const firstExpenseRow = data.find(row => row['Expense Category'] === 'Expense')
      if (firstExpenseRow) {
        console.log('📋 Spending CSV First Row Sample:', {
          country: firstExpenseRow['Country Name'],
          year: firstExpenseRow['Year'],
          valueUSD: firstExpenseRow['Value_USD'],
          parsed: parseFloat(firstExpenseRow['Value_USD']),
          category: firstExpenseRow['Expense Category']
        })
      }
    }
    
    const spendingData = []
    const [minYear, maxYear] = yearRange
    
    data.forEach(row => {
      const countryName = row['Country Name']
      const year = parseInt(row['Year'])
      const valueUSD = parseFloat(row['Value_USD'])
      const category = row['Expense Category']
      
      // Only use the "Expense" category which represents total government spending
      if (category !== 'Expense') return
      
      if (!countryName || isNaN(year) || isNaN(valueUSD)) return
      
      // Apply year filter (optimization: filter early)
      if (year < minYear || year > maxYear) return
      
      // Apply country filter if specified (optimization: skip early)
      if (countries.length > 0 && !countries.includes(countryName)) return
      
      // CRITICAL FIX: The CSV Value_USD is in actual USD, NOT millions
      // Must convert to millions USD to match GDP units
      // Example: 5,135,523,000,000 USD → 5,135,523 millions USD (divide by 1M)
      const spendingInMillions = valueUSD / 1_000_000 // CONVERT TO MILLIONS
      
      spendingData.push({
        country: countryName,
        year,
        spending: spendingInMillions // Convert to millions USD
      })
      
      // Log USA 2022 for verification
      if (countryName === 'United States' && year === 2022) {
        console.log('🔍 Spending Normalization (USA 2022):', {
          rawValue: valueUSD,
          rawFormatted: valueUSD.toExponential(2),
          normalizedToMillions: spendingInMillions,
          unit: 'millions USD (divided by 1M)',
          formatted: `${(spendingInMillions / 1_000_000).toFixed(2)}T`
        })
      }
    })
    
    console.timeEnd('⏱️ Spending data processing')
    console.log(`✅ Loaded ${spendingData.length} spending data points (already in millions USD)`)
    
    return spendingData
  } catch (error) {
    console.error('Failed to load spending data:', error)
    throw new Error('Failed to load spending data')
  }
}

/**
 * Normalize and merge GDP and Spending data
 * OPTIMIZED: Passes filters to loaders for early filtering
 * @param {Array} countries - Optional array of country names to filter
 * @param {Array} yearRange - Optional [minYear, maxYear] to filter
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Normalized dataset with metadata
 */
export async function normalizeComparisonData(countries = [], yearRange = [2005, 2023], onProgress = null) {
  try {
    console.log('📥 Loading GDP and Spending data with filters:', { 
      countries: countries.length > 0 ? `${countries.length} countries` : 'all countries',
      yearRange 
    })
    console.time('⏱️ Total data normalization')
    
    if (onProgress) onProgress({ stage: 'loading', message: 'Loading GDP and Spending data...', percent: 0 })
    
    // Pass filters to loaders for early filtering (optimization)
    const [gdpData, spendingData] = await Promise.all([
      loadNormalizedGDPData(yearRange, countries),
      loadNormalizedSpendingData(yearRange, countries)
    ])
    
    if (onProgress) onProgress({ stage: 'merging', message: 'Merging datasets...', percent: 50 })
    console.log('📥 Data loaded, starting merge...')
    console.time('⏱️ Data merging')
    
    // Create maps for quick lookup
    const gdpMap = new Map()
    gdpData.forEach(d => {
      const key = `${d.country}-${d.year}`
      gdpMap.set(key, d.gdp)
    })
    
    const spendingMap = new Map()
    spendingData.forEach(d => {
      const key = `${d.country}-${d.year}`
      spendingMap.set(key, d.spending)
    })
    
    // Merge data and calculate ratios with filtering
    const mergedData = []
    const countriesSet = new Set()
    const yearsSet = new Set()
    
    const [minYear, maxYear] = yearRange
    
    // Iterate through GDP data and match with spending
    gdpData.forEach(gdpPoint => {
      // Apply year filter
      if (gdpPoint.year < minYear || gdpPoint.year > maxYear) return
      
      // Apply country filter if specified
      if (countries.length > 0 && !countries.includes(gdpPoint.country)) return
      
      const key = `${gdpPoint.country}-${gdpPoint.year}`
      const spending = spendingMap.get(key)
      
      if (spending !== undefined) {
        // Calculate spending-to-GDP ratio
        const ratio = gdpPoint.gdp > 0 ? (spending / gdpPoint.gdp) * 100 : 0
        
        const mergedPoint = {
          country: gdpPoint.country,
          countryCode: gdpPoint.countryCode,
          year: gdpPoint.year,
          gdp: gdpPoint.gdp,        // millions USD
          spending: spending,        // millions USD
          ratio: ratio               // spending as % of GDP
        }
        
        mergedData.push(mergedPoint)
        
        // Log USA 2022 merge for verification
        if (gdpPoint.country === 'United States' && gdpPoint.year === 2022) {
          console.log('🔍 Merged Data (USA 2022):', {
            gdp: `${gdpPoint.gdp.toFixed(0)} millions = ${(gdpPoint.gdp / 1_000_000).toFixed(2)}T`,
            spending: `${spending.toFixed(0)} millions = ${(spending / 1_000_000).toFixed(2)}T`,
            ratio: `${ratio.toFixed(2)}%`,
            calculation: `(${spending.toFixed(0)} / ${gdpPoint.gdp.toFixed(0)}) * 100 = ${ratio.toFixed(2)}%`
          })
        }
        
        countriesSet.add(gdpPoint.country)
        yearsSet.add(gdpPoint.year)
      }
    })
    
    // Calculate value ranges
    const gdpValues = mergedData.map(d => d.gdp)
    const spendingValues = mergedData.map(d => d.spending)
    
    const metadata = {
      yearRange: [Math.min(...yearsSet), Math.max(...yearsSet)],
      countries: Array.from(countriesSet).sort(),
      valueRanges: {
        gdp: gdpValues.length > 0 ? [Math.min(...gdpValues), Math.max(...gdpValues)] : [0, 0],
        spending: spendingValues.length > 0 ? [Math.min(...spendingValues), Math.max(...spendingValues)] : [0, 0]
      },
      dataPoints: mergedData.length
    }
    
    console.timeEnd('⏱️ Data merging')
    
    if (onProgress) onProgress({ stage: 'validating', message: 'Validating data...', percent: 90 })
    
    // Validate data consistency
    validateData(mergedData)
    
    console.timeEnd('⏱️ Total data normalization')
    console.log('📊 Data normalization complete:', {
      dataPoints: mergedData.length,
      countries: metadata.countries.length,
      yearRange: metadata.yearRange,
      gdpRange: `${(metadata.valueRanges.gdp[0] / 1_000_000).toFixed(2)}T - ${(metadata.valueRanges.gdp[1] / 1_000_000).toFixed(2)}T`,
      spendingRange: `${(metadata.valueRanges.spending[0] / 1_000_000).toFixed(2)}T - ${(metadata.valueRanges.spending[1] / 1_000_000).toFixed(2)}T`
    })
    
    // Log sample data point for verification
    if (mergedData.length > 0) {
      const sampleUSA = mergedData.find(d => d.country === 'United States' && d.year === 2022)
      if (sampleUSA) {
        console.log('📋 Sample data (USA 2022):', {
          gdp: `${(sampleUSA.gdp / 1_000_000).toFixed(2)}T (${sampleUSA.gdp.toFixed(0)} millions)`,
          spending: `${(sampleUSA.spending / 1_000_000).toFixed(2)}T (${sampleUSA.spending.toFixed(0)} millions)`,
          ratio: `${sampleUSA.ratio.toFixed(2)}%`
        })
      }
    }
    
    if (onProgress) onProgress({ stage: 'complete', message: 'Data loaded successfully!', percent: 100 })
    
    return {
      data: mergedData,
      metadata
    }
  } catch (error) {
    console.error('Error normalizing comparison data:', error)
    if (onProgress) onProgress({ stage: 'error', message: error.message, percent: 0 })
    throw error
  }
}

/**
 * Validate data consistency
 * @param {Array} data - Merged data array
 */
function validateData(data) {
  const warnings = []
  
  // Check for missing years
  const yearsByCountry = new Map()
  data.forEach(d => {
    if (!yearsByCountry.has(d.country)) {
      yearsByCountry.set(d.country, new Set())
    }
    yearsByCountry.get(d.country).add(d.year)
  })
  
  yearsByCountry.forEach((years, country) => {
    const yearArray = Array.from(years).sort()
    const expectedYears = yearArray[yearArray.length - 1] - yearArray[0] + 1
    if (years.size < expectedYears) {
      warnings.push(`${country}: Missing ${expectedYears - years.size} years of data`)
    }
  })
  
  if (warnings.length > 0) {
    console.warn('⚠️ Data validation warnings:', warnings.slice(0, 5))
  }
}

/**
 * Get data for specific countries
 * @param {Array} data - Normalized data array
 * @param {Array} countries - Array of country names
 * @returns {Array} Filtered data
 */
export function getCountriesData(data, countries) {
  return data.filter(d => countries.includes(d.country))
}

/**
 * Get data for a specific year
 * @param {Array} data - Normalized data array
 * @param {number} year - Year to filter
 * @returns {Array} Filtered data
 */
export function getYearData(data, year) {
  return data.filter(d => d.year === year)
}

export default {
  normalizeComparisonData,
  getCountriesData,
  getYearData
}
