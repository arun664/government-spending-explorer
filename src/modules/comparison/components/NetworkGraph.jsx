/**
 * NetworkGraph - Force-directed network graph for country similarity clustering
 * 
 * Features:
 * - Force-directed layout showing country relationships based on spending patterns
 * - Similarity algorithms for clustering countries with similar spending profiles
 * - Threshold filtering to control connection density
 * - Interactive node selection and drag functionality
 * - Smooth animations and hover effects
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { numberFormatter } from '../utils/NumberFormatter.js'

const NetworkGraph = ({ 
  data = [], 
  width = 800, 
  height = 600,
  selectedYear = null,
  selectedCountries = [],
  similarityThreshold = 0.7,
  maxConnections = 50,
  nodeSize = 'totalSpending',
  colorBy = 'region',
  showLabels = true,
  onNodeSelect = null,
  onNodeHover = null,
  className = ''
}) => {
  const svgRef = useRef()
  const simulationRef = useRef()
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedNodes, setSelectedNodes] = useState(new Set(selectedCountries))
  const [isSimulating, setIsSimulating] = useState(false)

  // Chart dimensions and margins
  const margin = { top: 40, right: 40, bottom: 40, left: 40 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Color scales
  const regionColors = d3.scaleOrdinal()
    .domain(['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Oceania', 'Other'])
    .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2'])

  const performanceColors = d3.scaleSequential()
    .domain([-10, 10])
    .interpolator(d3.interpolateRdYlGn)

  // Calculate similarity between two countries based on spending patterns
  const calculateSimilarity = useCallback((country1, country2) => {
    // Get spending data for both countries across all years
    const data1 = data.filter(d => d.countryName === country1)
    const data2 = data.filter(d => d.countryName === country2)

    if (data1.length === 0 || data2.length === 0) return 0

    // Find common years
    const years1 = new Set(data1.map(d => d.year))
    const years2 = new Set(data2.map(d => d.year))
    const commonYears = [...years1].filter(year => years2.has(year))

    if (commonYears.length < 2) return 0

    // Calculate correlation of spending patterns
    const values1 = []
    const values2 = []

    commonYears.forEach(year => {
      const record1 = data1.find(d => d.year === year)
      const record2 = data2.find(d => d.year === year)
      
      if (record1 && record2 && 
          record1.totalSpending != null && record2.totalSpending != null) {
        values1.push(record1.totalSpending)
        values2.push(record2.totalSpending)
      }
    })

    if (values1.length < 2) return 0

    // Calculate Pearson correlation coefficient
    const n = values1.length
    const sum1 = values1.reduce((a, b) => a + b, 0)
    const sum2 = values2.reduce((a, b) => a + b, 0)
    const sum1Sq = values1.reduce((a, b) => a + b * b, 0)
    const sum2Sq = values2.reduce((a, b) => a + b * b, 0)
    const pSum = values1.reduce((sum, val, i) => sum + val * values2[i], 0)

    const num = pSum - (sum1 * sum2 / n)
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n))

    return den === 0 ? 0 : Math.abs(num / den) // Use absolute value for similarity
  }, [data])

  // Process data for network visualization
  const networkData = React.useMemo(() => {
    if (!data || data.length === 0) return { nodes: [], links: [] }

    // Get unique countries with their latest data
    const countries = [...new Set(data.map(d => d.countryName))]
    const nodes = []
    const links = []

    // Create nodes
    countries.forEach(country => {
      const countryData = data.filter(d => d.countryName === country)
      if (countryData.length === 0) return

      // Get latest or selected year data
      let nodeData = countryData.find(d => d.year === selectedYear)
      if (!nodeData) {
        nodeData = countryData[countryData.length - 1] // Latest year
      }

      // Calculate node size based on selected metric (reduced sizes)
      let size = 3 // Default size
      if (nodeSize === 'totalSpending' && nodeData.totalSpending != null) {
        size = Math.max(3, Math.min(12, nodeData.totalSpending / 4))
      } else if (nodeSize === 'gdpGrowth' && nodeData.gdpGrowth != null) {
        size = Math.max(3, Math.min(12, Math.abs(nodeData.gdpGrowth) + 3))
      }

      // Determine region for color
      const region = nodeData.region || 'Other'

      nodes.push({
        id: country,
        country: country,
        countryCode: nodeData.countryCode,
        region: region,
        totalSpending: nodeData.totalSpending,
        gdpGrowth: nodeData.gdpGrowth,
        year: nodeData.year,
        size: size,
        color: colorBy === 'region' ? regionColors(region) : 
               colorBy === 'performance' ? performanceColors(nodeData.gdpGrowth || 0) : '#69b3a2',
        x: Math.random() * chartWidth,
        y: Math.random() * chartHeight
      })
    })

    // Calculate similarities and create links
    const similarities = []
    for (let i = 0; i < countries.length; i++) {
      for (let j = i + 1; j < countries.length; j++) {
        const similarity = calculateSimilarity(countries[i], countries[j])
        if (similarity >= similarityThreshold) {
          similarities.push({
            source: countries[i],
            target: countries[j],
            similarity: similarity,
            strength: similarity
          })
        }
      }
    }

    // Sort by similarity and take top connections
    similarities.sort((a, b) => b.similarity - a.similarity)
    const topSimilarities = similarities.slice(0, maxConnections)

    // Create links
    topSimilarities.forEach(sim => {
      const sourceNode = nodes.find(n => n.id === sim.source)
      const targetNode = nodes.find(n => n.id === sim.target)
      
      if (sourceNode && targetNode) {
        links.push({
          source: sourceNode,
          target: targetNode,
          similarity: sim.similarity,
          strength: sim.strength
        })
      }
    })

    return { nodes, links }
  }, [data, selectedYear, similarityThreshold, maxConnections, nodeSize, colorBy, calculateSimilarity, regionColors, performanceColors, chartWidth, chartHeight])

  // Initialize and update the network visualization
  useEffect(() => {
    if (!svgRef.current || networkData.nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', `translate(${margin.left + event.transform.x}, ${margin.top + event.transform.y}) scale(${event.transform.k})`)
      })

    svg.call(zoom)

    // Create force simulation
    const simulation = d3.forceSimulation(networkData.nodes)
      .force('link', d3.forceLink(networkData.links)
        .id(d => d.id)
        .distance(d => 100 - (d.similarity * 50)) // Closer for more similar
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody()
        .strength(-300)
        .distanceMax(200))
      .force('center', d3.forceCenter(chartWidth / 2, chartHeight / 2))
      .force('collision', d3.forceCollide()
        .radius(d => d.size + 2))

    simulationRef.current = simulation

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(networkData.links)
      .enter().append('line')
      .attr('class', 'network-link')
      .attr('stroke', '#999')
      .attr('stroke-opacity', d => d.similarity * 0.8)
      .attr('stroke-width', d => Math.max(1, d.similarity * 4))

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(networkData.nodes)
      .enter().append('circle')
      .attr('class', 'network-node')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    // Add labels if enabled
    let labels = null
    if (showLabels) {
      labels = g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(networkData.nodes)
        .enter().append('text')
        .attr('class', 'network-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .attr('pointer-events', 'none')
        .text(d => d.countryCode || d.country.substring(0, 3).toUpperCase())
        .style('opacity', 0)
    }

    // Node interactions
    node
      .on('mouseover', function(event, d) {
        setHoveredNode(d)
        
        // Highlight connected nodes and links
        const connectedNodes = new Set([d.id])
        networkData.links.forEach(link => {
          if (link.source.id === d.id) connectedNodes.add(link.target.id)
          if (link.target.id === d.id) connectedNodes.add(link.source.id)
        })

        node.style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3)
        link.style('opacity', l => 
          l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1)

        if (labels) {
          labels.style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3)
        }

        if (onNodeHover) {
          onNodeHover(d, event)
        }
      })
      .on('mouseout', function() {
        setHoveredNode(null)
        
        // Reset opacity
        node.style('opacity', 1)
        link.style('opacity', d => d.similarity * 0.8)
        
        if (labels) {
          labels.style('opacity', 0.8)
        }
      })
      .on('click', function(event, d) {
        event.stopPropagation()
        
        const newSelected = new Set(selectedNodes)
        if (newSelected.has(d.country)) {
          newSelected.delete(d.country)
        } else {
          newSelected.add(d.country)
        }
        
        setSelectedNodes(newSelected)
        
        if (onNodeSelect) {
          onNodeSelect([...newSelected])
        }
      })

    // Update node appearance based on selection
    node.attr('stroke', d => selectedNodes.has(d.country) ? '#ff6b6b' : '#fff')
      .attr('stroke-width', d => selectedNodes.has(d.country) ? 3 : 2)

    // Simulation tick function
    simulation.on('tick', () => {
      setIsSimulating(simulation.alpha() > 0.01)

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      if (labels) {
        labels
          .attr('x', d => d.x)
          .attr('y', d => d.y)
      }
    })

    // Show labels after simulation settles
    if (labels) {
      simulation.on('end', () => {
        labels.transition()
          .duration(500)
          .style('opacity', 0.8)
      })
    }

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
      }
    }
  }, [networkData, selectedNodes, showLabels, onNodeSelect, onNodeHover, margin, chartWidth, chartHeight])

  // Update selected countries
  useEffect(() => {
    setSelectedNodes(new Set(selectedCountries))
  }, [selectedCountries])

  return (
    <div className={`network-graph ${className}`}>
      <div className="network-graph-header">
        <h3>Country Similarity Network</h3>
        <div className="network-controls">
          <div className="control-group">
            <label>Similarity Threshold:</label>
            <span>{(similarityThreshold * 100).toFixed(0)}%</span>
          </div>
          <div className="control-group">
            <label>Connections:</label>
            <span>{networkData.links.length}</span>
          </div>
          <div className="control-group">
            <label>Status:</label>
            <span className={isSimulating ? 'simulating' : 'stable'}>
              {isSimulating ? 'Simulating...' : 'Stable'}
            </span>
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="network-graph-svg"
      />

      {hoveredNode && (
        <div className="network-tooltip">
          <div className="tooltip-header">
            <strong>{hoveredNode.country}</strong>
            <span className="tooltip-region">{hoveredNode.region}</span>
          </div>
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span>Total Spending:</span>
              <span>{numberFormatter.format(hoveredNode.totalSpending)}% of GDP</span>
            </div>
            <div className="tooltip-row">
              <span>GDP Growth:</span>
              <span>{numberFormatter.format(hoveredNode.gdpGrowth)}%</span>
            </div>
            <div className="tooltip-row">
              <span>Year:</span>
              <span>{hoveredNode.year}</span>
            </div>
          </div>
        </div>
      )}

      <div className="network-legend">
        <div className="legend-section">
          <h4>Regions</h4>
          <div className="legend-items">
            {regionColors.domain().map(region => (
              <div key={region} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: regionColors(region) }}
                />
                <span>{region}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="legend-section">
          <h4>Node Size</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span>Based on {nodeSize === 'totalSpending' ? 'Total Spending' : 'GDP Growth'}</span>
            </div>
          </div>
        </div>
        <div className="legend-section">
          <h4>Links</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span>Thickness = Similarity Strength</span>
            </div>
            <div className="legend-item">
              <span>Threshold: {(similarityThreshold * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NetworkGraph