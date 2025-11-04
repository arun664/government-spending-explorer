/**
 * Enhanced Data processing utilities for the Government Expense Dashboard
 * Handles data cleaning, validation, statistical analysis, and data quality assessment
 * 
 * Requirements addressed:
 * - 8.1: Data cleaning processes to handle missing values, outliers, and inconsistencies
 * - 8.2: Statistical metrics including mean, median, standard deviation, and percentiles
 * - 8.5: Data quality indicators showing completeness and reliability scores
 */

/**
 * Enhanced data cleaning function to handle missing values, outliers, and inconsistencies
 * Requirement 8.1: Data cleaning processes
 * @param {Array} data - Raw data array
 * @param {Object} options - Cleaning options
 * @returns {Object} Object containing cleaned data and cleaning report
 */
export function cleanData(data, options = {}) {
  const {
    removeOutliers = false,
    fillMissingValues = true,
    outlierMethod = 'iqr',
    missingValueStrategy = 'interpolate'
  } = options

  if (!data || data.length === 0) {
    return {
      cleanedData: [],
      cleaningReport: {
        originalCount: 0,
        cleanedCount: 0,
        removedCount: 0,
        outlierCount: 0,
        missingValueCount: 0,
        inconsistencyCount: 0
      }
    }
  }

  let cleanedData = [...data]
  let removedCount = 0
  let outlierCount = 0
  let missingValueCount = 0
  let inconsistencyCount = 0

  // Step 1: Remove entries with critical missing values
  cleanedData = cleanedData.filter(d => {
    if (!d.countryName || !d.countryCode) {
      removedCount++
      return false
    }
    if (typeof d.year !== 'number' || isNaN(d.year) || d.year < 1900 || d.year > new Date().getFullYear()) {
      removedCount++
      inconsistencyCount++
      return false
    }
    return true
  })

  // Step 2: Handle missing values in numeric fields
  const numericFields = ['gdpGrowth', 'totalSpending', 'perCapitaSpending', 'gdpRatio']
  
  if (fillMissingValues) {
    cleanedData = handleMissingValues(cleanedData, numericFields, missingValueStrategy)
  }

  // Count missing values
  cleanedData.forEach(record => {
    numericFields.forEach(field => {
      if (record[field] === null || record[field] === undefined || isNaN(record[field])) {
        missingValueCount++
      }
    })
  })

  // Step 3: Handle outliers if requested
  if (removeOutliers) {
    const outlierResult = removeOutliersFromData(cleanedData, numericFields, outlierMethod)
    cleanedData = outlierResult.data
    outlierCount = outlierResult.outlierCount
  }

  // Step 4: Validate data consistency
  cleanedData = validateDataConsistency(cleanedData)

  const cleaningReport = {
    originalCount: data.length,
    cleanedCount: cleanedData.length,
    removedCount,
    outlierCount,
    missingValueCount,
    inconsistencyCount
  }

  return {
    cleanedData,
    cleaningReport
  }
}

/**
 * Handle missing values using various strategies
 * @param {Array} data - Data array
 * @param {Array} numericFields - Array of numeric field names
 * @param {string} strategy - Strategy for handling missing values
 * @returns {Array} Data with missing values handled
 */
function handleMissingValues(data, numericFields, strategy) {
  const processedData = [...data]

  numericFields.forEach(field => {
    const validValues = processedData
      .map(d => d[field])
      .filter(val => val !== null && val !== undefined && !isNaN(val))

    if (validValues.length === 0) return

    const stats = calculateStatistics(validValues)

    processedData.forEach(record => {
      if (record[field] === null || record[field] === undefined || isNaN(record[field])) {
        switch (strategy) {
          case 'mean':
            record[field] = stats.mean
            break
          case 'median':
            record[field] = stats.median
            break
          case 'interpolate':
            record[field] = stats.median // Simplified interpolation
            break
          case 'zero':
            record[field] = 0
            break
          default:
            record[field] = stats.median
        }
      }
    })
  })

  return processedData
}

/**
 * Remove outliers from data using specified method
 * @param {Array} data - Data array
 * @param {Array} numericFields - Array of numeric field names
 * @param {string} method - Outlier detection method
 * @returns {Object} Object with cleaned data and outlier count
 */
function removeOutliersFromData(data, numericFields, method) {
  let cleanedData = [...data]
  let totalOutlierCount = 0

  numericFields.forEach(field => {
    const values = cleanedData.map(d => d[field]).filter(val => !isNaN(val))
    const outliers = detectOutliers(values, method)
    
    if (outliers.length > 0) {
      const outlierSet = new Set(outliers)
      const beforeCount = cleanedData.length
      cleanedData = cleanedData.filter(record => !outlierSet.has(record[field]))
      totalOutlierCount += beforeCount - cleanedData.length
    }
  })

  return {
    data: cleanedData,
    outlierCount: totalOutlierCount
  }
}

/**
 * Validate data consistency and fix common issues
 * @param {Array} data - Data array
 * @returns {Array} Data with consistency issues fixed
 */
function validateDataConsistency(data) {
  return data.map(record => {
    const cleanedRecord = { ...record }

    // Normalize country names (trim whitespace, fix casing)
    if (cleanedRecord.countryName) {
      cleanedRecord.countryName = cleanedRecord.countryName.trim()
    }

    // Normalize country codes (uppercase, trim)
    if (cleanedRecord.countryCode) {
      cleanedRecord.countryCode = cleanedRecord.countryCode.trim().toUpperCase()
    }

    // Ensure numeric fields are properly typed
    const numericFields = ['gdpGrowth', 'totalSpending', 'perCapitaSpending', 'gdpRatio', 'year']
    numericFields.forEach(field => {
      if (cleanedRecord[field] !== undefined && cleanedRecord[field] !== null) {
        const numValue = Number(cleanedRecord[field])
        if (!isNaN(numValue)) {
          cleanedRecord[field] = numValue
        }
      }
    })

    return cleanedRecord
  })
}

/**
 * Enhanced statistical analysis functions including mean, median, standard deviation, and percentiles
 * Requirement 8.2: Statistical metrics including mean, median, standard deviation, and percentiles
 * @param {Array} values - Array of numeric values
 * @returns {Object} Comprehensive statistical metrics object
 */
export function calculateStatistics(values) {
  if (!values || values.length === 0) {
    return {
      mean: 0,
      median: 0,
      standardDeviation: 0,
      variance: 0,
      min: 0,
      max: 0,
      range: 0,
      count: 0,
      percentiles: {
        p10: 0,
        p25: 0,
        p50: 0,
        p75: 0,
        p90: 0
      },
      skewness: 0,
      kurtosis: 0,
      coefficientOfVariation: 0
    }
  }
  
  // Filter out non-numeric values
  const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val))
  
  if (numericValues.length === 0) {
    return calculateStatistics([]) // Return empty stats
  }
  
  const sortedValues = [...numericValues].sort((a, b) => a - b)
  const count = numericValues.length
  const sum = numericValues.reduce((acc, val) => acc + val, 0)
  const mean = sum / count
  
  // Calculate median
  const median = count % 2 === 0
    ? (sortedValues[count / 2 - 1] + sortedValues[count / 2]) / 2
    : sortedValues[Math.floor(count / 2)]
  
  // Calculate variance and standard deviation
  const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count
  const standardDeviation = Math.sqrt(variance)
  
  // Calculate percentiles
  const percentiles = calculatePercentiles(sortedValues)
  
  // Calculate skewness (measure of asymmetry)
  const skewness = calculateSkewness(numericValues, mean, standardDeviation)
  
  // Calculate kurtosis (measure of tail heaviness)
  const kurtosis = calculateKurtosis(numericValues, mean, standardDeviation)
  
  // Calculate coefficient of variation
  const coefficientOfVariation = mean !== 0 ? (standardDeviation / Math.abs(mean)) * 100 : 0
  
  const min = sortedValues[0]
  const max = sortedValues[count - 1]
  const range = max - min
  
  return {
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    standardDeviation: Number(standardDeviation.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    range: Number(range.toFixed(4)),
    count,
    percentiles,
    skewness: Number(skewness.toFixed(4)),
    kurtosis: Number(kurtosis.toFixed(4)),
    coefficientOfVariation: Number(coefficientOfVariation.toFixed(2))
  }
}

/**
 * Calculate percentiles for a sorted array of values
 * @param {Array} sortedValues - Sorted array of numeric values
 * @returns {Object} Object containing percentile values
 */
function calculatePercentiles(sortedValues) {
  const getPercentile = (values, percentile) => {
    const index = (percentile / 100) * (values.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1
    
    if (upper >= values.length) return values[values.length - 1]
    if (lower < 0) return values[0]
    
    return values[lower] * (1 - weight) + values[upper] * weight
  }
  
  return {
    p10: Number(getPercentile(sortedValues, 10).toFixed(4)),
    p25: Number(getPercentile(sortedValues, 25).toFixed(4)),
    p50: Number(getPercentile(sortedValues, 50).toFixed(4)),
    p75: Number(getPercentile(sortedValues, 75).toFixed(4)),
    p90: Number(getPercentile(sortedValues, 90).toFixed(4))
  }
}

/**
 * Calculate skewness (measure of asymmetry)
 * @param {Array} values - Array of numeric values
 * @param {number} mean - Mean of the values
 * @param {number} standardDeviation - Standard deviation of the values
 * @returns {number} Skewness value
 */
function calculateSkewness(values, mean, standardDeviation) {
  if (standardDeviation === 0 || values.length < 3) return 0
  
  const n = values.length
  const sumCubedDeviations = values.reduce((acc, val) => {
    return acc + Math.pow((val - mean) / standardDeviation, 3)
  }, 0)
  
  return (n / ((n - 1) * (n - 2))) * sumCubedDeviations
}

/**
 * Calculate kurtosis (measure of tail heaviness)
 * @param {Array} values - Array of numeric values
 * @param {number} mean - Mean of the values
 * @param {number} standardDeviation - Standard deviation of the values
 * @returns {number} Kurtosis value
 */
function calculateKurtosis(values, mean, standardDeviation) {
  if (standardDeviation === 0 || values.length < 4) return 0
  
  const n = values.length
  const sumQuartedDeviations = values.reduce((acc, val) => {
    return acc + Math.pow((val - mean) / standardDeviation, 4)
  }, 0)
  
  const kurtosis = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sumQuartedDeviations
  const correction = 3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3))
  
  return kurtosis - correction // Excess kurtosis
}

/**
 * Enhanced outlier detection using multiple methods
 * @param {Array} values - Array of numeric values
 * @param {string} method - Detection method ('iqr', 'zscore', 'modified_zscore')
 * @returns {Array} Array of outlier values
 */
export function detectOutliers(values, method = 'iqr') {
  if (!values || values.length < 4) return []
  
  const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val))
  
  switch (method) {
    case 'iqr':
      return detectOutliersIQR(numericValues)
    case 'zscore':
      return detectOutliersZScore(numericValues)
    case 'modified_zscore':
      return detectOutliersModifiedZScore(numericValues)
    default:
      return detectOutliersIQR(numericValues)
  }
}

/**
 * Detect outliers using the Interquartile Range (IQR) method
 * @param {Array} values - Array of numeric values
 * @returns {Array} Array of outlier values
 */
function detectOutliersIQR(values) {
  const sortedValues = [...values].sort((a, b) => a - b)
  const q1Index = Math.floor(sortedValues.length * 0.25)
  const q3Index = Math.floor(sortedValues.length * 0.75)
  
  const q1 = sortedValues[q1Index]
  const q3 = sortedValues[q3Index]
  const iqr = q3 - q1
  
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  
  return values.filter(value => value < lowerBound || value > upperBound)
}

/**
 * Detect outliers using Z-Score method
 * @param {Array} values - Array of numeric values
 * @returns {Array} Array of outlier values
 */
function detectOutliersZScore(values) {
  const stats = calculateStatistics(values)
  const threshold = 3 // Standard threshold for Z-score
  
  return values.filter(value => {
    const zScore = Math.abs((value - stats.mean) / stats.standardDeviation)
    return zScore > threshold
  })
}

/**
 * Detect outliers using Modified Z-Score method (more robust)
 * @param {Array} values - Array of numeric values
 * @returns {Array} Array of outlier values
 */
function detectOutliersModifiedZScore(values) {
  const median = calculateStatistics(values).median
  const deviations = values.map(value => Math.abs(value - median))
  const medianDeviation = calculateStatistics(deviations).median
  const threshold = 3.5 // Standard threshold for modified Z-score
  
  return values.filter(value => {
    const modifiedZScore = 0.6745 * (value - median) / medianDeviation
    return Math.abs(modifiedZScore) > threshold
  })
}

/**
 * Group data by a specific field
 * @param {Array} data - Data array
 * @param {string} field - Field name to group by
 * @returns {Object} Object with grouped data
 */
export function groupBy(data, field) {
  return data.reduce((groups, item) => {
    const key = item[field]
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {})
}

/**
 * Calculate year-over-year growth rate with enhanced analysis
 * @param {Array} data - Time series data sorted by year
 * @param {string} valueField - Field name containing the values
 * @returns {Array} Array with growth rates and trend analysis added
 */
export function calculateGrowthRates(data, valueField) {
  const sortedData = [...data].sort((a, b) => a.year - b.year)
  
  const result = sortedData.map((item, index) => {
    if (index === 0) {
      return { ...item, growthRate: null, trendDirection: null }
    }
    
    const previousValue = sortedData[index - 1][valueField]
    const currentValue = item[valueField]
    
    if (previousValue === 0 || previousValue === null || previousValue === undefined ||
        currentValue === null || currentValue === undefined) {
      return { ...item, growthRate: null, trendDirection: null }
    }
    
    const growthRate = ((currentValue - previousValue) / previousValue) * 100
    const trendDirection = growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'
    
    return { 
      ...item, 
      growthRate: Number(growthRate.toFixed(2)),
      trendDirection
    }
  })
  
  return result
}

/**
 * Calculate advanced metrics for expense data analysis
 * @param {Array} data - Expense data array
 * @param {string} valueField - Field name containing the values
 * @returns {Object} Advanced metrics object
 */
export function calculateAdvancedMetrics(data, valueField) {
  if (!data || data.length === 0) {
    return {
      volatility: 0,
      trendStrength: 0,
      seasonality: 0,
      correlationWithGDP: 0,
      anomalyScore: 0
    }
  }
  
  const values = data.map(d => d[valueField]).filter(val => typeof val === 'number' && !isNaN(val))
  
  if (values.length < 2) {
    return {
      volatility: 0,
      trendStrength: 0,
      seasonality: 0,
      correlationWithGDP: 0,
      anomalyScore: 0
    }
  }
  
  // Calculate volatility (coefficient of variation)
  const stats = calculateStatistics(values)
  const volatility = stats.mean !== 0 ? (stats.standardDeviation / Math.abs(stats.mean)) * 100 : 0
  
  // Calculate trend strength using linear regression
  const trendStrength = calculateTrendStrength(data, valueField)
  
  // Calculate anomaly score based on outliers
  const outliers = detectOutliers(values)
  const anomalyScore = (outliers.length / values.length) * 100
  
  return {
    volatility: Number(volatility.toFixed(2)),
    trendStrength: Number(trendStrength.toFixed(2)),
    seasonality: 0, // Placeholder for future implementation
    correlationWithGDP: 0, // Placeholder for future implementation
    anomalyScore: Number(anomalyScore.toFixed(2))
  }
}

/**
 * Calculate trend strength using simple linear regression
 * @param {Array} data - Time series data
 * @param {string} valueField - Field name containing the values
 * @returns {number} R-squared value indicating trend strength
 */
function calculateTrendStrength(data, valueField) {
  const validData = data.filter(d => 
    typeof d.year === 'number' && !isNaN(d.year) &&
    typeof d[valueField] === 'number' && !isNaN(d[valueField])
  ).sort((a, b) => a.year - b.year)
  
  if (validData.length < 2) return 0
  
  const n = validData.length
  const sumX = validData.reduce((sum, d) => sum + d.year, 0)
  const sumY = validData.reduce((sum, d) => sum + d[valueField], 0)
  const sumXY = validData.reduce((sum, d) => sum + d.year * d[valueField], 0)
  const sumXX = validData.reduce((sum, d) => sum + d.year * d.year, 0)
  const sumYY = validData.reduce((sum, d) => sum + d[valueField] * d[valueField], 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominatorX = n * sumXX - sumX * sumX
  const denominatorY = n * sumYY - sumY * sumY
  
  if (denominatorX === 0 || denominatorY === 0) return 0
  
  const correlation = numerator / Math.sqrt(denominatorX * denominatorY)
  const rSquared = correlation * correlation
  
  return Math.abs(rSquared) * 100 // Return as percentage
}

/**
 * Identify and analyze anomalies in the data
 * @param {Array} data - Data array
 * @param {string} valueField - Field name to analyze
 * @returns {Array} Array of anomaly objects
 */
export function identifyAnomalies(data, valueField) {
  if (!data || data.length === 0) return []
  
  const values = data.map(d => d[valueField]).filter(val => typeof val === 'number' && !isNaN(val))
  const outliers = detectOutliers(values, 'iqr')
  const outlierSet = new Set(outliers)
  
  const anomalies = data
    .filter(record => outlierSet.has(record[valueField]))
    .map(record => ({
      record,
      value: record[valueField],
      type: 'outlier',
      severity: calculateAnomalySeverity(record[valueField], values),
      description: `Value ${record[valueField]} is significantly different from the typical range`
    }))
  
  return anomalies
}

/**
 * Calculate anomaly severity
 * @param {number} value - The anomalous value
 * @param {Array} allValues - All values for comparison
 * @returns {string} Severity level
 */
function calculateAnomalySeverity(value, allValues) {
  const stats = calculateStatistics(allValues)
  const zScore = Math.abs((value - stats.mean) / stats.standardDeviation)
  
  if (zScore > 3) return 'high'
  if (zScore > 2) return 'medium'
  return 'low'
}

/**
 * Enhanced data quality assessment with comprehensive metrics
 * Requirement 8.5: Data quality indicators showing completeness and reliability scores
 * @param {Array} data - Data array to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Comprehensive data quality metrics
 */
export function assessDataQuality(data, requiredFields = ['countryName', 'countryCode', 'year']) {
  if (!data || data.length === 0) {
    return {
      overall: {
        score: 0,
        grade: 'F'
      },
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      timeliness: 0,
      validity: 0,
      uniqueness: 0,
      totalRecords: 0,
      validRecords: 0,
      missingValues: 0,
      duplicateRecords: 0,
      outlierCount: 0,
      inconsistentRecords: 0,
      fieldAnalysis: {},
      recommendations: []
    }
  }
  
  const totalRecords = data.length
  let validRecords = 0
  let missingValues = 0
  let duplicateRecords = 0
  let inconsistentRecords = 0
  let outlierCount = 0
  
  const fieldAnalysis = {}
  const recommendations = []
  
  // Initialize field analysis
  const allFields = new Set()
  data.forEach(record => {
    Object.keys(record).forEach(field => allFields.add(field))
  })
  
  allFields.forEach(field => {
    fieldAnalysis[field] = {
      totalValues: 0,
      missingValues: 0,
      validValues: 0,
      uniqueValues: 0,
      completeness: 0,
      dataType: 'unknown',
      outliers: []
    }
  })
  
  // Analyze each record
  const recordHashes = new Set()
  const duplicateCheck = new Map()
  
  data.forEach((record, index) => {
    let recordValid = true
    let recordMissingCount = 0
    
    // Create hash for duplicate detection
    const recordHash = JSON.stringify(record)
    if (recordHashes.has(recordHash)) {
      duplicateRecords++
    } else {
      recordHashes.add(recordHash)
    }
    
    // Check for duplicates based on key fields
    const keyFields = ['countryName', 'countryCode', 'year']
    const keyHash = keyFields.map(field => record[field]).join('|')
    if (duplicateCheck.has(keyHash)) {
      duplicateRecords++
    } else {
      duplicateCheck.set(keyHash, index)
    }
    
    // Analyze each field
    allFields.forEach(field => {
      const value = record[field]
      fieldAnalysis[field].totalValues++
      
      if (value === null || value === undefined || value === '') {
        fieldAnalysis[field].missingValues++
        missingValues++
        recordMissingCount++
        
        if (requiredFields.includes(field)) {
          recordValid = false
        }
      } else {
        fieldAnalysis[field].validValues++
        
        // Determine data type
        if (typeof value === 'number' && !isNaN(value)) {
          fieldAnalysis[field].dataType = 'numeric'
        } else if (typeof value === 'string') {
          fieldAnalysis[field].dataType = 'text'
        } else if (value instanceof Date) {
          fieldAnalysis[field].dataType = 'date'
        }
      }
    })
    
    // Check for inconsistencies
    if (record.countryName && record.countryCode) {
      // Check if country name and code are consistent
      const name = record.countryName.trim().toLowerCase()
      const code = record.countryCode.trim().toUpperCase()
      
      // Simple consistency check (this could be enhanced with a lookup table)
      if (name.length < 2 || code.length !== 3) {
        inconsistentRecords++
        recordValid = false
      }
    }
    
    if (recordValid && recordMissingCount === 0) {
      validRecords++
    }
  })
  
  // Calculate field-level metrics
  allFields.forEach(field => {
    const analysis = fieldAnalysis[field]
    analysis.completeness = (analysis.validValues / analysis.totalValues) * 100
    
    // Count unique values
    const uniqueValues = new Set(
      data.map(record => record[field]).filter(val => val !== null && val !== undefined && val !== '')
    )
    analysis.uniqueValues = uniqueValues.size
    
    // Detect outliers for numeric fields
    if (analysis.dataType === 'numeric') {
      const numericValues = data
        .map(record => record[field])
        .filter(val => typeof val === 'number' && !isNaN(val))
      
      if (numericValues.length > 0) {
        analysis.outliers = detectOutliers(numericValues, 'iqr')
        outlierCount += analysis.outliers.length
      }
    }
  })
  
  // Calculate overall metrics
  const completeness = (validRecords / totalRecords) * 100
  const accuracy = Math.max(0, 100 - (inconsistentRecords / totalRecords) * 100)
  const consistency = Math.max(0, 100 - (duplicateRecords / totalRecords) * 100)
  const validity = (validRecords / totalRecords) * 100
  const uniqueness = Math.max(0, 100 - (duplicateRecords / totalRecords) * 100)
  
  // Calculate timeliness (based on data recency)
  const currentYear = new Date().getFullYear()
  const years = data.map(d => d.year).filter(year => typeof year === 'number' && !isNaN(year))
  const maxYear = years.length > 0 ? Math.max(...years) : currentYear
  const timeliness = Math.max(0, 100 - (currentYear - maxYear) * 10) // Decrease by 10% per year
  
  // Calculate overall score
  const overallScore = (completeness + accuracy + consistency + validity + uniqueness + timeliness) / 6
  
  // Determine grade
  const getGrade = (score) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }
  
  // Generate recommendations
  if (completeness < 90) {
    recommendations.push(`Improve data completeness (${completeness.toFixed(1)}%). Consider data collection improvements.`)
  }
  if (accuracy < 90) {
    recommendations.push(`Address data accuracy issues (${accuracy.toFixed(1)}%). Review data validation processes.`)
  }
  if (consistency < 90) {
    recommendations.push(`Reduce data inconsistencies (${consistency.toFixed(1)}%). Implement data standardization.`)
  }
  if (duplicateRecords > 0) {
    recommendations.push(`Remove ${duplicateRecords} duplicate records to improve data quality.`)
  }
  if (outlierCount > 0) {
    recommendations.push(`Review ${outlierCount} outlier values for potential data entry errors.`)
  }
  if (timeliness < 80) {
    recommendations.push(`Update data more frequently. Current data may be outdated.`)
  }
  
  return {
    overall: {
      score: Number(overallScore.toFixed(2)),
      grade: getGrade(overallScore)
    },
    completeness: Number(completeness.toFixed(2)),
    accuracy: Number(accuracy.toFixed(2)),
    consistency: Number(consistency.toFixed(2)),
    timeliness: Number(timeliness.toFixed(2)),
    validity: Number(validity.toFixed(2)),
    uniqueness: Number(uniqueness.toFixed(2)),
    totalRecords,
    validRecords,
    missingValues,
    duplicateRecords,
    outlierCount,
    inconsistentRecords,
    fieldAnalysis,
    recommendations
  }
}