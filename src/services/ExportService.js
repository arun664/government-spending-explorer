import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Export Service for generating PDF reports and CSV data exports
 * Handles chart capture, data formatting, and custom report templates
 */
class ExportService {
  constructor() {
    this.reportTemplates = {
      spending: {
        title: 'Government Spending Analysis Report',
        sections: ['overview', 'trends', 'comparisons', 'insights']
      },
      gdp: {
        title: 'GDP Analysis Report',
        sections: ['overview', 'growth', 'correlations', 'forecasts']
      },
      comparison: {
        title: 'Country Comparison Report',
        sections: ['overview', 'rankings', 'regional', 'analysis']
      },
      us: {
        title: 'US Government Expense Report',
        sections: ['overview', 'departments', 'trends', 'breakdown']
      }
    }
  }

  /**
   * Generate PDF report with charts and analysis
   * @param {Object} config - Report configuration
   * @param {string} config.type - Report type (spending, gdp, comparison, us)
   * @param {Object} config.data - Data to include in report
   * @param {Array} config.chartElements - DOM elements containing charts
   * @param {Object} config.metadata - Report metadata
   * @returns {Promise<Blob>} PDF blob
   */
  async generatePDFReport(config) {
    try {
      const { type, data, chartElements = [], metadata = {} } = config
      const template = this.reportTemplates[type] || this.reportTemplates.spending
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Add title
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text(template.title, margin, yPosition)
      yPosition += 15

      // Add metadata
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const reportDate = new Date().toLocaleDateString()
      pdf.text(`Generated on: ${reportDate}`, margin, yPosition)
      yPosition += 10

      if (metadata.dateRange) {
        pdf.text(`Date Range: ${metadata.dateRange}`, margin, yPosition)
        yPosition += 10
      }

      if (metadata.countries && metadata.countries.length > 0) {
        const countriesText = `Countries: ${metadata.countries.slice(0, 5).join(', ')}${metadata.countries.length > 5 ? '...' : ''}`
        pdf.text(countriesText, margin, yPosition)
        yPosition += 10
      }

      yPosition += 10

      // Add executive summary
      if (data.summary) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Executive Summary', margin, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        const summaryLines = pdf.splitTextToSize(data.summary, pageWidth - 2 * margin)
        pdf.text(summaryLines, margin, yPosition)
        yPosition += summaryLines.length * 5 + 10
      }

      // Add charts
      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i]
        if (!element) continue

        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
          pdf.addPage()
          yPosition = margin
        }

        try {
          // Wait a bit for any animations to complete
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const canvas = await html2canvas(element, {
            scale: 1.5, // Reduced scale for better performance
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false, // Disable logging for cleaner output
            ignoreElements: (element) => {
              // Ignore overlay elements that might interfere
              return element.classList.contains('export-dropdown') || 
                     element.classList.contains('export-overlay') ||
                     element.classList.contains('search-dropdown')
            },
            onclone: (clonedDoc) => {
              // Ensure all SVG elements are visible in the clone
              const svgs = clonedDoc.querySelectorAll('svg')
              svgs.forEach(svg => {
                svg.style.overflow = 'visible'
                svg.style.display = 'block'
              })
              
              // Hide any overlay elements
              const overlays = clonedDoc.querySelectorAll('.export-dropdown, .export-overlay, .search-dropdown')
              overlays.forEach(overlay => {
                overlay.style.display = 'none'
              })
            }
          })

          const imgData = canvas.toDataURL('image/png', 0.9) // Slightly compressed
          const imgWidth = pageWidth - 2 * margin
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          // Ensure image fits on page
          const maxHeight = pageHeight - yPosition - margin
          const finalHeight = Math.min(imgHeight, maxHeight)
          const finalWidth = (finalHeight * canvas.width) / canvas.height

          pdf.addImage(imgData, 'PNG', margin, yPosition, finalWidth, finalHeight)
          yPosition += finalHeight + 10
        } catch (error) {
          console.warn('Failed to capture chart:', error)
          // Add placeholder text instead
          pdf.setFontSize(10)
          pdf.text(`[Chart ${i + 1} - Capture Failed: ${error.message}]`, margin, yPosition)
          yPosition += 10
        }
      }

      // Add data tables
      if (data.tables && data.tables.length > 0) {
        for (const table of data.tables) {
          // Check if we need a new page
          if (yPosition > pageHeight - 50) {
            pdf.addPage()
            yPosition = margin
          }

          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          pdf.text(table.title || 'Data Table', margin, yPosition)
          yPosition += 10

          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')

          // Add table headers
          if (table.headers) {
            const colWidth = (pageWidth - 2 * margin) / table.headers.length
            table.headers.forEach((header, index) => {
              pdf.text(header, margin + index * colWidth, yPosition)
            })
            yPosition += 8
          }

          // Add table rows (limit to prevent overflow)
          if (table.rows) {
            const maxRows = Math.min(table.rows.length, 20)
            for (let i = 0; i < maxRows; i++) {
              const row = table.rows[i]
              const colWidth = (pageWidth - 2 * margin) / row.length
              row.forEach((cell, index) => {
                const cellText = String(cell).substring(0, 15) // Truncate long text
                pdf.text(cellText, margin + index * colWidth, yPosition)
              })
              yPosition += 6
            }
            
            if (table.rows.length > maxRows) {
              pdf.text(`... and ${table.rows.length - maxRows} more rows`, margin, yPosition)
              yPosition += 8
            }
          }
          yPosition += 10
        }
      }

      // Add footer
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10)
      }

      return pdf.output('blob')
    } catch (error) {
      console.error('PDF generation failed:', error)
      throw new Error('Failed to generate PDF report')
    }
  }

  /**
   * Export data as CSV
   * @param {Array} data - Array of objects to export
   * @param {Object} options - Export options
   * @param {string} options.filename - Filename for the export
   * @param {Array} options.columns - Specific columns to include
   * @param {Function} options.formatter - Custom data formatter
   * @returns {Promise<Blob>} CSV blob
   */
  async exportCSVData(data, options = {}) {
    try {
      const { filename = 'export.csv', columns, formatter } = options
      
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      // Apply custom formatter if provided
      const processedData = formatter ? data.map(formatter) : data

      // Determine columns
      const allColumns = columns || Object.keys(processedData[0])
      
      // Create CSV header
      const csvHeader = allColumns.join(',')
      
      // Create CSV rows
      const csvRows = processedData.map(row => {
        return allColumns.map(column => {
          const value = row[column]
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      })

      // Combine header and rows
      const csvContent = [csvHeader, ...csvRows].join('\n')
      
      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    } catch (error) {
      console.error('CSV export failed:', error)
      throw new Error('Failed to export CSV data')
    }
  }

  /**
   * Create custom report based on template
   * @param {Object} template - Report template configuration
   * @param {Object} data - Data for the report
   * @returns {Promise<Object>} Report configuration
   */
  async createCustomReport(template, data) {
    try {
      const reportConfig = {
        type: template.type || 'custom',
        title: template.title || 'Custom Report',
        data: {
          summary: this.generateSummary(data, template.type),
          tables: this.formatDataTables(data, template.sections),
          ...data
        },
        metadata: {
          dateRange: template.dateRange,
          countries: template.countries,
          generatedAt: new Date().toISOString()
        }
      }

      return reportConfig
    } catch (error) {
      console.error('Custom report creation failed:', error)
      throw new Error('Failed to create custom report')
    }
  }

  /**
   * Generate executive summary based on data and report type
   * @param {Object} data - Report data
   * @param {string} type - Report type
   * @returns {string} Generated summary
   */
  generateSummary(data, type) {
    switch (type) {
      case 'spending':
        return this.generateSpendingSummary(data)
      case 'gdp':
        return this.generateGDPSummary(data)
      case 'comparison':
        return this.generateComparisonSummary(data)
      case 'us':
        return this.generateUSSummary(data)
      default:
        return 'This report provides an analysis of government financial data with key insights and trends.'
    }
  }

  generateSpendingSummary(data) {
    const totalCountries = data.countries?.length || 0
    const avgSpending = data.averageSpending || 0
    const topSpender = data.topSpender || 'N/A'
    
    return `This spending analysis covers ${totalCountries} countries with an average government spending of $${avgSpending.toLocaleString()} per capita. ${topSpender} shows the highest spending levels in the analyzed period.`
  }

  generateGDPSummary(data) {
    const avgGrowth = data.averageGrowth || 0
    const totalCountries = data.countries?.length || 0
    
    return `GDP analysis for ${totalCountries} countries shows an average growth rate of ${avgGrowth.toFixed(2)}%. The analysis includes correlations between GDP performance and government spending patterns.`
  }

  generateComparisonSummary(data) {
    const countries = data.countries || []
    const topPerformer = countries[0]?.name || 'N/A'
    
    return `Comparative analysis across ${countries.length} countries reveals significant variations in spending efficiency and economic performance. ${topPerformer} leads in key performance indicators.`
  }

  generateUSSummary(data) {
    const totalSpending = data.totalSpending || 0
    const departments = data.departments?.length || 0
    
    return `US government spending analysis shows total expenditure of $${totalSpending.toLocaleString()} across ${departments} major departments. The report includes detailed breakdowns by agency and spending category.`
  }

  /**
   * Format data into tables for PDF reports
   * @param {Object} data - Raw data
   * @param {Array} sections - Report sections to include
   * @returns {Array} Formatted tables
   */
  formatDataTables(data, sections) {
    const tables = []

    if (sections.includes('overview') && data.overview) {
      tables.push({
        title: 'Overview Statistics',
        headers: ['Metric', 'Value'],
        rows: Object.entries(data.overview).map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          typeof value === 'number' ? value.toLocaleString() : value
        ])
      })
    }

    if (sections.includes('trends') && data.trends) {
      tables.push({
        title: 'Trend Analysis',
        headers: ['Period', 'Value', 'Change'],
        rows: data.trends.map(trend => [
          trend.period,
          trend.value?.toLocaleString() || 'N/A',
          trend.change ? `${trend.change > 0 ? '+' : ''}${trend.change.toFixed(2)}%` : 'N/A'
        ])
      })
    }

    if (sections.includes('comparisons') && data.comparisons) {
      tables.push({
        title: 'Country Comparisons',
        headers: ['Country', 'Spending', 'GDP Ratio', 'Rank'],
        rows: data.comparisons.slice(0, 15).map(country => [
          country.name,
          country.spending?.toLocaleString() || 'N/A',
          country.gdpRatio ? `${country.gdpRatio.toFixed(2)}%` : 'N/A',
          country.rank || 'N/A'
        ])
      })
    }

    return tables
  }

  /**
   * Download blob as file
   * @param {Blob} blob - File blob
   * @param {string} filename - Filename
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Get available report templates
   * @returns {Object} Available templates
   */
  getReportTemplates() {
    return { ...this.reportTemplates }
  }
}

export const exportService = new ExportService()
export default ExportService