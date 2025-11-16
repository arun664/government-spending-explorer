/**
 * ChartWrapper - Wrapper component that integrates charts with ChartInteractionManager
 * 
 * Features:
 * - Implements required interface for ChartInteractionManager
 * - Handles chart registration and lifecycle
 * - Provides unified interaction methods
 * - Manages chart state synchronization
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { chartInteractionManager } from '../services/ChartInteractionManager.js'

const ChartWrapper = forwardRef(({
  chartId,
  chartType,
  ChartComponent,
  data,
  width,
  height,
  selectedCountries = [],
  selectedYear = null,
  onCountrySelect,
  onYearChange,
  onFilterUpdate,
  ...chartProps
}, ref) => {
  const [internalState, setInternalState] = useState({
    selectedCountries: [...selectedCountries],
    selectedYear,
    filters: {},
    colorScheme: null,
    zoomTransform: null
  })

  // Chart interface methods required by ChartInteractionManager
  const chartInterface = {
    type: chartType,
    
    updateSelection: (countries) => {
      setInternalState(prev => ({
        ...prev,
        selectedCountries: [...countries]
      }))
    },
    
    updateYear: (year) => {
      setInternalState(prev => ({
        ...prev,
        selectedYear: year
      }))
    },
    
    updateFilters: (filters) => {
      setInternalState(prev => ({
        ...prev,
        filters: { ...filters }
      }))
    },
    
    updateZoom: (transform) => {
      setInternalState(prev => ({
        ...prev,
        zoomTransform: transform
      }))
    },
    
    updateColorScheme: (colorScheme) => {
      setInternalState(prev => ({
        ...prev,
        colorScheme
      }))
    },
    
    highlightCountries: (countries) => {
      // Chart highlighting would be handled through props
    },
    
    clearHighlights: () => {
      // Chart highlight clearing would be handled through props
    },
    
    getSelection: () => {
      return {
        countries: internalState.selectedCountries,
        year: internalState.selectedYear,
        filters: internalState.filters
      }
    }
  }

  // Expose interface to parent components
  useImperativeHandle(ref, () => chartInterface, [internalState])

  // Register chart with interaction manager on mount
  useEffect(() => {
    if (chartId) {
      chartInteractionManager.registerChart(chartId, chartInterface)
      
      return () => {
        chartInteractionManager.unregisterChart(chartId)
      }
    }
  }, [chartId])

  // Handle country selection from chart
  const handleCountrySelect = (countries) => {
    if (chartId) {
      chartInteractionManager.updateSelection(countries, chartId)
    } else if (onCountrySelect) {
      onCountrySelect(countries)
    }
  }

  // Handle year change from chart
  const handleYearChange = (year) => {
    if (chartId) {
      chartInteractionManager.updateYear(year, chartId)
    } else if (onYearChange) {
      onYearChange(year)
    }
  }

  // Handle filter updates from chart
  const handleFilterUpdate = (filters) => {
    if (chartId) {
      chartInteractionManager.updateFilters(filters, chartId)
    } else if (onFilterUpdate) {
      onFilterUpdate(filters)
    }
  }

  // Handle zoom updates from chart
  const handleZoomUpdate = (transform) => {
    if (chartId) {
      chartInteractionManager.updateZoom(transform, chartId)
    }
  }

  return (
    <ChartComponent
      data={data}
      width={width}
      height={height}
      selectedCountries={internalState.selectedCountries}
      selectedYear={internalState.selectedYear}
      onCountrySelect={handleCountrySelect}
      onYearChange={handleYearChange}
      onFilterUpdate={handleFilterUpdate}
      onZoomUpdate={handleZoomUpdate}
      {...chartProps}
    />
  )
})

ChartWrapper.displayName = 'ChartWrapper'

export default ChartWrapper