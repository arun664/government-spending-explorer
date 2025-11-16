import React from 'react'
import { ColorSchemeService } from '../../../shared/services/ColorSchemeService.js'
import { ValueFormatUtils } from '../../../shared/utils/ValueFormatUtils.js'
import '../styles/SpendingLegend.css'

/**
 * Enhanced SpendingLegend Component
 * 
 * Features:
 * - Uses ColorSchemeService for consistent colors with map visualization
 * - Supports both category-based and region-based color modes
 * - Dynamic updates when color mode or indicator changes
 * - Formatted labels using ColorSchemeService.formatCategoryLabel()
 * - Value formatting in millions using ValueFormatUtils
 * 
 * Requirements: 1.1, 1.2, 1.5
 */
const SpendingLegend = ({ 
  extent, 
  colorScale, 
  title, 
  unit = "Million USD",
  colorMode = 'category',
  category = 'overview',
  spendingData
}) => {
  // Don't render if essential props are missing
  if (!colorScale) return null

  // Region mode - show discrete region colors
  if (colorMode === 'region') {
    const regionColors = ColorSchemeService.getRegionColorArray()
    
    return (
      <div className="spending-legend">
        <div className="legend-header">
          <div className="legend-title">{title || "Regions"}</div>
          <div className="legend-unit">Geographic Distribution</div>
        </div>
        <div className="legend-scale">
          {regionColors.map((item, index) => (
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
          Countries colored by region
        </div>
      </div>
    )
  }

  // Category mode - show intensity gradient
  if (!extent) return null

  // Get the category color from ColorSchemeService
  const categoryColor = spendingData?.category 
    ? ColorSchemeService.getCategoryColor(spendingData.category)
    : ColorSchemeService.getCategoryColor(category)

  // Get formatted category label
  const categoryLabel = spendingData?.category
    ? ColorSchemeService.formatCategoryLabel(spendingData.category)
    : ColorSchemeService.formatCategoryLabel(category)

  // Create legend items with proper color scale
  const steps = 5
  const stepSize = (extent[1] - extent[0]) / (steps - 1)
  const legendItems = Array.from({ length: steps }, (_, i) => {
    const value = extent[0] + (stepSize * i)
    return {
      value: value,
      color: colorScale(value),
      label: ValueFormatUtils.formatMillions(value)
    }
  })

  return (
    <div className="spending-legend">
      <div className="legend-header">
        <div className="legend-title">
          {title || spendingData?.name || "Spending Value"}
        </div>
        {categoryLabel && (
          <div 
            className="legend-category-badge"
            style={{ 
              backgroundColor: categoryColor,
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              marginTop: '4px',
              display: 'inline-block'
            }}
          >
            {categoryLabel}
          </div>
        )}
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