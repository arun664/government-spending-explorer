/**
 * NotableTrends - List of significant trends in the data
 * 
 * Features:
 * - Displays trends with icon, country, description
 * - Uses ComparisonDataService.identifyTrends()
 * - Shows direction and strength of trends
 * 
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7
 */

import React from 'react'
import PropTypes from 'prop-types'
import { useComparison } from '../context/ComparisonContext.jsx'

const NotableTrends = () => {
  const { state } = useComparison()
  const { highlights } = state

  if (!highlights || !highlights.trends || highlights.trends.length === 0) {
    return (
      <div className="sidebar-section notable-trends">
        <h3>Notable Trends</h3>
        <div className="no-data">No significant trends detected</div>
      </div>
    )
  }

  const { trends } = highlights

  // Get trend strength label
  const getTrendStrength = (slope) => {
    const absSlope = Math.abs(slope)
    if (absSlope > 5) return 'Very Strong'
    if (absSlope > 2) return 'Strong'
    if (absSlope > 1) return 'Moderate'
    return 'Weak'
  }

  // Get trend color class
  const getTrendColorClass = (direction) => {
    return direction === 'increasing' ? 'trend-positive' : 'trend-negative'
  }

  return (
    <div className="sidebar-section notable-trends">
      <h3>Notable Trends</h3>
      <div className="trend-list">
        {trends.map((trend, index) => (
          <div 
            key={`${trend.country}-${index}`} 
            className={`trend-item ${getTrendColorClass(trend.direction)}`}
          >
            <div className="trend-icon" aria-hidden="true">
              {trend.icon}
            </div>
            <div className="trend-content">
              <div className="trend-title">
                {trend.country}
              </div>
              <div className="trend-description">
                {trend.description}
              </div>
              <div className="trend-meta">
                <span className="trend-strength">
                  {getTrendStrength(trend.slope)}
                </span>
                <span className="trend-confidence">
                  R² = {trend.rSquared.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotableTrends
