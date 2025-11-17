/**
 * FilterExportDemo - Demo component to test FilterPanel and ExportMenu
 * 
 * This component demonstrates the integration of:
 * - FilterPanel with filter controls
 * - ExportMenu with export functionality
 * - ComparisonContext for state management
 */

import { useState, useRef } from 'react'
import FilterPanel from './FilterPanel.jsx'
import ExportMenu from './ExportMenu.jsx'
import FilterButton from './FilterButton.jsx'
import ExportButton from './ExportButton.jsx'
import '../styles/FilterPanel.css'
import '../styles/ComparisonHeader.css'

const FilterExportDemo = () => {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [filters, setFilters] = useState({
    regions: [],
    incomeLevel: [],
    dataAvailability: 'all'
  })

  const chartRef = useRef(null)
  const dataRef = useRef([
    { country: 'USA', year: 2020, value: 100 },
    { country: 'Canada', year: 2020, value: 80 },
    { country: 'Mexico', year: 2020, value: 60 }
  ])
  const containerRef = useRef(null)

  // Count active filters
  const activeFilterCount = 
    filters.regions.length + 
    filters.incomeLevel.length + 
    (filters.dataAvailability !== 'all' ? 1 : 0)

  // Mock filtered count
  const filteredCount = 150
  const totalCount = 200

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters)
    console.log('Filters applied:', newFilters)
  }

  const handleExport = (format) => {
    console.log('Export format selected:', format)
    setExportMenuOpen(false)
  }

  return (
    <div ref={containerRef} style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Filter & Export Demo</h1>
      
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginTop: '24px',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <FilterButton 
          activeCount={activeFilterCount}
          onClick={() => setFilterPanelOpen(true)}
        />
        
        <ExportButton 
          onClick={handleExport}
        />
      </div>

      {/* Sample Chart Area */}
      <div 
        ref={chartRef}
        style={{
          marginTop: '32px',
          padding: '40px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Sample Chart Area</h2>
          <p>This area would contain your chart visualization</p>
          <svg width="400" height="200" style={{ border: '1px solid #e5e7eb', marginTop: '20px' }}>
            <rect x="50" y="50" width="80" height="100" fill="#3b82f6" />
            <rect x="160" y="80" width="80" height="70" fill="#10b981" />
            <rect x="270" y="30" width="80" height="120" fill="#f59e0b" />
          </svg>
        </div>
      </div>

      {/* Current Filters Display */}
      <div style={{ marginTop: '32px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Current Filters:</h3>
        <pre style={{ background: 'white', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
          {JSON.stringify(filters, null, 2)}
        </pre>
        <p><strong>Active Filters:</strong> {activeFilterCount}</p>
        <p><strong>Filtered Countries:</strong> {filteredCount} of {totalCount}</p>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        currentFilters={filters}
        onApply={handleApplyFilters}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />

      {/* Export Menu (integrated with ExportButton) */}
      {exportMenuOpen && (
        <ExportMenu
          chartRef={chartRef}
          dataRef={dataRef}
          containerRef={containerRef}
        />
      )}
    </div>
  )
}

export default FilterExportDemo
