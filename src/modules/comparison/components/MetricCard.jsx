/**
 * MetricCard - Reusable card component for displaying metrics
 * 
 * Features:
 * - Displays icon, label, value, and optional trend indicator
 * - Compact design for grid layout
 * - Supports different card types (summary, statistical, highlight)
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.8
 */

import React from 'react'
import PropTypes from 'prop-types'

const MetricCard = ({ 
  icon, 
  label, 
  value, 
  unit = '', 
  trend = null,
  className = '',
  onClick = null
}) => {
  return (
    <div 
      className={`metric-card ${className}`}
      onClick={onClick}
      role="region"
      aria-label={`${label} metric`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {icon && (
        <div className="metric-card-icon">
          {typeof icon === 'string' ? <span>{icon}</span> : icon}
        </div>
      )}
      
      <div className="metric-card-content">
        <div className="metric-card-label" id={`metric-${label.replace(/\s+/g, '-')}-label`}>
          {label}
        </div>
        
        <div 
          className="metric-card-value"
          aria-labelledby={`metric-${label.replace(/\s+/g, '-')}-label`}
          aria-live="polite"
        >
          {value !== null && value !== undefined ? (
            <>
              {typeof value === 'number' ? value.toLocaleString() : value}
              {unit && <span className="metric-card-unit"> {unit}</span>}
            </>
          ) : (
            <span className="metric-card-no-data">N/A</span>
          )}
        </div>
        
        {trend && (
          <div className={`metric-card-trend ${trend.direction}`}>
            <span className="trend-icon">{trend.icon}</span>
            <span className="trend-value">{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  )
}

MetricCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  unit: PropTypes.string,
  trend: PropTypes.shape({
    direction: PropTypes.oneOf(['up', 'down', 'neutral']),
    icon: PropTypes.string,
    value: PropTypes.string
  }),
  className: PropTypes.string,
  onClick: PropTypes.func
}

export default MetricCard
