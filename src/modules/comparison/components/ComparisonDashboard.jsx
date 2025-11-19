/**
 * ComparisonDashboard.jsx - Multi-chart dashboard for GDP vs Spending comparison
 * 
 * Features:
 * - 4 visible charts in grid layout
 * - Dropdown to switch between different chart types
 * - Uses existing GdpExpenseDataService for fast loading
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import UnifiedLegend from './UnifiedLegend.jsx'
import TrendLineChart from './TrendLineChart.jsx'
import YearComparisonBarChart from './YearComparisonBarChart.jsx'
import BubbleChart from './BubbleChart.jsx'
import { normalizeComparisonData } from '../utils/normalizeComparisonData.js'
import { loadUnifiedData, INDICATOR_METADATA, CATEGORY_COLORS } from '../../spending/services/UnifiedDataService.js'
import { formatWithBothCurrencies, getCurrencyWithFallback } from '../../spending/utils/currencyMapping.js'
import '../styles/ComparisonDashboard.css'

function ComparisonDashboard({ onLoadingChange }) {
  const [rawData, setRawData] = useState(null) // All loaded data
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState({ stage: '', message: '', percent: 0 })
  const [error, setError] = useState(null)
  const [visibility, setVisibility] = useState({ gdp: true, spending: true })
  const [highlightYear, setHighlightYear] = useState(null)
  const [dataYearRange, setDataYearRange] = useState([2005, 2022]) // Actual data loaded range
  const [displayYearRange, setDisplayYearRange] = useState([2005, 2022]) // Display filter for animation
  const [selectedYear, setSelectedYear] = useState(null) // Will be set from metadata
  const [selectedCountry, setSelectedCountry] = useState('World') // Default to World (all countries)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationInterval, setAnimationInterval] = useState(null)
  const [spendingData, setSpendingData] = useState(null) // Unified spending data for categories
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false) // Track if categories panel is visible
  
  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading)
    }
  }, [loading, onLoadingChange])
  
  // Load spending data for category analysis
  useEffect(() => {
    async function loadSpendingData() {
      try {
        const data = await loadUnifiedData()
        setSpendingData(data)
      } catch (error) {
        console.error('Failed to load spending data:', error)
      }
    }
    loadSpendingData()
  }, [])
  
  // Force reload to pick up normalization fix
  
  // Load data once - only reload when country changes, not when display year range changes
  useEffect(() => {
    let isCancelled = false
    
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        console.log('🔄 Loading comparison data...')
        
        // Progress callback
        const onProgress = (progress) => {
          if (!isCancelled) {
            setLoadingProgress(progress)
          }
        }
        
        // Load ALL data for the full range (2005-2022) - we'll filter client-side
        const selectedCountries = selectedCountry === 'World' ? [] : [selectedCountry]
        const result = await normalizeComparisonData(selectedCountries, dataYearRange, onProgress)
        
        if (isCancelled) return
        
        console.log('✅ Data loaded successfully:', {
          dataPoints: result.data.length,
          countries: result.metadata.countries.length,
          yearRange: result.metadata.yearRange
        })
        
        setRawData(result.data)
        setMetadata(result.metadata)
        
        // Set selectedYear to the max year from metadata if not already set
        if (selectedYear === null && result.metadata.yearRange) {
          setSelectedYear(result.metadata.yearRange[1])
        }
        
        setError(null)
      } catch (err) {
        if (isCancelled) return
        console.error('❌ Error loading comparison data:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      isCancelled = true
    }
  }, [selectedCountry]) // Only reload when country changes, NOT when year range changes
  
  const handleLegendToggle = useCallback((newVisibility) => {
    setVisibility(newVisibility)
  }, [])
  
  const handleHover = useCallback((year) => {
    setHighlightYear(year)
  }, [])
  
  const handleYearChange = useCallback((year) => {
    setSelectedYear(year)
  }, [])
  
  // Animation controls - incrementally updates display year range from 2005-2006, 2005-2007, etc.
  const startAnimation = useCallback(() => {
    if (isAnimating) return
    
    // Determine max year based on available data for selected country
    let maxYear = 2022 // Default max
    if (rawData && rawData.length > 0) {
      if (selectedCountry === 'World') {
        // For World, use all available data
        const years = rawData.map(d => d.year)
        maxYear = Math.max(...years)
      } else {
        // For specific country, use that country's data range
        const countryData = rawData.filter(d => d.country === selectedCountry)
        if (countryData.length > 0) {
          const years = countryData.map(d => d.year)
          maxYear = Math.max(...years)
        }
      }
    }
    
    setIsAnimating(true)
    let currentEndYear = 2006 // Start with 2005-2006
    setDisplayYearRange([2005, currentEndYear])
    setSelectedYear(currentEndYear)
    
    const interval = setInterval(() => {
      currentEndYear++
      if (currentEndYear > maxYear) {
        // Stop animation when reaching max year with data
        clearInterval(interval)
        setAnimationInterval(null)
        setIsAnimating(false)
        return
      }
      setDisplayYearRange([2005, currentEndYear])
      setSelectedYear(currentEndYear)
    }, 1000) // Change year every 1 second for smooth visualization
    
    setAnimationInterval(interval)
  }, [isAnimating, rawData, selectedCountry])
  
  const stopAnimation = useCallback(() => {
    if (animationInterval) {
      clearInterval(animationInterval)
      setAnimationInterval(null)
    }
    setIsAnimating(false)
  }, [animationInterval])
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval)
      }
    }
  }, [animationInterval])
  
  // Auto-adjust year range based on available data for selected country
  useEffect(() => {
    if (!rawData || rawData.length === 0 || selectedCountry === 'World') return
    
    // Get data for selected country
    const countryData = rawData.filter(d => d.country === selectedCountry)
    
    if (countryData.length === 0) {
      // No data for this country, show message
      console.warn(`No data available for ${selectedCountry}`)
      return
    }
    
    // Find actual year range with data
    const years = countryData.map(d => d.year).sort((a, b) => a - b)
    const minYear = years[0]
    const maxYear = years[years.length - 1]
    
    // Auto-adjust display year range if current range has no data
    const currentData = countryData.filter(d => 
      d.year >= displayYearRange[0] && d.year <= displayYearRange[1]
    )
    
    if (currentData.length === 0) {
      // No data in current range, adjust to available range
      console.log(`Auto-adjusting year range for ${selectedCountry}: ${minYear}-${maxYear}`)
      setDisplayYearRange([minYear, maxYear])
      setSelectedYear(maxYear)
    } else if (displayYearRange[1] > maxYear) {
      // Current max year exceeds available data, adjust
      console.log(`Adjusting max year for ${selectedCountry} from ${displayYearRange[1]} to ${maxYear}`)
      setDisplayYearRange([displayYearRange[0], maxYear])
      if (selectedYear > maxYear) {
        setSelectedYear(maxYear)
      }
    }
  }, [selectedCountry, rawData])
  
  // Ensure selectedYear stays within displayYearRange when user manually changes range
  useEffect(() => {
    if (selectedYear !== null) {
      if (selectedYear < displayYearRange[0]) {
        setSelectedYear(displayYearRange[0])
      } else if (selectedYear > displayYearRange[1]) {
        setSelectedYear(displayYearRange[1])
      }
    }
  }, [displayYearRange, selectedYear])
  
  // Memoize chart data and filter by display year range (for animation)
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    
    // Filter data based on displayYearRange for smooth animation without reloading
    return rawData.filter(d => d.year >= displayYearRange[0] && d.year <= displayYearRange[1])
  }, [rawData, displayYearRange])
  
  // Get unique countries for dropdown
  const availableCountries = useMemo(() => {
    if (!metadata || !metadata.countries) return []
    return ['World', ...metadata.countries.sort()]
  }, [metadata])
  
  // Calculate available year range for selected country
  const countryYearRange = useMemo(() => {
    if (!rawData || rawData.length === 0 || selectedCountry === 'World') {
      return null
    }
    
    const countryData = rawData.filter(d => d.country === selectedCountry)
    if (countryData.length === 0) return null
    
    const years = countryData.map(d => d.year).sort((a, b) => a - b)
    return {
      min: years[0],
      max: years[years.length - 1],
      count: years.length
    }
  }, [rawData, selectedCountry])
  
  // Calculate average spending/GDP ratio
  const avgRatio = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0
    const ratios = chartData.map(d => d.ratio).filter(r => !isNaN(r) && r > 0)
    if (ratios.length === 0) return 0
    const sum = ratios.reduce((acc, val) => acc + val, 0)
    return (sum / ratios.length).toFixed(1)
  }, [chartData])
  
  // Calculate GDP growth for selected year (year-over-year)
  const gdpGrowth = useMemo(() => {
    if (!chartData || chartData.length === 0 || !selectedYear) return { value: 0, isPositive: true }
    
    const currentYearData = chartData.filter(d => d.year === selectedYear)
    const previousYearData = chartData.filter(d => d.year === selectedYear - 1)
    
    if (currentYearData.length === 0 || previousYearData.length === 0) return { value: 0, isPositive: true }
    
    const currentGDP = currentYearData.reduce((sum, d) => sum + d.gdp, 0) / currentYearData.length
    const previousGDP = previousYearData.reduce((sum, d) => sum + d.gdp, 0) / previousYearData.length
    
    const growth = ((currentGDP - previousGDP) / previousGDP) * 100
    return { value: Math.abs(growth).toFixed(1), isPositive: growth >= 0 }
  }, [chartData, selectedYear])
  
  // Calculate data coverage for selected year
  const dataCoverage = useMemo(() => {
    if (!chartData || chartData.length === 0 || !selectedYear || !metadata) return 0
    
    const yearData = chartData.filter(d => d.year === selectedYear)
    const totalCountries = metadata.countries.length
    
    if (totalCountries === 0) return 0
    
    const countriesWithData = new Set(yearData.map(d => d.country)).size
    return ((countriesWithData / totalCountries) * 100).toFixed(0)
  }, [chartData, selectedYear, metadata])
  
  // Calculate top 5 spending categories for selected country or world (average)
  const topSpendingCategories = useMemo(() => {
    if (!spendingData || !selectedCountry || !displayYearRange) {
      return []
    }
    
    // Aggregate spending by category over the selected year range
    const categoryData = {}
    
    // Determine which countries to aggregate
    const countriesToAggregate = selectedCountry === 'World' 
      ? Object.keys(spendingData.countries)
      : [selectedCountry]
    
    countriesToAggregate.forEach(countryName => {
      const countryData = spendingData.countries[countryName]
      if (!countryData) return
      
      Object.entries(INDICATOR_METADATA).forEach(([indicatorCode, metadata]) => {
        const category = metadata.category
        const indicatorData = countryData.indicators[indicatorCode]
        
        if (!indicatorData) return
        
        // Initialize category if not exists
        if (!categoryData[category]) {
          categoryData[category] = {
            usdTotal: 0,
            usdCount: 0,
            subcategories: {}
          }
        }
        
        // Sum values across the year range for averaging
        Object.entries(indicatorData).forEach(([year, valueObj]) => {
          const yearNum = parseInt(year)
          if (yearNum >= displayYearRange[0] && yearNum <= displayYearRange[1]) {
            // Handle both old format (number) and new format (object with local/usd)
            const usdValue = typeof valueObj === 'object' ? valueObj.usd : valueObj
            
            if (usdValue && !isNaN(usdValue) && usdValue > 0) {
              // Initialize subcategory if not exists
              if (!categoryData[category].subcategories[indicatorCode]) {
                categoryData[category].subcategories[indicatorCode] = {
                  code: indicatorCode,
                  name: metadata.name,
                  usdTotal: 0,
                  usdCount: 0
                }
              }
              
              categoryData[category].subcategories[indicatorCode].usdTotal += usdValue
              categoryData[category].subcategories[indicatorCode].usdCount++
              categoryData[category].usdTotal += usdValue
              categoryData[category].usdCount++
            }
          }
        })
      })
    })
    
    // Convert to array, calculate averages, and sort by USD average
    const categories = Object.entries(categoryData)
      .map(([category, data]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        categoryKey: category,
        usdAverage: data.usdCount > 0 ? data.usdTotal / data.usdCount : 0,
        color: CATEGORY_COLORS[category] || '#9ca3af',
        // Sort subcategories by USD average
        subcategories: Object.values(data.subcategories)
          .map(sub => ({
            ...sub,
            usdAverage: sub.usdCount > 0 ? sub.usdTotal / sub.usdCount : 0
          }))
          .sort((a, b) => b.usdAverage - a.usdAverage)
      }))
      .filter(cat => cat.usdAverage > 0) // Only include categories with data
      .sort((a, b) => b.usdAverage - a.usdAverage)
      .slice(0, 5)
    
    return categories
  }, [spendingData, selectedCountry, displayYearRange])
  
  if (loading) {
    return (
      <div className="comparison-dashboard-loading">
        <div className="loading-spinner"></div>
        <p className="loading-message">{loadingProgress.message || 'Loading comparison data...'}</p>
        {loadingProgress.percent > 0 && (
          <div className="loading-progress-bar">
            <div 
              className="loading-progress-fill" 
              style={{ width: `${loadingProgress.percent}%` }}
            ></div>
          </div>
        )}
        <p className="loading-hint">💡 Tip: Adjust year range to load data faster</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="comparison-dashboard-error">
        <div className="error-icon">⚠️</div>
        <p>Error loading data: {error}</p>
      </div>
    )
  }
  
  return (
    <div className="comparison-dashboard">
      {/* Compact Filter Bar with Data Series */}
      <div className="filter-bar">
        <div className="filter-bar-left">
          <div className="filter-item">
            <label>Year:</label>
            <input 
              type="number" 
              min="2005" 
              max="2022" 
              value={displayYearRange[0]}
              onChange={(e) => setDisplayYearRange([parseInt(e.target.value), displayYearRange[1]])}
              className="filter-input"
              disabled={isAnimating}
              style={{ opacity: isAnimating ? 0.6 : 1 }}
            />
            <span>-</span>
            <input 
              type="number" 
              min="2005" 
              max="2022" 
              value={displayYearRange[1]}
              onChange={(e) => setDisplayYearRange([displayYearRange[0], parseInt(e.target.value)])}
              className="filter-input"
              disabled={isAnimating}
              style={{ opacity: isAnimating ? 0.6 : 1 }}
            />
          </div>
          
          <div className="filter-item">
            <label>Country:</label>
            <select 
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="filter-select"
            >
              {availableCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {countryYearRange && (
              <div className="data-availability-hint" style={{
                fontSize: '10px',
                color: '#666',
                marginTop: '2px'
              }}>
                Data: {countryYearRange.min}-{countryYearRange.max} ({countryYearRange.count} years)
              </div>
            )}
          </div>
          
          <div className="filter-item">
            <button 
              onClick={isAnimating ? stopAnimation : startAnimation}
              className="animation-button"
              title={isAnimating ? "Stop year-by-year animation" : "Animate data from 2005 onwards, year by year"}
            >
              {isAnimating ? '⏸️ Stop Animation' : '▶️ Play Timeline'}
            </button>
          </div>
          
          <div className="filter-divider"></div>
          
          <UnifiedLegend 
            onToggle={handleLegendToggle}
            initialState={visibility}
          />
          
          <div className="filter-divider"></div>
          
          <button 
            className={`categories-tab-button ${showCategoriesPanel ? 'active' : ''}`}
            onClick={() => setShowCategoriesPanel(!showCategoriesPanel)}
            title="Show/Hide Spending Categories"
          >
            Spending Categories
          </button>
        </div>
      </div>
      
      {/* Main Content Area with optional Categories Panel */}
      <div className={`dashboard-content ${showCategoriesPanel ? 'with-categories' : ''}`}>
        {/* 4-Grid Layout: 3 Charts + 1 Analytics Cards */}
        <div className="dashboard-grid">
        {/* Line Chart */}
        <div className="grid-item">
          <TrendLineChart 
            data={chartData}
            visibility={visibility}
            onHover={handleHover}
            highlightYear={highlightYear}
          />
          <div className="chart-description">GDP vs Spending trends over time</div>
        </div>
        
        {/* Bar Chart */}
        <div className="grid-item">
          <YearComparisonBarChart 
            data={chartData}
            visibility={visibility}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />
          <div className="chart-description">
            {selectedCountry === 'World' ? 'Top 15 countries (sortable by GDP or Spending)' : `${selectedCountry} - Year-over-year comparison`}
          </div>
        </div>
        
        {/* Bubble Chart */}
        <div className="grid-item">
          <BubbleChart 
            data={chartData}
            visibility={visibility}
            selectedYear={selectedYear}
          />
          <div className="chart-description">GDP vs Spending correlation</div>
        </div>
        
        {/* Analytics Cards */}
        <div className="grid-item analytics-section">
          {metadata && (
            <>
              <div className="metric-card">
                <div className="metric-label">Countries</div>
                <div className="metric-value">{metadata.countries.length}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Avg Ratio</div>
                <div className="metric-value">{avgRatio}%</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Year Range</div>
                <div className="metric-value">{displayYearRange[0]}-{displayYearRange[1]}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Viewing Year</div>
                <div className="metric-value">{selectedYear}</div>
              </div>
              
              <div className="metric-card highlight">
                <div className="metric-label">GDP Growth</div>
                <div className={`metric-value ${gdpGrowth.isPositive ? 'trend-positive' : 'trend-negative'}`}>
                  {gdpGrowth.isPositive ? '+' : '-'}{gdpGrowth.value}%
                </div>
              </div>
              
              <div className="metric-card highlight-alt">
                <div className="metric-label">Coverage</div>
                <div className="metric-value">{dataCoverage}%</div>
              </div>
            </>
          )}
        </div>
      </div>
        
        {/* Spending Categories Panel - Right Sidebar */}
        {showCategoriesPanel && topSpendingCategories.length > 0 && (
          <div className="spending-categories-panel">
          
          <div className="spending-categories-content">
            <div className="spending-categories-header">
              <div className="spending-disclaimer">Correlation with growth is assumed based on total spending</div>
            </div>
            
            <div className="spending-categories-grid">
              {topSpendingCategories.map((cat, index) => {
                // Format USD average value
                const formatUSD = (value) => {
                  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
                  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
                  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
                  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
                  return `$${value.toFixed(2)}`
                }
                
                return (
                  <div key={cat.categoryKey} className="category-card">
                    <div className="category-header">
                      <div className="category-title">
                        <span className="category-rank">{index + 1}.</span>
                        <span className="category-dot" style={{ backgroundColor: cat.color }}></span>
                        <span className="category-name">{cat.name}</span>
                      </div>
                      <div className="category-total">
                        {formatUSD(cat.usdAverage)} <span style={{ fontSize: '10px', color: '#999' }}>(Avg)</span>
                      </div>
                    </div>
                    
                    <div className="subcategories-list">
                      {cat.subcategories.map(sub => {
                        return (
                          <div key={sub.code} className="subcategory-item">
                            <span className="subcategory-name">{sub.name}</span>
                            <span className="subcategory-value">
                              {formatUSD(sub.usdAverage)} <span style={{ fontSize: '9px', color: '#999' }}>(Avg)</span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default ComparisonDashboard
