/**
 * Example usage of enhanced data processing utilities
 * This demonstrates how to use the new data processing capabilities
 * 
 * Requirements addressed:
 * - 8.1: Data cleaning processes to handle missing values, outliers, and inconsistencies
 * - 8.2: Statistical metrics including mean, median, standard deviation, and percentiles
 * - 8.5: Data quality indicators showing completeness and reliability scores
 */

import { dataProcessor } from '../services/DataProcessor.js'
import { 
  cleanData, 
  calculateStatistics, 
  detectOutliers, 
  assessDataQuality 
} from '../utils/dataProcessor.js'

/**
 * Example: Basic data cleaning
 */
export function exampleDataCleaning() {
  const rawData = [
    { countryName: 'United States', countryCode: 'USA', year: 2020, gdpGrowth: -3.4 },
    { countryName: 'Germany', countryCode: 'DEU', year: 2020, gdpGrowth: -4.9 },
    { countryName: '', countryCode: 'FRA', year: 2020, gdpGrowth: -8.0 }, // Missing country name
    { countryName: 'Japan', countryCode: 'JPN', year: 2020, gdpGrowth: null }, // Missing GDP growth
    { countryName: 'United Kingdom', countryCode: 'GBR', year: 2020, gdpGrowth: -9.8 }
  ]
  
  const cleaningOptions = {
    removeOutliers: false,
    fillMissingValues: true,
    missingValueStrategy: 'median'
  }
  
  const result = cleanData(rawData, cleaningOptions)
  
  console.log('Data Cleaning Example:')
  console.log('Original records:', result.cleaningReport.originalCount)
  console.log('Cleaned records:', result.cleaningReport.cleanedCount)
  console.log('Removed records:', result.cleaningReport.removedCount)
  
  return result
}

/**
 * Example: Statistical analysis
 */
export function exampleStatisticalAnalysis() {
  const gdpGrowthData = [-3.4, -4.9, -8.0, -2.1, -9.8, 1.2, 2.5, -1.1, 0.8, -5.2]
  
  const statistics = calculateStatistics(gdpGrowthData)
  
  console.log('Statistical Analysis Example:')
  console.log('Mean:', statistics.mean)
  console.log('Median:', statistics.median)
  console.log('Standard Deviation:', statistics.standardDeviation)
  console.log('Percentiles:', statistics.percentiles)
  console.log('Skewness:', statistics.skewness)
  console.log('Kurtosis:', statistics.kurtosis)
  
  return statistics
}

/**
 * Example: Outlier detection
 */
export function exampleOutlierDetection() {
  const spendingData = [
    1000000000, 1200000000, 950000000, 1100000000, 1050000000,
    50000000000, // Outlier - extremely high
    1150000000, 980000000, 1080000000, 1020000000
  ]
  
  const outliers = detectOutliers(spendingData, 'iqr')
  
  console.log('Outlier Detection Example:')
  console.log('Data points:', spendingData.length)
  console.log('Outliers found:', outliers.length)
  console.log('Outlier values:', outliers)
  
  return outliers
}

/**
 * Example: Data quality assessment
 */
export function exampleDataQualityAssessment() {
  const testData = [
    { countryName: 'United States', countryCode: 'USA', year: 2020, gdpGrowth: -3.4, totalSpending: 4000000000000 },
    { countryName: 'Germany', countryCode: 'DEU', year: 2020, gdpGrowth: -4.9, totalSpending: 1500000000000 },
    { countryName: 'Japan', countryCode: 'JPN', year: 2020, gdpGrowth: -2.1, totalSpending: null }, // Missing value
    { countryName: 'United Kingdom', countryCode: 'GBR', year: 2020, gdpGrowth: -9.8, totalSpending: 800000000000 },
    { countryName: 'United States', countryCode: 'USA', year: 2020, gdpGrowth: -3.4, totalSpending: 4000000000000 } // Duplicate
  ]
  
  const qualityAssessment = assessDataQuality(testData, ['countryName', 'countryCode', 'year'])
  
  console.log('Data Quality Assessment Example:')
  console.log('Overall Score:', qualityAssessment.overall.score, qualityAssessment.overall.grade)
  console.log('Completeness:', qualityAssessment.completeness + '%')
  console.log('Accuracy:', qualityAssessment.accuracy + '%')
  console.log('Consistency:', qualityAssessment.consistency + '%')
  console.log('Duplicate Records:', qualityAssessment.duplicateRecords)
  console.log('Recommendations:', qualityAssessment.recommendations)
  
  return qualityAssessment
}

/**
 * Example: Comprehensive data processing
 */
export async function exampleComprehensiveProcessing() {
  const sampleData = [
    { countryName: 'United States', countryCode: 'USA', year: 2020, gdpGrowth: -3.4, totalSpending: 4000000000000, perCapitaSpending: 12000 },
    { countryName: 'Germany', countryCode: 'DEU', year: 2020, gdpGrowth: -4.9, totalSpending: 1500000000000, perCapitaSpending: 18000 },
    { countryName: 'Japan', countryCode: 'JPN', year: 2020, gdpGrowth: -2.1, totalSpending: 2000000000000, perCapitaSpending: 16000 },
    { countryName: 'United Kingdom', countryCode: 'GBR', year: 2020, gdpGrowth: -9.8, totalSpending: 800000000000, perCapitaSpending: 12000 },
    { countryName: 'France', countryCode: 'FRA', year: 2020, gdpGrowth: -8.0, totalSpending: 1200000000000, perCapitaSpending: 18000 }
  ]
  
  const processingOptions = {
    cleaning: {
      removeOutliers: false,
      fillMissingValues: true,
      missingValueStrategy: 'median'
    },
    requiredFields: ['countryName', 'countryCode', 'year'],
    numericFields: ['gdpGrowth', 'totalSpending', 'perCapitaSpending']
  }
  
  const result = await dataProcessor.processData(sampleData, processingOptions)
  
  console.log('Comprehensive Processing Example:')
  console.log('Processing Time:', result.processingMetadata.processingTime + 'ms')
  console.log('Quality Score:', result.qualityAssessment.overall.score + '%')
  console.log('Statistical Analysis Available for:', Object.keys(result.statisticalAnalysis))
  console.log('Correlations Found:', Object.keys(result.advancedMetrics.correlations).length)
  
  return result
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🚀 Running Data Processing Examples...\n')
  
  console.log('1. Data Cleaning:')
  exampleDataCleaning()
  console.log('')
  
  console.log('2. Statistical Analysis:')
  exampleStatisticalAnalysis()
  console.log('')
  
  console.log('3. Outlier Detection:')
  exampleOutlierDetection()
  console.log('')
  
  console.log('4. Data Quality Assessment:')
  exampleDataQualityAssessment()
  console.log('')
  
  console.log('5. Comprehensive Processing:')
  exampleComprehensiveProcessing().then(() => {
    console.log('\n✅ All examples completed successfully!')
  })
}