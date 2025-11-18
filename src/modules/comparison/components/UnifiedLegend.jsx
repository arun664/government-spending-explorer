/**
 * UnifiedLegend.jsx - Unified legend component for multi-chart dashboard
 * 
 * Features:
 * - Toggle GDP visibility across all charts
 * - Toggle Spending visibility across all charts
 * - Checkbox-based controls
 */

import { useState } from 'react'
import '../styles/UnifiedLegend.css'

function UnifiedLegend({ onToggle, initialState = { gdp: true, spending: true } }) {
  const [visibility, setVisibility] = useState(initialState)
  
  const handleToggle = (series) => {
    const newVisibility = {
      ...visibility,
      [series]: !visibility[series]
    }
    setVisibility(newVisibility)
    
    if (onToggle) {
      onToggle(newVisibility)
    }
  }
  
  return (
    <div className="unified-legend">
      <label className="legend-checkbox-item">
        <input 
          type="checkbox" 
          checked={visibility.gdp}
          onChange={() => handleToggle('gdp')}
        />
        <span className="legend-color-indicator gdp-color"></span>
        <span className="legend-label">GDP</span>
      </label>
      
      <label className="legend-checkbox-item">
        <input 
          type="checkbox" 
          checked={visibility.spending}
          onChange={() => handleToggle('spending')}
        />
        <span className="legend-color-indicator spending-color"></span>
        <span className="legend-label">Spending</span>
      </label>
    </div>
  )
}

export default UnifiedLegend
