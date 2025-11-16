/**
 * ComparisonDashboard - Clean tabbed dashboard for comparison visualizations
 * 
 * Features:
 * - Clean tabbed interface - one chart at a time
 * - Full-screen charts with proper legends
 * - Lazy loading - only load active tab
 * - Better performance and user experience
 * - Coordinated interactions across tabs
 */

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { chartInteractionManager } from '../services/ChartInteractionManager.js'
import ChartWrapper from './ChartWrapper.jsx'

// Lazy load chart components for better performance
const ScatterPlotChart = lazy(() => import('./ScatterPlotChart.jsx'))
const BubbleChart = lazy(() => import('./BubbleChart.jsx'))
const CorrelationHeatmap = lazy(() => import('./CorrelationHeatmap.jsx'))
const ParallelCoordinates = lazy(() => import('./ParallelCoordinates.jsx'))
const SankeyDiagram = lazy(() => import('./SankeyDiagram.jsx'))
const NetworkGraph = lazy(() => import('./NetworkGraph.jsx'))
const StreamGraph = lazy(() => import('./StreamGraph.jsx'))
const TreemapChart = lazy(() => import('./TreemapChart.jsx'))

const ComparisonDashboard = ({
  animationSpeed = 1000,
  className = '',
  onLoadingChange
}) => {
  // Dashboard state
  const [activeTab, setActiveTab] = useState('scatter')
  const [selectedCountries, setSelectedCountries] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [globalFilters, setGlobalFilters] = useState({})
  const [colorScheme, setColorScheme] = useState('region')
  const [isLoading, setIsLoading] = useState(true)
  const [loadedTabs, setLoadedTabs] = useState(new Set(['scatter'])) // Load first tab by default
  
  // Centralized data management
  const [comparisonData, setComparisonData] = useState(null)
  const [dataError, setDataError] = useState(null)

  // Chart tabs configuration
  const chartTabs = useMemo(() => ({
    scatter: {
      id: 'scatter',
      component: ScatterPlotChart,
      title: 'Scatter Plot',
      description: 'GDP Growth vs Government Spending',
      icon: '📊',
      category: 'Correlation Analysis'
    },
    bubble: {
      id: 'bubble',
      component: BubbleChart,
      title: 'Bubble Chart',
      description: 'Multi-dimensional Country Comparison',
      icon: '🫧',
      category: 'Correlation Analysis'
    },
    heatmap: {
      id: 'heatmap',
      component: CorrelationHeatmap,
      title: 'Correlation Heatmap',
      description: 'Statistical Relationships Matrix',
      icon: '🔥',
      category: 'Statistical Analysis'
    },
    parallel: {
      id: 'parallel',
      component: ParallelCoordinates,
      title: 'Parallel Coordinates',
      description: 'Multi-dimensional Data Exploration',
      icon: '📈',
      category: 'Statistical Analysis'
    },
    sankey: {
      id: 'sankey',
      component: SankeyDiagram,
      title: 'Sankey Diagram',
      description: 'Flow and Allocation Patterns',
      icon: '🌊',
      category: 'Flow Analysis'
    },
    network: {
      id: 'network',
      component: NetworkGraph,
      title: 'Network Graph',
      description: 'Country Similarity Networks',
      icon: '🕸️',
      category: 'Network Analysis'
    },
    stream: {
      id: 'stream',
      component: StreamGraph,
      title: 'Stream Graph',
      description: 'Temporal Evolution Patterns',
      icon: '🌊',
      category: 'Time Series'
    },
    treemap: {
      id: 'treemap',
      component: TreemapChart,
      title: 'Treemap',
      description: 'Hierarchical Spending Breakdown',
      icon: '🗂️',
      category: 'Hierarchical Analysis'
    }
  }), [])

  // Tab categories for organization
  const tabCategories = useMemo(() => {
    const categories = {}
    Object.values(chartTabs).forEach(tab => {
      if (!categories[tab.category]) {
        categories[tab.category] = []
      }
      categories[tab.category].push(tab)
    })
    return categories
  }, [chartTabs])

  // Centralized data loading - load once and share across all charts
  useEffect(() => {
    let isMounted = true

    const loadComparisonData = async () => {
      try {
        setIsLoading(true)
        setDataError(null)

        console.log('Loading comparison data (one-time load)...')
        
        // Import data services dynamically to avoid circular dependencies
        const { comparisonDataLoader } = await import('../services/ComparisonDataLoader.js')
        const { comparisonDataProcessor } = await import('../services/ComparisonDataProcessor.js')
        
        // Load raw data
        const rawData = await comparisonDataLoader.loadComparisonData()
        
        // Process and merge data once
        const processedData = comparisonDataProcessor.mergeGDPAndSpendingData(
          rawData.gdp,
          rawData.spending,
          { requireBothDatasets: true }
        )

        if (isMounted) {
          setComparisonData(processedData)
          console.log(`Loaded and processed ${processedData.length} comparison records`)
        }
      } catch (error) {
        console.error('Error loading comparison data:', error)
        if (isMounted) {
          setDataError(error.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadComparisonData()

    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array - load only once

  // Handle tab switching with lazy loading
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)
    
    // Mark tab as loaded for lazy loading
    if (!loadedTabs.has(tabId)) {
      setIsLoading(true)
      setLoadedTabs(prev => new Set([...prev, tabId]))
      
      // Simulate loading delay for better UX
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  }, [loadedTabs])

  // Sync loading state with parent component
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading)
    }
  }, [isLoading, onLoadingChange])

  // Initialize interaction manager
  useEffect(() => {
    // Set up global event listeners
    const handleSelectionChange = (event) => {
      setSelectedCountries(event.countries)
    }

    const handleYearChange = (event) => {
      setSelectedYear(event.year)
    }

    const handleFiltersChange = (event) => {
      setGlobalFilters(event.filters)
    }

    const handleColorSchemeChange = (event) => {
      setColorScheme(event.scheme)
    }

    chartInteractionManager.addEventListener('selectionChanged', handleSelectionChange)
    chartInteractionManager.addEventListener('yearChanged', handleYearChange)
    chartInteractionManager.addEventListener('filtersChanged', handleFiltersChange)
    chartInteractionManager.addEventListener('colorSchemeChanged', handleColorSchemeChange)

    return () => {
      chartInteractionManager.removeEventListener('selectionChanged', handleSelectionChange)
      chartInteractionManager.removeEventListener('yearChanged', handleYearChange)
      chartInteractionManager.removeEventListener('filtersChanged', handleFiltersChange)
      chartInteractionManager.removeEventListener('colorSchemeChanged', handleColorSchemeChange)
    }
  }, [])

  // Handle chart interactions
  const handleCountrySelect = useCallback((countries) => {
    chartInteractionManager.updateSelection(countries, activeTab)
  }, [activeTab])

  const handleYearChange = useCallback((year) => {
    chartInteractionManager.updateYear(year, activeTab)
  }, [activeTab])

  const handleFilterUpdate = useCallback((filters) => {
    chartInteractionManager.updateFilters(filters, activeTab)
  }, [activeTab])

  // Generate key highlights based on current data and year
  const renderKeyHighlights = useCallback(() => {
    if (!comparisonData || comparisonData.length === 0) return null

    // Filter data for current year or latest available year
    const currentYear = selectedYear || Math.max(...comparisonData.map(d => d.year))
    const yearData = comparisonData.filter(d => d.year === currentYear)
    
    if (yearData.length === 0) return null

    // Calculate insights
    const totalUniqueCountries = new Set(comparisonData.map(d => d.countryName || d.country)).size
    const avgGDPGrowth = yearData.reduce((sum, d) => sum + d.gdpGrowth, 0) / yearData.length
    const avgSpending = yearData.reduce((sum, d) => sum + d.totalSpending, 0) / yearData.length
    const highGrowthCountries = yearData.filter(d => d.gdpGrowth > 5).length
    const highSpendingCountries = yearData.filter(d => d.totalSpending > 40).length
    
    const topGrowthCountry = yearData.reduce((max, d) => d.gdpGrowth > max.gdpGrowth ? d : max)
    const topSpendingCountry = yearData.reduce((max, d) => d.totalSpending > max.totalSpending ? d : max)

    const highlights = [
      `📊 ${totalUniqueCountries} countries total | ${yearData.length} countries with data for ${currentYear}`,
      `📈 Average GDP Growth: ${avgGDPGrowth.toFixed(1)}% | Average Gov Spending: ${avgSpending.toFixed(1)}% of GDP`,
      `🚀 ${highGrowthCountries} countries with >5% growth | 💰 ${highSpendingCountries} countries with >40% spending`,
      `🏆 Highest Growth: ${topGrowthCountry.countryName} (${topGrowthCountry.gdpGrowth.toFixed(1)}%) | Highest Spending: ${topSpendingCountry.countryName} (${topSpendingCountry.totalSpending.toFixed(1)}%)`
    ]

    return (
      <div>
        <h4 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '15px', 
          fontWeight: '600', 
          color: '#2d3748' 
        }}>
          Key Insights for {currentYear}
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '8px' 
        }}>
          {highlights.map((highlight, index) => (
            <div
              key={index}
              style={{
                padding: '8px 12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                color: '#4a5568',
                lineHeight: '1.4',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              {highlight}
            </div>
          ))}
        </div>
      </div>
    )
  }, [comparisonData, selectedYear])

  // Render active chart
  const renderActiveChart = () => {
    const activeTabConfig = chartTabs[activeTab]
    
    // Show loading state
    if (isLoading || !comparisonData) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          color: '#6c757d',
          fontSize: '16px'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            {isLoading ? 'Loading comparison data...' : `Loading ${activeTabConfig?.title}...`}
          </div>
        </div>
      )
    }

    // Show error state
    if (dataError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          color: '#e53e3e',
          fontSize: '16px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
            <div>Error loading data: {dataError}</div>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    if (!activeTabConfig || !loadedTabs.has(activeTab)) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          color: '#6c757d',
          fontSize: '16px'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            Initializing {activeTabConfig?.title}...
          </div>
        </div>
      )
    }

    const ChartComponent = activeTabConfig.component
    const chartId = `${activeTab}-main`

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chart Area - Full Width */}
        <div style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: '#6c757d'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '12px'
              }} />
              Initializing chart...
            </div>
          }>
            <div style={{ height: 'calc(100% - 140px)' }}>
              <ChartWrapper
                chartId={chartId}
                chartType={activeTab}
                ChartComponent={ChartComponent}
                data={comparisonData}
                width={window.innerWidth - 40}
                height={window.innerHeight - 340}
                selectedCountries={selectedCountries}
                selectedYear={selectedYear}
                animationSpeed={animationSpeed}
                onCountrySelect={handleCountrySelect}
                onYearChange={handleYearChange}
                onFilterUpdate={handleFilterUpdate}
                className="full-screen-chart"
              />
            </div>
            {/* Key Highlights - Below Chart */}
            {comparisonData && comparisonData.length > 0 && (
              <div style={{
                height: '140px',
                padding: '12px 20px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e2e8f0',
                overflow: 'auto'
              }}>
                {renderKeyHighlights()}
              </div>
            )}
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className={`comparison-dashboard ${className}`}>
      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .tab-button {
          background: none;
          border: none;
          padding: 12px 20px;
          cursor: pointer;
          border-radius: 8px 8px 0 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #4a5568;
          border-bottom: 3px solid transparent;
        }
        
        .tab-button:hover {
          background-color: #f7fafc;
          color: #2d3748;
        }
        
        .tab-button.active {
          background-color: white;
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 600;
        }
        
        .tab-button.active:hover {
          background-color: white;
          color: #5a67d8;
        }
        
        .tab-content {
          background: white;
          box-shadow: 0 -1px 0 #e2e8f0, 0 4px 12px rgba(0,0,0,0.05);
          min-height: calc(100vh - 180px);
        }
        
        .full-screen-chart {
          width: 100%;
          height: 100%;
        }
        
        .chart-legend {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          font-size: 12px;
          max-width: 200px;
        }
      `}</style>

      {/* Global Controls */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#2d3748' }}>
            Comparison Analysis
          </h2>
          
          {selectedCountries.length > 0 && (
            <div style={{
              padding: '4px 12px',
              backgroundColor: '#667eea',
              color: 'white',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {selectedCountries.length} countries selected
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#4a5568' }}>
            Color Scheme:
            <select 
              value={colorScheme} 
              onChange={(e) => chartInteractionManager.updateColorScheme(e.target.value)}
              style={{ 
                marginLeft: '8px', 
                padding: '6px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="region">By Region</option>
              <option value="performance">By Performance</option>
              <option value="spending">By Spending</option>
              <option value="gdp">By GDP</option>
            </select>
          </label>
          
          <button
            onClick={() => chartInteractionManager.resetInteractions()}
            style={{
              padding: '6px 16px',
              fontSize: '14px',
              border: '1px solid #e53e3e',
              backgroundColor: '#fff',
              color: '#e53e3e',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Reset Selection
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        padding: '0 20px',
        backgroundColor: '#f7fafc',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          paddingBottom: '0'
        }}>
          {Object.values(chartTabs).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              title={tab.description}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              <span>{tab.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderActiveChart()}
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e2e8f0',
        fontSize: '14px',
        color: '#4a5568',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #e2e8f0',
              borderTop: '2px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: '#667eea' }}>Loading...</span>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
          {selectedCountries.length > 0 && (
            <span>{selectedCountries.length} countries selected</span>
          )}
          {selectedYear && (
            <span>Year: {selectedYear}</span>
          )}
          {Object.keys(globalFilters).length > 0 && (
            <span>{Object.keys(globalFilters).length} filters active</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComparisonDashboard