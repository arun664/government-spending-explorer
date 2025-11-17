/**
 * ComparisonHeader - Collapsible header with navigation controls
 * 
 * Features:
 * - Hamburger menu for collapse/expand
 * - Chart type dropdown
 * - Filter and export buttons
 * - Smooth 300ms animation
 * - Persists collapse state in sessionStorage
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 10.1, 10.2, 10.3
 */

import React, { useEffect } from 'react'
import { useComparison } from '../context/ComparisonContext.jsx'
import ChartTypeDropdown from './ChartTypeDropdown.jsx'
import FilterButton from './FilterButton.jsx'
import ExportButton from './ExportButton.jsx'
import '../styles/ComparisonHeader.css'

const ComparisonHeader = ({ onOpenFilters, onExport }) => {
  const { state, actions } = useComparison()
  const { headerCollapsed } = state

  // Load collapse state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('comparisonHeaderCollapsed')
    if (savedState === 'true' && !headerCollapsed) {
      actions.toggleHeader()
    }
  }, []) // Only run on mount

  // Save collapse state to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('comparisonHeaderCollapsed', headerCollapsed.toString())
  }, [headerCollapsed])

  const handleToggleHeader = () => {
    actions.toggleHeader()
  }

  // Count active filters
  const activeFilterCount = Object.values(state.filters).reduce((count, filter) => {
    if (Array.isArray(filter)) {
      return count + filter.length
    }
    if (filter && filter !== 'all') {
      return count + 1
    }
    return count
  }, 0)

  return (
    <header className={`comparison-header ${headerCollapsed ? 'collapsed' : ''}`}>
      <button
        className="hamburger-menu"
        onClick={handleToggleHeader}
        aria-label={headerCollapsed ? 'Expand header' : 'Collapse header'}
        aria-expanded={!headerCollapsed}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {headerCollapsed ? (
            // Down chevron when collapsed
            <polyline points="6 9 12 15 18 9" />
          ) : (
            // Hamburger menu when expanded
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {!headerCollapsed && (
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">Comparison Analysis</h1>
          </div>

          <div className="header-center">
            <ChartTypeDropdown />
          </div>

          <div className="header-actions">
            <FilterButton
              activeCount={activeFilterCount}
              onClick={onOpenFilters}
            />
            <ExportButton onClick={onExport} />
          </div>
        </div>
      )}
    </header>
  )
}

export default ComparisonHeader
