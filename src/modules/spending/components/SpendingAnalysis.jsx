import { useState, useEffect } from 'react'
import * as d3 from 'd3'
import { 
  loadSpendingData,
  loadSpendingDataWithSectorFilter,
  getCountrySpendingValue,
  createColorScale,
  createCategoryColorScale,
  loadCategorySpendingData,
  createCategoryColorFunction
} from '../services/SimpleSpendingService.js'
import { 
  CATEGORY_COLORS,
  INDICATOR_METADATA
} from '../services/UnifiedDataService.js'

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
const SpendingAnalysis = ({ onExportDataChange }) => {
  // Core state
  const [spendingData, setSpendingData] = useState({})
  const [allIndicators, setAllIndicators] = useState({})
  const [selectedIndicator, setSelectedIndicator] = useState('GE')
  const [selectedCategory, setSelectedCategory] = useState('overview')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState(new Set(['overview']))
  const [visualizationMode, setVisualizationMode] = useState('multi-category') // 'single' or 'multi-category'
  
  // Map and visualization state
  const [worldData, setWorldData] = useState(null)
  const [colorScale, setColorScale] = useState(null)
  const [extent, setExtent] = useState([0, 100])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Filter state
  const [filters, setFilters] = useState({ 
    yearRange: [2015, 2023],
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

      // Load world map data and multi-category data by default
      const [world, categoryData] = await Promise.all([
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        loadCategorySpendingData(
          ['GE', 'GECE', 'GEG', 'GEI', 'GES', 'GEOM'], // Key indicators from different categories
          [2015, 2023]
        )
      ])
      
      setWorldData(world)
      setSpendingData(categoryData)
      setVisualizationMode('multi-category')

      console.log('Category data loaded:', categoryData)

      // Create category-based color function for multi-category visualization
      const colorFunction = createCategoryColorFunction(categoryData)
      setColorScale(() => colorFunction)
      
      console.log('Color function created:', typeof colorFunction)

    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Failed to load spending data. Please check if data files are available.')
    } finally {
      setLoading(false)
    }
  }

  const handleIndicatorSelect = async (indicatorCode) => {
    try {
      setLoading(true)
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

      // Load indicator data if not already cached
      if (!allIndicators[indicatorCode]) {
        const data = await loadSpendingData(indicatorCode)
        setAllIndicators(prev => ({ ...prev, [indicatorCode]: data }))
        setSpendingData(data)
      } else {
        setSpendingData(allIndicators[indicatorCode])
      }

      // Switch to single indicator mode
      setVisualizationMode('single')

      // Update category-based color scale
      const data = allIndicators[indicatorCode] || spendingData
      if (data.globalStats) {
        const { minSpending, maxSpending } = data.globalStats
        setExtent([minSpending, maxSpending])
        const scale = createCategoryColorScale(data)
        setColorScale(() => scale)
      }

    } catch (err) {
      console.error('Error loading indicator:', err)
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

  // Load data for a specific category with proper color gradient
  const loadCategorySpecificData = async (category) => {
    try {
      setLoading(true)
      setVisualizationMode('category-specific')
      
      // Get indicators for this category
      const categoryIndicators = Object.entries(INDICATOR_METADATA)
        .filter(([_, metadata]) => metadata.category === category)
        .map(([code, _]) => code)
      
      if (categoryIndicators.length > 0) {
        // Load data for the first indicator in the category as representative
        const representativeIndicator = categoryIndicators[0]
        setSelectedIndicator(representativeIndicator)
        
        const data = await loadSpendingData(representativeIndicator)
        
        // Set category information for proper coloring
        data.category = category
        data.name = `${category.charAt(0).toUpperCase() + category.slice(1)} Spending`
        
        setSpendingData(data)
        setAllIndicators(prev => ({ ...prev, [representativeIndicator]: data }))
        
        // Create category-specific color scale
        if (data.globalStats) {
          const { minSpending, maxSpending } = data.globalStats
          setExtent([minSpending, maxSpending])
          const scale = createCategoryColorScale(data)
          setColorScale(() => scale)
        }
      }
      
    } catch (err) {
      console.error('Error loading category-specific data:', err)
      setError('Failed to load category data')
    } finally {
      setLoading(false)
    }
  }

  // Handle filter changes in real-time like GDP page
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    // No loading states - just update filters and let the map re-render
  }

  // Real-time filtering - no data reloading needed
  // The map service already filters data by yearRange in real-time

  const toggleGroupExpansion = (groupName) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupName)) {
        newSet.delete(groupName)
      } else {
        newSet.add(groupName)
      }
      return newSet
    })
  }

  // Sector filtering handled in real-time through filter changes

  // Handle country selection from map
  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
  }



  // Handle visualization mode change
  const handleVisualizationModeChange = async (mode) => {
    try {
      setLoading(true)
      setVisualizationMode(mode)
      
      if (mode === 'multi-category') {
        // Load multi-category data
        const categoryData = await loadCategorySpendingData(
          ['GE', 'GECE', 'GEG', 'GEI', 'GES', 'GEOM'], // Key indicators from different categories
          filters.yearRange
        )
        
        setSpendingData(categoryData)
        
        // Create category-based color function instead of scale
        const colorFunction = createCategoryColorFunction(categoryData)
        setColorScale(() => colorFunction)
        
      } else {
        // Load single indicator data
        const data = await loadSpendingData(selectedIndicator)
        setSpendingData(data)
        
        // Create traditional color scale
        if (data.globalStats) {
          const { minSpending, maxSpending } = data.globalStats
          setExtent([minSpending, maxSpending])
          const scale = createCategoryColorScale(data)
          setColorScale(() => scale)
        }
      }
      
    } catch (err) {
      console.error('Error changing visualization mode:', err)
      setError('Failed to change visualization mode')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading spending data...</p>
      </div>
    )
  }

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

              // Always expand the selected category
              const isExpanded = true
              
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
                          className={`indicator-item ${selectedIndicator === code ? 'selected' : ''}`}
                          onClick={() => handleIndicatorSelect(code)}
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
          />
        </div>
      </div>


    </div>
  )
}

export default SpendingAnalysis