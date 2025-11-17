/**
 * ExportMenu - Dropdown menu with export format options
 * 
 * Features:
 * - PNG, SVG, CSV, Complete View options
 * - Export progress/spinner
 * - Success/error toast notifications
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { useState } from 'react'
import exportService from '../services/ExportService.js'

const EXPORT_OPTIONS = [
  {
    id: 'png',
    name: 'Export as PNG',
    icon: '🖼️',
    description: 'Image file for presentations'
  },
  {
    id: 'svg',
    name: 'Export as SVG',
    icon: '📐',
    description: 'Vector graphic for editing'
  },
  {
    id: 'csv',
    name: 'Export as CSV',
    icon: '📄',
    description: 'Data file for analysis'
  },
  {
    id: 'complete',
    name: 'Export Complete View',
    icon: '📋',
    description: 'Full page with all components'
  }
]

const ExportMenu = ({ chartRef, dataRef, containerRef }) => {
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Handle export
  const handleExport = async (format) => {
    setExporting(true)

    try {
      switch (format) {
        case 'png': {
          const element = chartRef?.current || containerRef?.current
          if (!element) {
            throw new Error('Chart element not found')
          }
          await exportService.exportWithTimestamp('png', element, 'comparison-chart')
          showToast('Chart exported as PNG successfully', 'success')
          break
        }

        case 'svg': {
          const svgElement = chartRef?.current?.querySelector('svg')
          if (!svgElement) {
            throw new Error('SVG element not found')
          }
          await exportService.exportWithTimestamp('svg', svgElement, 'comparison-chart')
          showToast('Chart exported as SVG successfully', 'success')
          break
        }

        case 'csv': {
          const data = dataRef?.current
          if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('No data available for export')
          }
          await exportService.exportWithTimestamp('csv', data, 'comparison-data')
          showToast('Data exported as CSV successfully', 'success')
          break
        }

        case 'complete': {
          const element = containerRef?.current
          if (!element) {
            throw new Error('Container element not found')
          }
          await exportService.exportWithTimestamp('complete', element, 'comparison-complete')
          showToast('Complete view exported successfully', 'success')
          break
        }

        default:
          throw new Error(`Unknown export format: ${format}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      showToast(error.message || 'Export failed', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      {/* Export Options (rendered by ExportButton) */}
      {EXPORT_OPTIONS.map(option => (
        <button
          key={option.id}
          className="export-option"
          onClick={() => handleExport(option.id)}
          disabled={exporting}
          role="menuitem"
          tabIndex={0}
        >
          <span className="export-option-icon">{option.icon}</span>
          <div className="export-option-info">
            <span className="export-option-name">{option.name}</span>
            <span className="export-option-desc">{option.description}</span>
          </div>
        </button>
      ))}

      {/* Export Progress Spinner */}
      {exporting && (
        <div className="export-spinner-overlay">
          <div className="export-spinner">
            <div className="spinner-circle"></div>
            <span className="spinner-text">Exporting...</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`export-toast export-toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </>
  )
}

export default ExportMenu
export { EXPORT_OPTIONS }
