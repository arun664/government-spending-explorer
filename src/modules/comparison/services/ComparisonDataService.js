/**
 * ComparisonDataService - Centralized data service for comparison page
 * 
 * Features:
 * - Integrates with UnifiedDataService for all 48 indicators
 * - Uses MapColorService for consistent country mapping
 * - Loads ALL countries without sampling
 * - Calculates metrics, identifies outliers, trends, and top performers
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.4, 6.1, 6.2, 6.3
 */

import { 
  loadUnifiedData, 
  getIndicatorData, 
  INDICATOR_METADATA,
  CATEGORY_COLORS 
} from '../../spending/services/UnifiedDataService.js'
import { MapColorService } from '../../../shared/services/MapColorService.js'
import { getCountryRegion } from '../../../utils/regionMapping.js'

class ComparisonDataService {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
    this.memoizedMetrics = new Map()
    this.memoizedTrends = new Map()
    this.memoizedOutliers = new Map()
  }

  /**
   * Load indicator data for all countries
   * @param {string} indicatorCode - Indicator code (e.g., 'GE', 'GECE')
   * @param {Object} options - Options for data loading
   * @returns {Promise<Object>} Processed indicator data
   */
  async loadIndicatorData(indicatorCode, options = {}) {
    const cacheKey = `${indicatorCode}-${JSON.stringify(options)}`
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }
    }
    
    // Ensure unified data is loaded
    await loadUnifiedData()
    
    // Get indicator data (loads ALL countries, no sampling)
    const indicatorData = getIndicatorData(indicatorCode, options.yearRange)
    
    if (!indicatorData) {
      throw new Error(`Failed to load indicator: ${indicatorCode}`)
    }

    // Apply country name normalization
    const normalizedData = this.applyCountryMapping(indicatorData)
    
    // Apply filters if provided
    const filteredData = options.filters 
      ? this.applyFilters(normalizedData, options.filters)
      : normalizedData

    // Cache the result
    this.cache.set(cacheKey, {
      data: filteredData,
      timestamp: Date.now()
    })
    
    return filteredData
  }

  /**
   * Apply country name normalization using MapColorService
   * @param {Object} indicatorData - Raw indicator data
   * @returns {Object} Data with normalized country names
   */
  applyCountryMapping(indicatorData) {
    const normalizedCountries = {}
    
    Object.entries(indicatorData.countries).forEach(([countryName, countryData]) => {
      // Normalize country name
      const normalizedName = MapColorService.normalizeCountryName(countryName)
      
      normalizedCountries[normalizedName] = {
        ...countryData,
        name: normalizedName,
        originalName: countryName
      }
    })

    return {
      ...indicatorData,
      countries: normalizedCountries
    }
  }

  /**
   * Apply filters to data
   * @param {Object} data - Indicator data
   * @param {Object} filters - Filter criteria
   * @returns {Object} Filtered data
   */
  applyFilters(data, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return data
    }

    const filteredCountries = {}
    
    Object.entries(data.countries).forEach(([countryName, countryData]) => {
      let includeCountry = true

      // Region filter
      if (filters.regions && filters.regions.length > 0) {
        const region = getCountryRegion(countryData.code || countryName)
        if (!filters.regions.includes(region)) {
          includeCountry = false
        }
      }

      // Income level filter
      if (includeCountry && filters.incomeLevel && filters.incomeLevel.length > 0) {
        // TODO: Implement income level filtering when data is available
        // For now, we'll include all countries if income level filter is set
      }

      // Data availability filter
      if (includeCountry && filters.dataAvailability !== 'all') {
        const dataPointCount = Object.keys(countryData.data).length
        const totalYears = data.years.length
        
        if (filters.dataAvailability === 'complete') {
          const hasCompleteData = dataPointCount >= totalYears * 0.8
          if (!hasCompleteData) {
            includeCountry = false
          }
        } else if (filters.dataAvailability === 'partial') {
          const hasPartialData = dataPointCount > 0 && dataPointCount < totalYears * 0.8
          if (!hasPartialData) {
            includeCountry = false
          }
        }
      }

      if (includeCountry) {
        filteredCountries[countryName] = countryData
      }
    })

    return {
      ...data,
      countries: filteredCountries
    }
  }

  /**
   * Calculate metrics for current data selection (with memoization)
   * @param {Object} data - Indicator data
   * @param {string} chartType - Current chart type
   * @returns {Object} Calculated metrics
   */
  calculateMetrics(data, chartType = 'timeSeries') {
    if (!data || !data.countries) {
      return null
    }

    // Create cache key
    const cacheKey = `${JSON.stringify(Object.keys(data.countries))}-${chartType}`
    
    // Check memoized cache
    if (this.memoizedMetrics.has(cacheKey)) {
      const cached = this.memoizedMetrics.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }
    }

    const allValues = []
    const countryValues = []
    
    Object.entries(data.countries).forEach(([countryName, countryData]) => {
      const values = Object.values(countryData.data).filter(v => !isNaN(v))
      if (values.length > 0) {
        allValues.push(...values)
        const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
        countryValues.push({ country: countryName, value: avgValue, data: countryData })
      }
    })

    if (allValues.length === 0) {
      return null
    }

    // Sort values for percentile calculations
    const sortedValues = [...allValues].sort((a, b) => a - b)
    
    const result = {
      summary: {
        totalCountries: Object.keys(data.countries).length,
        totalDataPoints: allValues.length,
        yearRange: data.years.length > 0 ? [data.years[0], data.years[data.years.length - 1]] : null,
        dataCoverage: (allValues.length / (Object.keys(data.countries).length * data.years.length) * 100).toFixed(1)
      },
      statistical: {
        average: allValues.reduce((sum, v) => sum + v, 0) / allValues.length,
        median: this.percentile(sortedValues, 50),
        stdDev: this.calculateStdDev(allValues),
        min: { value: Math.min(...allValues), country: this.findCountryWithValue(countryValues, Math.min(...allValues)) },
        max: { value: Math.max(...allValues), country: this.findCountryWithValue(countryValues, Math.max(...allValues)) },
        range: Math.max(...allValues) - Math.min(...allValues)
      }
    }

    // Cache the result
    this.memoizedMetrics.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  }

  /**
   * Find country with specific value
   * @param {Array} countryValues - Array of country value objects
   * @param {number} targetValue - Value to find
   * @returns {string} Country name
   */
  findCountryWithValue(countryValues, targetValue) {
    const found = countryValues.find(cv => Math.abs(cv.value - targetValue) < 0.01)
    return found ? found.country : 'Unknown'
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Array of numbers
   * @returns {number} Standard deviation
   */
  calculateStdDev(values) {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    const squareDiffs = values.map(v => Math.pow(v - avg, 2))
    const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length
    return Math.sqrt(avgSquareDiff)
  }

  /**
   * Calculate percentile
   * @param {Array} sortedValues - Sorted array of values
   * @param {number} percentile - Percentile (0-100)
   * @returns {number} Percentile value
   */
  percentile(sortedValues, percentile) {
    const index = (percentile / 100) * (sortedValues.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index - lower
    
    if (lower === upper) {
      return sortedValues[lower]
    }
    
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
  }

  /**
   * Identify outliers using IQR method (with memoization)
   * @param {Object} data - Indicator data
   * @returns {Array} Array of outlier objects
   */
  identifyOutliers(data) {
    if (!data || !data.countries) {
      return []
    }

    // Create cache key
    const cacheKey = JSON.stringify(Object.keys(data.countries))
    
    // Check memoized cache
    if (this.memoizedOutliers.has(cacheKey)) {
      const cached = this.memoizedOutliers.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }
    }

    const countryValues = []
    
    Object.entries(data.countries).forEach(([countryName, countryData]) => {
      const values = Object.values(countryData.data).filter(v => !isNaN(v))
      if (values.length > 0) {
        const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
        countryValues.push({ country: countryName, value: avgValue, code: countryData.code })
      }
    })

    if (countryValues.length < 4) {
      return []
    }

    // Calculate IQR
    const sortedValues = countryValues.map(cv => cv.value).sort((a, b) => a - b)
    const q1 = this.percentile(sortedValues, 25)
    const q3 = this.percentile(sortedValues, 75)
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr

    // Find outliers
    const outliers = countryValues
      .filter(cv => cv.value < lowerBound || cv.value > upperBound)
      .map(cv => ({
        country: cv.country,
        code: cv.code,
        value: cv.value,
        reason: cv.value < lowerBound 
          ? 'Significantly below average' 
          : 'Significantly above average',
        deviation: cv.value < lowerBound 
          ? ((lowerBound - cv.value) / iqr).toFixed(1)
          : ((cv.value - upperBound) / iqr).toFixed(1)
      }))
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
      .slice(0, 5) // Top 5 outliers

    // Cache the result
    this.memoizedOutliers.set(cacheKey, {
      data: outliers,
      timestamp: Date.now()
    })

    return outliers
  }

  /**
   * Identify notable trends in time series data (with memoization)
   * @param {Object} data - Indicator data
   * @returns {Array} Array of trend objects
   */
  identifyTrends(data) {
    if (!data || !data.countries || data.years.length < 3) {
      return []
    }

    // Create cache key
    const cacheKey = `${JSON.stringify(Object.keys(data.countries))}-${data.years.join(',')}`
    
    // Check memoized cache
    if (this.memoizedTrends.has(cacheKey)) {
      const cached = this.memoizedTrends.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }
    }

    const trends = []

    Object.entries(data.countries).forEach(([countryName, countryData]) => {
      const yearValues = []
      
      // Get values in chronological order
      data.years.forEach(year => {
        if (countryData.data[year] !== undefined && !isNaN(countryData.data[year])) {
          yearValues.push({ year, value: countryData.data[year] })
        }
      })

      if (yearValues.length < 3) {
        return
      }

      // Calculate linear regression
      const trend = this.calculateTrend(yearValues)
      
      // Only include significant trends (|slope| > threshold)
      if (Math.abs(trend.slope) > 0.5 && trend.rSquared > 0.5) {
        trends.push({
          country: countryName,
          code: countryData.code,
          direction: trend.slope > 0 ? 'increasing' : 'decreasing',
          slope: trend.slope,
          rSquared: trend.rSquared,
          description: this.describeTrend(countryName, trend),
          icon: trend.slope > 0 ? '📈' : '📉'
        })
      }
    })

    // Sort by absolute slope and return top 5
    const result = trends
      .sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope))
      .slice(0, 5)

    // Cache the result
    this.memoizedTrends.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  }

  /**
   * Calculate linear regression trend
   * @param {Array} yearValues - Array of {year, value} objects
   * @returns {Object} Trend statistics
   */
  calculateTrend(yearValues) {
    const n = yearValues.length
    const sumX = yearValues.reduce((sum, yv) => sum + yv.year, 0)
    const sumY = yearValues.reduce((sum, yv) => sum + yv.value, 0)
    const sumXY = yearValues.reduce((sum, yv) => sum + yv.year * yv.value, 0)
    const sumX2 = yearValues.reduce((sum, yv) => sum + yv.year * yv.year, 0)
    const sumY2 = yearValues.reduce((sum, yv) => sum + yv.value * yv.value, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const yMean = sumY / n
    const ssTotal = yearValues.reduce((sum, yv) => sum + Math.pow(yv.value - yMean, 2), 0)
    const ssResidual = yearValues.reduce((sum, yv) => {
      const predicted = slope * yv.year + intercept
      return sum + Math.pow(yv.value - predicted, 2)
    }, 0)
    const rSquared = 1 - (ssResidual / ssTotal)

    return { slope, intercept, rSquared }
  }

  /**
   * Describe trend in human-readable format
   * @param {string} countryName - Country name
   * @param {Object} trend - Trend statistics
   * @returns {string} Trend description
   */
  describeTrend(countryName, trend) {
    const direction = trend.slope > 0 ? 'increasing' : 'decreasing'
    const strength = Math.abs(trend.slope) > 2 ? 'rapidly' : 'steadily'
    return `${countryName} ${strength} ${direction}`
  }

  /**
   * Get top performing countries
   * @param {Object} data - Indicator data
   * @param {number} count - Number of top performers to return
   * @returns {Array} Array of top performer objects
   */
  getTopPerformers(data, count = 5) {
    if (!data || !data.countries) {
      return []
    }

    const countryValues = []
    
    Object.entries(data.countries).forEach(([countryName, countryData]) => {
      const values = Object.values(countryData.data).filter(v => !isNaN(v))
      if (values.length > 0) {
        // Use latest year value or average
        const latestYear = Math.max(...data.years.filter(y => countryData.data[y] !== undefined))
        const value = countryData.data[latestYear] || (values.reduce((sum, v) => sum + v, 0) / values.length)
        
        countryValues.push({
          country: countryName,
          code: countryData.code,
          value: value,
          year: latestYear
        })
      }
    })

    // Sort by value (descending) and return top N
    return countryValues
      .sort((a, b) => b.value - a.value)
      .slice(0, count)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }))
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    this.memoizedMetrics.clear()
    this.memoizedTrends.clear()
    this.memoizedOutliers.clear()
  }

  /**
   * Get all available indicators
   * @returns {Object} Indicator metadata
   */
  getAvailableIndicators() {
    return INDICATOR_METADATA
  }

  /**
   * Get category colors
   * @returns {Object} Category color mapping
   */
  getCategoryColors() {
    return CATEGORY_COLORS
  }
}

// Export singleton instance
export const comparisonDataService = new ComparisonDataService()
export default comparisonDataService
