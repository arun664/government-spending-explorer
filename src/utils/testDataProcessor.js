/**
 * Test utility for data processing functions
 * This file demonstrates and tests the enhanced data processing capabilities
 */

import { dataProcessor } from '../services/DataProcessor.js'
import { loadGDPData } from './dataLoader.js'

/**
 * Generate sample expense data for testing
 * @returns {Array} Sample expense data
 */
function generateSampleExpenseData() {
  const countries = [
    { name: 'United States', code: 'USA' },
    { name: 'Germany', code: 'DEU' },
    { name: 'Japan', code: 'JPN' },
    { name: 'United Kingdom', code: 'GBR' },
    { name: 'France', code: 'FRA' }
  ]
  
  const years = [2018, 2019, 2020, 2021, 2022]
  const data = []
  
  countries.forEach(country => {
    years.forEach(year => {
      // Generate realistic but random data
      const baseSpending = Math.random() * 2000000000000 + 500000000000 // 0.5T to 2.5T
      const population = Math.random() * 300000000 + 50000000 // 50M to 350M
      const gdpGrowth = (Math.random() - 0.5) * 10 // -5% to +5%
      
      data.push({
        countryName: country.name,
        countryCode: country.code,
        year: year,
        totalSpending: baseSpending,
        perCapitaSpending: baseSpending / population,
        gdpGrowth: gdpGrowth,
        gdpRatio: Math.random() * 50 + 10 // 10% to 60%
      })
    })
  })
  
  // Add some problematic data for testing
  data.push(
    // Missing values
    { countryName: 'Test Country 1', countryCode: 'TC1', year: 2020, totalSpending: null, perCapitaSpending: 1000, gdpGrowth: 2.5 },
    // Outlier
    { countryName: 'Test Country 2', countryCode: 'TC2', year: 2020, totalSpending: 50000000000000, perCapitaSpending: 500000, gdpGrowth: 50 },
    // Inconsistent data
    { countryName: '', countryCode: 'TC3', year: 2020, totalSpending: 1000000000, perCapitaSpending: 100, gdpGrowth: 1.5 },
    // Duplicate
    { countryName: 'United States', countryCode: 'USA', year: 2020, totalSpending: 4000000000000, perCapitaSpending: 12000, gdpGrowth: -3.4 }
  )
  
  return data
}

/**
 * Test the data processing capabilities
 * @returns {Promise<Object>} Test results
 */
export async function testDataProcessing() {
  console.log('🧪 Testing Enhanced Data Processing Capabilities...')
  
  try {
    // Generate test data
    const sampleData = generateSampleExpenseData()
    console.log(`📊 Generated ${sampleData.length} sample records`)
    
    // Test data processing
    const processingOptions = {
      cleaning: {
        removeOutliers: true,
        fillMissingValues: true,
        outlierMethod: 'iqr',
        missingValueStrategy: 'median'
      },
      requiredFields: ['countryName', 'countryCode', 'year'],
      numericFields: ['totalSpending', 'perCapitaSpending', 'gdpGrowth', 'gdpRatio']
    }
    
    const result = await dataProcessor.processData(sampleData, processingOptions)
    
    console.log('✅ Data Processing Results:')
    console.log(`   📈 Processed Records: ${result.processedData.length}`)
    console.log(`   🧹 Cleaning Report:`)
    console.log(`      - Original: ${result.cleaningReport.originalCount}`)
    console.log(`      - Cleaned: ${result.cleaningReport.cleanedCount}`)
    console.log(`      - Removed: ${result.cleaningReport.removedCount}`)
    console.log(`      - Outliers: ${result.cleaningReport.outlierCount}`)
    console.log(`      - Missing Values: ${result.cleaningReport.missingValueCount}`)
    
    console.log(`   📊 Quality Assessment:`)
    console.log(`      - Overall Score: ${result.qualityAssessment.overall.score}% (${result.qualityAssessment.overall.grade})`)
    console.log(`      - Completeness: ${result.qualityAssessment.completeness}%`)
    console.log(`      - Accuracy: ${result.qualityAssessment.accuracy}%`)
    console.log(`      - Consistency: ${result.qualityAssessment.consistency}%`)
    console.log(`      - Duplicates: ${result.qualityAssessment.duplicateRecords}`)
    
    console.log(`   📈 Statistical Analysis:`)
    Object.entries(result.statisticalAnalysis).forEach(([field, stats]) => {
      console.log(`      ${field}:`)
      console.log(`        - Mean: ${stats.mean}`)
      console.log(`        - Median: ${stats.median}`)
      console.log(`        - Std Dev: ${stats.standardDeviation}`)
      console.log(`        - Outliers: ${stats.outliers.length}`)
    })
    
    console.log(`   🚨 Anomalies:`)
    console.log(`      - Total: ${result.anomalies.summary.totalAnomalies}`)
    console.log(`      - High Severity: ${result.anomalies.summary.highSeverity}`)
    console.log(`      - Medium Severity: ${result.anomalies.summary.mediumSeverity}`)
    console.log(`      - Low Severity: ${result.anomalies.summary.lowSeverity}`)
    
    console.log(`   🔬 Advanced Metrics:`)
    Object.entries(result.advancedMetrics).forEach(([field, metrics]) => {
      if (field !== 'correlations') {
        console.log(`      ${field}:`)
        console.log(`        - Volatility: ${metrics.volatility}%`)
        console.log(`        - Trend Strength: ${metrics.trendStrength}%`)
        console.log(`        - Anomaly Score: ${metrics.anomalyScore}%`)
      }
    })
    
    console.log(`   🔗 Correlations:`)
    Object.entries(result.advancedMetrics.correlations).forEach(([key, corr]) => {
      console.log(`      ${corr.field1} ↔ ${corr.field2}: ${corr.correlation} (${corr.strength})`)
    })
    
    console.log(`   ⏱️  Processing Time: ${result.processingMetadata.processingTime}ms`)
    
    // Test quality validation
    const validation = dataProcessor.validateQuality(result.qualityAssessment)
    console.log(`   ✅ Quality Validation: ${validation.passed ? 'PASSED' : 'FAILED'}`)
    if (validation.failures.length > 0) {
      console.log(`      Failures: ${validation.failures.length}`)
      validation.failures.forEach(failure => {
        console.log(`        - ${failure.message}`)
      })
    }
    if (validation.warnings.length > 0) {
      console.log(`      Warnings: ${validation.warnings.length}`)
      validation.warnings.forEach(warning => {
        console.log(`        - ${warning.message}`)
      })
    }
    
    // Generate processing report
    const report = dataProcessor.generateProcessingReport()
    console.log(`   📋 Processing Report:`)
    console.log(`      - Total Runs: ${report.totalProcessingRuns}`)
    console.log(`      - Avg Processing Time: ${report.averageProcessingTime}ms`)
    console.log(`      - Avg Quality Score: ${report.averageQualityScore}%`)
    console.log(`      - Quality Trend: ${report.qualityTrend}`)
    
    return {
      success: true,
      result,
      validation,
      report
    }
    
  } catch (error) {
    console.error('❌ Data processing test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test with real GDP data
 * @returns {Promise<Object>} Test results with real data
 */
export async function testWithRealData() {
  console.log('🌍 Testing with Real GDP Data...')
  
  try {
    const gdpData = await loadGDPData()
    console.log(`📊 Loaded ${gdpData.length} GDP records`)
    
    const processingOptions = {
      cleaning: {
        removeOutliers: false, // Keep outliers for real data analysis
        fillMissingValues: true,
        missingValueStrategy: 'median'
      },
      requiredFields: ['countryName', 'countryCode', 'year'],
      numericFields: ['gdpGrowth']
    }
    
    const result = await dataProcessor.processData(gdpData, processingOptions)
    
    console.log('✅ Real Data Processing Results:')
    console.log(`   📈 Processed Records: ${result.processedData.length}`)
    console.log(`   📊 Quality Score: ${result.qualityAssessment.overall.score}% (${result.qualityAssessment.overall.grade})`)
    console.log(`   📈 GDP Growth Statistics:`)
    if (result.statisticalAnalysis.gdpGrowth) {
      const stats = result.statisticalAnalysis.gdpGrowth
      console.log(`      - Mean: ${stats.mean}%`)
      console.log(`      - Median: ${stats.median}%`)
      console.log(`      - Std Dev: ${stats.standardDeviation}%`)
      console.log(`      - Min: ${stats.min}%`)
      console.log(`      - Max: ${stats.max}%`)
      console.log(`      - Outliers: ${stats.outliers.length}`)
    }
    
    return {
      success: true,
      result
    }
    
  } catch (error) {
    console.error('❌ Real data test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Export test functions
export { generateSampleExpenseData }