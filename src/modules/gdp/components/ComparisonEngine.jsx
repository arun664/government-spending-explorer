import React, { useState, useEffect, useMemo } from 'react'
import { loadAllData, getUniqueCountries, getUniqueYears, filterData } from '../utils/dataLoader.js'
import { getCountryRegion, groupCountriesByRegion } from '../utils/regionMapping.js'
import SearchBar from './SearchBar.jsx'
import WorldMap from './WorldMap.jsx'
import CountryStatistics from './CountryStatistics.jsx'
import '../styles/ComparisonEngine.css'

/**
 * Enhanced ComparisonEngine Component
 * 
 * Integrates WorldMap component with search functionality, country selection with year range filtering,
 * sector-wise progress analysis, and GDP/expense metrics display.
 * 
 * Requirements addressed:
 * - 2.1: Display countries in alphabetical order with their respective regions
 * - 2.2: Show comparison statistics for all countries without requiring page scrolling
 * - 2.3: Provide comparison views for total spending, per capita spending, and GDP percentage
 * - 7.1: Real-time search functionality for country names and codes
 * - 7.2: Automatic zoom to country's region on search
 * - 7.3: Display all comparison statistics for searched country on same page
 */
const ComparisonEngine = () => {
  const [data, setData] = useState({ gdp: [], expenses: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [yearRange, setYearRange] = useState([2010, 2020])
  const [availableYears, setAvailableYears] = useState([])
  const [countries, setCountries] = useState([])
  const [viewMode, setViewMode] = useState('integrated') // 'integrated', 'grid', 'list'
  const [sortBy, setSortBy] = useState('alphabetical') // 'alphabetical' or 'region'
  const [selectedMetric, setSelectedMetric] = useState('gdpGrowth') // 'gdpGrowth', 'totalSpending', 'perCapita'
  const [regionFilter, setRegionFilter] = useState('all')
  const [showSectorAnalysis, setShowSectorAnalysis] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const loadedData = await loadAllData()
      setData(loadedData)
      
      // Set up available years
      const years = getUniqueYears([...(loadedData.gdp || []), ...(loadedData.expenses || [])])
      setAvailableYears(years)
      if (years.length > 0) {
        setYearRange([Math.max(years[0], 2010), Math.min(years[years.length - 1], 2020)])
      }
      
      // Create unique countries list with regions
      const uniqueCountryNames = getUniqueCountries(loadedData.gdp || [])
      const countriesWithRegions = uniqueCountryNames.map(countryName => {
        const countryRecord = (loadedData.gdp || []).find(d => d.countryName === countryName)
        const countryCode = countryRecord?.countryCode || ''
        const region = getCountryRegion(countryCode)
        
        return {
          countryName,
          countryCode,
          region
        }
      }).filter(country => country.countryCode)
      
      setCountries(countriesWithRegions)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle country selection from search
  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
  }

  // Handle country selection from map
  const handleMapCountryClick = (country) => {
    const completeCountry = countries.find(c => 
      c.countryCode === country.countryCode || 
      c.countryName === country.countryName
    )
    
    if (completeCountry) {
      setSelectedCountry(completeCountry)
    } else {
      setSelectedCountry(country)
    }
  }

  // Process and prepare comparison data with year filtering
  const comparisonData = useMemo(() => {
    if (!data.gdp || !Array.isArray(data.gdp) || !data.gdp.length) return []

    // Filter data by year range
    const filteredGdpData = filterData(data.gdp, null, yearRange[0], yearRange[1])
    const filteredExpenseData = filterData(data.expenses || [], null, yearRange[0], yearRange[1])

    // Get latest year data for each country within the range
    const latestYearData = {}
    filteredGdpData.forEach(record => {
      const key = record.countryCode
      if (!latestYearData[key] || record.year > latestYearData[key].year) {
        latestYearData[key] = record
      }
    })

    // Calculate expense totals by country
    const expenseByCountry = {}
    filteredExpenseData.forEach(record => {
      const key = record.countryName
      if (!expenseByCountry[key]) {
        expenseByCountry[key] = { total: 0, categories: {} }
      }
      expenseByCountry[key].total += record.value || 0
      
      const category = record.expenseCategory || 'Other'
      if (!expenseByCountry[key].categories[category]) {
        expenseByCountry[key].categories[category] = 0
      }
      expenseByCountry[key].categories[category] += record.value || 0
    })

    // Convert to array and add region information
    const countries = Object.values(latestYearData).map(country => {
      const expenseData = expenseByCountry[country.countryName] || { total: 0, categories: {} }
      const totalSpending = expenseData.total
      const perCapitaSpending = totalSpending / 1000000 // Simplified calculation
      const gdpPercentage = totalSpending > 0 ? (totalSpending / 1000000000) * 100 : 0
      
      return {
        ...country,
        region: getCountryRegion(country.countryCode),
        totalSpending,
        perCapitaSpending,
        gdpPercentage,
        expenseCategories: expenseData.categories
      }
    })

    // Filter by region if selected
    let filteredCountries = regionFilter === 'all' 
      ? countries 
      : countries.filter(country => country.region === regionFilter)

    // Sort countries
    if (sortBy === 'alphabetical') {
      filteredCountries.sort((a, b) => a.countryName.localeCompare(b.countryName))
    } else if (sortBy === 'region') {
      filteredCountries.sort((a, b) => {
        const regionCompare = a.region.localeCompare(b.region)
        return regionCompare !== 0 ? regionCompare : a.countryName.localeCompare(b.countryName)
      })
    }

    return filteredCountries
  }, [data.gdp, data.expenses, sortBy, regionFilter, yearRange])

  // Calculate sector-wise progress analysis for selected country
  const sectorAnalysis = useMemo(() => {
    if (!selectedCountry || !data.expenses || !Array.isArray(data.expenses) || !data.expenses.length) return null

    const countryExpenses = data.expenses.filter(d => d.countryName === selectedCountry.countryName)
    if (countryExpenses.length === 0) return null

    // Group by category and calculate trends
    const categoryTrends = {}
    countryExpenses.forEach(record => {
      const category = record.expenseCategory || 'Other'
      if (!categoryTrends[category]) {
        categoryTrends[category] = []
      }
      categoryTrends[category].push({
        year: record.year,
        value: record.value || 0
      })
    })

    // Calculate growth/decline for each category
    const analysis = Object.entries(categoryTrends).map(([category, data]) => {
      const sortedData = data.sort((a, b) => a.year - b.year)
      const firstValue = sortedData[0]?.value || 0
      const lastValue = sortedData[sortedData.length - 1]?.value || 0
      const growthRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0
      
      return {
        category,
        firstYear: sortedData[0]?.year,
        lastYear: sortedData[sortedData.length - 1]?.year,
        firstValue,
        lastValue,
        growthRate,
        trend: growthRate > 5 ? 'growth' : growthRate < -5 ? 'decline' : 'stable',
        dataPoints: sortedData.length
      }
    })

    return analysis.sort((a, b) => Math.abs(b.growthRate) - Math.abs(a.growthRate))
  }, [selectedCountry, data.expenses])

  // Get unique regions for filter dropdown
  const availableRegions = useMemo(() => {
    const regions = new Set()
    comparisonData.forEach(country => regions.add(country.region))
    return Array.from(regions).sort()
  }, [comparisonData])

  // Calculate statistics for the selected metric
  const metricStats = useMemo(() => {
    if (!comparisonData.length) return null

    const values = comparisonData.map(country => {
      switch (selectedMetric) {
        case 'gdpGrowth': return country.gdpGrowth
        case 'totalSpending': return country.totalSpending
        case 'perCapita': return country.perCapitaSpending
        case 'gdpPercentage': return country.gdpPercentage
        default: return country.gdpGrowth
      }
    }).filter(val => !isNaN(val))

    if (!values.length) return null

    const sorted = [...values].sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length

    return { min, max, avg, count: values.length }
  }, [comparisonData, selectedMetric])

  const formatValue = (value, metric) => {
    if (isNaN(value)) return 'N/A'
    
    switch (metric) {
      case 'gdpGrowth':
        return `${value.toFixed(2)}%`
      case 'totalSpending':
        return `$${(value / 1000000000).toFixed(2)}B`
      case 'perCapita':
        return `$${value.toLocaleString()}`
      case 'gdpPercentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toFixed(2)
    }
  }

  const getMetricValue = (country, metric) => {
    switch (metric) {
      case 'gdpGrowth': return country.gdpGrowth
      case 'totalSpending': return country.totalSpending
      case 'perCapita': return country.perCapitaSpending
      case 'gdpPercentage': return country.gdpPercentage
      default: return country.gdpGrowth
    }
  }

  const getMetricLabel = (metric) => {
    switch (metric) {
      case 'gdpGrowth': return 'GDP Growth'
      case 'totalSpending': return 'Total Spending'
      case 'perCapita': return 'Per Capita Spending'
      case 'gdpPercentage': return 'Spending % of GDP'
      default: return 'GDP Growth'
    }
  }

  if (loading) {
    return (
      <div className="comparison-engine">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="comparison-engine">
        <div className="error-container">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={loadData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="comparison-engine">
      <div className="comparison-header">
        <div className="header-section">
          <div className="header-left">
            <h2>🌍 Integrated Country Comparison & Analysis</h2>
            <p>Search countries, explore the interactive map, and analyze government spending patterns with GDP metrics</p>
          </div>
        </div>

        <div className="search-section">
          <SearchBar
            countries={countries}
            onCountrySelect={handleCountrySelect}
            placeholder="Search countries by name or code..."
            className="main-search-bar"
          />
          
          {selectedCountry && (
            <div className="selected-country-info">
              <span className="selected-label">Selected:</span>
              <span className="selected-country">
                {selectedCountry.countryName} ({selectedCountry.countryCode})
              </span>
              <span className="selected-region">{selectedCountry.region}</span>
              <button 
                onClick={() => setSelectedCountry(null)}
                className="clear-selection-button"
                title="Clear selection"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="controls-section">
          <div className="control-group">
            <label htmlFor="year-range">Year Range:</label>
            <div className="year-range-inputs">
              <input
                type="number"
                min={availableYears[0] || 2000}
                max={availableYears[availableYears.length - 1] || 2023}
                value={yearRange[0]}
                onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                className="year-input"
              />
              <span>to</span>
              <input
                type="number"
                min={availableYears[0] || 2000}
                max={availableYears[availableYears.length - 1] || 2023}
                value={yearRange[1]}
                onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
                className="year-input"
              />
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="view-mode">View:</label>
            <select 
              id="view-mode"
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
              className="control-select"
            >
              <option value="integrated">Integrated View</option>
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="metric-select">Metric:</label>
            <select 
              id="metric-select"
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="control-select"
            >
              <option value="gdpGrowth">GDP Growth</option>
              <option value="totalSpending">Total Spending</option>
              <option value="perCapita">Per Capita Spending</option>
              <option value="gdpPercentage">Spending % of GDP</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="sort-select">Sort by:</label>
            <select 
              id="sort-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="region">Region</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="region-filter">Region:</label>
            <select 
              id="region-filter"
              value={regionFilter} 
              onChange={(e) => setRegionFilter(e.target.value)}
              className="control-select"
            >
              <option value="all">All Regions</option>
              {availableRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {selectedCountry && (
            <div className="control-group">
              <button
                onClick={() => setShowSectorAnalysis(!showSectorAnalysis)}
                className={`sector-analysis-toggle ${showSectorAnalysis ? 'active' : ''}`}
              >
                📊 Sector Analysis
              </button>
            </div>
          )}
        </div>
      </div>

      {metricStats && (
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Countries:</span>
            <span className="stat-value">{metricStats.count}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average {getMetricLabel(selectedMetric)}:</span>
            <span className="stat-value">{formatValue(metricStats.avg, selectedMetric)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Minimum:</span>
            <span className="stat-value">{formatValue(metricStats.min, selectedMetric)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Maximum:</span>
            <span className="stat-value">{formatValue(metricStats.max, selectedMetric)}</span>
          </div>
        </div>
      )}

      {viewMode === 'integrated' ? (
        <div className="integrated-view">
          <div className="map-section">
            <WorldMap
              selectedCountry={selectedCountry}
              onCountryClick={handleMapCountryClick}
              width={800}
              height={500}
              className="interactive-map"
            />
          </div>

          {selectedCountry && (
            <div className="selected-country-analysis">
              <div className="country-statistics-section">
                <CountryStatistics
                  selectedCountry={selectedCountry}
                  gdpData={data.gdp || []}
                  expenseData={data.expenses || []}
                  className="detailed-stats"
                />
              </div>

              {showSectorAnalysis && sectorAnalysis && (
                <div className="sector-analysis-section">
                  <h3>📈 Sector-wise Progress Analysis ({yearRange[0]} - {yearRange[1]})</h3>
                  <div className="sector-trends">
                    {sectorAnalysis.map((sector, index) => (
                      <div key={sector.category} className={`sector-card ${sector.trend}`}>
                        <div className="sector-header">
                          <h4>{sector.category}</h4>
                          <div className={`trend-indicator ${sector.trend}`}>
                            {sector.trend === 'growth' ? '📈' : sector.trend === 'decline' ? '📉' : '➡️'}
                            {sector.growthRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="sector-details">
                          <div className="sector-values">
                            <span className="value-item">
                              <strong>{sector.firstYear}:</strong> ${(sector.firstValue / 1000000).toFixed(1)}M
                            </span>
                            <span className="value-item">
                              <strong>{sector.lastYear}:</strong> ${(sector.lastValue / 1000000).toFixed(1)}M
                            </span>
                          </div>
                          <div className="sector-meta">
                            <span className="data-points">{sector.dataPoints} data points</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!selectedCountry && (
            <div className="no-selection-message">
              <div className="message-content">
                <h3>🔍 Select a Country to Begin Analysis</h3>
                <p>Use the search bar above or click on a country in the map to view detailed statistics and sector analysis.</p>
                <div className="quick-stats">
                  <div className="stat-item">
                    <span className="stat-value">{countries.length}</span>
                    <span className="stat-label">Countries Available</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{availableYears.length}</span>
                    <span className="stat-label">Years of Data</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{(data.expenses || []).length}</span>
                    <span className="stat-label">Expense Records</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`comparison-content ${viewMode}`}>
          {comparisonData.map((country, index) => (
            <div 
              key={country.countryCode} 
              className="country-card"
              onClick={() => handleCountrySelect(country)}
            >
              <div className="country-header">
                <div className="country-info">
                  <h3 className="country-name">{country.countryName}</h3>
                  <span className="country-code">({country.countryCode})</span>
                </div>
                <div className="region-badge">
                  {country.region}
                </div>
              </div>
              
              <div className="country-metrics">
                <div className="primary-metric">
                  <span className="metric-label">{getMetricLabel(selectedMetric)}</span>
                  <span className="metric-value">
                    {formatValue(getMetricValue(country, selectedMetric), selectedMetric)}
                  </span>
                </div>
                
                <div className="secondary-metrics">
                  {selectedMetric !== 'gdpGrowth' && (
                    <div className="metric-item">
                      <span>GDP Growth: {formatValue(country.gdpGrowth, 'gdpGrowth')}</span>
                    </div>
                  )}
                  {selectedMetric !== 'totalSpending' && (
                    <div className="metric-item">
                      <span>Total Spending: {formatValue(country.totalSpending, 'totalSpending')}</span>
                    </div>
                  )}
                  {selectedMetric !== 'perCapita' && (
                    <div className="metric-item">
                      <span>Per Capita: {formatValue(country.perCapitaSpending, 'perCapita')}</span>
                    </div>
                  )}
                  {selectedMetric !== 'gdpPercentage' && (
                    <div className="metric-item">
                      <span>% of GDP: {formatValue(country.gdpPercentage, 'gdpPercentage')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="country-rank">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode !== 'integrated' && comparisonData.length === 0 && (
        <div className="no-data-message">
          <p>No countries found matching the current filters.</p>
        </div>
      )}
    </div>
  )
}

export default ComparisonEngine