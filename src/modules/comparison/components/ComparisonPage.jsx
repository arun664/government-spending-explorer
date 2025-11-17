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
import { 
  loadGdpExpenseData,
  detectAnomalies,
  calculateExpenseToGdpRatios,
  getTopSpenders,
  calculateStatistics,
  analyzeGlobalTrends
} from '../services/GdpExpenseDataService.js'
import '../styles/ComparisonPage.css'

// Main component
function ComparisonContent({ onLoadingChange, onControlsReady }) {
  const [selectedCountry, setSelectedCountry] = useState('WORLD')
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
  
  // Chart type state
  const [chartType, setChartType] = useState('timeSeries')

  // Notify parent about available controls
  useEffect(() => {
    if (onControlsReady && data) {
      // Provide only the Time Series chart (line chart)
      onControlsReady({
        chartType: chartType,
        chartTypes: [
          { id: 'timeSeries', name: 'GDP vs Expense Growth', icon: '📈' }
        ],
        onChartTypeChange: (newType) => setChartType(newType)
      })
    }
  }, [onControlsReady, data, chartType])

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value)
  }

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
      {/* Header with Country Selector */}
      <div className="comparison-header-simple">
        <div className="header-left">
          <h2>GDP vs Government Expense Comparison</h2>
          <p className="header-subtitle">Values in domestic currency (USD, EUR, INR, etc.)</p>
        </div>
        <div className="header-controls">
          <div className="country-selector">
            <label htmlFor="country-select">Country:</label>
            <select 
              id="country-select"
              value={selectedCountry} 
              onChange={handleCountryChange}
              className="country-dropdown"
            >
              <option key="WORLD" value="WORLD">🌍 World Average</option>
              {countries.map((country, index) => (
                <option key={`${country.name}-${index}`} value={country.name}>
                  {hasAnomalies(country.name) ? '⚠️ ' : ''}{country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="chart-area-simple">
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
          <div className="chart-with-insights">
            <div className="chart-main">
              <GdpExpenseChart selectedCountry={selectedCountry} data={data} />
            </div>
            
            {/* Trends and Anomalies Panel */}
            <div className="comparison-insights-panel">
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
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
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
    </div>
  )
}

const ComparisonPage = ({ onLoadingChange, onControlsReady }) => {
  return <ComparisonContent onLoadingChange={onLoadingChange} onControlsReady={onControlsReady} />
}

export default ComparisonPage
