/**
 * MetricCardsDemo - Demo component to test metric cards and sidebar
 * 
 * This component demonstrates all metric card and sidebar components
 * with sample data for testing purposes.
 */

import React from 'react'
import { ComparisonProvider } from '../context/ComparisonContext.jsx'
import TopMetricCards from './TopMetricCards.jsx'
import BottomMetricCards from './BottomMetricCards.jsx'
import RightSidebar from './RightSidebar.jsx'
import '../styles/MetricCards.css'

const MetricCardsDemo = () => {
  return (
    <ComparisonProvider>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 3fr 1.5fr',
        gridTemplateRows: 'auto 1fr auto',
        height: '100vh',
        gap: '0'
      }}>
        {/* Top Metric Cards */}
        <div style={{ gridColumn: '2 / 3' }}>
          <TopMetricCards />
        </div>

        {/* Main Chart Area (placeholder) */}
        <div style={{ 
          gridColumn: '2 / 3',
          gridRow: '2 / 3',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #dee2e6',
          margin: '12px'
        }}>
          <div style={{ textAlign: 'center', color: '#6c757d' }}>
            <h2>Chart Area</h2>
            <p>Main chart would be displayed here</p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ 
          gridColumn: '3 / 4',
          gridRow: '1 / 4'
        }}>
          <RightSidebar />
        </div>

        {/* Bottom Metric Cards */}
        <div style={{ gridColumn: '2 / 3' }}>
          <BottomMetricCards />
        </div>
      </div>
    </ComparisonProvider>
  )
}

export default MetricCardsDemo
