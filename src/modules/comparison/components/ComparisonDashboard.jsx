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

// Category descriptions for info modals
const CATEGORY_DESCRIPTIONS = {
  overview: 'Total government expenditure across all categories, representing the complete fiscal spending of the government.',
  personnel: 'Compensation paid to government employees including salaries, wages, and employer social contributions.',
  transfers: 'Financial assistance provided to other entities including grants to foreign governments, international organizations, and subsidies to enterprises.',
  debt: 'Interest payments on government debt and consumption of fixed capital (depreciation of government assets).',
  operations: 'Expenditure on goods and services used in government operations, excluding compensation of employees.',
  other: 'Miscellaneous government expenses including property expenses and other transfers not classified elsewhere.',
  social: 'Government spending on social protection including cash benefits, in-kind benefits, social assistance, and social security programs.'
}

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
  const [showMissingCountries, setShowMissingCountries] = useState(false)
  const [dataDiscrepancyTab, setDataDiscrepancyTab] = useState('all') // 'all', 'gdp', 'spending'
  const [categoryInfoModal, setCategoryInfoModal] = useState(null) // Category key for info modal
  
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
  
  // Calculate countries with and without data (separate GDP and Spending)
  const countriesDataInfo = useMemo(() => {
    if (!metadata || !chartData || chartData.length === 0) {
      return { 
        withData: 0, 
        withoutData: 0, 
        missingGDP: [], 
        missingSpending: [], 
        missingBoth: [],
        total: 214 
      }
    }
    
    // Track countries with GDP and Spending separately, with year ranges
    const countryGDPYears = {}
    const countrySpendingYears = {}
    
    chartData.forEach(d => {
      if (d.gdp && d.gdp > 0) {
        if (!countryGDPYears[d.country]) countryGDPYears[d.country] = []
        countryGDPYears[d.country].push(d.year)
      }
      if (d.spending && d.spending > 0) {
        if (!countrySpendingYears[d.country]) countrySpendingYears[d.country] = []
        countrySpendingYears[d.country].push(d.year)
      }
    })
    
    // Get countries with COMPLETE data in the selected year range
    const countriesWithCompleteGDP = new Set()
    const countriesWithCompleteSpending = new Set()
    const countriesWithPartialGDP = new Set()
    const countriesWithPartialSpending = new Set()
    
    Object.entries(countryGDPYears).forEach(([country, years]) => {
      const yearsInRange = years.filter(y => y >= displayYearRange[0] && y <= displayYearRange[1])
      if (yearsInRange.length > 0) {
        const maxYear = Math.max(...years)
        // Check if data extends to at least 2019 (recent data threshold)
        if (maxYear >= 2019) {
          countriesWithCompleteGDP.add(country)
        } else {
          countriesWithPartialGDP.add(country)
        }
      }
    })
    
    Object.entries(countrySpendingYears).forEach(([country, years]) => {
      const yearsInRange = years.filter(y => y >= displayYearRange[0] && y <= displayYearRange[1])
      if (yearsInRange.length > 0) {
        const maxYear = Math.max(...years)
        // Check if data extends to at least 2019 (recent data threshold)
        if (maxYear >= 2019) {
          countriesWithCompleteSpending.add(country)
        } else {
          countriesWithPartialSpending.add(country)
        }
      }
    })
    
    // Countries with both complete GDP and Spending
    const countriesWithBoth = new Set(
      [...countriesWithCompleteGDP].filter(c => countriesWithCompleteSpending.has(c))
    )
    
    // Find countries without complete data and calculate their year ranges
    const allCountries = metadata.countries || []
    const missingGDP = []
    const missingSpending = []
    const missingBoth = []
    
    allCountries.forEach(country => {
      const hasCompleteGDP = countriesWithCompleteGDP.has(country)
      const hasCompleteSpending = countriesWithCompleteSpending.has(country)
      const hasPartialGDP = countriesWithPartialGDP.has(country)
      const hasPartialSpending = countriesWithPartialSpending.has(country)
      const hasAnyGDP = hasCompleteGDP || hasPartialGDP
      const hasAnySpending = hasCompleteSpending || hasPartialSpending
      
      // Calculate year range for this country
      const gdpYears = countryGDPYears[country] || []
      const spendingYears = countrySpendingYears[country] || []
      const allYears = [...new Set([...gdpYears, ...spendingYears])].sort((a, b) => a - b)
      
      const yearRange = allYears.length > 0 
        ? `${Math.min(...allYears)}-${Math.max(...allYears)}`
        : 'No data'
      
      // Flag countries with no data OR incomplete/outdated data
      if (!hasAnyGDP && !hasAnySpending) {
        missingBoth.push({ name: country, yearRange })
      } else if (!hasCompleteGDP) {
        // Missing or incomplete GDP data
        const spendingRange = spendingYears.length > 0
          ? `${Math.min(...spendingYears)}-${Math.max(...spendingYears)}`
          : 'No data'
        const gdpStatus = hasPartialGDP 
          ? `Outdated (${Math.min(...gdpYears)}-${Math.max(...gdpYears)})`
          : 'No data'
        missingGDP.push({ name: country, yearRange: spendingRange, gdpStatus })
      } else if (!hasCompleteSpending) {
        // Missing or incomplete spending data
        const gdpRange = gdpYears.length > 0
          ? `${Math.min(...gdpYears)}-${Math.max(...gdpYears)}`
          : 'No data'
        const spendingStatus = hasPartialSpending
          ? `Outdated (${Math.min(...spendingYears)}-${Math.max(...spendingYears)})`
          : 'No data'
        missingSpending.push({ name: country, yearRange: gdpRange, spendingStatus })
      }
    })
    
    // Create a comprehensive list of ALL countries with their data status
    const allCountriesData = allCountries.map(country => {
      const gdpYears = countryGDPYears[country] || []
      const spendingYears = countrySpendingYears[country] || []
      
      const gdpRange = gdpYears.length > 0
        ? `${Math.min(...gdpYears)}-${Math.max(...gdpYears)}`
        : 'No data'
      
      const spendingRange = spendingYears.length > 0
        ? `${Math.min(...spendingYears)}-${Math.max(...spendingYears)}`
        : 'No data'
      
      const hasCompleteGDP = countriesWithCompleteGDP.has(country)
      const hasCompleteSpending = countriesWithCompleteSpending.has(country)
      
      return {
        name: country,
        gdpRange,
        spendingRange,
        gdpStatus: hasCompleteGDP ? 'Complete' : (gdpYears.length > 0 ? 'Outdated' : 'Missing'),
        spendingStatus: hasCompleteSpending ? 'Complete' : (spendingYears.length > 0 ? 'Outdated' : 'Missing'),
        hasIssue: !hasCompleteGDP || !hasCompleteSpending
      }
    }).sort((a, b) => a.name.localeCompare(b.name))
    
    const totalMissing = missingGDP.length + missingSpending.length + missingBoth.length
    
    return {
      withData: countriesWithBoth.size,
      withoutData: totalMissing,
      missingGDP: missingGDP.sort((a, b) => a.name.localeCompare(b.name)),
      missingSpending: missingSpending.sort((a, b) => a.name.localeCompare(b.name)),
      missingBoth: missingBoth.sort((a, b) => a.name.localeCompare(b.name)),
      allCountriesData,
      total: 214 // Total countries in the world
    }
  }, [metadata, chartData, displayYearRange])
  
  // Calculate top 5 spending categories for selected country or world (average)
  const topSpendingCategories = useMemo(() => {
    if (!spendingData || !selectedCountry || !displayYearRange) {
      return []
    }
    
    // Map of main indicators for each category (these represent the category total)
    const categoryMainIndicators = {
      overview: 'GE',
      personnel: 'GECE',
      transfers: 'GEG',
      debt: 'GEI',
      operations: 'GEOM',
      other: 'GEO',
      social: 'GES'
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
            mainIndicatorTotal: 0,
            mainIndicatorCount: 0,
            subcategories: {}
          }
        }
        
        // Check if this is the main indicator for the category
        const isMainIndicator = categoryMainIndicators[category] === indicatorCode
        
        // Sum values across the year range for averaging
        Object.entries(indicatorData).forEach(([year, valueObj]) => {
          const yearNum = parseInt(year)
          if (yearNum >= displayYearRange[0] && yearNum <= displayYearRange[1]) {
            // Handle both old format (number) and new format (object with local/usd)
            const usdValue = typeof valueObj === 'object' ? valueObj.usd : valueObj
            
            if (usdValue && !isNaN(usdValue) && usdValue > 0) {
              if (isMainIndicator) {
                // This is the main category total indicator
                categoryData[category].mainIndicatorTotal += usdValue
                categoryData[category].mainIndicatorCount++
              } else {
                // This is a subcategory breakdown
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
              }
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
        usdAverage: data.mainIndicatorCount > 0 ? data.mainIndicatorTotal / data.mainIndicatorCount : 0,
        color: CATEGORY_COLORS[category] || '#9ca3af',
        // Sort subcategories by USD average
        subcategories: Object.values(data.subcategories)
          .map(sub => ({
            ...sub,
            usdAverage: sub.usdCount > 0 ? sub.usdTotal / sub.usdCount : 0
          }))
          .filter(sub => sub.usdAverage > 0) // Only show subcategories with data
          .sort((a, b) => b.usdAverage - a.usdAverage)
      }))
      .filter(cat => cat.usdAverage > 0) // Only include categories with data
      .sort((a, b) => b.usdAverage - a.usdAverage)
    
    // Calculate percentage of overview (total expense)
    const overviewTotal = categories.find(c => c.categoryKey === 'overview')?.usdAverage || 0
    const categoriesWithPercentage = categories.map(cat => ({
      ...cat,
      percentageOfOverview: overviewTotal > 0 ? (cat.usdAverage / overviewTotal) * 100 : 0
    }))
    
    return categoriesWithPercentage
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
                <div className="metric-value" style={{ fontSize: '20px' }}>
                  {metadata.countries.length}
                </div>
                <div 
                  onClick={() => setShowMissingCountries(true)}
                  style={{
                    marginTop: '6px',
                    fontSize: '9px',
                    color: '#667eea',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: '500'
                  }}
                  title="View data availability for all countries"
                >
                  data discrepancy
                </div>
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
                
                // Check if this category has only one subcategory (or none)
                const isSingleCategory = cat.subcategories.length <= 1
                
                return (
                  <div 
                    key={cat.categoryKey} 
                    className="category-card"
                    style={isSingleCategory ? { 
                      gridColumn: 'span 1',
                      minHeight: 'auto'
                    } : {}}
                  >
                    <div className="category-header">
                      <div className="category-title">
                        <span className="category-rank">{index + 1}.</span>
                        <span className="category-dot" style={{ backgroundColor: cat.color }}></span>
                        <span 
                          className="category-name" 
                          onClick={() => setCategoryInfoModal(cat.categoryKey)}
                          style={{ 
                            cursor: 'pointer', 
                            textDecoration: 'underline dotted',
                            textUnderlineOffset: '3px'
                          }}
                          title="Click for more information"
                        >
                          {cat.name}
                        </span>
                      </div>
                      <div className="category-total">
                        <div>{formatUSD(cat.usdAverage)}</div>
                        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                          {cat.categoryKey !== 'overview' && (
                            <span style={{ color: cat.color, fontWeight: '600' }}>
                              {cat.percentageOfOverview.toFixed(1)}%
                            </span>
                          )}
                          {cat.categoryKey !== 'overview' && ' of total'}
                        </div>
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
      
      {/* Data Discrepancy Modal */}
      {showMissingCountries && countriesDataInfo.allCountriesData && (
        <>
          {/* Modal Overlay */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowMissingCountries(false)}
          />
          
          {/* Modal Content */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              border: '2px solid #667eea',
              borderRadius: '12px',
              padding: '0',
              fontSize: '12px',
              zIndex: 10000,
              maxWidth: '900px',
              width: '95%',
              maxHeight: '85vh',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px',
              borderBottom: '2px solid #e0e4ff',
              background: '#f8f9ff'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: '#667eea', fontSize: '18px', marginBottom: '4px' }}>
                  Data Availability Report
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  Showing data coverage for {metadata.countries.length} countries ({displayYearRange[0]}-{displayYearRange[1]})
                </div>
              </div>
              <button
                onClick={() => setShowMissingCountries(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fee'
                  e.currentTarget.style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#999'
                }}
                title="Close"
              >
                ×
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              padding: '12px 20px',
              borderBottom: '1px solid #e0e4ff',
              background: 'white'
            }}>
              <button
                onClick={() => setDataDiscrepancyTab('all')}
                style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: dataDiscrepancyTab === 'all' ? '#667eea' : '#f0f4ff',
                  color: dataDiscrepancyTab === 'all' ? 'white' : '#667eea',
                  transition: 'all 0.2s'
                }}
              >
                All Countries ({countriesDataInfo.allCountriesData.length})
              </button>
              <button
                onClick={() => setDataDiscrepancyTab('issues')}
                style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: dataDiscrepancyTab === 'issues' ? '#ef4444' : '#fee',
                  color: dataDiscrepancyTab === 'issues' ? 'white' : '#ef4444',
                  transition: 'all 0.2s'
                }}
              >
                Issues Only ({countriesDataInfo.allCountriesData.filter(c => c.hasIssue).length})
              </button>
            </div>
            
            {/* Table Content */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              padding: '0 20px 20px 20px'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '11px'
              }}>
                <thead style={{ 
                  position: 'sticky', 
                  top: 0, 
                  background: '#f8f9ff',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <tr>
                    <th style={{ 
                      padding: '16px 8px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #667eea',
                      fontWeight: '600',
                      color: '#667eea',
                      background: '#f8f9ff',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => {
                      const sorted = [...countriesDataInfo.allCountriesData].sort((a, b) => 
                        a.name.localeCompare(b.name)
                      )
                      // Toggle sort direction if already sorted
                      countriesDataInfo.allCountriesData = sorted
                    }}
                    title="Click to sort">
                      Country ↕
                    </th>
                    <th style={{ 
                      padding: '16px 8px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #667eea',
                      fontWeight: '600',
                      color: '#667eea',
                      background: '#f8f9ff',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    title="Click to sort">
                      GDP Data ↕
                    </th>
                    <th style={{ 
                      padding: '16px 8px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #667eea',
                      fontWeight: '600',
                      color: '#667eea',
                      background: '#f8f9ff',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    title="Click to sort">
                      Spending Data ↕
                    </th>
                    <th style={{ 
                      padding: '16px 8px', 
                      textAlign: 'center', 
                      borderBottom: '2px solid #667eea',
                      fontWeight: '600',
                      color: '#667eea',
                      background: '#f8f9ff',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    title="Click to sort">
                      Status ↕
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {countriesDataInfo.allCountriesData
                    .filter(c => dataDiscrepancyTab === 'all' || c.hasIssue)
                    .map((country, idx) => (
                    <tr key={idx} style={{ 
                      background: idx % 2 === 0 ? 'white' : '#f8f9ff',
                      borderBottom: '1px solid #e0e4ff'
                    }}>
                      <td style={{ padding: '10px 8px', fontWeight: '500' }}>
                        {country.name}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: country.gdpStatus === 'Complete' ? '#d1fae5' : (country.gdpStatus === 'Outdated' ? '#fef3c7' : '#fee'),
                            color: country.gdpStatus === 'Complete' ? '#065f46' : (country.gdpStatus === 'Outdated' ? '#92400e' : '#991b1b')
                          }}>
                            {country.gdpStatus}
                          </span>
                          <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace' }}>
                            {country.gdpRange}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: country.spendingStatus === 'Complete' ? '#d1fae5' : (country.spendingStatus === 'Outdated' ? '#fef3c7' : '#fee'),
                            color: country.spendingStatus === 'Complete' ? '#065f46' : (country.spendingStatus === 'Outdated' ? '#92400e' : '#991b1b')
                          }}>
                            {country.spendingStatus}
                          </span>
                          <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace' }}>
                            {country.spendingRange}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {country.hasIssue ? (
                          <span style={{ fontSize: '16px' }}>⚠️</span>
                        ) : (
                          <span style={{ fontSize: '16px' }}>✅</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          
          {/* Legend */}
          <div style={{ 
            padding: '16px 20px',
            borderTop: '2px solid #e0e4ff',
            background: '#f8f9ff',
            display: 'flex',
            gap: '20px',
            fontSize: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#d1fae5', color: '#065f46', fontWeight: '600' }}>Complete</span>
              <span style={{ color: '#666' }}>Data up to 2019+</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: '600' }}>Outdated</span>
              <span style={{ color: '#666' }}>Data ends before 2019</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#fee', color: '#991b1b', fontWeight: '600' }}>Missing</span>
              <span style={{ color: '#666' }}>No data available</span>
            </div>
          </div>
        </div>
      </>
    )}
    
    {/* Category Info Modal */}
    {categoryInfoModal && (
      <>
        {/* Modal Overlay */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setCategoryInfoModal(null)}
        />
        
        {/* Modal Content */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            border: `3px solid ${CATEGORY_COLORS[categoryInfoModal] || '#667eea'}`,
            borderRadius: '12px',
            padding: '24px',
            fontSize: '14px',
            zIndex: 10001,
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Close Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              flex: 1
            }}>
              <span 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: CATEGORY_COLORS[categoryInfoModal] || '#667eea'
                }}
              />
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: CATEGORY_COLORS[categoryInfoModal] || '#667eea',
                textTransform: 'capitalize'
              }}>
                {categoryInfoModal}
              </h3>
            </div>
            <button
              onClick={() => setCategoryInfoModal(null)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#999',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s',
                marginLeft: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f0f0'
                e.currentTarget.style.color = '#333'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#999'
              }}
              title="Close"
            >
              ×
            </button>
          </div>
          
          {/* Description */}
          <p style={{ 
            margin: 0, 
            lineHeight: '1.6', 
            color: '#333',
            fontSize: '14px'
          }}>
            {CATEGORY_DESCRIPTIONS[categoryInfoModal]}
          </p>
        </div>
      </>
    )}
  </div>
)
}


export default ComparisonDashboard
