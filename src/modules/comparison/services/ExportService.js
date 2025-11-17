/**
 * ExportService - Service for exporting charts and data in various formats
 * 
 * Features:
 * - Export as PNG using html2canvas
 * - Export as SVG by serializing SVG elements
 * - Export as CSV for data analysis
 * - Export complete view including all components
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import html2canvas from 'html2canvas'

class ExportService {
  /**
   * Export element as PNG image
   * @param {HTMLElement} element - DOM element to export
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<void>}
   */
  async exportPNG(element, filename = 'comparison-chart') {
    try {
      if (!element) {
        throw new Error('Element not found for PNG export')
      }

      // Create canvas from element
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        this.downloadBlob(blob, `${filename}.png`)
      }, 'image/png')

    } catch (error) {
      console.error('PNG export failed:', error)
      throw new Error(`Failed to export PNG: ${error.message}`)
    }
  }

  /**
   * Export SVG element as SVG file
   * @param {SVGElement} svgElement - SVG element to export
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<void>}
   */
  async exportSVG(svgElement, filename = 'comparison-chart') {
    try {
      if (!svgElement || svgElement.tagName !== 'svg') {
        throw new Error('Valid SVG element not found for SVG export')
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true)

      // Add XML namespace if not present
      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      }

      // Serialize SVG to string
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(clonedSvg)

      // Add XML declaration
      const svgBlob = new Blob(
        ['<?xml version="1.0" encoding="UTF-8"?>\n', svgString],
        { type: 'image/svg+xml;charset=utf-8' }
      )

      this.downloadBlob(svgBlob, `${filename}.svg`)

    } catch (error) {
      console.error('SVG export failed:', error)
      throw new Error(`Failed to export SVG: ${error.message}`)
    }
  }

  /**
   * Export data as CSV file
   * @param {Array} data - Array of data objects
   * @param {string} filename - Output filename (without extension)
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  async exportCSV(data, filename = 'comparison-data', options = {}) {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for CSV export')
      }

      const {
        columns = null, // Specific columns to export (null = all)
        includeHeaders = true
      } = options

      // Determine columns
      const allColumns = columns || Object.keys(data[0])

      // Build CSV content
      let csvContent = ''

      // Add headers
      if (includeHeaders) {
        csvContent += allColumns.map(col => this.escapeCSVValue(col)).join(',') + '\n'
      }

      // Add data rows
      data.forEach(row => {
        const values = allColumns.map(col => {
          const value = row[col]
          return this.escapeCSVValue(value)
        })
        csvContent += values.join(',') + '\n'
      })

      // Create blob and download
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      this.downloadBlob(csvBlob, `${filename}.csv`)

    } catch (error) {
      console.error('CSV export failed:', error)
      throw new Error(`Failed to export CSV: ${error.message}`)
    }
  }

  /**
   * Export complete view including chart, metrics, and sidebar
   * @param {HTMLElement} container - Container element with all components
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<void>}
   */
  async exportCompleteView(container, filename = 'comparison-complete') {
    try {
      if (!container) {
        throw new Error('Container not found for complete view export')
      }

      // Use PNG export for complete view
      await this.exportPNG(container, filename)

    } catch (error) {
      console.error('Complete view export failed:', error)
      throw new Error(`Failed to export complete view: ${error.message}`)
    }
  }

  /**
   * Escape CSV value to handle commas, quotes, and newlines
   * @param {*} value - Value to escape
   * @returns {string} Escaped value
   */
  escapeCSVValue(value) {
    if (value === null || value === undefined) {
      return ''
    }

    const stringValue = String(value)

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
  }

  /**
   * Download blob as file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename with extension
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up URL object
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  /**
   * Get current timestamp for filename
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date()
    return now.toISOString().replace(/[:.]/g, '-').slice(0, -5)
  }

  /**
   * Export with timestamp in filename
   * @param {string} format - Export format (png, svg, csv, complete)
   * @param {*} target - Target element or data
   * @param {string} baseName - Base filename
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  async exportWithTimestamp(format, target, baseName = 'comparison', options = {}) {
    const filename = `${baseName}_${this.getTimestamp()}`

    switch (format) {
      case 'png':
        return this.exportPNG(target, filename)
      case 'svg':
        return this.exportSVG(target, filename)
      case 'csv':
        return this.exportCSV(target, filename, options)
      case 'complete':
        return this.exportCompleteView(target, filename)
      default:
        throw new Error(`Unknown export format: ${format}`)
    }
  }
}

// Export singleton instance
export const exportService = new ExportService()
export default exportService
