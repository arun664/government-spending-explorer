/**
 * ScatterPlotChart - Interactive scatter plot for GDP vs Spending comparison
 * 
 * Features:
 * - GDP vs spending scatter plot with color-coded regions
 * - Animated time-series with country trajectory trails
 * - Interactive zoom, pan, and quadrant analysis
 * - Independent implementation for comparison module
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { numberFormatter } from '../utils/NumberFormatter.js'

const ScatterPlotChart = ({ 
  data = [], 
  width = 800, 
  height = 600,
  selectedYear = null,
  selectedCountries = [],
  showTrails = true,
  animationSpeed = 1000,
  onCountrySelect = null,
  onYearChange = null,
  className = ''
}) => {
  const svgRef = useRef()
  const [currentYear, setCurrentYear] = useState(selectedYear)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hoveredCountry, setHoveredCountry] = useState(null)

  // Chart dimensions and margins - increased right margin for legend, left margin for y-axis label
  const margin = { top: 40, right: 180, bottom: 60, left: 100 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Enhanced color scale for regions with more specific categories
  const regionColors = d3.scaleOrdinal()
    .domain([
      'North America', 'Western Europe', 'Eastern Europe', 'East Asia', 
      'South Asia', 'Southeast Asia', 'Middle East', 'Africa', 
      'South America', 'Oceania', 'Other'
    ])
    .range([
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8'
    ])

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
            region: getRegionFromCountry(country), // Helper function to determine region
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
      setCurrentYear(availableYears[availableYears.length - 1]) // Default to latest year
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

  // Filter data for current year
  const currentYearData = React.useMemo(() => {
    return processedData.filter(d => d.year === currentYear && d.isSelected)
  }, [processedData, currentYear])



  // Get trail data for selected countries
  const trailData = React.useMemo(() => {
    if (!showTrails || selectedCountries.length === 0) return []
    
    const trails = []
    selectedCountries.forEach(country => {
      const countryData = processedData
        .filter(d => d.country === country)
        .sort((a, b) => a.year - b.year)
      
      if (countryData.length > 1) {
        trails.push({
          country,
          path: countryData,
          region: countryData[0]?.region
        })
      }
    })
    
    return trails
  }, [processedData, selectedCountries, showTrails])

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
        g.attr('transform', `translate(${margin.left + transform.x},${margin.top + transform.y}) scale(${transform.k})`)
      })

    svg.call(zoom)

    // Add quadrant lines (at origin)
    const xZero = xScale(0)
    const yZero = yScale(0)

    if (xZero >= 0 && xZero <= chartWidth) {
      g.append('line')
        .attr('x1', xZero)
        .attr('x2', xZero)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#ddd')
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.7)
    }

    if (yZero >= 0 && yZero <= chartHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', yZero)
        .attr('y2', yZero)
        .attr('stroke', '#ddd')
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.7)
    }

    // Add quadrant labels
    const quadrantLabels = [
      { x: chartWidth * 0.75, y: chartHeight * 0.25, text: 'High Growth\nHigh Spending', anchor: 'middle' },
      { x: chartWidth * 0.25, y: chartHeight * 0.25, text: 'Low Growth\nHigh Spending', anchor: 'middle' },
      { x: chartWidth * 0.25, y: chartHeight * 0.75, text: 'Low Growth\nLow Spending', anchor: 'middle' },
      { x: chartWidth * 0.75, y: chartHeight * 0.75, text: 'High Growth\nLow Spending', anchor: 'middle' }
    ]

    quadrantLabels.forEach(label => {
      g.append('text')
        .attr('x', label.x)
        .attr('y', label.y)
        .attr('text-anchor', label.anchor)
        .attr('fill', '#999')
        .attr('font-size', '12px')
        .attr('opacity', 0.6)
        .selectAll('tspan')
        .data(label.text.split('\n'))
        .enter()
        .append('tspan')
        .attr('x', label.x)
        .attr('dy', (d, i) => i === 0 ? 0 : '1.2em')
        .text(d => d)
    })

    // Draw trails first (behind points)
    if (showTrails && trailData.length > 0) {
      const line = d3.line()
        .x(d => xScale(d.gdpGrowth))
        .y(d => yScale(d.totalSpending))
        .curve(d3.curveCardinal)

      trailData.forEach(trail => {
        g.append('path')
          .datum(trail.path)
          .attr('fill', 'none')
          .attr('stroke', regionColors(trail.region))
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.4)
          .attr('d', line)
          .attr('class', 'country-trail')
      })
    }

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'scatter-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000)

    // Draw points
    const circles = g.selectAll('.country-point')
      .data(currentYearData)
      .enter()
      .append('circle')
      .attr('class', 'country-point')
      .attr('cx', d => xScale(d.gdpGrowth))
      .attr('cy', d => yScale(d.totalSpending))
      .attr('r', 0)
      .attr('fill', d => regionColors(d.region))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')

    // Animate points in
    circles.transition()
      .duration(animationSpeed)
      .attr('r', 6)

    // Add interactions
    circles
      .on('mouseover', function(event, d) {
        setHoveredCountry(d.country)
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8)
          .attr('stroke-width', 2)

        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.country}</strong><br/>
            Year: ${d.year}<br/>
            GDP Growth: ${numberFormatter.formatGDPGrowth(d.gdpGrowth)}<br/>
            Spending: ${numberFormatter.formatPercentage(d.totalSpending)}% of GDP<br/>
            Region: ${d.region}
          `)
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
          .attr('r', 6)
          .attr('stroke-width', 1)

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
      .attr('y', -70)
      .text('Government Spending (% of GDP)')
      .style('font-size', '14px')
      .style('fill', '#333')



    // Add legend - positioned safely within the right margin
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top + 20})`)

    // Get regions and sort them, excluding 'Other' if it has very few countries
    const regionCounts = d3.rollup(currentYearData, v => v.length, d => d.region)
    const regions = [...regionCounts.keys()]
      .filter(region => region !== 'Other' || regionCounts.get(region) > 2) // Only show 'Other' if it has more than 2 countries
      .sort((a, b) => regionCounts.get(b) - regionCounts.get(a)) // Sort by count, descending
    
    // Add legend title
    legend.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Regions')
    
    // Create legend items in single column with proper spacing
    const legendItems = legend.selectAll('.legend-item')
      .data(regions)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20 + 10})`)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        // Filter to show only countries from this region
        const regionCountries = currentYearData
          .filter(country => country.region === d)
          .map(country => country.country)
        if (onCountrySelect) {
          onCountrySelect(regionCountries.slice(0, 10)) // Limit to 10 countries
        }
      })

    legendItems.append('circle')
      .attr('r', 5)
      .attr('fill', d => regionColors(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)

    legendItems.append('text')
      .attr('x', 12)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .text(d => {
        const count = regionCounts.get(d)
        return `${d} (${count})`
      })
      .style('font-size', '11px')
      .style('fill', '#333')
      
    // Add hover effects
    legendItems
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .attr('r', 7)
          .attr('stroke-width', 2)
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
          .attr('r', 5)
          .attr('stroke-width', 1)
      })

    // Cleanup function
    return () => {
      tooltip.remove()
    }

  }, [currentYearData, trailData, xScale, yScale, chartWidth, chartHeight, currentYear, showTrails, animationSpeed])

  // Animation controls
  const playAnimation = useCallback(() => {
    if (isAnimating || availableYears.length <= 1) return

    setIsAnimating(true)
    let yearIndex = 0

    const interval = setInterval(() => {
      if (yearIndex >= availableYears.length) {
        clearInterval(interval)
        setIsAnimating(false)
        return
      }

      setCurrentYear(availableYears[yearIndex])
      if (onYearChange) {
        onYearChange(availableYears[yearIndex])
      }
      yearIndex++
    }, animationSpeed)

    return () => clearInterval(interval)
  }, [availableYears, animationSpeed, isAnimating, onYearChange])

  const stopAnimation = useCallback(() => {
    setIsAnimating(false)
  }, [])

  // Enhanced region mapping function with comprehensive country coverage
  function getRegionFromCountry(countryName) {
    const regionMap = {
      // North America
      'United States': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'Guatemala': 'North America',
      'Honduras': 'North America',
      'El Salvador': 'North America',
      'Nicaragua': 'North America',
      'Costa Rica': 'North America',
      'Panama': 'North America',
      
      // Western Europe
      'Germany': 'Western Europe',
      'France': 'Western Europe',
      'United Kingdom': 'Western Europe',
      'Italy': 'Western Europe',
      'Spain': 'Western Europe',
      'Netherlands': 'Western Europe',
      'Belgium': 'Western Europe',
      'Switzerland': 'Western Europe',
      'Austria': 'Western Europe',
      'Sweden': 'Western Europe',
      'Norway': 'Western Europe',
      'Denmark': 'Western Europe',
      'Finland': 'Western Europe',
      'Ireland': 'Western Europe',
      'Portugal': 'Western Europe',
      'Greece': 'Western Europe',
      'Luxembourg': 'Western Europe',
      'Iceland': 'Western Europe',
      
      // Eastern Europe
      'Russia': 'Eastern Europe',
      'Poland': 'Eastern Europe',
      'Czech Republic': 'Eastern Europe',
      'Hungary': 'Eastern Europe',
      'Slovakia': 'Eastern Europe',
      'Slovenia': 'Eastern Europe',
      'Croatia': 'Eastern Europe',
      'Serbia': 'Eastern Europe',
      'Bosnia and Herzegovina': 'Eastern Europe',
      'Montenegro': 'Eastern Europe',
      'North Macedonia': 'Eastern Europe',
      'Albania': 'Eastern Europe',
      'Bulgaria': 'Eastern Europe',
      'Romania': 'Eastern Europe',
      'Ukraine': 'Eastern Europe',
      'Belarus': 'Eastern Europe',
      'Moldova': 'Eastern Europe',
      'Estonia': 'Eastern Europe',
      'Latvia': 'Eastern Europe',
      'Lithuania': 'Eastern Europe',
      
      // East Asia
      'China': 'East Asia',
      'Japan': 'East Asia',
      'South Korea': 'East Asia',
      'North Korea': 'East Asia',
      'Mongolia': 'East Asia',
      'Taiwan': 'East Asia',
      'Hong Kong': 'East Asia',
      'Macao': 'East Asia',
      
      // South Asia
      'India': 'South Asia',
      'Pakistan': 'South Asia',
      'Bangladesh': 'South Asia',
      'Sri Lanka': 'South Asia',
      'Nepal': 'South Asia',
      'Bhutan': 'South Asia',
      'Maldives': 'South Asia',
      'Afghanistan': 'South Asia',
      
      // Southeast Asia
      'Indonesia': 'Southeast Asia',
      'Thailand': 'Southeast Asia',
      'Vietnam': 'Southeast Asia',
      'Philippines': 'Southeast Asia',
      'Malaysia': 'Southeast Asia',
      'Singapore': 'Southeast Asia',
      'Myanmar': 'Southeast Asia',
      'Cambodia': 'Southeast Asia',
      'Laos': 'Southeast Asia',
      'Brunei': 'Southeast Asia',
      'Timor-Leste': 'Southeast Asia',
      
      // Middle East
      'Turkey': 'Middle East',
      'Iran': 'Middle East',
      'Iraq': 'Middle East',
      'Syria': 'Middle East',
      'Lebanon': 'Middle East',
      'Jordan': 'Middle East',
      'Israel': 'Middle East',
      'Palestine': 'Middle East',
      'Saudi Arabia': 'Middle East',
      'United Arab Emirates': 'Middle East',
      'Qatar': 'Middle East',
      'Kuwait': 'Middle East',
      'Bahrain': 'Middle East',
      'Oman': 'Middle East',
      'Yemen': 'Middle East',
      'Georgia': 'Middle East',
      'Armenia': 'Middle East',
      'Azerbaijan': 'Middle East',
      
      // Africa
      'South Africa': 'Africa',
      'Nigeria': 'Africa',
      'Egypt': 'Africa',
      'Kenya': 'Africa',
      'Ghana': 'Africa',
      'Ethiopia': 'Africa',
      'Morocco': 'Africa',
      'Algeria': 'Africa',
      'Tunisia': 'Africa',
      'Libya': 'Africa',
      'Sudan': 'Africa',
      'Chad': 'Africa',
      'Niger': 'Africa',
      'Mali': 'Africa',
      'Burkina Faso': 'Africa',
      'Senegal': 'Africa',
      'Guinea': 'Africa',
      'Sierra Leone': 'Africa',
      'Liberia': 'Africa',
      'Ivory Coast': 'Africa',
      'Cameroon': 'Africa',
      'Central African Republic': 'Africa',
      'Democratic Republic of the Congo': 'Africa',
      'Republic of the Congo': 'Africa',
      'Gabon': 'Africa',
      'Equatorial Guinea': 'Africa',
      'Angola': 'Africa',
      'Zambia': 'Africa',
      'Zimbabwe': 'Africa',
      'Botswana': 'Africa',
      'Namibia': 'Africa',
      'Mozambique': 'Africa',
      'Madagascar': 'Africa',
      'Mauritius': 'Africa',
      'Tanzania': 'Africa',
      'Uganda': 'Africa',
      'Rwanda': 'Africa',
      'Burundi': 'Africa',
      
      // South America
      'Brazil': 'South America',
      'Argentina': 'South America',
      'Chile': 'South America',
      'Peru': 'South America',
      'Colombia': 'South America',
      'Venezuela': 'South America',
      'Ecuador': 'South America',
      'Bolivia': 'South America',
      'Paraguay': 'South America',
      'Uruguay': 'South America',
      'Guyana': 'South America',
      'Suriname': 'South America',
      'French Guiana': 'South America',
      
      // Oceania
      'Australia': 'Oceania',
      'New Zealand': 'Oceania',
      'Papua New Guinea': 'Oceania',
      'Fiji': 'Oceania',
      'Solomon Islands': 'Oceania',
      'Vanuatu': 'Oceania',
      'Samoa': 'Oceania',
      'Tonga': 'Oceania',
      'Palau': 'Oceania',
      'Marshall Islands': 'Oceania',
      'Micronesia': 'Oceania',
      'Kiribati': 'Oceania',
      'Tuvalu': 'Oceania',
      'Nauru': 'Oceania'
    }
    
    return regionMap[countryName] || 'Other'
  }

  return (
    <div className={`scatter-plot-chart ${className}`}>
      <div className="chart-controls" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label>
            Year: 
            <select 
              value={currentYear || ''} 
              onChange={(e) => {
                const year = parseInt(e.target.value)
                setCurrentYear(year)
                if (onYearChange) onYearChange(year)
              }}
              style={{ marginLeft: '5px' }}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          
          <button 
            onClick={playAnimation} 
            disabled={isAnimating}
            style={{ padding: '5px 10px' }}
          >
            {isAnimating ? 'Playing...' : 'Play Animation'}
          </button>
          
          <button 
            onClick={stopAnimation} 
            disabled={!isAnimating}
            style={{ padding: '5px 10px' }}
          >
            Stop
          </button>
          
          <label>
            <input 
              type="checkbox" 
              checked={showTrails} 
              onChange={(e) => {
                // This would need to be passed as a prop or handled by parent
              }}
            />
            Show Trails
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

export default ScatterPlotChart