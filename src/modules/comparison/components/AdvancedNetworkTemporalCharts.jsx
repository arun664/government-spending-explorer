/**
 * AdvancedNetworkTemporalCharts - Container component for NetworkGraph and StreamGraph
 * 
 * Features:
 * - Combines NetworkGraph and StreamGraph in a coordinated layout
 * - Shared controls and interactions between charts
 * - Synchronized country selection and filtering
 * - Advanced similarity algorithms and temporal analysis
 */

import React, { useState, useCallback, useEffect } from 'react'
import NetworkGraph from './NetworkGraph.jsx'
import StreamGraph from './StreamGraph.jsx'
import { comparisonDataProcessor } from '../services/ComparisonDataProcessor.js'
import '../styles/AdvancedNetworkTemporalCharts.css'

const AdvancedNetworkTemporalCharts = ({ 
  data = [], 
  width = 1200, 
  height = 800,
  selectedCountries = [],
  selectedYear = null,
  onCountrySelect = null,
  onYearChange = null,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('network') // 'network', 'stream', 'both'
  const [networkSettings, setNetworkSettings] = useState({
    similarityThreshold: 0.7,
    maxConnections: 50,
    nodeSize: 'totalSpending',
    colorBy: 'region',
    showLabels: true
  })
  const [streamSettings, setStreamSettings] = useState({
    categories: ['defense', 'education', 'health', 'infrastructure', 'social'],
    interpolation: 'cardinal',
    offset: 'wiggle',
    showLegend: true
  })
  const [visibleCategories, setVisibleCategories] = useState(new Set(streamSettings.categories))
  const [hoveredCountry, setHoveredCountry] = useState(null)
  const [hoveredTime, setHoveredTime] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)

  // Calculate layout dimensions based on active tab
  const getChartDimensions = () => {
    switch (activeTab) {
      case 'network':
        return { networkWidth: width, networkHeight: height, streamWidth: 0, streamHeight: 0 }
      case 'stream':
        return { networkWidth: 0, networkHeight: 0, streamWidth: width, streamHeight: height }
      case 'both':
        return { 
          networkWidth: width, 
          networkHeight: Math.floor(height * 0.5), 
          streamWidth: width, 
          streamHeight: Math.floor(height * 0.5) 
        }
      default:
        return { networkWidth: width, networkHeight: height, streamWidth: width, streamHeight: height }
    }
  }

  const dimensions = getChartDimensions()

  // Perform advanced analysis on data
  useEffect(() => {
    if (data.length === 0) return

    const performAnalysis = async () => {
      try {
        // Calculate correlations and trends
        const correlationResults = comparisonDataProcessor.calculateGDPSpendingCorrelation(data, {
          groupBy: 'country',
          minDataPoints: 3
        })

        const trendResults = comparisonDataProcessor.performTrendAnalysis(data, {
          groupBy: 'country',
          trendWindow: 5,
          includeForecasting: false
        })

        setAnalysisResults({
          correlations: correlationResults,
          trends: trendResults,
          dataQuality: {
            totalRecords: data.length,
            countries: [...new Set(data.map(d => d.countryName))].length,
            yearRange: {
              start: Math.min(...data.map(d => d.year)),
              end: Math.max(...data.map(d => d.year))
            }
          }
        })
      } catch (error) {
        console.error('Error performing analysis:', error)
      }
    }

    performAnalysis()
  }, [data])

  // Handle country selection from network graph
  const handleNetworkCountrySelect = useCallback((countries) => {
    if (onCountrySelect) {
      onCountrySelect(countries)
    }
  }, [onCountrySelect])

  // Handle node hover in network graph
  const handleNetworkNodeHover = useCallback((node, event) => {
    setHoveredCountry(node)
  }, [])

  // Handle category toggle in stream graph
  const handleCategoryToggle = useCallback((categories) => {
    setVisibleCategories(new Set(categories))
  }, [])

  // Handle time hover in stream graph
  const handleTimeHover = useCallback((year, yearData) => {
    setHoveredTime({ year, data: yearData })
    if (onYearChange) {
      onYearChange(year)
    }
  }, [onYearChange])

  // Update network settings
  const updateNetworkSettings = useCallback((newSettings) => {
    setNetworkSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Update stream settings
  const updateStreamSettings = useCallback((newSettings) => {
    setStreamSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  return (
    <div className={`advanced-network-temporal-charts ${className}`}>
      <div className="charts-header">
        <div className="charts-title">
          <h2>Advanced Network & Temporal Analysis</h2>
          <p>Country similarity clustering and spending composition evolution</p>
        </div>
        
        <div className="charts-controls">
          <div className="tab-controls">
            <button 
              className={`tab-button ${activeTab === 'network' ? 'active' : ''}`}
              onClick={() => setActiveTab('network')}
            >
              Network Graph
            </button>
            <button 
              className={`tab-button ${activeTab === 'stream' ? 'active' : ''}`}
              onClick={() => setActiveTab('stream')}
            >
              Stream Graph
            </button>
            <button 
              className={`tab-button ${activeTab === 'both' ? 'active' : ''}`}
              onClick={() => setActiveTab('both')}
            >
              Both Views
            </button>
          </div>

          <div className="analysis-summary">
            {analysisResults && (
              <>
                <div className="summary-item">
                  <span className="summary-label">Countries:</span>
                  <span className="summary-value">{analysisResults.dataQuality.countries}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Years:</span>
                  <span className="summary-value">
                    {analysisResults.dataQuality.yearRange.start}-{analysisResults.dataQuality.yearRange.end}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Records:</span>
                  <span className="summary-value">{analysisResults.dataQuality.totalRecords}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="charts-settings">
        {(activeTab === 'network' || activeTab === 'both') && (
          <div className="network-settings">
            <h4>Network Settings</h4>
            <div className="settings-row">
              <div className="setting-group">
                <label>Similarity Threshold:</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={networkSettings.similarityThreshold}
                  onChange={(e) => updateNetworkSettings({ similarityThreshold: parseFloat(e.target.value) })}
                />
                <span>{(networkSettings.similarityThreshold * 100).toFixed(0)}%</span>
              </div>
              
              <div className="setting-group">
                <label>Max Connections:</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={networkSettings.maxConnections}
                  onChange={(e) => updateNetworkSettings({ maxConnections: parseInt(e.target.value) })}
                />
                <span>{networkSettings.maxConnections}</span>
              </div>

              <div className="setting-group">
                <label>Node Size:</label>
                <select
                  value={networkSettings.nodeSize}
                  onChange={(e) => updateNetworkSettings({ nodeSize: e.target.value })}
                >
                  <option value="totalSpending">Total Spending</option>
                  <option value="gdpGrowth">GDP Growth</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Color By:</label>
                <select
                  value={networkSettings.colorBy}
                  onChange={(e) => updateNetworkSettings({ colorBy: e.target.value })}
                >
                  <option value="region">Region</option>
                  <option value="performance">Performance</option>
                </select>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={networkSettings.showLabels}
                    onChange={(e) => updateNetworkSettings({ showLabels: e.target.checked })}
                  />
                  Show Labels
                </label>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'stream' || activeTab === 'both') && (
          <div className="stream-settings">
            <h4>Stream Settings</h4>
            <div className="settings-row">
              <div className="setting-group">
                <label>Interpolation:</label>
                <select
                  value={streamSettings.interpolation}
                  onChange={(e) => updateStreamSettings({ interpolation: e.target.value })}
                >
                  <option value="linear">Linear</option>
                  <option value="cardinal">Cardinal</option>
                  <option value="basis">Basis</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Offset:</label>
                <select
                  value={streamSettings.offset}
                  onChange={(e) => updateStreamSettings({ offset: e.target.value })}
                >
                  <option value="wiggle">Wiggle</option>
                  <option value="silhouette">Silhouette</option>
                  <option value="expand">Expand</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={streamSettings.showLegend}
                    onChange={(e) => updateStreamSettings({ showLegend: e.target.checked })}
                  />
                  Show Legend
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`charts-container ${activeTab}`}>
        {(activeTab === 'network' || activeTab === 'both') && (
          <div className="network-container">
            <NetworkGraph
              data={data}
              width={dimensions.networkWidth}
              height={dimensions.networkHeight}
              selectedYear={selectedYear}
              selectedCountries={selectedCountries}
              similarityThreshold={networkSettings.similarityThreshold}
              maxConnections={networkSettings.maxConnections}
              nodeSize={networkSettings.nodeSize}
              colorBy={networkSettings.colorBy}
              showLabels={networkSettings.showLabels}
              onNodeSelect={handleNetworkCountrySelect}
              onNodeHover={handleNetworkNodeHover}
            />
          </div>
        )}

        {(activeTab === 'stream' || activeTab === 'both') && (
          <div className="stream-container">
            <StreamGraph
              data={data}
              width={dimensions.streamWidth}
              height={dimensions.streamHeight}
              selectedCountries={selectedCountries}
              categories={streamSettings.categories}
              showLegend={streamSettings.showLegend}
              interpolation={streamSettings.interpolation}
              offset={streamSettings.offset}
              onCategoryToggle={handleCategoryToggle}
              onTimeHover={handleTimeHover}
            />
          </div>
        )}
      </div>

      {hoveredCountry && (
        <div className="country-details-panel">
          <h4>Country Details</h4>
          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">Country:</span>
              <span className="detail-value">{hoveredCountry.country}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Region:</span>
              <span className="detail-value">{hoveredCountry.region}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Spending:</span>
              <span className="detail-value">{hoveredCountry.totalSpending?.toFixed(2)}% of GDP</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">GDP Growth:</span>
              <span className="detail-value">{hoveredCountry.gdpGrowth?.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}

      {hoveredTime && (
        <div className="time-details-panel">
          <h4>Time Details</h4>
          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">Year:</span>
              <span className="detail-value">{hoveredTime.year}</span>
            </div>
            {hoveredTime.data && Object.entries(hoveredTime.data)
              .filter(([key]) => key !== 'year')
              .map(([category, value]) => (
                <div key={category} className="detail-row">
                  <span className="detail-label">{category}:</span>
                  <span className="detail-value">{value?.toFixed(2)}% of GDP</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {analysisResults && (
        <div className="analysis-panel">
          <h4>Analysis Results</h4>
          <div className="analysis-content">
            <div className="analysis-section">
              <h5>Correlation Analysis</h5>
              <div className="analysis-stats">
                <div className="stat-item">
                  <span className="stat-label">Valid Groups:</span>
                  <span className="stat-value">{analysisResults.correlations.overall?.validGroups || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Correlation:</span>
                  <span className="stat-value">
                    {analysisResults.correlations.overall?.averageCorrelation?.toFixed(3) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="analysis-section">
              <h5>Trend Analysis</h5>
              <div className="analysis-stats">
                <div className="stat-item">
                  <span className="stat-label">Countries Analyzed:</span>
                  <span className="stat-value">{analysisResults.trends.overall?.validGroups || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Increasing Trends:</span>
                  <span className="stat-value">{analysisResults.trends.overall?.spendingTrends?.increasing || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Decreasing Trends:</span>
                  <span className="stat-value">{analysisResults.trends.overall?.spendingTrends?.decreasing || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedNetworkTemporalCharts