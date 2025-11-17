/**
 * BubbleChart - D3.js bubble chart for multi-dimensional analysis
 * 
 * Features:
 * - 3-4 dimensional data visualization
 * - Bubble size represents third variable
 * - Color by region
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

export function BubbleChart({ width = 800, height = 500 }) {
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

    // Prepare data
    const data = Object.entries(state.chartData.countries)
      .map(([countryName, countryData]) => {
        const values = Object.entries(countryData.data)
          .filter(([_, value]) => !isNaN(value))
          .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))

        if (values.length === 0) return null

        // Calculate metrics for bubble sizing
        const allValues = values.map(([_, v]) => v)
        const avgValue = allValues.reduce((sum, v) => sum + v, 0) / allValues.length
        const variance = allValues.reduce((sum, v) => sum + Math.pow(v - avgValue, 2), 0) / allValues.length
        const [latestYear, latestValue] = values[0]

        return {
          country: countryName,
          code: countryData.code,
          x: latestValue, // Latest value on X axis
          y: avgValue, // Average value on Y axis
          size: Math.sqrt(variance), // Variance determines bubble size
          year: parseInt(latestYear),
          region: getCountryRegion(countryName),
          dataPoints: values.length
        }
      })
      .filter(d => d !== null)

    if (data.length === 0) return

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.x) * 1.1])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) * 1.1])
      .range([innerHeight, 0])

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.size)])
      .range([5, 30])

    const colorScale = d3.scaleOrdinal()
      .domain(Object.keys(REGION_COLORS))
      .range(Object.values(REGION_COLORS))

    // Add zoom
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScale)
        const newYScale = event.transform.rescaleY(yScale)

        g.selectAll('circle')
          .attr('cx', d => newXScale(d.x))
          .attr('cy', d => newYScale(d.y))

        const maxX = d3.max(bubbleData, d => d.x) || 0
        const maxY = d3.max(bubbleData, d => d.y) || 0
        const xAxisFormatter = getNumberFormatter(maxX)
        const yAxisFormatter = getNumberFormatter(maxY)
        
        g.select('.x-axis').call(d3.axisBottom(newXScale).tickFormat(xAxisFormatter))
        g.select('.y-axis').call(d3.axisLeft(newYScale).tickFormat(yAxisFormatter))
      })

    svg.call(zoom)

    // Create number formatters
    const maxX = d3.max(bubbleData, d => d.x) || 0
    const maxY = d3.max(bubbleData, d => d.y) || 0
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
      .text('Latest Value')

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text('Average Value')

    // Draw bubbles
    const bubbles = g.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => sizeScale(d.size))
      .attr('fill', d => colorScale(d.region))
      .attr('opacity', 0.6)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    // Add hover effects
    bubbles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 3)

        setTooltipData({
          countryName: d.country,
          countryCode: d.code,
          year: d.year,
          value: d.x,
          indicator: state.chartData.metadata?.name,
          unit: state.chartData.metadata?.unit,
          additionalInfo: {
            'Latest Value': d.x.toFixed(2),
            'Average Value': d.y.toFixed(2),
            'Variance': d.size.toFixed(2),
            'Region': d.region,
            'Data Points': d.dataPoints
          }
        })
        setTooltipPosition({ x: event.pageX, y: event.pageY })
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.6)
          .attr('stroke-width', 2)

        setTooltipData(null)
      })
      .on('click', (event, d) => {
        actions.selectCountry(d.country)
      })

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth + 20}, 0)`)

    // Region legend
    const regions = [...new Set(data.map(d => d.region))]
    const regionLegend = legend.append('g')
      .attr('class', 'region-legend')

    regionLegend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Regions')

    const regionItems = regionLegend.selectAll('.legend-item')
      .data(regions)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20 + 15})`)

    regionItems.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 6)
      .attr('fill', d => colorScale(d))

    regionItems.append('text')
      .attr('x', 15)
      .attr('y', 4)
      .attr('font-size', '11px')
      .text(d => d)

    // Size legend
    const sizeLegend = legend.append('g')
      .attr('class', 'size-legend')
      .attr('transform', `translate(0, ${regions.length * 20 + 40})`)

    sizeLegend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Variance')

    const sizeValues = [
      { label: 'Low', value: d3.min(data, d => d.size) },
      { label: 'High', value: d3.max(data, d => d.size) }
    ]

    const sizeItems = sizeLegend.selectAll('.size-item')
      .data(sizeValues)
      .enter()
      .append('g')
      .attr('class', 'size-item')
      .attr('transform', (d, i) => `translate(0, ${i * 30 + 15})`)

    sizeItems.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', d => sizeScale(d.value))
      .attr('fill', '#999')
      .attr('opacity', 0.5)

    sizeItems.append('text')
      .attr('x', 35)
      .attr('y', 4)
      .attr('font-size', '11px')
      .text(d => d.label)

    return () => {
      svg.selectAll('*').remove()
      setTooltipData(null)
    }
  }, [state.chartData, width, height, actions])

  return (
    <div className="bubble-chart">
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

export default BubbleChart
