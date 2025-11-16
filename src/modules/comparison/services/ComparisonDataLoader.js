/**
 * ComparisonDataLoader - Independent data loading service for comparison module
 * 
 * This class provides completely independent data loading capabilities for GDP and spending data
 * without relying on other modules. It includes caching, error handling, and data validation.
 * 
 * Requirements addressed:
 * - Independent GDP and spending data loading
 * - Data validation and error handling
 * - Caching specific to comparison module
 */

import * as d3 from 'd3'

export class ComparisonDataLoader {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.loadingPromises = new Map()
    
    // Performance optimization settings
    this.maxRecordsPerCountry = 20 // Limit records per country
    this.maxCountries = 50 // Limit total countries for initial load
    this.sampleSize = 1000 // Maximum sample size for large datasets
    this.priorityCountries = [
      'United States', 'China', 'Germany', 'Japan', 'United Kingdom',
      'France', 'Italy', 'Brazil', 'Canada', 'Russia', 'India', 'Spain',
      'Australia', 'Mexico', 'South Korea', 'Netherlands', 'Turkey',
      'Saudi Arabia', 'Switzerland', 'Belgium'
    ]
  }

  /**
   * Get data path for a given filename
   * @param {string} filename - The filename to get path for
   * @returns {string} Full path to the data file
   */
  getDataPath(filename) {
    // Handle both development and production paths
    // Check if we're in a browser environment with Vite
    const isDev = typeof import.meta !== 'undefined' && 
                  import.meta.env && 
                  import.meta.env.DEV
    const basePath = isDev ? '/data/' : './data/'
    return `${basePath}${filename}`
  }

  /**
   * Check if cached data is still valid
   * @param {string} key - Cache key
   * @returns {boolean} True if cache is valid
   */
  isCacheValid(key) {
    if (!this.cache.has(key)) return false
    
    const expiry = this.cacheExpiry.get(key)
    return expiry && Date.now() < expiry
  }

  /**
   * Sample large datasets for better performance
   * @param {Array} data - Full dataset
   * @param {Object} options - Sampling options
   * @returns {Array} Sampled dataset
   */
  _sampleData(data, options = {}) {
    const { 
      maxRecords = this.sampleSize,
      prioritizeCountries = true,
      yearRange = null 
    } = options

    if (data.length <= maxRecords) {
      return data
    }

    let sampledData = [...data]

    // Filter by year range if specified
    if (yearRange && yearRange.length === 2) {
      sampledData = sampledData.filter(d => 
        d.year >= yearRange[0] && d.year <= yearRange[1]
      )
    }

    // Prioritize important countries
    if (prioritizeCountries) {
      const priorityData = sampledData.filter(d => 
        this.priorityCountries.includes(d.countryName)
      )
      const otherData = sampledData.filter(d => 
        !this.priorityCountries.includes(d.countryName)
      )

      // Take all priority country data + sample from others
      const remainingSlots = Math.max(0, maxRecords - priorityData.length)
      const sampledOthers = this._randomSample(otherData, remainingSlots)
      
      sampledData = [...priorityData, ...sampledOthers]
    } else {
      // Random sampling
      sampledData = this._randomSample(sampledData, maxRecords)
    }

    console.log(`Sampled ${sampledData.length} records from ${data.length} total records`)
    return sampledData
  }

  /**
   * Random sampling utility
   * @param {Array} array - Array to sample from
   * @param {number} size - Sample size
   * @returns {Array} Sampled array
   */
  _randomSample(array, size) {
    if (array.length <= size) return array
    
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, size)
  }

  /**
   * Optimize data by country limits
   * @param {Array} data - Full dataset
   * @returns {Array} Optimized dataset
   */
  _optimizeByCountry(data) {
    const countryGroups = new Map()
    
    // Group by country
    data.forEach(record => {
      const country = record.countryName
      if (!countryGroups.has(country)) {
        countryGroups.set(country, [])
      }
      countryGroups.get(country).push(record)
    })

    // Limit countries and records per country
    const optimizedData = []
    let countryCount = 0
    
    // Process priority countries first
    for (const country of this.priorityCountries) {
      if (countryGroups.has(country) && countryCount < this.maxCountries) {
        const countryData = countryGroups.get(country)
        const limitedData = countryData
          .sort((a, b) => b.year - a.year) // Most recent first
          .slice(0, this.maxRecordsPerCountry)
        
        optimizedData.push(...limitedData)
        countryCount++
        countryGroups.delete(country)
      }
    }

    // Add remaining countries up to limit
    for (const [country, records] of countryGroups.entries()) {
      if (countryCount >= this.maxCountries) break
      
      const limitedData = records
        .sort((a, b) => b.year - a.year)
        .slice(0, this.maxRecordsPerCountry)
      
      optimizedData.push(...limitedData)
      countryCount++
    }

    console.log(`Optimized to ${optimizedData.length} records from ${countryCount} countries`)
    return optimizedData
  }

  /**
   * Get country code from country name using GDP data as reference
   * @param {string} countryName - Full country name
   * @returns {Promise<string>} Country code
   */
  async _getCountryCode(countryName) {
    // Try to get country code from GDP data which has both name and code
    try {
      if (!this._countryCodeCache) {
        const gdpData = await this.loadGDPData()
        this._countryCodeCache = new Map()
        
        gdpData.forEach(record => {
          if (record.countryName && record.countryCode) {
            this._countryCodeCache.set(record.countryName, record.countryCode)
          }
        })
      }
      
      // Try direct match
      if (this._countryCodeCache.has(countryName)) {
        return this._countryCodeCache.get(countryName)
      }
      
      // Try normalized match using existing country mapping
      const { normalizeCountryName } = await import('../../spending/utils/countryMapping.js')
      const normalizedName = normalizeCountryName(countryName)
      
      if (this._countryCodeCache.has(normalizedName)) {
        return this._countryCodeCache.get(normalizedName)
      }
      
      // Try partial match
      for (const [name, code] of this._countryCodeCache.entries()) {
        if (name.toLowerCase().includes(countryName.toLowerCase()) || 
            countryName.toLowerCase().includes(name.toLowerCase())) {
          return code
        }
      }
      
    } catch (error) {
      console.warn('Failed to load country codes from GDP data:', error)
    }
    
    // Fallback to simple abbreviation
    return countryName.substring(0, 3).toUpperCase()
  }

  /**
   * Try loading data from multiple sources until one succeeds
   * @param {Array} dataSources - Array of filenames to try
   * @param {Object} options - Loading options
   * @returns {Promise<Array>} Array of data objects
   */
  async _tryMultipleDataSources(dataSources, options = {}) {
    let lastError = null
    
    for (const filename of dataSources) {
      try {
        console.log(`Attempting to load spending data from: ${filename}`)
        const data = await this._loadSpendingDataFromSource({ ...options, filename })
        
        if (data && data.length > 0) {
          console.log(`Successfully loaded spending data from: ${filename}`)
          return data
        }
      } catch (error) {
        console.warn(`Failed to load from ${filename}:`, error.message)
        lastError = error
        continue
      }
    }

    // If all sources failed, throw the last error
    throw new Error(`Failed to load spending data from all sources: ${lastError?.message || 'All data sources failed'}`)
  }

  /**
   * Resolve country codes for data that doesn't have them
   * @param {Array} data - Array of data objects
   * @returns {Promise<Array>} Array of data objects with resolved country codes
   */
  async _resolveCountryCodes(data) {
    const uniqueCountries = [...new Set(data.map(d => d.countryName).filter(name => name))]
    const countryCodeMap = new Map()
    
    // Resolve country codes for unique countries
    for (const countryName of uniqueCountries) {
      try {
        const countryCode = await this._getCountryCode(countryName)
        countryCodeMap.set(countryName, countryCode)
      } catch (error) {
        console.warn(`Failed to resolve country code for ${countryName}:`, error)
        countryCodeMap.set(countryName, countryName.substring(0, 3).toUpperCase())
      }
    }
    
    // Apply resolved country codes to data
    return data.map(record => ({
      ...record,
      countryCode: record.countryCode || countryCodeMap.get(record.countryName) || record.countryName?.substring(0, 3).toUpperCase()
    }))
  }

  /**
   * Set data in cache with expiry
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, data)
    this.cacheExpiry.set(key, Date.now() + this.cacheTimeout)
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   */
  getCache(key) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)
    }
    
    // Clean up expired cache
    this.cache.delete(key)
    this.cacheExpiry.delete(key)
    return null
  }

  /**
   * Load GDP data independently
   * @param {Object} options - Loading options
   * @returns {Promise<Array>} Array of GDP data objects
   */
  async loadGDPData(options = {}) {
    const cacheKey = `gdp_${JSON.stringify(options)}`
    
    // Check cache first
    const cachedData = this.getCache(cacheKey)
    if (cachedData) {
      console.log('Returning cached GDP data')
      return cachedData
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)
    }

    const loadingPromise = this._loadGDPDataFromSource(options)
    this.loadingPromises.set(cacheKey, loadingPromise)

    try {
      const data = await loadingPromise
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error loading GDP data:', error)
      throw new Error(`Failed to load GDP data: ${error.message}`)
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  /**
   * Internal method to load GDP data from source
   * @param {Object} options - Loading options
   * @returns {Promise<Array>} Array of GDP data objects
   */
  async _loadGDPDataFromSource(options = {}) {
    const filename = options.filename || 'gdp_clean.csv'
    const dataPath = this.getDataPath(filename)

    try {
      const data = await d3.csv(dataPath, (d, i) => {
        // Validate required fields
        if (!d['Country Name'] || !d['Country Code'] || !d['Year'] || !d['GDP Growth']) {
          console.warn(`Invalid GDP data row ${i}:`, d)
          return null
        }

        const gdpGrowth = +d['GDP Growth']
        const year = +d['Year']

        // Validate numeric values
        if (isNaN(gdpGrowth) || isNaN(year)) {
          console.warn(`Invalid numeric values in GDP data row ${i}:`, d)
          return null
        }

        return {
          countryName: d['Country Name'].trim(),
          countryCode: d['Country Code'].trim(),
          year: year,
          gdpGrowth: gdpGrowth,
          dataSource: 'gdp_clean.csv',
          loadedAt: new Date().toISOString()
        }
      })

      // Filter out null entries from validation
      const validData = data.filter(d => d !== null)
      
      console.log(`Loaded ${validData.length} valid GDP records from ${data.length} total rows`)
      
      if (validData.length === 0) {
        throw new Error('No valid GDP data found')
      }

      return this._validateAndEnrichGDPData(validData, options)
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        throw new Error(`GDP data file not found: ${dataPath}`)
      }
      throw error
    }
  }

  /**
   * Load spending data independently
   * @param {Object} options - Loading options
   * @returns {Promise<Array>} Array of spending data objects
   */
  async loadSpendingData(options = {}) {
    const cacheKey = `spending_${JSON.stringify(options)}`
    
    // Check cache first
    const cachedData = this.getCache(cacheKey)
    if (cachedData) {
      console.log('Returning cached spending data')
      return cachedData
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)
    }

    // Try multiple data sources in order of preference
    const dataSources = [
      'expense_clean.csv',
      '48-indicators/IMF_GFSE_GE_G14.csv',
      'total_government_expense_matrix.csv'
    ]

    const loadingPromise = this._tryMultipleDataSources(dataSources, options)
    this.loadingPromises.set(cacheKey, loadingPromise)

    try {
      const data = await loadingPromise
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error loading spending data:', error)
      throw new Error(`Failed to load spending data: ${error.message}`)
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  /**
   * Internal method to load spending data from source
   * @param {Object} options - Loading options
   * @returns {Promise<Array>} Array of spending data objects
   */
  async _loadSpendingDataFromSource(options = {}) {
    const filename = options.filename || 'expense_clean.csv'
    const dataPath = this.getDataPath(filename)

    try {
      const data = await d3.csv(dataPath, (d, i) => {
        // Detect CSV format and process accordingly
        const isIMFFormat = d['REF_AREA_LABEL'] && d['TIME_PERIOD'] && d['OBS_VALUE']
        const isCleanFormat = d['Country Name'] && d['Year'] && d['Value']
        
        if (isIMFFormat) {
          // Handle IMF 48-indicators format
          // Skip metadata rows silently
          if (d['STRUCTURE'] === 'datastructure' || d['ACTION'] === 'I') {
            return null
          }

          // Validate required fields
          if (!d['REF_AREA'] || !d['TIME_PERIOD'] || !d['OBS_VALUE']) {
            return null
          }

          const value = +d['OBS_VALUE']
          const year = +d['TIME_PERIOD']

          if (isNaN(value) || isNaN(year)) {
            return null
          }

          return {
            countryName: d['REF_AREA_LABEL'].trim(),
            countryCode: d['REF_AREA'].trim(),
            year: year,
            totalSpending: value,
            category: d['COMP_BREAKDOWN_1_LABEL'] || 'General Government Expenditure',
            unit: d['UNIT_MEASURE_LABEL'] || 'Domestic Currency',
            dataSource: filename,
            loadedAt: new Date().toISOString()
          }
        } else if (isCleanFormat) {
          // Handle clean CSV format (Country Name, Year, Value, Expense Category)
          const value = +d['Value']
          const year = +d['Year']

          if (isNaN(value) || isNaN(year) || !d['Country Name']) {
            return null
          }

          // Note: Country code will be resolved after CSV parsing
          return {
            countryName: d['Country Name'].trim(),
            countryCode: null, // Will be resolved later
            year: year,
            totalSpending: value,
            category: d['Expense Category'] || 'General Government Expenditure',
            unit: 'Percent of GDP',
            dataSource: filename,
            loadedAt: new Date().toISOString()
          }
        } else {
          // Unknown format, skip silently
          return null
        }
      })

      // Filter out null entries from validation
      const validData = data.filter(d => d !== null)
      
      console.log(`Loaded ${validData.length} valid spending records from ${data.length} total rows`)
      
      if (validData.length === 0) {
        throw new Error('No valid spending data found')
      }

      // Resolve country codes for clean format data
      const dataWithCodes = await this._resolveCountryCodes(validData)

      return this._validateAndEnrichSpendingData(dataWithCodes, options)
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        throw new Error(`Spending data file not found: ${dataPath}`)
      }
      throw error
    }
  }

  /**
   * Load both GDP and spending data
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Object containing both datasets
   */
  async loadComparisonData(options = {}) {
    try {
      const [gdpData, spendingData] = await Promise.all([
        this.loadGDPData(options.gdp),
        this.loadSpendingData(options.spending)
      ])

      return {
        gdp: gdpData,
        spending: spendingData,
        loadedAt: new Date().toISOString(),
        summary: {
          gdpRecords: gdpData.length,
          spendingRecords: spendingData.length,
          totalRecords: gdpData.length + spendingData.length
        }
      }
    } catch (error) {
      console.error('Error loading comparison data:', error)
      throw new Error(`Failed to load comparison data: ${error.message}`)
    }
  }

  /**
   * Validate and enrich GDP data
   * @param {Array} data - Raw GDP data
   * @param {Object} options - Validation options
   * @returns {Array} Validated and enriched data
   */
  _validateAndEnrichGDPData(data, options = {}) {
    // Apply performance optimizations first
    let optimizedData = data
    
    if (options.optimize !== false) {
      optimizedData = this._optimizeByCountry(data)
      
      // Apply additional sampling if still too large
      if (optimizedData.length > this.sampleSize) {
        optimizedData = this._sampleData(optimizedData, {
          maxRecords: this.sampleSize,
          yearRange: options.yearRange
        })
      }
    }

    const enrichedData = optimizedData.map(record => {
      // Add validation flags
      const validation = {
        isValid: true,
        warnings: [],
        errors: []
      }

      // Check for extreme values
      if (Math.abs(record.gdpGrowth) > 50) {
        validation.warnings.push('Extreme GDP growth value detected')
      }

      // Check for missing years
      if (record.year < 1960 || record.year > new Date().getFullYear()) {
        validation.warnings.push('Year outside expected range')
      }

      return {
        ...record,
        validation
      }
    })

    // Sort by country and year for consistency
    return enrichedData.sort((a, b) => {
      if (a.countryName !== b.countryName) {
        return a.countryName.localeCompare(b.countryName)
      }
      return a.year - b.year
    })
  }

  /**
   * Validate and enrich spending data
   * @param {Array} data - Raw spending data
   * @param {Object} options - Validation options (reserved for future use)
   * @returns {Array} Validated and enriched data
   */
  _validateAndEnrichSpendingData(data, options = {}) {
    const enrichedData = data.map(record => {
      // Add validation flags
      const validation = {
        isValid: true,
        warnings: [],
        errors: []
      }

      // Check for extreme values (assuming percentage of GDP)
      if (record.totalSpending > 100) {
        validation.warnings.push('Spending exceeds 100% of GDP')
      }

      if (record.totalSpending < 0) {
        validation.errors.push('Negative spending value')
        validation.isValid = false
      }

      // Check for missing years
      if (record.year < 1960 || record.year > new Date().getFullYear()) {
        validation.warnings.push('Year outside expected range')
      }

      return {
        ...record,
        validation
      }
    })

    // Sort by country and year for consistency
    return enrichedData.sort((a, b) => {
      if (a.countryName !== b.countryName) {
        return a.countryName.localeCompare(b.countryName)
      }
      return a.year - b.year
    })
  }

  /**
   * Get unique countries from loaded data
   * @param {Array} gdpData - GDP data array
   * @param {Array} spendingData - Spending data array
   * @returns {Array} Array of unique country names
   */
  getUniqueCountries(gdpData = [], spendingData = []) {
    const countries = new Set()
    
    gdpData.forEach(record => {
      if (record.countryName) {
        countries.add(record.countryName)
      }
    })
    
    spendingData.forEach(record => {
      if (record.countryName) {
        countries.add(record.countryName)
      }
    })
    
    return Array.from(countries).sort()
  }

  /**
   * Get unique years from loaded data
   * @param {Array} gdpData - GDP data array
   * @param {Array} spendingData - Spending data array
   * @returns {Array} Array of unique years
   */
  getUniqueYears(gdpData = [], spendingData = []) {
    const years = new Set()
    
    gdpData.forEach(record => {
      if (record.year) {
        years.add(record.year)
      }
    })
    
    spendingData.forEach(record => {
      if (record.year) {
        years.add(record.year)
      }
    })
    
    return Array.from(years).sort((a, b) => a - b)
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear()
    this.cacheExpiry.clear()
    console.log('Comparison data cache cleared')
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      cacheTimeout: this.cacheTimeout,
      activeLoading: this.loadingPromises.size
    }
  }
}

// Export singleton instance
export const comparisonDataLoader = new ComparisonDataLoader()