/**
 * RatioAreaChart.jsx - Spending as % of GDP over time
 * 
 * Features:
 * - Area chart showing spending-to-GDP ratio
 * - Highlights periods of high/low spending
 */

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

function RatioAreaChart({ 
  data, 
  visibility = { gdp: true, spending: true },
  onHover,
  highlightYear 
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
    if (!visibility.gdp && !visibility.spending) return
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()
    
    // Dimensions
    const margin = { top: 20, right: 60, bottom: 40, left: 70 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    // Group data by year and calculate average ratio
    const yearData = d3.group(data, d => d.year)
    const aggregatedData = Array.from(yearData, ([year, values]) => ({
      year,
      ratio: d3.mean(values, d => d.ratio)
    })).sort((a, b) => a.year - b.year)
    
    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(aggregatedData, d => d.year))
      .range([0, width])
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(aggregatedData, d => d.ratio) * 1.1])
      .range([height, 0])
    
    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat('')
      )
    
    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
      .style('font-size', '11px')
    
    svg.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d.toFixed(1)}%`))
      .style('font-size', '11px')
    
    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Spending as % of GDP')
    
    // Area generator
    const area = d3.area()
      .x(d => xScale(d.year))
      .y0(height)
      .y1(d => yScale(d.ratio))
      .curve(d3.curveMonotoneX)
    
    // Draw area
    svg.append('path')
      .datum(aggregatedData)
      .attr('class', 'area-ratio')
      .attr('fill', '#8b5cf6')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 2)
      .attr('d', area)
    
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
        
        // Highlight point
        svg.append('circle')
          .attr('cx', xScale(highlightYear))
          .attr('cy', yScale(yearPoint.ratio))
          .attr('r', 5)
          .attr('fill', '#fbbf24')
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
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
          <div style="font-weight: bold; margin-bottom: 4px;">${year}</div>
          <div style="color: #8b5cf6;">Spending Ratio: ${yearPoint.ratio.toFixed(2)}%</div>
        `
        
        setTooltip({
          show: true,
          x: event.pageX,
          y: event.pageY,
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
    <div className="ratio-area-chart" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chart-title">Spending as % of GDP</div>
      {data && data.length > 0 ? (
        <svg ref={svgRef} width="100%" height="300"></svg>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af' }}>
          No data available for the selected filters
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

export default RatioAreaChart
