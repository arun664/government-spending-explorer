/**
 * TopPerformers - List of top performing countries
 * 
 * Features:
 * - Displays top 3-5 countries with rank, flag, name, value
 * - Uses data from ComparisonDataService.getTopPerformers()
 * - Compact list design for sidebar
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import React from 'react'
import PropTypes from 'prop-types'
import { useComparison } from '../context/ComparisonContext.jsx'

const TopPerformers = () => {
  const { state } = useComparison()
  const { highlights, chartData } = state

  if (!highlights || !highlights.topPerformers || highlights.topPerformers.length === 0) {
    return (
      <div className="sidebar-section top-performers">
        <h3>Top Performers</h3>
        <div className="no-data">No data available</div>
      </div>
    )
  }

  const { topPerformers } = highlights

  // Format value with appropriate precision
  const formatValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }
    
    if (Math.abs(value) < 1) {
      return value.toFixed(3)
    } else if (Math.abs(value) < 100) {
      return value.toFixed(2)
    } else {
      return value.toFixed(1)
    }
  }

  // Get indicator unit
  const unit = chartData?.unit || ''

  // Get country flag emoji (simplified - using regional indicator symbols)
  const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) {
      return '🏳️'
    }
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    
    return String.fromCodePoint(...codePoints)
  }

  return (
    <div className="sidebar-section top-performers">
      <h3>Top Performers</h3>
      <div className="performer-list">
        {topPerformers.map((performer) => (
          <div key={performer.country} className="performer-item">
            <span className="performer-rank">#{performer.rank}</span>
            <span className="performer-flag" aria-label={`${performer.country} flag`}>
              {getCountryFlag(performer.code)}
            </span>
            <div className="performer-info">
              <div className="performer-name">{performer.country}</div>
              <div className="performer-value">
                {formatValue(performer.value)} {unit}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopPerformers
