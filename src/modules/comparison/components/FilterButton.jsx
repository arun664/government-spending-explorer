/**
 * FilterButton - Button to open filter panel with active filter badge
 * 
 * Features:
 * - Shows count of active filters
 * - Visual badge indicator
 * - Accessible button with proper ARIA labels
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import React from 'react'

const FilterButton = ({ activeCount = 0, onClick }) => {
  return (
    <button
      className="filter-button"
      onClick={onClick}
      aria-label={`Open filters${activeCount > 0 ? `, ${activeCount} active` : ''}`}
      title="Filter data"
    >
      <svg
        className="filter-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
      <span className="filter-text">Filters</span>
      {activeCount > 0 && (
        <span className="filter-badge" aria-label={`${activeCount} active filters`}>
          {activeCount}
        </span>
      )}
    </button>
  )
}

export default FilterButton
