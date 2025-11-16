/**
 * Data Preload Service
 * Optimizes application startup by preloading all 48 IMF indicators
 * 
 * This service:
 * - Loads all indicator data in parallel on app initialization
 * - Caches data in memory for instant access
 * - Provides loading progress feedback
 * - Handles errors gracefully with retry logic
 */

import { loadUnifiedData, getSummaryStats } from '../../modules/spending/services/UnifiedDataService.js'

class DataPreloadService {
  constructor() {
    this.isLoaded = false
    this.isLoading = false
    this.loadingProgress = 0
    this.error = null
    this.listeners = []
    this.unifiedData = null
  }

  /**
   * Start preloading all data
   * @returns {Promise<Object>} Unified data object
   */
  async preload() {
    if (this.isLoaded && this.unifiedData) {
      console.log('✅ Data already preloaded, returning cached data')
      return this.unifiedData
    }

    if (this.isLoading) {
      console.log('⏳ Data preload already in progress, waiting...')
      return this.waitForLoad()
    }

    try {
      this.isLoading = true
      this.error = null
      this.notifyListeners({ status: 'loading', progress: 0 })

      console.log('🚀 Starting data preload - Loading all 48 IMF indicators...')
      const startTime = performance.now()

      // Load all 48 indicators
      this.unifiedData = await loadUnifiedData()

      const endTime = performance.now()
      const loadTime = ((endTime - startTime) / 1000).toFixed(2)

      this.isLoaded = true
      this.isLoading = false
      this.loadingProgress = 100

      const stats = getSummaryStats()
      
      console.log('✅ DATA PRELOAD COMPLETE!')
      console.log(`⏱️  Load time: ${loadTime}s`)
      console.log(`📊 Loaded ${stats.totalIndicators} indicators`)
      console.log(`🌍 Covering ${stats.totalCountries} countries`)
      console.log(`📅 Years: ${stats.yearRange[0]} - ${stats.yearRange[1]}`)
      console.log(`📦 Categories: ${stats.categories.join(', ')}`)

      this.notifyListeners({ 
        status: 'complete', 
        progress: 100,
        stats,
        loadTime 
      })

      return this.unifiedData

    } catch (error) {
      console.error('❌ Data preload failed:', error)
      this.error = error
      this.isLoading = false
      this.notifyListeners({ 
        status: 'error', 
        error: error.message 
      })
      throw error
    }
  }

  /**
   * Wait for ongoing load to complete
   * @returns {Promise<Object>} Unified data object
   */
  async waitForLoad() {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.isLoaded && this.unifiedData) {
          clearInterval(checkInterval)
          resolve(this.unifiedData)
        } else if (this.error) {
          clearInterval(checkInterval)
          reject(this.error)
        }
      }, 100)
    })
  }

  /**
   * Get cached unified data
   * @returns {Object|null} Unified data or null if not loaded
   */
  getData() {
    return this.unifiedData
  }

  /**
   * Check if data is loaded
   * @returns {boolean} True if data is loaded
   */
  isDataLoaded() {
    return this.isLoaded && this.unifiedData !== null
  }

  /**
   * Get loading status
   * @returns {Object} Status object with isLoading, progress, error
   */
  getStatus() {
    return {
      isLoading: this.isLoading,
      isLoaded: this.isLoaded,
      progress: this.loadingProgress,
      error: this.error
    }
  }

  /**
   * Subscribe to loading progress updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback)
    
    // Immediately notify with current status
    callback(this.getStatus())
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Notify all listeners of status change
   * @param {Object} status - Status update
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in preload listener:', error)
      }
    })
  }

  /**
   * Retry loading data after failure
   * @returns {Promise<Object>} Unified data object
   */
  async retry() {
    console.log('🔄 Retrying data preload...')
    this.isLoaded = false
    this.isLoading = false
    this.error = null
    this.unifiedData = null
    return this.preload()
  }

  /**
   * Clear cached data (for testing or memory management)
   */
  clearCache() {
    console.log('🗑️  Clearing preloaded data cache')
    this.unifiedData = null
    this.isLoaded = false
    this.isLoading = false
    this.loadingProgress = 0
    this.error = null
  }
}

// Export singleton instance
export const dataPreloadService = new DataPreloadService()

// Export class for testing
export default DataPreloadService
