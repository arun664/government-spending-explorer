/**
 * Test file for ExportService functionality
 * Tests PDF generation, CSV export, and custom report creation
 */

import { exportService } from '../services/ExportService.js'

// Mock data for testing
const mockSpendingData = [
  { countryName: 'United States', countryCode: 'USA', region: 'North America', year: 2020, expenseCategory: 'Defense', value: 732000000000 },
  { countryName: 'United States', countryCode: 'USA', region: 'North America', year: 2020, expenseCategory: 'Healthcare', value: 1200000000000 },
  { countryName: 'Germany', countryCode: 'DEU', region: 'Europe', year: 2020, expenseCategory: 'Defense', value: 52000000000 },
  { countryName: 'Germany', countryCode: 'DEU', region: 'Europe', year: 2020, expenseCategory: 'Healthcare', value: 410000000000 }
]

const mockGDPData = [
  { countryName: 'United States', year: 2020, gdpGrowth: -3.4, gdpPerCapita: 63543, totalGDP: 20953030000000 },
  { countryName: 'Germany', year: 2020, gdpGrowth: -4.6, gdpPerCapita: 46259, totalGDP: 3846410000000 }
]

/**
 * Test CSV export functionality
 */
async function testCSVExport() {
  console.log('Testing CSV Export...')
  
  try {
    const csvBlob = await exportService.exportCSVData(mockSpendingData, {
      filename: 'test-spending-data.csv',
      columns: ['countryName', 'countryCode', 'region', 'year', 'expenseCategory', 'value'],
      formatter: (row) => ({
        countryName: row.countryName || '',
        countryCode: row.countryCode || '',
        region: row.region || '',
        year: row.year || '',
        expenseCategory: row.expenseCategory || '',
        value: row.value || 0
      })
    })
    
    console.log('✅ CSV Export successful')
    console.log('CSV Blob size:', csvBlob.size, 'bytes')
    console.log('CSV Blob type:', csvBlob.type)
    
    // Read the CSV content to verify
    const csvText = await csvBlob.text()
    console.log('CSV Content preview:', csvText.substring(0, 200) + '...')
    
    return true
  } catch (error) {
    console.error('❌ CSV Export failed:', error)
    return false
  }
}

/**
 * Test PDF report generation
 */
async function testPDFGeneration() {
  console.log('Testing PDF Generation...')
  
  try {
    const reportConfig = {
      type: 'spending',
      data: {
        summary: 'Test spending analysis covering 4 data points across 2 countries.',
        overview: {
          totalCountries: 2,
          totalRecords: 4,
          yearRange: '2020 - 2020',
          selectedCountries: 'All'
        },
        tables: [
          {
            title: 'Country Spending Summary',
            headers: ['Country', 'Total Spending', 'Categories'],
            rows: [
              ['United States', '$1,932,000,000,000', '2'],
              ['Germany', '$462,000,000,000', '2']
            ]
          }
        ]
      },
      chartElements: [], // No DOM elements in test
      metadata: {
        dateRange: '2020 - 2020',
        countries: ['United States', 'Germany'],
        generatedBy: 'Export Service Test'
      }
    }
    
    const pdfBlob = await exportService.generatePDFReport(reportConfig)
    
    console.log('✅ PDF Generation successful')
    console.log('PDF Blob size:', pdfBlob.size, 'bytes')
    console.log('PDF Blob type:', pdfBlob.type)
    
    return true
  } catch (error) {
    console.error('❌ PDF Generation failed:', error)
    return false
  }
}

/**
 * Test custom report creation
 */
async function testCustomReport() {
  console.log('Testing Custom Report Creation...')
  
  try {
    const template = {
      type: 'spending',
      title: 'Custom Spending Analysis Report',
      sections: ['overview', 'trends', 'comparisons'],
      dateRange: '2020 - 2020',
      countries: ['United States', 'Germany']
    }
    
    const reportData = {
      overview: {
        totalCountries: 2,
        totalRecords: 4,
        averageSpending: 1197000000000
      },
      trends: [
        { period: '2020', value: 1932000000000, change: 0 },
        { period: '2020', value: 462000000000, change: 0 }
      ],
      comparisons: [
        { name: 'United States', spending: 1932000000000, gdpRatio: 9.2, rank: 1 },
        { name: 'Germany', spending: 462000000000, gdpRatio: 12.0, rank: 2 }
      ]
    }
    
    const reportConfig = await exportService.createCustomReport(template, reportData)
    
    console.log('✅ Custom Report Creation successful')
    console.log('Report Config:', {
      type: reportConfig.type,
      title: reportConfig.title,
      hasData: !!reportConfig.data,
      hasMetadata: !!reportConfig.metadata
    })
    
    return true
  } catch (error) {
    console.error('❌ Custom Report Creation failed:', error)
    return false
  }
}

/**
 * Test report templates
 */
function testReportTemplates() {
  console.log('Testing Report Templates...')
  
  try {
    const templates = exportService.getReportTemplates()
    
    console.log('✅ Report Templates retrieved successfully')
    console.log('Available templates:', Object.keys(templates))
    
    // Verify template structure
    Object.entries(templates).forEach(([key, template]) => {
      if (!template.title || !template.sections) {
        throw new Error(`Invalid template structure for ${key}`)
      }
    })
    
    console.log('✅ All templates have valid structure')
    return true
  } catch (error) {
    console.error('❌ Report Templates test failed:', error)
    return false
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Starting Export Service Tests...\n')
  
  const tests = [
    { name: 'Report Templates', test: testReportTemplates },
    { name: 'CSV Export', test: testCSVExport },
    { name: 'Custom Report', test: testCustomReport },
    { name: 'PDF Generation', test: testPDFGeneration }
  ]
  
  const results = []
  
  for (const { name, test } of tests) {
    console.log(`\n--- Testing ${name} ---`)
    const result = await test()
    results.push({ name, passed: result })
  }
  
  console.log('\n📊 Test Results Summary:')
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`)
  })
  
  const passedCount = results.filter(r => r.passed).length
  console.log(`\n${passedCount}/${results.length} tests passed`)
  
  return passedCount === results.length
}

// Export for use in other test files
export { runAllTests, testCSVExport, testPDFGeneration, testCustomReport, testReportTemplates }

// Run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - add to window for manual testing
  window.exportServiceTests = {
    runAllTests,
    testCSVExport,
    testPDFGeneration,
    testCustomReport,
    testReportTemplates
  }
  
  console.log('Export Service Tests loaded. Run window.exportServiceTests.runAllTests() to test.')
}