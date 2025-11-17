/**
 * RankingBarChart - Horizontal bar chart with ALL countries
 * 
 * Features:
 * - Displays ALL countries (virtualized if >100)
 * - Sorted by value
 * - Shows country labels and values
 * - Interactive tooltips
 * - Color by region
 * - Accessibility: ARIA labels, keyboard navigation
 * 
 * Requirements: 3.1, 3.5, 4.1, 4.2, 7.2, 15.1, 15.2, 15.3, 15.4
 */

import { useEffect, useRef, useState, useMemo } from 'react'
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

export function RankingBarChart({ width = 800, height = 600 }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const { state, actions } = useComparison()
  const [tooltipData, setTooltipData] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Memoize data preparation
  const sortedData = useMemo(() => {
    if (!state.chartData) return []

    return Object.entries(state.chartData.countries)
      .map(([countryName, countryData]) => {
        const values = Object.entries(countryData.data)
          .filter(([, value]) => !isNaN(value))
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
      .sort((a, b) => b.value - a.value)
  }, [state.chartData])

  useEffect(() => {
    if (!sortedData || sortedData.length === 0 || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Virtualization for large datasets
    const useVirtualization = sortedData.length > 100
    const visibleData = useVirtualization 
      ? sortedData.slice(visibleRange.start, visibleRange.end)
      : sortedData

    const margin = { top: 20, right: 100, bottom: 30, left: 150 }
    const barHeight = 25
    const innerWidth = width - margin.left - margin.right
    const chartHeight = useVirtualization 
      ? Math.min(sortedData.length * barHeight, height - margin.top - margin.bottom)
      : visibleData.length * barHeight
    const totalHeight = chartHeight + margin.top + margin.bottom

    svg
      .attr('height', totalHeight)
      .attr('role', 'img')
      .attr('aria-label', `Bar chart showing ${sortedData.length} countries ranked by ${state.chartData.metadata?.name || 'indicator'}`)
      .attr('aria-describedby', 'chart-description')

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Memoize scales
    const xScale = useMemo(() => 
      d3.scaleLinear()
        .domain([0, d3.max(sortedData, d => d.value) * 1.1])
        .range([0, innerWidth]),
      [sortedData, innerWidth]
    )

    const yScale = useMemo(() =>
      d3.scaleBand()
        .domain(visibleData.map(d => d.country))
        .range([0, visibleData.length * barHeight])
        .padding(0.1),
      [visibleData, barHeight]
    )

    const colorScale = useMemo(() =>
      d3.scaleOrdinal()
        .domain(Object.keys(REGION_COLORS))
        .range(Object.values(REGION_COLORS)),
      []
    )

    // Create number formatter
    const maxValue = d3.max(visibleData, d => d.value) || 0
    const xAxisFormatter = getNumberFormatter(maxValue)

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${visibleData.length * barHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(xAxisFormatter))

    // Draw bars
    const bars = g.selectAll('.bar')
      .data(visibleData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.country))
      .attr('width', d => xScale(d.value))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.region))
      .attr('opacity', 0.8)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', d => {
        const rank = sortedData.findIndex(item => item.country === d.country) + 1
        return `${d.country}, rank ${rank} of ${sortedData.length}, value ${d.value.toFixed(2)}`
      })
      .style('cursor', 'pointer')

    // Add hover effects
    bars
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)

        const rank = sortedData.findIndex(item => item.country === d.country) + 1

        setTooltipData({
          countryName: d.country,
          countryCode: d.code,
          year: d.year,
          value: d.value,
          rank: rank,
          total: sortedData.length,
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
          .attr('opacity', 0.8)

        setTooltipData(null)
      })
      .on('click', (event, d) => {
        actions.selectCountry(d.country)
      })
      .on('keydown', function(event, d) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          actions.selectCountry(d.country)
        }
      })

    // Add country labels
    g.selectAll('.country-label')
      .data(visibleData)
      .enter()
      .append('text')
      .attr('class', 'country-label')
      .attr('x', -5)
      .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '11px')
      .text(d => d.country.length > 20 ? d.country.substring(0, 20) + '...' : d.country)

    // Add value labels
    g.selectAll('.value-label')
      .data(visibleData)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .text(d => d.value.toFixed(2))

    // Add scroll handler for virtualization
    if (useVirtualization && containerRef.current) {
      const handleScroll = () => {
        const scrollTop = containerRef.current.scrollTop
        const start = Math.floor(scrollTop / barHeight)
        const end = Math.min(start + 50, sortedData.length)
        
        if (start !== visibleRange.start) {
          setVisibleRange({ start, end })
        }
      }

      containerRef.current.addEventListener('scroll', handleScroll)
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('scroll', handleScroll)
        }
      }
    }

    return () => {
      svg.selectAll('*').remove()
      setTooltipData(null)
    }
  }, [sortedData, width, height, visibleRange, actions, state.chartData, xScale, yScale, colorScale, selectedIndex])

  return (
    <div 
      ref={containerRef}
      className="ranking-bar-chart"
      style={{ 
        maxHeight: height, 
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      {/* Screen reader description */}
      <div id="chart-description" className="sr-only">
        This bar chart displays {sortedData.length} countries ranked by {state.chartData?.metadata?.name || 'indicator value'}.
        Countries are sorted from highest to lowest value. Use Tab to navigate through bars, Enter or Space to select a country.
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        style={{ maxWidth: '100%' }}
      />
      <ChartTooltip
        data={tooltipData}
        position={tooltipPosition}
        visible={!!tooltipData}
      />
    </div>
  )
}

export default RankingBarChart
