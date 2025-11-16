/**
 * InteractionUtils - Utility for interactive chart features
 * 
 * Features:
 * - Zoom and pan functionality with D3
 * - Quadrant analysis for scatter plots
 * - Selection and filtering utilities
 * - Cross-chart interaction coordination
 */

import * as d3 from 'd3'

export class InteractionUtils {
  constructor() {
    this.zoomBehaviors = new Map()
    this.selectionBehaviors = new Map()
    this.quadrantAnalysis = new Map()
  }

  /**
   * Create zoom and pan behavior for a chart
   * @param {Object} options - Zoom configuration options
   * @returns {Function} D3 zoom behavior
   */
  createZoomBehavior(options = {}) {
    const opts = {
      scaleExtent: [0.1, 10],
      translateExtent: null, // Auto-calculated if not provided
      filter: null, // Custom filter function
      onZoom: null,
      onZoomStart: null,
      onZoomEnd: null,
      ...options
    }

    const zoom = d3.zoom()
      .scaleExtent(opts.scaleExtent)

    if (opts.translateExtent) {
      zoom.translateExtent(opts.translateExtent)
    }

    if (opts.filter) {
      zoom.filter(opts.filter)
    }

    zoom
      .on('start', (event) => {
        if (opts.onZoomStart) {
          opts.onZoomStart(event)
        }
      })
      .on('zoom', (event) => {
        if (opts.onZoom) {
          opts.onZoom(event)
        }
      })
      .on('end', (event) => {
        if (opts.onZoomEnd) {
          opts.onZoomEnd(event)
        }
      })

    return zoom
  }

  /**
   * Create brush selection behavior
   * @param {Object} options - Brush configuration options
   * @returns {Function} D3 brush behavior
   */
  createBrushBehavior(options = {}) {
    const opts = {
      extent: [[0, 0], [100, 100]],
      onBrushStart: null,
      onBrush: null,
      onBrushEnd: null,
      ...options
    }

    const brush = d3.brush()
      .extent(opts.extent)

    brush
      .on('start', (event) => {
        if (opts.onBrushStart) {
          opts.onBrushStart(event)
        }
      })
      .on('brush', (event) => {
        if (opts.onBrush) {
          opts.onBrush(event)
        }
      })
      .on('end', (event) => {
        if (opts.onBrushEnd) {
          opts.onBrushEnd(event)
        }
      })

    return brush
  }

  /**
   * Perform quadrant analysis on scatter plot data
   * @param {Array} data - Data points with x and y coordinates
   * @param {Object} scales - X and Y scales
   * @param {Object} options - Analysis options
   * @returns {Object} Quadrant analysis results
   */
  analyzeQuadrants(data, scales, options = {}) {
    const opts = {
      xThreshold: 0, // X-axis threshold for quadrant division
      yThreshold: 0, // Y-axis threshold for quadrant division
      xField: 'gdpGrowth',
      yField: 'totalSpending',
      ...options
    }

    const quadrants = {
      topRight: [], // High X, High Y
      topLeft: [],  // Low X, High Y
      bottomLeft: [], // Low X, Low Y
      bottomRight: [] // High X, Low Y
    }

    const stats = {
      topRight: { count: 0, avgX: 0, avgY: 0 },
      topLeft: { count: 0, avgX: 0, avgY: 0 },
      bottomLeft: { count: 0, avgX: 0, avgY: 0 },
      bottomRight: { count: 0, avgX: 0, avgY: 0 }
    }

    data.forEach(point => {
      const x = point[opts.xField]
      const y = point[opts.yField]

      if (x == null || y == null) return

      let quadrant
      if (x >= opts.xThreshold && y >= opts.yThreshold) {
        quadrant = 'topRight'
      } else if (x < opts.xThreshold && y >= opts.yThreshold) {
        quadrant = 'topLeft'
      } else if (x < opts.xThreshold && y < opts.yThreshold) {
        quadrant = 'bottomLeft'
      } else {
        quadrant = 'bottomRight'
      }

      quadrants[quadrant].push(point)
      stats[quadrant].count++
    })

    // Calculate averages for each quadrant
    Object.keys(quadrants).forEach(quadrant => {
      const points = quadrants[quadrant]
      if (points.length > 0) {
        stats[quadrant].avgX = points.reduce((sum, p) => sum + p[opts.xField], 0) / points.length
        stats[quadrant].avgY = points.reduce((sum, p) => sum + p[opts.yField], 0) / points.length
      }
    })

    return {
      quadrants,
      stats,
      total: data.length,
      thresholds: {
        x: opts.xThreshold,
        y: opts.yThreshold
      },
      distribution: {
        topRight: (stats.topRight.count / data.length) * 100,
        topLeft: (stats.topLeft.count / data.length) * 100,
        bottomLeft: (stats.bottomLeft.count / data.length) * 100,
        bottomRight: (stats.bottomRight.count / data.length) * 100
      }
    }
  }

  /**
   * Create interactive quadrant overlay for scatter plots
   * @param {Selection} svg - D3 SVG selection
   * @param {Object} scales - X and Y scales
   * @param {Object} dimensions - Chart dimensions
   * @param {Object} options - Overlay options
   */
  createQuadrantOverlay(svg, scales, dimensions, options = {}) {
    const opts = {
      xThreshold: 0,
      yThreshold: 0,
      showLabels: true,
      showLines: true,
      interactive: true,
      onQuadrantClick: null,
      ...options
    }

    const { width, height } = dimensions
    const xPos = scales.x(opts.xThreshold)
    const yPos = scales.y(opts.yThreshold)

    const overlay = svg.append('g')
      .attr('class', 'quadrant-overlay')

    // Draw quadrant lines
    if (opts.showLines) {
      // Vertical line
      if (xPos >= 0 && xPos <= width) {
        overlay.append('line')
          .attr('class', 'quadrant-line vertical')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', '#666')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.7)
      }

      // Horizontal line
      if (yPos >= 0 && yPos <= height) {
        overlay.append('line')
          .attr('class', 'quadrant-line horizontal')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', yPos)
          .attr('y2', yPos)
          .attr('stroke', '#666')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.7)
      }
    }

    // Create interactive quadrant areas
    if (opts.interactive) {
      const quadrantAreas = [
        { name: 'topRight', x: Math.max(xPos, 0), y: 0, width: width - Math.max(xPos, 0), height: Math.min(yPos, height) },
        { name: 'topLeft', x: 0, y: 0, width: Math.min(xPos, width), height: Math.min(yPos, height) },
        { name: 'bottomLeft', x: 0, y: Math.max(yPos, 0), width: Math.min(xPos, width), height: height - Math.max(yPos, 0) },
        { name: 'bottomRight', x: Math.max(xPos, 0), y: Math.max(yPos, 0), width: width - Math.max(xPos, 0), height: height - Math.max(yPos, 0) }
      ]

      quadrantAreas.forEach(area => {
        if (area.width > 0 && area.height > 0) {
          overlay.append('rect')
            .attr('class', `quadrant-area ${area.name}`)
            .attr('x', area.x)
            .attr('y', area.y)
            .attr('width', area.width)
            .attr('height', area.height)
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .style('cursor', 'pointer')
            .on('click', function(event) {
              if (opts.onQuadrantClick) {
                opts.onQuadrantClick(area.name, event)
              }
            })
            .on('mouseover', function() {
              d3.select(this)
                .attr('fill', 'rgba(0, 100, 200, 0.1)')
                .attr('stroke', 'rgba(0, 100, 200, 0.3)')
                .attr('stroke-width', 2)
            })
            .on('mouseout', function() {
              d3.select(this)
                .attr('fill', 'transparent')
                .attr('stroke', 'none')
            })
        }
      })
    }

    // Add quadrant labels
    if (opts.showLabels) {
      const labels = [
        { name: 'High Growth\nHigh Spending', x: (Math.max(xPos, 0) + width) / 2, y: Math.min(yPos, height) / 2, quadrant: 'topRight' },
        { name: 'Low Growth\nHigh Spending', x: Math.min(xPos, width) / 2, y: Math.min(yPos, height) / 2, quadrant: 'topLeft' },
        { name: 'Low Growth\nLow Spending', x: Math.min(xPos, width) / 2, y: (Math.max(yPos, 0) + height) / 2, quadrant: 'bottomLeft' },
        { name: 'High Growth\nLow Spending', x: (Math.max(xPos, 0) + width) / 2, y: (Math.max(yPos, 0) + height) / 2, quadrant: 'bottomRight' }
      ]

      labels.forEach(label => {
        if (label.x > 0 && label.x < width && label.y > 0 && label.y < height) {
          const textGroup = overlay.append('g')
            .attr('class', `quadrant-label ${label.quadrant}`)
            .attr('transform', `translate(${label.x}, ${label.y})`)

          label.name.split('\n').forEach((line, i) => {
            textGroup.append('text')
              .attr('text-anchor', 'middle')
              .attr('dy', `${i * 1.2}em`)
              .attr('fill', '#999')
              .attr('font-size', '12px')
              .attr('opacity', 0.8)
              .text(line)
          })
        }
      })
    }

    return overlay
  }

  /**
   * Create selection rectangle for data filtering
   * @param {Selection} svg - D3 SVG selection
   * @param {Object} options - Selection options
   * @returns {Object} Selection utilities
   */
  createSelectionTool(svg, options = {}) {
    const opts = {
      onSelectionStart: null,
      onSelectionChange: null,
      onSelectionEnd: null,
      className: 'selection-rect',
      ...options
    }

    let isSelecting = false
    let startPoint = null
    let selectionRect = null

    const selectionGroup = svg.append('g')
      .attr('class', 'selection-tool')

    // Mouse event handlers
    const handleMouseDown = (event) => {
      if (event.button !== 0) return // Only left mouse button

      isSelecting = true
      startPoint = d3.pointer(event, svg.node())

      selectionRect = selectionGroup.append('rect')
        .attr('class', opts.className)
        .attr('x', startPoint[0])
        .attr('y', startPoint[1])
        .attr('width', 0)
        .attr('height', 0)
        .attr('fill', 'rgba(0, 100, 200, 0.1)')
        .attr('stroke', 'rgba(0, 100, 200, 0.5)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')

      if (opts.onSelectionStart) {
        opts.onSelectionStart(startPoint)
      }

      event.preventDefault()
    }

    const handleMouseMove = (event) => {
      if (!isSelecting || !selectionRect) return

      const currentPoint = d3.pointer(event, svg.node())
      const x = Math.min(startPoint[0], currentPoint[0])
      const y = Math.min(startPoint[1], currentPoint[1])
      const width = Math.abs(currentPoint[0] - startPoint[0])
      const height = Math.abs(currentPoint[1] - startPoint[1])

      selectionRect
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height)

      if (opts.onSelectionChange) {
        opts.onSelectionChange({
          x, y, width, height,
          startPoint,
          currentPoint
        })
      }
    }

    const handleMouseUp = (event) => {
      if (!isSelecting) return

      isSelecting = false
      const endPoint = d3.pointer(event, svg.node())

      const selection = {
        x1: Math.min(startPoint[0], endPoint[0]),
        y1: Math.min(startPoint[1], endPoint[1]),
        x2: Math.max(startPoint[0], endPoint[0]),
        y2: Math.max(startPoint[1], endPoint[1]),
        width: Math.abs(endPoint[0] - startPoint[0]),
        height: Math.abs(endPoint[1] - startPoint[1])
      }

      if (opts.onSelectionEnd) {
        opts.onSelectionEnd(selection)
      }

      // Remove selection rectangle
      if (selectionRect) {
        selectionRect.remove()
        selectionRect = null
      }

      startPoint = null
    }

    // Attach event listeners
    svg
      .on('mousedown.selection', handleMouseDown)
      .on('mousemove.selection', handleMouseMove)
      .on('mouseup.selection', handleMouseUp)

    return {
      enable: () => {
        svg
          .on('mousedown.selection', handleMouseDown)
          .on('mousemove.selection', handleMouseMove)
          .on('mouseup.selection', handleMouseUp)
      },
      disable: () => {
        svg
          .on('mousedown.selection', null)
          .on('mousemove.selection', null)
          .on('mouseup.selection', null)
      },
      destroy: () => {
        svg
          .on('mousedown.selection', null)
          .on('mousemove.selection', null)
          .on('mouseup.selection', null)
        selectionGroup.remove()
      }
    }
  }

  /**
   * Filter data points within a selection area
   * @param {Array} data - Data points to filter
   * @param {Object} selection - Selection bounds
   * @param {Object} scales - X and Y scales
   * @param {Object} options - Filter options
   * @returns {Array} Filtered data points
   */
  filterDataInSelection(data, selection, scales, options = {}) {
    const opts = {
      xField: 'gdpGrowth',
      yField: 'totalSpending',
      ...options
    }

    return data.filter(point => {
      const x = scales.x(point[opts.xField])
      const y = scales.y(point[opts.yField])

      return x >= selection.x1 && 
             x <= selection.x2 && 
             y >= selection.y1 && 
             y <= selection.y2
    })
  }

  /**
   * Create crosshair cursor for precise data reading
   * @param {Selection} svg - D3 SVG selection
   * @param {Object} dimensions - Chart dimensions
   * @param {Object} options - Crosshair options
   * @returns {Object} Crosshair utilities
   */
  createCrosshair(svg, dimensions, options = {}) {
    const opts = {
      showValues: true,
      onMove: null,
      className: 'crosshair',
      ...options
    }

    const crosshairGroup = svg.append('g')
      .attr('class', opts.className)
      .style('pointer-events', 'none')
      .style('display', 'none')

    const verticalLine = crosshairGroup.append('line')
      .attr('class', 'crosshair-vertical')
      .attr('y1', 0)
      .attr('y2', dimensions.height)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.7)

    const horizontalLine = crosshairGroup.append('line')
      .attr('class', 'crosshair-horizontal')
      .attr('x1', 0)
      .attr('x2', dimensions.width)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.7)

    let valueDisplay = null
    if (opts.showValues) {
      valueDisplay = crosshairGroup.append('g')
        .attr('class', 'crosshair-values')
    }

    return {
      show: () => {
        crosshairGroup.style('display', null)
      },
      hide: () => {
        crosshairGroup.style('display', 'none')
      },
      update: (x, y, values = null) => {
        verticalLine.attr('x1', x).attr('x2', x)
        horizontalLine.attr('y1', y).attr('y2', y)

        if (opts.showValues && valueDisplay && values) {
          valueDisplay.selectAll('*').remove()

          // X value
          valueDisplay.append('rect')
            .attr('x', x - 30)
            .attr('y', dimensions.height + 5)
            .attr('width', 60)
            .attr('height', 20)
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .attr('rx', 3)

          valueDisplay.append('text')
            .attr('x', x)
            .attr('y', dimensions.height + 17)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '10px')
            .text(values.x)

          // Y value
          valueDisplay.append('rect')
            .attr('x', -55)
            .attr('y', y - 10)
            .attr('width', 50)
            .attr('height', 20)
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .attr('rx', 3)

          valueDisplay.append('text')
            .attr('x', -30)
            .attr('y', y + 3)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '10px')
            .text(values.y)
        }

        if (opts.onMove) {
          opts.onMove({ x, y, values })
        }
      },
      destroy: () => {
        crosshairGroup.remove()
      }
    }
  }

  /**
   * Synchronize zoom across multiple charts
   * @param {Array} charts - Array of chart objects with zoom behaviors
   * @param {Object} options - Sync options
   */
  synchronizeZoom(charts, options = {}) {
    const opts = {
      syncX: true,
      syncY: true,
      ...options
    }

    charts.forEach((chart, index) => {
      if (chart.zoom && chart.svg) {
        chart.zoom.on('zoom.sync', (event) => {
          const { transform } = event
          
          // Apply transform to other charts
          charts.forEach((otherChart, otherIndex) => {
            if (otherIndex !== index && otherChart.zoom && otherChart.svg) {
              const syncTransform = d3.zoomIdentity
                .translate(
                  opts.syncX ? transform.x : 0,
                  opts.syncY ? transform.y : 0
                )
                .scale(transform.k)

              otherChart.svg.call(otherChart.zoom.transform, syncTransform)
            }
          })
        })
      }
    })
  }
}

// Export singleton instance
export const interactionUtils = new InteractionUtils()

// Export utility functions
export const createZoomBehavior = (options) => interactionUtils.createZoomBehavior(options)
export const createBrushBehavior = (options) => interactionUtils.createBrushBehavior(options)
export const analyzeQuadrants = (data, scales, options) => interactionUtils.analyzeQuadrants(data, scales, options)