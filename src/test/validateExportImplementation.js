/**
 * Validation script for Export System implementation
 * Tests the core functionality without requiring DOM elements
 */

// Mock jsPDF and html2canvas for testing
const mockJsPDF = {
  internal: {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297
    },
    getNumberOfPages: () => 1
  },
  setFontSize: () => {},
  setFont: () => {},
  text: () => {},
  splitTextToSize: (text, width) => [text],
  addPage: () => {},
  addImage: () => {},
  setPage: () => {},
  output: (type) => new Blob(['mock-pdf-content'], { type: 'application/pdf' })
}

const mockHtml2Canvas = () => Promise.resolve({
  toDataURL: () => 'data:image/png;base64,mock-image-data',
  width: 800,
  height: 600
})

// Mock the dependencies
global.jsPDF = function() { return mockJsPDF }
global.html2canvas = mockHtml2Canvas

// Import the service after mocking
import ExportService from '../services/ExportService.js'

async function validateExportService() {
  console.log('🧪 Validating Export Service Implementation...\n')
  
  const exportService = new ExportService()
  let allTestsPassed = true
  
  // Test 1: Service instantiation
  console.log('1. Testing service instantiation...')
  try {
    if (!exportService) {
      throw new Error('ExportService failed to instantiate')
    }
    console.log('✅ ExportService instantiated successfully')
  } catch (error) {
    console.error('❌ Service instantiation failed:', error.message)
    allTestsPassed = false
  }
  
  // Test 2: Report templates
  console.log('\n2. Testing report templates...')
  try {
    const templates = exportService.getReportTemplates()
    const expectedTemplates = ['spending', 'gdp', 'comparison', 'us']
    
    for (const templateType of expectedTemplates) {
      if (!templates[templateType]) {
        throw new Error(`Missing template: ${templateType}`)
      }
      if (!templates[templateType].title || !templates[templateType].sections) {
        throw new Error(`Invalid template structure: ${templateType}`)
      }
    }
    console.log('✅ All report templates are valid')
  } catch (error) {
    console.error('❌ Report templates test failed:', error.message)
    allTestsPassed = false
  }
  
  // Test 3: CSV export
  console.log('\n3. Testing CSV export...')
  try {
    const testData = [
      { country: 'USA', spending: 1000000, year: 2020 },
      { country: 'Germany', spending: 500000, year: 2020 }
    ]
    
    const csvBlob = await exportService.exportCSVData(testData, {
      filename: 'test.csv',
      columns: ['country', 'spending', 'year']
    })
    
    if (!(csvBlob instanceof Blob)) {
      throw new Error('CSV export did not return a Blob')
    }
    
    if (csvBlob.type !== 'text/csv;charset=utf-8;') {
      throw new Error('CSV blob has incorrect MIME type')
    }
    
    const csvText = await csvBlob.text()
    if (!csvText.includes('country,spending,year')) {
      throw new Error('CSV header is incorrect')
    }
    
    console.log('✅ CSV export working correctly')
  } catch (error) {
    console.error('❌ CSV export test failed:', error.message)
    allTestsPassed = false
  }
  
  // Test 4: Custom report creation
  console.log('\n4. Testing custom report creation...')
  try {
    const template = {
      type: 'spending',
      title: 'Test Report',
      sections: ['overview', 'trends'],
      dateRange: '2020-2021',
      countries: ['USA', 'Germany']
    }
    
    const data = {
      overview: { totalCountries: 2, totalRecords: 100 },
      trends: [{ period: '2020', value: 1000000, change: 5.2 }]
    }
    
    const reportConfig = await exportService.createCustomReport(template, data)
    
    if (!reportConfig.type || !reportConfig.data || !reportConfig.metadata) {
      throw new Error('Custom report config is incomplete')
    }
    
    console.log('✅ Custom report creation working correctly')
  } catch (error) {
    console.error('❌ Custom report creation test failed:', error.message)
    allTestsPassed = false
  }
  
  // Test 5: Summary generation
  console.log('\n5. Testing summary generation...')
  try {
    const testData = { countries: ['USA', 'Germany'], averageSpending: 750000, topSpender: 'USA' }
    const summary = exportService.generateSummary(testData, 'spending')
    
    if (!summary || typeof summary !== 'string' || summary.length < 10) {
      throw new Error('Generated summary is invalid')
    }
    
    console.log('✅ Summary generation working correctly')
  } catch (error) {
    console.error('❌ Summary generation test failed:', error.message)
    allTestsPassed = false
  }
  
  // Test 6: Data table formatting
  console.log('\n6. Testing data table formatting...')
  try {
    const testData = {
      overview: { totalCountries: 2, totalRecords: 100 },
      trends: [{ period: '2020', value: 1000000, change: 5.2 }],
      comparisons: [{ name: 'USA', spending: 1000000, gdpRatio: 20.5, rank: 1 }]
    }
    
    const tables = exportService.formatDataTables(testData, ['overview', 'trends', 'comparisons'])
    
    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error('Data table formatting failed')
    }
    
    for (const table of tables) {
      if (!table.title || !table.headers || !table.rows) {
        throw new Error('Table structure is invalid')
      }
    }
    
    console.log('✅ Data table formatting working correctly')
  } catch (error) {
    console.error('❌ Data table formatting test failed:', error.message)
    allTestsPassed = false
  }
  
  // Final result
  console.log('\n📊 Validation Results:')
  if (allTestsPassed) {
    console.log('✅ All export service tests passed!')
    console.log('🎉 Export system implementation is working correctly')
  } else {
    console.log('❌ Some tests failed')
    console.log('⚠️  Export system may have issues')
  }
  
  return allTestsPassed
}

// Export for use in other files
export { validateExportService }

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  window.validateExportImplementation = validateExportService
  console.log('Export validation loaded. Run window.validateExportImplementation() to test.')
}

export default validateExportService