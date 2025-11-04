import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import './Legend.css'

const Legend = ({ extent, colorScale }) => {
  const gradientRef = useRef(null)

  useEffect(() => {
    if (!colorScale || !extent || !Array.isArray(extent) || extent.length < 2) return

    const container = d3.select(gradientRef.current)
    container.selectAll('*').remove()

    const steps = 20
    const stepWidth = 300 / steps

    for (let i = 0; i < steps; i++) {
      const value = extent[0] + (extent[1] - extent[0]) * (i / steps)
      const color = colorScale(value)
      container
        .append('div')
        .style('width', stepWidth + 'px')
        .style('height', '100%')
        .style('background-color', color)
        .style('display', 'inline-block')
    }
  }, [colorScale, extent])

  // Validate extent before rendering
  if (!extent || !Array.isArray(extent) || extent.length < 2) return null
  if (typeof extent[0] !== 'number' || typeof extent[1] !== 'number') return null
  if (isNaN(extent[0]) || isNaN(extent[1])) return null

  return (
    <div className="legend">
      <h3>GDP Growth Rate (%)</h3>
      <div className="legend-scale" ref={gradientRef}></div>
      <div className="legend-labels">
        <span>{extent[0].toFixed(1)}%</span>
        <span>{extent[1].toFixed(1)}%</span>
      </div>
    </div>
  )
}

export default Legend