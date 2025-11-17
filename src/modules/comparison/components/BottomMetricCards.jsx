/**
 * BottomMetricCards - Grid of statistical metric cards displayed at the bottom
 * 
 * Features:
 * - Average value for selected indicator
 * - Median value
 * - Standard deviation
 * - Min value with country
 * - Max value with country
 * - Range (max - min)
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6
 */

import React from 'react'
import PropTypes from 'prop-types'
import MetricCard from './MetricCard.jsx'
import { useComparison } from '../context/ComparisonContext.jsx'

const BottomMetricCards = () => {
  const { state } = useComparison()
  const { metrics, chartData } = state

  if (!metrics || !metrics.statistical) {
    return (
      <div className="bottom-metric-cards">
        <div className="metric-cards-loading">Loading statistics...</div>
      </div>
    )
  }

  const { statistical } = metrics

  // Format number with appropriate precision
  const formatValue = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }
    
    // Use 2 decimal places for values
    if (Math.abs(value) < 1) {
      return value.toFixed(3)
    } else if (Math.abs(value) < 100) {
      return value.toFixed(2)
    } else {
      return value.toFixed(1)
    }
  }

  // Get indicator unit from chartData
  const unit = chartData?.unit || ''

  return (
    <div className="bottom-metric-cards">
      <MetricCard
        icon="📊"
        label="Average"
        value={formatValue(statistical.average)}
        unit={unit}
        className="statistical-card"
      />

      <MetricCard
        icon="📈"
        label="Median"
        value={formatValue(statistical.median)}
        unit={unit}
        className="statistical-card"
      />

      <MetricCard
        icon="📉"
        label="Std Deviation"
        value={formatValue(statistical.stdDev)}
        unit={unit}
        className="statistical-card"
      />

      <MetricCard
        icon="⬇️"
        label="Minimum"
        value={
          <div className="metric-with-country">
            <div className="metric-value">{formatValue(statistical.min.value)}</div>
            <div className="metric-country">{statistical.min.country}</div>
          </div>
        }
        unit={unit}
        className="statistical-card"
      />

      <MetricCard
        icon="⬆️"
        label="Maximum"
        value={
          <div className="metric-with-country">
            <div className="metric-value">{formatValue(statistical.max.value)}</div>
            <div className="metric-country">{statistical.max.country}</div>
          </div>
        }
        unit={unit}
        className="statistical-card"
      />

      <MetricCard
        icon="↔️"
        label="Range"
        value={formatValue(statistical.range)}
        unit={unit}
        className="statistical-card"
      />
    </div>
  )
}

export default BottomMetricCards
