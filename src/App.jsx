import React, { useState, useEffect } from 'react'
import './App.css'
import ExportButton from './shared/components/ExportButton.jsx'

// Import modules
import { SpendingAnalysis, USReportGenerator } from './modules/spending'
import { GDPAnalysis } from './modules/gdp'
import { ComparisonDashboard } from './modules/comparison'

function App() {
  const [currentView, setCurrentView] = useState('spending')
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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Government Expense Dashboard</h1>
          <nav className="nav-tabs">
            <button 
              className={`nav-tab ${currentView === 'spending' ? 'active' : ''}`}
              onClick={() => setCurrentView('spending')}
            >
              Spending
            </button>
            <button 
              className={`nav-tab ${currentView === 'gdp' ? 'active' : ''}`}
              onClick={() => setCurrentView('gdp')}
            >
              GDP
            </button>
            <button 
              className={`nav-tab ${currentView === 'comparison' ? 'active' : ''}`}
              onClick={() => setCurrentView('comparison')}
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