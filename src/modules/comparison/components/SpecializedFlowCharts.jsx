/**
 * SpecializedFlowCharts Component
 * 
 * Main component that combines SankeyDiagram, RadarChart, and TreemapChart
 * for comprehensive flow and hierarchical analysis.
 * 
 * Requirements addressed:
 * - Specialized visualizations for flow and hierarchical analysis
 * - Interactive node selection and smooth transitions
 * - Detailed tooltips and drill-down capabilities
 * - Cross-chart interactions and synchronized selections
 */

import React, { useState, useCallback } from 'react'
import SankeyDiagram from './SankeyDiagram.jsx'
import TreemapChart from './TreemapChart.jsx'
import '../styles/SpecializedCharts.css'

const SpecializedFlowCharts = ({ 
  initialSelectedCountries = [],
  initialSelectedYear = null,
  onAnalysisUpdate = () => {}
}) => {
  const [selectedCountries, setSelectedCountries] = useState(initialSelectedCountries)
  const [selectedYear, setSelectedYear] = useState(initialSelectedYear)
  const [activeView, setActiveView] = useState('all') // 'sankey', 'radar', 'treemap', 'all'
  const [analysisMode, setAnalysisMode] = useState('flow') // 'flow', 'profile', 'hierarchy'
  const [selectedNodes, setSelectedNodes] = useState(new Set())
  const [overlayCountries, setOverlayCountries] = useState(new Set())
  const [drillDownPath, setDrillDownPath] = useState([])

  // Handle country selection from any visualization
  const handleCountrySelect = useCallback((countryInfo) => {
    const countryName = typeof countryInfo === 'string' ? countryInfo : countryInfo.country
    
    setSelectedCountries(prev => {
      const newSelection = prev.includes(countryName) 
        ? prev.filter(c => c !== countryName)
        : [...prev, countryName]
      
      onAnalysisUpdate({ 
        selectedCountries: newSelection, 
        selectedYear, 
        analysisMode,
        action: 'country_select',
        country: countryName
      })
      
      return newSelection
    })
  }, [selectedYear, analysisMode, onAnalysisUpdate])

  // Handle radar chart country overlay
  const handleRadarCountrySelect = useCallback((countryInfo) => {
    const countryName = countryInfo.country
    
    setOverlayCountries(prev => {
      const newOverlay = new Set(prev)
      if (countryInfo.overlaid) {
        newOverlay.add(countryName)
      } else {
        newOverlay.delete(countryName)
      }
      
      onAnalysisUpdate({ 
        selectedCountries, 
        selectedYear, 
        analysisMode,
        action: 'overlay_toggle',
        country: countryName,
        overlaid: countryInfo.overlaid
      })
      
      return newOverlay
    })
  }, [selectedCountries, selectedYear, analysisMode, onAnalysisUpdate])

  // Handle Sankey node selection
  const handleSankeyNodeSelect = useCallback((nodeInfo) => {
    setSelectedNodes(prev => {
      const newSelected = new Set(prev)
      if (nodeInfo.selected) {
        newSelected.add(nodeInfo.name)
      } else {
        newSelected.delete(nodeInfo.name)
      }
      
      onAnalysisUpdate({ 
        selectedCountries, 
        selectedYear, 
        analysisMode,
        action: 'node_select',
        node: nodeInfo.name,
        nodeType: nodeInfo.type
      })
      
      return newSelected
    })
  }, [selectedCountries, selectedYear, analysisMode, onAnalysisUpdate])

  // Handle Sankey link selection
  const handleSankeyLinkSelect = useCallback((linkInfo) => {
    onAnalysisUpdate({ 
      selectedCountries, 
      selectedYear, 
      analysisMode,
      action: 'link_select',
      source: linkInfo.source,
      target: linkInfo.target,
      value: linkInfo.value
    })
  }, [selectedCountries, selectedYear, analysisMode, onAnalysisUpdate])

  // Handle Treemap drill down
  const handleTreemapDrillDown = useCallback((drillInfo) => {
    setDrillDownPath(prev => [...prev, drillInfo])
    
    onAnalysisUpdate({ 
      selectedCountries, 
      selectedYear, 
      analysisMode,
      action: 'drill_down',
      level: drillInfo.level,
      name: drillInfo.name
    })
  }, [selectedCountries, selectedYear, analysisMode, onAnalysisUpdate])

  // Handle Treemap node selection
  const handleTreemapNodeSelect = useCallback((nodeInfo) => {
    onAnalysisUpdate({ 
      selectedCountries, 
      selectedYear, 
      analysisMode,
      action: 'treemap_select',
      node: nodeInfo.name,
      nodeType: nodeInfo.type,
      value: nodeInfo.value
    })
  }, [selectedCountries, selectedYear, analysisMode, onAnalysisUpdate])

  // Handle radar axis selection
  const handleRadarAxisSelect = useCallback((axisInfo) => {
    onAnalysisUpdate({ 
      selectedCountries, 
      selectedYear, 
      analysisMode,
      action: 'axis_select',
      axis: axisInfo.axis,
      selected: axisInfo.selected
    })
  }, [selectedCountries, selectedYear, analysisMode, onAnalysisUpdate])

  // Handle year change
  const handleYearChange = useCallback((newYear) => {
    setSelectedYear(newYear)
    onAnalysisUpdate({ 
      selectedCountries, 
      selectedYear: newYear, 
      analysisMode,
      action: 'year_change'
    })
  }, [selectedCountries, analysisMode, onAnalysisUpdate])

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelectedCountries([])
    setSelectedNodes(new Set())
    setOverlayCountries(new Set())
    setDrillDownPath([])
    onAnalysisUpdate({ 
      selectedCountries: [], 
      selectedYear, 
      analysisMode,
      action: 'clear_all'
    })
  }, [selectedYear, analysisMode, onAnalysisUpdate])

  // Remove specific country
  const removeCountry = useCallback((countryToRemove) => {
    setSelectedCountries(prev => prev.filter(country => country !== countryToRemove))
    setOverlayCountries(prev => {
      const newOverlay = new Set(prev)
      newOverlay.delete(countryToRemove)
      return newOverlay
    })
  }, [])

  // Get chart dimensions based on active view
  const getChartDimensions = () => {
    switch (activeView) {
      case 'sankey':
      case 'radar':
      case 'treemap':
        return { width: 1000, height: 700 }
      case 'all':
        return { width: 600, height: 500 }
      default:
        return { width: 800, height: 600 }
    }
  }

  const dimensions = getChartDimensions()

  return (
    <div className="specialized-flow-charts">
      {/* Header and Controls */}
      <div className="analysis-header">
        <div className="header-content">
          <h2>Flow & Hierarchical Analysis</h2>
          <p>Explore spending flows, country profiles, and hierarchical distributions</p>
        </div>
        
        <div className="analysis-controls">
          {/* View Toggle */}
          <div className="view-toggle">
            <label>View:</label>
            <div className="toggle-buttons">
              <button 
                className={activeView === 'sankey' ? 'active' : ''}
                onClick={() => setActiveView('sankey')}
              >
                Sankey Flow
              </button>
              <button 
                className={activeView === 'radar' ? 'active' : ''}
                onClick={() => setActiveView('radar')}
              >
                Radar Profiles
              </button>
              <button 
                className={activeView === 'treemap' ? 'active' : ''}
                onClick={() => setActiveView('treemap')}
              >
                Treemap Hierarchy
              </button>
              <button 
                className={activeView === 'all' ? 'active' : ''}
                onClick={() => setActiveView('all')}
              >
                All Views
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
              <option value="flow">Flow Analysis</option>
              <option value="profile">Profile Comparison</option>
              <option value="hierarchy">Hierarchical Breakdown</option>
            </select>
          </div>

          {/* Year Selection */}
          <div className="year-control">
            <label>Year:</label>
            <select 
              value={selectedYear || ''} 
              onChange={(e) => handleYearChange(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Years</option>
              {Array.from({ length: 24 }, (_, i) => 2000 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Countries Display */}
      {selectedCountries.length > 0 && (
        <div className="selected-countries-panel">
          <div className="panel-header">
            <h3>Selected Countries ({selectedCountries.length})</h3>
            <button onClick={clearAllSelections} className="clear-all-btn">
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

      {/* Analysis Summary */}
      <div className="analysis-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <label>Selected Countries</label>
            <span>{selectedCountries.length}</span>
          </div>
          <div className="stat-item">
            <label>Overlay Countries</label>
            <span>{overlayCountries.size}</span>
          </div>
          <div className="stat-item">
            <label>Selected Nodes</label>
            <span>{selectedNodes.size}</span>
          </div>
          <div className="stat-item">
            <label>Analysis Year</label>
            <span>{selectedYear || 'All Years'}</span>
          </div>
          <div className="stat-item">
            <label>Analysis Mode</label>
            <span>{analysisMode.replace('_', ' ')}</span>
          </div>
          <div className="stat-item">
            <label>Drill Down Level</label>
            <span>{drillDownPath.length}</span>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className={`visualizations-container ${activeView}`}>
        {(activeView === 'sankey' || activeView === 'all') && (
          <div className="visualization-panel sankey-panel">
            <h3>GDP to Spending Category Flow</h3>
            <SankeyDiagram
              width={dimensions.width}
              height={dimensions.height}
              selectedCountries={selectedCountries}
              selectedYear={selectedYear}
              onNodeSelect={handleSankeyNodeSelect}
              onLinkSelect={handleSankeyLinkSelect}
            />
          </div>
        )}

        {(activeView === 'radar' || activeView === 'all') && (
          <div className="visualization-panel radar-panel">
            <h3>Country Spending Profile Comparison</h3>
            <RadarChart
              width={dimensions.width}
              height={dimensions.height}
              selectedCountries={selectedCountries}
              selectedYear={selectedYear}
              onCountrySelect={handleRadarCountrySelect}
              onAxisSelect={handleRadarAxisSelect}
              maxCountries={activeView === 'all' ? 3 : 5}
            />
          </div>
        )}

        {(activeView === 'treemap' || activeView === 'all') && (
          <div className="visualization-panel treemap-panel">
            <h3>Hierarchical Spending Distribution</h3>
            <TreemapChart
              width={dimensions.width}
              height={dimensions.height}
              selectedCountries={selectedCountries}
              selectedYear={selectedYear}
              onNodeSelect={handleTreemapNodeSelect}
              onDrillDown={handleTreemapDrillDown}
            />
          </div>
        )}
      </div>

      {/* Analysis Insights */}
      <div className="analysis-insights">
        <h4>Analysis Insights</h4>
        <div className="insights-grid">
          <div className="insight-item">
            <h5>Flow Analysis (Sankey)</h5>
            <ul>
              <li>Visualizes GDP allocation to spending categories</li>
              <li>Link thickness represents flow magnitude</li>
              <li>Click nodes to highlight connected flows</li>
              <li>Hover for detailed flow information</li>
            </ul>
          </div>
          <div className="insight-item">
            <h5>Profile Comparison (Radar)</h5>
            <ul>
              <li>Compare spending profiles across multiple dimensions</li>
              <li>Overlay countries for direct comparison</li>
              <li>Click axis labels to filter dimensions</li>
              <li>Larger areas indicate higher spending percentages</li>
            </ul>
          </div>
          <div className="insight-item">
            <h5>Hierarchical Breakdown (Treemap)</h5>
            <ul>
              <li>Rectangle size represents spending amount</li>
              <li>Click to drill down into subcategories</li>
              <li>Use breadcrumb navigation to go back</li>
              <li>Color coding shows category relationships</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Features Guide */}
      <div className="features-guide">
        <h4>Interactive Features</h4>
        <div className="features-list">
          <div className="feature-group">
            <h5>Cross-Chart Interactions</h5>
            <ul>
              <li>Selections in one chart highlight related data in others</li>
              <li>Country selections synchronize across all visualizations</li>
              <li>Year filtering applies to all charts simultaneously</li>
            </ul>
          </div>
          <div className="feature-group">
            <h5>Advanced Navigation</h5>
            <ul>
              <li>Drill down in treemap to explore spending subcategories</li>
              <li>Overlay multiple countries in radar chart for comparison</li>
              <li>Filter by spending categories using Sankey node selection</li>
            </ul>
          </div>
          <div className="feature-group">
            <h5>Analysis Modes</h5>
            <ul>
              <li><strong>Flow Analysis:</strong> Focus on spending allocation patterns</li>
              <li><strong>Profile Comparison:</strong> Compare country spending profiles</li>
              <li><strong>Hierarchical Breakdown:</strong> Explore detailed category structures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpecializedFlowCharts