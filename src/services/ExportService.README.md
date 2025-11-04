# Export Service Documentation

## Overview

The Export Service provides comprehensive PDF report generation and CSV data export functionality for the Government Expense Dashboard. It supports multiple report types, custom templates, and chart capture capabilities.

## Features

### 📄 PDF Report Generation
- Automatic chart capture using html2canvas
- Multi-page support with proper pagination
- Executive summaries and data tables
- Custom report templates for different analysis types
- Metadata inclusion (date ranges, countries, etc.)

### 📊 CSV Data Export
- Flexible column selection
- Custom data formatting
- Proper CSV escaping for special characters
- Support for large datasets

### 🎨 Custom Report Templates
- Pre-built templates for spending, GDP, comparison, and US analysis
- Configurable sections and layouts
- Dynamic summary generation
- Template-based data formatting

## Usage

### Basic PDF Export

```javascript
import { exportService } from '../services/ExportService.js'

const config = {
  type: 'spending',
  data: {
    summary: 'Analysis summary text',
    overview: { totalCountries: 50, totalRecords: 1000 },
    tables: [
      {
        title: 'Country Rankings',
        headers: ['Country', 'Spending', 'Rank'],
        rows: [
          ['USA', '$1.2T', '1'],
          ['Germany', '$500B', '2']
        ]
      }
    ]
  },
  chartElements: [
    document.querySelector('.chart-container'),
    document.querySelector('.analysis-panel')
  ],
  metadata: {
    dateRange: '2020-2021',
    countries: ['USA', 'Germany'],
    generatedBy: 'Dashboard User'
  }
}

const pdfBlob = await exportService.generatePDFReport(config)
exportService.downloadBlob(pdfBlob, 'spending-report.pdf')
```

### Basic CSV Export

```javascript
const data = [
  { country: 'USA', spending: 1200000000000, year: 2020 },
  { country: 'Germany', spending: 500000000000, year: 2020 }
]

const csvBlob = await exportService.exportCSVData(data, {
  filename: 'spending-data.csv',
  columns: ['country', 'spending', 'year'],
  formatter: (row) => ({
    country: row.country,
    spending: row.spending.toLocaleString(),
    year: row.year
  })
})

exportService.downloadBlob(csvBlob, 'spending-data.csv')
```

### Custom Report Creation

```javascript
const template = {
  type: 'spending',
  title: 'Quarterly Spending Analysis',
  sections: ['overview', 'trends', 'comparisons'],
  dateRange: 'Q1 2021',
  countries: ['USA', 'UK', 'Germany']
}

const reportData = {
  overview: { totalCountries: 3, averageSpending: 800000000000 },
  trends: [
    { period: 'Q1', value: 1200000000000, change: 5.2 },
    { period: 'Q2', value: 1260000000000, change: 5.0 }
  ],
  comparisons: [
    { name: 'USA', spending: 1200000000000, rank: 1 },
    { name: 'UK', spending: 600000000000, rank: 2 }
  ]
}

const reportConfig = await exportService.createCustomReport(template, reportData)
const pdfBlob = await exportService.generatePDFReport(reportConfig)
```

## Integration with Components

### ExportButton Component

The `ExportButton` component provides a user-friendly interface for exports:

```javascript
import ExportButton from './ExportButton.jsx'

<ExportButton 
  data={{
    summary: 'Report description',
    csvData: rawDataArray,
    csvColumns: ['col1', 'col2', 'col3'],
    overview: { key: 'value' },
    tables: [/* table data */]
  }}
  chartElements={[
    document.querySelector('.chart1'),
    document.querySelector('.chart2')
  ]}
  reportType="spending"
  metadata={{
    dateRange: '2020-2021',
    countries: ['USA', 'Germany']
  }}
/>
```

### Component Integration Examples

#### SpendingAnalysis Component
```javascript
<ExportButton 
  data={{
    summary: `Government spending analysis covering ${data.expenses?.length || 0} data points`,
    csvData: data.expenses || [],
    csvColumns: ['countryName', 'year', 'expenseCategory', 'value'],
    overview: {
      totalCountries: processedData?.uniqueCountries?.length || 0,
      yearRange: `${yearRange[0]} - ${yearRange[1]}`
    }
  }}
  chartElements={[
    document.querySelector('.insights-panel'),
    document.querySelector('.heatmap-container')
  ]}
  reportType="spending"
  metadata={{
    dateRange: `${yearRange[0]} - ${yearRange[1]}`,
    countries: selectedCountries
  }}
/>
```

## Report Types

### 1. Spending Analysis (`spending`)
- **Sections**: overview, trends, comparisons, insights
- **Focus**: Government spending patterns and analysis
- **Charts**: Spending heatmaps, trend analysis, country comparisons

### 2. GDP Analysis (`gdp`)
- **Sections**: overview, growth, correlations, forecasts
- **Focus**: GDP growth rates and economic indicators
- **Charts**: Growth trends, correlation analysis, regional breakdowns

### 3. Country Comparison (`comparison`)
- **Sections**: overview, rankings, regional, analysis
- **Focus**: Cross-country performance comparisons
- **Charts**: Ranking visualizations, regional analysis, metric comparisons

### 4. US Government Report (`us`)
- **Sections**: overview, departments, trends, breakdown
- **Focus**: Detailed US federal spending analysis
- **Charts**: Department breakdowns, agency analysis, time series

## Configuration Options

### PDF Generation Options
```javascript
{
  type: 'spending|gdp|comparison|us',
  data: {
    summary: 'Executive summary text',
    overview: { /* key metrics */ },
    tables: [{ title, headers, rows }],
    trends: [{ period, value, change }],
    comparisons: [{ name, spending, rank }]
  },
  chartElements: [/* DOM elements */],
  metadata: {
    dateRange: 'YYYY-YYYY',
    countries: ['country1', 'country2'],
    generatedBy: 'User/System name'
  }
}
```

### CSV Export Options
```javascript
{
  filename: 'export-name.csv',
  columns: ['col1', 'col2', 'col3'], // Optional: specific columns
  formatter: (row) => ({ /* transformed row */ }) // Optional: data transformation
}
```

## Error Handling

The service includes comprehensive error handling:

- **PDF Generation Errors**: Graceful fallback for chart capture failures
- **CSV Export Errors**: Validation for empty data and malformed structures
- **Template Errors**: Default templates for missing configurations
- **File Download Errors**: Browser compatibility checks

## Performance Considerations

### Chart Capture Optimization
- Uses `html2canvas` with optimized settings
- Scales images appropriately for PDF size constraints
- Handles large visualizations with memory management

### Large Dataset Handling
- CSV exports support streaming for large datasets
- PDF reports limit table rows to prevent memory issues
- Pagination automatically handles multi-page reports

### Browser Compatibility
- Supports modern browsers with Blob API
- Graceful degradation for older browsers
- File download compatibility across platforms

## Testing

### Unit Tests
Run the export service tests:
```javascript
import { runAllTests } from '../test/exportServiceTest.js'
await runAllTests()
```

### Validation
Validate the implementation:
```javascript
import validateExportService from '../test/validateExportImplementation.js'
await validateExportService()
```

### Manual Testing
1. Load the dashboard in a browser
2. Navigate to any analysis view
3. Click the Export button
4. Test PDF and CSV exports
5. Verify downloaded files

## Dependencies

- **jsPDF**: PDF generation library
- **html2canvas**: Chart capture functionality
- **React**: Component framework
- **D3.js**: Data visualization (for chart elements)

## Troubleshooting

### Common Issues

1. **Charts not appearing in PDF**
   - Ensure chart elements are fully rendered before export
   - Check that DOM elements exist when passed to chartElements

2. **CSV export fails**
   - Verify data array is not empty
   - Check that specified columns exist in data

3. **PDF generation slow**
   - Reduce number of chart elements
   - Optimize chart rendering before capture

4. **Download not working**
   - Check browser popup blockers
   - Verify Blob API support

### Debug Mode
Enable debug logging:
```javascript
// Add to browser console
localStorage.setItem('export-debug', 'true')
```

## Future Enhancements

- **Scheduled Reports**: Automatic report generation
- **Email Integration**: Direct report delivery
- **Cloud Storage**: Save reports to cloud services
- **Advanced Templates**: More customization options
- **Real-time Updates**: Live data in reports