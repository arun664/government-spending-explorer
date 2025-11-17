/**
 * GdpExpenseChart - Dual-line chart for GDP vs Expense Growth
 * 
 * Features:
 * - Two lines: GDP growth and Expense growth
 * - Timeline view (years on x-axis)
 * - Interactive tooltips
 * - Formatted axis labels
 * 
 * Requirements: Show GDP and expense growth trends over time
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import ChartTooltip from './ChartTooltip.jsx'
import { getNumberFormatter } from '../utils/formatNumber.js'
import { getCountryData } from '../services/GdpExpenseDataService.js'

export function GdpExpenseChart({ selectedCountry, data, width = 1000, height = 500 }) {
  const svgRef = useRef(null)
  const [tooltipData, setTooltipData] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)

  // Prepare chart data from real GDP and expense data
  const chartData = useMemo(() => {
    if (!data) return null

    const { gdpData, expenseData, years } = data
    
    // Get GDP and expense data for selected country
    const gdpCountryData = getCountryData(gdpData, selectedCountry, years)
    const expenseCountryData = getCountryData(expenseData, selectedCountry, years)

    return {
      gdpData: gdpCountryData,
      expenseData: expenseCountryData,
      years
    }
  }, [data, selectedCountry])

  useEffect(() => {
    if (!chartData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 40, right: 20, bottom: 80, left: 80 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(chartData.years))
      .range([0, innerWidth])

    const allValues = [...chartData.gdpData, ...chartData.expenseData].map(d => d.value)
    const maxValue = d3.max(allValues) || 0
    const yAxisFormatter = getNumberFormatter(maxValue)

    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([innerHeight, 0])

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('font-size', '12px')

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(yAxisFormatter))
      .selectAll('text')
      .style('font-size', '12px')

    // Add axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Year')

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -55)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Value (USD)')

    // Line generators
    const gdpLine = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    const expenseLine = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    // Draw GDP line
    g.append('path')
      .datum(chartData.gdpData)
      .attr('class', 'line gdp-line')
      .attr('d', gdpLine)
      .attr('fill', 'none')
      .attr('stroke', '#4e79a7')
      .attr('stroke-width', 3)
      .attr('opacity', 0.9)

    // Draw Expense line
    g.append('path')
      .datum(chartData.expenseData)
      .attr('class', 'line expense-line')
      .attr('d', expenseLine)
      .attr('fill', 'none')
      .attr('stroke', '#e15759')
      .attr('stroke-width', 3)
      .attr('opacity', 0.9)

    // Add data points for GDP
    g.selectAll('.gdp-point')
      .data(chartData.gdpData)
      .enter()
      .append('circle')
      .attr('class', 'gdp-point')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', '#4e79a7')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6)
        setTooltipData({
          countryName: selectedCountry === 'WORLD' ? 'World Average' : selectedCountry,
          year: d.year,
          value: d.value,
          indicator: 'GDP',
          unit: 'USD'
        })
        setTooltipPosition({ x: event.pageX, y: event.pageY })
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4)
        setTooltipData(null)
        setTooltipPosition(null)
      })

    // Add data points for Expense
    g.selectAll('.expense-point')
      .data(chartData.expenseData)
      .enter()
      .append('circle')
      .attr('class', 'expense-point')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', '#e15759')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6)
        setTooltipData({
          countryName: selectedCountry === 'WORLD' ? 'World Average' : selectedCountry,
          year: d.year,
          value: d.value,
          indicator: 'Government Expense',
          unit: 'USD'
        })
        setTooltipPosition({ x: event.pageX, y: event.pageY })
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4)
        setTooltipData(null)
        setTooltipPosition(null)
      })

    // Add legend below chart (centered)
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth / 2 - 100}, ${innerHeight + 50})`)

    // GDP legend item
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#4e79a7')
      .attr('stroke-width', 3)

    legend.append('text')
      .attr('x', 35)
      .attr('y', 4)
      .style('font-size', '13px')
      .text('GDP')

    // Expense legend item (positioned to the right of GDP)
    legend.append('line')
      .attr('x1', 100)
      .attr('x2', 130)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#e15759')
      .attr('stroke-width', 3)

    legend.append('text')
      .attr('x', 135)
      .attr('y', 4)
      .style('font-size', '13px')
      .text('Gov. Expense')

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', '600')
      .text(`${selectedCountry === 'WORLD' ? 'World Average' : selectedCountry} - GDP vs Government Expense`)

  }, [chartData, width, height, selectedCountry])

  if (!chartData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
        <p>No data available for the selected country.</p>
      </div>
    )
  }

  return (
    <div className="gdp-expense-chart">
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

export default GdpExpenseChart
