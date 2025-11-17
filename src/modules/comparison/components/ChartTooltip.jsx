/**
 * ChartTooltip - Interactive tooltip for chart data points
 * 
 * Features:
 * - Displays country flag, name, value, and rank
 * - Positions near cursor/touch point
 * - Smooth transitions
 * - Responsive to viewport boundaries
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { useEffect, useRef, useState } from 'react'
import '../styles/Charts.css'

/**
 * Get country flag emoji from country code
 */
function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return '🏳️'
  }
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  
  return String.fromCodePoint(...codePoints)
}

/**
 * Format value with appropriate units
 */
function formatValue(value, unit = '%') {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A'
  }
  
  if (unit === '%') {
    return `${value.toFixed(2)}%`
  }
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * ChartTooltip component
 */
export function ChartTooltip({ data, position, visible = true }) {
  const tooltipRef = useRef(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position || { x: 0, y: 0 })

  // Reset adjusted position when tooltip should be hidden
  useEffect(() => {
    if (!visible || !position) {
      setAdjustedPosition(null)
      return
    }
  }, [visible, position])

  useEffect(() => {
    if (!tooltipRef.current || !position || !visible) return

    const tooltip = tooltipRef.current
    const rect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let { x, y } = position
    const offset = 15

    // Adjust horizontal position
    if (x + rect.width + offset > viewportWidth) {
      x = x - rect.width - offset
    } else {
      x = x + offset
    }

    // Adjust vertical position
    if (y + rect.height + offset > viewportHeight) {
      y = y - rect.height - offset
    } else {
      y = y + offset
    }

    setAdjustedPosition({ x, y })
  }, [position, visible])

  // Early return if not visible or missing required data
  if (!visible || !data || !position) {
    return null
  }
  
  // Use position directly if adjustedPosition not ready yet
  const displayPosition = adjustedPosition || position

  const {
    countryName,
    countryCode,
    value,
    year,
    rank,
    total,
    indicator,
    unit = '%',
    additionalInfo = {}
  } = data

  return (
    <div
      ref={tooltipRef}
      className="chart-tooltip"
      style={{
        left: `${displayPosition.x}px`,
        top: `${displayPosition.y}px`,
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        zIndex: 99999
      }}
    >
      <div className="tooltip-header">
        <span className="country-flag">{getCountryFlag(countryCode)}</span>
        <span className="country-name">{countryName}</span>
      </div>
      
      <div className="tooltip-body">
        {year && (
          <div className="tooltip-row">
            <span className="label">Year:</span>
            <span className="value">{year}</span>
          </div>
        )}
        
        {indicator && (
          <div className="tooltip-row">
            <span className="label">{indicator}:</span>
            <span className="value">{formatValue(value, unit)}</span>
          </div>
        )}
        
        {!indicator && value !== undefined && (
          <div className="tooltip-row">
            <span className="label">Value:</span>
            <span className="value">{formatValue(value, unit)}</span>
          </div>
        )}
        
        {rank && total && (
          <div className="tooltip-row">
            <span className="label">Rank:</span>
            <span className="value">#{rank} of {total}</span>
          </div>
        )}
        
        {Object.entries(additionalInfo).map(([key, val]) => (
          <div key={key} className="tooltip-row">
            <span className="label">{key}:</span>
            <span className="value">{typeof val === 'number' ? formatValue(val, unit) : val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChartTooltip
