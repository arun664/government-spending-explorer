import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import * as d3 from 'd3'
import { dataProcessor } from '../services/DataProcessor.js'
import { loadAllData, filterData, getUniqueCountries, getUniqueYears } from '../utils/dataLoader.js'
import WorldMap from './WorldMap.jsx'
import ExportButton from './ExportButton.jsx'
import './SpendingAnalysis.css'

/**
 * SpendingAnalysis Component
 * 
 * Provides comprehensive government spending analysis with:
 * - Interactive expense data visualization
 * - Country-wise spending breakdown with statistical analysis
 * - Expense category filtering and time series charts
 * - Integration with existing data processing utilities
 * 
 * Requirements addressed:
 * - 1.1: Display government expense data for all available countries
 * - 1.2: Provide expense data categorized by spending type, year, and country
 * - 1.3: Show total spending amounts, per capita calculations, and GDP ratios
 * - 8.1: Data cleaning processes to handle missing values, outliers, and inconsistencies
 * - 8.2: Statistical metrics including mean, median, standard deviation, and percentiles
 */
const SpendingAnalysis = () => {
  // State management
  const [data, setData] = useState({
    expenses: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processedData, setProcessedData] = useState(null)
  const [selectedCountries, setSelectedCountries] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [yearRange, setYearRange] = useState([2018, 2021])
  const [viewMode, setViewMode] = useState('map-selection') // 'map-selection', 'insights', 'heatmap', 'trends'
  const [sortBy, setSortBy] = useState('totalSpending')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedCountryFromMap, setSelectedCountryFromMap] = useState(null)
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true)
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true)
  const [countrySearchTerm, setCountrySearchTerm] = useState('')

  // Load and process data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load expense data from CSV
      const expenseData = await d3.csv('/data/expense_clean.csv', d => ({
        countryName: d['Country Name'],
        expenseCategory: d['Expense Category'],
        year: +d.Year,
        value: +d.Value
      }))

      // Process and aggregate expense data by country and year
      const aggregatedExpenses = aggregateExpenseData(expenseData)

      setData({
        expenses: aggregatedExpenses,
        rawExpenses: expenseData
      })

      // Process data using the enhanced data processor
      const processingResult = await dataProcessor.processData(aggregatedExpenses, {
        numericFields: ['totalSpending', 'categoryCount'],
        requiredFields: ['countryName', 'year', 'totalSpending']
      })

      setProcessedData(processingResult)

    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Aggregate expense data by country and year
  const aggregateExpenseData = (expenseData) => {
    const grouped = d3.group(expenseData, d => d.countryName, d => d.year)
    const aggregated = []

    grouped.forEach((yearData, countryName) => {
      yearData.forEach((records, year) => {
        const totalSpending = d3.sum(records, d => d.value)
        const categories = [...new Set(records.map(d => d.expenseCategory))]
        const categoryBreakdown = d3.rollup(records, v => d3.sum(v, d => d.value), d => d.expenseCategory)

        aggregated.push({
          countryName,
          year,
          totalSpending,
          categoryCount: categories.length,
          categories: Array.from(categoryBreakdown, ([category, value]) => ({ category, value }))
            .sort((a, b) => b.value - a.value)
        })
      })
    })

    return aggregated
  }



  // Memoized calculations for performance
  const filteredData = useMemo(() => {
    if (!data.expenses.length) return []

    let filtered = data.expenses.filter(d => {
      if (d.year < yearRange[0] || d.year > yearRange[1]) return false
      if (selectedCountries.length > 0 && !selectedCountries.includes(d.countryName)) return false
      return true
    })

    // Sort data
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || 0
      const bVal = b[sortBy] || 0
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return filtered
  }, [data.expenses, selectedCountries, yearRange, sortBy, sortOrder])

  const uniqueCountries = useMemo(() => {
    return getUniqueCountries(data.expenses)
  }, [data.expenses])

  const uniqueCategories = useMemo(() => {
    if (!data.rawExpenses) return []
    return [...new Set(data.rawExpenses.map(d => d.expenseCategory))].sort()
  }, [data.rawExpenses])

  const availableYears = useMemo(() => {
    return getUniqueYears(data.expenses)
  }, [data.expenses])

  const filteredCountries = useMemo(() => {
    if (!countrySearchTerm) return uniqueCountries
    return uniqueCountries.filter(country => 
      country.toLowerCase().includes(countrySearchTerm.toLowerCase())
    )
  }, [uniqueCountries, countrySearchTerm])

  // Event handlers
  const handleCountrySelection = (country) => {
    setSelectedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    )
  }

  const handleMapCountryClick = useCallback((countryData) => {
    setSelectedCountryFromMap(countryData)
    // Add to selected countries if not already selected
    if (!selectedCountries.includes(countryData.countryName)) {
      setSelectedCountries(prev => [...prev, countryData.countryName])
    }
  }, [selectedCountries])

  const handleCategorySelection = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const resetFilters = () => {
    setSelectedCountries([])
    setSelectedCategories([])
    setYearRange([Math.min(...availableYears), Math.max(...availableYears)])
    setSelectedCountryFromMap(null)
  }

  // Render loading state
  if (loading) {
    return (
      <div className="spending-analysis loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="spending-analysis error">
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={loadData} className="retry-button">
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="spending-analysis">
      {/* Fixed Header - Max 20% Height */}
      <div className="fixed-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="sidebar-toggle left-toggle"
              onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
              title="Toggle Filters"
            >
              {leftSidebarVisible ? '◀' : '▶'} Filters
            </button>
            <div className="page-title">
              <h2>Government Spending Analysis</h2>
              <p>Interactive analysis of government spending patterns</p>
            </div>
          </div>
          
          <div className="header-center">
            <div className="view-selector">
              <button 
                className={`view-btn ${viewMode === 'map-selection' ? 'active' : ''}`}
                onClick={() => setViewMode('map-selection')}
              >
                🌍 Map
              </button>
              <button 
                className={`view-btn ${viewMode === 'insights' ? 'active' : ''}`}
                onClick={() => setViewMode('insights')}
              >
                🔍 Insights
              </button>
              <button 
                className={`view-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
                onClick={() => setViewMode('heatmap')}
              >
                🗺️ Heatmap
              </button>
              <button 
                className={`view-btn ${viewMode === 'trends' ? 'active' : ''}`}
                onClick={() => setViewMode('trends')}
              >
                📈 Trends
              </button>
            </div>
          </div>

          <div className="header-right">
            <ExportButton 
              data={{
                summary: `Government spending analysis covering ${data.expenses?.length || 0} data points across multiple countries and years. Analysis includes spending patterns, statistical insights, and trend analysis.`,
                csvData: data.expenses || [],
                csvColumns: ['countryName', 'countryCode', 'region', 'year', 'expenseCategory', 'value'],
                csvFormatter: (row) => ({
                  countryName: row.countryName || '',
                  countryCode: row.countryCode || '',
                  region: row.region || '',
                  year: row.year || '',
                  expenseCategory: row.expenseCategory || '',
                  value: row.value || 0
                }),
                overview: processedData ? {
                  totalCountries: processedData.uniqueCountries?.length || 0,
                  totalRecords: data.expenses?.length || 0,
                  yearRange: `${yearRange[0]} - ${yearRange[1]}`,
                  selectedCountries: selectedCountries.length || 'All',
                  categories: selectedCategories.length || 'All'
                } : {},
                trends: processedData?.trends || [],
                comparisons: processedData?.countryComparisons || []
              }}
              chartElements={[
                document.querySelector('.insights-panel'),
                document.querySelector('.heatmap-container'),
                document.querySelector('.trends-panel')
              ].filter(Boolean)}
              reportType="spending"
              metadata={{
                dateRange: `${yearRange[0]} - ${yearRange[1]}`,
                countries: selectedCountries.length > 0 ? selectedCountries : ['All Countries'],
                generatedBy: 'Government Expense Dashboard',
                analysisType: 'Government Spending Analysis'
              }}
              className="export-btn-header"
            />
            <button 
              className="sidebar-toggle right-toggle"
              onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
              title="Toggle Countries"
            >
              Countries {rightSidebarVisible ? '▶' : '◀'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout - Fixed Height with Sidebars */}
      <div className="main-layout">
        {/* Left Sidebar - Filters (Hidden for Map View) */}
        {leftSidebarVisible && viewMode !== 'map-selection' && (
          <div className="left-sidebar">
            <div className="sidebar-header">
              <h4>Filters</h4>
            </div>
            <div className="sidebar-content">
              <div className="filter-group">
                <label>Year Range</label>
                <div className="year-display">{yearRange[0]} - {yearRange[1]}</div>
                <div className="year-range-slider">
                  <input
                    type="range"
                    min={Math.min(...availableYears)}
                    max={Math.max(...availableYears)}
                    value={yearRange[0]}
                    onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
                    className="range-min"
                  />
                  <input
                    type="range"
                    min={Math.min(...availableYears)}
                    max={Math.max(...availableYears)}
                    value={yearRange[1]}
                    onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
                    className="range-max"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="totalSpending">Total Spending</option>
                  <option value="categoryCount">Categories</option>
                  <option value="countryName">Country Name</option>
                </select>
                <button 
                  className={`sort-toggle ${sortOrder}`}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              <button onClick={resetFilters} className="reset-filters-btn">
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Center Content - Scrollable */}
        <div className={`center-content ${viewMode === 'map-selection' || (!leftSidebarVisible && !rightSidebarVisible) ? 'full-width' : ''}`}>
          {viewMode === 'insights' && (
            <PatternInsightsPanel 
              data={filteredData} 
              processedData={processedData}
              selectedCountries={selectedCountries}
              rawExpenses={data.rawExpenses}
            />
          )}
          
          {viewMode === 'heatmap' && (
            <SpendingHeatmapPanel 
              data={filteredData}
              rawExpenses={data.rawExpenses}
              selectedCountries={selectedCountries}
              yearRange={yearRange}
            />
          )}
          
          {viewMode === 'trends' && (
            <TrendAnalysisPanel 
              data={filteredData}
              selectedCountries={selectedCountries}
              yearRange={yearRange}
              rawExpenses={data.rawExpenses}
            />
          )}
          
          {viewMode === 'map-selection' && (
            <MapSelectionPanel 
              data={data.expenses}
              onCountryClick={handleMapCountryClick}
              selectedCountryFromMap={selectedCountryFromMap}
              selectedCountries={selectedCountries}
              rawExpenses={data.rawExpenses}
            />
          )}
        </div>

        {/* Right Sidebar - Countries (Hidden for Map View) */}
        {rightSidebarVisible && viewMode !== 'map-selection' && (
          <div className="right-sidebar">
            <div className="sidebar-header">
              <h4>Countries ({selectedCountries.length})</h4>
            </div>
            <div className="sidebar-content">
              {selectedCountries.length === 0 ? (
                <div className="no-selection">
                  <p>Use Map Selection to choose countries</p>
                </div>
              ) : (
                <div className="selected-countries-list">
                  {selectedCountries.map(country => (
                    <div key={country} className="country-item">
                      <span className="country-name">{country}</span>
                      <button 
                        className="remove-country-btn"
                        onClick={() => handleCountrySelection(country)}
                        title="Remove country"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {uniqueCountries.length > 0 && (
                <div className="available-countries">
                  <h5>Available Countries ({filteredCountries.length})</h5>
                  <div className="country-search">
                    <input 
                      type="text" 
                      placeholder="Search countries..."
                      className="search-input"
                      value={countrySearchTerm}
                      onChange={(e) => setCountrySearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="country-list">
                    {filteredCountries.slice(0, 15).map(country => (
                      <div 
                        key={country} 
                        className={`country-option ${selectedCountries.includes(country) ? 'selected' : ''}`}
                        onClick={() => handleCountrySelection(country)}
                      >
                        {country}
                        {selectedCountries.includes(country) && <span className="selected-indicator">✓</span>}
                      </div>
                    ))}
                    {filteredCountries.length === 0 && countrySearchTerm && (
                      <div className="no-results">No countries found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Pattern Insights Panel Component - Replaces basic statistical displays with pattern-based insights
const PatternInsightsPanel = ({ data, processedData, selectedCountries, rawExpenses }) => {


  const insights = useMemo(() => {
    if (!data.length || !rawExpenses) return null

    // Pattern-based insights instead of basic statistics
    const countrySpending = d3.rollup(data, v => d3.sum(v, d => d.totalSpending), d => d.countryName)
    const sortedCountries = Array.from(countrySpending, ([country, spending]) => ({ country, spending }))
      .sort((a, b) => b.spending - a.spending)

    // Identify spending patterns
    const spendingValues = Array.from(countrySpending.values())
    const median = d3.median(spendingValues)
    const highSpenders = sortedCountries.filter(d => d.spending > median * 2)
    const lowSpenders = sortedCountries.filter(d => d.spending < median * 0.5)
    
    // Category analysis from raw expenses
    const categorySpending = d3.rollup(rawExpenses || [], v => d3.sum(v, d => d.value), d => d.expenseCategory)
    const topCategories = Array.from(categorySpending, ([category, spending]) => ({ category, spending }))
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 5)

    // Regional patterns
    const yearlyTrends = d3.rollup(data, v => d3.sum(v, d => d.totalSpending), d => d.year)
    const years = Array.from(yearlyTrends.keys()).sort()
    const trendDirection = years.length > 1 ? 
      (yearlyTrends.get(years[years.length - 1]) > yearlyTrends.get(years[0]) ? 'increasing' : 'decreasing') : 'stable'

    // Volatility analysis
    const yearlyValues = Array.from(yearlyTrends.values())
    const volatility = yearlyValues.length > 1 ? d3.deviation(yearlyValues) / d3.mean(yearlyValues) : 0

    // Geographic distribution analysis
    const geographicSpread = sortedCountries.length
    const spendingConcentration = highSpenders.length / sortedCountries.length

    return {
      totalCountries: sortedCountries.length,
      highSpenders: highSpenders.slice(0, 3),
      lowSpenders: lowSpenders.slice(0, 3),
      topCategories,
      trendDirection,
      volatility,
      geographicSpread,
      spendingConcentration,
      dominantPattern: highSpenders.length > sortedCountries.length * 0.1 ? 'concentrated' : 'distributed',
      yearRange: years.length > 0 ? `${years[0]}-${years[years.length - 1]}` : 'N/A'
    }
  }, [data, rawExpenses])

  if (!insights) return <div className="no-data">No data available for pattern analysis</div>

  return (
    <div className="pattern-insights-panel">
      {/* Pattern Insights Grid */}
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-icon">🎯</div>
          <div className="insight-content">
            <h4>Spending Pattern</h4>
            <p className="insight-value">{insights.dominantPattern}</p>
            <p className="insight-subtitle">
              {insights.dominantPattern === 'concentrated' 
                ? 'Few countries dominate spending' 
                : 'Spending distributed across countries'}
            </p>
          </div>
        </div>
        
        <div className="insight-card">
          <div className="insight-icon">📈</div>
          <div className="insight-content">
            <h4>Overall Trend</h4>
            <p className="insight-value">{insights.trendDirection}</p>
            <p className="insight-subtitle">Spending trajectory over time</p>
          </div>
        </div>
        
        <div className="insight-card">
          <div className="insight-icon">⚡</div>
          <div className="insight-content">
            <h4>Volatility</h4>
            <p className="insight-value">{(insights.volatility * 100).toFixed(1)}%</p>
            <p className="insight-subtitle">Year-to-year variation</p>
          </div>
        </div>
        
        <div className="insight-card">
          <div className="insight-icon">🌍</div>
          <div className="insight-content">
            <h4>Geographic Spread</h4>
            <p className="insight-value">{insights.geographicSpread}</p>
            <p className="insight-subtitle">Countries in analysis</p>
          </div>
        </div>
      </div>

      {/* Pattern Analysis Dashboard */}
      <div className="pattern-dashboard">
        <div className="dashboard-left">
          {/* High Spenders Pattern */}
          <div className="pattern-card">
            <h4>🔥 High Spending Pattern</h4>
            <div className="pattern-list">
              {insights.highSpenders.map((item, index) => (
                <div key={item.country} className="pattern-item high">
                  <span className="pattern-rank">#{index + 1}</span>
                  <span className="pattern-country">{item.country}</span>
                  <span className="pattern-value">{item.spending.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <p className="pattern-insight">
              These countries show significantly above-average spending patterns
            </p>
          </div>

          {/* Top Categories Pattern */}
          <div className="pattern-card">
            <h4>💼 Category Spending Patterns</h4>
            <div className="category-patterns">
              {insights.topCategories.map((item, index) => {
                const maxSpending = insights.topCategories[0].spending
                const widthPercent = (item.spending / maxSpending) * 100
                
                return (
                  <div key={item.category} className="category-pattern-item">
                    <div className="category-label">
                      <span className="category-name">{item.category}</span>
                    </div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar-fill" 
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                      <span className="category-value">{item.spending.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="dashboard-right">
          {/* Low Spenders Pattern */}
          <div className="pattern-card">
            <h4>❄️ Conservative Spending Pattern</h4>
            <div className="pattern-list">
              {insights.lowSpenders.map((item, index) => (
                <div key={item.country} className="pattern-item low">
                  <span className="pattern-rank">#{index + 1}</span>
                  <span className="pattern-country">{item.country}</span>
                  <span className="pattern-value">{item.spending.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <p className="pattern-insight">
              These countries maintain conservative spending approaches
            </p>
          </div>

          {/* Pattern Summary */}
          <div className="pattern-summary-card">
            <h4>📊 Pattern Summary</h4>
            <div className="summary-items">
              <div className="summary-item">
                <span className="summary-icon">🌍</span>
                <div className="summary-text">
                  <strong>{insights.totalCountries}</strong> countries analyzed
                </div>
              </div>
              <div className="summary-item">
                <span className="summary-icon">📅</span>
                <div className="summary-text">
                  <strong>{insights.yearRange}</strong> time period
                </div>
              </div>
              <div className="summary-item">
                <span className="summary-icon">🎯</span>
                <div className="summary-text">
                  <strong>{insights.topCategories.length}</strong> major spending categories
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Spending Heatmap Panel Component - Interactive heatmap showing spending patterns
const SpendingHeatmapPanel = ({ data, rawExpenses, selectedCountries, yearRange }) => {
  const heatmapRef = useRef(null)
  
  const heatmapData = useMemo(() => {
    if (!rawExpenses || rawExpenses.length === 0) return null

    // Create matrix data for heatmap: countries vs categories
    const filteredData = rawExpenses.filter(d => 
      d.year >= yearRange[0] && d.year <= yearRange[1] &&
      (selectedCountries.length === 0 || selectedCountries.includes(d.countryName))
    )

    const countryCategories = d3.rollup(
      filteredData,
      v => d3.sum(v, d => d.value),
      d => d.countryName,
      d => d.expenseCategory
    )

    const countries = Array.from(countryCategories.keys()).slice(0, 30) // Show more countries
    const categories = [...new Set(filteredData.map(d => d.expenseCategory))].slice(0, 15) // Show more categories

    const matrix = countries.map(country => {
      return categories.map(category => {
        const value = countryCategories.get(country)?.get(category) || 0
        return { country, category, value }
      })
    }).flat()

    return { matrix, countries, categories }
  }, [rawExpenses, selectedCountries, yearRange])

  useEffect(() => {
    if (!heatmapData || !heatmapRef.current) return

    const svg = d3.select(heatmapRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 120, right: 50, bottom: 150, left: 200 }
    const width = 1200 - margin.left - margin.right
    const height = 700 - margin.bottom - margin.top

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3.scaleBand()
      .domain(heatmapData.categories)
      .range([0, width])
      .padding(0.1)

    const yScale = d3.scaleBand()
      .domain(heatmapData.countries)
      .range([0, height])
      .padding(0.1)

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(heatmapData.matrix, d => d.value)])

    // Draw heatmap cells
    g.selectAll('.heatmap-cell')
      .data(heatmapData.matrix)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => xScale(d.category))
      .attr('y', d => yScale(d.country))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.value === 0 ? '#f8f9fa' : colorScale(d.value))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        // Tooltip
        d3.select('body').selectAll('.heatmap-tooltip')
          .data([0])
          .join('div')
          .attr('class', 'heatmap-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .html(`
            <strong>${d.country}</strong><br/>
            ${d.category}<br/>
            Value: ${d.value.toLocaleString()}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .style('opacity', 1)
      })
      .on('mouseout', () => {
        d3.select('.heatmap-tooltip').remove()
      })

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-65)')
      .style('font-size', '10px')

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '10px')

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Government Spending Heatmap: Countries vs Categories')

  }, [heatmapData])

  if (!heatmapData) {
    return (
      <div className="heatmap-panel">
        <p>No data available for heatmap visualization</p>
      </div>
    )
  }

  return (
    <div className="heatmap-panel">
      <div className="heatmap-header">
        <h3>Interactive Spending Heatmap</h3>
        <p>Hover over cells to see detailed spending information</p>
      </div>
      <div className="heatmap-container">
        <svg ref={heatmapRef} width={1200} height={700}></svg>
      </div>
      <div className="heatmap-legend">
        <p>Color intensity represents spending amount - darker colors indicate higher spending</p>
      </div>
    </div>
  )
}

// Trend Analysis Panel Component - Shows spending trends and growth/decline patterns
const TrendAnalysisPanel = ({ data, selectedCountries, yearRange, rawExpenses }) => {
  const calculateSectorTrends = useCallback((rawExpenses, yearRange) => {
    const filteredExpenses = rawExpenses.filter(d => 
      d.year >= yearRange[0] && d.year <= yearRange[1]
    )

    const sectorYearData = d3.rollup(
      filteredExpenses,
      v => d3.sum(v, d => d.value),
      d => d.expenseCategory,
      d => d.year
    )

    return Array.from(sectorYearData, ([sector, yearData]) => {
      const years = Array.from(yearData.keys()).sort()
      if (years.length < 2) return null

      const firstYearValue = yearData.get(years[0])
      const lastYearValue = yearData.get(years[years.length - 1])
      let growthRate = 0
      if (firstYearValue > 0) {
        growthRate = ((lastYearValue - firstYearValue) / firstYearValue) * 100
        // Cap growth rate at reasonable values for display
        growthRate = Math.max(-999, Math.min(9999, growthRate))
      }

      return {
        sector,
        growthRate,
        trend: growthRate > 10 ? 'increasing' : growthRate < -10 ? 'decreasing' : 'stable',
        totalSpending: d3.sum(Array.from(yearData.values()))
      }
    }).filter(Boolean).sort((a, b) => Math.abs(b.growthRate) - Math.abs(a.growthRate))
  }, [])

  const trendData = useMemo(() => {
    if (!data.length) return null

    // Calculate trends for selected countries or all countries
    const analysisCountries = selectedCountries.length > 0 ? selectedCountries : 
      [...new Set(data.map(d => d.countryName))].slice(0, 10)

    const trends = analysisCountries.map(country => {
      const countryData = data
        .filter(d => d.countryName === country)
        .sort((a, b) => a.year - b.year)

      if (countryData.length < 2) return null

      const firstYear = countryData[0]
      const lastYear = countryData[countryData.length - 1]
      let growthRate = 0
      if (firstYear.totalSpending > 0) {
        growthRate = ((lastYear.totalSpending - firstYear.totalSpending) / firstYear.totalSpending) * 100
        // Cap growth rate at reasonable values for display
        growthRate = Math.max(-999, Math.min(9999, growthRate))
      }

      // Calculate trend direction and volatility
      const values = countryData.map(d => d.totalSpending)
      const volatility = d3.deviation(values) / d3.mean(values)

      return {
        country,
        data: countryData,
        growthRate,
        volatility,
        trend: growthRate > 5 ? 'increasing' : growthRate < -5 ? 'decreasing' : 'stable',
        totalSpending: d3.sum(countryData, d => d.totalSpending)
      }
    }).filter(Boolean)

    // Sector trends from raw expenses
    const sectorTrends = rawExpenses ? calculateSectorTrends(rawExpenses, yearRange) : []

    return { countryTrends: trends, sectorTrends }
  }, [data, selectedCountries, yearRange, rawExpenses, calculateSectorTrends])

  if (!trendData) {
    return (
      <div className="trend-analysis-panel">
        <p>No data available for trend analysis</p>
      </div>
    )
  }

  return (
    <div className="trend-analysis-panel">
      <div className="trend-header">
        <h3>Spending Trend Analysis</h3>
        <p>Analyze which countries and sectors are increasing or decreasing spending</p>
      </div>

      <div className="trend-dashboard">
        {/* Country Trends */}
        <div className="trend-section">
          <h4>Country Spending Trends</h4>
          <div className="trend-grid">
            {trendData.countryTrends.map(trend => (
              <div key={trend.country} className={`trend-card ${trend.trend}`}>
                <div className="trend-header-info">
                  <h5>{trend.country}</h5>
                  <span className={`trend-badge ${trend.trend}`}>
                    {trend.trend === 'increasing' ? '📈' : trend.trend === 'decreasing' ? '📉' : '➡️'}
                    {trend.growthRate.toFixed(1)}%
                  </span>
                </div>
                <div className="trend-details">
                  <p>Total Spending: {trend.totalSpending.toLocaleString()}</p>
                  <p>Volatility: {(trend.volatility * 100).toFixed(1)}%</p>
                  <p>Data Points: {trend.data.length} years</p>
                </div>
                <div className="mini-chart">
                  {trend.data.map((d, i) => (
                    <div 
                      key={d.year} 
                      className="mini-bar"
                      style={{ 
                        height: `${(d.totalSpending / Math.max(...trend.data.map(x => x.totalSpending))) * 30}px`,
                        backgroundColor: trend.trend === 'increasing' ? '#28a745' : 
                                       trend.trend === 'decreasing' ? '#dc3545' : '#6c757d'
                      }}
                      title={`${d.year}: ${d.totalSpending.toLocaleString()}`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Trends */}
        {trendData.sectorTrends.length > 0 && (
          <div className="trend-section">
            <h4>Sector Spending Trends</h4>
            <div className="sector-trends">
              {trendData.sectorTrends.slice(0, 8).map(trend => (
                <div key={trend.sector} className={`sector-trend-item ${trend.trend}`}>
                  <div className="sector-info">
                    <span className="sector-name">{trend.sector}</span>
                    <span className={`sector-trend-badge ${trend.trend}`}>
                      {trend.trend === 'increasing' ? '🔥' : trend.trend === 'decreasing' ? '❄️' : '⚖️'}
                      {trend.growthRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="sector-spending">
                    Total: {trend.totalSpending.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Map Selection Panel Component - Standalone map with detailed statistics
const MapSelectionPanel = ({ data, onCountryClick, selectedCountryFromMap, selectedCountries, rawExpenses }) => {
  const [mapYearRange, setMapYearRange] = useState([2018, 2021])
  
  const availableYears = useMemo(() => {
    if (!data.length) return []
    return [...new Set(data.map(d => d.year))].sort()
  }, [data])

  const countryDetailedStats = useMemo(() => {
    if (!selectedCountryFromMap || !data.length) return null

    const countryData = data.filter(d => 
      d.countryName === selectedCountryFromMap.countryName &&
      d.year >= mapYearRange[0] && d.year <= mapYearRange[1]
    )
    
    if (countryData.length === 0) return null

    // Basic statistics
    const totalSpending = d3.sum(countryData, d => d.totalSpending)
    const avgSpending = d3.mean(countryData, d => d.totalSpending)
    const years = countryData.map(d => d.year).sort()
    const maxSpending = d3.max(countryData, d => d.totalSpending)
    const minSpending = d3.min(countryData, d => d.totalSpending)

    // Growth calculation
    let growthRate = 0
    if (years.length >= 2) {
      const firstYear = countryData.find(d => d.year === years[0])
      const lastYear = countryData.find(d => d.year === years[years.length - 1])
      if (firstYear && lastYear && firstYear.totalSpending > 0) {
        growthRate = ((lastYear.totalSpending - firstYear.totalSpending) / firstYear.totalSpending) * 100
      }
    }

    // Category breakdown from raw expenses
    let categoryBreakdown = []
    if (rawExpenses) {
      const countryExpenses = rawExpenses.filter(d => 
        d.countryName === selectedCountryFromMap.countryName &&
        d.year >= mapYearRange[0] && d.year <= mapYearRange[1]
      )
      
      const categoryTotals = d3.rollup(countryExpenses, v => d3.sum(v, d => d.value), d => d.expenseCategory)
      categoryBreakdown = Array.from(categoryTotals, ([category, value]) => ({ category, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    }

    // Year-over-year data
    const yearlyData = years.map(year => {
      const yearData = countryData.find(d => d.year === year)
      return {
        year,
        spending: yearData ? yearData.totalSpending : 0
      }
    })

    return {
      totalSpending,
      avgSpending,
      maxSpending,
      minSpending,
      growthRate,
      yearRange: `${years[0]}-${years[years.length - 1]}`,
      recordCount: countryData.length,
      categoryBreakdown,
      yearlyData,
      volatility: d3.deviation(countryData.map(d => d.totalSpending)) / avgSpending
    }
  }, [selectedCountryFromMap, data, mapYearRange, rawExpenses])

  return (
    <div className="map-selection-panel-improved">
      <div className="map-main-layout">
        {/* Left Side - Map with Year Filter */}
        <div className="map-section-with-controls">
          <div className="map-header-card">
            <h3>Interactive Country Selection</h3>
            <p>Click on countries to view detailed spending statistics</p>
            
            {/* Year Range Filter for Map */}
            <div className="map-year-filter">
              <label>Analysis Period</label>
              <div className="year-display">{mapYearRange[0]} - {mapYearRange[1]}</div>
              <div className="year-range-slider">
                <input
                  type="range"
                  min={Math.min(...availableYears)}
                  max={Math.max(...availableYears)}
                  value={mapYearRange[0]}
                  onChange={(e) => setMapYearRange([+e.target.value, mapYearRange[1]])}
                  className="range-min"
                />
                <input
                  type="range"
                  min={Math.min(...availableYears)}
                  max={Math.max(...availableYears)}
                  value={mapYearRange[1]}
                  onChange={(e) => setMapYearRange([mapYearRange[0], +e.target.value])}
                  className="range-max"
                />
              </div>
            </div>
          </div>
          
          <div className="map-container-large">
            <WorldMap 
              onCountryClick={onCountryClick}
              selectedCountry={selectedCountryFromMap}
              width={700}
              height={450}
              className="selection-map"
            />
          </div>
        </div>

        {/* Right Side - Detailed Statistics Panel */}
        <div className="country-stats-panel">
          {selectedCountryFromMap && countryDetailedStats ? (
            <div className="detailed-stats">
              <div className="stats-header">
                <h3>{selectedCountryFromMap.countryName}</h3>
                <span className="country-region">{selectedCountryFromMap.region}</span>
              </div>

              {/* Key Metrics */}
              <div className="key-metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon">💰</div>
                  <div className="metric-content">
                    <span className="metric-label">Total Spending</span>
                    <span className="metric-value">{countryDetailedStats.totalSpending.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">📊</div>
                  <div className="metric-content">
                    <span className="metric-label">Average Annual</span>
                    <span className="metric-value">{countryDetailedStats.avgSpending.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">📈</div>
                  <div className="metric-content">
                    <span className="metric-label">Growth Rate</span>
                    <span className={`metric-value ${countryDetailedStats.growthRate >= 0 ? 'positive' : 'negative'}`}>
                      {countryDetailedStats.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">⚡</div>
                  <div className="metric-content">
                    <span className="metric-label">Volatility</span>
                    <span className="metric-value">{(countryDetailedStats.volatility * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Yearly Trend Chart */}
              <div className="yearly-trend-section">
                <h4>Spending Trend ({countryDetailedStats.yearRange})</h4>
                <div className="trend-chart">
                  {countryDetailedStats.yearlyData.map((d, i) => (
                    <div key={d.year} className="trend-bar-container">
                      <div 
                        className="trend-bar"
                        style={{ 
                          height: `${(d.spending / countryDetailedStats.maxSpending) * 100}px`,
                          backgroundColor: countryDetailedStats.growthRate >= 0 ? '#28a745' : '#dc3545'
                        }}
                        title={`${d.year}: ${d.spending.toLocaleString()}`}
                      ></div>
                      <span className="trend-year">{d.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              {countryDetailedStats.categoryBreakdown.length > 0 && (
                <div className="category-breakdown-section">
                  <h4>Top Spending Categories</h4>
                  <div className="category-list">
                    {countryDetailedStats.categoryBreakdown.map((cat, i) => (
                      <div key={cat.category} className="category-item">
                        <div className="category-info">
                          <span className="category-rank">#{i + 1}</span>
                          <span className="category-name">{cat.category}</span>
                        </div>
                        <div className="category-value">{cat.value.toLocaleString()}</div>
                        <div className="category-bar">
                          <div 
                            className="category-bar-fill"
                            style={{ 
                              width: `${(cat.value / countryDetailedStats.categoryBreakdown[0].value) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Stats */}
              <div className="additional-stats">
                <div className="stat-row">
                  <span className="stat-label">Peak Spending Year:</span>
                  <span className="stat-value">
                    {countryDetailedStats.yearlyData.find(d => d.spending === countryDetailedStats.maxSpending)?.year} 
                    ({countryDetailedStats.maxSpending.toLocaleString()})
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Lowest Spending Year:</span>
                  <span className="stat-value">
                    {countryDetailedStats.yearlyData.find(d => d.spending === countryDetailedStats.minSpending)?.year}
                    ({countryDetailedStats.minSpending.toLocaleString()})
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Data Coverage:</span>
                  <span className="stat-value">{countryDetailedStats.recordCount} years</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection-stats">
              <div className="no-selection-icon">🗺️</div>
              <h3>Select a Country</h3>
              <p>Click on any country in the map to view comprehensive spending statistics and analysis.</p>
              <div className="selection-tips">
                <h4>Available Analysis:</h4>
                <ul>
                  <li>📊 Total and average spending</li>
                  <li>📈 Growth rate and trends</li>
                  <li>🏷️ Category breakdown</li>
                  <li>📅 Year-over-year comparison</li>
                  <li>⚡ Spending volatility</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Country Comparison Panel Component (keeping for compatibility)
const CountryComparisonPanel = ({ data, selectedCountries }) => {
  const comparisonData = useMemo(() => {
    if (selectedCountries.length === 0) return []

    return selectedCountries.map(country => {
      const countryData = data.filter(d => d.countryName === country)
      if (countryData.length === 0) return null

      const totalSpending = d3.sum(countryData, d => d.totalSpending)
      const avgSpending = d3.mean(countryData, d => d.totalSpending)
      const avgGDPGrowth = d3.mean(countryData.filter(d => d.gdpGrowth), d => d.gdpGrowth)
      const years = countryData.map(d => d.year).sort()

      return {
        country,
        totalSpending,
        avgSpending,
        avgGDPGrowth: avgGDPGrowth || 0,
        yearRange: `${years[0]}-${years[years.length - 1]}`,
        recordCount: countryData.length
      }
    }).filter(Boolean)
  }, [data, selectedCountries])

  if (selectedCountries.length === 0) {
    return (
      <div className="country-comparison-panel">
        <p>Please select countries to compare from the selection panel above.</p>
      </div>
    )
  }

  return (
    <div className="country-comparison-panel">
      <h3>Country Comparison</h3>
      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Country</th>
              <th>Total Spending</th>
              <th>Avg Spending</th>
              <th>Avg GDP Growth</th>
              <th>Year Range</th>
              <th>Records</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map(country => (
              <tr key={country.country}>
                <td>{country.country}</td>
                <td>{country.totalSpending.toLocaleString()}</td>
                <td>{country.avgSpending.toFixed(2)}</td>
                <td>{country.avgGDPGrowth.toFixed(2)}%</td>
                <td>{country.yearRange}</td>
                <td>{country.recordCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Time Series Panel Component
const TimeSeriesPanel = ({ data, selectedCountries, yearRange }) => {
  const timeSeriesData = useMemo(() => {
    if (selectedCountries.length === 0) return []

    return selectedCountries.map(country => {
      const countryData = data
        .filter(d => d.countryName === country)
        .sort((a, b) => a.year - b.year)

      return {
        country,
        data: countryData
      }
    })
  }, [data, selectedCountries])

  if (selectedCountries.length === 0) {
    return (
      <div className="time-series-panel">
        <p>Please select countries to view time series data.</p>
      </div>
    )
  }

  return (
    <div className="time-series-panel">
      <h3>Time Series Analysis</h3>
      {timeSeriesData.map(({ country, data: countryData }) => (
        <div key={country} className="time-series-country">
          <h4>{country}</h4>
          <div className="time-series-chart">
            {countryData.map(d => (
              <div key={d.year} className="time-point">
                <span className="year">{d.year}</span>
                <span className="spending">{d.totalSpending.toLocaleString()}</span>
                {d.gdpGrowth && <span className="gdp">GDP: {d.gdpGrowth.toFixed(2)}%</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Statistics Panel Component
const StatisticsPanel = ({ data, processedData }) => {
  if (!processedData) {
    return (
      <div className="statistics-panel">
        <p>Statistical analysis not available.</p>
      </div>
    )
  }

  return (
    <div className="statistics-panel">
      <h3>Statistical Analysis</h3>
      
      <div className="stats-grid">
        {Object.entries(processedData.statisticalAnalysis).map(([field, stats]) => (
          <div key={field} className="stat-card">
            <h4>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
            <div className="stat-details">
              <p>Mean: {stats.mean}</p>
              <p>Median: {stats.median}</p>
              <p>Std Dev: {stats.standardDeviation}</p>
              <p>Min: {stats.min}</p>
              <p>Max: {stats.max}</p>
              <p>Sample Size: {stats.sampleSize}</p>
            </div>
          </div>
        ))}
      </div>

      {processedData.anomalies.summary.totalAnomalies > 0 && (
        <div className="anomalies-section">
          <h4>Detected Anomalies</h4>
          <div className="anomaly-summary">
            <p>Total Anomalies: {processedData.anomalies.summary.totalAnomalies}</p>
            <p>High Severity: {processedData.anomalies.summary.highSeverity}</p>
            <p>Medium Severity: {processedData.anomalies.summary.mediumSeverity}</p>
            <p>Low Severity: {processedData.anomalies.summary.lowSeverity}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpendingAnalysis