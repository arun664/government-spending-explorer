/**
 * ComparisonDataProcessor - Independent data processing service for comparison module
 * 
 * Handles merging GDP and spending data, calculating correlations, trend analysis,
 * and advanced statistical computations specific to comparison visualizations.
 * 
 * Requirements addressed:
 * - Merging GDP and spending data
 * - Calculating correlations between datasets
 * - Trend analysis and statistical computations
 * - Independent processing pipeline for comparison module
 */

export class ComparisonDataProcessor {
  constructor() {
    this.processingCache = new Map()
    this.correlationCache = new Map()
    this.trendCache = new Map()
  }

  /**
   * Merge GDP and spending data by country and year
   * @param {Array} gdpData - GDP data array
   * @param {Array} spendingData - Spending data array
   * @param {Object} options - Merging options
   * @returns {Array} Merged comparison data
   */
  mergeGDPAndSpendingData(gdpData, spendingData, options = {}) {
    const opts = {
      requireBothDatasets: true,
      fillMissingValues: false,
      defaultSpending: null,
      defaultGDP: null,
      ...options
    }

    // Create lookup maps for efficient merging
    const gdpMap = new Map()
    const spendingMap = new Map()

    // Build GDP lookup map
    gdpData.forEach(record => {
      const key = `${record.countryName}_${record.year}`
      gdpMap.set(key, record)
    })

    // Build spending lookup map
    spendingData.forEach(record => {
      const key = `${record.countryName}_${record.year}`
      spendingMap.set(key, record)
    })

    // Get all unique country-year combinations
    const allKeys = new Set([...gdpMap.keys(), ...spendingMap.keys()])
    const mergedData = []

    allKeys.forEach(key => {
      const gdpRecord = gdpMap.get(key)
      const spendingRecord = spendingMap.get(key)

      // Skip if both datasets required but one is missing
      if (opts.requireBothDatasets && (!gdpRecord || !spendingRecord)) {
        return
      }

      // Extract country and year from key
      const [countryName, yearStr] = key.split('_')
      const year = parseInt(yearStr)

      // Create merged record
      const mergedRecord = {
        countryName,
        countryCode: gdpRecord?.countryCode || spendingRecord?.countryCode,
        year,
        gdpGrowth: gdpRecord?.gdpGrowth ?? (opts.fillMissingValues ? opts.defaultGDP : null),
        totalSpending: spendingRecord?.totalSpending ?? (opts.fillMissingValues ? opts.defaultSpending : null),
        spendingCategory: spendingRecord?.category || 'General Government Expenditure',
        spendingUnit: spendingRecord?.unit || 'Percent of GDP',
        dataQuality: {
          hasGDP: !!gdpRecord,
          hasSpending: !!spendingRecord,
          gdpSource: gdpRecord?.dataSource,
          spendingSource: spendingRecord?.dataSource
        },
        mergedAt: new Date().toISOString()
      }

      // Add validation flags
      mergedRecord.validation = this._validateMergedRecord(mergedRecord)

      mergedData.push(mergedRecord)
    })

    // Sort by country and year
    mergedData.sort((a, b) => {
      if (a.countryName !== b.countryName) {
        return a.countryName.localeCompare(b.countryName)
      }
      return a.year - b.year
    })

    console.log(`Merged ${mergedData.length} records from ${gdpData.length} GDP and ${spendingData.length} spending records`)
    
    return mergedData
  }

  /**
   * Calculate correlation between GDP growth and spending
   * @param {Array} mergedData - Merged comparison data
   * @param {Object} options - Correlation options
   * @returns {Object} Correlation analysis results
   */
  calculateGDPSpendingCorrelation(mergedData, options = {}) {
    const opts = {
      method: 'pearson', // 'pearson', 'spearman'
      minDataPoints: 10,
      groupBy: null, // 'country', 'year', 'region'
      ...options
    }

    const cacheKey = `correlation_${JSON.stringify(opts)}_${mergedData.length}`
    
    // Check cache
    if (this.correlationCache.has(cacheKey)) {
      return this.correlationCache.get(cacheKey)
    }

    let correlationResults

    if (opts.groupBy) {
      correlationResults = this._calculateGroupedCorrelations(mergedData, opts)
    } else {
      correlationResults = this._calculateOverallCorrelation(mergedData, opts)
    }

    // Cache results
    this.correlationCache.set(cacheKey, correlationResults)
    
    return correlationResults
  }

  /**
   * Calculate overall correlation between GDP and spending
   * @param {Array} mergedData - Merged data
   * @param {Object} opts - Options
   * @returns {Object} Correlation results
   */
  _calculateOverallCorrelation(mergedData, opts) {
    // Filter valid data points
    const validData = mergedData.filter(record => 
      record.gdpGrowth !== null && 
      record.totalSpending !== null &&
      !isNaN(record.gdpGrowth) && 
      !isNaN(record.totalSpending) &&
      record.validation.isValid
    )

    if (validData.length < opts.minDataPoints) {
      return {
        correlation: null,
        pValue: null,
        significance: 'insufficient_data',
        dataPoints: validData.length,
        minRequired: opts.minDataPoints,
        method: opts.method
      }
    }

    const gdpValues = validData.map(d => d.gdpGrowth)
    const spendingValues = validData.map(d => d.totalSpending)

    const correlation = this._calculatePearsonCorrelation(gdpValues, spendingValues)
    const pValue = this._calculateCorrelationPValue(correlation, validData.length)
    const significance = this._interpretSignificance(pValue)

    return {
      correlation: Number(correlation.toFixed(4)),
      pValue: Number(pValue.toFixed(6)),
      significance,
      dataPoints: validData.length,
      method: opts.method,
      strength: this._interpretCorrelationStrength(correlation),
      confidenceInterval: this._calculateCorrelationCI(correlation, validData.length),
      statistics: {
        gdpMean: this._calculateMean(gdpValues),
        gdpStdDev: this._calculateStandardDeviation(gdpValues),
        spendingMean: this._calculateMean(spendingValues),
        spendingStdDev: this._calculateStandardDeviation(spendingValues)
      }
    }
  }

  /**
   * Calculate grouped correlations
   * @param {Array} mergedData - Merged data
   * @param {Object} opts - Options
   * @returns {Object} Grouped correlation results
   */
  _calculateGroupedCorrelations(mergedData, opts) {
    const groups = this._groupData(mergedData, opts.groupBy)
    const groupResults = {}

    Object.entries(groups).forEach(([groupKey, groupData]) => {
      groupResults[groupKey] = this._calculateOverallCorrelation(groupData, opts)
    })

    // Calculate overall statistics
    const validGroups = Object.values(groupResults).filter(result => result.correlation !== null)
    const overallStats = {
      totalGroups: Object.keys(groups).length,
      validGroups: validGroups.length,
      averageCorrelation: validGroups.length > 0 
        ? this._calculateMean(validGroups.map(r => r.correlation))
        : null,
      correlationRange: validGroups.length > 0 
        ? {
            min: Math.min(...validGroups.map(r => r.correlation)),
            max: Math.max(...validGroups.map(r => r.correlation))
          }
        : null
    }

    return {
      groupBy: opts.groupBy,
      groups: groupResults,
      overall: overallStats,
      method: opts.method
    }
  }

  /**
   * Perform trend analysis on merged data
   * @param {Array} mergedData - Merged comparison data
   * @param {Object} options - Trend analysis options
   * @returns {Object} Trend analysis results
   */
  performTrendAnalysis(mergedData, options = {}) {
    const opts = {
      trendWindow: 5, // years
      minDataPoints: 3,
      groupBy: 'country',
      includeForecasting: false,
      ...options
    }

    const cacheKey = `trends_${JSON.stringify(opts)}_${mergedData.length}`
    
    // Check cache
    if (this.trendCache.has(cacheKey)) {
      return this.trendCache.get(cacheKey)
    }

    const groups = this._groupData(mergedData, opts.groupBy)
    const trendResults = {}

    Object.entries(groups).forEach(([groupKey, groupData]) => {
      trendResults[groupKey] = this._analyzeTrendsForGroup(groupData, opts)
    })

    // Calculate overall trend statistics
    const overallTrends = this._calculateOverallTrendStats(trendResults)

    const results = {
      groupBy: opts.groupBy,
      trends: trendResults,
      overall: overallTrends,
      options: opts,
      analyzedAt: new Date().toISOString()
    }

    // Cache results
    this.trendCache.set(cacheKey, results)
    
    return results
  }

  /**
   * Analyze trends for a specific group
   * @param {Array} groupData - Data for specific group
   * @param {Object} opts - Options
   * @returns {Object} Trend analysis for group
   */
  _analyzeTrendsForGroup(groupData, opts) {
    // Sort by year
    const sortedData = groupData
      .filter(d => d.gdpGrowth !== null && d.totalSpending !== null)
      .sort((a, b) => a.year - b.year)

    if (sortedData.length < opts.minDataPoints) {
      return {
        gdpTrend: null,
        spendingTrend: null,
        dataPoints: sortedData.length,
        status: 'insufficient_data'
      }
    }

    const years = sortedData.map(d => d.year)
    const gdpValues = sortedData.map(d => d.gdpGrowth)
    const spendingValues = sortedData.map(d => d.totalSpending)

    // Calculate linear trends
    const gdpTrend = this._calculateLinearTrend(years, gdpValues)
    const spendingTrend = this._calculateLinearTrend(years, spendingValues)

    // Calculate moving averages
    const gdpMovingAvg = this._calculateMovingAverage(gdpValues, opts.trendWindow)
    const spendingMovingAvg = this._calculateMovingAverage(spendingValues, opts.trendWindow)

    // Detect trend changes
    const gdpTrendChanges = this._detectTrendChanges(years, gdpValues, opts.trendWindow)
    const spendingTrendChanges = this._detectTrendChanges(years, spendingValues, opts.trendWindow)

    return {
      gdpTrend: {
        ...gdpTrend,
        movingAverage: gdpMovingAvg,
        trendChanges: gdpTrendChanges,
        volatility: this._calculateVolatility(gdpValues)
      },
      spendingTrend: {
        ...spendingTrend,
        movingAverage: spendingMovingAvg,
        trendChanges: spendingTrendChanges,
        volatility: this._calculateVolatility(spendingValues)
      },
      dataPoints: sortedData.length,
      yearRange: {
        start: Math.min(...years),
        end: Math.max(...years)
      },
      status: 'analyzed'
    }
  }

  /**
   * Calculate linear trend using least squares regression
   * @param {Array} xValues - X values (typically years)
   * @param {Array} yValues - Y values
   * @returns {Object} Trend analysis results
   */
  _calculateLinearTrend(xValues, yValues) {
    const n = xValues.length
    const sumX = xValues.reduce((sum, x) => sum + x, 0)
    const sumY = yValues.reduce((sum, y) => sum + y, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const yMean = sumY / n
    const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
    const residualSumSquares = yValues.reduce((sum, y, i) => {
      const predicted = slope * xValues[i] + intercept
      return sum + Math.pow(y - predicted, 2)
    }, 0)
    const rSquared = 1 - (residualSumSquares / totalSumSquares)

    return {
      slope: Number(slope.toFixed(6)),
      intercept: Number(intercept.toFixed(6)),
      rSquared: Number(rSquared.toFixed(4)),
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      strength: this._interpretTrendStrength(Math.abs(slope), rSquared)
    }
  }

  /**
   * Calculate moving average
   * @param {Array} values - Values to average
   * @param {number} window - Window size
   * @returns {Array} Moving averages
   */
  _calculateMovingAverage(values, window) {
    const movingAverages = []
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2))
      const end = Math.min(values.length, i + Math.ceil(window / 2))
      const windowValues = values.slice(start, end)
      const average = this._calculateMean(windowValues)
      movingAverages.push(Number(average.toFixed(4)))
    }
    
    return movingAverages
  }

  /**
   * Detect significant trend changes
   * @param {Array} years - Year values
   * @param {Array} values - Data values
   * @param {number} window - Analysis window
   * @returns {Array} Trend change points
   */
  _detectTrendChanges(years, values, window) {
    const changes = []
    const minWindow = Math.max(3, Math.floor(window / 2))
    
    for (let i = minWindow; i < values.length - minWindow; i++) {
      const beforeValues = values.slice(i - minWindow, i)
      const afterValues = values.slice(i, i + minWindow)
      
      const beforeTrend = this._calculateLinearTrend(
        years.slice(i - minWindow, i),
        beforeValues
      )
      const afterTrend = this._calculateLinearTrend(
        years.slice(i, i + minWindow),
        afterValues
      )
      
      // Detect significant slope change
      const slopeChange = Math.abs(afterTrend.slope - beforeTrend.slope)
      const significanceThreshold = 0.5 // Adjust based on data characteristics
      
      if (slopeChange > significanceThreshold) {
        changes.push({
          year: years[i],
          index: i,
          beforeSlope: beforeTrend.slope,
          afterSlope: afterTrend.slope,
          slopeChange: Number(slopeChange.toFixed(4)),
          changeType: this._classifyTrendChange(beforeTrend.slope, afterTrend.slope)
        })
      }
    }
    
    return changes
  }

  /**
   * Calculate volatility (standard deviation)
   * @param {Array} values - Values to analyze
   * @returns {number} Volatility measure
   */
  _calculateVolatility(values) {
    return this._calculateStandardDeviation(values)
  }

  /**
   * Group data by specified field
   * @param {Array} data - Data to group
   * @param {string} groupBy - Field to group by
   * @returns {Object} Grouped data
   */
  _groupData(data, groupBy) {
    const groups = {}
    
    data.forEach(record => {
      const key = record[groupBy]
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(record)
    })
    
    return groups
  }

  /**
   * Calculate Pearson correlation coefficient
   * @param {Array} x - X values
   * @param {Array} y - Y values
   * @returns {number} Correlation coefficient
   */
  _calculatePearsonCorrelation(x, y) {
    const n = x.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)
    const sumYY = y.reduce((sum, val) => sum + val * val, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * Calculate mean of array
   * @param {Array} values - Values to average
   * @returns {number} Mean value
   */
  _calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Values to analyze
   * @returns {number} Standard deviation
   */
  _calculateStandardDeviation(values) {
    const mean = this._calculateMean(values)
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = this._calculateMean(squaredDiffs)
    return Math.sqrt(variance)
  }

  /**
   * Validate merged record
   * @param {Object} record - Merged record to validate
   * @returns {Object} Validation results
   */
  _validateMergedRecord(record) {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    }

    // Check for missing critical data
    if (record.gdpGrowth === null && record.totalSpending === null) {
      validation.errors.push('Both GDP and spending data missing')
      validation.isValid = false
    }

    // Check for extreme values
    if (record.gdpGrowth !== null && Math.abs(record.gdpGrowth) > 50) {
      validation.warnings.push('Extreme GDP growth value')
    }

    if (record.totalSpending !== null && record.totalSpending > 100) {
      validation.warnings.push('Spending exceeds 100% of GDP')
    }

    if (record.totalSpending !== null && record.totalSpending < 0) {
      validation.errors.push('Negative spending value')
      validation.isValid = false
    }

    return validation
  }

  /**
   * Calculate correlation p-value (simplified)
   * @param {number} r - Correlation coefficient
   * @param {number} n - Sample size
   * @returns {number} P-value
   */
  _calculateCorrelationPValue(r, n) {
    if (n < 3) return 1
    
    const t = r * Math.sqrt((n - 2) / (1 - r * r))
    // Simplified p-value calculation (would use t-distribution in practice)
    return Math.max(0, Math.min(1, 2 * (1 - Math.abs(t) / Math.sqrt(n))))
  }

  /**
   * Interpret correlation strength
   * @param {number} correlation - Correlation coefficient
   * @returns {string} Strength interpretation
   */
  _interpretCorrelationStrength(correlation) {
    const abs = Math.abs(correlation)
    if (abs >= 0.8) return 'very strong'
    if (abs >= 0.6) return 'strong'
    if (abs >= 0.4) return 'moderate'
    if (abs >= 0.2) return 'weak'
    return 'very weak'
  }

  /**
   * Interpret statistical significance
   * @param {number} pValue - P-value
   * @returns {string} Significance level
   */
  _interpretSignificance(pValue) {
    if (pValue < 0.001) return 'highly significant'
    if (pValue < 0.01) return 'very significant'
    if (pValue < 0.05) return 'significant'
    if (pValue < 0.1) return 'marginally significant'
    return 'not significant'
  }

  /**
   * Calculate correlation confidence interval
   * @param {number} r - Correlation coefficient
   * @param {number} n - Sample size
   * @returns {Object} Confidence interval
   */
  _calculateCorrelationCI(r, n, confidence = 0.95) {
    if (n < 4) return { lower: null, upper: null }
    
    const z = 0.5 * Math.log((1 + r) / (1 - r))
    const se = 1 / Math.sqrt(n - 3)
    const zCrit = 1.96 // For 95% confidence
    
    const lowerZ = z - zCrit * se
    const upperZ = z + zCrit * se
    
    const lower = (Math.exp(2 * lowerZ) - 1) / (Math.exp(2 * lowerZ) + 1)
    const upper = (Math.exp(2 * upperZ) - 1) / (Math.exp(2 * upperZ) + 1)
    
    return {
      lower: Number(lower.toFixed(4)),
      upper: Number(upper.toFixed(4)),
      confidence
    }
  }

  /**
   * Interpret trend strength
   * @param {number} slope - Trend slope
   * @param {number} rSquared - R-squared value
   * @returns {string} Trend strength
   */
  _interpretTrendStrength(slope, rSquared) {
    if (rSquared < 0.1) return 'no trend'
    if (rSquared < 0.3) return 'weak trend'
    if (rSquared < 0.6) return 'moderate trend'
    if (rSquared < 0.8) return 'strong trend'
    return 'very strong trend'
  }

  /**
   * Classify trend change type
   * @param {number} beforeSlope - Slope before change
   * @param {number} afterSlope - Slope after change
   * @returns {string} Change type
   */
  _classifyTrendChange(beforeSlope, afterSlope) {
    const threshold = 0.1
    
    if (Math.abs(beforeSlope) < threshold && Math.abs(afterSlope) < threshold) {
      return 'stable'
    }
    
    if (beforeSlope > threshold && afterSlope < -threshold) {
      return 'reversal_to_decline'
    }
    
    if (beforeSlope < -threshold && afterSlope > threshold) {
      return 'reversal_to_growth'
    }
    
    if (Math.abs(afterSlope) > Math.abs(beforeSlope)) {
      return afterSlope > 0 ? 'acceleration_up' : 'acceleration_down'
    }
    
    return afterSlope > 0 ? 'deceleration_up' : 'deceleration_down'
  }

  /**
   * Calculate overall trend statistics
   * @param {Object} trendResults - Individual trend results
   * @returns {Object} Overall statistics
   */
  _calculateOverallTrendStats(trendResults) {
    const validResults = Object.values(trendResults).filter(r => r.status === 'analyzed')
    
    if (validResults.length === 0) {
      return { status: 'no_valid_trends' }
    }

    const gdpSlopes = validResults.map(r => r.gdpTrend.slope).filter(s => s !== null)
    const spendingSlopes = validResults.map(r => r.spendingTrend.slope).filter(s => s !== null)

    return {
      totalGroups: Object.keys(trendResults).length,
      validGroups: validResults.length,
      gdpTrends: {
        averageSlope: gdpSlopes.length > 0 ? this._calculateMean(gdpSlopes) : null,
        slopeRange: gdpSlopes.length > 0 ? {
          min: Math.min(...gdpSlopes),
          max: Math.max(...gdpSlopes)
        } : null,
        increasing: gdpSlopes.filter(s => s > 0.1).length,
        decreasing: gdpSlopes.filter(s => s < -0.1).length,
        stable: gdpSlopes.filter(s => Math.abs(s) <= 0.1).length
      },
      spendingTrends: {
        averageSlope: spendingSlopes.length > 0 ? this._calculateMean(spendingSlopes) : null,
        slopeRange: spendingSlopes.length > 0 ? {
          min: Math.min(...spendingSlopes),
          max: Math.max(...spendingSlopes)
        } : null,
        increasing: spendingSlopes.filter(s => s > 0.1).length,
        decreasing: spendingSlopes.filter(s => s < -0.1).length,
        stable: spendingSlopes.filter(s => Math.abs(s) <= 0.1).length
      }
    }
  }

  /**
   * Clear all processing caches
   */
  clearCache() {
    this.processingCache.clear()
    this.correlationCache.clear()
    this.trendCache.clear()
    console.log('Comparison data processor cache cleared')
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      processingCache: this.processingCache.size,
      correlationCache: this.correlationCache.size,
      trendCache: this.trendCache.size,
      totalCacheSize: this.processingCache.size + this.correlationCache.size + this.trendCache.size
    }
  }
}

// Export singleton instance
export const comparisonDataProcessor = new ComparisonDataProcessor()