/**
 * ChartTypeSelector - Dropdown selector for switching between chart types
 * 
 * Features:
 * - Dropdown with line and bubble chart options
 * - Icons and names for each chart type
 * - Calls onChange handler when selection changes
 * 
 * Requirements: 3.1, 3.5, 8.1, 8.3
 */

import React from 'react'

const CHART_TYPES = [
  { 
    id: 'line', 
    name: 'Line Chart', 
    icon: '📈', 
    description: 'Trends over time' 
  },
  { 
    id: 'scatter', 
    name: 'Bubble Chart', 
    icon: '🫧', 
    description: 'GDP vs Expense correlation' 
  }
]

function ChartTypeSelector({ value, onChange }) {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value)
    }
  }

  return (
    <div className="chart-type-selector">
      <select 
        id="chart-type-select"
        value={value} 
        onChange={handleChange}
        className="chart-type-dropdown"
        aria-label="Select chart type"
      >
        {CHART_TYPES.map(type => (
          <option key={type.id} value={type.id}>
            {type.icon} {type.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ChartTypeSelector
