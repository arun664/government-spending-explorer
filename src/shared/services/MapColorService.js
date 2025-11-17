/**
 * Map Color Service
 * Synchronizes colors between filters and map visualizations
 * Provides consistent color scales for category-based and region-based visualizations
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import * as d3 from 'd3'
import { ColorSchemeService } from './ColorSchemeService.js'
import { getCountryRegion } from '../utils/RegionMapping.js'
import { getCountryCodeFromMapName } from '../../modules/spending/utils/countryMapping.js'

/**
 * MapColorService - Centralized map color management
 */
export const MapColorService = {
  /**
   * Create color scale function for map based on current indicator
   * @param {Object} spendingData - Spending data with category information
   * @param {string} colorMode - 'category' or 'region'
   * @param {Object} options - Additional options (domain, intensity, etc.)
   * @returns {Function} Color scale function
   */
  createMapColorScale(spendingData, colorMode = 'category', options = {}) {
    if (colorMode === 'region') {
      return this.createRegionColorScale()
    }
    
    // Category-based color scale
    if (spendingData?.category) {
      return this.createCategoryColorScale(spendingData, options)
    }
    
    // Default fallback
    return this.createDefaultColorScale(options)
  },

  /**
   * Create category-based color scale
   * Uses the indicator's category color with intensity based on spending values
   * @param {Object} spendingData - Spending data with category and stats
   * @param {Object} options - Scale options
   * @returns {Function} Color scale function
   */
  createCategoryColorScale(spendingData, options = {}) {
    const category = spendingData.category || 'overview'
    const baseColor = ColorSchemeService.getCategoryColor(category)
    
    const minValue = options.minValue ?? spendingData.globalStats?.minSpending ?? 0
    const maxValue = options.maxValue ?? spendingData.globalStats?.maxSpending ?? 100

    // Create sequential scale using the category color
    // Use a NARROWER range to keep colors closer to the base category color
    const lightColor = d3.color(baseColor).brighter(1).toString()
    const darkColor = d3.color(baseColor).darker(0.3).toString()
    
    return d3.scaleSequential()
      .domain([minValue, maxValue])
      .interpolator(d3.interpolateRgb(lightColor, darkColor))
  },

  /**
   * Create region-based color scale
   * Returns a function that maps country codes to region colors
   * @returns {Function} Color function that takes country code/name
   */
  createRegionColorScale() {
    return (countryCodeOrName) => {
      const region = getCountryRegion(countryCodeOrName)
      return ColorSchemeService.getRegionColor(region)
    }
  },

  /**
   * Create default color scale (fallback)
   * @param {Object} options - Scale options
   * @returns {Function} D3 sequential color scale
   */
  createDefaultColorScale(options = {}) {
    const minValue = options.minValue ?? 0
    const maxValue = options.maxValue ?? 100
    
    return d3.scaleSequential(d3.interpolateBlues)
      .domain([minValue, maxValue])
  },

  /**
   * Get color for a specific country based on spending data
   * @param {string} countryName - Country name
   * @param {Object} spendingData - Spending data
   * @param {Function} colorScale - Color scale function
   * @param {string} colorMode - 'category' or 'region'
   * @returns {string} Hex color code
   */
  getCountryColor(countryName, spendingData, colorScale, colorMode = 'category') {
    if (!countryName || !spendingData) {
      return '#e8e8e8' // Default gray for no data
    }

    if (colorMode === 'region') {
      return colorScale(countryName)
    }

    // Category-based coloring
    const countryData = spendingData.countries?.[countryName]
    
    if (!countryData || !countryData.totalSpending || countryData.totalSpending === 0) {
      return '#e8e8e8' // Gray for no data
    }

    // Use the color scale with the spending value
    return colorScale(countryData.totalSpending)
  },

  /**
   * Apply filters to map data
   * @param {Array} countries - Array of country features
   * @param {Object} filters - Filter state
   * @param {Object} spendingData - Spending data
   * @returns {Array} Filtered countries
   */
  applyFiltersToMapData(countries, filters, spendingData) {
    if (!countries || !filters) {
      return countries || []
    }

    // Debug: Log countries with and without data
    const countriesWithNoData = []
    const countriesWithData = []
    const problematicCountries = ['Malaysia', 'Vietnam', 'Argentina', 'Morocco', 'Uruguay', 'Mozambique']
    
    countries.forEach(country => {
      const mapName = this.getCountryNameFromFeature(country)
      if (mapName && mapName !== 'Unknown Country') {
        const countryData = this.findCountryData(mapName, spendingData)
        
        // Debug specific problematic countries
        if (problematicCountries.includes(mapName)) {
          console.log(`🔍 Checking ${mapName}:`, {
            mapName,
            foundData: !!countryData,
            dataKeys: spendingData?.countries ? Object.keys(spendingData.countries).filter(k => 
              k.toLowerCase().includes(mapName.toLowerCase())
            ) : []
          })
        }
        
        if (countryData) {
          countriesWithData.push({ mapName, dataKey: countryData.name })
        } else {
          countriesWithNoData.push({ mapName })
        }
      }
    })
    
    // Log summary
    console.log(`📊 Map Data Summary:`)
    console.log(`  ✅ ${countriesWithData.length} countries WITH data`)
    console.log(`  ⚠️ ${countriesWithNoData.length} countries WITHOUT data`)
    
    if (countriesWithNoData.length > 0) {
      console.log(`\n⚠️ Countries without data (first 20):`, 
        countriesWithNoData.slice(0, 20).map(c => c.mapName))
    }
    


    const filteredCountries = countries.filter(country => {
      const countryName = this.getCountryNameFromFeature(country)
      
      if (!countryName || countryName === 'Unknown Country') {
        return false
      }

      // Find country data (handles both code and name lookups)
      const countryData = this.findCountryData(countryName, spendingData)
      if (!countryData) {
        if (problematicCountries.includes(countryName)) {
          console.log(`❌ ${countryName} filtered: NO COUNTRY DATA`)
        }
        return false
      }

      // Region filter - ONLY apply if regions are explicitly selected
      if (filters?.regions && Array.isArray(filters.regions) && filters.regions.length > 0) {
        const countryRegion = getCountryRegion(countryName)
        if (!filters.regions.includes(countryRegion)) {
          if (problematicCountries.includes(countryName)) {
            console.log(`❌ ${countryName} filtered: REGION (${countryRegion} not in ${filters.regions})`)
          }
          return false
        }
      }

      // Value range filter - DISABLED
      // Since countries use different currencies (USD, EUR, INR, etc.), 
      // filtering by absolute spending values doesn't make sense
      // This filter is disabled until USD conversion is implemented

      // Sector filter - ONLY apply if sectors are explicitly selected
      if (filters?.sectors && Array.isArray(filters.sectors) && filters.sectors.length > 0) {
        // For now, skip sector filtering as the data structure doesn't have sectors
        // This would need to be implemented based on actual data structure
        return true
      }

      if (problematicCountries.includes(countryName)) {
        console.log(`✅ ${countryName} PASSED all filters`)
      }

      return true
    })

    return filteredCountries
  },

  /**
   * Get country name from map feature
   * @param {Object} feature - GeoJSON feature
   * @returns {string} Country name
   */
  getCountryNameFromFeature(feature) {
    return feature.properties?.NAME ||
           feature.properties?.name ||
           feature.properties?.NAME_EN ||
           feature.properties?.NAME_LONG ||
           feature.properties?.ADMIN ||
           'Unknown Country'
  },

  /**
   * Normalize country name for matching
   * @param {string} name - Country name
   * @returns {string} Normalized name
   */
  normalizeCountryName(name) {
    if (!name) return name
    
    // Comprehensive name variations - maps GeoJSON names to IMF data names
    const nameMap = {
      // Americas
      'United States of America': 'United States',
      'The Bahamas': 'Bahamas, The',
      'Bahamas': 'Bahamas, The',
      'Saint Kitts and Nevis': 'St. Kitts and Nevis',
      'Saint Lucia': 'St. Lucia',
      'Saint Vincent and the Grenadines': 'St. Vincent and the Grenadines',
      
      // Asia
      'Russia': 'Russian Federation',
      'Korea, Republic of': 'Korea, Rep.',
      'South Korea': 'Korea, Rep.',
      'Korea, Democratic People\'s Republic of': 'Korea, Dem. People\'s Rep.',
      'North Korea': 'Korea, Dem. People\'s Rep.',
      'Iran, Islamic Republic of': 'Iran, Islamic Rep.',
      'Iran': 'Iran, Islamic Rep.',
      'Laos': 'Lao PDR',
      'Lao People\'s Democratic Republic': 'Lao PDR',
      'Syria': 'Syrian Arab Republic',
      'Syrian Arab Republic': 'Syrian Arab Republic',
      'Vietnam': 'Viet Nam',
      'Burma': 'Myanmar',
      'Brunei': 'Brunei Darussalam',
      'Hong Kong': 'Hong Kong SAR, China',
      'Macao': 'Macao SAR, China',
      'Macau': 'Macao SAR, China',
      'Palestine': 'West Bank and Gaza',
      'Kyrgyzstan': 'Kyrgyz Republic',
      'Turkey': 'Turkiye',
      'Türkiye': 'Turkiye',
      'Timor': 'Timor-Leste',
      'East Timor': 'Timor-Leste',
      'Micronesia': 'Micronesia, Fed. Sts.',
      
      // Africa
      'The Gambia': 'Gambia, The',
      'Gambia': 'Gambia, The',
      'Democratic Republic of the Congo': 'Congo, Dem. Rep.',
      'Dem. Rep. Congo': 'Congo, Dem. Rep.',
      'Congo, Dem. Rep.': 'Congo, Dem. Rep.',
      'Republic of the Congo': 'Congo, Rep.',
      'Congo': 'Congo, Rep.',
      'Ivory Coast': 'Cote d\'Ivoire',
      'Côte d\'Ivoire': 'Cote d\'Ivoire',
      'Egypt': 'Egypt, Arab Rep.',
      'Cape Verde': 'Cabo Verde',
      'Swaziland': 'Eswatini',
      'eSwatini': 'Eswatini',
      'Macedonia': 'North Macedonia',
      'São Tomé and Príncipe': 'Sao Tome and Principe',
      'Sao Tome and Principe': 'Sao Tome and Principe',
      'Morocco': 'Morocco',
      'Mozambique': 'Mozambique',
      
      // South America
      'Venezuela, Bolivarian Republic of': 'Venezuela, RB',
      'Venezuela': 'Venezuela, RB',
      'Bolivia, Plurinational State of': 'Bolivia',
      'Argentina': 'Argentina',
      'Uruguay': 'Uruguay',
      
      // Europe
      'Czech Republic': 'Czechia',
      'Slovakia': 'Slovak Republic',
      'Great Britain': 'United Kingdom',
      'UK': 'United Kingdom',
      'Bosnia and Herz.': 'Bosnia and Herzegovina',
      
      // Other
      'Tanzania, United Republic of': 'Tanzania',
      'Yemen': 'Yemen, Rep.',
      'Solomon Is.': 'Solomon Islands'
    }
    
    return nameMap[name] || name
  },

  /**
   * Find country data in spending data (handles both code and name lookups)
   * @param {string} mapName - Country name from map
   * @param {Object} spendingData - Spending data
   * @returns {Object|null} Country data or null
   */
  findCountryData(mapName, spendingData) {
    if (!mapName || !spendingData?.countries) return null
    
    // Try 1: Direct name match
    let countryData = spendingData.countries[mapName]
    if (countryData) return countryData
    
    // Try 2: Normalized name
    const normalizedName = this.normalizeCountryName(mapName)
    if (normalizedName !== mapName) {
      countryData = spendingData.countries[normalizedName]
      if (countryData) return countryData
    }
    
    // Try 3: Code lookup
    const countryCode = getCountryCodeFromMapName(mapName)
    if (countryCode) {
      countryData = spendingData.countries[countryCode]
      if (countryData) return countryData
    }
    
    // Try 4: Search by name property in data
    const countryEntries = Object.entries(spendingData.countries)
    const match = countryEntries.find(([key, data]) => {
      if (!data) return false
      
      // Check if data.name matches
      if (data.name === mapName || data.name === normalizedName) return true
      
      // Check if data.code matches
      if (data.code === countryCode) return true
      
      // Check if key matches (case-insensitive)
      if (key.toLowerCase() === mapName.toLowerCase() || 
          key.toLowerCase() === normalizedName.toLowerCase()) return true
      
      return false
    })
    
    return match ? match[1] : null
  },

  /**
   * Check if country passes filters
   * @param {string} countryName - Country name
   * @param {Object} filters - Filter state
   * @param {Object} spendingData - Spending data
   * @returns {boolean} True if country passes all filters
   */
  passesFilters(countryName, filters, spendingData) {
    if (!countryName || countryName === 'Unknown Country') {
      return false
    }

    // Find country data (handles both code and name lookups)
    const countryData = this.findCountryData(countryName, spendingData)
    if (!countryData) {
      return false
    }

    // Region filter
    if (filters.regions && filters.regions.length > 0) {
      const countryRegion = getCountryRegion(countryName)
      if (!filters.regions.includes(countryRegion)) {
        return false
      }
    }

    // Value range filter - DISABLED
    // Since countries use different currencies, filtering by absolute values doesn't make sense

    // Sector filter
    if (filters.sectors && filters.sectors.length > 0) {
      const countryData = spendingData?.countries?.[countryName]
      
      if (!countryData || !countryData.sectors || countryData.sectors.size === 0) {
        return false
      }
      
      const countrySectors = Array.from(countryData.sectors)
      const hasMatchingSector = filters.sectors.some(selectedSector =>
        countrySectors.some(countrySector =>
          countrySector.toLowerCase().includes(selectedSector.toLowerCase()) ||
          selectedSector.toLowerCase().includes(countrySector.toLowerCase())
        )
      )
      
      if (!hasMatchingSector) {
        return false
      }
    }

    return true
  },

  /**
   * Create color scale for multi-category visualization
   * Always uses ColorSchemeService for consistent colors
   * @param {Object} categoryData - Category data with colors
   * @param {string} visualizationMode - 'dominant' or other modes
   * @returns {Function} Color function for countries
   */
  createCategoryVisualizationScale(categoryData, visualizationMode = 'dominant') {
    return (countryName) => {
      const countryData = categoryData.countries?.[countryName]
      
      if (!countryData || countryData.totalSpending === 0) {
        return '#e8e8e8'
      }
      
      if (visualizationMode === 'dominant') {
        // ALWAYS use ColorSchemeService for consistent colors
        const categoryColor = ColorSchemeService.getCategoryColor(countryData.dominantCategory)
        
        console.log(`🎨 Color for ${countryName}:`, {
          category: countryData.dominantCategory,
          color: categoryColor,
          spending: countryData.totalSpending
        })
        
        // Create intensity based on spending value
        const intensity = Math.min(
          countryData.totalSpending / (categoryData.globalStats?.maxSpending || 1),
          1
        )
        
        // Interpolate from light to dark
        const lightColor = d3.color(categoryColor).brighter(2).toString()
        const darkColor = d3.color(categoryColor).darker(0.5).toString()
        
        return d3.interpolateRgb(lightColor, darkColor)(intensity * 0.8 + 0.2)
      }
      
      return ColorSchemeService.getCategoryColor('overview')
    }
  }
}

export default MapColorService
