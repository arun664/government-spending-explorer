/**
 * BubbleChart - Multi-dimensional bubble chart for GDP vs Spending comparison
 * 
 * Features:
 * - Multi-dimensional encoding (X: GDP, Y: spending, Size: population/economy size)
 * - Interactive zoom, pan, and bubble selection
 * - Animated transitions and hover effects
 * - Independent implementation for comparison module
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { numberFormatter } from '../utils/NumberFormatter.js'

const BubbleChart = ({ 
  data = [], 
  width = 800, 
  height = 600,
  selectedYear = null,
  selectedCountries = [],
  sizeMetric = 'totalSpending', // 'totalSpending', 'gdpGrowth', or 'population' if available
  colorMetric = 'region',
  animationSpeed = 1000,
  onCountrySelect = null,
  onBubbleHover = null,
  className = ''
}) => {
  const svgRef = useRef()
  const [currentYear, setCurrentYear] = useState(selectedYear)
  const [hoveredCountry, setHoveredCountry] = useState(null)
  const [zoomTransform, setZoomTransform] = useState(null)

  // Chart dimensions and margins
  const margin = { top: 40, right: 120, bottom: 60, left: 80 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Color scales
  const regionColors = d3.scaleOrdinal()
    .domain(['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Oceania', 'Other'])
    .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2'])

  const performanceColors = d3.scaleSequential()
    .domain([-10, 10]) // GDP growth range
    .interpolator(d3.interpolateRdYlGn)

  // Process data for visualization
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // Group data by country and year
    const groupedData = d3.group(data, d => d.countryName, d => d.year)
    
    const processed = []
    groupedData.forEach((yearData, country) => {
      yearData.forEach((records, year) => {
        const record = records[0] // Take first record if multiple
        if (record.gdpGrowth !== null && record.totalSpending !== null) {
          processed.push({
            country,
            year,
            gdpGrowth: record.gdpGrowth,
            totalSpending: record.totalSpending,
            countryCode: record.countryCode,
            region: getRegionFromCountry(country),
            // Calculate derived metrics for bubble sizing
            economicSize: Math.abs(record.gdpGrowth) + record.totalSpending, // Combined metric
            performance: record.gdpGrowth, // For color coding
            isSelected: selectedCountries.length === 0 || selectedCountries.includes(country)
          })
        }
      })
    })

    return processed
  }, [data, selectedCountries])

  // Get available years
  const availableYears = React.useMemo(() => {
    const years = [...new Set(processedData.map(d => d.year))].sort((a, b) => a - b)
    return years
  }, [processedData])

  // Set initial year if not provided
  useEffect(() => {
    if (!currentYear && availableYears.length > 0) {
      setCurrentYear(availableYears[availableYears.length - 1])
    }
  }, [availableYears, currentYear])

  // Create scales
  const xScale = React.useMemo(() => {
    const extent = d3.extent(processedData, d => d.gdpGrowth)
    return d3.scaleLinear()
      .domain(extent)
      .range([0, chartWidth])
      .nice()
  }, [processedData, chartWidth])

  const yScale = React.useMemo(() => {
    const extent = d3.extent(processedData, d => d.totalSpending)
    return d3.scaleLinear()
      .domain(extent)
      .range([chartHeight, 0])
      .nice()
  }, [processedData, chartHeight])

  // Size scale based on selected metric
  const sizeScale = React.useMemo(() => {
    let extent
    switch (sizeMetric) {
      case 'gdpGrowth':
        extent = d3.extent(processedData, d => Math.abs(d.gdpGrowth))
        break
      case 'totalSpending':
        extent = d3.extent(processedData, d => d.totalSpending)
        break
      case 'economicSize':
      default:
        extent = d3.extent(processedData, d => d.economicSize)
        break
    }
    
    return d3.scaleSqrt()
      .domain(extent)
      .range([3, 25]) // Min and max bubble radius
  }, [processedData, sizeMetric])

  // Filter data for current year
  const currentYearData = React.useMemo(() => {
    return processedData.filter(d => d.year === currentYear && d.isSelected)
  }, [processedData, currentYear])

  // Color function based on selected metric
  const getColor = useCallback((d) => {
    switch (colorMetric) {
      case 'performance':
        return performanceColors(d.performance)
      case 'region':
      default:
        return regionColors(d.region)
    }
  }, [colorMetric, regionColors, performanceColors])

  // Get size value based on selected metric
  const getSizeValue = useCallback((d) => {
    switch (sizeMetric) {
      case 'gdpGrowth':
        return Math.abs(d.gdpGrowth)
      case 'totalSpending':
        return d.totalSpending
      case 'economicSize':
      default:
        return d.economicSize
    }
  }, [sizeMetric])

  // Draw chart
  useEffect(() => {
    if (!svgRef.current || !currentYearData.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => {
        const { transform } = event
        setZoomTransform(transform)
        g.attr('transform', `translate(${margin.left + transform.x},${margin.top + transform.y}) scale(${transform.k})`)
      })

    svg.call(zoom)

    // Add background grid
    const xTicks = xScale.ticks(10)
    const yTicks = yScale.ticks(10)

    // Vertical grid lines
    g.selectAll('.grid-line-x')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#f0f0f0')
      .attr('stroke-width', 1)

    // Horizontal grid lines
    g.selectAll('.grid-line-y')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#f0f0f0')
      .attr('stroke-width', 1)

    // Add quadrant lines (at origin)
    const xZero = xScale(0)
    const yZero = yScale(0)

    if (xZero >= 0 && xZero <= chartWidth) {
      g.append('line')
        .attr('x1', xZero)
        .attr('x2', xZero)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#999')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
    }

    if (yZero >= 0 && yZero <= chartHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', yZero)
        .attr('y2', yZero)
        .attr('stroke', '#999')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
    }

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'bubble-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .style('box-shadow', '0 4px 8px rgba(0,0,0,0.3)')

    // Create force simulation for bubble positioning (optional collision detection)
    const simulation = d3.forceSimulation(currentYearData)
      .force('x', d3.forceX(d => xScale(d.gdpGrowth)).strength(0.8))
      .force('y', d3.forceY(d => yScale(d.totalSpending)).strength(0.8))
      .force('collision', d3.forceCollide(d => sizeScale(getSizeValue(d)) + 2))
      .alpha(0.3)
      .alphaDecay(0.1)

    // Draw bubbles
    const bubbles = g.selectAll('.country-bubble')
      .data(currentYearData)
      .enter()
      .append('circle')
      .attr('class', 'country-bubble')
      .attr('cx', d => xScale(d.gdpGrowth))
      .attr('cy', d => yScale(d.totalSpending))
      .attr('r', 0)
      .attr('fill', d => getColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')

    // Animate bubbles in
    bubbles.transition()
      .duration(animationSpeed)
      .attr('r', d => sizeScale(getSizeValue(d)))

    // Update positions during simulation
    simulation.on('tick', () => {
      bubbles
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
    })

    // Add interactions
    bubbles
      .on('mouseover', function(event, d) {
        setHoveredCountry(d.country)
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 4)
          .attr('opacity', 1)

        // Dim other bubbles
        bubbles.filter(bubble => bubble.country !== d.country)
          .transition()
          .duration(200)
          .attr('opacity', 0.3)

        const sizeValue = getSizeValue(d)
        const sizeLabel = sizeMetric === 'gdpGrowth' ? 'GDP Growth (abs)' : 
                         sizeMetric === 'totalSpending' ? 'Spending' : 'Economic Size'

        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.country}</strong><br/>
            <strong>Year:</strong> ${d.year}<br/>
            <strong>GDP Growth:</strong> ${numberFormatter.formatGDPGrowth(d.gdpGrowth)}<br/>
            <strong>Spending:</strong> ${numberFormatter.formatPercentage(d.totalSpending)}% of GDP<br/>
            <strong>${sizeLabel}:</strong> ${numberFormatter.formatWithMBNotation(sizeValue)}<br/>
            <strong>Region:</strong> ${d.region}
          `)

        if (onBubbleHover) {
          onBubbleHover(d)
        }
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px')
      })
      .on('mouseout', function(event, d) {
        setHoveredCountry(null)
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .attr('opacity', 0.7)

        // Restore opacity for all bubbles
        bubbles
          .transition()
          .duration(200)
          .attr('opacity', 0.7)

        tooltip.style('visibility', 'hidden')
      })
      .on('click', function(event, d) {
        if (onCountrySelect) {
          onCountrySelect(d.country)
        }
      })

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => numberFormatter.formatGDPGrowth(d))
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => numberFormatter.formatPercentage(d) + '%')

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)

    // Add axis labels
    g.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 50)
      .text('GDP Growth Rate (%)')
      .style('font-size', '14px')
      .style('fill', '#333')

    g.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -50)
      .text('Government Spending (% of GDP)')
      .style('font-size', '14px')
      .style('fill', '#333')

    // Add title
    const sizeLabel = sizeMetric === 'gdpGrowth' ? 'GDP Growth' : 
                     sizeMetric === 'totalSpending' ? 'Spending' : 'Economic Size'
    
    g.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', chartWidth / 2)
      .attr('y', -20)
      .text(`GDP vs Spending Bubble Chart - Size: ${sizeLabel} (${currentYear})`)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 110}, ${margin.top})`)

    if (colorMetric === 'region') {
      const regions = [...new Set(currentYearData.map(d => d.region))]
      
      const legendItems = legend.selectAll('.legend-item')
        .data(regions)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 25})`)

      legendItems.append('circle')
        .attr('r', 8)
        .attr('fill', d => regionColors(d))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)

      legendItems.append('text')
        .attr('x', 20)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .text(d => d)
        .style('font-size', '12px')
        .style('fill', '#333')
    }

    // Add size legend
    const sizeLegend = svg.append('g')
      .attr('class', 'size-legend')
      .attr('transform', `translate(${width - 110}, ${height - 120})`)

    const sizeValues = [
      d3.min(currentYearData, d => getSizeValue(d)),
      d3.median(currentYearData, d => getSizeValue(d)),
      d3.max(currentYearData, d => getSizeValue(d))
    ]

    sizeLegend.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .text('Bubble Size')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')

    const sizeLegendItems = sizeLegend.selectAll('.size-legend-item')
      .data(sizeValues)
      .enter()
      .append('g')
      .attr('class', 'size-legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 30})`)

    sizeLegendItems.append('circle')
      .attr('r', d => sizeScale(d))
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 1)

    sizeLegendItems.append('text')
      .attr('x', 30)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .text(d => numberFormatter.formatWithMBNotation(d))
      .style('font-size', '10px')
      .style('fill', '#666')

    // Cleanup function
    return () => {
      tooltip.remove()
      simulation.stop()
    }

  }, [currentYearData, xScale, yScale, sizeScale, chartWidth, chartHeight, currentYear, 
      sizeMetric, colorMetric, animationSpeed, getColor, getSizeValue])

  // Helper function to determine region from country name
  function getRegionFromCountry(countryName) {
    const regionMap = {
      'United States': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'Germany': 'Europe',
      'France': 'Europe',
      'United Kingdom': 'Europe',
      'Italy': 'Europe',
      'Spain': 'Europe',
      'China': 'Asia',
      'Japan': 'Asia',
      'India': 'Asia',
      'South Korea': 'Asia',
      'Brazil': 'South America',
      'Argentina': 'South America',
      'Australia': 'Oceania',
      'New Zealand': 'Oceania'
    }
    
    return regionMap[countryName] || 'Other'
  }

  return (
    <div className={`bubble-chart ${className}`}>
      <div className="chart-controls" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <label>
            Year: 
            <select 
              value={currentYear || ''} 
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              style={{ marginLeft: '5px' }}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          
          <label>
            Size by: 
            <select 
              value={sizeMetric} 
              onChange={(e) => {
                // This would need to be passed as a prop or handled by parent
              }}
              style={{ marginLeft: '5px' }}
            >
              <option value="economicSize">Economic Size</option>
              <option value="totalSpending">Spending Amount</option>
              <option value="gdpGrowth">GDP Growth (abs)</option>
            </select>
          </label>
          
          <label>
            Color by: 
            <select 
              value={colorMetric} 
              onChange={(e) => {
                // This would need to be passed as a prop or handled by parent
              }}
              style={{ marginLeft: '5px' }}
            >
              <option value="region">Region</option>
              <option value="performance">Performance</option>
            </select>
          </label>
        </div>
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ddd', background: '#fafafa' }}
      />
    </div>
  )
}

export default BubbleChart