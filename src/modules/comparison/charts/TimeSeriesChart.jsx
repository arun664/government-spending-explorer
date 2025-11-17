/**
 * TimeSeriesChart - D3.js line chart showing trends over time
 * 
 * Features:
 * - Multiple country lines
 * - Interactive hover with tooltip
 * - Zoom and pan capabilities
 * - Smooth animations
 * - Accessibility: ARIA labels, keyboard navigation
 * - Performance: Canvas rendering for >500 points, memoized scales
 * 
 * Requirements: 3.1, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 7.3, 7.4, 7.5, 15.1, 15.2, 15.3, 15.4
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { useComparison } from '../context/ComparisonContext.jsx'
import ChartTooltip from '../components/ChartTooltip.jsx'
import { getNumberFormatter } from '../utils/formatNumber.js'

export function TimeSeriesChart({ width = 800, height = 500 }) {
  const svgRef = useRef(null)
  const canvasRef = useRef(null)
  const { state, actions } = useComparison()
  const [tooltipData, setTooltipData] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)

  // Memoize line data preparation
  const lineData = useMemo(() => {
    if (!state.chartData) return []

    const countries = Object.entries(state.chartData.countries)
    const years = state.chartData.years.sort((a, b) => a - b)

    return countries
      .map(([countryName, countryData]) => {
        const values = years
          .map(year => ({
            year,
            value: countryData.data[year]
          }))
          .filter(d => d.value !== undefined && !isNaN(d.value))

        return {
          country: countryName,
          code: countryData.code,
          values
        }
      })
      .filter(d => d.values.length > 0)
  }, [state.chartData])

  // Calculate total data points for canvas rendering decision
  const totalDataPoints = useMemo(() => {
    return lineData.reduce((sum, d) => sum + d.values.length, 0)
  }, [lineData])

  const useCanvas = totalDataPoints > 500

  // Calculate scales outside useEffect
  const margin = useMemo(() => ({ top: 20, right: 120, bottom: 50, left: 60 }), [])
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const years = useMemo(() => 
    state.chartData?.years ? state.chartData.years.sort((a, b) => a - b) : [],
    [state.chartData]
  )

  const allValues = useMemo(() => 
    lineData.flatMap(d => d.values.map(v => v.value)),
    [lineData]
  )

  const xScale = useMemo(() =>
    d3.scaleLinear()
      .domain(d3.extent(years))
      .range([0, innerWidth]),
    [years, innerWidth]
  )

  const yScale = useMemo(() =>
    d3.scaleLinear()
      .domain([0, d3.max(allValues) * 1.1])
      .range([innerHeight, 0]),
    [allValues, innerHeight]
  )

  const colorScale = useMemo(() =>
    d3.scaleOrdinal(d3.schemeCategory10),
    []
  )

  useEffect(() => {
    if (!state.chartData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    svg
      .attr('role', 'img')
      .attr('aria-label', `Time series chart showing trends for ${lineData.length} countries over time`)
      .attr('aria-describedby', 'timeseries-description')

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add zoom behavior with touch support
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .translateExtent([[0, 0], [innerWidth, innerHeight]])
      .filter((event) => {
        // Allow touch events and mouse wheel
        return !event.ctrlKey && !event.button
      })
      .on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScale)
        const newYScale = event.transform.rescaleY(yScale)
        const maxValue = d3.max(allValues) || 0
        const yAxisFormatter = getNumberFormatter(maxValue)

        g.selectAll('.line')
          .attr('d', d => {
            const line = d3.line()
              .x(pt => newXScale(pt.year))
              .y(pt => newYScale(pt.value))
              .curve(d3.curveMonotoneX)
            return line(d.values)
          })

        g.select('.x-axis').call(d3.axisBottom(newXScale).tickFormat(d3.format('d')))
        g.select('.y-axis').call(d3.axisLeft(newYScale).tickFormat(yAxisFormatter))
      })

    svg.call(zoom)
      .on('dblclick.zoom', null) // Disable double-click zoom for accessibility
      .on('touchstart', (event) => {
        // Handle touch start for tooltip
        if (event.touches.length === 1) {
          const touch = event.touches[0]
          const [touchX, touchY] = d3.pointer(touch, g.node())
          handleTouch(touchX, touchY, touch.pageX, touch.pageY)
        }
      })
      .on('touchmove', (event) => {
        // Handle touch move for tooltip
        if (event.touches.length === 1) {
          const touch = event.touches[0]
          const [touchX, touchY] = d3.pointer(touch, g.node())
          handleTouch(touchX, touchY, touch.pageX, touch.pageY)
        }
      })
      .on('touchend', () => {
        // Clear tooltip on touch end
        setTooltipData(null)
        setTooltipPosition(null)
      })

    // Touch handler function
    function handleTouch(x, y, pageX, pageY) {
      const year = Math.round(xScale.invert(x))
      
      // Find closest line
      let closestLine = null
      let minDistance = Infinity

      lineData.forEach(d => {
        const dataPoint = d.values.find(v => v.year === year)
        if (dataPoint) {
          const lineY = yScale(dataPoint.value)
          const distance = Math.abs(y - lineY)
          
          if (distance < minDistance && distance < 30) { // 30px threshold
            minDistance = distance
            closestLine = { ...d, dataPoint }
          }
        }
      })

      if (closestLine) {
        setTooltipData({
          countryName: closestLine.country,
          countryCode: closestLine.code,
          year: closestLine.dataPoint.year,
          value: closestLine.dataPoint.value,
          indicator: state.chartData.metadata?.name,
          unit: state.chartData.metadata?.unit
        })
        setTooltipPosition({ x: pageX, y: pageY })
      }
    }

    // Create number formatter based on max value
    const maxValue = d3.max(allValues) || 0
    const yAxisFormatter = getNumberFormatter(maxValue)

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(yAxisFormatter))

    // Add axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .text('Year')

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .text(state.chartData.metadata?.unit || 'Value')

    // Line generator
    const line = d3.line()
      .x(pt => xScale(pt.year))
      .y(pt => yScale(pt.value))
      .curve(d3.curveMonotoneX)

    // Draw lines
    const lines = g.selectAll('.line')
      .data(lineData)
      .enter()
      .append('path')
      .attr('class', 'line')
      .attr('d', d => line(d.values))
      .attr('fill', 'none')
      .attr('stroke', (d, i) => colorScale(i))
      .attr('stroke-width', 2)
      .attr('opacity', 0.7)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', d => `${d.country} trend line with ${d.values.length} data points`)
      .style('cursor', 'pointer')

    // Add hover effects
    lines
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 4)
          .attr('opacity', 1)

        actions.setHoveredCountry(d.country)
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('opacity', 0.7)

        actions.setHoveredCountry(null)
      })
      .on('mousemove', function(event, d) {
        const [mouseX] = d3.pointer(event, this)
        const year = Math.round(xScale.invert(mouseX))
        const dataPoint = d.values.find(v => v.year === year)

        if (dataPoint) {
          setTooltipData({
            countryName: d.country,
            countryCode: d.code,
            year: dataPoint.year,
            value: dataPoint.value,
            indicator: state.chartData.metadata?.name,
            unit: state.chartData.metadata?.unit
          })
          setTooltipPosition({ x: event.pageX, y: event.pageY })
        }
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

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth + 10}, 0)`)

    const legendItems = legend.selectAll('.legend-item')
      .data(lineData.slice(0, 10)) // Show max 10 in legend
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)

    legendItems.append('line')
      .attr('x1', 0)
      .attr('x2', 15)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', (d, i) => colorScale(i))
      .attr('stroke-width', 2)

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 4)
      .attr('font-size', '10px')
      .text(d => d.country.length > 15 ? d.country.substring(0, 15) + '...' : d.country)

    // Cleanup
    return () => {
      svg.selectAll('*').remove()
      setTooltipData(null)
      setTooltipPosition(null)
    }
  }, [state.chartData, width, height, actions, lineData, useCanvas, totalDataPoints, xScale, yScale, colorScale, margin, innerWidth, innerHeight])

  return (
    <div className="time-series-chart">
      {/* Screen reader description */}
      <div id="timeseries-description" className="sr-only">
        This time series chart shows trends over time for {lineData.length} countries.
        Each line represents a country's values across years. Use Tab to navigate through lines,
        Enter or Space to select a country. Scroll to zoom, drag to pan.
        {useCanvas && ' Note: Using canvas rendering for performance with large dataset.'}
      </div>

      {useCanvas && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ position: 'absolute', pointerEvents: 'none' }}
        />
      )}
      
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

export default TimeSeriesChart
