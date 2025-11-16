/**
 * CorrelationHeatmap Component - Clean, optimized version
 * 
 * Shows correlation patterns between GDP growth and spending across countries.
 * No infinite loops, minimal re-renders, efficient data processing.
 */

import React, { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'

// Calculate Pearson correlation coefficient
const calculatePearsonCorrelation = (x, y) => {
  if (x.length !== y.length || x.length === 0) return 0
  
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  return denominator === 0 ? 0 : numerator / denominator
}

// Calculate correlation matrix for countries
const calculateCorrelationMatrix = (data) => {
  if (!data || data.length === 0) return null
  
  // Group data by country
  const countryGroups = d3.group(data, d => d.countryName)
  const countries = Array.from(countryGroups.keys()).sort().slice(0, 20) // Limit to 20 countries for performance

  // Calculate pairwise correlations between countries
  const matrix = []
  
  countries.forEach((country1, i) => {
    const row = []
    countries.forEach((country2, j) => {
      if (i === j) {
        row.push({ correlation: 1, country1, country2, significance: 1 })
      } else {
        const data1 = countryGroups.get(country1)
        const data2 = countryGroups.get(country2)
        
        // Calculate correlation between GDP growth patterns
        const correlation = calculatePearsonCorrelation(
          data1.map(d => d.gdpGrowth),
          data2.map(d => d.gdpGrowth)
        )
        
        row.push({ 
          correlation: isNaN(correlation) ? 0 : correlation, 
          country1, 
          country2,
          significance: Math.abs(correlation)
        })
      }
    })
    matrix.push(row)
  })
  
  return { matrix, countries }
}

const CorrelationHeatmap = ({ 
  data = [], 
  width = 800, 
  height = 600, 
  selectedCountries = [], 
  yearRange = [2000, 2020],
  onCountrySelect = () => {}
}) => {
  const svgRef = useRef()

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.filter(record => {
      const countryMatch = selectedCountries.length === 0 || 
                          selectedCountries.includes(record.countryName)
      const yearMatch = record.year >= yearRange[0] && record.year <= yearRange[1]
      return countryMatch && yearMatch && record.validation?.isValid !== false
    })
  }, [data, selectedCountries, yearRange])

  // Memoized correlation matrix
  const correlationMatrix = useMemo(() => {
    return calculateCorrelationMatrix(filteredData)
  }, [filteredData])

  // Render heatmap
  useEffect(() => {
    if (!correlationMatrix || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { countries, matrix } = correlationMatrix
    const margin = { top: 80, right: 120, bottom: 80, left: 120 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create scales
    const xScale = d3.scaleBand()
      .domain(countries)
      .range([0, innerWidth])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(countries)
      .range([0, innerHeight])
      .padding(0.05)

    // Color scale for correlations
    const colorScale = d3.scaleSequential()
      .domain([-1, 1])
      .interpolator(d3.interpolateRdBu)

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#2d3748')
      .text('GDP Growth Correlation Matrix')

    // Add subtitle
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text(`${yearRange[0]} - ${yearRange[1]} | ${countries.length} Countries`)

    // Create cells
    const cells = g.selectAll('.cell')
      .data(matrix.flat())
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.country2))
      .attr('y', d => yScale(d.country1))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.correlation))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')

    // Add cell labels
    g.selectAll('.cell-label')
      .data(matrix.flat())
      .enter()
      .append('text')
      .attr('class', 'cell-label')
      .attr('x', d => xScale(d.country2) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.country1) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('fill', d => Math.abs(d.correlation) > 0.5 ? 'white' : 'black')
      .style('font-weight', 'bold')
      .text(d => d.correlation.toFixed(2))

    // Add x-axis labels
    g.selectAll('.x-label')
      .data(countries)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
      .attr('y', innerHeight + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#4a5568')
      .text(d => d.length > 12 ? d.substring(0, 12) + '...' : d)
      .attr('transform', d => `rotate(-45, ${xScale(d) + xScale.bandwidth() / 2}, ${innerHeight + 20})`)

    // Add y-axis labels
    g.selectAll('.y-label')
      .data(countries)
      .enter()
      .append('text')
      .attr('class', 'y-label')
      .attr('x', -10)
      .attr('y', d => yScale(d) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#4a5568')
      .text(d => d.length > 15 ? d.substring(0, 15) + '...' : d)

    // Add vertical color legend
    const legendWidth = 20
    const legendHeight = 200
    const legendX = width - margin.right + 10
    const legendY = margin.top + 50

    const legendScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([legendHeight, 0]) // Reversed for vertical

    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.1f'))

    // Create vertical gradient for legend
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'correlation-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%')

    gradient.selectAll('stop')
      .data(d3.range(-1, 1.1, 0.1))
      .enter()
      .append('stop')
      .attr('offset', d => `${((1 - d) / 2) * 100}%`) // Reversed for vertical
      .attr('stop-color', d => colorScale(d))

    // Add legend rectangle
    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#correlation-gradient)')
      .style('stroke', '#ccc')

    // Add legend axis
    svg.append('g')
      .attr('transform', `translate(${legendX + legendWidth}, ${legendY})`)
      .call(legendAxis)

    // Add legend title (rotated for vertical)
    svg.append('text')
      .attr('x', legendX + legendWidth + 40)
      .attr('y', legendY + legendHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90, ${legendX + legendWidth + 40}, ${legendY + legendHeight / 2})`)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#4a5568')
      .text('Correlation Coefficient')

    // Add interactivity
    cells.on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke', '#333')
        .attr('stroke-width', 2)
      
      // Show tooltip (simple implementation)
      const tooltip = svg.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${event.layerX}, ${event.layerY - 10})`)
      
      const rect = tooltip.append('rect')
        .attr('fill', 'rgba(0,0,0,0.8)')
        .attr('rx', 4)
        .attr('ry', 4)
      
      const text = tooltip.append('text')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('x', 8)
        .attr('y', 16)
        .text(`${d.country1} ↔ ${d.country2}: ${d.correlation.toFixed(3)}`)
      
      const bbox = text.node().getBBox()
      rect.attr('width', bbox.width + 16)
        .attr('height', bbox.height + 8)
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
      
      svg.select('.tooltip').remove()
    })
    .on('click', function(event, d) {
      onCountrySelect([d.country1, d.country2])
    })

  }, [correlationMatrix, width, height, yearRange, onCountrySelect])

  // Show loading or error states
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        color: '#6c757d',
        fontSize: '16px'
      }}>
        No data available for correlation analysis
      </div>
    )
  }

  if (!correlationMatrix) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        color: '#6c757d',
        fontSize: '16px'
      }}>
        Insufficient data for correlation matrix
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: '#fafafa', border: '1px solid #e2e8f0' }}
      />
    </div>
  )
}

export default CorrelationHeatmap