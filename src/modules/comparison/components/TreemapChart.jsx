/**
 * TreemapChart - Interactive treemap for hierarchical spending distribution
 * 
 * Features:
 * - Hierarchical spending distribution visualization
 * - Interactive drill-down capability
 * - Smooth transitions and animations
 * - Detailed tooltips with spending breakdown
 * - Independent implementation for comparison module
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { numberFormatter } from '../utils/NumberFormatter.js'

const TreemapChart = ({ 
  data = [], 
  width = 800, 
  height = 600,
  selectedCountries = [],
  selectedYear = null,
  onNodeSelect = null,
  onDrillDown = null,
  className = ''
}) => {
  const svgRef = useRef()
  const [hoveredNode, setHoveredNode] = useState(null)
  const [currentLevel, setCurrentLevel] = useState('root')
  const [breadcrumb, setBreadcrumb] = useState(['All Countries'])
  const [selectedNode, setSelectedNode] = useState(null)

  // Chart dimensions and margins
  const margin = { top: 40, right: 20, bottom: 20, left: 20 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Color scales
  const categoryColorScale = d3.scaleOrdinal()
    .domain(['Defense', 'Education', 'Health', 'Social Protection', 'Economic Affairs', 'Public Order', 'General Services', 'Environment', 'Other'])
    .range(['#A23B72', '#F18F01', '#C73E1D', '#6A994E', '#577590', '#90A959', '#2E86AB', '#8E44AD', '#95A5A6'])

  const intensityColorScale = d3.scaleSequential(d3.interpolateBlues)

  // Helper function to create category children
  const createCategoryChildren = React.useCallback((countryData, totalSpending) => {
    // Simulate spending breakdown by category (in real app, this would come from data)
    const categories = [
      { name: 'Defense', percentage: 0.15 },
      { name: 'Education', percentage: 0.20 },
      { name: 'Health', percentage: 0.18 },
      { name: 'Social Protection', percentage: 0.25 },
      { name: 'Economic Affairs', percentage: 0.12 },
      { name: 'Public Order', percentage: 0.05 },
      { name: 'General Services', percentage: 0.03 },
      { name: 'Environment', percentage: 0.02 }
    ]

    return categories.map(category => {
      const value = totalSpending * category.percentage
      return {
        name: category.name,
        value: value,
        type: 'category',
        percentage: category.percentage,
        data: countryData,
        children: createSubcategoryChildren(value, category.name)
      }
    })
  }, [])

  // Helper function to create subcategory children
  const createSubcategoryChildren = React.useCallback((categoryValue, categoryName) => {
    // Simulate subcategories (in real app, this would come from data)
    const subcategories = {
      'Defense': [
        { name: 'Military Personnel', percentage: 0.45 },
        { name: 'Equipment', percentage: 0.30 },
        { name: 'Operations', percentage: 0.15 },
        { name: 'Research', percentage: 0.10 }
      ],
      'Education': [
        { name: 'Primary Education', percentage: 0.35 },
        { name: 'Secondary Education', percentage: 0.30 },
        { name: 'Higher Education', percentage: 0.25 },
        { name: 'Vocational Training', percentage: 0.10 }
      ],
      'Health': [
        { name: 'Hospital Services', percentage: 0.40 },
        { name: 'Primary Care', percentage: 0.25 },
        { name: 'Public Health', percentage: 0.20 },
        { name: 'Medical Research', percentage: 0.15 }
      ],
      'Social Protection': [
        { name: 'Pensions', percentage: 0.50 },
        { name: 'Unemployment Benefits', percentage: 0.20 },
        { name: 'Family Support', percentage: 0.15 },
        { name: 'Disability Support', percentage: 0.15 }
      ],
      'Economic Affairs': [
        { name: 'Infrastructure', percentage: 0.40 },
        { name: 'Business Support', percentage: 0.25 },
        { name: 'Agriculture', percentage: 0.20 },
        { name: 'Energy', percentage: 0.15 }
      ]
    }

    const subs = subcategories[categoryName] || [
      { name: 'General Operations', percentage: 0.60 },
      { name: 'Administration', percentage: 0.25 },
      { name: 'Other', percentage: 0.15 }
    ]

    return subs.map(sub => ({
      name: sub.name,
      value: categoryValue * sub.percentage,
      type: 'subcategory',
      percentage: sub.percentage
    }))
  }, [])

  // Process data for treemap
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return null

    // Filter data by selected countries and year
    let filteredData = data
    if (selectedCountries.length > 0) {
      filteredData = filteredData.filter(d => selectedCountries.includes(d.countryName))
    }
    if (selectedYear) {
      filteredData = filteredData.filter(d => d.year === selectedYear)
    }

    // Create hierarchical structure
    const root = {
      name: 'Government Spending',
      children: []
    }

    if (currentLevel === 'root') {
      // Top level: Countries
      const countryGroups = d3.group(filteredData, d => d.countryName)
      
      countryGroups.forEach((countryData, countryName) => {
        const totalSpending = d3.sum(countryData, d => d.totalSpending || 0)
        
        root.children.push({
          name: countryName,
          value: totalSpending,
          type: 'country',
          data: countryData,
          children: createCategoryChildren(countryData, totalSpending)
        })
      })
    } else if (currentLevel.startsWith('country:')) {
      // Drill-down level: Categories for specific country
      const countryName = currentLevel.replace('country:', '')
      const countryData = filteredData.filter(d => d.countryName === countryName)
      const totalSpending = d3.sum(countryData, d => d.totalSpending || 0)
      
      root.children = createCategoryChildren(countryData, totalSpending)
    }

    return root

  }, [data, selectedCountries, selectedYear, currentLevel, createCategoryChildren, createSubcategoryChildren])

  // Create treemap layout
  const treemapLayout = React.useMemo(() => {
    return d3.treemap()
      .size([chartWidth, chartHeight])
      .padding(2)
      .round(true)
  }, [chartWidth, chartHeight])

  // Generate treemap data
  const treemapData = React.useMemo(() => {
    if (!processedData) return null

    try {
      const hierarchy = d3.hierarchy(processedData)
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value)

      const treemap = treemapLayout(hierarchy)

      // Set color scale domain
      const values = treemap.leaves().map(d => d.value)
      intensityColorScale.domain(d3.extent(values))

      return treemap
    } catch (error) {
      console.error('Error generating treemap layout:', error)
      return null
    }
  }, [processedData, treemapLayout, intensityColorScale])

  // Handle drill down
  const handleDrillDown = useCallback((node) => {
    if (node.data.type === 'country') {
      setCurrentLevel(`country:${node.data.name}`)
      setBreadcrumb(['All Countries', node.data.name])
    } else if (node.data.type === 'category') {
      setCurrentLevel(`category:${node.data.name}`)
      setBreadcrumb(prev => [...prev, node.data.name])
    }

    if (onDrillDown) {
      onDrillDown({
        level: node.data.type,
        name: node.data.name,
        value: node.value
      })
    }
  }, [onDrillDown])

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((index) => {
    if (index === 0) {
      setCurrentLevel('root')
      setBreadcrumb(['All Countries'])
    } else if (index === 1) {
      const countryName = breadcrumb[1]
      setCurrentLevel(`country:${countryName}`)
      setBreadcrumb(['All Countries', countryName])
    }
  }, [breadcrumb])

  // Draw treemap
  useEffect(() => {
    if (!svgRef.current || !treemapData) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'treemap-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000)

    // Draw treemap rectangles
    const leaves = treemapData.leaves()
    
    const rects = g.selectAll('rect')
      .data(leaves)
      .enter()
      .append('rect')
      .attr('class', 'treemap-rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => {
        if (d.data.type === 'country') {
          return intensityColorScale(d.value)
        } else {
          return categoryColorScale(d.data.name)
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8)
      .style('cursor', d => d.data.children && d.data.children.length > 0 ? 'pointer' : 'default')

    // Add rectangle interactions
    rects
      .on('mouseover', function(event, d) {
        setHoveredNode(d)
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('stroke-width', 2)
          .attr('stroke', '#333')

        const percentage = d.parent ? (d.value / d.parent.value * 100) : 100
        
        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.data.name}</strong><br/>
            Type: ${d.data.type}<br/>
            Value: ${numberFormatter.formatWithMBNotation(d.value)}<br/>
            Percentage: ${numberFormatter.formatPercentage(percentage)}<br/>
            ${d.data.children && d.data.children.length > 0 ? '<em>Click to drill down</em>' : ''}
          `)
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px')
      })
      .on('mouseout', function(event, d) {
        setHoveredNode(null)
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8)
          .attr('stroke-width', 1)
          .attr('stroke', '#fff')

        tooltip.style('visibility', 'hidden')
      })
      .on('click', function(event, d) {
        if (d.data.children && d.data.children.length > 0) {
          handleDrillDown(d)
        }

        setSelectedNode(d)

        if (onNodeSelect) {
          onNodeSelect({
            name: d.data.name,
            type: d.data.type,
            value: d.value,
            percentage: d.parent ? (d.value / d.parent.value * 100) : 100
          })
        }
      })

    // Add text labels
    const labels = g.selectAll('text')
      .data(leaves.filter(d => (d.x1 - d.x0) > 60 && (d.y1 - d.y0) > 30))
      .enter()
      .append('text')
      .attr('class', 'treemap-label')
      .attr('x', d => (d.x0 + d.x1) / 2)
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', d => Math.min(12, (d.x1 - d.x0) / 8) + 'px')
      .style('font-weight', 'bold')
      .style('fill', d => {
        const bgColor = d3.color(d.data.type === 'country' ? intensityColorScale(d.value) : categoryColorScale(d.data.name))
        return d3.hsl(bgColor).l > 0.5 ? '#333' : '#fff'
      })
      .style('pointer-events', 'none')
      .text(d => d.data.name)

    // Add value labels
    const valueLabels = g.selectAll('.value-label')
      .data(leaves.filter(d => (d.x1 - d.x0) > 80 && (d.y1 - d.y0) > 50))
      .enter()
      .append('text')
      .attr('class', 'treemap-value-label')
      .attr('x', d => (d.x0 + d.x1) / 2)
      .attr('y', d => (d.y0 + d.y1) / 2 + 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', d => Math.min(10, (d.x1 - d.x0) / 10) + 'px')
      .style('fill', d => {
        const bgColor = d3.color(d.data.type === 'country' ? intensityColorScale(d.value) : categoryColorScale(d.data.name))
        return d3.hsl(bgColor).l > 0.5 ? '#666' : '#ccc'
      })
      .style('pointer-events', 'none')
      .text(d => numberFormatter.formatWithMBNotation(d.value))

    // Add title
    g.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', chartWidth / 2)
      .attr('y', -15)
      .text(`Hierarchical Spending Distribution - ${breadcrumb.join(' > ')}`)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')

    // Animate in
    rects
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 0.8)

    labels
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .delay(500)
      .attr('opacity', 1)

    valueLabels
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .delay(700)
      .attr('opacity', 1)

    // Cleanup function
    return () => {
      tooltip.remove()
    }

  }, [treemapData, chartWidth, chartHeight, breadcrumb, categoryColorScale, intensityColorScale, handleDrillDown, onNodeSelect])

  // Handle selection highlighting
  useEffect(() => {
    if (!svgRef.current || !selectedNode) return

    const svg = d3.select(svgRef.current)
    
    svg.selectAll('.treemap-rect')
      .attr('stroke', d => d === selectedNode ? '#ff6b35' : '#fff')
      .attr('stroke-width', d => d === selectedNode ? 3 : 1)

  }, [selectedNode])

  const resetView = useCallback(() => {
    setCurrentLevel('root')
    setBreadcrumb(['All Countries'])
    setSelectedNode(null)
  }, [])

  if (!treemapData) {
    return (
      <div className={`treemap-chart ${className}`}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: height,
          color: '#666',
          fontSize: '14px'
        }}>
          No data available for treemap chart
        </div>
      </div>
    )
  }

  return (
    <div className={`treemap-chart ${className}`}>
      <div className="chart-controls" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>Breadcrumb:</span>
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={index}>
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: index === breadcrumb.length - 1 ? '#333' : '#007bff',
                    cursor: index === breadcrumb.length - 1 ? 'default' : 'pointer',
                    textDecoration: index === breadcrumb.length - 1 ? 'none' : 'underline',
                    fontSize: '14px',
                    fontWeight: index === breadcrumb.length - 1 ? 'bold' : 'normal'
                  }}
                >
                  {crumb}
                </button>
                {index < breadcrumb.length - 1 && (
                  <span style={{ color: '#666' }}>&gt;</span>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <span style={{ fontSize: '14px', color: '#666' }}>
            Countries: {selectedCountries.length > 0 ? selectedCountries.join(', ') : 'All'}
          </span>
          
          {selectedYear && (
            <span style={{ fontSize: '14px', color: '#666' }}>
              Year: {selectedYear}
            </span>
          )}
          
          {currentLevel !== 'root' && (
            <button 
              onClick={resetView}
              style={{ 
                padding: '4px 8px', 
                fontSize: '12px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Reset View
            </button>
          )}
        </div>
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ddd', background: '#fafafa' }}
      />
      
      <div className="chart-legend" style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>Legend:</div>
          {currentLevel === 'root' ? (
            <span>Rectangle size represents total spending amount. Click to drill down into categories.</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              {Array.from(new Set(treemapData.leaves().map(d => d.data.name))).map(category => (
                <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: categoryColorScale(category),
                      border: '1px solid #fff'
                    }}
                  />
                  <span>{category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TreemapChart