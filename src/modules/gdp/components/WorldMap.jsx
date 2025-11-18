import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { getCountryRegion } from '../utils/regionMapping.js'
import '../styles/WorldMap.css'

const WorldMap = ({ 
  selectedCountry = null, 
  onCountryClick = null,
  width = 800,
  height = 500,
  className = ""
}) => {
  const svgRef = useRef(null)
  const [worldData, setWorldData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load world topology data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        setIsLoading(true)
        // Using a public world topology dataset
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        if (!response.ok) {
          throw new Error('Failed to load world map data')
        }
        const world = await response.json()
        setWorldData(world)
        setError(null)
      } catch (err) {
        console.error('Error loading world data:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorldData()
  }, [])

  // Initialize and update map
  useEffect(() => {
    if (!worldData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove() // Clear previous content

    // Set up projection and path
    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.5)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        svg.select('.map-group')
          .attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create main group for map elements
    const mapGroup = svg.append('g').attr('class', 'map-group')

    // Convert topology to features
    const countries = topojson.feature(worldData, worldData.objects.countries)

    // Draw countries
    mapGroup.selectAll('.country')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', (d) => {
        const region = getCountryRegion(d.id)
        return getRegionColor(region)
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        // Hover effect - brighten country
        const currentFill = d3.select(this).attr('fill')
        d3.select(this)
          .attr('data-original-fill', currentFill)
          .attr('fill', d3.color(currentFill).brighter(0.3))
          .attr('stroke', '#333333')
          .attr('stroke-width', 2)
      })
      .on('mouseleave', function(event, d) {
        // Restore original appearance
        const originalFill = d3.select(this).attr('data-original-fill')
        d3.select(this)
          .attr('fill', originalFill)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 0.5)
      })
      .on('click', function(event, d) {
        // Handle country selection
        if (onCountryClick) {
          const countryData = {
            countryCode: d.id,
            countryName: d.properties.name || 'Unknown',
            region: getCountryRegion(d.id)
          }
          onCountryClick(countryData)
        }
      })

    // Store zoom and projection for external access
    svg.node().zoom = zoom
    svg.node().projection = projection
    svg.node().path = path

  }, [worldData, width, height, onCountryClick])

  // Handle selected country zoom with smooth animation (750ms)
  // Requirements: 10.3, 10.5 - Zoom to country when selected from search
  useEffect(() => {
    if (!selectedCountry || !worldData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    const zoom = svg.node().zoom
    const projection = svg.node().projection
    const path = svg.node().path

    if (!zoom || !projection || !path) return

    // Find the country feature by code or name
    const countries = topojson.feature(worldData, worldData.objects.countries)
    const countryFeature = countries.features.find(d => {
      const featureName = d.properties.name || 'Unknown'
      return d.id === selectedCountry.countryCode || 
             d.properties.name === selectedCountry.countryName ||
             featureName === selectedCountry.name
    })

    if (countryFeature) {
      // Calculate bounds and zoom to country
      const bounds = path.bounds(countryFeature)
      const dx = bounds[1][0] - bounds[0][0]
      const dy = bounds[1][1] - bounds[0][1]
      const x = (bounds[0][0] + bounds[1][0]) / 2
      const y = (bounds[0][1] + bounds[1][1]) / 2
      const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height))
      const translate = [width / 2 - scale * x, height / 2 - scale * y]

      // Animate zoom with 750ms duration (Requirement 10.5)
      svg.transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        )

      // Highlight selected country (Requirement 10.3) - Change fill color to bright orange
      svg.selectAll('.country')
        .classed('selected', d => {
          const featureName = d.properties.name || 'Unknown'
          return d.id === selectedCountry.countryCode || 
                 d.properties.name === selectedCountry.countryName ||
                 featureName === selectedCountry.name
        })
        .attr('fill', d => {
          const featureName = d.properties.name || 'Unknown'
          const isSelected = d.id === selectedCountry.countryCode || 
                            d.properties.name === selectedCountry.countryName ||
                            featureName === selectedCountry.name
          if (isSelected) {
            return '#FF6B00' // Bright orange for selected country
          }
          // Keep original region color for non-selected
          const region = getCountryRegion(d.id)
          return getRegionColor(region)
        })
        .attr('stroke', d => {
          const featureName = d.properties.name || 'Unknown'
          const isSelected = d.id === selectedCountry.countryCode || 
                            d.properties.name === selectedCountry.countryName ||
                            featureName === selectedCountry.name
          return isSelected ? '#CC5500' : '#ffffff'
        })
        .attr('stroke-width', d => {
          const featureName = d.properties.name || 'Unknown'
          const isSelected = d.id === selectedCountry.countryCode || 
                            d.properties.name === selectedCountry.countryName ||
                            featureName === selectedCountry.name
          return isSelected ? 3 : 0.5
        })
    }
  }, [selectedCountry, worldData, width, height])

  // Get region-based colors
  const getRegionColor = (region) => {
    const colors = {
      'Africa': '#ff7f0e',
      'Asia': '#2ca02c',
      'Europe': '#1f77b4',
      'North America': '#d62728',
      'South America': '#9467bd',
      'Oceania': '#8c564b',
      'Middle East': '#e377c2',
      'Unknown': '#7f7f7f'
    }
    return colors[region] || colors['Unknown']
  }

  // Reset zoom function
  const resetZoom = () => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const zoom = svg.node().zoom
    
    if (zoom) {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity)
      
      // Remove selection highlight
      svg.selectAll('.country').classed('selected', false)
    }
  }

  if (isLoading) {
    return (
      <div className={`world-map loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner-icon"></div>
          <div className="loading-text">Loading world map...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`world-map error ${className}`}>
        <div className="error-message">
          <p>Failed to load world map: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`world-map ${className}`}>
      <div className="map-controls">
        <button 
          onClick={resetZoom}
          className="reset-zoom-button"
          title="Reset zoom"
        >
          🌍 Reset View
        </button>
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="world-map-svg"
        role="img"
        aria-label="Interactive world map"
      >
        {/* Map content will be rendered by D3 */}
      </svg>

      <div className="map-legend">
        <h4>Regions</h4>
        <div className="legend-items">
          {Object.entries({
            'Africa': '#ff7f0e',
            'Asia': '#2ca02c',
            'Europe': '#1f77b4',
            'North America': '#d62728',
            'South America': '#9467bd',
            'Oceania': '#8c564b',
            'Middle East': '#e377c2'
          }).map(([region, color]) => (
            <div key={region} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: color }}
              ></div>
              <span>{region}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WorldMap