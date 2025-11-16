import { useState, useEffect, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import { 
  loadUnifiedData,
  getIndicatorData,
  CATEGORY_COLORS,
  INDICATOR_METADATA
} from '../services/UnifiedDataService.js'
import { ColorSchemeService } from '../../../shared/services/ColorSchemeService.js'
import { MapColorService } from '../../../shared/services/MapColorService.js'
import { filterStateManager } from '../../../shared/services/FilterStateManager.js'

import SpendingFilters from './SpendingFilters.jsx'
import SpendingWorldMap from './SpendingWorldMap.jsx'
import '../styles/SpendingAnalysis.css'

/**
 * Enhanced Government Spending Analysis Component
 * 
 * Features:
 * - 48 IMF Government Finance Statistics indicators
 * - Category-based organization (Personnel, Transfers, Debt, Operations, etc.)
 * - Interactive world map with category-colored spending heatmaps
 * - Sector-specific filtering with dynamic map updates
 * - Advanced filtering by categories, countries, and time periods
 * - Export functionality with charts and data
 */
const SpendingAnalysis = ({ onExportDataChange, onLoadingChange }) => {
  // Core state
  const [unifiedData, setUnifiedData] = useState(null) // All 48 indicators pre-loaded
  const [spendingData, setSpendingData] = useState({})
  const [selectedIndicator, setSelectedIndicator] = useState('GE')
  const [selectedCategory, setSelectedCategory] = useState('overview')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState(new Set(['overview']))
  
  // Map and visualization state
  const [worldData, setWorldData] = useState(null)
  const [colorScale, setColorScale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter state
  const [filters, setFilters] = useState({ 
    yearRange: [2005, 2023], // Last 2 decades
    categories: ['overview'],
    countries: [],
    sectors: [],
    visualizationMode: 'dominant'
  })
  const [showStatsPopup, setShowStatsPopup] = useState(false)
  
  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Sync loading state with parent component
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading)
    }
  }, [loading, onLoadingChange])

  // Handle click outside to close stats popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatsPopup && !event.target.closest('.stats-popup') && !event.target.closest('.stats-toggle-btn')) {
        setShowStatsPopup(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showStatsPopup])



  // Update export data for parent component
  useEffect(() => {
    if (onExportDataChange && spendingData.name) {
      onExportDataChange({
        data: {
          summary: `Government spending analysis: ${spendingData.name}`,
          csvData: Object.values(spendingData.countries || {}).flatMap(country => 
            Object.entries(country.data || {}).map(([year, value]) => ({
              countryName: country.name,
              countryCode: country.code,
              year: parseInt(year),
              indicator: selectedIndicator,
              indicatorName: spendingData.name,
              value: value,
              category: spendingData.category
            }))
          ),
          indicator: selectedIndicator,
          yearRange: filters.yearRange,
          selectedCountry: selectedCountry?.name
        },
        chartElements: () => {
          const elements = []
          const mapContainer = document.querySelector('.map-container')
          const categoriesPanel = document.querySelector('.categories-sidebar')
          
          if (mapContainer) elements.push(mapContainer)
          if (categoriesPanel) elements.push(categoriesPanel)
          
          return elements
        },
        reportType: "spending",
        fileName: `spending-analysis-${selectedIndicator}-${filters.yearRange[0]}-${filters.yearRange[1]}`,
        metadata: {
          dateRange: `${filters.yearRange[0]} - ${filters.yearRange[1]}`,
          countries: selectedCountry ? [selectedCountry.name] : ['All Countries'],
          generatedBy: 'Government Expense Dashboard',
          analysisType: 'Spending Analysis'
        }
      })
    }
  }, [spendingData, selectedIndicator, filters, selectedCountry, onExportDataChange])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🚀 Loading ALL 48 indicators using UnifiedDataService...')

      // Load world map data and ALL 48 indicators in parallel
      const [world, unified] = await Promise.all([
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        loadUnifiedData() // Loads all 48 indicators at once!
      ])
      
      setWorldData(world)
      setUnifiedData(unified)

      console.log('✅ UNIFIED DATA LOADED - ALL 48 INDICATORS')
      console.log('Unified data structure:', {
        totalCountries: Object.keys(unified.countries).length,
        totalIndicators: Object.keys(unified.indicators).length,
        indicators: Object.keys(unified.indicators),
        yearRange: [unified.years[0], unified.years[unified.years.length - 1]],
        sampleCountry: Object.keys(unified.countries)[0],
        sampleCountryData: unified.countries[Object.keys(unified.countries)[0]]
      })

      // Load initial indicator data (GE - Total Government Expense)
      const initialData = getIndicatorData('GE', filters.yearRange)
      setSpendingData(initialData)

      console.log('Initial indicator (GE) loaded:', {
        countries: Object.keys(initialData.countries).length,
        category: initialData.category,
        hasGlobalStats: !!initialData.globalStats
      })

      // Create color scale using ColorSchemeService directly
      const scale = MapColorService.createMapColorScale(initialData, 'category', {
        minValue: initialData.globalStats?.minSpending,
        maxValue: initialData.globalStats?.maxSpending
      })
      setColorScale(() => scale)
      
      console.log('✅ Color scale created for category:', initialData.category)

    } catch (err) {
      console.error('❌ Error loading initial data:', err)
      setError('Failed to load spending data. Please check if data files are available.')
    } finally {
      setLoading(false)
    }
  }

  const handleIndicatorSelect = (indicatorCode) => {
    // Prevent selecting while loading or if unified data not ready
    if (loading || !unifiedData) return
    
    try {
      setLoading(true)
      setError(null)
      setSelectedIndicator(indicatorCode)
      
      // Set the category based on the selected indicator
      const indicatorCategory = INDICATOR_METADATA[indicatorCode]?.category || 'overview'
      setSelectedCategory(indicatorCategory)
      
      // Ensure the category is expanded to show the selected indicator
      if (!expandedGroups.has(indicatorCategory)) {
        setExpandedGroups(prev => new Set([...prev, indicatorCategory]))
      }
      
      // Update filters with the new category
      setFilters(prev => ({
        ...prev,
        categories: [indicatorCategory],
        sectors: [] // Clear sector filters when changing indicators
      }))

      console.log(`📊 Switching to indicator: ${indicatorCode} (${INDICATOR_METADATA[indicatorCode]?.name})`)

      // Get indicator data from unified data (instant - no loading!)
      const data = getIndicatorData(indicatorCode, filters.yearRange)
      
      if (!data) {
        throw new Error(`Indicator ${indicatorCode} not found in unified data`)
      }

      setSpendingData(data)

      console.log('Indicator data loaded:', {
        indicator: indicatorCode,
        countries: Object.keys(data.countries).length,
        category: data.category,
        globalStats: data.globalStats
      })

      // Create color scale using ColorSchemeService directly for consistency
      const scale = MapColorService.createMapColorScale(data, 'category', {
        minValue: data.globalStats?.minSpending,
        maxValue: data.globalStats?.maxSpending
      })
      
      setColorScale(() => scale)
      
      console.log(`✅ Color scale created for category: ${data.category}`, {
        color: ColorSchemeService.getCategoryColor(data.category),
        minValue: data.globalStats?.minSpending,
        maxValue: data.globalStats?.maxSpending
      })

    } catch (err) {
      console.error('❌ Error loading indicator:', err)
      setError(`Failed to load indicator: ${indicatorCode}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category)
    setFilters(prev => ({
      ...prev,
      categories: [category]
    }))
    
    // Expand the category to show subcategories
    if (!expandedGroups.has(category)) {
      setExpandedGroups(prev => new Set([...prev, category]))
    }
    
    // Don't reload data - just update the filter and let the map re-render
    // The category selection will be handled by the indicator selection
  }



  // Subscribe to FilterStateManager changes
  useEffect(() => {
    const unsubscribe = filterStateManager.subscribe((newFilters) => {
      setFilters(prev => ({
        ...prev,
        ...newFilters
      }))
    })
    return unsubscribe
  }, [])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
    updateMatchingCountriesCount(newFilters)
  }, [spendingData.countries])

  // Calculate and update matching countries count
  const updateMatchingCountriesCount = (currentFilters) => {
    if (!spendingData.countries) {
      filterStateManager.setFilterCount(0)
      return
    }

    const countries = Object.values(spendingData.countries)
    let matchingCount = 0

    countries.forEach(country => {
      // Apply region filter
      if (currentFilters.regions && currentFilters.regions.length > 0) {
        const countryRegion = getCountryRegion(country.code)
        if (!currentFilters.regions.includes(countryRegion)) {
          return
        }
      }

      // Apply value range filter
      if (country.spending) {
        const spendingValue = country.spending.average || 0
        if (spendingValue < currentFilters.valueRange[0] || 
            spendingValue > currentFilters.valueRange[1]) {
          return
        }
      }

      // Apply sector filter
      if (currentFilters.sectors && currentFilters.sectors.length > 0 && country.sectors) {
        const hasSector = currentFilters.sectors.some(sector => 
          country.sectors.has(sector)
        )
        if (!hasSector) {
          return
        }
      }

      matchingCount++
    })

    filterStateManager.setFilterCount(matchingCount)
  }

  // Helper function to get country region
  const getCountryRegion = (countryCode) => {
    // This should match the region mapping used in the map service
    const regionMap = {
      // Africa
      'DZA': 'Africa', 'AGO': 'Africa', 'BEN': 'Africa', 'BWA': 'Africa', 'BFA': 'Africa',
      'BDI': 'Africa', 'CMR': 'Africa', 'CPV': 'Africa', 'CAF': 'Africa', 'TCD': 'Africa',
      'COM': 'Africa', 'COG': 'Africa', 'COD': 'Africa', 'CIV': 'Africa', 'DJI': 'Africa',
      'EGY': 'Africa', 'GNQ': 'Africa', 'ERI': 'Africa', 'ETH': 'Africa', 'GAB': 'Africa',
      'GMB': 'Africa', 'GHA': 'Africa', 'GIN': 'Africa', 'GNB': 'Africa', 'KEN': 'Africa',
      'LSO': 'Africa', 'LBR': 'Africa', 'LBY': 'Africa', 'MDG': 'Africa', 'MWI': 'Africa',
      'MLI': 'Africa', 'MRT': 'Africa', 'MUS': 'Africa', 'MAR': 'Africa', 'MOZ': 'Africa',
      'NAM': 'Africa', 'NER': 'Africa', 'NGA': 'Africa', 'RWA': 'Africa', 'STP': 'Africa',
      'SEN': 'Africa', 'SYC': 'Africa', 'SLE': 'Africa', 'SOM': 'Africa', 'ZAF': 'Africa',
      'SSD': 'Africa', 'SDN': 'Africa', 'SWZ': 'Africa', 'TZA': 'Africa', 'TGO': 'Africa',
      'TUN': 'Africa', 'UGA': 'Africa', 'ZMB': 'Africa', 'ZWE': 'Africa',
      
      // Asia
      'AFG': 'Asia', 'ARM': 'Asia', 'AZE': 'Asia', 'BHR': 'Asia', 'BGD': 'Asia',
      'BTN': 'Asia', 'BRN': 'Asia', 'KHM': 'Asia', 'CHN': 'Asia', 'GEO': 'Asia',
      'IND': 'Asia', 'IDN': 'Asia', 'IRN': 'Asia', 'IRQ': 'Asia', 'ISR': 'Asia',
      'JPN': 'Asia', 'JOR': 'Asia', 'KAZ': 'Asia', 'KWT': 'Asia', 'KGZ': 'Asia',
      'LAO': 'Asia', 'LBN': 'Asia', 'MYS': 'Asia', 'MDV': 'Asia', 'MNG': 'Asia',
      'MMR': 'Asia', 'NPL': 'Asia', 'PRK': 'Asia', 'OMN': 'Asia', 'PAK': 'Asia',
      'PSE': 'Asia', 'PHL': 'Asia', 'QAT': 'Asia', 'SAU': 'Asia', 'SGP': 'Asia',
      'KOR': 'Asia', 'LKA': 'Asia', 'SYR': 'Asia', 'TWN': 'Asia', 'TJK': 'Asia',
      'THA': 'Asia', 'TLS': 'Asia', 'TUR': 'Asia', 'TKM': 'Asia', 'ARE': 'Asia',
      'UZB': 'Asia', 'VNM': 'Asia', 'YEM': 'Asia',
      
      // Europe
      'ALB': 'Europe', 'AND': 'Europe', 'AUT': 'Europe', 'BLR': 'Europe', 'BEL': 'Europe',
      'BIH': 'Europe', 'BGR': 'Europe', 'HRV': 'Europe', 'CYP': 'Europe', 'CZE': 'Europe',
      'DNK': 'Europe', 'EST': 'Europe', 'FIN': 'Europe', 'FRA': 'Europe', 'DEU': 'Europe',
      'GRC': 'Europe', 'HUN': 'Europe', 'ISL': 'Europe', 'IRL': 'Europe', 'ITA': 'Europe',
      'XKX': 'Europe', 'LVA': 'Europe', 'LIE': 'Europe', 'LTU': 'Europe', 'LUX': 'Europe',
      'MKD': 'Europe', 'MLT': 'Europe', 'MDA': 'Europe', 'MCO': 'Europe', 'MNE': 'Europe',
      'NLD': 'Europe', 'NOR': 'Europe', 'POL': 'Europe', 'PRT': 'Europe', 'ROU': 'Europe',
      'RUS': 'Europe', 'SMR': 'Europe', 'SRB': 'Europe', 'SVK': 'Europe', 'SVN': 'Europe',
      'ESP': 'Europe', 'SWE': 'Europe', 'CHE': 'Europe', 'UKR': 'Europe', 'GBR': 'Europe',
      'VAT': 'Europe',
      
      // North America
      'ATG': 'North America', 'BHS': 'North America', 'BRB': 'North America', 'BLZ': 'North America',
      'CAN': 'North America', 'CRI': 'North America', 'CUB': 'North America', 'DMA': 'North America',
      'DOM': 'North America', 'SLV': 'North America', 'GRD': 'North America', 'GTM': 'North America',
      'HTI': 'North America', 'HND': 'North America', 'JAM': 'North America', 'MEX': 'North America',
      'NIC': 'North America', 'PAN': 'North America', 'KNA': 'North America', 'LCA': 'North America',
      'VCT': 'North America', 'TTO': 'North America', 'USA': 'North America',
      
      // South America
      'ARG': 'South America', 'BOL': 'South America', 'BRA': 'South America', 'CHL': 'South America',
      'COL': 'South America', 'ECU': 'South America', 'GUY': 'South America', 'PRY': 'South America',
      'PER': 'South America', 'SUR': 'South America', 'URY': 'South America', 'VEN': 'South America',
      
      // Oceania
      'AUS': 'Oceania', 'FJI': 'Oceania', 'KIR': 'Oceania', 'MHL': 'Oceania',
      'FSM': 'Oceania', 'NRU': 'Oceania', 'NZL': 'Oceania', 'PLW': 'Oceania',
      'PNG': 'Oceania', 'WSM': 'Oceania', 'SLB': 'Oceania', 'TON': 'Oceania',
      'TUV': 'Oceania', 'VUT': 'Oceania'
    }
    
    return regionMap[countryCode] || 'Other'
  }

  // Update matching countries count when filters or data change
  useEffect(() => {
    updateMatchingCountriesCount(filters)
  }, [filters, spendingData])

  // Real-time filtering - no data reloading needed
  // The map service already filters data by yearRange in real-time

  // Sector filtering handled in real-time through filter changes

  const handleCountrySelect = useCallback((country) => {
    setSelectedCountry(country)
  }, [])

  // Get available countries for search
  const availableCountries = useMemo(() => {
    if (!spendingData.countries) return []
    
    return Object.values(spendingData.countries).map(country => ({
      name: country.name,
      code: country.code,
      region: getCountryRegion(country.code)
    }))
  }, [spendingData.countries])







  if (error) {
    return (
      <div className="error">
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={loadInitialData}>Retry</button>
      </div>
    )
  }

  return (
    <div className="spending-analysis">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading spending data...</p>
          </div>
        </div>
      )}
      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Sidebar - Categories and Indicators */}
        <div className="categories-sidebar">
          <div className="sidebar-header">
            <div className="header-content">
              <h3>Spending Indicators</h3>
              <button 
                className="stats-toggle-btn"
                onClick={() => setShowStatsPopup(!showStatsPopup)}
                title="Show/Hide Global Statistics"
              >
                📊
              </button>
            </div>
            <p>48 IMF Government Finance Statistics</p>
            
            {/* Stats Popup */}
            {showStatsPopup && spendingData.globalStats && (
              <div className="stats-popup">
                <div className="popup-header">
                  <h4>Global Statistics</h4>
                  <button 
                    className="close-popup"
                    onClick={() => setShowStatsPopup(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="popup-content">
                  <div className="stat-row">
                    <span>Countries:</span>
                    <span>{spendingData.globalStats.totalCountries}</span>
                  </div>
                  <div className="stat-row">
                    <span>Average:</span>
                    <span>{spendingData.globalStats.avgSpending.toLocaleString()}</span>
                  </div>
                  <div className="stat-row">
                    <span>Minimum:</span>
                    <span>{spendingData.globalStats.minSpending.toLocaleString()}</span>
                  </div>
                  <div className="stat-row">
                    <span>Maximum:</span>
                    <span>{spendingData.globalStats.maxSpending.toLocaleString()}</span>
                  </div>
                  <div className="stat-row">
                    <span>Data Points:</span>
                    <span>{spendingData.globalStats.totalDataPoints}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="category-filters">
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
              <button
                key={category}
                className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
                style={{ 
                  backgroundColor: selectedCategory === category ? color : 'transparent',
                  borderColor: color,
                  color: selectedCategory === category ? 'white' : color
                }}
                onClick={() => handleCategoryFilter(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <div className="indicators-list">
            {/* Show only the selected category */}
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => {
              // Only show the currently selected category
              if (selectedCategory !== category) {
                return null
              }
              
              const categoryIndicators = Object.entries(INDICATOR_METADATA).filter(
                ([_, metadata]) => metadata.category === category
              )
              
              // Skip categories with no indicators
              if (categoryIndicators.length === 0) {
                return null
              }
              
              return (
                <div key={category} className="indicator-group">
                  <div className="group-header">
                    <span className="group-name" style={{ color }}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  </div>
                  
                  <div className="indicators-in-group">
                      {categoryIndicators.map(([code, metadata]) => (
                        <div 
                          key={code} 
                          className={`indicator-item ${selectedIndicator === code ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                          onClick={() => !loading && handleIndicatorSelect(code)}
                          style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
                        >
                          <div className="indicator-info">
                            <span className="indicator-icon">{metadata.icon}</span>
                            <div className="indicator-text">
                              <span className="indicator-name">{metadata.name}</span>
                              <span className="indicator-desc">{metadata.unit}</span>
                            </div>
                          </div>
                          <div className="indicator-category">
                            <span 
                              className="category-badge"
                              style={{ backgroundColor: color }}
                            >
                              {category}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Center - Map */}
        <div className="map-container">
          <SpendingWorldMap
            worldData={worldData}
            spendingData={spendingData}
            colorScale={colorScale}
            filters={filters}
            selectedCountry={selectedCountry}
            onCountrySelect={handleCountrySelect}
          />
        </div>

        {/* Right Sidebar - Filters and Country Info */}
        <div className="filters-sidebar">
          <SpendingFilters
            onFilterChange={handleFilterChange}
            selectedCountry={selectedCountry}
            spendingData={spendingData}
            categories={Object.keys(CATEGORY_COLORS)}
            indicators={INDICATOR_METADATA}
            matchingCountries={filterStateManager.getFilterCount()}
            onCountrySelect={handleCountrySelect}
            availableCountries={availableCountries}
          />
        </div>
      </div>


    </div>
  )
}

export default SpendingAnalysis