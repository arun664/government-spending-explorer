/**
 * SignificantOutliers - List of statistical outliers
 * 
 * Features:
 * - Displays outliers with country, value, reason
 * - Uses ComparisonDataService.identifyOutliers() (IQR method)
 * - Shows deviation from normal range
 * 
 * Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7
 */

import React from 'react'
import PropTypes from 'prop-types'
import { useComparison } from '../context/ComparisonContext.jsx'

const SignificantOutliers = () => {
  const { state } = useComparison()
  const { highlights, chartData } = state

  if (!highlights || !highlights.outliers || highlights.outliers.length === 0) {
    return (
      <div className="sidebar-section significant-outliers">
        <h3>Significant Outliers</h3>
        <div className="no-data">No outliers detected</div>
      </div>
    )
  }

  const { outliers } = highlights

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

  // Get country flag emoji
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

  // Get outlier type class
  const getOutlierClass = (reason) => {
    return reason.includes('below') ? 'outlier-low' : 'outlier-high'
  }

  // Get outlier icon
  const getOutlierIcon = (reason) => {
    return reason.includes('below') ? '⚠️' : '⭐'
  }

  return (
    <div className="sidebar-section significant-outliers">
      <h3>Significant Outliers</h3>
      <div className="outlier-list">
        {outliers.map((outlier, index) => (
          <div 
            key={`${outlier.country}-${index}`} 
            className={`outlier-item ${getOutlierClass(outlier.reason)}`}
          >
            <div className="outlier-header">
              <span className="outlier-flag" aria-label={`${outlier.country} flag`}>
                {getCountryFlag(outlier.code)}
              </span>
              <span className="outlier-icon" aria-hidden="true">
                {getOutlierIcon(outlier.reason)}
              </span>
            </div>
            <div className="outlier-content">
              <div className="outlier-name">{outlier.country}</div>
              <div className="outlier-value">
                {formatValue(outlier.value)} {unit}
              </div>
              <div className="outlier-reason">{outlier.reason}</div>
              <div className="outlier-deviation">
                {outlier.deviation}× IQR deviation
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SignificantOutliers
