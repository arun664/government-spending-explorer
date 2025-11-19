/**
 * YearComparisonBarChart.jsx - Year-over-year comparison
 * 
 * Features:
 * - Side-by-side bars for GDP and Spending
 * - Comparison for selected year
 */

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { formatComparisonValueShort } from '../utils/formatComparisonValue.js'

// Country code mapping
const COUNTRY_CODES = {
  'United States': 'USA',
  'China': 'CHN',
  'Japan': 'JPN',
  'Germany': 'DEU',
  'United Kingdom': 'GBR',
  'India': 'IND',
  'France': 'FRA',
  'Italy': 'ITA',
  'Brazil': 'BRA',
  'Canada': 'CAN',
  'Russia': 'RUS',
  'South Korea': 'KOR',
  'Spain': 'ESP',
  'Australia': 'AUS',
  'Mexico': 'MEX',
  'Indonesia': 'IDN',
  'Netherlands': 'NLD',
  'Saudi Arabia': 'SAU',
  'Turkey': 'TUR',
  'Switzerland': 'CHE'
}

function getCountryCode(countryName) {
  return COUNTRY_CODES[countryName] || countryName.substring(0, 3).toUpperCase()
}

function YearComparisonBarChart({ 
  data, 
  visibility = { gdp: true, spending: true },
  selectedYear,
  onYearChange
}) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' })
  const [sortBy, setSortBy] = useState('gdp') // 'gdp' or 'spending'
  const [showTopBottom, setShowTopBottom] = useState('top') // 'top' or 'bottom'
  
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
    const containerHeight = svgRef.current.clientHeight || 250
    const margin = { top: 10, right: 30, bottom: 50, left: 70 }
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
    
    // Get unique years for year selector
    const years = [...new Set(data.map(d => d.year))].sort()
    
    // Aggregate by country across ALL years in the range (like GDP page does)
    // Calculate average GDP/spending per country across the year range
    const countryData = d3.rollup(
      data,
      v => ({
        gdp: d3.mean(v, d => d.gdp),
        spending: d3.mean(v, d => d.spending),
        dataPoints: v.length
      }),
      d => d.country
    )
    
    // Sort all countries first
    const sortedData = Array.from(countryData, ([country, values]) => ({
      country,
      countryCode: getCountryCode(country),
      gdp: values.gdp,
      spending: values.spending,
      dataPoints: values.dataPoints
    }))
      .sort((a, b) => sortBy === 'gdp' ? b.gdp - a.gdp : b.spending - a.spending)
    
    // Debug: Log top 10 countries to verify ranking and check for China
    if (sortBy === 'gdp' && showTopBottom === 'top') {
      console.log('📊 Comparison Page - Top 10 by GDP:', sortedData.slice(0, 10).map((d, i) => ({
        rank: i + 1,
        country: d.country,
        avgGDP: `${(d.gdp / 1_000_000).toFixed(2)}T`,
        rawGDP: d.gdp,
        dataPoints: d.dataPoints
      })))
      
      // Check if China exists in the data at all
      const chinaData = sortedData.find(d => d.country.toLowerCase().includes('china'))
      if (chinaData) {
        const chinaRank = sortedData.indexOf(chinaData) + 1
        console.log('🔍 China found at rank:', chinaRank, {
          country: chinaData.country,
          avgGDP: `${(chinaData.gdp / 1_000_000).toFixed(2)}T`,
          rawGDP: chinaData.gdp,
          dataPoints: chinaData.dataPoints
        })
      } else {
        console.warn('⚠️ China NOT found in comparison data!')
        console.log('All countries in dataset:', sortedData.map(d => d.country).slice(0, 20))
      }
    }
    
    // Get top 15 or bottom 15 based on toggle
    const aggregatedData = showTopBottom === 'top' 
      ? sortedData.slice(0, 15)
      : sortedData.slice(-15).reverse() // Bottom 15, reversed to show lowest first
    
    // Scales
    const xScale = d3.scaleBand()
      .domain(aggregatedData.map(d => d.countryCode))
      .range([0, width])
      .padding(0.3)
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(aggregatedData, d => Math.max(d.gdp, d.spending)) * 1.1])
      .range([height, 0])
    
    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('font-size', '9px')
    
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
    
    const barWidth = xScale.bandwidth() / 2
    
    // Draw GDP bars
    if (visibility.gdp) {
      svg.selectAll('.bar-gdp')
        .data(aggregatedData)
        .enter()
        .append('rect')
        .attr('class', 'bar-gdp')
        .attr('x', d => xScale(d.countryCode))
        .attr('y', d => yScale(d.gdp))
        .attr('width', barWidth)
        .attr('height', d => height - yScale(d.gdp))
        .attr('fill', '#3b82f6')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('opacity', 0.7)
          const ratio = ((d.spending / d.gdp) * 100).toFixed(2)
          setTooltip({
            show: true,
            x: event.pageX,
            y: event.pageY - 80,
            content: `
              <div style="font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">${d.country} (${d.countryCode})</div>
              <div style="color: #3b82f6; margin: 4px 0;">
                <div style="font-size: 10px; font-weight: 600;">Avg GDP</div>
                <div style="font-size: 12px; font-weight: 700;">${formatComparisonValueShort(d.gdp)}</div>
              </div>
              <div style="color: #666; margin: 4px 0; font-size: 10px;">
                Avg Spending/GDP Ratio: ${ratio}%
              </div>
              <div style="color: #999; margin-top: 4px; font-size: 9px;">
                Based on ${d.dataPoints} data points
              </div>
            `
          })
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 1)
          setTooltip({ show: false, x: 0, y: 0, content: '' })
        })
    }
    
    // Draw Spending bars
    if (visibility.spending) {
      svg.selectAll('.bar-spending')
        .data(aggregatedData)
        .enter()
        .append('rect')
        .attr('class', 'bar-spending')
        .attr('x', d => xScale(d.countryCode) + barWidth)
        .attr('y', d => yScale(d.spending))
        .attr('width', barWidth)
        .attr('height', d => height - yScale(d.spending))
        .attr('fill', '#ef4444')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('opacity', 0.7)
          const ratio = ((d.spending / d.gdp) * 100).toFixed(2)
          setTooltip({
            show: true,
            x: event.pageX,
            y: event.pageY - 80,
            content: `
              <div style="font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">${d.country} (${d.countryCode})</div>
              <div style="color: #ef4444; margin: 4px 0;">
                <div style="font-size: 10px; font-weight: 600;">Avg Government Spending</div>
                <div style="font-size: 12px; font-weight: 700;">${formatComparisonValueShort(d.spending)}</div>
              </div>
              <div style="color: #666; margin: 4px 0; font-size: 10px;">
                Avg Spending/GDP Ratio: ${ratio}%
              </div>
              <div style="color: #999; margin-top: 4px; font-size: 9px;">
                Based on ${d.dataPoints} data points
              </div>
            `
          })
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 1)
          setTooltip({ show: false, x: 0, y: 0, content: '' })
        })
    }
    
    // Year selector removed - now controlled by universal filter in sub-header
    
  }, [data, visibility, selectedYear, onYearChange, sortBy, showTopBottom])
  
  return (
    <div className="year-comparison-bar-chart" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Sort Order Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px', 
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="sortOrder" 
              value="gdp"
              checked={sortBy === 'gdp'}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ cursor: 'pointer' }}
            />
            <span>Order by GDP</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="sortOrder" 
              value="spending"
              checked={sortBy === 'spending'}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ cursor: 'pointer' }}
            />
            <span>Order by Spending</span>
          </label>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="topBottom" 
              value="top"
              checked={showTopBottom === 'top'}
              onChange={(e) => setShowTopBottom(e.target.value)}
              style={{ cursor: 'pointer' }}
            />
            <span>🏆 Top 15</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="topBottom" 
              value="bottom"
              checked={showTopBottom === 'bottom'}
              onChange={(e) => setShowTopBottom(e.target.value)}
              style={{ cursor: 'pointer' }}
            />
            <span>📉 Bottom 15</span>
          </label>
        </div>
      </div>
      
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

export default YearComparisonBarChart
