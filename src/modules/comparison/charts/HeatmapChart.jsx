/**
 * HeatmapChart - Correlation heatmap between indicators
 * 
 * Features:
 * - Correlation matrix visualization
 * - Color scale from negative to positive correlation
 * - Interactive tooltips
 * - Hover highlighting
 * 
 * Requirements: 3.1, 3.5, 4.1, 4.2, 4.3
 */

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useComparison } from '../context/ComparisonContext.jsx'
import ChartTooltip from '../components/ChartTooltip.jsx'
import { formatNumber } from '../utils/formatNumber.js'

export function HeatmapChart({ width = 800, height = 600 }) {
  const svgRef = useRef(null)
  const { state } = useComparison()
  const [tooltipData, setTooltipData] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)

  useEffect(() => {
    if (!state.chartData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 100, right: 50, bottom: 50, left: 100 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Prepare data - calculate correlation matrix
    const countries = Object.keys(state.chartData.countries)
    const years = state.chartData.years

    // Get values for each country across all years
    const countryVectors = countries.map(country => {
      const values = years.map(year => {
        const value = state.chartData.countries[country].data[year]
        return value !== undefined && !isNaN(value) ? value : null
      })
      return { country, values }
    }).filter(cv => cv.values.some(v => v !== null))

    if (countryVectors.length < 2) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text('Insufficient data for correlation analysis')
      return
    }

    // Calculate correlation matrix (limit to first 20 countries for readability)
    const limitedCountries = countryVectors.slice(0, 20)
    const correlationMatrix = []

    limitedCountries.forEach((cv1, i) => {
      limitedCountries.forEach((cv2, j) => {
        const correlation = calculateCorrelation(cv1.values, cv2.values)
        correlationMatrix.push({
          country1: cv1.country,
          country2: cv2.country,
          correlation: isNaN(correlation) ? 0 : correlation,
          i,
          j
        })
      })
    })

    // Create scales
    const cellSize = Math.min(
      innerWidth / limitedCountries.length,
      innerHeight / limitedCountries.length
    )

    const xScale = d3.scaleBand()
      .domain(limitedCountries.map(cv => cv.country))
      .range([0, limitedCountries.length * cellSize])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(limitedCountries.map(cv => cv.country))
      .range([0, limitedCountries.length * cellSize])
      .padding(0.05)

    const colorScale = d3.scaleSequential()
      .domain([-1, 1])
      .interpolator(d3.interpolateRdBu)

    // Draw cells
    const cells = g.selectAll('.cell')
      .data(correlationMatrix)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.country1))
      .attr('y', d => yScale(d.country2))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.correlation))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')

    // Add hover effects
    cells
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#000')
          .attr('stroke-width', 2)

        // Highlight row and column
        g.selectAll('.cell')
          .filter(cell => cell.country1 === d.country1 || cell.country2 === d.country2)
          .attr('opacity', 1)

        g.selectAll('.cell')
          .filter(cell => cell.country1 !== d.country1 && cell.country2 !== d.country2)
          .attr('opacity', 0.3)

        setTooltipData({
          countryName: `${d.country1} vs ${d.country2}`,
          value: d.correlation,
          additionalInfo: {
            'Correlation': d.correlation.toFixed(3),
            'Strength': getCorrelationStrength(d.correlation)
          }
        })
        setTooltipPosition({ x: event.pageX, y: event.pageY })
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)

        g.selectAll('.cell')
          .attr('opacity', 1)

        setTooltipData(null)
      })

    // Add X axis labels
    g.selectAll('.x-label')
      .data(limitedCountries)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', d => xScale(d.country) + xScale.bandwidth() / 2)
      .attr('y', -10)
      .attr('text-anchor', 'end')
      .attr('transform', d => {
        const x = xScale(d.country) + xScale.bandwidth() / 2
        return `rotate(-45, ${x}, -10)`
      })
      .attr('font-size', '10px')
      .text(d => d.country.length > 15 ? d.country.substring(0, 15) + '...' : d.country)

    // Add Y axis labels
    g.selectAll('.y-label')
      .data(limitedCountries)
      .enter()
      .append('text')
      .attr('class', 'y-label')
      .attr('x', -10)
      .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .text(d => d.country.length > 15 ? d.country.substring(0, 15) + '...' : d.country)

    // Add color legend
    const legendWidth = 200
    const legendHeight = 20
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth - legendWidth}, ${-60})`)

    const legendScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, legendWidth])

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.1f'))

    // Create gradient
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'correlation-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')

    gradient.selectAll('stop')
      .data(d3.range(-1, 1.1, 0.1))
      .enter()
      .append('stop')
      .attr('offset', d => ((d + 1) / 2 * 100) + '%')
      .attr('stop-color', d => colorScale(d))

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#correlation-gradient)')

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis)

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Correlation Coefficient')

    return () => {
      svg.selectAll('*').remove()
      setTooltipData(null)
    }
  }, [state.chartData, width, height])

  return (
    <div className="heatmap-chart">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <ChartTooltip
        data={tooltipData}
        position={tooltipPosition}
        visible={!!tooltipData}
      />
    </div>
  )
}

// Helper functions
function calculateCorrelation(x, y) {
  // Filter out null values
  const pairs = x.map((xi, i) => [xi, y[i]]).filter(([xi, yi]) => xi !== null && yi !== null)
  
  if (pairs.length < 2) return 0

  const xValues = pairs.map(p => p[0])
  const yValues = pairs.map(p => p[1])

  const n = xValues.length
  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, xi, i) => sum + xi * yValues[i], 0)
  const sumX2 = xValues.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = yValues.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

function getCorrelationStrength(correlation) {
  const abs = Math.abs(correlation)
  if (abs >= 0.9) return 'Very Strong'
  if (abs >= 0.7) return 'Strong'
  if (abs >= 0.5) return 'Moderate'
  if (abs >= 0.3) return 'Weak'
  return 'Very Weak'
}

export default HeatmapChart
