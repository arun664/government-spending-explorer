import * as d3 from 'd3'

/**
 * Unified Data Service for Government Spending Analysis
 * Pre-processes all 30 indicators into a single, optimized data structure
 */

// All 30 indicators with their metadata (7 categories)
// Note: All values are in domestic currency (actual values from IMF data)
// All 30 indicators now have data from the updated expense_clean.csv
export const INDICATOR_METADATA = {
  // Overview
  'GE': { name: 'Total Government Expense', category: 'overview', icon: '💰' },
  
  // Personnel
  'GECE': { name: 'Compensation of Employees', category: 'personnel', icon: '👥' },
  
  // Transfers & Grants
  'GEG': { name: 'Total Grants', category: 'transfers', icon: '🎁' },
  'GEG_FG': { name: 'Federal Grants', category: 'transfers', icon: '🏛️' },
  'GEG_GG': { name: 'General Government Grants', category: 'transfers', icon: '🏢' },
  'GEG_IO': { name: 'International Organization Grants', category: 'transfers', icon: '🌍' },
  'GEGC_FG': { name: 'Current Federal Grants', category: 'transfers', icon: '🏛️💸' },
  'GEGC_GG': { name: 'Current General Government Grants', category: 'transfers', icon: '🏢💸' },
  'GEGC_IO': { name: 'Current International Grants', category: 'transfers', icon: '🌍💸' },
  'GEGK_FG': { name: 'Capital Federal Grants', category: 'transfers', icon: '🏛️🏗️' },
  'GEGK_GG': { name: 'Capital General Government Grants', category: 'transfers', icon: '🏢🏗️' },
  'GEGK_IO': { name: 'Capital International Grants', category: 'transfers', icon: '🌍🏗️' },
  'GEGS': { name: 'Subsidies', category: 'transfers', icon: '💰🏭' },
  
  // Debt & Interest
  'GEI': { name: 'Total Interest', category: 'debt', icon: '📈' },
  'GEI_GG': { name: 'Interest to General Government', category: 'debt', icon: '📈🏢' },
  'GEI_NGG': { name: 'Interest to Non-Government', category: 'debt', icon: '📈🏦' },
  'GEI_NRES': { name: 'Interest to Non-Residents', category: 'debt', icon: '📈🌍' },
  'GEKC': { name: 'Consumption of Fixed Capital', category: 'debt', icon: '🏗️📉' },
  
  // Operations & Other
  'GEO': { name: 'Total Other Expenses', category: 'other', icon: '📋' },
  'GEOM': { name: 'Use of Goods and Services', category: 'operations', icon: '🛒' },
  'GEOO': { name: 'Other Miscellaneous Expenses', category: 'other', icon: '📋❓' },
  'GEOOC': { name: 'Other Current Expenses', category: 'other', icon: '📋💸' },
  'GEOOP': { name: 'Other Property Expenses', category: 'other', icon: '🏠💸' },
  'GEOOPF': { name: 'Other Property Financial Expenses', category: 'other', icon: '🏠💳' },
  
  // Social Benefits
  'GES': { name: 'Total Social Benefits', category: 'social', icon: '🤝' },
  'GES_CA': { name: 'Social Benefits (Cash)', category: 'social', icon: '💵' },
  'GES_IK': { name: 'Social Benefits (In-Kind)', category: 'social', icon: '🎁' },
  'GESA': { name: 'Social Assistance', category: 'social', icon: '🤲' },
  'GESE': { name: 'Employment Benefits', category: 'social', icon: '💼🤝' },
  'GESS': { name: 'Social Security', category: 'social', icon: '🛡️🤝' }
}

// Category colors - only for categories with actual data
// These colors MUST match ColorSchemeService.js exactly
export const CATEGORY_COLORS = {
  overview: '#667eea',      // Purple-blue - Total Expense
  personnel: '#f093fb',     // Pink-purple - Compensation
  transfers: '#4facfe',     // Light blue - Grants & Subsidies
  debt: '#f5576c',          // Red-pink - Interest & Capital
  operations: '#43e97b',    // Green - Goods & Services
  other: '#ffa726',         // Orange - Other Expenses & Property
  social: '#26c6da'         // Cyan - Social Benefits
}

// Category descriptions with indicator counts
export const CATEGORY_DESCRIPTIONS = {
  overview: 'Total Government Expense (1 indicator)',
  personnel: 'Compensation of Employees (1 indicator)',
  transfers: 'Grants & Subsidies (13 indicators)',
  debt: 'Interest & Capital (5 indicators)',
  operations: 'Goods & Services (1 indicator)',
  other: 'Other Expenses & Property (5 indicators)',
  social: 'Social Benefits (6 indicators)'
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
 *           [year]: {
 *             local: value,
 *             usd: value
 *           }
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
 * Now loads BOTH local and USD data simultaneously
 * @returns {Promise<Object>} Unified data structure
 */
export async function loadUnifiedData() {
  // Return cached data if available
  if (unifiedData && unifiedData.hasBothCurrencies) {
    console.log(`✅ Using cached unified data with both currencies`)
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
 * Mapping of expense categories to indicator codes
 * Maps all 48 expense categories from IMF data to the 48 indicator codes
 */
const CATEGORY_TO_CODE = {
  // Overview
  'Expense': 'GE',
  
  // Personnel / Compensation
  'Compensation of employees': 'GECE',
  'Compensation of Employees: Wages and salaries': 'GECE',
  'Compensation of Employees: Employers\' social contributions': 'GECE',
  'Compensation of Employees, employer\'s social contributions: Actual employers\' social contributions': 'GECE',
  'Compensation of Employees, employer\'s social contributions: Imputed employers\' social contributions': 'GECE',
  
  // Grants and Transfers
  'Grants expense': 'GEG',
  'Grants expense to foreign governments': 'GEG_FG',
  'Grants expense to other general government': 'GEG_GG',
  'Grants expense to international organizations': 'GEG_IO',
  'Grants expense to foreign governments: current': 'GEGC_FG',
  'Grants expense to other general government: current': 'GEGC_GG',
  'Grants expense to international organizations: current': 'GEGC_IO',
  'Grants expense to foreign governments: capital': 'GEGK_FG',
  'Grants expense to other general government: capital': 'GEGK_GG',
  'Grants expense to international organizations: capital': 'GEGK_IO',
  'Subsidies expense': 'GEGS',
  'Subsidies expense to private enterprises': 'GEGS',
  'Subsidies expense to public corporations': 'GEGS',
  'Subsidies expense to other sectors': 'GEGS',
  
  // Interest and Debt
  'Interest expense': 'GEI',
  'Interest expense to other gen gov': 'GEI_GG',
  'Interest expense to nonresidents': 'GEI_NRES',
  'Interest expense to residents other than general government': 'GEI_NGG',
  'Consumption of fixed capital': 'GEKC',
  
  // Other Transfers and Expenses
  'Expense on other transfers': 'GEO',
  'Expense on other transfers, current': 'GEOOC',
  'Expense on other transfers, capital': 'GEO',
  'Other expense': 'GEOO',
  
  // Operations
  'Use of goods and services': 'GEOM',
  
  // Property Expenses
  'Property expense other than interest': 'GEOOP',
  'Property expense other than interest: Dividend expense': 'GEOOP',
  'Property expense other than interest: Rent expense': 'GEOOP',
  'Property expense other than interest: Withdrawals of income from quasi-corporations': 'GEOOP',
  'Property expense other than interest: Property expense for investment income disbursements': 'GEOOPF',
  'Property expense other than interest: Reinvested earnings on FDI': 'GEOOPF',
  
  // Social Benefits
  'Social benefits expense': 'GES',
  'Social benefits expense in cash': 'GES_CA',
  'Social benefits expense in kind': 'GES_IK',
  'Social benefits expense: Employment-related social benefits expense': 'GESE',
  'Social benefits expense: Social assistance benefits expense': 'GESA',
  'Social benefits expense: Social security benefits expense': 'GESS',
  
  // Insurance and Social Security
  'Expense on NI & SGS: Premiums': 'GEO',
  'Expense on NI & SGS: Fees': 'GEO',
  'Expense on NI & SGS: Capital claims': 'GEO',
  'Expense on NI & SGS: Current claims': 'GEO',
  'Expense on NI & SGS: Premiums, fees, & claims': 'GEO',
  'Expense on NI & SGS: Premiums, fees, & current claims': 'GEO',
}

/**
 * Load data from unified expense_clean.csv file
 * Now loads BOTH local and USD data simultaneously
 */
async function loadFromUnifiedFile() {
  try {
    console.log(`📊 Loading both local and USD data...`)
    const { getDataPath } = await import('../../../utils/pathUtils.js')
    
    // Load both local and USD data
    const localData = await d3.csv(getDataPath('expense_clean.csv'))
    const usdData = await d3.csv(getDataPath('expense_clean_usd.csv'))
    
    console.log(`✓ Loaded expense_clean.csv with ${localData.length} rows`)
    console.log(`✓ Loaded expense_clean_usd.csv with ${usdData.length} rows`)
    
    const data = {
      countries: {},
      indicators: {},
      years: new Set(),
      categories: Object.keys(CATEGORY_COLORS),
      lastUpdated: new Date().toISOString()
    }

    // Create lookup map for USD values
    const usdLookup = {}
    usdData.forEach(row => {
      const country = row['Country Name']
      const category = row['Expense Category']
      const year = parseInt(row['Year'])
      const usdValue = parseFloat(row['Value_USD'])
      
      if (!country || !category || isNaN(year) || isNaN(usdValue)) return
      
      const key = `${country}|${category}|${year}`
      usdLookup[key] = usdValue
    })
    
    console.log(`✓ Created USD lookup with ${Object.keys(usdLookup).length} entries`)
    
    // Group by indicator code with both local and USD values
    const indicatorGroups = {}
    
    localData.forEach(row => {
      const country = row['Country Name']
      const category = row['Expense Category']
      const year = parseInt(row['Year'])
      const localValue = parseFloat(row['Value'])
      
      if (!country || !category || isNaN(year) || isNaN(localValue)) return
      
      // Map category to indicator code
      const indicatorCode = CATEGORY_TO_CODE[category]
      if (!indicatorCode) {
        return // Skip unmapped categories
      }
      
      // Get USD value from lookup
      const key = `${country}|${category}|${year}`
      const usdValue = usdLookup[key] || null
      
      // Initialize structures
      if (!indicatorGroups[indicatorCode]) {
        indicatorGroups[indicatorCode] = []
      }
      
      indicatorGroups[indicatorCode].push({
        country,
        year,
        localValue,
        usdValue
      })
      
      data.years.add(year)
    })

    // Process each indicator
    Object.entries(indicatorGroups).forEach(([indicatorCode, rows]) => {
      const metadata = INDICATOR_METADATA[indicatorCode]
      if (!metadata) return
      
      const indicatorData = {
        metadata,
        countries: new Set(),
        years: new Set(),
        values: [],
        globalStats: null
      }

      // Aggregate by country-year (handle multiple categories mapping to same code)
      const countryYearData = {}
      
      rows.forEach(({ country, year, localValue, usdValue }) => {
        const key = `${country}-${year}`
        
        if (!countryYearData[key]) {
          countryYearData[key] = {
            country,
            year,
            localValues: [],
            usdValues: []
          }
        }
        
        countryYearData[key].localValues.push(localValue)
        if (usdValue !== null && !isNaN(usdValue)) {
          countryYearData[key].usdValues.push(usdValue)
        }
      })

      // Process aggregated data
      Object.values(countryYearData).forEach(({ country, year, localValues, usdValues }) => {
        // Initialize country in unified data
        if (!data.countries[country]) {
          data.countries[country] = {
            name: country,
            code: country.substring(0, 3).toUpperCase(),
            indicators: {}
          }
        }

        // Initialize indicator for country
        if (!data.countries[country].indicators[indicatorCode]) {
          data.countries[country].indicators[indicatorCode] = {}
        }

        // Average multiple values if they exist
        const aggregatedLocal = localValues.reduce((sum, v) => sum + v, 0) / localValues.length
        const aggregatedUSD = usdValues.length > 0 
          ? usdValues.reduce((sum, v) => sum + v, 0) / usdValues.length 
          : null

        // Store BOTH local and USD values in unified structure
        data.countries[country].indicators[indicatorCode][year] = {
          local: aggregatedLocal,
          usd: aggregatedUSD
        }
        
        // Track for indicator stats (use local values for stats)
        indicatorData.countries.add(country)
        indicatorData.years.add(year)
        indicatorData.values.push(aggregatedLocal)
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
    
    // Mark that we have both currencies
    data.hasBothCurrencies = true

    console.log(`✅ Loaded from unified files with both local and USD data:`, {
      countries: Object.keys(data.countries).length,
      indicators: Object.keys(data.indicators).length,
      years: data.years.length,
      yearRange: [data.years[0], data.years[data.years.length - 1]],
      hasBothCurrencies: true
    })

    return data
  } catch (error) {
    console.warn('⚠️ Failed to load from unified files:', error.message)
    console.error(error)
    return null
  }
}

/**
 * Process all indicator CSV files into unified structure
 * Now loads both local and USD data
 */
async function processAllIndicators() {
  const startTime = Date.now()
  
  // Try loading from unified files first (both local and USD)
  const unifiedFileData = await loadFromUnifiedFile()
  if (unifiedFileData) {
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ Successfully loaded from unified files in ${loadTime}s`)
    loadingStatus.loadedIndicators = Object.keys(unifiedFileData.indicators).length
    loadingStatus.progress = 100
    return unifiedFileData
  }
  
  // Fallback to loading individual files
  console.log('📊 Falling back to loading individual 48 indicator files...')
  
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

      // Store in unified structure (fallback only has local values, no USD)
      data.countries[country].indicators[indicatorCode][year] = {
        local: aggregatedValue,
        usd: null
      }
      
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
  
  // Mark that fallback only has local currency
  data.hasBothCurrencies = false

  console.log('Unified data processing complete (fallback - local currency only):', {
    countries: Object.keys(data.countries).length,
    indicators: Object.keys(data.indicators).length,
    years: data.years.length,
    yearRange: [data.years[0], data.years[data.years.length - 1]],
    hasBothCurrencies: false
  })

  return data
}

/**
 * Get indicator data for visualization
 * @param {indicatorCode} string - Indicator code
 * @param {yearRange} Array - Optional year range [start, end]
 * @param {options} Object - Additional options
 */
export function getIndicatorData(indicatorCode, yearRange = null, options = {}) {
  if (!unifiedData || !unifiedData.indicators[indicatorCode]) {
    return null
  }

  const indicator = unifiedData.indicators[indicatorCode]
  const countries = {}

  // Filter by year range if specified
  const startYear = yearRange ? yearRange[0] : Math.min(...indicator.years)
  const endYear = yearRange ? yearRange[1] : Math.max(...indicator.years)

  // Process country data - now includes both local and USD values
  Object.entries(unifiedData.countries).forEach(([countryName, countryData]) => {
    if (countryData.indicators[indicatorCode]) {
      const yearData = {}
      let hasData = false

      Object.entries(countryData.indicators[indicatorCode]).forEach(([year, valueObj]) => {
        const y = parseInt(year)
        // Handle both old format (number) and new format (object with local/usd)
        const localValue = typeof valueObj === 'object' ? valueObj.local : valueObj
        const usdValue = typeof valueObj === 'object' ? valueObj.usd : null
        
        if (y >= startYear && y <= endYear && !isNaN(localValue)) {
          yearData[year] = {
            local: localValue,
            usd: usdValue
          }
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

  // Calculate filtered statistics (using local values)
  const allValues = Object.values(countries)
    .flatMap(country => Object.values(country.data).map(v => v.local))
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
    hasBothCurrencies: unifiedData.hasBothCurrencies || false,
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
 * Returns data with both local and USD values
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
    hasBothCurrencies: unifiedData.hasBothCurrencies || false,
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