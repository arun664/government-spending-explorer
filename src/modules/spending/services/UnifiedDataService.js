import * as d3 from 'd3'

/**
 * Unified Data Service for Government Spending Analysis
 * Pre-processes all 48 indicators into a single, optimized data structure
 */

// All 48 indicators with their metadata
// Note: All values are in millions of domestic currency (USD, EUR, INR, etc.)
export const INDICATOR_METADATA = {
  'GE': { name: 'Total Government Expense', category: 'overview', icon: '💰', unit: 'Millions' },
  'GECE': { name: 'Compensation of Employees', category: 'personnel', icon: '👥', unit: 'Millions' },
  'GECES': { name: 'Compensation + Social Benefits', category: 'personnel', icon: '👥💼', unit: 'M (Local)' },
  'GECESA': { name: 'Compensation + Social Benefits (Adjusted)', category: 'personnel', icon: '👥📊', unit: 'M (Local)' },
  'GECESI': { name: 'Compensation + Social Benefits (Insurance)', category: 'personnel', icon: '👥🛡️', unit: 'M (Local)' },
  'GECEW': { name: 'Compensation + Welfare', category: 'personnel', icon: '👥🤝', unit: 'M (Local)' },
  'GEG': { name: 'Total Grants', category: 'transfers', icon: '🎁', unit: 'M (Local)' },
  'GEG_FG': { name: 'Federal Grants', category: 'transfers', icon: '🏛️', unit: 'M (Local)' },
  'GEG_GG': { name: 'General Government Grants', category: 'transfers', icon: '🏢', unit: 'M (Local)' },
  'GEG_IO': { name: 'International Organization Grants', category: 'transfers', icon: '🌍', unit: 'M (Local)' },
  'GEGC_FG': { name: 'Current Federal Grants', category: 'transfers', icon: '🏛️💸', unit: 'M (Local)' },
  'GEGC_GG': { name: 'Current General Government Grants', category: 'transfers', icon: '🏢💸', unit: 'M (Local)' },
  'GEGC_IO': { name: 'Current International Grants', category: 'transfers', icon: '🌍💸', unit: 'M (Local)' },
  'GEGK_FG': { name: 'Capital Federal Grants', category: 'transfers', icon: '🏛️🏗️', unit: 'M (Local)' },
  'GEGK_GG': { name: 'Capital General Government Grants', category: 'transfers', icon: '🏢🏗️', unit: 'M (Local)' },
  'GEGK_IO': { name: 'Capital International Grants', category: 'transfers', icon: '🌍🏗️', unit: 'M (Local)' },
  'GEGS': { name: 'Subsidies', category: 'transfers', icon: '💰🏭', unit: 'M (Local)' },
  'GEI': { name: 'Total Interest', category: 'debt', icon: '📈', unit: 'M (Local)' },
  'GEI_GG': { name: 'Interest to General Government', category: 'debt', icon: '📈🏢', unit: 'M (Local)' },
  'GEI_NGG': { name: 'Interest to Non-Government', category: 'debt', icon: '📈🏦', unit: 'M (Local)' },
  'GEI_NRES': { name: 'Interest to Non-Residents', category: 'debt', icon: '📈🌍', unit: 'M (Local)' },
  'GEKC': { name: 'Consumption of Fixed Capital', category: 'debt', icon: '🏗️📉', unit: 'M (Local)' },
  'GEO': { name: 'Total Other Expenses', category: 'other', icon: '📋', unit: 'M (Local)' },
  'GEOM': { name: 'Use of Goods and Services', category: 'operations', icon: '🛒', unit: 'M (Local)' },
  'GEOMC': { name: 'Use of Goods and Services (Current)', category: 'operations', icon: '🛒💸', unit: 'M (Local)' },
  'GEOMK': { name: 'Use of Goods and Services (Capital)', category: 'operations', icon: '🛒🏗️', unit: 'M (Local)' },
  'GEOO': { name: 'Other Miscellaneous Expenses', category: 'other', icon: '📋❓', unit: 'M (Local)' },
  'GEOOC': { name: 'Other Current Expenses', category: 'other', icon: '📋💸', unit: 'M (Local)' },
  'GEOOP': { name: 'Other Property Expenses', category: 'other', icon: '🏠💸', unit: 'M (Local)' },
  'GEOOPC': { name: 'Other Property Current Expenses', category: 'other', icon: '🏠💰', unit: 'M (Local)' },
  'GEOOPF': { name: 'Other Property Financial Expenses', category: 'other', icon: '🏠💳', unit: 'M (Local)' },
  'GEOP': { name: 'Public Order and Safety', category: 'services', icon: '👮‍♂️', unit: 'M (Local)' },
  'GEOPD': { name: 'Defense', category: 'services', icon: '🛡️', unit: 'M (Local)' },
  'GEOPE': { name: 'Economic Affairs', category: 'services', icon: '💼', unit: 'M (Local)' },
  'GEOPP': { name: 'Public Order', category: 'services', icon: '⚖️', unit: 'M (Local)' },
  'GEOPR': { name: 'Recreation and Culture', category: 'services', icon: '🎭', unit: 'M (Local)' },
  'GEOPW': { name: 'Environmental Protection', category: 'services', icon: '🌱', unit: 'M (Local)' },
  'GES': { name: 'Total Social Benefits', category: 'social', icon: '🤝', unit: 'M (Local)' },
  'GES_CA': { name: 'Social Benefits (Cash)', category: 'social', icon: '💵', unit: 'M (Local)' },
  'GES_IK': { name: 'Social Benefits (In-Kind)', category: 'social', icon: '🎁', unit: 'M (Local)' },
  'GESA': { name: 'Social Assistance', category: 'social', icon: '🤲', unit: 'M (Local)' },
  'GESE': { name: 'Employment Benefits', category: 'social', icon: '💼🤝', unit: 'M (Local)' },
  'GESS': { name: 'Social Security', category: 'social', icon: '🛡️🤝', unit: 'M (Local)' },
  'GEST': { name: 'Education', category: 'programs', icon: '🎓', unit: 'M (Local)' },
  'GEST_OS': { name: 'Other Services', category: 'programs', icon: '🏛️', unit: 'M (Local)' },
  'GEST_PCO': { name: 'Public Order (Detailed)', category: 'programs', icon: '👮‍♂️📊', unit: 'M (Local)' },
  'GEST_PE': { name: 'Public Enterprises', category: 'programs', icon: '🏭', unit: 'M (Local)' }
}

// Import category colors from ColorSchemeService to ensure consistency
// These colors MUST match ColorSchemeService.js exactly
export const CATEGORY_COLORS = {
  overview: '#667eea',      // Purple-blue
  personnel: '#f093fb',     // Pink-purple
  transfers: '#4facfe',     // Light blue
  debt: '#f5576c',          // Red-pink
  operations: '#43e97b',    // Green
  other: '#ffa726',         // Orange
  services: '#ab47bc',      // Purple
  social: '#26c6da',        // Cyan
  programs: '#66bb6a'       // Green
}

/**
 * Unified data structure for all indicators
 * Structure: {
 *   countries: {
 *     [countryName]: {
 *       name: string,
 *       code: string,
 *       indicators: {
 *         [indicatorCode]: {
 *           [year]: value
 *         }
 *       }
 *     }
 *   },
 *   indicators: {
 *     [indicatorCode]: {
 *       metadata: {...},
 *       globalStats: {...},
 *       years: [...],
 *       countries: [...]
 *     }
 *   },
 *   years: [...],
 *   lastUpdated: timestamp
 * }
 */
let unifiedData = null
let loadingPromise = null
let loadingStatus = {
  isLoading: false,
  progress: 0,
  loadedIndicators: 0,
  totalIndicators: 48,
  errors: []
}

/**
 * Get current loading status
 * @returns {Object} Loading status with progress information
 */
export function getLoadingStatus() {
  return { ...loadingStatus }
}

/**
 * Check if data is already loaded
 * @returns {boolean} True if unified data is cached
 */
export function isDataLoaded() {
  return unifiedData !== null
}

/**
 * Preload unified data in the background
 * Can be called on app startup to load data before it's needed
 * @returns {Promise} Promise that resolves when data is loaded
 */
export function preloadUnifiedData() {
  console.log('🚀 Preloading all 48 indicators in background...')
  return loadUnifiedData()
}

/**
 * Load and process all 48 indicators into unified structure
 * @returns {Promise<Object>} Unified data structure
 */
export async function loadUnifiedData() {
  // Return cached data if available
  if (unifiedData) {
    console.log('✅ Using cached unified data')
    return unifiedData
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    console.log('⏳ Waiting for existing load operation...')
    return loadingPromise
  }

  loadingStatus.isLoading = true
  loadingStatus.progress = 0
  loadingStatus.loadedIndicators = 0
  loadingStatus.errors = []

  loadingPromise = processAllIndicators()
  unifiedData = await loadingPromise
  loadingPromise = null
  
  loadingStatus.isLoading = false
  loadingStatus.progress = 100
  
  return unifiedData
}

/**
 * Process all indicator CSV files into unified structure
 */
async function processAllIndicators() {
  const startTime = Date.now()
  console.log('📊 Loading and processing all 48 indicators...')
  
  const data = {
    countries: {},
    indicators: {},
    years: new Set(),
    categories: Object.keys(CATEGORY_COLORS),
    lastUpdated: new Date().toISOString()
  }

  const totalIndicators = Object.keys(INDICATOR_METADATA).length
  let loadedCount = 0

  // Load all CSV files in parallel with progress tracking
  const loadPromises = Object.keys(INDICATOR_METADATA).map(async (indicatorCode) => {
    try {
      const metadata = INDICATOR_METADATA[indicatorCode]
      const fileName = `IMF_GFSE_${indicatorCode}_G14.csv`
      
      const { getDataPath } = await import('../../../utils/pathUtils.js')
      const csvData = await d3.csv(getDataPath(`48-indicators/${fileName}`))
      
      loadedCount++
      loadingStatus.loadedIndicators = loadedCount
      loadingStatus.progress = Math.round((loadedCount / totalIndicators) * 100)
      
      console.log(`✓ Loaded ${indicatorCode} (${loadedCount}/${totalIndicators})`)
      
      return { indicatorCode, metadata, csvData }
    } catch (error) {
      console.warn(`✗ Failed to load ${indicatorCode}:`, error.message)
      loadingStatus.errors.push({ indicatorCode, error: error.message })
      return null
    }
  })

  const results = await Promise.all(loadPromises)
  const validResults = results.filter(result => result !== null)

  const loadTime = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`✅ Successfully loaded ${validResults.length}/${totalIndicators} indicators in ${loadTime}s`)

  // Process each indicator
  validResults.forEach(({ indicatorCode, metadata, csvData }) => {
    const indicatorData = {
      metadata,
      countries: new Set(),
      years: new Set(),
      values: [],
      globalStats: null
    }

    // Process CSV rows
    const countryYearData = {}
    
    csvData.forEach(row => {
      const country = row.REF_AREA_LABEL
      const year = parseInt(row.TIME_PERIOD)
      const value = parseFloat(row.OBS_VALUE)
      const sector = row.COMP_BREAKDOWN_1_LABEL || 'Unknown'
      
      if (!country || isNaN(year) || isNaN(value)) return

      // Initialize country in unified data
      if (!data.countries[country]) {
        data.countries[country] = {
          name: country,
          code: row.REF_AREA || country.substring(0, 3).toUpperCase(),
          indicators: {}
        }
      }

      // Initialize indicator for country
      if (!data.countries[country].indicators[indicatorCode]) {
        data.countries[country].indicators[indicatorCode] = {}
      }

      // Aggregate values by country-year (handle multiple sectors)
      const key = `${country}-${year}`
      if (!countryYearData[key]) {
        countryYearData[key] = {
          country,
          year,
          values: [],
          sectors: []
        }
      }
      
      countryYearData[key].values.push(value)
      countryYearData[key].sectors.push(sector)
    })

    // Process aggregated data
    Object.values(countryYearData).forEach(({ country, year, values, sectors }) => {
      // Aggregate multiple sectors (sum for most indicators)
      let aggregatedValue
      
      if (sectors.some(s => s.includes('Central government (excl. social security)'))) {
        // Prefer comprehensive central government data
        const centralGovIndex = sectors.findIndex(s => s.includes('Central government (excl. social security)'))
        aggregatedValue = values[centralGovIndex]
      } else if (values.length === 1) {
        aggregatedValue = values[0]
      } else {
        // Sum multiple sectors
        aggregatedValue = values.reduce((sum, val) => sum + val, 0)
      }

      // Store in unified structure
      data.countries[country].indicators[indicatorCode][year] = aggregatedValue
      
      // Track for indicator stats
      indicatorData.countries.add(country)
      indicatorData.years.add(year)
      indicatorData.values.push(aggregatedValue)
      data.years.add(year)
    })

    // Calculate global statistics for indicator
    if (indicatorData.values.length > 0) {
      indicatorData.globalStats = {
        minValue: Math.min(...indicatorData.values),
        maxValue: Math.max(...indicatorData.values),
        avgValue: indicatorData.values.reduce((a, b) => a + b, 0) / indicatorData.values.length,
        totalCountries: indicatorData.countries.size,
        totalDataPoints: indicatorData.values.length,
        yearRange: [Math.min(...indicatorData.years), Math.max(...indicatorData.years)]
      }
    }

    // Convert sets to arrays
    indicatorData.countries = Array.from(indicatorData.countries)
    indicatorData.years = Array.from(indicatorData.years).sort()
    
    data.indicators[indicatorCode] = indicatorData
  })

  // Convert years set to sorted array
  data.years = Array.from(data.years).sort()

  console.log('Unified data processing complete:', {
    countries: Object.keys(data.countries).length,
    indicators: Object.keys(data.indicators).length,
    years: data.years.length,
    yearRange: [data.years[0], data.years[data.years.length - 1]]
  })

  return data
}

/**
 * Get indicator data for visualization
 */
export function getIndicatorData(indicatorCode, yearRange = null) {
  if (!unifiedData || !unifiedData.indicators[indicatorCode]) {
    return null
  }

  const indicator = unifiedData.indicators[indicatorCode]
  const countries = {}

  // Filter by year range if specified
  const startYear = yearRange ? yearRange[0] : Math.min(...indicator.years)
  const endYear = yearRange ? yearRange[1] : Math.max(...indicator.years)

  // Process country data
  Object.entries(unifiedData.countries).forEach(([countryName, countryData]) => {
    if (countryData.indicators[indicatorCode]) {
      const yearData = {}
      let hasData = false

      Object.entries(countryData.indicators[indicatorCode]).forEach(([year, value]) => {
        const y = parseInt(year)
        if (y >= startYear && y <= endYear && !isNaN(value)) {
          yearData[year] = value
          hasData = true
        }
      })

      if (hasData) {
        countries[countryName] = {
          name: countryName,
          code: countryData.code,
          data: yearData
        }
      }
    }
  })

  // Calculate filtered statistics
  const allValues = Object.values(countries)
    .flatMap(country => Object.values(country.data))
    .filter(value => !isNaN(value))

  const globalStats = allValues.length > 0 ? {
    minSpending: Math.min(...allValues),
    maxSpending: Math.max(...allValues),
    avgSpending: allValues.reduce((a, b) => a + b, 0) / allValues.length,
    totalCountries: Object.keys(countries).length,
    totalDataPoints: allValues.length
  } : null

  return {
    indicator: indicatorCode,
    name: indicator.metadata.name,
    description: `${indicator.metadata.name} - Government spending data`,
    category: indicator.metadata.category,
    icon: indicator.metadata.icon,
    unit: indicator.metadata.unit,
    countries,
    years: indicator.years.filter(y => y >= startYear && y <= endYear),
    globalStats
  }
}

/**
 * Get data for multiple indicators (for comparison charts)
 */
export function getMultiIndicatorData(indicatorCodes, yearRange = null) {
  return indicatorCodes.map(code => getIndicatorData(code, yearRange)).filter(Boolean)
}

/**
 * Get country data across all indicators
 */
export function getCountryData(countryName, indicatorCodes = null) {
  if (!unifiedData || !unifiedData.countries[countryName]) {
    return null
  }

  const countryData = unifiedData.countries[countryName]
  const indicators = indicatorCodes || Object.keys(countryData.indicators)
  
  const result = {
    name: countryName,
    code: countryData.code,
    indicators: {}
  }

  indicators.forEach(indicatorCode => {
    if (countryData.indicators[indicatorCode]) {
      result.indicators[indicatorCode] = {
        metadata: INDICATOR_METADATA[indicatorCode],
        data: countryData.indicators[indicatorCode]
      }
    }
  })

  return result
}

/**
 * Get summary statistics for dashboard
 */
export function getSummaryStats() {
  if (!unifiedData) return null

  return {
    totalCountries: Object.keys(unifiedData.countries).length,
    totalIndicators: Object.keys(unifiedData.indicators).length,
    yearRange: [unifiedData.years[0], unifiedData.years[unifiedData.years.length - 1]],
    categories: unifiedData.categories,
    lastUpdated: unifiedData.lastUpdated
  }
}

/**
 * Search countries by name
 */
export function searchCountries(query) {
  if (!unifiedData || !query) return []

  const lowerQuery = query.toLowerCase()
  return Object.keys(unifiedData.countries)
    .filter(country => country.toLowerCase().includes(lowerQuery))
    .map(country => ({
      countryName: country,
      countryCode: unifiedData.countries[country].code
    }))
    .slice(0, 10) // Limit results
}