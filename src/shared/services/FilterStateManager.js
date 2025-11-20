/**
 * Filter State Management System
 * Centralized filter state management with persistence and real-time updates
 * 
 * This service provides:
 * - Centralized filter state management
 * - Real-time filter updates via subscription system
 * - Session storage persistence
 * - Default filter values
 * - Cross-module filter sharing
 * - Debounced updates to prevent excessive re-renders
 * - Loading state management
 * - Filter count tracking
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.4, 7.5, 8.1, 8.2, 8.3
 */

const STORAGE_KEY = 'dashboardFilters'
const MODULE_STORAGE_KEY = 'dashboardCurrentModule'
const DEBOUNCE_DELAY = 300 // 300ms debounce delay
const LOADING_THRESHOLD = 500 // Show loading indicator after 500ms

/**
 * FilterStateManager - Manages application-wide filter state
 */
export class FilterStateManager {
  constructor() {
    this.listeners = []
    this.loadingListeners = []
    this.moduleListeners = {} // Module-specific listeners
    this.currentFilters = this.loadFiltersFromStorage()
    this.currentModule = this.loadCurrentModule()
    this.debounceTimer = null
    this.loadingTimer = null
    this.isLoading = false
    this.filterCount = 0
    this.lastUpdateTime = Date.now()
    this.incompatibleFilters = [] // Track incompatible filters when switching modules
  }

  /**
   * Get current filter state
   * Returns a copy to prevent direct mutation
   * @returns {Object} Current filter state
   */
  getFilters() {
    return { ...this.currentFilters }
  }

  /**
   * Get filters for a specific module
   * Returns only the filters applicable to that module
   * @param {string} module - Module name ('spending' or 'gdp')
   * @returns {Object} Module-specific filter state
   */
  getFiltersForModule(module) {
    const filters = this.getFilters()
    
    if (module === 'gdp') {
      return {
        regions: filters.regions || [],
        yearRange: filters.yearRange || [2005, 2022],
        gdpRange: filters.gdpRange || [-100, 100],
        countries: filters.countries || []
      }
    } else if (module === 'spending') {
      return {
        regions: filters.regions || [],
        yearRange: filters.yearRange || [2005, 2022], // Last 2 decades
        valueRange: filters.valueRange || [0, 100000],
        sectors: filters.sectors || [],
        categories: filters.categories || ['overview']
      }
    }
    
    return filters
  }

  /**
   * Get count of active (non-default) filters
   * @param {string} module - Optional module name to count only module-specific filters
   * @returns {number} Count of active filters
   */
  getActiveFilterCount(module = null) {
    const currentFilters = this.getFilters()
    const defaultFilters = this.getDefaultFilters()
    let count = 0
    
    // Module-specific default year ranges
    const moduleYearDefaults = {
      'spending': [2005, 2022],
      'gdp': [2005, 2022]
    }
    
    // Don't count categories as an active filter (it's always set)
    const filtersToCheck = ['regions', 'sectors', 'countries']
    
    filtersToCheck.forEach(key => {
      const current = currentFilters[key]
      const defaultVal = defaultFilters[key]
      
      // Check if filter is active (different from default - empty array)
      if (Array.isArray(current) && Array.isArray(defaultVal)) {
        // Only count if current has values AND is different from default
        if (current.length > 0 && current.length !== defaultVal.length) {
          count++
        }
      }
    })
    
    // Check year range (only if different from module-specific or global default)
    if (currentFilters.yearRange) {
      const defaultYearRange = module && moduleYearDefaults[module] 
        ? moduleYearDefaults[module] 
        : defaultFilters.yearRange
      
      if (currentFilters.yearRange[0] !== defaultYearRange[0] || 
          currentFilters.yearRange[1] !== defaultYearRange[1]) {
        count++
      }
    }
    
    return count
  }

  /**
   * Update filters with debouncing and notify listeners
   * Merges new filters with existing state
   * Debounces updates to prevent excessive re-renders (300ms delay)
   * @param {Object} newFilters - Partial or complete filter object
   * @param {boolean} immediate - Skip debouncing if true
   * @param {string} module - Optional module name for module-specific updates
   */
  updateFilters(newFilters, immediate = false, module = null) {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Update filters immediately in memory
    this.currentFilters = {
      ...this.currentFilters,
      ...newFilters
    }
    
    // Update current module if provided
    if (module) {
      this.setCurrentModule(module)
    }
    
    this.saveFiltersToStorage()

    if (immediate) {
      // Immediate update without debouncing
      this.notifyListeners()
      this.notifyModuleListeners(module)
      this.setLoading(false)
    } else {
      // Start loading state timer (show loading after 500ms)
      this.startLoadingTimer()

      // Debounce the notification to listeners
      this.debounceTimer = setTimeout(() => {
        this.notifyListeners()
        this.notifyModuleListeners(module)
        this.setLoading(false)
        this.lastUpdateTime = Date.now()
      }, DEBOUNCE_DELAY)
    }
  }

  /**
   * Update filters immediately without debouncing
   * Useful for critical updates that need instant feedback
   * @param {Object} newFilters - Partial or complete filter object
   */
  updateFiltersImmediate(newFilters) {
    this.updateFilters(newFilters, true)
  }

  /**
   * Reset all filters to defaults
   * Clears session storage and notifies listeners immediately
   * @param {string} module - Optional module name to reset only module-specific filters
   */
  resetFilters(module = null) {
    // Clear any pending debounce timers
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer)
    }

    const defaults = this.getDefaultFilters()
    
    // If module specified, only reset module-specific filters
    if (module === 'gdp') {
      this.currentFilters = {
        ...this.currentFilters,
        regions: defaults.regions,
        yearRange: [2005, 2022],
        gdpRange: defaults.gdpRange,
        countries: defaults.countries || []
      }
    } else if (module === 'spending') {
      this.currentFilters = {
        ...this.currentFilters,
        regions: defaults.regions,
        yearRange: [2005, 2022], // Last 2 decades
        valueRange: defaults.valueRange,
        sectors: defaults.sectors,
        categories: defaults.categories
      }
    } else {
      // Reset all filters
      this.currentFilters = defaults
    }
    
    this.saveFiltersToStorage()
    this.setLoading(false)
    this.notifyListeners()
    this.notifyModuleListeners(module)
  }

  /**
   * Subscribe to filter changes
   * Returns unsubscribe function for cleanup
   * @param {Function} listener - Callback function to be called on filter changes
   * @param {string} module - Optional module name for module-specific subscriptions
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener, module = null) {
    if (typeof listener !== 'function') {
      console.error('FilterStateManager: Listener must be a function')
      return () => {}
    }
    
    if (module) {
      // Module-specific subscription
      if (!this.moduleListeners[module]) {
        this.moduleListeners[module] = []
      }
      this.moduleListeners[module].push(listener)
      
      return () => {
        this.moduleListeners[module] = this.moduleListeners[module].filter(l => l !== listener)
      }
    } else {
      // Global subscription
      this.listeners.push(listener)
      
      // Return unsubscribe function
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener)
      }
    }
  }

  /**
   * Subscribe to loading state changes
   * Returns unsubscribe function for cleanup
   * @param {Function} listener - Callback function to be called on loading state changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToLoading(listener) {
    if (typeof listener !== 'function') {
      console.error('FilterStateManager: Loading listener must be a function')
      return () => {}
    }
    
    this.loadingListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.loadingListeners = this.loadingListeners.filter(l => l !== listener)
    }
  }

  /**
   * Notify all listeners of filter changes
   * Passes current filter state to each listener
   * @private
   */
  notifyListeners() {
    const currentState = this.getFilters()
    this.listeners.forEach(listener => {
      try {
        listener(currentState)
      } catch (error) {
        console.error('FilterStateManager: Error in listener callback', error)
      }
    })
  }

  /**
   * Notify module-specific listeners
   * @param {string} module - Module name
   * @private
   */
  notifyModuleListeners(module) {
    if (module && this.moduleListeners[module]) {
      const currentState = this.getFilters()
      this.moduleListeners[module].forEach(listener => {
        try {
          listener(currentState)
        } catch (error) {
          console.error(`FilterStateManager: Error in ${module} module listener callback`, error)
        }
      })
    }
  }

  /**
   * Load filters from session storage
   * Falls back to defaults if storage is empty or invalid
   * @returns {Object} Filter state from storage or defaults
   */
  loadFiltersFromStorage() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate that parsed data has expected structure
        if (this.isValidFilterState(parsed)) {
          return parsed
        }
      }
    } catch (error) {
      console.error('FilterStateManager: Error loading filters from storage', error)
    }
    return this.getDefaultFilters()
  }

  /**
   * Load current module from session storage
   * @returns {string} Current module name
   * @private
   */
  loadCurrentModule() {
    try {
      const stored = sessionStorage.getItem(MODULE_STORAGE_KEY)
      return stored || 'about'
    } catch (error) {
      console.error('FilterStateManager: Error loading current module', error)
      return 'about'
    }
  }

  /**
   * Save filters to session storage
   * Handles storage errors gracefully
   * @private
   */
  saveFiltersToStorage() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentFilters))
      sessionStorage.setItem(MODULE_STORAGE_KEY, this.currentModule)
    } catch (error) {
      console.error('FilterStateManager: Error saving filters to storage', error)
    }
  }

  /**
   * Get default filter values
   * Provides sensible defaults for all filter types
   * @returns {Object} Default filter state
   */
  getDefaultFilters() {
    return {
      // Region selection - empty means all regions
      regions: [],
      
      // Year range - default to reliable data range (2005-2022) consistent across all modules
      yearRange: [2005, 2022],
      
      // Value range in millions - default to full range
      valueRange: [0, 100000],
      
      // Government sectors - empty means all sectors
      sectors: [],
      
      // Indicator categories - default to overview
      categories: ['overview'],
      
      // GDP range for GDP module (percentage change)
      gdpRange: [-100, 100],
      
      // Selected country (for detail views)
      selectedCountry: null,
      
      // Color mode for visualizations
      colorMode: 'category' // 'category' or 'region'
    }
  }

  /**
   * Validate filter state structure
   * Ensures loaded data has expected properties
   * @param {Object} state - Filter state to validate
   * @returns {boolean} True if valid
   * @private
   */
  isValidFilterState(state) {
    if (!state || typeof state !== 'object') {
      return false
    }

    // Check required properties exist
    const requiredProps = ['regions', 'yearRange', 'valueRange', 'sectors', 'categories']
    const hasRequiredProps = requiredProps.every(prop => prop in state)
    
    if (!hasRequiredProps) {
      return false
    }

    // Validate array properties
    if (!Array.isArray(state.regions) || !Array.isArray(state.sectors) || !Array.isArray(state.categories)) {
      return false
    }

    // Validate range properties
    if (!Array.isArray(state.yearRange) || state.yearRange.length !== 2) {
      return false
    }
    if (!Array.isArray(state.valueRange) || state.valueRange.length !== 2) {
      return false
    }

    return true
  }

  /**
   * Get active filter count
   * Returns number of non-default filters applied
   * @param {string} module - Optional module name for module-specific count
   * @returns {number} Count of active filters
   */
  getActiveFilterCount(module = null) {
    const targetModule = module || this.currentModule
    let count = 0

    // Common filters
    if (this.currentFilters.regions && this.currentFilters.regions.length > 0) count++
    if (this.currentFilters.countries && this.currentFilters.countries.length > 0) count++
    
    // Module-specific filters
    if (targetModule === 'spending') {
      if (this.currentFilters.sectors && this.currentFilters.sectors.length > 0) count++
      if (this.currentFilters.categories && this.currentFilters.categories.length > 0 && 
          !(this.currentFilters.categories.length === 1 && this.currentFilters.categories[0] === 'overview')) {
        count++
      }
      
      // Check year range (spending default: 2005-2022)
      if (this.currentFilters.yearRange && 
          (this.currentFilters.yearRange[0] !== 2005 || this.currentFilters.yearRange[1] !== 2022)) {
        count++
      }
      
      // Check value range (spending default: 0-100000)
      if (this.currentFilters.valueRange && 
          (this.currentFilters.valueRange[0] !== 0 || this.currentFilters.valueRange[1] !== 100000)) {
        count++
      }
    } else if (targetModule === 'gdp') {
      // Check year range (GDP default: 2005-2022)
      if (this.currentFilters.yearRange && 
          (this.currentFilters.yearRange[0] !== 2005 || this.currentFilters.yearRange[1] !== 2022)) {
        count++
      }
      
      // Check GDP range (GDP default: -100 to 100)
      if (this.currentFilters.gdpRange && 
          (this.currentFilters.gdpRange[0] !== -100 || this.currentFilters.gdpRange[1] !== 100)) {
        count++
      }
    }

    return count
  }

  /**
   * Check if any filters are active
   * @returns {boolean} True if any non-default filters are applied
   */
  hasActiveFilters() {
    return this.getActiveFilterCount() > 0
  }

  /**
   * Get filter summary for display
   * Returns human-readable summary of active filters
   * @returns {Object} Filter summary
   */
  getFilterSummary() {
    return {
      regionsCount: this.currentFilters.regions.length,
      sectorsCount: this.currentFilters.sectors.length,
      yearRangeSpan: this.currentFilters.yearRange[1] - this.currentFilters.yearRange[0] + 1,
      valueRangeMin: this.currentFilters.valueRange[0],
      valueRangeMax: this.currentFilters.valueRange[1],
      categoriesCount: this.currentFilters.categories.length,
      activeFilterCount: this.getActiveFilterCount()
    }
  }

  /**
   * Update a specific filter property
   * Convenience method for updating single filter values
   * @param {string} filterKey - Filter property name
   * @param {*} value - New value for the filter
   */
  updateFilter(filterKey, value) {
    this.updateFilters({ [filterKey]: value })
  }

  /**
   * Clear session storage
   * Useful for testing or reset scenarios
   */
  clearStorage() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('FilterStateManager: Error clearing storage', error)
    }
  }

  /**
   * Get number of active listeners
   * Useful for debugging
   * @returns {number} Number of subscribed listeners
   */
  getListenerCount() {
    return this.listeners.length
  }

  /**
   * Start loading timer
   * Shows loading indicator if processing takes longer than threshold
   * @private
   */
  startLoadingTimer() {
    // Clear existing timer
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer)
    }

    // Set loading state after threshold
    this.loadingTimer = setTimeout(() => {
      this.setLoading(true)
    }, LOADING_THRESHOLD)
  }

  /**
   * Set loading state and notify loading listeners
   * @param {boolean} loading - Loading state
   * @private
   */
  setLoading(loading) {
    if (this.isLoading !== loading) {
      this.isLoading = loading
      this.notifyLoadingListeners()
    }

    // Clear loading timer if setting to false
    if (!loading && this.loadingTimer) {
      clearTimeout(this.loadingTimer)
      this.loadingTimer = null
    }
  }

  /**
   * Notify all loading listeners of loading state changes
   * @private
   */
  notifyLoadingListeners() {
    this.loadingListeners.forEach(listener => {
      try {
        listener(this.isLoading)
      } catch (error) {
        console.error('FilterStateManager: Error in loading listener callback', error)
      }
    })
  }

  /**
   * Get current loading state
   * @returns {boolean} True if filters are being processed
   */
  getLoadingState() {
    return this.isLoading
  }

  /**
   * Set filter count for display
   * Used to show number of matching countries/records
   * @param {number} count - Number of matching items
   */
  setFilterCount(count) {
    this.filterCount = count
  }

  /**
   * Get current filter count
   * @returns {number} Number of matching items
   */
  getFilterCount() {
    return this.filterCount
  }

  /**
   * Get time since last filter update
   * Useful for performance monitoring
   * @returns {number} Milliseconds since last update
   */
  getTimeSinceLastUpdate() {
    return Date.now() - this.lastUpdateTime
  }

  /**
   * Cancel any pending debounced updates
   * Useful when component unmounts or needs to stop updates
   */
  cancelPendingUpdates() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer)
      this.loadingTimer = null
    }
    this.setLoading(false)
  }

  /**
   * Set current module
   * @param {string} module - Module name ('spending', 'gdp', or 'comparison')
   */
  setCurrentModule(module) {
    this.currentModule = module
    try {
      sessionStorage.setItem(MODULE_STORAGE_KEY, module)
    } catch (error) {
      console.error('FilterStateManager: Error saving current module', error)
    }
  }

  /**
   * Get current module
   * @returns {string} Current module name
   */
  getCurrentModule() {
    return this.currentModule
  }

  /**
   * Restore filters when switching to a module
   * Adapts filters for the target module and returns incompatible filters
   * @param {string} module - Target module name
   * @returns {Object} Object with adapted filters and incompatible filter list
   */
  restoreFiltersForModule(module) {
    this.setCurrentModule(module)
    const filters = this.getFilters()
    
    // Adapt filters for the target module
    const result = this.adaptFiltersForModule(filters, module)
    
    // Update current filters with adapted values
    this.currentFilters = result.adaptedFilters
    this.incompatibleFilters = result.incompatibleFilters
    this.saveFiltersToStorage()
    
    return result
  }

  /**
   * Adapt filters for a specific module
   * Handles incompatible filters gracefully
   * @param {Object} filters - Current filter state
   * @param {string} targetModule - Target module name
   * @returns {Object} Object with adaptedFilters and incompatibleFilters array
   */
  adaptFiltersForModule(filters, targetModule) {
    const adapted = { ...filters }
    const incompatibleFilters = []
    
    if (targetModule === 'gdp') {
      // GDP module doesn't support sectors or categories
      if (filters.sectors && filters.sectors.length > 0) {
        incompatibleFilters.push({
          name: 'sectors',
          value: filters.sectors,
          reason: 'GDP module does not support sector filtering'
        })
        adapted.sectors = []
      }
      
      if (filters.categories && filters.categories.length > 0 && 
          !(filters.categories.length === 1 && filters.categories[0] === 'overview')) {
        incompatibleFilters.push({
          name: 'categories',
          value: filters.categories,
          reason: 'GDP module does not support category filtering'
        })
        adapted.categories = ['overview']
      }
      
      if (filters.valueRange && 
          (filters.valueRange[0] !== 0 || filters.valueRange[1] !== 100000)) {
        incompatibleFilters.push({
          name: 'valueRange',
          value: filters.valueRange,
          reason: 'GDP module uses GDP growth range instead of value range'
        })
      }
      adapted.valueRange = [0, 100000]
      
      // Ensure GDP-specific filters exist
      if (!adapted.gdpRange) {
        adapted.gdpRange = [-100, 100]
      }
      
      // Adjust year range if needed (GDP data starts from 2005)
      if (adapted.yearRange && adapted.yearRange[0] < 2005) {
        const oldRange = [...adapted.yearRange]
        adapted.yearRange = [2005, adapted.yearRange[1]]
        incompatibleFilters.push({
          name: 'yearRange',
          value: oldRange,
          reason: 'GDP data is only available from 2005 onwards'
        })
      }
      
    } else if (targetModule === 'spending') {
      // Spending module doesn't support gdpRange
      if (filters.gdpRange && 
          (filters.gdpRange[0] !== -100 || filters.gdpRange[1] !== 100)) {
        incompatibleFilters.push({
          name: 'gdpRange',
          value: filters.gdpRange,
          reason: 'Spending module uses value range instead of GDP growth range'
        })
      }
      adapted.gdpRange = [-100, 100]
      
      // Ensure spending-specific filters exist
      if (!adapted.valueRange) {
        adapted.valueRange = [0, 100000]
      }
      if (!adapted.sectors) {
        adapted.sectors = []
      }
      if (!adapted.categories) {
        adapted.categories = ['overview']
      }
      
      // Adjust year range if needed (Spending data starts from 2005)
      if (adapted.yearRange && adapted.yearRange[0] < 2005) {
        const oldRange = [...adapted.yearRange]
        adapted.yearRange = [2005, adapted.yearRange[1]]
        incompatibleFilters.push({
          name: 'yearRange',
          value: oldRange,
          reason: 'Spending data is only available from 2015 onwards'
        })
      }
    }
    
    return {
      adaptedFilters: adapted,
      incompatibleFilters
    }
  }

  /**
   * Get incompatible filters from last module switch
   * @returns {Array} Array of incompatible filter objects
   */
  getIncompatibleFilters() {
    return this.incompatibleFilters
  }

  /**
   * Clear incompatible filters notification
   */
  clearIncompatibleFilters() {
    this.incompatibleFilters = []
  }

  /**
   * Check if there are incompatible filters
   * @returns {boolean} True if there are incompatible filters
   */
  hasIncompatibleFilters() {
    return this.incompatibleFilters.length > 0
  }

  /**
   * Cleanup method for destroying the manager
   * Clears all timers and listeners
   */
  destroy() {
    this.cancelPendingUpdates()
    this.listeners = []
    this.loadingListeners = []
    this.moduleListeners = {}
  }

  /**
   * Get incompatible filters (disabled - always returns empty array)
   * @returns {Array} Empty array
   */
  getIncompatibleFilters() {
    return []
  }

  /**
   * Clear incompatible filters (disabled - no-op)
   */
  clearIncompatibleFilters() {
    // No-op: incompatible filter warnings are disabled
  }
}

// Export singleton instance for application-wide use
export const filterStateManager = new FilterStateManager()

// Export class for testing purposes
export default filterStateManager
