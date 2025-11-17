/**
 * ChartTypeDropdown - Dropdown selector for chart visualization types
 * 
 * Features:
 * - 6 chart type options with icons and descriptions
 * - Visual feedback for selected type
 * - Accessible keyboard navigation
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import React from 'react'
import { useComparison } from '../context/ComparisonContext.jsx'

// Chart type definitions with icons and descriptions
const CHART_TYPES = [
  {
    id: 'timeSeries',
    name: 'Time Series',
    description: 'Trends over time',
    icon: '📈'
  },
  {
    id: 'scatterPlot',
    name: 'Scatter Plot',
    description: 'Correlation analysis',
    icon: '⚫'
  },
  {
    id: 'barChart',
    name: 'Bar Chart',
    description: 'Country ranking',
    icon: '📊'
  },
  {
    id: 'bubbleChart',
    name: 'Bubble Chart',
    description: 'Multi-dimensional',
    icon: '🫧'
  },
  {
    id: 'heatmap',
    name: 'Heatmap',
    description: 'Correlation matrix',
    icon: '🔥'
  },
  {
    id: 'boxPlot',
    name: 'Box Plot',
    description: 'Distribution by region',
    icon: '📦'
  }
]

const ChartTypeDropdown = () => {
  const { state, actions } = useComparison()
  const { chartType } = state

  const handleChange = (event) => {
    actions.setChartType(event.target.value)
  }

  const selectedChart = CHART_TYPES.find(chart => chart.id === chartType) || CHART_TYPES[0]

  return (
    <div className="chart-type-dropdown-container">
      <label htmlFor="chart-type-select" className="chart-type-label">
        Chart Type:
      </label>
      <select
        id="chart-type-select"
        className="chart-type-dropdown"
        value={chartType}
        onChange={handleChange}
        aria-label="Select chart type"
      >
        {CHART_TYPES.map(chart => (
          <option key={chart.id} value={chart.id}>
            {chart.icon} {chart.name} - {chart.description}
          </option>
        ))}
      </select>
      
      <div className="chart-type-display" aria-hidden="true">
        <span className="chart-type-icon">{selectedChart.icon}</span>
        <div className="chart-type-info">
          <span className="chart-type-name">{selectedChart.name}</span>
          <span className="chart-type-desc">{selectedChart.description}</span>
        </div>
        <svg
          className="dropdown-arrow"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </div>
    </div>
  )
}

export default ChartTypeDropdown
