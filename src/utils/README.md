# Enhanced Data Processing Utilities

This directory contains enhanced data processing utilities for the Government Expense Dashboard, implementing comprehensive data cleaning, statistical analysis, and quality assessment capabilities.

## Requirements Addressed

- **8.1**: Data cleaning processes to handle missing values, outliers, and inconsistencies
- **8.2**: Statistical metrics including mean, median, standard deviation, and percentiles
- **8.5**: Data quality indicators showing completeness and reliability scores

## Files Overview

### `dataProcessor.js`
Core utility functions for data processing:

#### Data Cleaning Functions
- `cleanData(data, options)` - Enhanced data cleaning with configurable options
- `handleMissingValues()` - Multiple strategies for missing value imputation
- `removeOutliersFromData()` - Outlier removal with multiple detection methods
- `validateDataConsistency()` - Data consistency validation and normalization

#### Statistical Analysis Functions
- `calculateStatistics(values)` - Comprehensive statistical metrics
- `calculatePercentiles()` - Percentile calculations (10th, 25th, 50th, 75th, 90th)
- `calculateSkewness()` - Measure of data asymmetry
- `calculateKurtosis()` - Measure of tail heaviness

#### Outlier Detection Functions
- `detectOutliers(values, method)` - Multiple outlier detection methods
- `detectOutliersIQR()` - Interquartile Range method
- `detectOutliersZScore()` - Z-Score method
- `detectOutliersModifiedZScore()` - Modified Z-Score method (more robust)

#### Data Quality Assessment
- `assessDataQuality(data, requiredFields)` - Comprehensive quality assessment
- Field-level analysis with completeness, uniqueness, and data type detection
- Overall quality scoring with letter grades (A-F)
- Automated recommendations for data quality improvements

#### Advanced Analytics
- `calculateAdvancedMetrics()` - Volatility, trend strength, anomaly scoring
- `identifyAnomalies()` - Anomaly detection with severity classification
- `calculateGrowthRates()` - Year-over-year growth analysis with trend direction

### `dataLoader.js`
Data loading utilities (existing, enhanced for integration):
- `loadGDPData()` - Load GDP data from CSV
- `loadExpenseData()` - Load expense data (placeholder)
- `loadAllData()` - Load all data sources
- Filtering and data manipulation utilities

## Services

### `DataProcessor.js`
High-level service class that orchestrates data processing:

#### Main Processing Method
```javascript
const result = await dataProcessor.processData(rawData, options)
```

**Options:**
```javascript
{
  cleaning: {
    removeOutliers: boolean,
    fillMissingValues: boolean,
    outlierMethod: 'iqr' | 'zscore' | 'modified_zscore',
    missingValueStrategy: 'mean' | 'median' | 'interpolate' | 'zero'
  },
  requiredFields: string[],
  numericFields: string[]
}
```

**Returns:**
```javascript
{
  processedData: Array,           // Cleaned and processed data
  cleaningReport: Object,         // Cleaning statistics
  qualityAssessment: Object,      // Quality metrics and scoring
  statisticalAnalysis: Object,    // Statistical analysis by field
  anomalies: Object,             // Anomaly detection results
  advancedMetrics: Object,       // Advanced analytics
  processingMetadata: Object     // Processing performance metrics
}
```

#### Additional Methods
- `performStatisticalAnalysis()` - Statistical analysis across fields
- `identifyDataAnomalies()` - Multi-field anomaly detection
- `calculateAdvancedAnalytics()` - Advanced metrics calculation
- `calculateCorrelations()` - Cross-field correlation analysis
- `generateProcessingReport()` - Processing history and performance
- `validateQuality()` - Quality validation against thresholds

## Usage Examples

### Basic Data Cleaning
```javascript
import { cleanData } from './utils/dataProcessor.js'

const result = cleanData(rawData, {
  removeOutliers: true,
  fillMissingValues: true,
  missingValueStrategy: 'median'
})

console.log('Cleaned records:', result.cleanedData.length)
console.log('Removed records:', result.cleaningReport.removedCount)
```

### Statistical Analysis
```javascript
import { calculateStatistics } from './utils/dataProcessor.js'

const gdpGrowthValues = [-3.4, -4.9, -8.0, -2.1, -9.8]
const stats = calculateStatistics(gdpGrowthValues)

console.log('Mean:', stats.mean)
console.log('Standard Deviation:', stats.standardDeviation)
console.log('Percentiles:', stats.percentiles)
```

### Comprehensive Processing
```javascript
import { dataProcessor } from './services/DataProcessor.js'

const result = await dataProcessor.processData(rawData, {
  cleaning: { fillMissingValues: true },
  numericFields: ['gdpGrowth', 'totalSpending']
})

console.log('Quality Score:', result.qualityAssessment.overall.score)
console.log('Anomalies Found:', result.anomalies.summary.totalAnomalies)
```

### Data Quality Assessment
```javascript
import { assessDataQuality } from './utils/dataProcessor.js'

const quality = assessDataQuality(data, ['countryName', 'year'])

console.log('Overall Grade:', quality.overall.grade)
console.log('Completeness:', quality.completeness + '%')
console.log('Recommendations:', quality.recommendations)
```

## Data Quality Metrics

### Overall Scoring
- **A (90-100%)**: Excellent data quality
- **B (80-89%)**: Good data quality with minor issues
- **C (70-79%)**: Acceptable quality, some improvements needed
- **D (60-69%)**: Poor quality, significant issues
- **F (<60%)**: Unacceptable quality, major problems

### Quality Dimensions
1. **Completeness**: Percentage of non-missing values
2. **Accuracy**: Percentage of valid/consistent values
3. **Consistency**: Percentage of standardized values
4. **Timeliness**: Recency of data (decreases over time)
5. **Validity**: Percentage of values meeting format requirements
6. **Uniqueness**: Percentage of non-duplicate records

## Outlier Detection Methods

### IQR Method (Default)
- Uses Interquartile Range to identify outliers
- Values outside Q1 - 1.5×IQR or Q3 + 1.5×IQR
- Robust to extreme values

### Z-Score Method
- Uses standard deviations from mean
- Values with |z-score| > 3 are outliers
- Assumes normal distribution

### Modified Z-Score Method
- Uses median and median absolute deviation
- More robust than standard Z-score
- Better for non-normal distributions

## Statistical Metrics

### Basic Statistics
- Mean, Median, Mode
- Standard Deviation, Variance
- Min, Max, Range
- Count of valid values

### Advanced Statistics
- Percentiles (10th, 25th, 50th, 75th, 90th)
- Skewness (measure of asymmetry)
- Kurtosis (measure of tail heaviness)
- Coefficient of Variation

### Correlation Analysis
- Pearson correlation coefficients
- Correlation strength interpretation
- Cross-field relationship analysis

## Performance Considerations

### Optimization Features
- Efficient algorithms for large datasets
- Memory-conscious processing
- Processing time monitoring
- Caching of statistical calculations

### Scalability
- Handles datasets with 10,000+ records
- Streaming-friendly design
- Progressive processing capabilities
- Memory usage optimization

## Error Handling

### Robust Error Management
- Graceful handling of invalid data
- Detailed error reporting
- Fallback strategies for edge cases
- Comprehensive logging

### Data Validation
- Type checking and conversion
- Range validation
- Format consistency checks
- Referential integrity validation

## Testing

### Test Coverage
- Unit tests for all core functions
- Integration tests for service class
- Performance benchmarks
- Edge case validation

### Test Data
- Sample data generation utilities
- Real-world data testing
- Stress testing with large datasets
- Quality validation testing

## Future Enhancements

### Planned Features
- Machine learning-based anomaly detection
- Time series analysis capabilities
- Advanced correlation methods
- Real-time data quality monitoring
- Custom quality rules engine
- Data lineage tracking

### Integration Opportunities
- Export to external analytics tools
- API endpoints for quality metrics
- Dashboard widgets for quality monitoring
- Automated quality alerts