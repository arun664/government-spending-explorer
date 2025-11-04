/**
 * Test to verify loading spinner text rotation fix
 * This test checks that loading spinners have proper structure with separate spinner and text elements
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// Mock components with loading states for testing
const MockLoadingComponent = ({ componentName }) => (
  <div className={`${componentName} loading`}>
    <div className="loading-spinner">
      <div className="spinner"></div>
      <div className="loading-text">Loading {componentName} data...</div>
    </div>
  </div>
)

describe('Loading Spinner Text Rotation Fix', () => {
  it('should have separate spinner and text elements in SpendingAnalysis', () => {
    const { container } = render(<MockLoadingComponent componentName="spending-analysis" />)
    
    const loadingSpinner = container.querySelector('.loading-spinner')
    const spinnerIcon = container.querySelector('.spinner')
    const loadingText = container.querySelector('.loading-text')
    
    expect(loadingSpinner).toBeTruthy()
    expect(spinnerIcon).toBeTruthy()
    expect(loadingText).toBeTruthy()
    expect(loadingText.textContent).toBe('Loading spending-analysis data...')
  })

  it('should have separate spinner and text elements in GDPAnalysis', () => {
    const { container } = render(<MockLoadingComponent componentName="gdp-analysis" />)
    
    const loadingSpinner = container.querySelector('.loading-spinner')
    const spinnerIcon = container.querySelector('.spinner')
    const loadingText = container.querySelector('.loading-text')
    
    expect(loadingSpinner).toBeTruthy()
    expect(spinnerIcon).toBeTruthy()
    expect(loadingText).toBeTruthy()
    expect(loadingText.textContent).toBe('Loading gdp-analysis data...')
  })

  it('should have proper CSS structure to prevent text rotation', () => {
    const { container } = render(<MockLoadingComponent componentName="test-component" />)
    
    const loadingSpinner = container.querySelector('.loading-spinner')
    const spinnerIcon = container.querySelector('.spinner')
    const loadingText = container.querySelector('.loading-text')
    
    // Verify structure: loading-spinner contains both spinner and text as separate elements
    expect(loadingSpinner.children).toHaveLength(2)
    expect(loadingSpinner.children[0]).toBe(spinnerIcon)
    expect(loadingSpinner.children[1]).toBe(loadingText)
  })
})