/**
 * SankeyDiagram Component - Clean, optimized version
 * 
 * Flow diagram showing relationships between GDP and spending patterns.
 * No infinite loops, minimal re-renders, efficient data processing.
 */

import React, { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'

const SankeyDiagram = ({ 
  data = [],
  width = 800, 
  height = 600, 
  selectedCountries = [], 
  yearRange = [2000, 2020],
  onCountrySelect = () => {}
}) => {
  const svgRef = useRef()

  // Memoized processed data for Sankey
  const sankeyData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Filter data
    const filtered = data.filter(record => {
      const countryMatch = selectedCountries.length === 0 || 
                          selectedCountries.includes(record.countryName)
      const yearMatch = record.year >= yearRange[0] && record.year <= yearRange[1]
      return countryMatch && yearMatch && record.validation?.isValid !== false
    })

    if (filtered.length === 0) return null

    // Create nodes and links for Sankey
    const nodes = []
    const links = []

    // GDP Growth categories
    const gdpCategories = ['High Growth', 'Medium Growth', 'Low Growth', 'Negative Growth']
    const spendingCategories = ['High Spending', 'Medium Spending', 'Low Spending']

    // Add nodes
    gdpCategories.forEach(cat => nodes.push({ id: cat, category: 'gdp' }))
    spendingCategories.forEach(cat => nodes.push({ id: cat, category: 'spending' }))

    // Categorize data and create links
    const linkMap = new Map()

    filtered.forEach(record => {
      // Categorize GDP growth
      let gdpCat
      if (record.gdpGrowth > 4) gdpCat = 'High Growth'
      else if (record.gdpGrowth > 2) gdpCat = 'Medium Growth'
      else if (record.gdpGrowth > 0) gdpCat = 'Low Growth'
      else gdpCat = 'Negative Growth'

      // Categorize spending
      let spendingCat
      if (record.totalSpending > 40) spendingCat = 'High Spending'
      else if (record.totalSpending > 25) spendingCat = 'Medium Spending'
      else spendingCat = 'Low Spending'

      // Create link
      const linkKey = `${gdpCat}->${spendingCat}`
      if (!linkMap.has(linkKey)) {
        linkMap.set(linkKey, {
          source: gdpCat,
          target: spendingCat,
          value: 0,
          countries: []
        })
      }
      
      const link = linkMap.get(linkKey)
      link.value += 1
      link.countries.push(record.countryName)
    })

    return {
      nodes,
      links: Array.from(linkMap.values())
    }
  }, [data, selectedCountries, yearRange])

  // Render Sankey diagram
  useEffect(() => {
    if (!sankeyData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 60, right: 120, bottom: 60, left: 120 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

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
      .text('GDP Growth → Government Spending Flow')

    // Add subtitle
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#666')
      .text(`${yearRange[0]} - ${yearRange[1]} | Flow Analysis`)

    // Simple Sankey layout (manual positioning)
    const gdpNodes = sankeyData.nodes.filter(n => n.category === 'gdp')
    const spendingNodes = sankeyData.nodes.filter(n => n.category === 'spending')

    // Position nodes
    const nodeHeight = 40
    const nodeWidth = 120
    const gdpX = 50
    const spendingX = innerWidth - nodeWidth - 50

    gdpNodes.forEach((node, i) => {
      node.x = gdpX
      node.y = (innerHeight / gdpNodes.length) * i + (innerHeight / gdpNodes.length - nodeHeight) / 2
      node.width = nodeWidth
      node.height = nodeHeight
    })

    spendingNodes.forEach((node, i) => {
      node.x = spendingX
      node.y = (innerHeight / spendingNodes.length) * i + (innerHeight / spendingNodes.length - nodeHeight) / 2
      node.width = nodeWidth
      node.height = nodeHeight
    })

    // Color scales
    const gdpColorScale = d3.scaleOrdinal()
      .domain(['High Growth', 'Medium Growth', 'Low Growth', 'Negative Growth'])
      .range(['#22c55e', '#84cc16', '#eab308', '#ef4444'])

    const spendingColorScale = d3.scaleOrdinal()
      .domain(['High Spending', 'Medium Spending', 'Low Spending'])
      .range(['#dc2626', '#f59e0b', '#10b981'])

    // Draw links
    const maxLinkValue = d3.max(sankeyData.links, d => d.value)
    const linkWidthScale = d3.scaleLinear()
      .domain([0, maxLinkValue])
      .range([2, 30])

    sankeyData.links.forEach(link => {
      const sourceNode = sankeyData.nodes.find(n => n.id === link.source)
      const targetNode = sankeyData.nodes.find(n => n.id === link.target)
      
      if (!sourceNode || !targetNode) return

      const linkWidth = linkWidthScale(link.value)
      
      // Create curved path
      const sourceX = sourceNode.x + sourceNode.width
      const sourceY = sourceNode.y + sourceNode.height / 2
      const targetX = targetNode.x
      const targetY = targetNode.y + targetNode.height / 2
      
      const midX = (sourceX + targetX) / 2

      const path = `M${sourceX},${sourceY} C${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`

      g.append('path')
        .attr('d', path)
        .style('fill', 'none')
        .style('stroke', gdpColorScale(link.source))
        .style('stroke-width', linkWidth)
        .style('opacity', 0.6)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          d3.select(this).style('opacity', 0.8)
        })
        .on('mouseout', function() {
          d3.select(this).style('opacity', 0.6)
        })
        .on('click', () => {
          const uniqueCountries = [...new Set(link.countries)]
          onCountrySelect(uniqueCountries.slice(0, 5)) // Limit selection
        })
        .append('title')
        .text(`${link.source} → ${link.target}: ${link.value} countries`)
    })

    // Draw nodes
    sankeyData.nodes.forEach(node => {
      const nodeGroup = g.append('g')
        .attr('class', 'node')
        .style('cursor', 'pointer')

      // Node rectangle
      nodeGroup.append('rect')
        .attr('x', node.x)
        .attr('y', node.y)
        .attr('width', node.width)
        .attr('height', node.height)
        .style('fill', node.category === 'gdp' ? gdpColorScale(node.id) : spendingColorScale(node.id))
        .style('stroke', '#333')
        .style('stroke-width', 1)
        .style('rx', 4)

      // Node label
      nodeGroup.append('text')
        .attr('x', node.x + node.width / 2)
        .attr('y', node.y + node.height / 2)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.5)')
        .text(node.id)
    })

    // Add category labels
    g.append('text')
      .attr('x', gdpX + nodeWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('GDP Growth Categories')

    g.append('text')
      .attr('x', spendingX + nodeWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Spending Categories')

  }, [sankeyData, width, height, yearRange, onCountrySelect])

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
        No data available for flow analysis
      </div>
    )
  }

  if (!sankeyData) {
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

export default SankeyDiagram