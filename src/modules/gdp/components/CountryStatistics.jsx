import React, { useState, useEffect } from 'react'
import { getCountryRegion } from '../utils/regionMapping.js'
import '../styles/CountryStatistics.css'

const CountryStatistics = ({ 
  selectedCountry = null, 
  gdpData = [], 
  expenseData = [],
  className = "" 
}) => {
  const [countryStats, setCountryStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate comprehensive statistics for selected country
  useEffect(() => {
    if (!selectedCountry) {
      setCountryStats(null)
      return
    }

    setIsLoading(true)

    try {
      // Filter data for selected country
      const countryGdpData = gdpData.filter(d => 
        d.countryCode === selectedCountry.countryCode || 
        d.countryName === selectedCountry.countryName
      )

      const countryExpenseData = expenseData.filter(d => 
        d.countryCode === selectedCountry.countryCode || 
        d.countryName === selectedCountry.countryName
      )

      // Calculate GDP statistics
      const gdpStats = calculateGdpStatistics(countryGdpData)
      
      // Calculate expense statistics (placeholder for now)
      const expenseStats = calculateExpenseStatistics(countryExpenseData)

      // Get region information
      const region = getCountryRegion(selectedCountry.countryCode)

      const stats = {
        country: selectedCountry,
        region,
        gdp: gdpStats,
        expenses: expenseStats,
        dataAvailability: {
          gdp: countryGdpData.length > 0,
          expenses: countryExpenseData.length > 0
        }
      }

      setCountryStats(stats)
    } catch (error) {
      console.error('Error calculating country statistics:', error)
      setCountryStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCountry, gdpData, expenseData])

  // Calculate GDP-related statistics
  const calculateGdpStatistics = (data) => {
    if (!data || data.length === 0) {
      return {
        available: false,
        message: 'No GDP data available'
      }
    }

    const gdpGrowthValues = data
      .map(d => d.gdpGrowth)
      .filter(val => !isNaN(val) && val !== null && val !== undefined)

    if (gdpGrowthValues.length === 0) {
      return {
        available: false,
        message: 'No valid GDP growth data'
      }
    }

    // Sort data by year for trend analysis
    const sortedData = [...data].sort((a, b) => a.year - b.year)
    
    return {
      available: true,
      totalRecords: data.length,
      yearRange: {
        start: Math.min(...data.map(d => d.year)),
        end: Math.max(...data.map(d => d.year))
      },
      gdpGrowth: {
        current: sortedData[sortedData.length - 1]?.gdpGrowth || 0,
        average: gdpGrowthValues.reduce((sum, val) => sum + val, 0) / gdpGrowthValues.length,
        min: Math.min(...gdpGrowthValues),
        max: Math.max(...gdpGrowthValues),
        volatility: calculateVolatility(gdpGrowthValues)
      },
      trend: calculateTrend(sortedData.map(d => d.gdpGrowth).filter(val => !isNaN(val))),
      recentData: sortedData.slice(-5) // Last 5 years
    }
  }

  // Calculate expense-related statistics (placeholder)
  const calculateExpenseStatistics = (data) => {
    if (!data || data.length === 0) {
      return {
        available: false,
        message: 'No expense data available'
      }
    }

    // This is a placeholder - will be implemented when expense data is available
    return {
      available: true,
      totalRecords: data.length,
      message: 'Expense data processing not yet implemented'
    }
  }

  // Calculate volatility (standard deviation)
  const calculateVolatility = (values) => {
    if (values.length < 2) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(variance)
  }

  // Calculate trend direction
  const calculateTrend = (values) => {
    if (values.length < 2) return 'insufficient_data'
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const difference = secondAvg - firstAvg
    
    if (Math.abs(difference) < 0.5) return 'stable'
    return difference > 0 ? 'increasing' : 'decreasing'
  }

  // Format number for display
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A'
    return num.toFixed(decimals)
  }

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return '📈'
      case 'decreasing': return '📉'
      case 'stable': return '➡️'
      default: return '❓'
    }
  }

  if (!selectedCountry) {
    return (
      <div className={`country-statistics empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Country Selected</h3>
          <p>Search for a country to view detailed statistics and analysis.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`country-statistics loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!countryStats) {
    return (
      <div className={`country-statistics error ${className}`}>
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Statistics</h3>
          <p>Unable to load statistics for {selectedCountry.countryName}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`country-statistics ${className}`}>
      <div className="statistics-header">
        <h2>{countryStats.country.countryName}</h2>
        <div className="country-meta">
          <span className="country-code">Code: {countryStats.country.countryCode}</span>
          <span className="country-region">Region: {countryStats.region}</span>
        </div>
      </div>

      <div className="statistics-content">
        {/* GDP Statistics Section */}
        <div className="stats-section">
          <h3>📊 GDP Analysis</h3>
          {countryStats.gdp.available ? (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Current GDP Growth</div>
                <div className="stat-value">
                  {formatNumber(countryStats.gdp.gdpGrowth.current)}%
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Average GDP Growth</div>
                <div className="stat-value">
                  {formatNumber(countryStats.gdp.gdpGrowth.average)}%
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Growth Range</div>
                <div className="stat-value">
                  {formatNumber(countryStats.gdp.gdpGrowth.min)}% to {formatNumber(countryStats.gdp.gdpGrowth.max)}%
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Volatility</div>
                <div className="stat-value">
                  {formatNumber(countryStats.gdp.gdpGrowth.volatility)}%
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Trend</div>
                <div className="stat-value">
                  {getTrendIcon(countryStats.gdp.trend)} {countryStats.gdp.trend.replace('_', ' ')}
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">Data Period</div>
                <div className="stat-value">
                  {countryStats.gdp.yearRange.start} - {countryStats.gdp.yearRange.end}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data-message">
              <p>{countryStats.gdp.message}</p>
            </div>
          )}
        </div>

        {/* Recent GDP Data */}
        {countryStats.gdp.available && countryStats.gdp.recentData.length > 0 && (
          <div className="stats-section">
            <h3>📈 Recent GDP Growth</h3>
            <div className="recent-data-table">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>GDP Growth (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {countryStats.gdp.recentData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.year}</td>
                      <td className={item.gdpGrowth >= 0 ? 'positive' : 'negative'}>
                        {formatNumber(item.gdpGrowth)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expense Statistics Section */}
        <div className="stats-section">
          <h3>💰 Government Expenses</h3>
          {countryStats.expenses.available ? (
            <div className="no-data-message">
              <p>{countryStats.expenses.message}</p>
            </div>
          ) : (
            <div className="no-data-message">
              <p>{countryStats.expenses.message}</p>
            </div>
          )}
        </div>

        {/* Data Availability Summary */}
        <div className="stats-section">
          <h3>📋 Data Availability</h3>
          <div className="availability-grid">
            <div className={`availability-item ${countryStats.dataAvailability.gdp ? 'available' : 'unavailable'}`}>
              <span className="availability-icon">
                {countryStats.dataAvailability.gdp ? '✅' : '❌'}
              </span>
              <span>GDP Data</span>
            </div>
            <div className={`availability-item ${countryStats.dataAvailability.expenses ? 'available' : 'unavailable'}`}>
              <span className="availability-icon">
                {countryStats.dataAvailability.expenses ? '✅' : '❌'}
              </span>
              <span>Expense Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CountryStatistics