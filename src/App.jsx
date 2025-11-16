import React, { useState, useEffect } from 'react'
import './App.css'
import ExportButton from './shared/components/ExportButton.jsx'
import { filterStateManager } from './shared/services/FilterStateManager.js'

// Import modules
import { SpendingAnalysis, USReportGenerator } from './modules/spending'
import { GDPAnalysis } from './modules/gdp'
import { ComparisonDashboard } from './modules/comparison'

function App() {
  const [currentView, setCurrentView] = useState(() => {
    // Restore last viewed module from session storage
    return filterStateManager.getCurrentModule() || 'spending'
  })
  const [spendingSubView, setSpendingSubView] = useState('global') // 'global' or 'us'

  const [exportData, setExportData] = useState(null)
  // Page-specific loading states
  const [spendingLoading, setSpendingLoading] = useState(true)
  const [gdpLoading, setGdpLoading] = useState(true)
  const [comparisonLoading, setComparisonLoading] = useState(true)

  // Clear export data when switching views
  useEffect(() => {
    setExportData(null)
  }, [currentView, spendingSubView])

  // Reset loading state when switching to a new view
  useEffect(() => {
    if (currentView === 'spending') {
      setSpendingLoading(true)
    } else if (currentView === 'gdp') {
      setGdpLoading(true)
    } else if (currentView === 'comparison') {
      setComparisonLoading(true)
    }
  }, [currentView])

  // Handle module switching with filter restoration
  const handleModuleSwitch = (newModule) => {
    // Restore filters for the new module
    filterStateManager.restoreFiltersForModule(newModule)
    setCurrentView(newModule)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Government Expense Dashboard</h1>
          <nav className="nav-tabs">
            <button 
              className={`nav-tab ${currentView === 'spending' ? 'active' : ''}`}
              onClick={() => handleModuleSwitch('spending')}
            >
              Spending
            </button>
            <button 
              className={`nav-tab ${currentView === 'gdp' ? 'active' : ''}`}
              onClick={() => handleModuleSwitch('gdp')}
            >
              GDP
            </button>
            <button 
              className={`nav-tab ${currentView === 'comparison' ? 'active' : ''}`}
              onClick={() => handleModuleSwitch('comparison')}
            >
              Comparison
            </button>
          </nav>
        </div>
      </header>

      <main className={`app-content ${currentView === 'spending' ? 'spending-mode' : ''}`}>
        <div className={`content-container ${currentView === 'spending' ? 'spending-mode' : ''}`} style={{ position: 'relative' }}>
          {currentView === 'spending' && (
            <div className={`view-container ${currentView === 'spending' ? 'spending-mode' : ''}`}>
              <div className="sub-nav">
                <div className="sub-nav-left">
                  <button 
                    className={`sub-nav-tab ${spendingSubView === 'global' ? 'active' : ''}`}
                    onClick={() => setSpendingSubView('global')}
                  >
                    Global Analysis
                  </button>
                  <button 
                    className={`sub-nav-tab ${spendingSubView === 'us' ? 'active' : ''}`}
                    onClick={() => setSpendingSubView('us')}
                  >
                    US Analysis
                  </button>
                </div>
                <div className="sub-nav-right">
                  {exportData && (
                    <ExportButton 
                      data={exportData.data}
                      chartElements={exportData.chartElements}
                      reportType={exportData.reportType}
                      fileName={exportData.fileName}
                      metadata={exportData.metadata}
                    />
                  )}
                </div>
              </div>
              
              {spendingSubView === 'global' && <SpendingAnalysis onExportDataChange={setExportData} onLoadingChange={setSpendingLoading} />}
              {spendingSubView === 'us' && <USReportGenerator onExportDataChange={setExportData} />}
            </div>
          )}
          
          {currentView === 'gdp' && (
            <div className="view-container">
              <GDPAnalysis onLoadingChange={setGdpLoading} />
            </div>
          )}
          
          {currentView === 'comparison' && (
            <div className="view-container comparison-view">
              <ComparisonDashboard onLoadingChange={setComparisonLoading} />
            </div>
          )}
          
          {/* Page-specific Loading Overlay - Only covers main content */}
          {((currentView === 'spending' && spendingLoading) ||
            (currentView === 'gdp' && gdpLoading) ||
            (currentView === 'comparison' && comparisonLoading)) && (
            <div className="global-loading-overlay">
              <div className="loading-content">
                <div className="spinner"></div>
                <p>Loading {currentView} data...</p>
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  )
}

export default App