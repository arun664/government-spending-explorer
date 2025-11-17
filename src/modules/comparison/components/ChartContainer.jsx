/**
 * ChartContainer - Responsive container for chart components
 * 
 * Features:
 * - Responsive sizing (70-80% of viewport)
 * - Loading state with spinner
 * - Error boundary for chart failures
 * - Automatic resize handling
 * 
 * Requirements: 3.1, 3.5, 7.1
 */

import { Component, Suspense } from 'react'
import { useComparison } from '../context/ComparisonContext.jsx'
import '../styles/Charts.css'

/**
 * Error Boundary for chart failures
 */
class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="chart-error">
          <div className="error-icon">⚠️</div>
          <h3>Chart Error</h3>
          <p>{this.state.error?.message || 'Failed to render chart'}</p>
          <button 
            className="retry-button"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="chart-loading">
      <div className="spinner"></div>
      <p>Loading chart...</p>
    </div>
  )
}

/**
 * ChartContainer component
 */
export function ChartContainer({ children, className = '' }) {
  const { state } = useComparison()

  return (
    <div className={`chart-container ${className}`}>
      <ChartErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          {state.loading ? (
            <LoadingSpinner />
          ) : state.error ? (
            <div className="chart-error">
              <div className="error-icon">⚠️</div>
              <h3>Data Error</h3>
              <p>{state.error}</p>
            </div>
          ) : (
            children
          )}
        </Suspense>
      </ChartErrorBoundary>
    </div>
  )
}

export default ChartContainer
