import * as d3 from 'd3'

/**
 * Spending Data Service for 48 IMF Government Finance Statistics Indicators
 * Handles loading and processing of detailed government spending data
 */

// Comprehensive mapping of 48 spending indicators
export const SPENDING_INDICATORS = {
  // Main Categories
  'Total Expense': {
    'GE': { 
      name: 'Total Government Expense', 
      description: 'Total government expense across all categories',
      file: 'IMF_GFSE_GE_G14.csv',
      icon: '💰',
      category: 'overview'
    }
  },
  
  // Compensation of Employees
  'Compensation of Employees': {
    'GECE': { 
      name: 'Compensation of Employees', 
      description: 'Wages, salaries, and social contributions for government employees',
      file: 'IMF_GFSE_GECE_G14.csv',
      icon: '👥',
      category: 'personnel'
    },
    'GECES': { 
      name: 'Compensation + Social Benefits', 
      description: 'Employee compensation plus social benefits',
      file: 'IMF_GFSE_GECES_G14.csv',
      icon: '👥💼',
      category: 'personnel'
    },
    'GECESA': { 
      name: 'Compensation + Social Benefits (Adjusted)', 
      description: 'Adjusted compensation and social benefits',
      file: 'IMF_GFSE_GECESA_G14.csv',
      icon: '👥📊',
      category: 'personnel'
    },
    'GECESI': { 
      name: 'Compensation + Social Benefits (Insurance)', 
      description: 'Compensation with social insurance benefits',
      file: 'IMF_GFSE_GECESI_G14.csv',
      icon: '👥🛡️',
      category: 'personnel'
    },
    'GECEW': { 
      name: 'Compensation + Welfare', 
      description: 'Employee compensation with welfare benefits',
      file: 'IMF_GFSE_GECEW_G14.csv',
      icon: '👥🤝',
      category: 'personnel'
    }
  },

  // Grants
  'Grants': {
    'GEG': { 
      name: 'Total Grants', 
      description: 'All government grants and transfers',
      file: 'IMF_GFSE_GEG_G14.csv',
      icon: '🎁',
      category: 'transfers'
    },
    'GEG_FG': { 
      name: 'Federal Grants', 
      description: 'Grants from federal government',
      file: 'IMF_GFSE_GEG_FG_G14.csv',
      icon: '🏛️',
      category: 'transfers'
    },
    'GEG_GG': { 
      name: 'General Government Grants', 
      description: 'Grants within general government',
      file: 'IMF_GFSE_GEG_GG_G14.csv',
      icon: '🏢',
      category: 'transfers'
    },
    'GEG_IO': { 
      name: 'International Organization Grants', 
      description: 'Grants from international organizations',
      file: 'IMF_GFSE_GEG_IO_G14.csv',
      icon: '🌍',
      category: 'transfers'
    },
    'GEGC_FG': { 
      name: 'Current Federal Grants', 
      description: 'Current grants from federal government',
      file: 'IMF_GFSE_GEGC_FG_G14.csv',
      icon: '🏛️💸',
      category: 'transfers'
    },
    'GEGC_GG': { 
      name: 'Current General Government Grants', 
      description: 'Current grants within general government',
      file: 'IMF_GFSE_GEGC_GG_G14.csv',
      icon: '🏢💸',
      category: 'transfers'
    },
    'GEGC_IO': { 
      name: 'Current International Grants', 
      description: 'Current grants from international organizations',
      file: 'IMF_GFSE_GEGC_IO_G14.csv',
      icon: '🌍💸',
      category: 'transfers'
    },
    'GEGK_FG': { 
      name: 'Capital Federal Grants', 
      description: 'Capital grants from federal government',
      file: 'IMF_GFSE_GEGK_FG_G14.csv',
      icon: '🏛️🏗️',
      category: 'transfers'
    },
    'GEGK_GG': { 
      name: 'Capital General Government Grants', 
      description: 'Capital grants within general government',
      file: 'IMF_GFSE_GEGK_GG_G14.csv',
      icon: '🏢🏗️',
      category: 'transfers'
    },
    'GEGK_IO': { 
      name: 'Capital International Grants', 
      description: 'Capital grants from international organizations',
      file: 'IMF_GFSE_GEGK_IO_G14.csv',
      icon: '🌍🏗️',
      category: 'transfers'
    },
    'GEGS': { 
      name: 'Subsidies', 
      description: 'Government subsidies to enterprises and individuals',
      file: 'IMF_GFSE_GEGS_G14.csv',
      icon: '💰🏭',
      category: 'transfers'
    }
  },

  // Interest Payments
  'Interest': {
    'GEI': { 
      name: 'Total Interest', 
      description: 'Total interest payments on government debt',
      file: 'IMF_GFSE_GEI_G14.csv',
      icon: '📈',
      category: 'debt'
    },
    'GEI_GG': { 
      name: 'Interest to General Government', 
      description: 'Interest payments to general government entities',
      file: 'IMF_GFSE_GEI_GG_G14.csv',
      icon: '📈🏢',
      category: 'debt'
    },
    'GEI_NGG': { 
      name: 'Interest to Non-Government', 
      description: 'Interest payments to non-government entities',
      file: 'IMF_GFSE_GEI_NGG_G14.csv',
      icon: '📈🏦',
      category: 'debt'
    },
    'GEI_NRES': { 
      name: 'Interest to Non-Residents', 
      description: 'Interest payments to non-resident entities',
      file: 'IMF_GFSE_GEI_NRES_G14.csv',
      icon: '📈🌍',
      category: 'debt'
    },
    'GEKC': { 
      name: 'Consumption of Fixed Capital', 
      description: 'Depreciation of government fixed assets',
      file: 'IMF_GFSE_GEKC_G14.csv',
      icon: '🏗️📉',
      category: 'debt'
    }
  },

  // Other Expenses
  'Other Expenses': {
    'GEO': { 
      name: 'Total Other Expenses', 
      description: 'All other government expenses not elsewhere classified',
      file: 'IMF_GFSE_GEO_G14.csv',
      icon: '📋',
      category: 'other'
    },
    'GEOM': { 
      name: 'Use of Goods and Services', 
      description: 'Government purchases of goods and services',
      file: 'IMF_GFSE_GEOM_G14.csv',
      icon: '🛒',
      category: 'operations'
    },
    'GEOMC': { 
      name: 'Use of Goods and Services (Current)', 
      description: 'Current purchases of goods and services',
      file: 'IMF_GFSE_GEOMC_G14.csv',
      icon: '🛒💸',
      category: 'operations'
    },
    'GEOMK': { 
      name: 'Use of Goods and Services (Capital)', 
      description: 'Capital purchases of goods and services',
      file: 'IMF_GFSE_GEOMK_G14.csv',
      icon: '🛒🏗️',
      category: 'operations'
    },
    'GEOO': { 
      name: 'Other Miscellaneous Expenses', 
      description: 'Miscellaneous expenses not elsewhere classified',
      file: 'IMF_GFSE_GEOO_G14.csv',
      icon: '📋❓',
      category: 'other'
    },
    'GEOOC': { 
      name: 'Other Current Expenses', 
      description: 'Other current expenses',
      file: 'IMF_GFSE_GEOOC_G14.csv',
      icon: '📋💸',
      category: 'other'
    },
    'GEOOP': { 
      name: 'Other Property Expenses', 
      description: 'Other property-related expenses',
      file: 'IMF_GFSE_GEOOP_G14.csv',
      icon: '🏠💸',
      category: 'other'
    },
    'GEOOPC': { 
      name: 'Other Property Current Expenses', 
      description: 'Other current property expenses',
      file: 'IMF_GFSE_GEOOPC_G14.csv',
      icon: '🏠💰',
      category: 'other'
    },
    'GEOOPF': { 
      name: 'Other Property Financial Expenses', 
      description: 'Other financial property expenses',
      file: 'IMF_GFSE_GEOOPF_G14.csv',
      icon: '🏠💳',
      category: 'other'
    }
  },

  // Public Order and Safety
  'Public Services': {
    'GEOP': { 
      name: 'Public Order and Safety', 
      description: 'Expenses for public order and safety services',
      file: 'IMF_GFSE_GEOP_G14.csv',
      icon: '👮‍♂️',
      category: 'services'
    },
    'GEOPD': { 
      name: 'Defense', 
      description: 'Defense and military expenses',
      file: 'IMF_GFSE_GEOPD_G14.csv',
      icon: '🛡️',
      category: 'services'
    },
    'GEOPE': { 
      name: 'Economic Affairs', 
      description: 'Economic affairs and services',
      file: 'IMF_GFSE_GEOPE_G14.csv',
      icon: '💼',
      category: 'services'
    },
    'GEOPP': { 
      name: 'Public Order', 
      description: 'Public order and safety',
      file: 'IMF_GFSE_GEOPP_G14.csv',
      icon: '⚖️',
      category: 'services'
    },
    'GEOPR': { 
      name: 'Recreation and Culture', 
      description: 'Recreation, culture, and religious affairs',
      file: 'IMF_GFSE_GEOPR_G14.csv',
      icon: '🎭',
      category: 'services'
    },
    'GEOPW': { 
      name: 'Environmental Protection', 
      description: 'Environmental protection expenses',
      file: 'IMF_GFSE_GEOPW_G14.csv',
      icon: '🌱',
      category: 'services'
    }
  },

  // Social Benefits
  'Social Benefits': {
    'GES': { 
      name: 'Total Social Benefits', 
      description: 'Total social benefits and welfare payments',
      file: 'IMF_GFSE_GES_G14.csv',
      icon: '🤝',
      category: 'social'
    },
    'GES_CA': { 
      name: 'Social Benefits (Cash)', 
      description: 'Cash social benefits',
      file: 'IMF_GFSE_GES_CA_G14.csv',
      icon: '💵',
      category: 'social'
    },
    'GES_IK': { 
      name: 'Social Benefits (In-Kind)', 
      description: 'In-kind social benefits',
      file: 'IMF_GFSE_GES_IK_G14.csv',
      icon: '🎁',
      category: 'social'
    },
    'GESA': { 
      name: 'Social Assistance', 
      description: 'Social assistance benefits',
      file: 'IMF_GFSE_GESA_G14.csv',
      icon: '🤲',
      category: 'social'
    },
    'GESE': { 
      name: 'Employment Benefits', 
      description: 'Employment-related social benefits',
      file: 'IMF_GFSE_GESE_G14.csv',
      icon: '💼🤝',
      category: 'social'
    },
    'GESS': { 
      name: 'Social Security', 
      description: 'Social security benefits',
      file: 'IMF_GFSE_GESS_G14.csv',
      icon: '🛡️🤝',
      category: 'social'
    }
  },

  // Specific Programs
  'Specific Programs': {
    'GEST': { 
      name: 'Education', 
      description: 'Education expenses',
      file: 'IMF_GFSE_GEST_G14.csv',
      icon: '🎓',
      category: 'programs'
    },
    'GEST_OS': { 
      name: 'Other Services', 
      description: 'Other government services',
      file: 'IMF_GFSE_GEST_OS_G14.csv',
      icon: '🏛️',
      category: 'programs'
    },
    'GEST_PCO': { 
      name: 'Public Order (Detailed)', 
      description: 'Detailed public order expenses',
      file: 'IMF_GFSE_GEST_PCO_G14.csv',
      icon: '👮‍♂️📊',
      category: 'programs'
    },
    'GEST_PE': { 
      name: 'Public Enterprises', 
      description: 'Public enterprise expenses',
      file: 'IMF_GFSE_GEST_PE_G14.csv',
      icon: '🏭',
      category: 'programs'
    }
  }
}

// Category colors for visualization
export const CATEGORY_COLORS = {
  overview: '#667eea',
  personnel: '#f093fb',
  transfers: '#4facfe',
  debt: '#f5576c',
  operations: '#43e97b',
  other: '#ffa726',
  services: '#ab47bc',
  social: '#26c6da',
  programs: '#66bb6a'
}

/**
 * Load spending indicator data from CSV file
 */
export async function loadSpendingIndicator(indicatorCode) {
  try {
    const indicator = findIndicatorByCode(indicatorCode)
    if (!indicator) {
      throw new Error(`Indicator ${indicatorCode} not found`)
    }

    const { getDataPath } = await import('../../../utils/pathUtils.js')
    const data = await d3.csv(getDataPath(`48-indicators/${indicator.file}`))
    
    // Process the data
    const processedData = {
      indicator: indicatorCode,
      name: indicator.name,
      description: indicator.description,
      category: indicator.category,
      countries: {},
      years: new Set(),
      sectors: new Set(),
      globalStats: null
    }

    // Group data by country and aggregate across sectors
    const countryYearData = {}
    
    data.forEach(row => {
      const country = row.REF_AREA_LABEL
      const year = parseInt(row.TIME_PERIOD)
      const value = parseFloat(row.OBS_VALUE)
      const sector = row.COMP_BREAKDOWN_1_LABEL || 'Unknown'
      const unitMeasure = row.UNIT_MEASURE || 'Unknown'
      const unitType = row.UNIT_TYPE || 'Unknown'
      
      if (!country || isNaN(year) || isNaN(value)) return

      // Track sectors for debugging
      processedData.sectors.add(sector)
      
      // Create country-year-unit key to separate different unit types
      const key = `${country}-${year}-${unitMeasure}`
      
      if (!countryYearData[key]) {
        countryYearData[key] = {
          country,
          year,
          unitMeasure,
          unitType,
          values: [],
          sectors: []
        }
      }
      
      countryYearData[key].values.push(value)
      countryYearData[key].sectors.push(sector)
      processedData.years.add(year)
    })

    // Group by country-year and prioritize unit types
    const countryYearFinalData = {}
    
    Object.values(countryYearData).forEach(({ country, year, unitMeasure, unitType, values, sectors }) => {
      const countryYearKey = `${country}-${year}`
      
      if (!countryYearFinalData[countryYearKey]) {
        countryYearFinalData[countryYearKey] = []
      }
      
      // Aggregate values for this unit type
      let aggregatedValue
      
      if (sectors.some(s => s.includes('Central government (excl. social security)'))) {
        // If we have the comprehensive central government data, prefer that
        const centralGovIndex = sectors.findIndex(s => s.includes('Central government (excl. social security)'))
        aggregatedValue = values[centralGovIndex]
      } else if (values.length === 1) {
        // Single value, use as is
        aggregatedValue = values[0]
      } else {
        // Multiple sectors with same unit, sum them
        aggregatedValue = values.reduce((sum, val) => sum + val, 0)
      }
      
      countryYearFinalData[countryYearKey].push({
        country,
        year,
        value: aggregatedValue,
        unitMeasure,
        unitType,
        sectors
      })
    })

    // Process final data by country, prioritizing certain unit types
    Object.values(countryYearFinalData).forEach(yearData => {
      const { country, year } = yearData[0]
      
      if (!processedData.countries[country]) {
        processedData.countries[country] = {
          name: country,
          code: country.substring(0, 3).toUpperCase(),
          data: {},
          sectors: new Set()
        }
      }

      // Prioritize unit types: prefer domestic currency over percentage of GDP
      let selectedData = yearData.find(d => d.unitMeasure === 'XDC') || // Domestic currency
                        yearData.find(d => d.unitMeasure === 'PT_GDP') || // Percentage of GDP
                        yearData[0] // Fallback to first available

      processedData.countries[country].data[year] = selectedData.value
      
      // Track which sectors this country has data for
      selectedData.sectors.forEach(sector => processedData.countries[country].sectors.add(sector))
    })

    // Convert sets to arrays
    processedData.years = Array.from(processedData.years).sort()
    processedData.sectors = Array.from(processedData.sectors)

    // Calculate global statistics
    const allValues = Object.values(processedData.countries)
      .flatMap(country => Object.values(country.data))
      .filter(value => !isNaN(value))

    if (allValues.length > 0) {
      processedData.globalStats = {
        minSpending: Math.min(...allValues),
        maxSpending: Math.max(...allValues),
        avgSpending: allValues.reduce((a, b) => a + b, 0) / allValues.length,
        totalCountries: Object.keys(processedData.countries).length,
        totalDataPoints: allValues.length,
        sectorsAvailable: processedData.sectors
      }
    }

    console.log(`Loaded ${indicatorCode}:`, {
      countries: Object.keys(processedData.countries).length,
      years: processedData.years.length,
      sectors: processedData.sectors,
      sampleCountries: Object.keys(processedData.countries).slice(0, 5)
    })

    return processedData
  } catch (error) {
    console.error(`Error loading spending indicator ${indicatorCode}:`, error)
    throw error
  }
}

/**
 * Find indicator by code across all categories
 */
function findIndicatorByCode(code) {
  for (const category of Object.values(SPENDING_INDICATORS)) {
    if (category[code]) {
      return category[code]
    }
  }
  return null
}

/**
 * Get all indicators by category
 */
export function getIndicatorsByCategory(categoryName) {
  return Object.entries(SPENDING_INDICATORS)
    .filter(([_, indicators]) => 
      Object.values(indicators).some(indicator => indicator.category === categoryName)
    )
    .reduce((acc, [groupName, indicators]) => {
      acc[groupName] = Object.fromEntries(
        Object.entries(indicators).filter(([_, indicator]) => indicator.category === categoryName)
      )
      return acc
    }, {})
}

/**
 * Load multiple spending indicators
 */
export async function loadMultipleIndicators(indicatorCodes) {
  const results = {}
  
  for (const code of indicatorCodes) {
    try {
      results[code] = await loadSpendingIndicator(code)
    } catch (error) {
      console.warn(`Failed to load indicator ${code}:`, error)
    }
  }
  
  return results
}