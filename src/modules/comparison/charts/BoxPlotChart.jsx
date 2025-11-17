/**
 * BoxPlotChart - Box plot showing distribution by region or income level
 * 
 * Features:
 * - Shows quartiles, median, and outliers
 * - Groups by region or income level
 * - Interactive tooltips
 * - Color-coded by group
 * 
 * Requirements: 3.1, 3.5, 4.1, 4.2, 4.3
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

export function BoxPlotChart({ width = 800, height = 500, groupBy = 'region' }) {
  const svgRef = useRef(null)
  const { state } = useComparison()
  const [tooltipData, setTooltipData] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)

  useEffect(() => {
    if (!state.chartData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 50, bottom: 80, left: 70 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Prepare data grouped by region
    const groupedData = {}
    
    Object.entries(state.chartData.countries).forEach(([countryName, countryData]) => {
      const region = getCountryRegion(countryName)
      const values = Object.values(countryData.data).filter(v => !isNaN(v))
      
      if (values.length > 0) {
        if (!groupedData[region]) {
          groupedData[region] = []
        }
        groupedData[region].push(...values)
      }
    })

    const groups = Object.keys(groupedData).sort()
    
    if (groups.length === 0) return

    // Calculate box plot statistics for each group
    const boxPlotData = groups.map(group => {
      const values = groupedData[group].sort((a, b) => a - b)
      const q1 = percentile(values, 25)
      const median = percentile(values, 50)
      const q3 = percentile(values, 75)
      const iqr = q3 - q1
      const lowerWhisker = Math.max(d3.min(values), q1 - 1.5 * iqr)
      const upperWhisker = Math.min(d3.max(values), q3 + 1.5 * iqr)
      
      // Identify outliers
      const outliers = values.filter(v => v < lowerWhisker || v > upperWhisker)
      
      return {
        group,
        q1,
        median,
        q3,
        lowerWhisker,
        upperWhisker,
        outliers,
        count: values.length,
        min: d3.min(values),
        max: d3.max(values)
      }
    })

    // Create scales
    const xScale = d3.scaleBand()
      .domain(groups)
      .range([0, innerWidth])
      .padding(0.2)

    const allValues = Object.values(groupedData).flat()
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(allValues) * 1.1])
      .range([innerHeight, 0])

    const colorScale = d3.scaleOrdinal()
      .domain(Object.keys(REGION_COLORS))
      .range(Object.values(REGION_COLORS))

    // Create number formatter
    const maxValue = d3.max(boxPlotData.flatMap(d => [d.max, d.q3, d.median, d.q1, d.min])) || 0
    const yAxisFormatter = getNumberFormatter(maxValue)

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(yAxisFormatter))

    // Add axis labels
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 70)
      .attr('text-anchor', 'middle')
      .text('Region')

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text(state.chartData.metadata?.unit || 'Value')

    const boxWidth = xScale.bandwidth()

    // Draw box plots
    boxPlotData.forEach(d => {
      const x = xScale(d.group)
      const centerX = x + boxWidth / 2

      // Vertical line (whiskers)
      g.append('line')
        .attr('x1', centerX)
        .attr('x2', centerX)
        .attr('y1', yScale(d.lowerWhisker))
        .attr('y2', yScale(d.upperWhisker))
        .attr('stroke', '#000')
        .attr('stroke-width', 1)

      // Lower whisker horizontal line
      g.append('line')
        .attr('x1', centerX - boxWidth / 4)
        .attr('x2', centerX + boxWidth / 4)
        .attr('y1', yScale(d.lowerWhisker))
        .attr('y2', yScale(d.lowerWhisker))
        .attr('stroke', '#000')
        .attr('stroke-width', 1)

      // Upper whisker horizontal line
      g.append('line')
        .attr('x1', centerX - boxWidth / 4)
        .attr('x2', centerX + boxWidth / 4)
        .attr('y1', yScale(d.upperWhisker))
        .attr('y2', yScale(d.upperWhisker))
        .attr('stroke', '#000')
        .attr('stroke-width', 1)

      // Box (IQR)
      g.append('rect')
        .attr('x', x)
        .attr('y', yScale(d.q3))
        .attr('width', boxWidth)
        .attr('height', yScale(d.q1) - yScale(d.q3))
        .attr('fill', colorScale(d.group))
        .attr('opacity', 0.7)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this)
            .attr('opacity', 1)

          setTooltipData({
            countryName: d.group,
            value: d.median,
            additionalInfo: {
              'Median': d.median.toFixed(2),
              'Q1': d.q1.toFixed(2),
              'Q3': d.q3.toFixed(2),
              'Min': d.min.toFixed(2),
              'Max': d.max.toFixed(2),
              'Count': d.count,
              'Outliers': d.outliers.length
            }
          })
          setTooltipPosition({ x: event.pageX, y: event.pageY })
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('opacity', 0.7)

          setTooltipData(null)
        })

      // Median line
      g.append('line')
        .attr('x1', x)
        .attr('x2', x + boxWidth)
        .attr('y1', yScale(d.median))
        .attr('y2', yScale(d.median))
        .attr('stroke', '#000')
        .attr('stroke-width', 2)

      // Outliers
      d.outliers.forEach(outlier => {
        g.append('circle')
          .attr('cx', centerX)
          .attr('cy', yScale(outlier))
          .attr('r', 3)
          .attr('fill', colorScale(d.group))
          .attr('stroke', '#000')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            d3.select(this)
              .attr('r', 5)

            setTooltipData({
              countryName: `${d.group} Outlier`,
              value: outlier,
              additionalInfo: {
                'Value': outlier.toFixed(2),
                'Type': 'Outlier'
              }
            })
            setTooltipPosition({ x: event.pageX, y: event.pageY })
          })
          .on('mouseout', function() {
            d3.select(this)
              .attr('r', 3)

            setTooltipData(null)
          })
      })
    })

    return () => {
      svg.selectAll('*').remove()
      setTooltipData(null)
    }
  }, [state.chartData, width, height, groupBy])

  return (
    <div className="box-plot-chart">
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

// Helper function
function percentile(sortedValues, percentile) {
  const index = (percentile / 100) * (sortedValues.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sortedValues[lower]
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

export default BoxPlotChart
