import { useEffect, useRef, useState, useMemo } from 'react'
import { 
  initializeSpendingMap,
  handleZoomIn as mapZoomIn,
  handleZoomOut as mapZoomOut,
  handleResetZoom as mapResetZoom,
  zoomToCountry
} from '../services/SpendingMapService.js'
import { formatWithBothCurrencies } from '../utils/currencyMapping.js'
import { formatSpendingValue } from '../utils/formatUtils.js'
import '../styles/SpendingWorldMap.css'

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
  const [tooltip, setTooltip] = useState({ visible: false, data: null, x: 0, y: 0 })

  const handleCountryHover = (data) => {
    setTooltip({ visible: true, data, x: data.x, y: data.y })
  }

  const handleCountryHoverEnd = () => {
    setTooltip({ visible: false, data: null, x: 0, y: 0 })
  }

  // Create a stable key for when map should re-render
  const mapKey = useMemo(() => {
    return JSON.stringify({
      indicator: spendingData?.indicator || spendingData?.name,
      category: spendingData?.category,
      countriesCount: spendingData?.countries ? Object.keys(spendingData.countries).length : 0,
      hasGlobalStats: !!spendingData?.globalStats,
      yearRange: filters?.yearRange,
      regions: filters?.regions,
      sectors: filters?.sectors,
      valueRange: filters?.valueRange,
      visualizationMode: filters?.visualizationMode
    })
  }, [
    spendingData?.indicator,
    spendingData?.name,
    spendingData?.category,
    spendingData?.countries,
    spendingData?.globalStats,
    filters?.yearRange,
    filters?.regions,
    filters?.sectors,
    filters?.valueRange,
    filters?.visualizationMode
  ])

  useEffect(() => {
    // Only render map when we have complete data
    if (worldData && spendingData?.countries && colorScale) {
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
          onCountryClick: onCountrySelect,
          onCountryHover: handleCountryHover,
          onCountryHoverEnd: handleCountryHoverEnd
        }
      )
    }
  }, [mapKey, worldData, spendingData, colorScale, selectedCountry])

  useEffect(() => {
    if (selectedCountry && worldData && zoomRef.current) {
      zoomToCountry(svgRef, zoomRef, worldData, selectedCountry.name)
    }
  }, [selectedCountry, worldData])

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
    return null
  }

  return (
    <div className={`spending-world-map ${className}`}>
      <div className="map-svg-container">
        <svg ref={svgRef} className="world-map-svg bordered">
          <g ref={gRef}></g>
        </svg>
      </div>

      <div className="map-controls" role="group" aria-label="Map zoom controls">
        <button 
          onClick={handleZoomIn}
          className="zoom-button zoom-in"
          title="Zoom In"
          aria-label="Zoom in on map"
        >
          +
        </button>
        <button 
          onClick={handleZoomOut}
          className="zoom-button zoom-out"
          title="Zoom Out"
          aria-label="Zoom out on map"
        >
          −
        </button>
        <button 
          onClick={handleResetZoom}
          className="zoom-button reset-zoom"
          title="Reset Zoom"
          aria-label="Reset map zoom to default view"
        >
          🌍
        </button>
      </div>

      <div className={`map-info-panel ${isInfoPanelExpanded ? 'expanded' : 'collapsed'}`}>
        <button 
          className="info-toggle"
          onClick={toggleInfoPanel}
          title={isInfoPanelExpanded ? 'Hide Info' : 'Show Info'}
          aria-label={isInfoPanelExpanded ? 'Hide map information panel' : 'Show map information panel'}
          aria-expanded={isInfoPanelExpanded}
          aria-controls="map-info-content"
        >
          <span className="info-icon" aria-hidden="true">ℹ️</span>
          {isInfoPanelExpanded && <span className="info-text">Info</span>}
          <span className="toggle-arrow" aria-hidden="true">{isInfoPanelExpanded ? '▼' : '▲'}</span>
        </button>

        {isInfoPanelExpanded && (
          <div className="info-content" id="map-info-content" role="region" aria-label="Map information">
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
                  <strong>Average:</strong> {formatSpendingValue(spendingData.globalStats.avgSpending)}
                </p>
                <p className="info-item">
                  <strong>Range:</strong> {formatSpendingValue(spendingData.globalStats.minSpending)} - {formatSpendingValue(spendingData.globalStats.maxSpending)}
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

      {/* Hover Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div 
          className="map-tooltip"
          style={{
            position: 'fixed',
            left: `${Math.min(tooltip.x + 15, window.innerWidth - 300)}px`,
            top: `${Math.min(Math.max(tooltip.y - 10, 10), window.innerHeight - 150)}px`,
            pointerEvents: 'none',
            zIndex: 10000
          }}
        >
          <div className="tooltip-header">
            <strong>{tooltip.data.name}</strong>
          </div>
          <div className="tooltip-body">
            {tooltip.data.hasData ? (
              <>
                <div className="tooltip-row">
                  <span className="label">Indicator:</span>
                  <span className="value">{tooltip.data.indicatorName}</span>
                </div>
                <div className="tooltip-row highlight">
                  <span className="label">Avg Value:</span>
                  <span className="value">
                    {tooltip.data.spending !== null 
                      ? formatWithBothCurrencies(
                          tooltip.data.spending, 
                          tooltip.data.spendingUSD, 
                          tooltip.data.code, 
                          tooltip.data.name
                        )
                      : 'N/A'}
                  </span>
                </div>
                {tooltip.data.spendingUSD !== null && tooltip.data.spendingUSD > 0 && (
                  <div className="tooltip-row note">
                    <span className="label" style={{ fontSize: '0.85em', color: '#666' }}>
                      USD: {formatSpendingValue(tooltip.data.spendingUSD)}
                    </span>
                  </div>
                )}
                {tooltip.data.spendingUSD === 0 && (
                  <div className="tooltip-row note">
                    <span className="label" style={{ fontSize: '0.85em', color: '#f59e0b', fontStyle: 'italic' }}>
                      ⚠️ No data for selected year range
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="tooltip-row">
                <span className="no-data" style={{ color: '#999', fontStyle: 'italic' }}>
                  No data available for this indicator
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SpendingWorldMap