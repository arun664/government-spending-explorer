import React from 'react'
import '../styles/ZoomControls.css'

const ZoomControls = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="zoom-controls">
      <button 
        className="zoom-btn zoom-in" 
        onClick={onZoomIn}
        title="Zoom In"
      >
        +
      </button>
      <button 
        className="zoom-btn zoom-out" 
        onClick={onZoomOut}
        title="Zoom Out"
      >
        −
      </button>
      <button 
        className="zoom-btn reset-btn" 
        onClick={onReset}
        title="Reset Zoom"
      >
        ⟲
      </button>
    </div>
  )
}

export default ZoomControls