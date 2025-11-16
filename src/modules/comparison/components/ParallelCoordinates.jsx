/**
 * ParallelCoordinates Component - Clean, optimized version
 * 
 * Multi-dimensional visualization for country comparisons.
 * No infinite loops, minimal re-renders, efficient data processing.
 */

import React, { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'

const ParallelCoordinates = ({ 
  data = [],
  width = 1000, 
  height = 600, 
  selectedCountries = [], 
  yearRange = [2000, 2020],
  onCountrySelect = () => {}
}) => {
  const svgRef = useRef()

  // Define dimensions for parallel coordinates
  const dimensions = [
    { key: 'gdpGrowth', label: 'GDP Growth (%)', format: d3.format('.1f') },
    { key: 'totalSpending', label: 'Gov Spending (% GDP)', format: d3.format('.1f') },
    { key: 'year', label: 'Year', format: d3.format('d') }
  ]

  // Memoized processed data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Filter by selected countries and year range
    const filtered = data.filter(record => {
      const countryMatch = selectedCountries.length === 0 || 
                          selectedCountries.includes(record.countryName)
      const yearMatch = record.year >= yearRange[0] && record.year <= yearRange[1]
      return countryMatch && yearMatch && record.validation?.isValid !== false
    })

    // Group by country and take recent data
    const countryGroups = d3.group(filtered, d => d.countryName)
    const result = []

    countryGroups.forEach((records, countryName) => {
      // Take the most recent 5 years of data for each country
      const recentRecords = records
        .sort((a, b) => b.year - a.year)
        .slice(0, 5)
      
      recentRecords.forEach(record => {
        if (record.gdpGrowth !== null && record.totalSpending !== null) {
          result.push({
            countryName: record.countryName,
            gdpGrowth: record.gdpGrowth,
            totalSpending: record.totalSpending,
            year: record.year
          })
        }
      })
    })

    return result.slice(0, 200) // Limit for performance
  }, [data, selectedCountries, yearRange])

  // Render parallel coordinates
  useEffect(() => {
    if (!processedData.length || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 60, right: 120, bottom: 60, left: 120 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create scales for each dimension
    const scales = {}
    dimensions.forEach(dim => {
      const extent = d3.extent(processedData, d => d[dim.key])
      scales[dim.key] = d3.scaleLinear()
        .domain(extent)
        .range([innerHeight, 0])
        .nice()
    })

    // X scale for positioning dimensions
    const xScale = d3.scalePoint()
      .domain(dimensions.map(d => d.key))
      .range([0, innerWidth])
      .padding(0.1)

    // Color scale for countries
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

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
      .text('Multi-Dimensional Country Analysis')

    // Add subtitle
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text(`${yearRange[0]} - ${yearRange[1]} | ${processedData.length} Data Points`)

    // Line generator
    const line = d3.line()
      .x(d => xScale(d.dimension))
      .y(d => d.value)
      .curve(d3.curveCardinal)

    // Group data by country for lines
    const countryGroups = d3.group(processedData, d => d.countryName)

    // Draw lines for each country
    countryGroups.forEach((records, countryName) => {
      records.forEach(record => {
        const lineData = dimensions.map(dim => ({
          dimension: dim.key,
          value: scales[dim.key](record[dim.key])
        }))

        g.append('path')
          .datum(lineData)
          .attr('class', 'country-line')
          .attr('d', line)
          .style('fill', 'none')
          .style('stroke', colorScale(countryName))
          .style('stroke-width', 1.5)
          .style('opacity', 0.6)
          .style('cursor', 'pointer')
          .on('mouseover', function() {
            d3.select(this)
              .style('stroke-width', 3)
              .style('opacity', 1)
          })
          .on('mouseout', function() {
            d3.select(this)
              .style('stroke-width', 1.5)
              .style('opacity', 0.6)
          })
          .on('click', () => onCountrySelect([countryName]))
          .append('title')
          .text(`${countryName} (${record.year})`)
      })
    })

    // Draw axes
    dimensions.forEach(dim => {
      const axis = g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${xScale(dim.key)}, 0)`)

      // Add axis line
      axis.append('line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .style('stroke', '#333')
        .style('stroke-width', 1)

      // Add ticks and labels
      const tickValues = scales[dim.key].ticks(6)
      
      axis.selectAll('.tick')
        .data(tickValues)
        .enter()
        .append('g')
        .attr('class', 'tick')
        .attr('transform', d => `translate(0, ${scales[dim.key](d)})`)
        .each(function(d) {
          const tick = d3.select(this)
          
          // Tick line
          tick.append('line')
            .attr('x1', -5)
            .attr('x2', 5)
            .style('stroke', '#333')
          
          // Tick label
          tick.append('text')
            .attr('x', -10)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('font-size', '11px')
            .style('fill', '#666')
            .text(dim.format(d))
        })

      // Add dimension label
      axis.append('text')
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .text(dim.label)
    })

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 100}, ${margin.top + 20})`)

    const uniqueCountries = Array.from(new Set(processedData.map(d => d.countryName))).slice(0, 10)
    
    const legendItems = legend.selectAll('.legend-item')
      .data(uniqueCountries)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 18})`)
      .style('cursor', 'pointer')
      .on('click', d => onCountrySelect([d]))

    legendItems.append('line')
      .attr('x1', 0)
      .attr('x2', 15)
      .attr('y1', 0)
      .attr('y2', 0)
      .style('stroke', d => colorScale(d))
      .style('stroke-width', 3)

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text(d => d.length > 15 ? d.substring(0, 15) + '...' : d)

  }, [processedData, width, height, yearRange, onCountrySelect])

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
        No data available for parallel coordinates
      </div>
    )
  }

  if (!processedData.length) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        color: '#6c757d',
        fontSize: '16px'
      }}>
        No data matches the current filters
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

export default ParallelCoordinates