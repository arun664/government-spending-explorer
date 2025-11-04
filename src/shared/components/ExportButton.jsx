import React, { useState } from 'react'
import { exportService } from '../../services/ExportService.js'
import '../styles/ExportButton.css'

/**
 * ExportButton component for PDF and CSV exports
 * Provides dropdown menu with export options
 */
const ExportButton = ({ 
  data, 
  chartElements = [], 
  reportType = 'spending',
  metadata = {},
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handlePDFExport = async () => {
    try {
      setIsExporting(true)
      setIsOpen(false)

      // Get chart elements (handle both array and function)
      const elements = typeof chartElements === 'function' ? chartElements() : chartElements

      const config = {
        type: reportType,
        data,
        chartElements: elements,
        metadata: {
          ...metadata,
          dateRange: metadata.dateRange || 'All available data',
          countries: metadata.countries || []
        }
      }

      const pdfBlob = await exportService.generatePDFReport(config)
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
      exportService.downloadBlob(pdfBlob, filename)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCSVExport = async () => {
    try {
      setIsExporting(true)
      setIsOpen(false)

      if (!data.csvData || data.csvData.length === 0) {
        alert('No data available for CSV export')
        return
      }

      const csvBlob = await exportService.exportCSVData(data.csvData, {
        filename: `${reportType}-data-${new Date().toISOString().split('T')[0]}.csv`,
        columns: data.csvColumns,
        formatter: data.csvFormatter
      })

      const filename = `${reportType}-data-${new Date().toISOString().split('T')[0]}.csv`
      exportService.downloadBlob(csvBlob, filename)
    } catch (error) {
      console.error('CSV export failed:', error)
      alert('Failed to export CSV data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCustomReport = async () => {
    try {
      setIsExporting(true)
      setIsOpen(false)

      // Get chart elements (handle both array and function)
      const elements = typeof chartElements === 'function' ? chartElements() : chartElements

      const template = {
        type: reportType,
        title: `Custom ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        sections: ['overview', 'trends', 'comparisons', 'insights'],
        dateRange: metadata.dateRange,
        countries: metadata.countries
      }

      const reportConfig = await exportService.createCustomReport(template, data)
      const pdfBlob = await exportService.generatePDFReport({
        ...reportConfig,
        chartElements: elements
      })

      const filename = `custom-${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
      exportService.downloadBlob(pdfBlob, filename)
    } catch (error) {
      console.error('Custom report generation failed:', error)
      alert('Failed to generate custom report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`export-button-container ${className}`}>
      <button 
        className="export-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        {isExporting ? (
          <span className="export-spinner"></span>
        ) : (
          <>
            <span className="export-icon">📊</span>
            Export
            <span className="dropdown-arrow">▼</span>
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="export-dropdown">
          <button 
            className="export-option"
            onClick={handlePDFExport}
          >
            <span className="option-icon">📄</span>
            PDF Report
            <span className="option-description">
              Complete report with charts and analysis
            </span>
          </button>

          <button 
            className="export-option"
            onClick={handleCSVExport}
            disabled={!data.csvData || data.csvData.length === 0}
          >
            <span className="option-icon">📈</span>
            CSV Data
            <span className="option-description">
              Raw data for further analysis
            </span>
          </button>

          <button 
            className="export-option"
            onClick={handleCustomReport}
          >
            <span className="option-icon">⚙️</span>
            Custom Report
            <span className="option-description">
              Tailored report with selected sections
            </span>
          </button>
        </div>
      )}

      {isOpen && (
        <div 
          className="export-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default ExportButton