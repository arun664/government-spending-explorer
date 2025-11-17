/**
 * RightSidebar - Fixed sidebar displaying highlights and insights
 * 
 * Features:
 * - Single section: Top Performers
 * - Fixed position without scrolling
 * - Updates dynamically based on data selection
 * - Notable Trends and Significant Outliers moved to tab section at bottom of page
 * 
 * Requirements: 5.7, 9.1, 9.2, 9.6, 9.8
 */

import React from 'react'
import TopPerformers from './TopPerformers.jsx'
import { useComparison } from '../context/ComparisonContext.jsx'

const RightSidebar = () => {
  const { state } = useComparison()
  const { loading, error } = state

  return (
    <div className="right-sidebar" role="complementary" aria-label="Data highlights and insights">
      {loading && (
        <div className="sidebar-loading">
          <div className="loading-spinner"></div>
          <p>Loading insights...</p>
        </div>
      )}

      {error && (
        <div className="sidebar-error">
          <div className="error-icon">⚠️</div>
          <p>Unable to load insights</p>
        </div>
      )}

      {!loading && !error && (
        <TopPerformers />
      )}
    </div>
  )
}

export default RightSidebar
