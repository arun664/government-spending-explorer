/**
 * BubbleChart.jsx - GDP vs Spending heatmap
 * 
 * Features:
 * - Heatmap showing GDP vs Spending density
 * - Color intensity represents number of countries in each bin
 * - Better visualization for overlapping data points
 */

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { formatComparisonValueShort } from '../utils/formatComparisonValue.js'

function BubbleChart({ 
  data, 
  visibility = { gdp: true, spending: true },
  selectedYear
}) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' })
  
  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll('*').remove()
      }
      return
    }
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()
    
    // Dimensions - responsive to container with more left margin for y-axis
    const containerWidth = svgRef.current.clientWidth || 400
    const containerHeight = svgRef.current.clientHeight || 300
    const margin = { top: 10, right: 30, bottom: 40, left: 70 }
    const width = Math.max(containerWidth - margin.left - margin.right, 100)
    const height = Math.max(containerHeight - margin.top - margin.bottom, 100)
    
    // Set SVG dimensions
    d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    // Filter data for selected year
    const yearData = data.filter(d => d.year === selectedYear)
    
    if (yearData.length === 0) return
    
    // Create bins for heatmap
    const numBinsX = 20
    const numBinsY = 20
    
    const maxGdp = d3.max(yearData, d => d.gdp)
    const maxSpending = d3.max(yearData, d => d.spending)
    
    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, maxGdp * 1.1])
      .range([0, width])
    
    const yScale = d3.scaleLinear()
      .domain([0, maxSpending * 1.1])
      .range([height, 0])
    
    // Create bins
    const binWidth = (maxGdp * 1.1) / numBinsX
    const binHeight = (maxSpending * 1.1) / numBinsY
    
    // Initialize bin matrix
    const bins = Array(numBinsY).fill(null).map(() => Array(numBinsX).fill(0).map(() => ({ count: 0, countries: [] })))
    
    // Populate bins
    yearData.forEach(d => {
      const binX = Math.min(Math.floor(d.gdp / binWidth), numBinsX - 1)
      const binY = Math.min(Math.floor(d.spending / binHeight), numBinsY - 1)
      bins[binY][binX].count++
      bins[binY][binX].countries.push(d)
    })
    
    // Flatten bins for rendering
    const flatBins = []
    bins.forEach((row, i) => {
      row.forEach((bin, j) => {
        if (bin.count > 0) {
          flatBins.push({
            x: j * binWidth,
            y: i * binHeight,
            width: binWidth,
            height: binHeight,
            count: bin.count,
            countries: bin.countries
          })
        }
      })
    })
    
    // Color scale based on count
    const maxCount = d3.max(flatBins, d => d.count)
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, maxCount])
    
    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat('')
      )
    
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat('')
      )
    
    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => formatComparisonValueShort(d)))
      .style('font-size', '11px')
    
    svg.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => formatComparisonValueShort(d)))
      .style('font-size', '11px')
    
    // Axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 35)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('GDP (USD)')
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 18)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('Spending (USD)')
    
    // Draw heatmap rectangles
    svg.selectAll('rect.heatmap-cell')
      .data(flatBins)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => xScale(d.x))
      .attr('y', d => yScale(d.y + d.height))
      .attr('width', d => xScale(d.x + d.width) - xScale(d.x))
      .attr('height', d => yScale(d.y) - yScale(d.y + d.height))
      .attr('fill', d => colorScale(d.count))
      .attr('opacity', 0.9)
      .attr('stroke', '#666')
      .attr('stroke-width', 1.5)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 2)
          .attr('stroke', '#333')
        
        const countryList = d.countries.slice(0, 5).map(c => c.country).join(', ')
        const moreText = d.count > 5 ? ` +${d.count - 5} more` : ''
        
        const tooltipContent = `
          <div style="font-weight: bold; margin-bottom: 4px;">${d.count} ${d.count === 1 ? 'Country' : 'Countries'}</div>
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${countryList}${moreText}</div>
          <div style="color: #3b82f6; font-size: 11px;">GDP: ${formatComparisonValueShort(d.x)} - ${formatComparisonValueShort(d.x + d.width)}</div>
          <div style="color: #ef4444; font-size: 11px;">Spending: ${formatComparisonValueShort(d.y)} - ${formatComparisonValueShort(d.y + d.height)}</div>
        `
        
        setTooltip({
          show: true,
          x: event.pageX,
          y: event.pageY - 120, // Position above cursor to avoid cutoff at bottom
          content: tooltipContent
        })
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.9)
          .attr('stroke-width', 1.5)
          .attr('stroke', '#666')
        
        setTooltip({ show: false, x: 0, y: 0, content: '' })
      })
    
  }, [data, selectedYear, visibility])
  
  return (
    <div className="bubble-chart" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
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
            top: tooltip.y - 10,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  )
}

export default BubbleChart
