/**
 * StreamGraph - Stream graph showing spending composition evolution over time
 * 
 * Features:
 * - Stacked area chart showing spending category composition over time
 * - Smooth flowing streams with organic curves
 * - Interactive legends with category toggling
 * - Hover effects showing temporal information
 * - Smooth animations and transitions
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { numberFormatter } from '../utils/NumberFormatter.js'

const StreamGraph = ({ 
  data = [], 
  width = 1000, 
  height = 600,
  selectedCountries = [],
  categories = ['defense', 'education', 'health', 'infrastructure', 'social'],
  showLegend = true,
  interpolation = 'cardinal', // 'linear', 'cardinal', 'basis'
  offset = 'wiggle', // 'none', 'expand', 'wiggle', 'silhouette'
  onCategoryToggle = null,
  onTimeHover = null,
  className = ''
}) => {
  const svgRef = useRef()
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [hoveredTime, setHoveredTime] = useState(null)
  const [visibleCategories, setVisibleCategories] = useState(new Set(categories))
  const [isAnimating, setIsAnimating] = useState(false)

  // Chart dimensions and margins
  const margin = { top: 40, right: showLegend ? 200 : 40, bottom: 60, left: 60 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Color scale for categories
  const categoryColors = d3.scaleOrdinal()
    .domain(categories)
    .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'])

  // Process data for stream graph
  const streamData = React.useMemo(() => {
    if (!data || data.length === 0) return { series: [], timeExtent: [0, 0] }

    // Filter data for selected countries
    let filteredData = data
    if (selectedCountries.length > 0) {
      filteredData = data.filter(d => selectedCountries.includes(d.countryName))
    }

    // Group by year and aggregate spending by category
    const yearlyData = d3.rollup(
      filteredData,
      v => {
        const categoryTotals = {}
        categories.forEach(cat => {
          categoryTotals[cat] = 0
        })

        // Simulate category breakdown (in real implementation, this would come from data)
        v.forEach(record => {
          if (record.totalSpending != null) {
            const totalSpending = record.totalSpending
            // Distribute spending across categories with some variation
            const baseDistribution = {
              defense: 0.15,
              education: 0.20,
              health: 0.25,
              infrastructure: 0.15,
              social: 0.25
            }

            // Add some country-specific variation
            const countryHash = record.countryName.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0)
              return a & a
            }, 0)
            
            const variation = (countryHash % 100) / 1000 // Small variation

            categories.forEach(cat => {
              const base = baseDistribution[cat] || 0.1
              const adjusted = Math.max(0.05, base + variation * (Math.random() - 0.5))
              categoryTotals[cat] += totalSpending * adjusted / v.length
            })
          }
        })

        return categoryTotals
      },
      d => d.year
    )

    // Convert to array format for D3 stack
    const years = Array.from(yearlyData.keys()).sort((a, b) => a - b)
    const stackData = years.map(year => {
      const yearData = { year }
      const categoryData = yearlyData.get(year)
      
      categories.forEach(cat => {
        yearData[cat] = visibleCategories.has(cat) ? (categoryData[cat] || 0) : 0
      })
      
      return yearData
    })

    // Create stack generator
    const stack = d3.stack()
      .keys(categories.filter(cat => visibleCategories.has(cat)))
      .offset(d3[`stack${offset.charAt(0).toUpperCase() + offset.slice(1)}`] || d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut)

    const series = stack(stackData)

    return {
      series,
      stackData,
      timeExtent: d3.extent(years),
      years
    }
  }, [data, selectedCountries, categories, visibleCategories, offset])

  // Create scales
  const xScale = d3.scaleLinear()
    .domain(streamData.timeExtent)
    .range([0, chartWidth])

  const yScale = d3.scaleLinear()
    .domain(d3.extent(streamData.series.flat(2)))
    .range([chartHeight, 0])

  // Create area generator
  const area = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3[`curve${interpolation.charAt(0).toUpperCase() + interpolation.slice(1)}`] || d3.curveCardinal)

  // Initialize and update the stream graph
  useEffect(() => {
    if (!svgRef.current || streamData.series.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // Create clip path
    const clipPath = svg.append('defs')
      .append('clipPath')
      .attr('id', 'stream-clip')
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)

    // Create streams
    const streams = g.append('g')
      .attr('class', 'streams')
      .attr('clip-path', 'url(#stream-clip)')

    const streamPaths = streams.selectAll('.stream')
      .data(streamData.series)
      .enter().append('path')
      .attr('class', 'stream')
      .attr('fill', d => categoryColors(d.key))
      .attr('stroke', 'none')
      .style('opacity', 0.8)
      .style('cursor', 'pointer')

    // Animate streams in
    setIsAnimating(true)
    streamPaths
      .attr('d', area)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .style('opacity', 0.8)
      .on('end', (d, i) => {
        if (i === streamData.series.length - 1) {
          setIsAnimating(false)
        }
      })

    // Add hover interactions
    streamPaths
      .on('mouseover', function(event, d) {
        setHoveredCategory(d.key)
        
        // Highlight hovered stream
        streamPaths.style('opacity', stream => stream.key === d.key ? 1 : 0.3)
        
        d3.select(this)
          .attr('stroke', '#333')
          .attr('stroke-width', 2)
      })
      .on('mouseout', function() {
        setHoveredCategory(null)
        
        // Reset opacity
        streamPaths.style('opacity', 0.8)
        
        d3.select(this)
          .attr('stroke', 'none')
      })
      .on('click', function(event, d) {
        toggleCategory(d.key)
      })

    // Create vertical hover line
    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0)
      .style('pointer-events', 'none')

    // Create hover area for time interaction
    const hoverArea = g.append('rect')
      .attr('class', 'hover-area')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event, this)
        const year = Math.round(xScale.invert(mouseX))
        
        setHoveredTime(year)
        
        hoverLine
          .attr('x1', xScale(year))
          .attr('x2', xScale(year))
          .style('opacity', 1)

        if (onTimeHover) {
          const yearData = streamData.stackData.find(d => d.year === year)
          onTimeHover(year, yearData)
        }
      })
      .on('mouseout', function() {
        setHoveredTime(null)
        hoverLine.style('opacity', 0)
      })

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format('d'))
      .ticks(Math.min(10, streamData.years.length))

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => numberFormatter.format(d))
      .ticks(6)

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .attr('fill', '#333')
      .attr('text-anchor', 'middle')
      .text('Year')

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .attr('fill', '#333')
      .attr('text-anchor', 'middle')
      .text('Spending (% of GDP)')

    // Add title
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text('Government Spending Composition Over Time')

  }, [streamData, area, xScale, yScale, chartWidth, chartHeight, margin, categoryColors, onTimeHover])

  // Toggle category visibility
  const toggleCategory = useCallback((category) => {
    const newVisible = new Set(visibleCategories)
    if (newVisible.has(category)) {
      newVisible.delete(category)
    } else {
      newVisible.add(category)
    }
    
    setVisibleCategories(newVisible)
    
    if (onCategoryToggle) {
      onCategoryToggle([...newVisible])
    }
  }, [visibleCategories, onCategoryToggle])

  return (
    <div className={`stream-graph ${className}`}>
      <div className="stream-graph-header">
        <div className="stream-controls">
          <div className="control-group">
            <label>Countries:</label>
            <span>{selectedCountries.length > 0 ? selectedCountries.join(', ') : 'All'}</span>
          </div>
          <div className="control-group">
            <label>Categories:</label>
            <span>{visibleCategories.size} of {categories.length}</span>
          </div>
          {isAnimating && (
            <div className="control-group">
              <span className="animating">Animating...</span>
            </div>
          )}
        </div>
      </div>

      <div className="stream-graph-container">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="stream-graph-svg"
        />

        {showLegend && (
          <div className="stream-legend">
            <h4>Spending Categories</h4>
            <div className="legend-items">
              {categories.map(category => (
                <div 
                  key={category} 
                  className={`legend-item ${visibleCategories.has(category) ? 'active' : 'inactive'} ${hoveredCategory === category ? 'hovered' : ''}`}
                  onClick={() => toggleCategory(category)}
                >
                  <div 
                    className="legend-color" 
                    style={{ 
                      backgroundColor: categoryColors(category),
                      opacity: visibleCategories.has(category) ? 1 : 0.3
                    }}
                  />
                  <span className="legend-label">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                  <span className="legend-toggle">
                    {visibleCategories.has(category) ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="legend-controls">
              <button 
                className="legend-button"
                onClick={() => setVisibleCategories(new Set(categories))}
              >
                Show All
              </button>
              <button 
                className="legend-button"
                onClick={() => setVisibleCategories(new Set())}
              >
                Hide All
              </button>
            </div>
          </div>
        )}
      </div>

      {hoveredTime && (
        <div className="stream-tooltip">
          <div className="tooltip-header">
            <strong>Year {hoveredTime}</strong>
          </div>
          <div className="tooltip-content">
            {categories.filter(cat => visibleCategories.has(cat)).map(category => {
              const yearData = streamData.stackData.find(d => d.year === hoveredTime)
              const value = yearData ? yearData[category] : 0
              
              return (
                <div key={category} className="tooltip-row">
                  <div 
                    className="tooltip-color" 
                    style={{ backgroundColor: categoryColors(category) }}
                  />
                  <span className="tooltip-category">
                    {category.charAt(0).toUpperCase() + category.slice(1)}:
                  </span>
                  <span className="tooltip-value">
                    {numberFormatter.format(value)}% of GDP
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default StreamGraph