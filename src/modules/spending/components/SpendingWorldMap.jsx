import { useEffect, useRef, useState } from 'react'
import { 
  initializeSpendingMap,
  handleZoomIn as mapZoomIn,
  handleZoomOut as mapZoomOut,
  handleResetZoom as mapResetZoom
} from '../services/SpendingMapService.js'
import '../styles/SpendingWorldMap.css'

/**
 * Dedicated WorldMap component for Government Spending Analysis
 * 
 * Features:
 * - Interactive world map with spending data visualization
 * - Color-coded countries based on government spending levels
 * - Zoom and pan functionality
 * - Country selection and tooltips
 * - Responsive design
 */
const SpendingWorldMap = ({ 
  worldData,
  spendingData, 
  colorScale,
  filters,
  selectedCountry,
  onCountrySelect,
  className = ""
}) => {
  const svgRef = useRef()
  const gRef = useRef()
  const zoomRef = useRef()

  const [isInfoPanelExpanded, setIsInfoPanelExpanded] = useState(false)

  // Initialize map when data is available
  useEffect(() => {
    if (worldData && spendingData && colorScale) {
      initializeSpendingMap(
        svgRef,
        gRef,
        zoomRef,
        worldData,
        spendingData,
        colorScale,
        filters,
        {
          selectedCountry,
          onCountryClick: onCountrySelect
        }
      )
    }
  }, [worldData, spendingData, colorScale, filters, selectedCountry, onCountrySelect])

  const handleZoomIn = () => {
    mapZoomIn(svgRef, zoomRef)
  }

  const handleZoomOut = () => {
    mapZoomOut(svgRef, zoomRef)
  }

  const handleResetZoom = () => {
    mapResetZoom(svgRef, zoomRef)
  }



  const toggleInfoPanel = () => {
    setIsInfoPanelExpanded(!isInfoPanelExpanded)
  }

  if (!worldData || !spendingData || !colorScale) {
    return (
      <div className={`spending-world-map loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading world map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`spending-world-map ${className}`}>
      {/* Map Container - Proper container for SVG positioning */}
      <div className="map-svg-container">
        <svg ref={svgRef} className="world-map-svg bordered">
          <g ref={gRef}></g>
        </svg>
      </div>

      {/* Map Controls - Horizontal at bottom right */}
      <div className="map-controls">
        <button 
          onClick={handleZoomIn}
          className="zoom-button zoom-in"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={handleZoomOut}
          className="zoom-button zoom-out"
          title="Zoom Out"
        >
          −
        </button>
        <button 
          onClick={handleResetZoom}
          className="zoom-button reset-zoom"
          title="Reset Zoom"
        >
          🌍
        </button>
      </div>



      {/* Info Panel - Bottom Right */}
      <div className={`map-info-panel ${isInfoPanelExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Info Panel Toggle Button */}
        <button 
          className="info-toggle"
          onClick={toggleInfoPanel}
          title={isInfoPanelExpanded ? 'Hide Info' : 'Show Info'}
        >
          <span className="info-icon">ℹ️</span>
          {isInfoPanelExpanded && <span className="info-text">Info</span>}
          <span className="toggle-arrow">{isInfoPanelExpanded ? '▼' : '▲'}</span>
        </button>

        {/* Info Panel Content - Only show when expanded */}
        {isInfoPanelExpanded && (
          <div className="info-content">
            <h4>Map Information</h4>
            
            <div className="info-section">
              <h5>Data Coverage</h5>
              <p className="info-item">
                <strong>Countries:</strong> {spendingData.globalStats?.totalCountries || 'N/A'}
              </p>
              <p className="info-item">
                <strong>Period:</strong> {filters.yearRange[0]}-{filters.yearRange[1]}
              </p>
              <p className="info-item">
                <strong>Data Points:</strong> {spendingData.globalStats?.totalDataPoints || 'N/A'}
              </p>
            </div>

            {spendingData.globalStats && (
              <div className="info-section">
                <h5>Statistics</h5>
                <p className="info-item">
                  <strong>Average:</strong> {spendingData.globalStats.avgSpending.toFixed(2)}M USD
                </p>
                <p className="info-item">
                  <strong>Range:</strong> {spendingData.globalStats.minSpending.toFixed(2)}M - {spendingData.globalStats.maxSpending.toFixed(2)}M USD
                </p>
              </div>
            )}

            <div className="info-section">
              <h5>Interaction</h5>
              <p className="info-note">
                • Click countries to view details<br/>
                • Use zoom controls to navigate<br/>
                • Hover for quick information
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SpendingWorldMap