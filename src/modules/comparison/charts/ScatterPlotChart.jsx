/**
 * ScatterPlotChart - D3.js scatter plot with correlation analysis
 * 
 * Features:
 * - Scatter plot with trend line
 * - Correlation coefficient display
 * - Color by region using CATEGORY_COLORS
 * - Interactive tooltips
 * - Zoom and pan
 * 
 * Requirements: 3.1, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useComparison } from '../context/ComparisonContext.jsx'
import ChartTooltip from '../components/ChartTooltip.jsx'
import { getNumberFormatter } from '../utils/formatNumber.js'

// Region colors (simplified mapping)
const REGION_COLORS = {
  'Europe': '#4e79a7',
  'Asia': '#f28e2c',
  'Africa': '#e15759',
  'Americas': '#76b7b2',
  'Oceania': '#59a14f',
  'Middle East': '#edc949',
  'Other': '#bab0ab'
}

function getCountryRegion(countryName) {
  // Simplified region mapping - in production, use proper region data
  const regions = {
    'Europe': ['Germany', 'France', 'United Kingdom', 'Italy', 'Spain', 'Poland', 'Netherlands', 'Belgium', 'Greece', 'Portugal', 'Sweden', 'Austria', 'Denmark', 'Finland', 'Norway', 'Ireland', 'Switzerland'],
    'Asia': ['China', 'Japan', 'India', 'South Korea', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Malaysia', 'Singapore', 'Bangladesh', 'Pakistan'],
    'Africa': ['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Ethiopia', 'Ghana', 'Tanzania', 'Uganda', 'Morocco', 'Algeria'],
    'Americas': ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela'],
    'Oceania': ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji'],
    'Middle East': ['Saudi Arabia', 'United Arab Emirates', 'Israel', 'Turkey', 'Iran', 'Iraq', 'Kuwait', 'Qatar']
  }

  for (const [region, countries] of Object.entries(regions)) {
    if (countries.some(c => countryName.includes(c) || c.includes(countryName))) {
      return region
    }
  }
  return 'Other'
}

export function ScatterPlotChart({ width = 800, height = 500, xIndicator, yIndicator }) {
  const svgRef = useRef(null)
  const { state, actions } = useComparison()
  const [tooltipData, setTooltipData] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)

  useEffect(() => {
    if (!state.chartData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 150, bottom: 60, left: 70 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Prepare data - use latest year for each country
    const data = Object.entries(state.chartData.countries)
      .map(([countryName, countryData]) => {
        const values = Object.entries(countryData.data)
          .filter(([_, value]) => !isNaN(value))
          .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))

        if (values.length === 0) return null

        const [latestYear, latestValue] = values[0]
        return {
          country: countryName,
          code: countryData.code,
          value: latestValue,
          year: parseInt(latestYear),
          region: getCountryRegion(countryName)
        }
      })
      .filter(d => d !== null)

    if (data.length === 0) return

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.1])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.1])
      .range([innerHeight, 0])

    const colorScale = d3.scaleOrdinal()
      .domain(Object.keys(REGION_COLORS))
      .range(Object.values(REGION_COLORS))

    // Add zoom with touch support
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .filter((event) => {
        // Allow touch events and mouse wheel
        return !event.ctrlKey && !event.button
      })
      .on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScale)
        const newYScale = event.transform.rescaleY(yScale)

        g.selectAll('circle')
          .attr('cx', d => newXScale(d.value))
          .attr('cy', d => newYScale(d.value))

        const maxX = d3.max(scatterData, d => d.x) || 0
        const maxY = d3.max(scatterData, d => d.y) || 0
        const xAxisFormatter = getNumberFormatter(maxX)
        const yAxisFormatter = getNumberFormatter(maxY)
        
        g.select('.x-axis').call(d3.axisBottom(newXScale).tickFormat(xAxisFormatter))
        g.select('.y-axis').call(d3.axisLeft(newYScale).tickFormat(yAxisFormatter))
      })

    svg.call(zoom)
      .on('touchstart', (event) => {
        // Handle touch for tooltip
        if (event.touches.length === 1) {
          const touch = event.touches[0]
          const [touchX, touchY] = d3.pointer(touch, g.node())
          handleTouchPoint(touchX, touchY, touch.pageX, touch.pageY)
        }
      })
      .on('touchend', () => {
        setTooltipData(null)
        setTooltipPosition(null)
      })

    // Touch handler for finding nearest point
    function handleTouchPoint(x, y, pageX, pageY) {
      let closestPoint = null
      let minDistance = Infinity

      data.forEach(d => {
        const pointX = xScale(d.value)
        const pointY = yScale(d.value)
        const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2))
        
        if (distance < minDistance && distance < 40) { // 40px threshold for touch
          minDistance = distance
          closestPoint = d
        }
      })

      if (closestPoint) {
        setTooltipData({
          countryName: closestPoint.country,
          countryCode: closestPoint.code,
          year: closestPoint.year,
          value: closestPoint.value,
          indicator: state.chartData.metadata?.name,
          unit: state.chartData.metadata?.unit,
          additionalInfo: {
            Region: closestPoint.region
          }
        })
        setTooltipPosition({ x: pageX, y: pageY })
      }
    }

    // Create number formatters
    const maxX = d3.max(scatterData, d => d.x) || 0
    const maxY = d3.max(scatterData, d => d.y) || 0
    const xAxisFormatter = getNumberFormatter(maxX)
    const yAxisFormatter = getNumberFormatter(maxY)

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(xAxisFormatter))

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(yAxisFormatter))

    // Add axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .text(state.chartData.metadata?.name || 'Value')

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text(state.chartData.metadata?.name || 'Value')

    // Calculate correlation and trend line
    const xValues = data.map(d => d.value)
    const yValues = data.map(d => d.value)
    const correlation = calculateCorrelation(xValues, yValues)
    const regression = linearRegression(xValues, yValues)

    // Draw trend line
    const trendLine = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))

    const trendData = [
      { x: d3.min(xValues), y: regression.slope * d3.min(xValues) + regression.intercept },
      { x: d3.max(xValues), y: regression.slope * d3.max(xValues) + regression.intercept }
    ]

    g.append('path')
      .datum(trendData)
      .attr('class', 'trend-line')
      .attr('d', trendLine)
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('fill', 'none')
      .attr('opacity', 0.5)

    // Draw points
    g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.value))
      .attr('cy', d => yScale(d.value))
      .attr('r', 6)
      .attr('fill', d => colorScale(d.region))
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('r', 8)
          .attr('opacity', 1)

        setTooltipData({
          countryName: d.country,
          countryCode: d.code,
          year: d.year,
          value: d.value,
          indicator: state.chartData.metadata?.name,
          unit: state.chartData.metadata?.unit,
          additionalInfo: {
            Region: d.region
          }
        })
        setTooltipPosition({ x: event.pageX, y: event.pageY })
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 6)
          .attr('opacity', 0.7)

        setTooltipData(null)
      })
      .on('click', (event, d) => {
        actions.selectCountry(d.country)
      })

    // Add correlation label
    g.append('text')
      .attr('class', 'correlation-label')
      .attr('x', innerWidth - 10)
      .attr('y', 20)
      .attr('text-anchor', 'end')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(`r = ${correlation.toFixed(3)}`)

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth + 20}, 0)`)

    const regions = [...new Set(data.map(d => d.region))]
    const legendItems = legend.selectAll('.legend-item')
      .data(regions)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)

    legendItems.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 6)
      .attr('fill', d => colorScale(d))

    legendItems.append('text')
      .attr('x', 15)
      .attr('y', 4)
      .attr('font-size', '12px')
      .text(d => d)

    return () => {
      svg.selectAll('*').remove()
      setTooltipData(null)
    }
  }, [state.chartData, width, height, actions])

  return (
    <div className="scatter-plot-chart">
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

function linearRegression(x, y) {
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

export default ScatterPlotChart
