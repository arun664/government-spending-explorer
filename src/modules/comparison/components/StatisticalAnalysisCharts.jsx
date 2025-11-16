/**
 * StatisticalAnalysisCharts Component
 * 
 * Main component that combines CorrelationHeatmap and ParallelCoordinates
 * for comprehensive statistical analysis and pattern discovery.
 * 
 * Requirements addressed:
 * - Advanced statistical visualizations for pattern discovery
 * - Interactive drill-down capabilities
 * - Color gradients showing correlation strength and data patterns
 * - Multi-dimensional country comparisons with filtering
 */

import React, { useState, useCallback } from 'react'
import CorrelationHeatmap from './CorrelationHeatmap.jsx'
import ParallelCoordinates from './ParallelCoordinates.jsx'
import '../styles/CorrelationHeatmap.css'
import '../styles/ParallelCoordinates.css'
import '../styles/StatisticalAnalysisCharts.css'

const StatisticalAnalysisCharts = ({ 
  initialSelectedCountries = [],
  initialYearRange = [2000, 2020],
  onAnalysisUpdate = () => {}
}) => {
  const [selectedCountries, setSelectedCountries] = useState(initialSelectedCountries)
  const [yearRange, setYearRange] = useState(initialYearRange)
  const [activeView, setActiveView] = useState('both') // 'heatmap', 'parallel', 'both'
  const [analysisMode, setAnalysisMode] = useState('correlation') // 'correlation', 'patterns', 'comparison'
  const [filteredData, setFilteredData] = useState(null)
  const [correlationData, setCorrelationData] = useState(null)

  // Handle country selection from either visualization
  const handleCountrySelect = useCallback((countries) => {
    const newSelection = Array.isArray(countries) ? countries : [countries]
    setSelectedCountries(prev => {
      // Add new countries to selection, avoiding duplicates
      const combined = [...new Set([...prev, ...newSelection])]
      return combined
    })
    onAnalysisUpdate({ selectedCountries: newSelection, yearRange, analysisMode })
  }, [yearRange, analysisMode, onAnalysisUpdate])

  // Handle correlation selection from heatmap
  const handleCorrelationSelect = useCallback((correlationInfo) => {
    setCorrelationData(correlationInfo)
    // Auto-select the two countries involved in the correlation
    if (correlationInfo.country1 && correlationInfo.country2) {
      handleCountrySelect([correlationInfo.country1, correlationInfo.country2])
    }
  }, [handleCountrySelect])

  // Handle filter changes from parallel coordinates
  const handleFilterChange = useCallback((filtered) => {
    setFilteredData(filtered)
    onAnalysisUpdate({ filteredData: filtered, selectedCountries, yearRange, analysisMode })
  }, [selectedCountries, yearRange, analysisMode, onAnalysisUpdate])

  // Handle year range changes
  const handleYearRangeChange = useCallback((newRange) => {
    setYearRange(newRange)
    onAnalysisUpdate({ selectedCountries, yearRange: newRange, analysisMode })
  }, [selectedCountries, analysisMode, onAnalysisUpdate])

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedCountries([])
    setFilteredData(null)
    setCorrelationData(null)
    onAnalysisUpdate({ selectedCountries: [], yearRange, analysisMode })
  }, [yearRange, analysisMode, onAnalysisUpdate])

  // Remove specific country from selection
  const removeCountry = useCallback((countryToRemove) => {
    setSelectedCountries(prev => prev.filter(country => country !== countryToRemove))
  }, [])

  return (
    <div className="statistical-analysis-charts">
      {/* Header and Controls */}
      <div className="analysis-header">
        <div className="header-content">
          <h2>Statistical Analysis & Pattern Discovery</h2>
          <p>Explore correlations and multi-dimensional patterns in government spending and GDP data</p>
        </div>
        
        <div className="analysis-controls">
          {/* View Toggle */}
          <div className="view-toggle">
            <label>View:</label>
            <div className="toggle-buttons">
              <button 
                className={activeView === 'heatmap' ? 'active' : ''}
                onClick={() => setActiveView('heatmap')}
              >
                Correlation Heatmap
              </button>
              <button 
                className={activeView === 'parallel' ? 'active' : ''}
                onClick={() => setActiveView('parallel')}
              >
                Parallel Coordinates
              </button>
              <button 
                className={activeView === 'both' ? 'active' : ''}
                onClick={() => setActiveView('both')}
              >
                Both Views
              </button>
            </div>
          </div>

          {/* Analysis Mode */}
          <div className="analysis-mode">
            <label>Analysis Mode:</label>
            <select 
              value={analysisMode} 
              onChange={(e) => setAnalysisMode(e.target.value)}
            >
              <option value="correlation">Correlation Analysis</option>
              <option value="patterns">Pattern Discovery</option>
              <option value="comparison">Country Comparison</option>
            </select>
          </div>

          {/* Year Range */}
          <div className="year-range-control">
            <label>Year Range:</label>
            <div className="year-inputs">
              <input
                type="number"
                min="1990"
                max="2023"
                value={yearRange[0]}
                onChange={(e) => handleYearRangeChange([parseInt(e.target.value), yearRange[1]])}
              />
              <span>to</span>
              <input
                type="number"
                min="1990"
                max="2023"
                value={yearRange[1]}
                onChange={(e) => handleYearRangeChange([yearRange[0], parseInt(e.target.value)])}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Countries Display */}
      {selectedCountries.length > 0 && (
        <div className="selected-countries-panel">
          <div className="panel-header">
            <h3>Selected Countries ({selectedCountries.length})</h3>
            <button onClick={clearSelections} className="clear-all-btn">
              Clear All
            </button>
          </div>
          <div className="country-tags">
            {selectedCountries.map(country => (
              <div key={country} className="country-tag">
                <span>{country}</span>
                <button onClick={() => removeCountry(country)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlation Details Panel */}
      {correlationData && (
        <div className="correlation-insights-panel">
          <div className="panel-header">
            <h3>Correlation Insights</h3>
            <button onClick={() => setCorrelationData(null)}>×</button>
          </div>
          <div className="insights-content">
            <div className="correlation-summary">
              <h4>{correlationData.country1} ↔ {correlationData.country2}</h4>
              <div className="correlation-strength">
                <div className="strength-indicator">
                  <div 
                    className="strength-bar"
                    style={{ 
                      width: `${Math.abs(correlationData.correlation || 0) * 100}%`,
                      backgroundColor: correlationData.correlation > 0 ? '#28a745' : '#dc3545'
                    }}
                  ></div>
                </div>
                <span className="strength-value">
                  {correlationData.correlation?.toFixed(3) || 'N/A'}
                </span>
              </div>
              <div className="correlation-interpretation">
                <p><strong>Interpretation:</strong> {getCorrelationInterpretation(correlationData)}</p>
                <p><strong>Significance:</strong> {correlationData.significance?.replace('_', ' ')}</p>
                <p><strong>Based on:</strong> {correlationData.dataPoints} data points</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      {filteredData && (
        <div className="analysis-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <label>Countries in Analysis</label>
              <span>{filteredData.length}</span>
            </div>
            <div className="stat-item">
              <label>Selected Countries</label>
              <span>{selectedCountries.length}</span>
            </div>
            <div className="stat-item">
              <label>Analysis Period</label>
              <span>{yearRange[0]} - {yearRange[1]}</span>
            </div>
            <div className="stat-item">
              <label>Analysis Mode</label>
              <span>{analysisMode.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Visualizations */}
      <div className={`visualizations-container ${activeView}`}>
        {(activeView === 'heatmap' || activeView === 'both') && (
          <div className="visualization-panel heatmap-panel">
            <CorrelationHeatmap
              width={activeView === 'both' ? 600 : 1000}
              height={activeView === 'both' ? 500 : 600}
              selectedCountries={selectedCountries}
              yearRange={yearRange}
              onCountrySelect={handleCountrySelect}
              onCorrelationSelect={handleCorrelationSelect}
            />
          </div>
        )}

        {(activeView === 'parallel' || activeView === 'both') && (
          <div className="visualization-panel parallel-panel">
            <ParallelCoordinates
              width={activeView === 'both' ? 600 : 1000}
              height={activeView === 'both' ? 500 : 600}
              selectedCountries={selectedCountries}
              yearRange={yearRange}
              onCountrySelect={handleCountrySelect}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
      </div>

      {/* Analysis Tips */}
      <div className="analysis-tips">
        <h4>Analysis Tips</h4>
        <div className="tips-grid">
          <div className="tip-item">
            <h5>Correlation Heatmap</h5>
            <ul>
              <li>Darker colors indicate stronger correlations</li>
              <li>Red indicates negative correlation, blue indicates positive</li>
              <li>Click cells to see detailed correlation analysis</li>
              <li>Use for identifying similar economic patterns between countries</li>
            </ul>
          </div>
          <div className="tip-item">
            <h5>Parallel Coordinates</h5>
            <ul>
              <li>Each line represents one country across multiple dimensions</li>
              <li>Brush (click and drag) on axes to filter countries</li>
              <li>Drag axis titles to reorder dimensions</li>
              <li>Use for multi-dimensional pattern discovery</li>
            </ul>
          </div>
          <div className="tip-item">
            <h5>Combined Analysis</h5>
            <ul>
              <li>Use both views together for comprehensive analysis</li>
              <li>Start with heatmap to identify interesting correlations</li>
              <li>Use parallel coordinates to explore multi-dimensional patterns</li>
              <li>Select countries in one view to highlight in the other</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to interpret correlation strength
const getCorrelationInterpretation = (correlationData) => {
  if (!correlationData.correlation) return 'No correlation data available'
  
  const abs = Math.abs(correlationData.correlation)
  const direction = correlationData.correlation > 0 ? 'positive' : 'negative'
  
  let strength = ''
  if (abs >= 0.8) strength = 'very strong'
  else if (abs >= 0.6) strength = 'strong'
  else if (abs >= 0.4) strength = 'moderate'
  else if (abs >= 0.2) strength = 'weak'
  else strength = 'very weak'
  
  return `${strength} ${direction} correlation between economic patterns`
}

export default StatisticalAnalysisCharts