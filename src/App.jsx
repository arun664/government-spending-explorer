import { useState, useEffect } from 'react'
import './App.css'
import { filterStateManager } from './shared/services/FilterStateManager.js'

// Import modules
import { SpendingAnalysis } from './modules/spending'
import { GDPAnalysis } from './modules/gdp'
import { ComparisonPage } from './modules/comparison'
import { AboutPage } from './modules/about'

function App() {
  const [currentView, setCurrentView] = useState(() => {
    // Restore last viewed module from session storage, default to 'about'
    return filterStateManager.getCurrentModule() || 'about'
  })
  // Page-specific loading states
  const [spendingLoading, setSpendingLoading] = useState(true)
  const [gdpLoading, setGdpLoading] = useState(true)
  const [comparisonLoading, setComparisonLoading] = useState(true)
  
  // Comparison controls state
  const [comparisonControls, setComparisonControls] = useState(null)

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
          
          {/* Center section - Always show nav tabs */}
          <nav className="nav-tabs">
            <button 
              className={`nav-tab ${currentView === 'about' ? 'active' : ''}`}
              onClick={() => handleModuleSwitch('about')}
            >
              About
            </button>
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
          {currentView === 'about' && (
            <div className="view-container">
              <AboutPage />
            </div>
          )}
          
          {currentView === 'spending' && (
            <div className={`view-container ${currentView === 'spending' ? 'spending-mode' : ''}`}>
              <SpendingAnalysis onLoadingChange={setSpendingLoading} />
            </div>
          )}
          
          {currentView === 'gdp' && (
            <div className="view-container">
              <GDPAnalysis onLoadingChange={setGdpLoading} />
            </div>
          )}
          
          {currentView === 'comparison' && (
            <div className="view-container comparison-view">
              <ComparisonPage 
                onLoadingChange={setComparisonLoading}
                onControlsReady={setComparisonControls}
              />
            </div>
          )}
          
          {/* Page-specific Loading Overlay - Only covers main content (not for About page) */}
          {currentView !== 'about' && ((currentView === 'spending' && spendingLoading) ||
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