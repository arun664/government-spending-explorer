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
  
  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading)
    }
  }, [loading, onLoadingChange])
  
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
    
    setIsAnimating(true)
    let currentEndYear = 2006 // Start with 2005-2006
    setDisplayYearRange([2005, currentEndYear])
    setSelectedYear(currentEndYear)
    
    const interval = setInterval(() => {
      currentEndYear++
      if (currentEndYear > 2022) {
        // Stop animation when reaching max year
        clearInterval(interval)
        setAnimationInterval(null)
        setIsAnimating(false)
        return
      }
      setDisplayYearRange([2005, currentEndYear])
      setSelectedYear(currentEndYear)
    }, 1000) // Change year every 1 second for smooth visualization
    
    setAnimationInterval(interval)
  }, [isAnimating])
  
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
        </div>
      </div>
      
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
            {selectedCountry === 'World' ? 'Top 15 countries by GDP' : `${selectedCountry} - Year-over-year comparison`}
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
    </div>
  )
}

export default ComparisonDashboard
