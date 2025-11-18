/**
 * TrendLineChart.jsx - GDP vs Spending trends over time
 * 
 * Features:
 * - Line chart showing GDP and Spending over time (2005-2023)
 * - Dual y-axis if needed
 * - Grid lines and year markers
 * - Synchronized hover interactions
 */

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { formatComparisonValue, formatComparisonValueShort } from '../utils/formatComparisonValue.js'

function TrendLineChart({ 
  data, 
  visibility = { gdp: true, spending: true },
  onHover,
  highlightYear 
}) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' })
  
  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) {
      // Clear chart if no data
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll('*').remove()
      }
      return
    }
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()
    
    // Dimensions - responsive to container with more left margin for y-axis
    const containerWidth = svgRef.current.clientWidth || 400
    const containerHeight = svgRef.current.clientHeight || 250
    const margin = { top: 10, right: 30, bottom: 25, left: 70 }
    const width = Math.max(containerWidth - margin.left - margin.right, 100)
    const height = Math.max(containerHeight - margin.top - margin.bottom, 100)
    
    // Set SVG dimensions
    d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
    
    // Create SVG group
    const svg = d3.select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    // Group data by year
    const yearData = d3.group(data, d => d.year)
    const aggregatedData = Array.from(yearData, ([year, values]) => ({
      year,
      gdp: d3.mean(values, d => d.gdp),
      spending: d3.mean(values, d => d.spending)
    })).sort((a, b) => a.year - b.year)
    
    // Get unique years for x-axis
    const uniqueYears = [...new Set(aggregatedData.map(d => d.year))].sort((a, b) => a - b)
    const yearCount = uniqueYears.length
    
    // Scales - use point scale for single year, linear for multiple
    const xScale = yearCount === 1
      ? d3.scalePoint()
          .domain(uniqueYears)
          .range([width / 2, width / 2]) // Center single point
          .padding(0.5)
      : d3.scaleLinear()
          .domain(d3.extent(aggregatedData, d => d.year))
          .range([0, width])
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(aggregatedData, d => Math.max(d.gdp, d.spending)) * 1.1])
      .range([height, 0])
    
    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat('')
      )
    
    // X-Axis - show only unique years
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format('d'))
      .tickValues(uniqueYears) // Only show unique years
    
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('font-size', '11px')
    
    svg.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => formatComparisonValueShort(d)))
      .style('font-size', '11px')
    
    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 18)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('Value (USD)')
    
    // Line generators
    const gdpLine = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.gdp))
      .curve(d3.curveMonotoneX)
    
    const spendingLine = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.spending))
      .curve(d3.curveMonotoneX)
    
    // Draw GDP line (only if more than 1 year)
    if (visibility.gdp && yearCount > 1) {
      svg.append('path')
        .datum(aggregatedData)
        .attr('class', 'line-gdp')
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2.5)
        .attr('d', gdpLine)
    }
    
    // Draw Spending line (only if more than 1 year)
    if (visibility.spending && yearCount > 1) {
      svg.append('path')
        .datum(aggregatedData)
        .attr('class', 'line-spending')
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2.5)
        .attr('d', spendingLine)
    }
    
    // Draw GDP dots (always show dots for data points)
    if (visibility.gdp) {
      svg.selectAll('.dot-gdp')
        .data(aggregatedData)
        .enter()
        .append('circle')
        .attr('class', 'dot-gdp')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.gdp))
        .attr('r', yearCount === 1 ? 6 : 4) // Larger dot if single year
        .attr('fill', '#3b82f6')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
    }
    
    // Draw Spending dots (always show dots for data points)
    if (visibility.spending) {
      svg.selectAll('.dot-spending')
        .data(aggregatedData)
        .enter()
        .append('circle')
        .attr('class', 'dot-spending')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.spending))
        .attr('r', yearCount === 1 ? 6 : 4) // Larger dot if single year
        .attr('fill', '#ef4444')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
    }
    
    // Highlight year if provided
    if (highlightYear) {
      const yearPoint = aggregatedData.find(d => d.year === highlightYear)
      if (yearPoint) {
        svg.append('line')
          .attr('x1', xScale(highlightYear))
          .attr('x2', xScale(highlightYear))
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.6)
      }
    }
    
    // Interaction overlay
    const overlay = svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
    
    overlay.on('mousemove', function(event) {
      const [mouseX] = d3.pointer(event)
      const year = Math.round(xScale.invert(mouseX))
      const yearPoint = aggregatedData.find(d => d.year === year)
      
      if (yearPoint) {
        const tooltipContent = `
          <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Year ${year}</div>
          ${visibility.gdp ? `
            <div style="color: #3b82f6; margin: 4px 0;">
              <div style="font-weight: 600; font-size: 11px;">GDP</div>
              <div style="font-size: 13px; font-weight: 700;">${formatComparisonValue(yearPoint.gdp)}</div>
            </div>
          ` : ''}
          ${visibility.spending ? `
            <div style="color: #ef4444; margin: 4px 0;">
              <div style="font-weight: 600; font-size: 11px;">Government Spending</div>
              <div style="font-size: 13px; font-weight: 700;">${formatComparisonValue(yearPoint.spending)}</div>
            </div>
          ` : ''}
        `
        
        setTooltip({
          show: true,
          x: event.pageX,
          y: event.pageY - 120, // Position above cursor to avoid cutoff
          content: tooltipContent
        })
        
        if (onHover) {
          onHover(year)
        }
      }
    })
    
    overlay.on('mouseleave', () => {
      setTooltip({ show: false, x: 0, y: 0, content: '' })
      if (onHover) {
        onHover(null)
      }
    })
    
  }, [data, visibility, highlightYear, onHover])
  
  return (
    <div 
      className="trend-line-chart" 
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, content: '' })}
    >
      {data && data.length > 0 ? (
        <svg ref={svgRef} style={{ flex: 1, minHeight: 0 }}></svg>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', fontSize: '12px' }}>
          No data available
        </div>
      )}
      {tooltip.show && (
        <div 
          className="chart-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            minWidth: '150px'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  )
}

export default TrendLineChart
