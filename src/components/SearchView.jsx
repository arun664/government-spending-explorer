import React, { useState, useEffect } from 'react'
import SearchBar from './SearchBar.jsx'
import WorldMap from './WorldMap.jsx'
import CountryStatistics from './CountryStatistics.jsx'
import { loadAllData, getUniqueCountries } from '../utils/dataLoader.js'
import { getCountryRegion } from '../utils/regionMapping.js'
import './SearchView.css'

const SearchView = ({ className = "" }) => {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [countries, setCountries] = useState([])
  const [gdpData, setGdpData] = useState([])
  const [expenseData, setExpenseData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await loadAllData()
        setGdpData(data.gdp)
        setExpenseData(data.expenses)
        
        // Create unique countries list with regions
        const uniqueCountryNames = getUniqueCountries(data.gdp)
        const countriesWithRegions = uniqueCountryNames.map(countryName => {
          // Find country code from GDP data
          const countryRecord = data.gdp.find(d => d.countryName === countryName)
          const countryCode = countryRecord?.countryCode || ''
          const region = getCountryRegion(countryCode)
          
          return {
            countryName,
            countryCode,
            region
          }
        }).filter(country => country.countryCode) // Only include countries with valid codes
        
        setCountries(countriesWithRegions)
        
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle country selection from search
  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
  }

  // Handle country selection from map
  const handleMapCountryClick = (country) => {
    // Find the complete country data from our countries list
    const completeCountry = countries.find(c => 
      c.countryCode === country.countryCode || 
      c.countryName === country.countryName
    )
    
    if (completeCountry) {
      setSelectedCountry(completeCountry)
    } else {
      // If not found in our data, use the basic info from the map
      setSelectedCountry(country)
    }
  }

  if (isLoading) {
    return (
      <div className={`search-view loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-content">
            <h2>Loading Search Interface</h2>
            <p>Preparing country data and map visualization...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`search-view error ${className}`}>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Failed to Load Data</h2>
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`search-view ${className}`}>
      <div className="search-view-header">
        <h2>🔍 Country Search & Analysis</h2>
        <p>Search for countries to view detailed statistics and explore the interactive world map.</p>
      </div>

      <div className="search-controls">
        <SearchBar
          countries={countries}
          onCountrySelect={handleCountrySelect}
          placeholder="Search countries by name or code..."
          className="main-search-bar"
        />
        
        {selectedCountry && (
          <div className="selected-country-info">
            <span className="selected-label">Selected:</span>
            <span className="selected-country">
              {selectedCountry.countryName} ({selectedCountry.countryCode})
            </span>
            <span className="selected-region">{selectedCountry.region}</span>
            <button 
              onClick={() => setSelectedCountry(null)}
              className="clear-selection-button"
              title="Clear selection"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="search-content">
        <div className="map-section">
          <WorldMap
            selectedCountry={selectedCountry}
            onCountryClick={handleMapCountryClick}
            width={800}
            height={500}
            className="interactive-map"
          />
        </div>

        <div className="statistics-section">
          <CountryStatistics
            selectedCountry={selectedCountry}
            gdpData={gdpData}
            expenseData={expenseData}
            className="country-stats"
          />
        </div>
      </div>

      <div className="search-view-footer">
        <div className="data-info">
          <h4>📊 Available Data</h4>
          <div className="data-stats">
            <div className="data-stat">
              <span className="stat-label">Countries:</span>
              <span className="stat-value">{countries.length}</span>
            </div>
            <div className="data-stat">
              <span className="stat-label">GDP Records:</span>
              <span className="stat-value">{gdpData.length}</span>
            </div>
            <div className="data-stat">
              <span className="stat-label">Expense Records:</span>
              <span className="stat-value">{expenseData.length}</span>
            </div>
          </div>
        </div>

        <div className="usage-tips">
          <h4>💡 Usage Tips</h4>
          <ul>
            <li>Use the search bar to quickly find countries by name or ISO code</li>
            <li>Click on countries in the map to view their statistics</li>
            <li>The map automatically zooms to the selected country's region</li>
            <li>Countries are color-coded by geographic region</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SearchView