/**
 * Enhanced Data Processing Service for Government Expense Dashboard
 * 
 * This service provides comprehensive data processing capabilities including:
 * - Data cleaning and validation
 * - Statistical analysis
 * - Data quality assessment
 * - Anomaly detection
 * 
 * Requirements addressed:
 * - 8.1: Data cleaning processes to handle missing values, outliers, and inconsistencies
 * - 8.2: Statistical metrics including mean, median, standard deviation, and percentiles
 * - 8.5: Data quality indicators showing completeness and reliability scores
 */

import { 
  cleanData, 
  calculateStatistics, 
  detectOutliers, 
  assessDataQuality,
  calculateGrowthRates,
  calculateAdvancedMetrics,
  identifyAnomalies,
  groupBy
} from '../utils/dataProcessor.js'

export class DataProcessor {
  constructor() {
    this.processingHistory = []
    this.qualityThresholds = {
      completeness: 90,
      accuracy: 85,
      consistency: 90,
      timeliness: 80
    }
  }

  /**
   * Process raw data with comprehensive cleaning and analysis
   * @param {Array} rawData - Raw data array
   * @param {Object} options - Processing options
   * @returns {Object} Processed data with analysis results
   */
  async processData(rawData, options = {}) {
    const startTime = Date.now()
    
    try {
      // Step 1: Clean the data
      const cleaningResult = cleanData(rawData, options.cleaning)
      
      // Step 2: Assess data quality
      const qualityAssessment = assessDataQuality(
        cleaningResult.cleanedData, 
        options.requiredFields
      )
      
      // Step 3: Calculate statistics for numeric fields
      const statisticalAnalysis = this.performStatisticalAnalysis(
        cleaningResult.cleanedData, 
        options.numericFields
      )
      
      // Step 4: Identify anomalies
      const anomalies = this.identifyDataAnomalies(
        cleaningResult.cleanedData, 
        options.numericFields
      )
      
      // Step 5: Calculate advanced metrics
      const advancedMetrics = this.calculateAdvancedAnalytics(
        cleaningResult.cleanedData, 
        options.numericFields
      )
      
      const processingTime = Date.now() - startTime
      
      const result = {
        processedData: cleaningResult.cleanedData,
        cleaningReport: cleaningResult.cleaningReport,
        qualityAssessment,
        statisticalAnalysis,
        anomalies,
        advancedMetrics,
        processingMetadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          recordCount: cleaningResult.cleanedData.length,
          qualityScore: qualityAssessment.overall.score
        }
      }
      
      // Store processing history
      this.processingHistory.push({
        timestamp: new Date().toISOString(),
        inputRecords: rawData.length,
        outputRecords: cleaningResult.cleanedData.length,
        qualityScore: qualityAssessment.overall.score,
        processingTime
      })
      
      return result
      
    } catch (error) {
      console.error('Error processing data:', error)
      throw new Error(`Data processing failed: ${error.message}`)
    }
  }

  /**
   * Perform statistical analysis on numeric fields
   * @param {Array} data - Cleaned data array
   * @param {Array} numericFields - Array of numeric field names
   * @returns {Object} Statistical analysis results
   */
  performStatisticalAnalysis(data, numericFields = ['gdpGrowth', 'totalSpending', 'perCapitaSpending']) {
    const analysis = {}
    
    numericFields.forEach(field => {
      const values = data
        .map(record => record[field])
        .filter(val => typeof val === 'number' && !isNaN(val))
      
      if (values.length > 0) {
        analysis[field] = {
          ...calculateStatistics(values),
          outliers: detectOutliers(values),
          fieldName: field,
          sampleSize: values.length
        }
      }
    })
    
    return analysis
  }

  /**
   * Identify anomalies across multiple fields
   * @param {Array} data - Data array
   * @param {Array} numericFields - Array of numeric field names
   * @returns {Object} Anomaly analysis results
   */
  identifyDataAnomalies(data, numericFields = ['gdpGrowth', 'totalSpending', 'perCapitaSpending']) {
    const anomalies = {
      summary: {
        totalAnomalies: 0,
        highSeverity: 0,
        mediumSeverity: 0,
        lowSeverity: 0
      },
      byField: {},
      records: []
    }
    
    numericFields.forEach(field => {
      const fieldAnomalies = identifyAnomalies(data, field)
      anomalies.byField[field] = fieldAnomalies
      
      fieldAnomalies.forEach(anomaly => {
        anomalies.summary.totalAnomalies++
        anomalies.summary[`${anomaly.severity}Severity`]++
        anomalies.records.push({
          ...anomaly,
          field
        })
      })
    })
    
    return anomalies
  }

  /**
   * Calculate advanced analytics metrics
   * @param {Array} data - Data array
   * @param {Array} numericFields - Array of numeric field names
   * @returns {Object} Advanced metrics results
   */
  calculateAdvancedAnalytics(data, numericFields = ['gdpGrowth', 'totalSpending', 'perCapitaSpending']) {
    const metrics = {}
    
    numericFields.forEach(field => {
      metrics[field] = calculateAdvancedMetrics(data, field)
    })
    
    // Calculate cross-field correlations
    metrics.correlations = this.calculateCorrelations(data, numericFields)
    
    return metrics
  }

  /**
   * Calculate correlations between numeric fields
   * @param {Array} data - Data array
   * @param {Array} numericFields - Array of numeric field names
   * @returns {Object} Correlation matrix
   */
  calculateCorrelations(data, numericFields) {
    const correlations = {}
    
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const field1 = numericFields[i]
        const field2 = numericFields[j]
        
        const correlation = this.calculatePearsonCorrelation(data, field1, field2)
        const key = `${field1}_${field2}`
        
        correlations[key] = {
          field1,
          field2,
          correlation: Number(correlation.toFixed(4)),
          strength: this.interpretCorrelationStrength(correlation)
        }
      }
    }
    
    return correlations
  }

  /**
   * Calculate Pearson correlation coefficient between two fields
   * @param {Array} data - Data array
   * @param {string} field1 - First field name
   * @param {string} field2 - Second field name
   * @returns {number} Correlation coefficient
   */
  calculatePearsonCorrelation(data, field1, field2) {
    const pairs = data
      .filter(record => 
        typeof record[field1] === 'number' && !isNaN(record[field1]) &&
        typeof record[field2] === 'number' && !isNaN(record[field2])
      )
      .map(record => [record[field1], record[field2]])
    
    if (pairs.length < 2) return 0
    
    const n = pairs.length
    const sum1 = pairs.reduce((sum, pair) => sum + pair[0], 0)
    const sum2 = pairs.reduce((sum, pair) => sum + pair[1], 0)
    const sum1Sq = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0)
    const sum2Sq = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0)
    const pSum = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0)
    
    const numerator = pSum - (sum1 * sum2 / n)
    const denominator = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * Interpret correlation strength
   * @param {number} correlation - Correlation coefficient
   * @returns {string} Strength interpretation
   */
  interpretCorrelationStrength(correlation) {
    const abs = Math.abs(correlation)
    if (abs >= 0.8) return 'very strong'
    if (abs >= 0.6) return 'strong'
    if (abs >= 0.4) return 'moderate'
    if (abs >= 0.2) return 'weak'
    return 'very weak'
  }

  /**
   * Generate data processing report
   * @returns {Object} Processing report
   */
  generateProcessingReport() {
    const history = this.processingHistory
    
    if (history.length === 0) {
      return {
        message: 'No data processing history available',
        totalProcessingRuns: 0
      }
    }
    
    const totalRuns = history.length
    const avgProcessingTime = history.reduce((sum, run) => sum + run.processingTime, 0) / totalRuns
    const avgQualityScore = history.reduce((sum, run) => sum + run.qualityScore, 0) / totalRuns
    const totalRecordsProcessed = history.reduce((sum, run) => sum + run.outputRecords, 0)
    
    return {
      totalProcessingRuns: totalRuns,
      averageProcessingTime: Number(avgProcessingTime.toFixed(2)),
      averageQualityScore: Number(avgQualityScore.toFixed(2)),
      totalRecordsProcessed,
      lastProcessingRun: history[history.length - 1],
      qualityTrend: this.calculateQualityTrend()
    }
  }

  /**
   * Calculate quality trend over time
   * @returns {string} Trend direction
   */
  calculateQualityTrend() {
    const history = this.processingHistory
    if (history.length < 2) return 'insufficient data'
    
    const recent = history.slice(-5) // Last 5 runs
    const scores = recent.map(run => run.qualityScore)
    
    const firstScore = scores[0]
    const lastScore = scores[scores.length - 1]
    
    if (lastScore > firstScore + 5) return 'improving'
    if (lastScore < firstScore - 5) return 'declining'
    return 'stable'
  }

  /**
   * Validate data against quality thresholds
   * @param {Object} qualityAssessment - Quality assessment results
   * @returns {Object} Validation results
   */
  validateQuality(qualityAssessment) {
    const validation = {
      passed: true,
      failures: [],
      warnings: []
    }
    
    Object.entries(this.qualityThresholds).forEach(([metric, threshold]) => {
      const score = qualityAssessment[metric]
      
      if (score < threshold) {
        validation.passed = false
        validation.failures.push({
          metric,
          score,
          threshold,
          message: `${metric} score (${score}%) is below threshold (${threshold}%)`
        })
      } else if (score < threshold + 10) {
        validation.warnings.push({
          metric,
          score,
          threshold,
          message: `${metric} score (${score}%) is close to threshold (${threshold}%)`
        })
      }
    })
    
    return validation
  }
}

// Export singleton instance
export const dataProcessor = new DataProcessor()