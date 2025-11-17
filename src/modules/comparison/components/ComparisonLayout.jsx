/**
 * ComparisonLayout - Main layout component for comparison page
 * 
 * Features:
 * - Fixed CSS Grid layout (no scrolling, 100vh height)
 * - Grid structure: header | top-metrics | main-chart | bottom-metrics | right-sidebar
 * - Responsive breakpoints for desktop, tablet, and mobile
 * 
 * Requirements: 13.1, 13.2, 13.3
 */

import React from 'react'
import { useComparison } from '../context/ComparisonContext.jsx'
import '../styles/ComparisonLayout.css'

const ComparisonLayout = ({ children }) => {
  const { state } = useComparison()

  return (
    <div className={`comparison-layout ${state.headerCollapsed ? 'header-collapsed' : ''}`}>
      {children}
    </div>
  )
}

// Layout sections as separate components for better organization
export const LayoutHeader = ({ children }) => (
  <div className="comparison-layout-header">
    {children}
  </div>
)

export const LayoutTopMetrics = ({ children }) => (
  <div className="comparison-layout-top-metrics">
    {children}
  </div>
)

export const LayoutMainChart = ({ children }) => (
  <div className="comparison-layout-main-chart">
    {children}
  </div>
)

export const LayoutBottomMetrics = ({ children }) => (
  <div className="comparison-layout-bottom-metrics">
    {children}
  </div>
)

export const LayoutRightSidebar = ({ children }) => (
  <div className="comparison-layout-right-sidebar">
    {children}
  </div>
)

export default ComparisonLayout
