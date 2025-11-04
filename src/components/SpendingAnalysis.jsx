import React, { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { indicatorsDataService } from '../services/IndicatorsDataService.js'
import { normalizeCountryName } from '../utils/normalizeCountryName.js';
import SearchBar from './SearchBar.jsx'
import SpendingFilters from './SpendingFilters.jsx'
import ZoomControls from './ZoomControls.jsx'
import Legend from './Legend.jsx'
import ExportButton from './ExportButton.jsx'
import './SpendingAnalysis.css'

/**
 * Government Spending Analysis Component
 * 
 * Features:
 * - World map heatmap showing expenses from plan expense data by default
 * - Left sidebar: All spending categories + world aggregate (changes to country-specific when country selected)
 * - Right sidebar: Filters
 * - Expandable category details when specific category clicked
 */
const SpendingAnalysis = () => {

  // State hooks
  const [spendingData, setSpendingData] = useState({ countries: {} });
  const [allIndicators, setAllIndicators] = useState({});
  const [filters, setFilters] = useState({ yearRange: [2015, 2023] });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedIndicator, setSelectedIndicator] = useState('GE'); // Default indicator code
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [worldData, setWorldData] = useState(null);
  const [colorScale, setColorScale] = useState(null);
  const [extent, setExtent] = useState([0, 100]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [globalInsights, setGlobalInsights] = useState(null);
  const [showStatsPopup, setShowStatsPopup] = useState(false);
  const [statsPopupData, setStatsPopupData] = useState(null);
  const svgRef = useRef();
  const gRef = useRef();
  const zoomRef = useRef();

  const spendingCategories = {
    'Expense': {
      'GE': { name: 'Total Government Expense', description: 'Total government expense as a percentage of GDP.', icon: '💰' },
    },
    'Compensation of Employees': {
      'GECE': { name: 'Compensation of Employees', description: 'Compensation of employees as a percentage of GDP.', icon: '🧑‍💼' },
      'GECES': { name: 'Compensation of Employees and Social Benefits', description: 'Compensation of employees and social benefits as a percentage of GDP.', icon: '🧑‍🤝‍🧑' },
    },
    'Grants': {
      'GEG': { name: 'Grants', description: 'Grants as a percentage of GDP.', icon: '🎁' },
    },
    'Interest': {
      'GEI': { name: 'Interest', description: 'Interest as a percentage of GDP.', icon: '📈' },
    },
    'Other Expense': {
      'GEO': { name: 'Other Expense', description: 'Other expense as a percentage of GDP.', icon: '🧾' },
    },
    'Social Benefits': {
      'GES': { name: 'Social Benefits', description: 'Social benefits as a percentage of GDP.', icon: '👨‍👩‍👧‍👦' },
    },
    'Use of Goods and Services': {
      'GEOM': { name: 'Use of Goods and Services', description: 'Use of goods and services as a percentage of GDP.', icon: '🛒' },
    }
  };


  // Load data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Update map when data or filters change
  useEffect(() => {
    if (spendingData.countries && worldData) {
      if (spendingData.globalStats) {
        const newExtent = [spendingData.globalStats.minSpending, spendingData.globalStats.maxSpending]
        setExtent(newExtent)
        
        const scale = d3.scaleSequential()
          .domain(newExtent)
          .interpolator(d3.interpolateViridis)
        setColorScale(() => scale)
      }
      drawMap()
    }
  }, [spendingData, filters.yearRange, selectedCountry])

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load world map data
      const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      setWorldData(world)

      // Load all indicator data
      const indicatorCodes = Object.values(spendingCategories).flatMap(group => Object.keys(group));
      const allData = {};
      for (const code of indicatorCodes) {
          try {
              const data = await indicatorsDataService.loadIndicatorData(code);
              allData[code] = data;
          } catch (e) {
              console.warn(`Failed to load indicator ${code}`, e);
          }
      }
      setAllIndicators(allData);

      // Set default indicator data
      const defaultIndicatorData = allData[selectedIndicator];
      if (defaultIndicatorData) {
          setSpendingData(defaultIndicatorData);
          if (defaultIndicatorData.globalStats) {
            const newExtent = [defaultIndicatorData.globalStats.minSpending, defaultIndicatorData.globalStats.maxSpending]
            setExtent(newExtent)
            
            const scale = d3.scaleSequential()
              .domain(newExtent)
              .interpolator(d3.interpolateViridis)
            setColorScale(() => scale)
          }
      } else {
        // Try to load at least the default one if all failed
        await loadIndicatorData(selectedIndicator)
      }

      // Load global insights (optional)
      try {
        const insights = await indicatorsDataService.loadGlobalInsights()
        setGlobalInsights(insights)
      } catch (err) {
        console.warn('Global insights not available:', err.message)
      }

    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Failed to load spending data. Please check if data files are available.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load data for specific indicator
   */
  const loadIndicatorData = async (indicatorCode) => {
    try {
      console.log(`Loading indicator data for: ${indicatorCode}`)
      const data = await indicatorsDataService.loadIndicatorData(indicatorCode)
      console.log(`Loaded data for ${indicatorCode}:`, {
        countries: Object.keys(data.countries).length,
        years: data.years,
        globalStats: data.globalStats
      })
      
      setSpendingData(data)
      
      // Store in all indicators cache
      setAllIndicators(prev => ({
        ...prev,
        [indicatorCode]: data
      }))

      // Update color scale
      if (data.globalStats) {
        const newExtent = [data.globalStats.minSpending, data.globalStats.maxSpending]
        setExtent(newExtent)
        
        const scale = d3.scaleSequential()
          .domain(newExtent)
          .interpolator(d3.interpolateViridis)
        setColorScale(() => scale)
      }

    } catch (err) {
      console.error(`Error loading indicator ${indicatorCode}:`, err)
      throw err
    }
  }

  /**
   * Handle category selection
   */
  const handleCategorySelect = (categoryCode, categoryData) => {
    if (expandedCategory === categoryCode) {
      // Collapse if already expanded
      setExpandedCategory(null)
      return
    }

    setSelectedIndicator(categoryCode)
    setExpandedCategory(categoryCode)
    
    // Use cached data
    if (allIndicators[categoryCode]) {
      setSpendingData(allIndicators[categoryCode])
    }
  }

  const handleShowStats = (categoryCode) => {
    setStatsPopupData({ categoryCode });
    setShowStatsPopup(true);
  }

  /**
   * Get country spending data for display
   */
  const getCountrySpending = (countryName, indicatorCode = selectedIndicator) => {
    const normalized = normalizeCountryName(countryName);
    const data = allIndicators[indicatorCode] || spendingData;
    if (!data.countries || !data.countries[normalized]) return null;

    const countryData = data.countries[normalized].data;
    const { yearRange } = filters
    
    // Filter for year range and calculate average
    const valuesInRange = Object.entries(countryData)
      .filter(([year, value]) => {
        const y = parseInt(year)
        return y >= yearRange[0] && y <= yearRange[1] && !isNaN(value)
      })
      .map(([year, value]) => value)

    if (valuesInRange.length === 0) return null

    return {
      average: valuesInRange.reduce((a, b) => a + b, 0) / valuesInRange.length,
      latest: valuesInRange[valuesInRange.length - 1],
      dataPoints: valuesInRange.length
    }
  }

  const getWorldAggregate = (indicatorCode) => {
    const data = allIndicators[indicatorCode]
    if (!data || !data.countries) return null

    const { yearRange } = filters
    let totalValue = 0
    let countryCount = 0

    Object.values(data.countries).forEach(country => {
      const valuesInRange = Object.entries(country.data)
        .filter(([year, value]) => {
          const y = parseInt(year)
          return y >= yearRange[0] && y <= yearRange[1] && !isNaN(value) && value > 0
        })
        .map(([year, value]) => value)

      if (valuesInRange.length > 0) {
        const avg = valuesInRange.reduce((a, b) => a + b, 0) / valuesInRange.length
        totalValue += avg
        countryCount++
      }
    })

    return countryCount > 0 ? totalValue / countryCount : 0
  }

  /**
   * Format spending values for display
   */
  const formatSpendingValue = (value) => {
    if (!value || isNaN(value)) return 'N/A'
    
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    } else {
      return value.toFixed(0)
    }
  }

  /**
   * Handle country selection
   */
  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    setSelectedCountries(prev => {
      const exists = prev.find(c => c.code === country.code)
      if (exists) {
        return prev.filter(c => c.code !== country.code)
      } else {
        return [...prev, country].slice(0, 5) // Limit to 5 countries
      }
    })
  }

  /**
   * Draw the world map
   */
  const drawMap = () => {
    if (!worldData || !spendingData.countries || !colorScale) return

    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    // Clear existing content
    g.selectAll('*').remove()

    const width = window.innerWidth - 720 // Account for sidebars
    const height = window.innerHeight - 80 // Account for header

    svg.attr('width', width).attr('height', height)

    // Setup projection
    const countries = topojson.feature(worldData, worldData.objects.countries)
    const projection = d3.geoNaturalEarth1()
      .fitSize([width - 60, height - 60], countries)

    const path = d3.geoPath().projection(projection)

    // Create countries group
    const countriesGroup = g.append('g').attr('class', 'countries-group')

    // Setup zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 20])
      .on('zoom', (event) => {
        countriesGroup.attr('transform', event.transform)
      })

    svg.call(zoom)
    zoomRef.current = zoom

    // Draw countries
    countriesGroup.selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', d => {
        const countryName = d.properties.NAME
        const spending = getCountrySpending(countryName)
        
        if (spending) {
          return colorScale(spending.average)
        }
        return '#e0e0e0'
      })
      .attr('stroke', d => {
        if (selectedCountry && d.properties.NAME === selectedCountry.name) {
          return '#ff6b00'
        }
        return '#fff'
      })
      .attr('stroke-width', d => {
        if (selectedCountry && d.properties.NAME === selectedCountry.name) {
          return 3
        }
        return 0.5
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const countryName = d.properties.NAME
        const spending = getCountrySpending(countryName)
        if (spending) {
          handleCountrySelect({
            name: countryName,
            code: countryName.substring(0, 3).toUpperCase(),
            spending
          })
        }
      })
      .append('title')
      .text(d => {
        const countryName = d.properties.NAME
        const spending = getCountrySpending(countryName)
        if (spending) {
          return `${countryName}\nAvg Spending: ${spending.average.toLocaleString()}\nData points: ${spending.dataPoints}`
        }
        return countryName
      })
  }

  /**
   * Handle zoom controls
   */
  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.5)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.67)
    }
  }

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity)
    }
  }

  if (loading) {
    return (
      <div className="spending-analysis loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="spending-analysis error">
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={loadInitialData}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="spending-analysis">
      {/* Header with Export */}
      <div className="spending-header">
        <div className="header-left">
          <h2>Government Spending Analysis</h2>
          <p>Interactive spending analysis with category breakdown</p>
        </div>
        <div className="header-right">
          <ExportButton 
            data={{
              summary: `Government spending analysis covering ${Object.keys(spendingData.countries || {}).length} countries`,
              csvData: Object.values(spendingData.countries || {}).flatMap(country => 
                Object.entries(country.data || {}).map(([year, value]) => ({
                  countryName: country.name,
                  year: parseInt(year),
                  indicator: selectedIndicator,
                  value: value
                }))
              ),
              indicator: selectedIndicator,
              yearRange: filters.yearRange
            }}
            fileName={`spending-analysis-${selectedIndicator}-${filters.yearRange[0]}-${filters.yearRange[1]}`}
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar-container">
        <SearchBar
          countries={Object.keys(spendingData.countries || {}).map(name => ({
            countryName: name,
            countryCode: name.substring(0, 3).toUpperCase()
          }))}
          onCountrySelect={(country) => {
            const spending = getCountrySpending(country.countryName)
            if (spending) {
              handleCountrySelect({
                name: country.countryName,
                code: country.countryCode,
                spending
              })
            }
          }}
          placeholder="Search countries..."
        />
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Sidebar - Categories */}
        <div className="categories-sidebar">
          <div className="sidebar-header">
            <h3>{selectedCountry ? `${selectedCountry.name} Spending` : 'World Spending Categories'}</h3>
            <p>{selectedCountry ? 'Country-specific breakdown' : 'Global aggregate data'}</p>
          </div>

          <div className="categories-list">
            {Object.entries(spendingCategories).map(([categoryTitle, categories]) => (
              <div key={categoryTitle} className="category-group">
                <h4 className="category-title">{categoryTitle}</h4>
                
                {Object.entries(categories).map(([code, category]) => {
                  const isExpanded = expandedCategory === code
                  const isSelected = selectedIndicator === code
                  const worldAvg = getWorldAggregate(code)
                  const countrySpending = selectedCountry ? getCountrySpending(selectedCountry.name, code) : null

                  return (
                    <div key={code} className={`category-item ${isSelected ? 'selected' : ''}`}>
                      <div 
                        className="category-header"
                        onClick={() => handleCategorySelect(code, category)}
                      >
                        <div className="category-info">
                          <span className="category-icon">{category.icon}</span>
                          <div className="category-text">
                            <span className="category-name">{category.name}</span>
                            <span className="category-desc">{category.description}</span>
                          </div>
                        </div>
                        <div className="category-value">
                          {selectedCountry && countrySpending ? (
                            <>
                              <span className="primary-value">{formatSpendingValue(countrySpending.average)}</span>
                              <span className="secondary-label">Country Avg</span>
                            </>
                          ) : (
                            <>
                              <span className="primary-value">{formatSpendingValue(worldAvg)}</span>
                              <span className="secondary-label">World Avg</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="category-details">
                          <div className="detail-stats">
                            <div className="stat-item">
                              <span className="stat-label">Global Average</span>
                              <span className="stat-value">{worldAvg ? worldAvg.toLocaleString() : 'N/A'}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Year Range</span>
                              <span className="stat-value">{filters.yearRange[0]} - {filters.yearRange[1]}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Countries with Data</span>
                              <span className="stat-value">{allIndicators[code]?.metadata?.totalCountries || 0}</span>
                            </div>
                          </div>

                          {globalInsights && globalInsights[category.name] && (
                            <div className="top-performers">
                              <h5>Top Performers</h5>
                              {Object.entries(globalInsights[category.name].top_10)
                                .slice(0, 3)
                                .map(([country, value]) => (
                                  <div key={country} className="performer-item">
                                    <span className="performer-country">{country}</span>
                                    <span className="performer-value">{value.toLocaleString()}</span>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                          <button className="stats-button" onClick={() => handleShowStats(code)}>Show Statistics</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Center - Map */}
        <div className="map-container">
          <svg ref={svgRef}>
            <g ref={gRef}></g>
          </svg>
        </div>

        {/* Right Sidebar - Filters */}
        <div className="filters-sidebar">
          <SpendingFilters
            onFilterChange={setFilters}
            minYear={2005}
            maxYear={2023}
            selectedCountries={selectedCountries}
            onRemoveCountry={(countryCode) => {
              setSelectedCountries(prev => prev.filter(c => c.code !== countryCode))
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
      />

      <Legend extent={extent} colorScale={colorScale} />

      {showStatsPopup && (
        <div className="stats-popup-overlay">
          <div className="stats-popup">
            <h3>Statistics for {statsPopupData.categoryCode}</h3>
            <p>Detailed statistics table will be shown here.</p>
            <button onClick={() => setShowStatsPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpendingAnalysis