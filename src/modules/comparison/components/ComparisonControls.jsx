/**
 * ComparisonControls - Controls for comparison page (to be shown in main header)
 * 
 * Features:
 * - Chart type selector
 * - Filter button
 * - Export button
 */

import React from 'react'
import { useComparison } from '../context/ComparisonContext.jsx'
import { CHART_TYPES } from '../charts/index.js'

const ComparisonControls = ({ onOpenFilters, onOpenExport }) => {
  const { state, actions } = useComparison()

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {/* Chart Type Selector */}
      <select
        value={state.chartType}
        onChange={(e) => actions.setChartType(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {CHART_TYPES.map(chartType => (
          <option key={chartType.id} value={chartType.id} style={{ color: '#000' }}>
            {chartType.icon} {chartType.name}
          </option>
        ))}
      </select>

      {/* Filter Button */}
      <button
        onClick={onOpenFilters}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        🔍 Filters
      </button>

      {/* Export Button */}
      <button
        onClick={onOpenExport}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        📥 Export
      </button>
    </div>
  )
}

export default ComparisonControls
