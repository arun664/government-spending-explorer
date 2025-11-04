import React, { useState, useEffect } from 'react'
import './App.css'
import { dataProcessor } from './services/DataProcessor.js'
import ComparisonEngine from './components/ComparisonEngine.jsx'
import SearchView from './components/SearchView.jsx'
import USReportGenerator from './components/USReportGenerator.jsx'
import SpendingAnalysis from './components/SpendingAnalysis.jsx'
import GDPAnalysis from './components/GDPAnalysis.jsx'

function App() {
  const [currentView, setCurrentView] = useState('spending')
  const [spendingSubView, setSpendingSubView] = useState('global') // 'global' or 'us'
  const [dataProcessingStatus, setDataProcessingStatus] = useState(null)

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

      <main className="app-content">
        <div className="content-container">
          {currentView === 'spending' && (
            <div className="view-container">
              <div className="sub-nav">
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
              
              {spendingSubView === 'global' && <SpendingAnalysis />}
              {spendingSubView === 'us' && <USReportGenerator />}
            </div>
          )}
          
          {currentView === 'gdp' && (
            <div className="view-container">
              <GDPAnalysis />
            </div>
          )}
          
          {currentView === 'comparison' && (
            <div className="view-container">
              <ComparisonEngine />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App