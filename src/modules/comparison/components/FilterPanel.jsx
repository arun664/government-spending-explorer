/**
 * FilterPanel - Modal/drawer with filter controls
 * 
 * Features:
 * - Region filter (same regions as Spending module)
 * - Income level filter
 * - Data availability filter
 * - Shows filtered country count
 * - Apply/Reset buttons
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import { useState, useEffect, useRef } from 'react'
import { REGIONS } from '../../../utils/regionMapping.js'
import FocusTrap from './FocusTrap.jsx'
import '../styles/FilterPanel.css'

const INCOME_LEVELS = [
  { id: 'high', label: 'High Income' },
  { id: 'upper-middle', label: 'Upper Middle Income' },
  { id: 'lower-middle', label: 'Lower Middle Income' },
  { id: 'low', label: 'Low Income' }
]

const DATA_AVAILABILITY_OPTIONS = [
  { id: 'all', label: 'All Countries' },
  { id: 'complete', label: 'Complete Data Only' },
  { id: 'partial', label: 'Partial Data' }
]

const FilterPanel = ({ isOpen, onClose, currentFilters, onApply, filteredCount, totalCount }) => {
  const [localFilters, setLocalFilters] = useState({
    regions: [],
    incomeLevel: [],
    dataAvailability: 'all'
  })

  const panelRef = useRef(null)

  // Initialize local filters from current filters
  useEffect(() => {
    if (currentFilters) {
      setLocalFilters({
        regions: currentFilters.regions || [],
        incomeLevel: currentFilters.incomeLevel || [],
        dataAvailability: currentFilters.dataAvailability || 'all'
      })
    }
  }, [currentFilters, isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Trap focus within panel
      panelRef.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Close on backdrop click
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  // Handle region toggle
  const handleRegionToggle = (region) => {
    setLocalFilters(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region]
    }))
  }

  // Handle income level toggle
  const handleIncomeLevelToggle = (level) => {
    setLocalFilters(prev => ({
      ...prev,
      incomeLevel: prev.incomeLevel.includes(level)
        ? prev.incomeLevel.filter(l => l !== level)
        : [...prev.incomeLevel, level]
    }))
  }

  // Handle data availability change
  const handleDataAvailabilityChange = (availability) => {
    setLocalFilters(prev => ({
      ...prev,
      dataAvailability: availability
    }))
  }

  // Handle apply filters
  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  // Handle reset filters
  const handleReset = () => {
    const resetFilters = {
      regions: [],
      incomeLevel: [],
      dataAvailability: 'all'
    }
    setLocalFilters(resetFilters)
    onApply(resetFilters)
  }

  // Count active filters
  const activeFilterCount = 
    localFilters.regions.length + 
    localFilters.incomeLevel.length + 
    (localFilters.dataAvailability !== 'all' ? 1 : 0)

  if (!isOpen) return null

  return (
    <div 
      className="filter-panel-backdrop" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-panel-title"
    >
      <FocusTrap active={isOpen}>
        <div 
          ref={panelRef}
          className="filter-panel"
          tabIndex={-1}
        >
        {/* Header */}
        <div className="filter-panel-header">
          <h2 id="filter-panel-title" className="filter-panel-title">
            Filter Countries
          </h2>
          <button
            className="filter-panel-close"
            onClick={onClose}
            aria-label="Close filter panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Filter Content */}
        <div className="filter-panel-content">
          {/* Region Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Region</h3>
            <div className="filter-options">
              {Object.values(REGIONS).map(region => (
                <label key={region} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={localFilters.regions.includes(region)}
                    onChange={() => handleRegionToggle(region)}
                    className="filter-checkbox"
                  />
                  <span className="filter-checkbox-text">{region}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Income Level Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Income Level</h3>
            <div className="filter-options">
              {INCOME_LEVELS.map(level => (
                <label key={level.id} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={localFilters.incomeLevel.includes(level.id)}
                    onChange={() => handleIncomeLevelToggle(level.id)}
                    className="filter-checkbox"
                  />
                  <span className="filter-checkbox-text">{level.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Data Availability Filter */}
          <div className="filter-section">
            <h3 className="filter-section-title">Data Availability</h3>
            <div className="filter-options">
              {DATA_AVAILABILITY_OPTIONS.map(option => (
                <label key={option.id} className="filter-radio-label">
                  <input
                    type="radio"
                    name="dataAvailability"
                    checked={localFilters.dataAvailability === option.id}
                    onChange={() => handleDataAvailabilityChange(option.id)}
                    className="filter-radio"
                  />
                  <span className="filter-radio-text">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter Summary */}
          <div className="filter-summary">
            <div className="filter-summary-item">
              <span className="filter-summary-label">Active Filters:</span>
              <span className="filter-summary-value">{activeFilterCount}</span>
            </div>
            {filteredCount !== undefined && totalCount !== undefined && (
              <div className="filter-summary-item">
                <span className="filter-summary-label">Countries:</span>
                <span className="filter-summary-value">
                  {filteredCount} of {totalCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="filter-panel-footer">
          <button
            className="filter-button-reset"
            onClick={handleReset}
            disabled={activeFilterCount === 0}
          >
            Reset All
          </button>
          <button
            className="filter-button-apply"
            onClick={handleApply}
          >
            Apply Filters
          </button>
        </div>
        </div>
      </FocusTrap>
    </div>
  )
}

export default FilterPanel
