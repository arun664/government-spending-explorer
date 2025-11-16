/**
 * SpendingLegend Component Usage Examples
 * 
 * This file demonstrates how to use the enhanced SpendingLegend component
 * with ColorSchemeService for consistent color visualization.
 * 
 * Requirements: 1.1, 1.2, 1.5
 */

import React from 'react'
import SpendingLegend from '../components/SpendingLegend.jsx'
import { ColorSchemeService } from '../../../shared/services/ColorSchemeService.js'
import { MapColorService } from '../../../shared/services/MapColorService.js'

/**
 * Example 1: Category-based Legend
 * Shows spending intensity for a specific category
 */
export const CategoryLegendExample = () => {
  // Sample spending data with category information
  const spendingData = {
    name: 'Government Expenditure',
    category: 'overview',
    globalStats: {
      minSpending: 0,
      maxSpending: 50000,
      avgSpending: 15000,
      totalCountries: 150
    }
  }

  // Create color scale using MapColorService
  const colorScale = MapColorService.createCategoryColorScale(spendingData)
  const extent = [spendingData.globalStats.minSpending, spendingData.globalStats.maxSpending]

  return (
    <SpendingLegend
      extent={extent}
      colorScale={colorScale}
      title="Government Expenditure"
      unit="Million USD"
      colorMode="category"
      spendingData={spendingData}
    />
  )
}

/**
 * Example 2: Region-based Legend
 * Shows discrete region colors
 */
export const RegionLegendExample = () => {
  // Create region color scale
  const colorScale = MapColorService.createRegionColorScale()

  return (
    <SpendingLegend
      colorScale={colorScale}
      title="Geographic Regions"
      colorMode="region"
    />
  )
}

/**
 * Example 3: Dynamic Legend with Category Switching
 * Demonstrates how legend updates when category changes
 */
export const DynamicLegendExample = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('personnel')

  const spendingData = {
    name: 'Personnel Compensation',
    category: selectedCategory,
    globalStats: {
      minSpending: 100,
      maxSpending: 25000,
      avgSpending: 8000,
      totalCountries: 120
    }
  }

  const colorScale = MapColorService.createCategoryColorScale(spendingData)
  const extent = [spendingData.globalStats.minSpending, spendingData.globalStats.maxSpending]

  return (
    <div>
      {/* Category selector */}
      <div style={{ marginBottom: '20px' }}>
        <label>Select Category: </label>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {ColorSchemeService.getAvailableCategories().map(cat => (
            <option key={cat} value={cat}>
              {ColorSchemeService.formatCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* Legend updates automatically when category changes */}
      <SpendingLegend
        extent={extent}
        colorScale={colorScale}
        title={spendingData.name}
        unit="Million USD"
        colorMode="category"
        spendingData={spendingData}
      />
    </div>
  )
}

/**
 * Example 4: Integration with Map Visualization
 * Shows how to use the same color scale for both map and legend
 */
export const MapLegendIntegrationExample = ({ worldData, spendingData }) => {
  // Create color scale - used by BOTH map and legend
  const colorScale = MapColorService.createMapColorScale(spendingData, 'category')
  
  const extent = spendingData.globalStats 
    ? [spendingData.globalStats.minSpending, spendingData.globalStats.maxSpending]
    : [0, 100]

  return (
    <div className="map-with-legend">
      {/* Map component would use the same colorScale */}
      {/* <SpendingWorldMap colorScale={colorScale} ... /> */}
      
      {/* Legend uses the exact same colorScale - ensuring consistency */}
      <SpendingLegend
        extent={extent}
        colorScale={colorScale}
        title={spendingData.name}
        unit="Million USD"
        colorMode="category"
        spendingData={spendingData}
      />
    </div>
  )
}

/**
 * Example 5: Color Mode Switching
 * Demonstrates switching between category and region modes
 */
export const ColorModeSwitchingExample = ({ spendingData }) => {
  const [colorMode, setColorMode] = React.useState('category')

  // Create appropriate color scale based on mode
  const colorScale = colorMode === 'category'
    ? MapColorService.createCategoryColorScale(spendingData)
    : MapColorService.createRegionColorScale()

  const extent = colorMode === 'category' && spendingData.globalStats
    ? [spendingData.globalStats.minSpending, spendingData.globalStats.maxSpending]
    : null

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setColorMode('category')}
          style={{ 
            fontWeight: colorMode === 'category' ? 'bold' : 'normal',
            marginRight: '10px'
          }}
        >
          Category Mode
        </button>
        <button 
          onClick={() => setColorMode('region')}
          style={{ fontWeight: colorMode === 'region' ? 'bold' : 'normal' }}
        >
          Region Mode
        </button>
      </div>

      {/* Legend updates based on color mode */}
      <SpendingLegend
        extent={extent}
        colorScale={colorScale}
        title={colorMode === 'category' ? spendingData.name : 'Geographic Regions'}
        unit="Million USD"
        colorMode={colorMode}
        spendingData={spendingData}
      />
    </div>
  )
}

/**
 * Usage Notes:
 * 
 * 1. Always use MapColorService to create color scales - this ensures
 *    consistency between map and legend
 * 
 * 2. Pass the same colorScale to both map and legend components
 * 
 * 3. The legend automatically formats values using ValueFormatUtils
 * 
 * 4. Category labels are automatically formatted using 
 *    ColorSchemeService.formatCategoryLabel()
 * 
 * 5. When switching color modes, update both the colorScale and colorMode props
 * 
 * 6. The legend will show a category badge when in category mode
 * 
 * 7. Region mode shows discrete colors for each region
 */
