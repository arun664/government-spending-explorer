import React, { useState, useEffect } from 'react'
import './App.css'
import { dataProcessor } from './services/DataProcessor.js'
import ExportButton from './shared/components/ExportButton.jsx'

// Import modules
import { SpendingAnalysis, USReportGenerator } from './modules/spending'
import { GDPAnalysis } from './modules/gdp'
import { GDPSpendingComparison } from './modules/comparison'

function App() {
  const [currentView, setCurrentView] = useState('spending')
  const [spendingSubView, setSpendingSubView] = useState('global') // 'global' or 'us'
  const [dataProcessingStatus, setDataProcessingStatus] = useState(null)
  const [exportData, setExportData] = useState(null)

  // Clear export data when switching views
  useEffect(() => {
    setExportData(null)
  }, [currentView, spendingSubView])

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
        <div className={`content-container ${currentView === 'spending' ? 'spending-mode' : ''}`}>
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
              
              {spendingSubView === 'global' && <SpendingAnalysis onExportDataChange={setExportData} />}
              {spendingSubView === 'us' && <USReportGenerator onExportDataChange={setExportData} />}
            </div>
          )}
          
          {currentView === 'gdp' && (
            <div className="view-container">
              <GDPAnalysis />
            </div>
          )}
          
          {currentView === 'comparison' && (
            <div className="view-container">
              <GDPSpendingComparison />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App