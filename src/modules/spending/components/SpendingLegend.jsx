import React from 'react'
import '../styles/SpendingLegend.css'

const SpendingLegend = ({ extent, colorScale, title, unit = "Million USD" }) => {
  if (!extent || !colorScale) return null

  const steps = 5
  const stepSize = (extent[1] - extent[0]) / (steps - 1)
  const legendItems = Array.from({ length: steps }, (_, i) => {
    const value = extent[0] + (stepSize * i)
    return {
      value: value,
      color: colorScale(value),
      label: value.toLocaleString()
    }
  })

  return (
    <div className="spending-legend">
      <div className="legend-header">
        <div className="legend-title">{title || "Spending Value"}</div>
        <div className="legend-unit">{unit}</div>
      </div>
      <div className="legend-scale">
        {legendItems.map((item, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: item.color }}
            />
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="legend-note">
        Higher values = Darker colors
      </div>
    </div>
  )
}

export default SpendingLegend