/**
 * ExportButton - Button with dropdown menu for export formats
 * 
 * Features:
 * - Dropdown menu with PNG, SVG, CSV options
 * - Keyboard accessible
 * - Click outside to close
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import React, { useState, useRef, useEffect } from 'react'

const EXPORT_FORMATS = [
  {
    id: 'png',
    name: 'Export as PNG',
    icon: '🖼️',
    description: 'Image file'
  },
  {
    id: 'svg',
    name: 'Export as SVG',
    icon: '📐',
    description: 'Vector graphic'
  },
  {
    id: 'csv',
    name: 'Export as CSV',
    icon: '📄',
    description: 'Data file'
  },
  {
    id: 'complete',
    name: 'Export Complete View',
    icon: '📋',
    description: 'Full page'
  }
]

const ExportButton = ({ onClick }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleExport = (format) => {
    setIsOpen(false)
    if (onClick) {
      onClick(format)
    }
  }

  return (
    <div className="export-button-container">
      <button
        ref={buttonRef}
        className="export-button"
        onClick={handleToggle}
        aria-label="Export options"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Export data"
      >
        <svg
          className="export-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="export-text">Export</span>
        <svg
          className="dropdown-arrow"
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="export-dropdown"
          role="menu"
          aria-label="Export format options"
        >
          {EXPORT_FORMATS.map(format => (
            <button
              key={format.id}
              className="export-option"
              onClick={() => handleExport(format.id)}
              role="menuitem"
              tabIndex={0}
            >
              <span className="export-option-icon">{format.icon}</span>
              <div className="export-option-info">
                <span className="export-option-name">{format.name}</span>
                <span className="export-option-desc">{format.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExportButton
