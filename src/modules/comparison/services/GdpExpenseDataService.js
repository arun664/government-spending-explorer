/**
 * GdpExpenseDataService - Load and process GDP and Government Expense data
 * 
 * Features:
 * - Load GDP data from gdp_clean.csv
 * - Load total government expense from total_government_expense_matrix.csv
 * - Calculate world averages
 * - Format data for chart visualization
 */

import * as d3 from 'd3'
import { getDataPath } from '../../../utils/pathUtils.js'

/**
 * Load GDP Growth data from gdp_clean.csv
 * Note: This contains growth rates, not absolute values
 * We'll use this for trend analysis and anomaly detection
 */
async function loadGDPGrowthData() {
  try {
    const data = await d3.csv(getDataPath('gdp_clean.csv'))
    
    if (data.length === 0) {
      throw new Error('No GDP data loaded from CSV')
    }
    
    // Transform to our format
    const gdpGrowthData = []
    
    data.forEach(row => {
      const countryName = row['Country Name']
      const countryCode = row['Country Code']
      const year = parseInt(row['Year'])
      const growth = parseFloat(row['GDP Growth'])
      
      if (countryName && !isNaN(year) && !isNaN(growth)) {
        gdpGrowthData.push({
          countryName,
          countryCode,
          year,
          growth
        })
      }
    })
    
    return gdpGrowthData
  } catch (error) {
    throw new Error('Failed to load GDP growth data')
  }
}

/**
 * Load GDP data (approximate absolute values from expense data)
 * Since we don't have actual GDP absolute values, we approximate:
 * GDP ≈ Government Expense / 0.30 (assuming ~30% expense-to-GDP ratio)
 */
async function loadGDPAbsoluteData() {
  try {
    // Load the total government expense matrix which has absolute values
    const data = await d3.csv(getDataPath('total_government_expense_matrix.csv'))
    
    if (data.length === 0) {
      throw new Error('No data loaded from CSV')
    }
    
    // Transform to our format
    const gdpData = []
    const headers = Object.keys(data[0])
    const years = headers.filter(h => !isNaN(parseInt(h)))
    
    data.forEach(row => {
      const countryName = row['Country'] || row['Country Name']
      const countryCode = row['Country Code'] || countryName?.substring(0, 3).toUpperCase()
      
      years.forEach(year => {
        const value = parseFloat(row[year])
        if (!isNaN(value) && value > 0) {
          // Approximate GDP based on typical expense-to-GDP ratios
          // Using 30% as baseline (expense = 30% of GDP, so GDP = expense / 0.30)
          gdpData.push({
            countryName,
            countryCode,
            year: parseInt(year),
            value: value / 0.30 // Approximate GDP from expense
          })
        }
      })
    })
    
    return gdpData
  } catch (error) {
    throw new Error('Failed to load GDP data')
  }
}

/**
 * Load total government expense data
 */
async function loadTotalExpenseData() {
  try {
    const data = await d3.csv(getDataPath('total_government_expense_matrix.csv'))
    
    const expenseData = []
    const headers = Object.keys(data[0])
    const years = headers.filter(h => !isNaN(parseInt(h)))
    
    data.forEach((row) => {
      const countryName = row['Country'] || row['Country Name']
      const countryCode = row['Country Code'] || countryName?.substring(0, 3).toUpperCase()
      
      years.forEach(year => {
        const value = parseFloat(row[year])
        if (!isNaN(value) && value > 0) {
          expenseData.push({
            countryName,
            countryCode,
            year: parseInt(year),
            value
          })
        }
      })
    })
    
    return expenseData
  } catch (error) {
    throw new Error('Failed to load expense data')
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
    return years.map(year => {
      const avg = calculateWorldAverage(allData, year)
      return avg ? { year, value: avg } : null
    }).filter(d => d !== null)
  } else {
    // Get specific country data
    return allData
      .filter(d => d.countryName === countryName)
      .map(d => ({ year: d.year, value: d.value }))
      .sort((a, b) => a.year - b.year)
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
    
    // Get available countries and years
    const countries = getAvailableCountries(expenseData)
    const years = getAvailableYears(expenseData)
    
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

export default {
  loadGdpExpenseData,
  getCountryData,
  getAvailableCountries,
  getAvailableYears,
  detectAnomalies,
  calculateExpenseToGdpRatios,
  getTopSpenders,
  calculateStatistics,
  analyzeGlobalTrends
}
