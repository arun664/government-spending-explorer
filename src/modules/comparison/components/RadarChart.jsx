/**
 * RadarChart - Interactive radar chart for country spending profile comparisons
 * 
 * Features:
 * - Multi-dimensional country spending profile visualization
 * - Overlay capability for comparing multiple countries
 * - Interactive axis selection and country highlighting
 * - Smooth transitions and detailed tooltips
 * - Independent implementation for comparison module
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { numberFormatter } from '../utils/NumberFormatter.js'

const RadarChart = ({ 
  data = [], 
  width = 600, 
  height = 600,
  selectedCountries = [],
  selectedYear = null,
  onCountrySelect = null,
  onAxisSelect = null,
  className = '',
  maxCountries = 5
}) => {
  const svgRef = useRef()
  const [hoveredCountry, setHoveredCountry] = useState(null)
  const [selectedAxes, setSelectedAxes] = useState(new Set())
  const [overlayCountries, setOverlayCountries] = useState(new Set())

  // Chart dimensions and margins
  const margin = { top: 60, right: 60, bottom: 60, left: 60 }
  const radius = Math.min(width, height) / 2 - Math.max(...Object.values(margin))

  // Define spending categories (axes)
  const axes = [
    { key: 'defense', label: 'Defense', color: '#A23B72' },
    { key: 'education', label: 'Education', color: '#F18F01' },
    { key: 'health', label: 'Health', color: '#C73E1D' },
    { key: 'socialProtection', label: 'Social Protection', color: '#6A994E' },
    { key: 'economicAffairs', label: 'Economic Affairs', color: '#577590' },
    { key: 'publicOrder', label: 'Public Order', color: '#90A959' },
    { key: 'generalServices', label: 'General Services', color: '#2E86AB' },
    { key: 'environment', label: 'Environment', color: '#8E44AD' }
  ]

  // Color scale for countries
  const countryColorScale = d3.scaleOrdinal()
    .domain([])
    .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf'])

  // Process data for radar chart
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // Filter data by selected countries and year
    let filteredData = data
    if (selectedCountries.length > 0) {
      filteredData = filteredData.filter(d => selectedCountries.includes(d.countryName))
    }
    if (selectedYear) {
      filteredData = filteredData.filter(d => d.year === selectedYear)
    }

    // Limit to maxCountries for readability
    filteredData = filteredData.slice(0, maxCountries)

    // Process each country's spending profile
    const countryProfiles = filteredData.map(country => {
      // Simulate spending breakdown by category (in real app, this would come from data)
      const totalSpending = country.totalSpending || 0
      const profile = {
        country: country.countryName,
        countryCode: country.countryCode,
        region: country.region,
        totalSpending: totalSpending,
        axes: {}
      }

      // Simulate category distribution (replace with real data structure)
      const distribution = {
        defense: Math.random() * 0.3 + 0.05, // 5-35%
        education: Math.random() * 0.25 + 0.10, // 10-35%
        health: Math.random() * 0.25 + 0.08, // 8-33%
        socialProtection: Math.random() * 0.35 + 0.15, // 15-50%
        economicAffairs: Math.random() * 0.20 + 0.05, // 5-25%
        publicOrder: Math.random() * 0.10 + 0.02, // 2-12%
        generalServices: Math.random() * 0.15 + 0.05, // 5-20%
        environment: Math.random() * 0.08 + 0.01  // 1-9%
      }

      // Normalize to ensure they sum to 1
      const sum = Object.values(distribution).reduce((a, b) => a + b, 0)
      Object.keys(distribution).forEach(key => {
        distribution[key] = distribution[key] / sum
        profile.axes[key] = {
          value: distribution[key],
          absoluteValue: totalSpending * distribution[key]
        }
      })

      return profile
    })

    // Update color scale domain
    countryColorScale.domain(countryProfiles.map(d => d.country))

    return countryProfiles
  }, [data, selectedCountries, selectedYear, maxCountries, countryColorScale])

  // Calculate scales
  const scales = React.useMemo(() => {
    if (processedData.length === 0) return null

    // Find max value for each axis across all countries
    const maxValues = {}
    axes.forEach(axis => {
      maxValues[axis.key] = d3.max(processedData, d => d.axes[axis.key]?.value || 0)
    })

    // Create radial scale (0 to max percentage)
    const radialScale = d3.scaleLinear()
      .domain([0, Math.max(...Object.values(maxValues))])
      .range([0, radius])

    // Create angle scale for axes
    const angleScale = d3.scaleLinear()
      .domain([0, axes.length])
      .range([0, 2 * Math.PI])

    return { radialScale, angleScale, maxValues }
  }, [processedData, axes, radius])

  // Generate radar path
  const generateRadarPath = useCallback((countryData) => {
    if (!scales) return ''

    const { radialScale, angleScale } = scales
    
    const pathData = axes.map((axis, i) => {
      const angle = angleScale(i) - Math.PI / 2 // Start from top
      const value = countryData.axes[axis.key]?.value || 0
      const r = radialScale(value)
      const x = r * Math.cos(angle)
      const y = r * Math.sin(angle)
      return [x, y]
    })

    // Close the path
    pathData.push(pathData[0])

    return d3.line()(pathData)
  }, [scales, axes])

  // Draw radar chart
  useEffect(() => {
    if (!svgRef.current || !scales || processedData.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { radialScale, angleScale } = scales

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'radar-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000)

    // Draw concentric circles (grid)
    const gridLevels = 5
    const gridGroup = g.append('g').attr('class', 'grid')
    
    for (let i = 1; i <= gridLevels; i++) {
      const r = (radius / gridLevels) * i
      gridGroup.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5)
    }

    // Draw axes
    const axesGroup = g.append('g').attr('class', 'axes')
    
    axes.forEach((axis, i) => {
      const angle = angleScale(i) - Math.PI / 2
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)

      // Draw axis line
      axesGroup.append('line')
        .attr('class', 'axis-line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#999')
        .attr('stroke-width', 1)
        .attr('opacity', selectedAxes.size === 0 || selectedAxes.has(axis.key) ? 1 : 0.3)

      // Draw axis label
      const labelRadius = radius + 20
      const labelX = labelRadius * Math.cos(angle)
      const labelY = labelRadius * Math.sin(angle)

      axesGroup.append('text')
        .attr('class', 'axis-label')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(axis.label)
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', axis.color)
        .style('cursor', 'pointer')
        .style('opacity', selectedAxes.size === 0 || selectedAxes.has(axis.key) ? 1 : 0.5)
        .on('click', function() {
          const newSelected = new Set(selectedAxes)
          if (newSelected.has(axis.key)) {
            newSelected.delete(axis.key)
          } else {
            newSelected.add(axis.key)
          }
          setSelectedAxes(newSelected)

          if (onAxisSelect) {
            onAxisSelect({
              axis: axis.key,
              label: axis.label,
              selected: newSelected.has(axis.key)
            })
          }
        })
        .on('mouseover', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style('font-size', '14px')
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style('font-size', '12px')
        })
    })

    // Draw grid labels (percentage values)
    const gridLabelsGroup = g.append('g').attr('class', 'grid-labels')
    
    for (let i = 1; i <= gridLevels; i++) {
      const r = (radius / gridLevels) * i
      const value = (scales.radialScale.domain()[1] / gridLevels) * i
      
      gridLabelsGroup.append('text')
        .attr('x', 5)
        .attr('y', -r)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .text(numberFormatter.formatPercentage(value * 100))
        .style('font-size', '10px')
        .style('fill', '#666')
        .style('pointer-events', 'none')
    }

    // Draw country radar areas
    const countriesGroup = g.append('g').attr('class', 'countries')
    
    processedData.forEach((countryData, index) => {
      const countryGroup = countriesGroup.append('g')
        .attr('class', `country-${index}`)
        .attr('data-country', countryData.country)

      // Draw filled area
      const radarPath = generateRadarPath(countryData)
      
      countryGroup.append('path')
        .attr('class', 'radar-area')
        .attr('d', radarPath)
        .attr('fill', countryColorScale(countryData.country))
        .attr('fill-opacity', overlayCountries.has(countryData.country) ? 0.4 : 0.2)
        .attr('stroke', countryColorScale(countryData.country))
        .attr('stroke-width', overlayCountries.has(countryData.country) ? 3 : 2)
        .attr('stroke-opacity', 0.8)
        .style('cursor', 'pointer')

      // Draw data points
      axes.forEach((axis, i) => {
        const angle = angleScale(i) - Math.PI / 2
        const value = countryData.axes[axis.key]?.value || 0
        const r = radialScale(value)
        const x = r * Math.cos(angle)
        const y = r * Math.sin(angle)

        countryGroup.append('circle')
          .attr('class', 'radar-point')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', overlayCountries.has(countryData.country) ? 5 : 3)
          .attr('fill', countryColorScale(countryData.country))
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            setHoveredCountry(countryData.country)
            
            // Highlight this country
            d3.select(countryGroup.node())
              .selectAll('.radar-area')
              .transition()
              .duration(200)
              .attr('fill-opacity', 0.6)
              .attr('stroke-width', 4)

            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 6)

            tooltip
              .style('visibility', 'visible')
              .html(`
                <strong>${countryData.country}</strong><br/>
                <strong>${axis.label}</strong><br/>
                Percentage: ${numberFormatter.formatPercentage(value * 100)}<br/>
                Amount: ${numberFormatter.formatWithMBNotation(countryData.axes[axis.key]?.absoluteValue || 0)}<br/>
                Total Spending: ${numberFormatter.formatWithMBNotation(countryData.totalSpending)}
              `)
          })
          .on('mousemove', function(event) {
            tooltip
              .style('top', (event.pageY - 10) + 'px')
              .style('left', (event.pageX + 10) + 'px')
          })
          .on('mouseout', function() {
            setHoveredCountry(null)
            
            // Reset highlighting
            d3.select(countryGroup.node())
              .selectAll('.radar-area')
              .transition()
              .duration(200)
              .attr('fill-opacity', overlayCountries.has(countryData.country) ? 0.4 : 0.2)
              .attr('stroke-width', overlayCountries.has(countryData.country) ? 3 : 2)

            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', overlayCountries.has(countryData.country) ? 5 : 3)

            tooltip.style('visibility', 'hidden')
          })
          .on('click', function() {
            const newOverlay = new Set(overlayCountries)
            if (newOverlay.has(countryData.country)) {
              newOverlay.delete(countryData.country)
            } else {
              newOverlay.add(countryData.country)
            }
            setOverlayCountries(newOverlay)

            if (onCountrySelect) {
              onCountrySelect({
                country: countryData.country,
                countryCode: countryData.countryCode,
                region: countryData.region,
                overlaid: newOverlay.has(countryData.country)
              })
            }
          })
      })

      // Add country label
      countryGroup.append('text')
        .attr('class', 'country-label')
        .attr('x', 0)
        .attr('y', radius + 40 + (index * 15))
        .attr('text-anchor', 'middle')
        .text(countryData.country)
        .style('font-size', '11px')
        .style('font-weight', overlayCountries.has(countryData.country) ? 'bold' : 'normal')
        .style('fill', countryColorScale(countryData.country))
        .style('cursor', 'pointer')
        .on('click', function() {
          const newOverlay = new Set(overlayCountries)
          if (newOverlay.has(countryData.country)) {
            newOverlay.delete(countryData.country)
          } else {
            newOverlay.add(countryData.country)
          }
          setOverlayCountries(newOverlay)

          if (onCountrySelect) {
            onCountrySelect({
              country: countryData.country,
              countryCode: countryData.countryCode,
              region: countryData.region,
              overlaid: newOverlay.has(countryData.country)
            })
          }
        })
    })

    // Add title
    g.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', -radius - 30)
      .text('Country Spending Profile Comparison')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')

    // Animate in
    countriesGroup.selectAll('.radar-area')
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 1)

    countriesGroup.selectAll('.radar-point')
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .attr('opacity', 1)

    // Cleanup function
    return () => {
      tooltip.remove()
    }

  }, [processedData, scales, width, height, radius, axes, generateRadarPath, countryColorScale, overlayCountries, selectedAxes])

  const clearOverlays = useCallback(() => {
    setOverlayCountries(new Set())
  }, [])

  const clearAxisSelection = useCallback(() => {
    setSelectedAxes(new Set())
  }, [])

  if (!scales || processedData.length === 0) {
    return (
      <div className={`radar-chart ${className}`}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: height,
          color: '#666',
          fontSize: '14px'
        }}>
          No data available for radar chart
        </div>
      </div>
    )
  }

  return (
    <div className={`radar-chart ${className}`}>
      <div className="chart-controls" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Countries: {selectedCountries.length > 0 ? selectedCountries.join(', ') : 'All'}
          </span>
          {selectedYear && (
            <span style={{ fontSize: '14px', color: '#666' }}>
              Year: {selectedYear}
            </span>
          )}
          {overlayCountries.size > 0 && (
            <button 
              onClick={clearOverlays}
              style={{ 
                padding: '4px 8px', 
                fontSize: '12px',
                background: '#e41a1c',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Clear Overlays ({overlayCountries.size})
            </button>
          )}
          {selectedAxes.size > 0 && (
            <button 
              onClick={clearAxisSelection}
              style={{ 
                padding: '4px 8px', 
                fontSize: '12px',
                background: '#377eb8',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Clear Axis Filter ({selectedAxes.size})
            </button>
          )}
        </div>
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ddd', background: '#fafafa' }}
      />
      
      <div className="chart-legend" style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ fontWeight: 'bold', marginRight: '10px' }}>Countries:</div>
          {processedData.map(country => (
            <div key={country.country} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: countryColorScale(country.country),
                  border: '1px solid #fff',
                  opacity: overlayCountries.has(country.country) ? 1 : 0.7
                }}
              />
              <span style={{ 
                fontWeight: overlayCountries.has(country.country) ? 'bold' : 'normal'
              }}>
                {country.country}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RadarChart