/**
 * ComparisonPage - GDP vs Expense Growth Comparison
 * 
 * Features:
 * - Country selector dropdown (World Average + individual countries)
 * - Dual-line chart showing GDP and Expense Growth over time
 * - Timeline view with years on x-axis
 * 
 * Requirements: Simplified comparison view for GDP vs Expense analysis
 */

import { useState, useEffect } from 'react'
import GdpExpenseChart from './GdpExpenseChart.jsx'
import ChartTypeSelector from './ChartTypeSelector.jsx'
import { 
  loadGdpExpenseData,
  detectAnomalies,
  calculateExpenseToGdpRatios,
  getTopSpenders,
  calculateStatistics,
  analyzeGlobalTrends,
  loadSectorBreakdown
} from '../services/GdpExpenseDataService.js'
import '../styles/ComparisonPage.css'

// Main component
function ComparisonContent({ onLoadingChange, onControlsReady }) {
  const [selectedCountry, setSelectedCountry] = useState('WORLD')
  const [chartType, setChartType] = useState('line')
  const [countries, setCountries] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Analytics state
  const [anomalies, setAnomalies] = useState([])
  const [ratios, setRatios] = useState(new Map())
  const [topSpenders, setTopSpenders] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [trends, setTrends] = useState('')
  
  // Sector breakdown state
  const [sectorBreakdown, setSectorBreakdown] = useState([])
  const [loadingSectors, setLoadingSectors] = useState(false)
  const [sectorError, setSectorError] = useState(null)

  // Load data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        if (onLoadingChange) onLoadingChange(true)
        
        const result = await loadGdpExpenseData()
        setData(result)
        setCountries(result.countries)
        setError(null)
        
        // Run analytics on loaded data
        const detectedAnomalies = detectAnomalies(result.gdpData, result.expenseData)
        setAnomalies(detectedAnomalies)
        
        const calculatedRatios = calculateExpenseToGdpRatios(result.gdpData, result.expenseData)
        setRatios(calculatedRatios)
        
        const topSpendersData = getTopSpenders(result.expenseData, result.gdpData, 5)
        setTopSpenders(topSpendersData)
        
        const expenseStats = calculateStatistics(result.expenseData)
        setStatistics(expenseStats)
        
        const trendAnalysis = analyzeGlobalTrends(result.expenseData)
        setTrends(trendAnalysis)
        
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
        if (onLoadingChange) onLoadingChange(false)
      }
    }
    
    fetchData()
  }, [onLoadingChange])
  
  // Notify parent about available controls
  useEffect(() => {
    if (onControlsReady && data) {
      // Provide all available chart types
      onControlsReady({
        chartType: chartType,
        chartTypes: [
          { id: 'line', name: 'Line Chart', icon: '📈' },
          { id: 'scatter', name: 'Bubble Chart', icon: '🫧' }
        ],
        onChartTypeChange: (newType) => setChartType(newType)
      })
    }
  }, [onControlsReady, data, chartType])

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value)
  }

  const handleChartTypeChange = (newChartType) => {
    setChartType(newChartType)
  }
  
  // Load sector breakdown when country changes
  useEffect(() => {
    async function fetchSectorData() {
      // Only load sector data for specific countries (not WORLD)
      if (!selectedCountry || selectedCountry === 'WORLD' || !data) {
        setSectorBreakdown([])
        return
      }
      
      try {
        setLoadingSectors(true)
        setSectorError(null)
        
        // Get the most recent year with data
        const latestYear = data.years && data.years.length > 0 
          ? Math.max(...data.years) 
          : new Date().getFullYear()
        
        const sectors = await loadSectorBreakdown(selectedCountry, latestYear)
        setSectorBreakdown(sectors)
        
        // Log sector data for validation
        if (sectors.length > 0) {
          const totalPercentage = sectors.reduce((sum, s) => sum + s.percentage, 0)
          console.log(`Sector breakdown for ${selectedCountry} (${latestYear}):`)
          console.log(`  - ${sectors.length} sectors loaded`)
          console.log(`  - Total percentage: ${totalPercentage.toFixed(2)}%`)
          sectors.forEach(s => {
            console.log(`  - ${s.name}: ${s.value.toFixed(2)} (${s.percentage.toFixed(1)}%)`)
          })
        } else {
          console.log(`No sector data available for ${selectedCountry}`)
        }
      } catch (err) {
        console.error('Error loading sector breakdown:', err)
        setSectorError(err.message)
        setSectorBreakdown([])
      } finally {
        setLoadingSectors(false)
      }
    }
    
    fetchSectorData()
  }, [selectedCountry, data])

  // Helper function to check if a country has anomalies
  const hasAnomalies = (countryName) => {
    return anomalies.some(anomaly => anomaly.country === countryName)
  }

  // Get anomalies for the selected country
  const getCountryAnomalies = () => {
    if (selectedCountry === 'WORLD') {
      // For world view, show top 5 most severe anomalies
      return anomalies.slice(0, 5)
    } else {
      // For specific country, show only that country's anomalies
      return anomalies.filter(anomaly => anomaly.country === selectedCountry)
    }
  }

  // Get statistics for the selected country
  const getCountryStatistics = () => {
    if (selectedCountry === 'WORLD' || !data) {
      return statistics
    }
    
    // Calculate statistics for selected country
    const countryExpenseData = data.expenseData.filter(d => d.countryName === selectedCountry)
    return calculateStatistics(countryExpenseData)
  }

  const countryAnomalies = getCountryAnomalies()
  const countryStats = getCountryStatistics()

  return (
    <div className="comparison-page-simple">
      {/* Main Chart Area */}
      <div className="chart-area-simple" style={{ position: 'relative' }}>
        {/* Chart Type Selector - Floating in top-right */}
        {!loading && !error && (
          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 100 }}>
            <ChartTypeSelector 
              value={chartType} 
              onChange={handleChartTypeChange}
            />
          </div>
        )}
        
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>Error loading data: {error}</p>
          </div>
        ) : (
          <div className={chartType === 'scatter' ? 'chart-fullscreen' : 'chart-with-insights'}>
            <div className={chartType === 'scatter' ? 'chart-fullscreen-main' : 'chart-main'}>
              <GdpExpenseChart 
                selectedCountry={selectedCountry} 
                data={data} 
                chartType={chartType}
              />
            </div>
            
            {/* Trends and Anomalies Panel - Hidden in bubble chart mode */}
            {chartType !== 'scatter' && (
            <div className="comparison-insights-panel">
              {/* Country Selector - Above insights */}
              <div className="country-selector" style={{ marginBottom: '12px' }}>
                <label htmlFor="country-select" style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', marginBottom: '6px', display: 'block' }}>Country:</label>
                <select 
                  id="country-select"
                  value={selectedCountry} 
                  onChange={handleCountryChange}
                  className="country-dropdown"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
                >
                  <option key="WORLD" value="WORLD">🌍 World Average</option>
                  {countries.map((country, index) => (
                    <option key={`${country.name}-${index}`} value={country.name}>
                      {hasAnomalies(country.name) ? '⚠️ ' : ''}{country.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <h3 className="comparison-insights-title">📊 Insights</h3>
              
              {/* Trends Section */}
              <div className="comparison-insights-section">
                <h4 className="comparison-section-title">🔍 Key Trends</h4>
                {trends ? (
                  <div className="comparison-trend-content">
                    <p className="comparison-trend-text">{trends}</p>
                  </div>
                ) : (
                  <p className="comparison-no-data">No trend data available</p>
                )}
              </div>
              
              {/* Anomalies Section - Dynamic based on selected country */}
              <div className="comparison-insights-section">
                <h4 className="comparison-section-title">
                  ⚠️ {selectedCountry === 'WORLD' ? 'Spending vs GDP Anomalies' : `${selectedCountry} Anomalies`}
                </h4>
                <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', marginTop: '-4px' }}>
                  Unusual spending-to-GDP ratios or sudden changes
                </p>
                {countryAnomalies && countryAnomalies.length > 0 ? (
                  <div className="comparison-anomalies-list">
                    {countryAnomalies.map((anomaly, index) => (
                      <div key={index} className="comparison-anomaly-item">
                        <div className="comparison-anomaly-header">
                          {selectedCountry === 'WORLD' && (
                            <span className="comparison-anomaly-country">{anomaly.country}</span>
                          )}
                          <span className="comparison-anomaly-year">{anomaly.year}</span>
                        </div>
                        <div className="comparison-anomaly-details">
                          <span className="comparison-anomaly-type">{anomaly.type}</span>
                          <span className="comparison-anomaly-value">
                            {anomaly.ratio ? `${anomaly.ratio.toFixed(1)}% of GDP` : 
                             anomaly.change ? `${anomaly.change > 0 ? '+' : ''}${anomaly.change.toFixed(1)}% YoY` : 
                             'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="comparison-no-data">
                    {selectedCountry === 'WORLD' ? 'No spending anomalies detected globally' : `No spending anomalies detected for ${selectedCountry}`}
                  </p>
                )}
              </div>
              
              {/* Statistics Section - Dynamic based on selected country */}
              {countryStats && (
                <div className="comparison-insights-section">
                  <h4 className="comparison-section-title">
                    📈 {selectedCountry === 'WORLD' ? 'Global Statistics' : `${selectedCountry} Statistics`}
                  </h4>
                  <div className="comparison-stats-list">
                    <div className="comparison-stat-row">
                      <span className="comparison-stat-label">Average</span>
                      <span className="comparison-stat-value">
                        {countryStats.mean ? `${countryStats.mean.toFixed(1)}M` : 'N/A'}
                      </span>
                    </div>
                    <div className="comparison-stat-row">
                      <span className="comparison-stat-label">Median</span>
                      <span className="comparison-stat-value">
                        {countryStats.median ? `${countryStats.median.toFixed(1)}M` : 'N/A'}
                      </span>
                    </div>
                    <div className="comparison-stat-row">
                      <span className="comparison-stat-label">Std Dev</span>
                      <span className="comparison-stat-value">
                        {countryStats.stdDev ? `${countryStats.stdDev.toFixed(1)}M` : 'N/A'}
                      </span>
                    </div>
                    <div className="comparison-stat-row">
                      <span className="comparison-stat-label">Min</span>
                      <span className="comparison-stat-value">
                        {countryStats.min ? `${countryStats.min.toFixed(1)}M` : 'N/A'}
                      </span>
                    </div>
                    <div className="comparison-stat-row">
                      <span className="comparison-stat-label">Max</span>
                      <span className="comparison-stat-value">
                        {countryStats.max ? `${countryStats.max.toFixed(1)}M` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sector Breakdown Section */}
              <div className="comparison-insights-section">
                <h4 className="comparison-section-title">
                  🏛️ Sector Breakdown
                </h4>
                {selectedCountry === 'WORLD' ? (
                  <p className="comparison-no-data">
                    Select a specific country to view sector breakdown
                  </p>
                ) : loadingSectors ? (
                  <div className="comparison-loading-sectors">
                    <div className="loading-spinner-small"></div>
                    <p>Loading sector data...</p>
                  </div>
                ) : sectorError ? (
                  <p className="comparison-error-text">
                    Error loading sector data: {sectorError}
                  </p>
                ) : sectorBreakdown.length > 0 ? (
                  <div className="comparison-sectors-list">
                    {sectorBreakdown.slice(0, 5).map((sector, index) => (
                      <div key={index} className="comparison-sector-item">
                        <div className="comparison-sector-header">
                          <span className="comparison-sector-icon">{sector.icon}</span>
                          <span className="comparison-sector-name">{sector.name}</span>
                        </div>
                        <div className="comparison-sector-stats">
                          <span className="comparison-sector-percentage">
                            {sector.percentage.toFixed(1)}%
                          </span>
                          {sector.yearOverYearChange !== null && (
                            <span className={`comparison-sector-change ${sector.yearOverYearChange > 0 ? 'positive' : 'negative'}`}>
                              {sector.yearOverYearChange > 0 ? '↑' : '↓'} {Math.abs(sector.yearOverYearChange).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="comparison-no-data">
                    No sector data available for {selectedCountry}
                  </p>
                )}
              </div>
            </div>
            )}
          </div>
        )}
      </div>

      {/* Info Section - Hidden in bubble chart mode */}
      {chartType !== 'scatter' && (
      <div className="info-section">
        <div className="info-card">
          <h3>About This Comparison</h3>
          <p>
            This chart compares absolute GDP values with government expense values over time.
            Values are in each country's domestic currency (e.g., USD for US, EUR for Eurozone, INR for India).
            {selectedCountry === 'WORLD' 
              ? ' The World Average is calculated from all available countries in the dataset.'
              : ` Showing data for ${selectedCountry}.`
            }
          </p>
        </div>
      </div>
      )}
    </div>
  )
}

const ComparisonPage = ({ onLoadingChange, onControlsReady }) => {
  return <ComparisonContent onLoadingChange={onLoadingChange} onControlsReady={onControlsReady} />
}

export default ComparisonPage
