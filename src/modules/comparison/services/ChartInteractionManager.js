/**
 * ChartInteractionManager - Service for synchronized selection, zooming, and filtering across charts
 * 
 * Features:
 * - Synchronized selection across multiple charts
 * - Coordinated zoom and pan operations
 * - Unified filtering system
 * - Shared color schemes and interaction states
 * - Event-driven architecture for loose coupling
 */

import * as d3 from 'd3'

// Simple EventEmitter implementation for browser compatibility
class SimpleEventEmitter {
  constructor() {
    this.events = {}
  }

  addEventListener(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  removeEventListener(event, callback) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  removeAllListeners() {
    this.events = {}
  }

  emit(event, data) {
    if (!this.events[event]) return
    this.events[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }
}

export class ChartInteractionManager extends SimpleEventEmitter {
  constructor() {
    super()
    this.charts = new Map()
    this.globalState = {
      selectedCountries: [],
      selectedYear: null,
      selectedRegions: [],
      zoomTransform: null,
      filterState: {},
      colorScheme: 'region',
      animationSpeed: 1000
    }
    this.colorSchemes = this.initializeColorSchemes()
    this.interactionHistory = []
    this.maxHistorySize = 50
    this.isUpdating = false // Flag to prevent infinite loops
  }

  /**
   * Initialize color schemes for consistent visualization
   */
  initializeColorSchemes() {
    return {
      region: {
        scale: d3.scaleOrdinal()
          .domain(['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Oceania', 'Other'])
          .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2']),
        type: 'categorical'
      },
      performance: {
        scale: d3.scaleSequential()
          .domain([-10, 10])
          .interpolator(d3.interpolateRdYlGn),
        type: 'continuous'
      },
      spending: {
        scale: d3.scaleSequential()
          .domain([0, 50])
          .interpolator(d3.interpolateBlues),
        type: 'continuous'
      },
      gdp: {
        scale: d3.scaleSequential()
          .domain([-5, 15])
          .interpolator(d3.interpolateViridis),
        type: 'continuous'
      }
    }
  }

  /**
   * Register a chart with the interaction manager
   * @param {string} chartId - Unique identifier for the chart
   * @param {Object} chartInstance - Chart instance with required methods
   */
  registerChart(chartId, chartInstance) {
    if (!chartInstance || typeof chartInstance !== 'object') {
      throw new Error('Chart instance must be a valid object')
    }

    const requiredMethods = ['updateSelection', 'updateZoom', 'updateFilters', 'getSelection']
    const missingMethods = requiredMethods.filter(method => 
      typeof chartInstance[method] !== 'function'
    )

    if (missingMethods.length > 0) {
      console.warn(`Chart ${chartId} is missing methods: ${missingMethods.join(', ')}`)
    }

    this.charts.set(chartId, {
      instance: chartInstance,
      type: chartInstance.type || 'unknown',
      isActive: true,
      lastUpdate: Date.now()
    })

    // Apply current global state to newly registered chart
    this.syncChartWithGlobalState(chartId)

    this.emit('chartRegistered', { chartId, chartInstance })
  }

  /**
   * Unregister a chart from the interaction manager
   * @param {string} chartId - Chart identifier to remove
   */
  unregisterChart(chartId) {
    if (this.charts.has(chartId)) {
      this.charts.delete(chartId)
      this.emit('chartUnregistered', { chartId })
    }
  }

  /**
   * Update country selection across all charts
   * @param {Array} countries - Array of selected country names
   * @param {string} sourceChartId - ID of chart that initiated the selection
   */
  updateSelection(countries, sourceChartId = null) {
    // Prevent infinite loops
    if (this.isUpdating) {
      return
    }

    this.isUpdating = true

    try {
      const previousSelection = [...this.globalState.selectedCountries]
      this.globalState.selectedCountries = [...countries]

      // Record interaction in history
      this.addToHistory({
        type: 'selection',
        data: { countries, previousSelection },
        sourceChart: sourceChartId,
        timestamp: Date.now()
      })

      // Update all charts except the source
      this.charts.forEach((chart, chartId) => {
        if (chartId !== sourceChartId && chart.isActive) {
          try {
            if (typeof chart.instance.updateSelection === 'function') {
              chart.instance.updateSelection(countries)
              chart.lastUpdate = Date.now()
            }
          } catch (error) {
            console.warn(`Failed to update selection for chart ${chartId}:`, error)
          }
        }
      })

      this.emit('selectionChanged', { 
        countries, 
        previousSelection, 
        sourceChart: sourceChartId 
      })
    } finally {
      this.isUpdating = false
    }
  }

  /**
   * Update zoom transform across all charts
   * @param {Object} transform - D3 zoom transform object
   * @param {string} sourceChartId - ID of chart that initiated the zoom
   */
  updateZoom(transform, sourceChartId = null) {
    // Prevent infinite loops
    if (this.isUpdating) {
      return
    }

    this.isUpdating = true

    try {
      const previousTransform = this.globalState.zoomTransform
      this.globalState.zoomTransform = transform

      // Record interaction in history
      this.addToHistory({
        type: 'zoom',
        data: { transform, previousTransform },
        sourceChart: sourceChartId,
        timestamp: Date.now()
      })

      // Update all charts except the source
      this.charts.forEach((chart, chartId) => {
        if (chartId !== sourceChartId && chart.isActive) {
          try {
            if (typeof chart.instance.updateZoom === 'function') {
              chart.instance.updateZoom(transform)
              chart.lastUpdate = Date.now()
            }
          } catch (error) {
            console.warn(`Failed to update zoom for chart ${chartId}:`, error)
          }
        }
      })

      this.emit('zoomChanged', { 
        transform, 
        previousTransform, 
        sourceChart: sourceChartId 
      })
    } finally {
      this.isUpdating = false
    }
  }

  /**
   * Update filters across all charts
   * @param {Object} filters - Filter configuration object
   * @param {string} sourceChartId - ID of chart that initiated the filter
   */
  updateFilters(filters, sourceChartId = null) {
    // Prevent infinite loops
    if (this.isUpdating) {
      return
    }

    this.isUpdating = true

    try {
      const previousFilters = { ...this.globalState.filterState }
      this.globalState.filterState = { ...this.globalState.filterState, ...filters }

      // Record interaction in history
      this.addToHistory({
        type: 'filter',
        data: { filters, previousFilters },
        sourceChart: sourceChartId,
        timestamp: Date.now()
      })

      // Update all charts except the source
      this.charts.forEach((chart, chartId) => {
        if (chartId !== sourceChartId && chart.isActive) {
          try {
            if (typeof chart.instance.updateFilters === 'function') {
              chart.instance.updateFilters(this.globalState.filterState)
              chart.lastUpdate = Date.now()
            }
          } catch (error) {
            console.warn(`Failed to update filters for chart ${chartId}:`, error)
          }
        }
      })

      this.emit('filtersChanged', { 
        filters: this.globalState.filterState, 
        previousFilters, 
        sourceChart: sourceChartId 
      })
    } finally {
      this.isUpdating = false
    }
  }

  /**
   * Update year selection across all charts
   * @param {number} year - Selected year
   * @param {string} sourceChartId - ID of chart that initiated the change
   */
  updateYear(year, sourceChartId = null) {
    // Prevent infinite loops
    if (this.isUpdating) {
      return
    }

    this.isUpdating = true

    try {
      const previousYear = this.globalState.selectedYear
      this.globalState.selectedYear = year

      // Record interaction in history
      this.addToHistory({
        type: 'year',
        data: { year, previousYear },
        sourceChart: sourceChartId,
        timestamp: Date.now()
      })

      // Update all charts except the source
      this.charts.forEach((chart, chartId) => {
        if (chartId !== sourceChartId && chart.isActive) {
          try {
            if (typeof chart.instance.updateYear === 'function') {
              chart.instance.updateYear(year)
              chart.lastUpdate = Date.now()
            }
          } catch (error) {
            console.warn(`Failed to update year for chart ${chartId}:`, error)
          }
        }
      })

      this.emit('yearChanged', { 
        year, 
        previousYear, 
        sourceChart: sourceChartId 
      })
    } finally {
      this.isUpdating = false
    }
  }

  /**
   * Update color scheme across all charts
   * @param {string} schemeName - Name of color scheme to apply
   */
  updateColorScheme(schemeName) {
    if (!this.colorSchemes[schemeName]) {
      console.warn(`Unknown color scheme: ${schemeName}`)
      return
    }

    const previousScheme = this.globalState.colorScheme
    this.globalState.colorScheme = schemeName

    // Update all charts
    this.charts.forEach((chart, chartId) => {
      if (chart.isActive) {
        try {
          if (typeof chart.instance.updateColorScheme === 'function') {
            chart.instance.updateColorScheme(this.colorSchemes[schemeName])
            chart.lastUpdate = Date.now()
          }
        } catch (error) {
          console.warn(`Failed to update color scheme for chart ${chartId}:`, error)
        }
      }
    })

    this.emit('colorSchemeChanged', { 
      scheme: schemeName, 
      previousScheme,
      colorScale: this.colorSchemes[schemeName]
    })
  }

  /**
   * Get current color scheme
   * @param {string} schemeName - Optional specific scheme name
   * @returns {Object} Color scheme configuration
   */
  getColorScheme(schemeName = null) {
    const name = schemeName || this.globalState.colorScheme
    return this.colorSchemes[name] || this.colorSchemes.region
  }

  /**
   * Highlight specific countries across all charts
   * @param {Array} countries - Countries to highlight
   * @param {string} sourceChartId - Source chart ID
   */
  highlightCountries(countries, sourceChartId = null) {
    this.charts.forEach((chart, chartId) => {
      if (chartId !== sourceChartId && chart.isActive) {
        try {
          if (typeof chart.instance.highlightCountries === 'function') {
            chart.instance.highlightCountries(countries)
          }
        } catch (error) {
          console.warn(`Failed to highlight countries for chart ${chartId}:`, error)
        }
      }
    })

    this.emit('countriesHighlighted', { countries, sourceChart: sourceChartId })
  }

  /**
   * Clear all highlights across charts
   * @param {string} sourceChartId - Source chart ID
   */
  clearHighlights(sourceChartId = null) {
    this.charts.forEach((chart, chartId) => {
      if (chartId !== sourceChartId && chart.isActive) {
        try {
          if (typeof chart.instance.clearHighlights === 'function') {
            chart.instance.clearHighlights()
          }
        } catch (error) {
          console.warn(`Failed to clear highlights for chart ${chartId}:`, error)
        }
      }
    })

    this.emit('highlightsCleared', { sourceChart: sourceChartId })
  }

  /**
   * Sync a specific chart with current global state
   * @param {string} chartId - Chart to sync
   */
  syncChartWithGlobalState(chartId) {
    // Prevent infinite loops during sync
    if (this.isUpdating) {
      return
    }

    const chart = this.charts.get(chartId)
    if (!chart || !chart.isActive) return

    try {
      const { instance } = chart
      
      // Apply current selections
      if (typeof instance.updateSelection === 'function') {
        instance.updateSelection(this.globalState.selectedCountries)
      }
      
      // Apply current year
      if (typeof instance.updateYear === 'function' && this.globalState.selectedYear) {
        instance.updateYear(this.globalState.selectedYear)
      }
      
      // Apply current filters
      if (typeof instance.updateFilters === 'function') {
        instance.updateFilters(this.globalState.filterState)
      }
      
      // Apply current color scheme
      if (typeof instance.updateColorScheme === 'function') {
        instance.updateColorScheme(this.colorSchemes[this.globalState.colorScheme])
      }
      
      // Apply current zoom
      if (typeof instance.updateZoom === 'function' && this.globalState.zoomTransform) {
        instance.updateZoom(this.globalState.zoomTransform)
      }

      chart.lastUpdate = Date.now()
    } catch (error) {
      console.warn(`Failed to sync chart ${chartId} with global state:`, error)
    }
  }

  /**
   * Get current global state
   * @returns {Object} Current global state
   */
  getGlobalState() {
    return { ...this.globalState }
  }

  /**
   * Reset all interactions to initial state
   */
  resetInteractions() {
    const previousState = { ...this.globalState }
    
    this.globalState = {
      selectedCountries: [],
      selectedYear: null,
      selectedRegions: [],
      zoomTransform: null,
      filterState: {},
      colorScheme: 'region',
      animationSpeed: 1000
    }

    // Reset all charts
    this.charts.forEach((chart, chartId) => {
      if (chart.isActive) {
        this.syncChartWithGlobalState(chartId)
      }
    })

    this.emit('interactionsReset', { previousState })
  }

  /**
   * Add interaction to history
   * @param {Object} interaction - Interaction details
   */
  addToHistory(interaction) {
    this.interactionHistory.push(interaction)
    
    // Limit history size
    if (this.interactionHistory.length > this.maxHistorySize) {
      this.interactionHistory.shift()
    }
  }

  /**
   * Get interaction history
   * @param {number} limit - Maximum number of interactions to return
   * @returns {Array} Recent interactions
   */
  getHistory(limit = 10) {
    return this.interactionHistory.slice(-limit)
  }

  /**
   * Enable/disable a specific chart
   * @param {string} chartId - Chart identifier
   * @param {boolean} isActive - Whether chart should be active
   */
  setChartActive(chartId, isActive) {
    const chart = this.charts.get(chartId)
    if (chart) {
      chart.isActive = isActive
      
      if (isActive) {
        this.syncChartWithGlobalState(chartId)
      }
      
      this.emit('chartActiveChanged', { chartId, isActive })
    }
  }

  /**
   * Get list of registered charts
   * @returns {Array} Chart information
   */
  getRegisteredCharts() {
    return Array.from(this.charts.entries()).map(([id, chart]) => ({
      id,
      type: chart.type,
      isActive: chart.isActive,
      lastUpdate: chart.lastUpdate
    }))
  }

  /**
   * Batch update multiple properties
   * @param {Object} updates - Object containing updates
   * @param {string} sourceChartId - Source chart ID
   */
  batchUpdate(updates, sourceChartId = null) {
    const previousState = { ...this.globalState }
    
    // Apply updates
    if (updates.selectedCountries !== undefined) {
      this.globalState.selectedCountries = updates.selectedCountries
    }
    if (updates.selectedYear !== undefined) {
      this.globalState.selectedYear = updates.selectedYear
    }
    if (updates.filterState !== undefined) {
      this.globalState.filterState = { ...this.globalState.filterState, ...updates.filterState }
    }
    if (updates.colorScheme !== undefined) {
      this.globalState.colorScheme = updates.colorScheme
    }

    // Record batch update in history
    this.addToHistory({
      type: 'batch',
      data: { updates, previousState },
      sourceChart: sourceChartId,
      timestamp: Date.now()
    })

    // Update all charts except source
    this.charts.forEach((chart, chartId) => {
      if (chartId !== sourceChartId && chart.isActive) {
        this.syncChartWithGlobalState(chartId)
      }
    })

    this.emit('batchUpdate', { updates, previousState, sourceChart: sourceChartId })
  }

  /**
   * Destroy the interaction manager and clean up resources
   */
  destroy() {
    this.charts.clear()
    this.interactionHistory = []
    this.removeAllListeners()
  }
}

// Export singleton instance
export const chartInteractionManager = new ChartInteractionManager()

// Export class for custom instances
export default ChartInteractionManager