/**
 * TopMetricCards - Grid of summary metric cards displayed at the top
 * 
 * Features:
 * - Total countries with data
 * - Selected year/year range
 * - Active filters count
 * - Data coverage percentage
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.5, 5.6
 */

import React from 'react'
import PropTypes from 'prop-types'
import MetricCard from './MetricCard.jsx'
import { useComparison } from '../context/ComparisonContext.jsx'

const TopMetricCards = () => {
  const { state } = useComparison()
  const { metrics, filters, yearRange, selectedYear } = state

  if (!metrics || !metrics.summary) {
    return (
      <div className="top-metric-cards">
        <div className="metric-cards-loading">Loading metrics...</div>
      </div>
    )
  }

  const { summary } = metrics

  // Count active filters
  const activeFiltersCount = 
    (filters.regions?.length || 0) + 
    (filters.incomeLevel?.length || 0) + 
    (filters.dataAvailability !== 'all' ? 1 : 0)

  // Format year display
  const yearDisplay = selectedYear 
    ? selectedYear.toString()
    : `${yearRange[0]} - ${yearRange[1]}`

  return (
    <div className="top-metric-cards">
      <MetricCard
        icon="🌍"
        label="Countries"
        value={summary.totalCountries}
        className="summary-card"
      />

      <MetricCard
        icon="📅"
        label="Year Range"
        value={yearDisplay}
        className="summary-card"
      />

      <MetricCard
        icon="🔍"
        label="Active Filters"
        value={activeFiltersCount}
        className="summary-card"
      />

      <MetricCard
        icon="📊"
        label="Data Coverage"
        value={summary.dataCoverage}
        unit="%"
        className="summary-card"
      />
    </div>
  )
}

export default TopMetricCards
