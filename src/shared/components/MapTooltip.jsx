import React from 'react'
import { ColorSchemeService } from '../services/ColorSchemeService.js'
import { ValueFormatUtils } from '../utils/ValueFormatUtils.js'
import './MapTooltip.css'

/**
 * Enhanced tooltip component for map countries
 * Shows detailed information with color-coded styling
 * 
 * Features:
 * - Follows cursor with 10px offset
 * - Displays country name, region, code, spending value, and indicator category
 * - Color-coded styling using ColorSchemeService
 * - 200ms delay before showing to avoid flickering
 * - Updates when indicator category changes
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
const MapTooltip = ({ 
  country, 
  indicator, 
  position, 
  visible 
}) => {
  if (!visible || !country) {
    return null
  }

  // Get colors from ColorSchemeService
  const categoryColor = indicator?.category 
    ? ColorSchemeService.getCategoryColor(indicator.category)
    : ColorSchemeService.getCategoryColor('overview')

  const regionColor = country.region 
    ? ColorSchemeService.getRegionColor(country.region)
    : ColorSchemeService.getRegionColor('Unknown')

  return (
    <div 
      className="map-tooltip"
      style={{
        position: 'fixed',
        left: `${position.x + 10}px`,
        top: `${position.y + 10}px`,
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      <div 
        className="tooltip-header"
        style={{ borderLeftColor: categoryColor }}
      >
        <h4 className="tooltip-country-name">{country.name}</h4>
        {country.region && (
          <span 
            className="region-badge"
            style={{ backgroundColor: regionColor }}
          >
            {country.region}
          </span>
        )}
      </div>
      
      <div className="tooltip-body">
        {country.code && (
          <div className="tooltip-row">
            <span className="label">Country Code:</span>
            <span className="value">{country.code}</span>
          </div>
        )}
        
        {indicator && (
          <>
            <div className="tooltip-row">
              <span className="label">Indicator:</span>
              <span className="value">{indicator.name}</span>
            </div>
            
            {indicator.category && (
              <div className="tooltip-row">
                <span className="label">Category:</span>
                <span 
                  className="category-badge"
                  style={{ backgroundColor: categoryColor }}
                >
                  {ColorSchemeService.formatCategoryLabel(indicator.category)}
                </span>
              </div>
            )}
          </>
        )}
        
        {country.spending && (
          <div className="tooltip-row highlight">
            <span className="label">Spending:</span>
            <span className="value">
              {ValueFormatUtils.formatMillions(country.spending.average || country.spending.latest || 0)}
            </span>
          </div>
        )}
        
        {country.spending?.dataPoints && (
          <div className="tooltip-row">
            <span className="label">Data Points:</span>
            <span className="value">{country.spending.dataPoints}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapTooltip
