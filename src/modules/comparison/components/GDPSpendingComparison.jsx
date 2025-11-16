import React, { useState, useEffect } from 'react'
import { loadComparisonData, getUniqueCountries, getUniqueYears, filterDataByYear } from '../utils/comparisonDataLoader.js'
import { getCountryRegion } from '../utils/regionMapping.js'
import SearchBar from '../../../shared/components/SearchBar.jsx'
import '../styles/GDPSpendingComparison.css'

/**
 * GDP vs Spending Comparison Component
 * 
 * This component compares GDP growth data with government spending data
 * across different countries and time periods.
 */
const GDPSpendingComparison = ({ onLoadingChange }) => {
  const [data, setData] = useState({ gdp: [], expenses: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCountries, setSelectedCountries] = useState([])
  const [yearRange, setYearRange] = useState([2015, 2023])
  const [availableYears, setAvailableYears] = useState([])
  const [countries, setCountries] = useState([])
  const [comparisonData, setComparisonData] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (data.gdp.length > 0 || data.expenses.length > 0) {
      processComparisonData()
    }
  }, [data, selectedCountries, yearRange])

  // Sync loading state with parent component
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading)
    }
  }, [loading, onLoadingChange])

  const loadData = async () => {
    try {
      setLoading(true)
      const loadedData = await loadComparisonData()
      setData(loadedData)
      
      // Set up available years
      const years = getUniqueYears(loadedData.gdp || [], loadedData.expenses || [])
      setAvailableYears(years)
      if (years.length > 0) {
        setYearRange([Math.max(years[0], 2015), Math.min(years[years.length - 1], 2023)])
      }
      
      // Create unique countries list
      const uniqueCountryNames = getUniqueCountries(loadedData.gdp || [], loadedData.expenses || [])
      const countriesWithRegions = uniqueCountryNames.map(countryName => {
        const gdpRecord = (loadedData.gdp || []).find(d => d.countryName === countryName)
        const spendingRecord = (loadedData.expenses || []).find(d => d.countryName === countryName)
        const countryCode = gdpRecord?.countryCode || spendingRecord?.countryCode || ''
        const region = getCountryRegion(countryCode)
        
        return {
          countryName,
          countryCode,
          region
        }
      }).filter(country => country.countryCode)
      
      setCountries(countriesWithRegions)
      
    } catch (err) {
      console.error('Error loading comparison data:', err)
      setError('Failed to load comparison data')
    } finally {
      setLoading(false)
    }
  }

  const processComparisonData = () => {
    const filteredGdpData = filterDataByYear(data.gdp, yearRange[0], yearRange[1])
    const filteredSpendingData = filterDataByYear(data.expenses, yearRange[0], yearRange[1])

    // Group data by country
    const countryData = {}
    
    // Process GDP data
    filteredGdpData.forEach(entry => {
      if (!countryData[entry.countryCode]) {
        countryData[entry.countryCode] = {
          countryName: entry.countryName,
          countryCode: entry.countryCode,
          gdpData: [],
          spendingData: []
        }
      }
      countryData[entry.countryCode].gdpData.push(entry)
    })

    // Process spending data
    filteredSpendingData.forEach(entry => {
      if (!countryData[entry.countryCode]) {
        countryData[entry.countryCode] = {
          countryName: entry.countryName,
          countryCode: entry.countryCode,
          gdpData: [],
          spendingData: []
        }
      }
      countryData[entry.countryCode].spendingData.push(entry)
    })

    // Calculate averages and correlations
    const processedData = Object.values(countryData).map(country => {
      const avgGdpGrowth = country.gdpData.length > 0 
        ? country.gdpData.reduce((sum, d) => sum + d.gdpGrowth, 0) / country.gdpData.length
        : null

      const avgSpending = country.spendingData.length > 0
        ? country.spendingData.reduce((sum, d) => sum + d.spending, 0) / country.spendingData.length
        : null

      return {
        ...country,
        avgGdpGrowth,
        avgSpending,
        hasGdpData: country.gdpData.length > 0,
        hasSpendingData: country.spendingData.length > 0,
        hasBothData: country.gdpData.length > 0 && country.spendingData.length > 0
      }
    }).filter(country => 
      selectedCountries.length === 0 || 
      selectedCountries.some(selected => selected.countryCode === country.countryCode)
    )

    setComparisonData(processedData)
  }

  const handleCountrySelect = (country) => {
    setSelectedCountries(prev => {
      const exists = prev.some(c => c.countryCode === country.countryCode)
      if (exists) {
        return prev.filter(c => c.countryCode !== country.countryCode)
      } else {
        return [...prev, country]
      }
    })
  }

  if (loading) {
    return (
      <div className="gdp-spending-comparison loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading comparison data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gdp-spending-comparison error">
        <div className="error-message">
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={loadData}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="gdp-spending-comparison">
      <div className="comparison-header">
        <h2>GDP vs Government Spending Comparison</h2>
        <p>Compare GDP growth rates with government spending levels across countries</p>
      </div>

      <div className="comparison-controls">
        <div className="search-section">
          <SearchBar
            countries={countries.map(c => ({
              countryName: c.countryName,
              countryCode: c.countryCode
            }))}
            onCountrySelect={handleCountrySelect}
            placeholder="Search and select countries to compare..."
          />
        </div>

        <div className="year-range-section">
          <label>Year Range:</label>
          <input
            type="number"
            min={availableYears[0]}
            max={availableYears[availableYears.length - 1]}
            value={yearRange[0]}
            onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
          />
          <span>to</span>
          <input
            type="number"
            min={availableYears[0]}
            max={availableYears[availableYears.length - 1]}
            value={yearRange[1]}
            onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
          />
        </div>
      </div>

      {selectedCountries.length > 0 && (
        <div className="selected-countries">
          <h3>Selected Countries:</h3>
          <div className="country-tags">
            {selectedCountries.map(country => (
              <span key={country.countryCode} className="country-tag">
                {country.countryName}
                <button onClick={() => handleCountrySelect(country)}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="comparison-results">
        <div className="results-header">
          <h3>Comparison Results ({yearRange[0]} - {yearRange[1]})</h3>
          <p>Showing {comparisonData.length} countries</p>
        </div>

        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Country</th>
                <th>Region</th>
                <th>Avg GDP Growth (%)</th>
                <th>Avg Gov Spending</th>
                <th>Data Availability</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map(country => (
                <tr key={country.countryCode}>
                  <td>{country.countryName}</td>
                  <td>{getCountryRegion(country.countryCode)}</td>
                  <td className={country.avgGdpGrowth > 0 ? 'positive' : 'negative'}>
                    {country.avgGdpGrowth !== null ? `${country.avgGdpGrowth.toFixed(2)}%` : 'N/A'}
                  </td>
                  <td>
                    {country.avgSpending !== null ? country.avgSpending.toLocaleString() : 'N/A'}
                  </td>
                  <td>
                    <div className="data-indicators">
                      <span className={`indicator ${country.hasGdpData ? 'available' : 'missing'}`}>
                        GDP
                      </span>
                      <span className={`indicator ${country.hasSpendingData ? 'available' : 'missing'}`}>
                        Spending
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comparisonData.length === 0 && (
          <div className="no-data">
            <p>No data available for the selected criteria. Try adjusting the year range or selecting different countries.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GDPSpendingComparison