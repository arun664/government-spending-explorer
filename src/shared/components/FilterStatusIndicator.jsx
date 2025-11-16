import React, { useState, useEffect } from 'react'
import { filterStateManager } from '../services/FilterStateManager.js'
import './FilterStatusIndicator.css'

/**
 * FilterStatusIndicator Component
 * Displays active filter count and incompatible filter warnings
 * Shows visual indicators for filter state across modules
 */
const FilterStatusIndicator = ({ module }) => {
  const [activeCount, setActiveCount] = useState(0)
  const [incompatibleFilters, setIncompatibleFilters] = useState([])
  const [showIncompatibleWarning, setShowIncompatibleWarning] = useState(false)

  useEffect(() => {
    // Update active filter count
    const updateCount = () => {
      const count = filterStateManager.getActiveFilterCount(module)
      setActiveCount(count)
    }

    // Check for incompatible filters
    const checkIncompatible = () => {
      const incompatible = filterStateManager.getIncompatibleFilters()
      setIncompatibleFilters(incompatible)
      if (incompatible.length > 0) {
        setShowIncompatibleWarning(true)
      }
    }

    // Initial update
    updateCount()
    checkIncompatible()

    // Subscribe to filter changes
    const unsubscribe = filterStateManager.subscribe(() => {
      updateCount()
      checkIncompatible()
    }, module)

    return unsubscribe
  }, [module])

  const handleDismissWarning = () => {
    setShowIncompatibleWarning(false)
    filterStateManager.clearIncompatibleFilters()
  }

  if (activeCount === 0 && !showIncompatibleWarning) {
    return null
  }

  return (
    <div className="filter-status-indicator">
      {/* Active Filters Badge */}
      {activeCount > 0 && (
        <div className="active-filters-badge">
          <span className="badge-icon">🔍</span>
          <span className="badge-text">
            {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
          </span>
        </div>
      )}

      {/* Incompatible Filters Warning */}
      {showIncompatibleWarning && incompatibleFilters.length > 0 && (
        <div className="incompatible-filters-warning">
          <div className="warning-header">
            <span className="warning-icon">⚠️</span>
            <span className="warning-title">Some filters were adjusted</span>
            <button 
              className="dismiss-btn"
              onClick={handleDismissWarning}
              title="Dismiss"
            >
              ×
            </button>
          </div>
          <div className="warning-content">
            <p className="warning-message">
              The following filters are not supported in the {module} module:
            </p>
            <ul className="incompatible-list">
              {incompatibleFilters.map((filter, index) => (
                <li key={index} className="incompatible-item">
                  <strong>{formatFilterName(filter.name)}:</strong> {filter.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Format filter name for display
 */
const formatFilterName = (name) => {
  const nameMap = {
    'sectors': 'Government Sectors',
    'categories': 'Indicator Categories',
    'valueRange': 'Value Range',
    'gdpRange': 'GDP Growth Range',
    'yearRange': 'Year Range'
  }
  return nameMap[name] || name
}

export default FilterStatusIndicator
