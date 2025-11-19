/**
 * SpendingInsightsPanel.jsx - Insights panel with tabs (similar to GDP page)
 * 
 * Features:
 * - Tab 1: Global Insights (filters/stats)
 * - Tab 2: Country Insights (top/bottom 10, trends)
 * - Accordion for top/bottom performers
 * - Trend chart for selected country
 * - Currency indicators (local currency + USD equivalent)
 * 
 * Note: USD equivalent data from expense_clean_usd.csv can be loaded
 * by modifying UnifiedDataService to load both datasets simultaneously
 */

import { useState, useMemo, useEffect } from 'react'
import { CATEGORY_COLORS, INDICATOR_METADATA } from '../services/UnifiedDataService.js'
import { formatWithBothCurrencies } from '../utils/currencyMapping.js'
import '../styles/SpendingInsightsPanel.css'

function SpendingInsightsPanel({ 
  unifiedData, 
  selectedCategory, 
  selectedCountry,
  yearRange,
  onCountrySelect,
  spendingData,
  filters,
  onFilterChange,
  selectedIndicator // Add selectedIndicator prop
}) {
  const [activeTab, setActiveTab] = useState('global')
  const [showTopPerformers, setShowTopPerformers] = useState(true)
  const [showBottomPerformers, setShowBottomPerformers] = useState(false)
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' or 'asc'
  const [trendTooltip, setTrendTooltip] = useState({ show: false, x: 0, y: 0, year: '', value: '' })
  
  // Auto-switch to country tab when country is selected, back to global when deselected
  useEffect(() => {
    if (selectedCountry) {
      setActiveTab('country')
    } else {
      setActiveTab('global')
    }
  }, [selectedCountry])
  
  // Calculate top and bottom countries by category
  const { topCountries, bottomCountries } = useMemo(() => {
    if (!unifiedData) return { topCountries: [], bottomCountries: [] }
    
    const categoryIndicators = Object.entries(INDICATOR_METADATA)
      .filter(([code, meta]) => meta.category === selectedCategory)
      .map(([code]) => code)
    
    const countryTotals = {}
    
    Object.entries(unifiedData.countries).forEach(([countryName, countryData]) => {
      let totalLocal = 0
      let totalUSD = 0
      let dataPoints = 0
      let usdDataPoints = 0
      
      categoryIndicators.forEach(indicatorCode => {
        const indicatorData = countryData.indicators[indicatorCode]
        if (indicatorData) {
          Object.entries(indicatorData).forEach(([year, valueObj]) => {
            const yearNum = parseInt(year)
            if (yearNum >= yearRange[0] && yearNum <= yearRange[1]) {
              // Handle both old format (number) and new format (object with local/usd)
              const localValue = typeof valueObj === 'object' ? valueObj.local : valueObj
              const usdValue = typeof valueObj === 'object' ? valueObj.usd : null
              
              if (localValue > 0) {
                totalLocal += localValue
                dataPoints++
              }
              
              if (usdValue && usdValue > 0) {
                totalUSD += usdValue
                usdDataPoints++
              }
            }
          })
        }
      })
      
      if (dataPoints > 0) {
        countryTotals[countryName] = {
          name: countryName,
          code: countryData.code,
          totalLocal: totalLocal,
          totalUSD: totalUSD,
          averageLocal: totalLocal / dataPoints,
          averageUSD: usdDataPoints > 0 ? totalUSD / usdDataPoints : null,
          dataPoints: dataPoints
        }
      }
    })
    
    // Sort by USD equivalent for fair comparison across currencies
    // Fallback to local if USD not available
    const sorted = Object.values(countryTotals).sort((a, b) => {
      const aValue = a.averageUSD !== null ? a.averageUSD : a.averageLocal
      const bValue = b.averageUSD !== null ? b.averageUSD : b.averageLocal
      return bValue - aValue
    })
    
    return {
      topCountries: sorted.slice(0, 10),
      bottomCountries: sorted.slice(-10).reverse()
    }
  }, [unifiedData, selectedCategory, yearRange])
  
  // Calculate detailed indicator breakdown for selected country (all 48 indicators)
  const selectedCountryIndicators = useMemo(() => {
    if (!unifiedData || !selectedCountry) return null
    
    const countryData = unifiedData.countries[selectedCountry.name]
    if (!countryData) return null
    
    const indicators = []
    
    Object.entries(INDICATOR_METADATA).forEach(([code, meta]) => {
      // Skip the overview/total expense category (GE - General Expense)
      if (meta.category === 'overview' || code === 'GE') return
      
      const indicatorData = countryData.indicators[code]
      if (indicatorData) {
        let totalLocal = 0
        let totalUSD = 0
        let dataPoints = 0
        let usdDataPoints = 0
        
        Object.entries(indicatorData).forEach(([year, valueObj]) => {
          const yearNum = parseInt(year)
          if (yearNum >= yearRange[0] && yearNum <= yearRange[1]) {
            // Handle both old format (number) and new format (object with local/usd)
            const localValue = typeof valueObj === 'object' ? valueObj.local : valueObj
            const usdValue = typeof valueObj === 'object' ? valueObj.usd : null
            
            if (localValue > 0) {
              totalLocal += localValue
              dataPoints++
            }
            
            if (usdValue && usdValue > 0) {
              totalUSD += usdValue
              usdDataPoints++
            }
          }
        })
        
        if (dataPoints > 0) {
          indicators.push({
            code: code,
            name: meta.name,
            category: meta.category,
            icon: meta.icon,
            totalLocal: totalLocal,
            totalUSD: totalUSD,
            averageLocal: totalLocal / dataPoints,
            averageUSD: usdDataPoints > 0 ? totalUSD / usdDataPoints : null,
            dataPoints: dataPoints,
            color: CATEGORY_COLORS[meta.category]
          })
        }
      }
    })
    
    // Sort by USD equivalent for fair comparison (fallback to local if USD not available)
    return indicators.sort((a, b) => {
      const aValue = a.averageUSD !== null ? a.averageUSD : a.averageLocal
      const bValue = b.averageUSD !== null ? b.averageUSD : b.averageLocal
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })
  }, [unifiedData, selectedCountry, yearRange, sortOrder])
  
  const formatValue = (localValue, usdValue, countryCode, countryName = null) => {
    // Use formatWithBothCurrencies from currencyMapping.js
    return formatWithBothCurrencies(localValue, usdValue, countryCode, countryName)
  }
  
  const getCategoryName = (category) => {
    const names = {
      overview: 'Total Expense',
      personnel: 'Personnel',
      transfers: 'Transfers & Grants',
      debt: 'Debt & Interest',
      operations: 'Operations',
      other: 'Other',
      social: 'Social Benefits'
    }
    return names[category] || category
  }
  
  // Calculate trend data for selected country
  const countryTrendData = useMemo(() => {
    if (!unifiedData || !selectedCountry) return null
    
    const countryData = unifiedData.countries[selectedCountry.name]
    if (!countryData) return null
    
    const categoryIndicators = Object.entries(INDICATOR_METADATA)
      .filter(([code, meta]) => meta.category === selectedCategory)
      .map(([code]) => code)
    
    const yearlyData = {}
    
    categoryIndicators.forEach(indicatorCode => {
      const indicatorData = countryData.indicators[indicatorCode]
      if (indicatorData) {
        Object.entries(indicatorData).forEach(([year, valueObj]) => {
          const yearNum = parseInt(year)
          if (yearNum >= yearRange[0] && yearNum <= yearRange[1]) {
            // Handle both old format (number) and new format (object with local/usd)
            const localValue = typeof valueObj === 'object' ? valueObj.local : valueObj
            
            if (localValue > 0) {
              if (!yearlyData[yearNum]) yearlyData[yearNum] = 0
              yearlyData[yearNum] += localValue
            }
          }
        })
      }
    })
    
    return Object.entries(yearlyData)
      .map(([year, value]) => ({ year: parseInt(year), value }))
      .sort((a, b) => a.year - b.year)
  }, [unifiedData, selectedCountry, selectedCategory, yearRange])
  
  if (!unifiedData) return null
  
  return (
    <div className="spending-insights-panel">
      {/* Tab Navigation */}
      <div className="insights-tabs">
        <button 
          className={`tab-button ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          <span className="tab-icon">🌍</span>
          <span>Global</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'country' ? 'active' : ''}`}
          onClick={() => setActiveTab('country')}
          disabled={!selectedCountry}
        >
          <span className="tab-icon">📊</span>
          <span>Country</span>
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'global' && (
          <div className="global-insights-content">
            {/* Current Indicator Display */}
            {selectedIndicator && INDICATOR_METADATA[selectedIndicator] && (
              <div className="current-indicator-display">
                <h4>Current Indicator</h4>
                <div className="indicator-display-card">
                  <div className="indicator-display-name">
                    <span className="indicator-display-icon">{INDICATOR_METADATA[selectedIndicator].icon}</span>
                    {INDICATOR_METADATA[selectedIndicator].name}
                  </div>
                  <div className="indicator-display-category">
                    <span 
                      className="category-badge"
                      style={{ backgroundColor: CATEGORY_COLORS[INDICATOR_METADATA[selectedIndicator].category] }}
                    >
                      {INDICATOR_METADATA[selectedIndicator].category}
                    </span>
                  </div>
                  {spendingData.globalStats && (
                    <div className="indicator-display-stats">
                      <div className="indicator-stat-row">
                        <span>Countries:</span>
                        <span>{spendingData.globalStats.totalCountries}</span>
                      </div>
                      <div className="indicator-stat-row">
                        <span>Average:</span>
                        <span>
                          {spendingData.globalStats.avgSpending >= 1e12 
                            ? `$${(spendingData.globalStats.avgSpending / 1e12).toFixed(2)}T`
                            : `$${(spendingData.globalStats.avgSpending / 1e9).toFixed(2)}B`}
                        </span>
                      </div>
                      <div className="indicator-stat-row">
                        <span>Data Points:</span>
                        <span>{spendingData.globalStats.totalDataPoints}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Top Performers Accordion */}
            <div className="insights-section">
              <button 
                className={`accordion-header ${showTopPerformers ? 'active' : ''}`}
                onClick={() => setShowTopPerformers(!showTopPerformers)}
              >
                <span>🏆 Top 10 Countries</span>
                <span className="accordion-icon">{showTopPerformers ? '−' : '+'}</span>
              </button>
              
              {showTopPerformers && (
                <div className="accordion-content">
                  <div className="top-countries-list">
                    {topCountries.length > 0 ? (
                      topCountries.map((country, index) => (
                        <div 
                          key={country.code}
                          className={`country-item ${selectedCountry?.code === country.code ? 'selected' : ''}`}
                          onClick={() => onCountrySelect && onCountrySelect(country)}
                        >
                          <div className="rank">{index + 1}</div>
                          <div className="country-info">
                            <div className="country-name">{country.name}</div>
                            <div className="country-value">
                              {formatValue(country.averageLocal, country.averageUSD, country.code, country.name)}
                            </div>
                          </div>
                          <div 
                            className="country-bar"
                            style={{
                              width: `${((country.averageUSD !== null ? country.averageUSD : country.averageLocal) / (topCountries[0].averageUSD !== null ? topCountries[0].averageUSD : topCountries[0].averageLocal)) * 100}%`,
                              backgroundColor: CATEGORY_COLORS[selectedCategory]
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="no-data">No data available</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Bottom Performers Accordion */}
            <div className="insights-section">
              <button 
                className={`accordion-header ${showBottomPerformers ? 'active' : ''}`}
                onClick={() => setShowBottomPerformers(!showBottomPerformers)}
              >
                <span>📉 Bottom 10 Countries</span>
                <span className="accordion-icon">{showBottomPerformers ? '−' : '+'}</span>
              </button>
              
              {showBottomPerformers && (
                <div className="accordion-content">
                  <div className="top-countries-list">
                    {bottomCountries.length > 0 ? (
                      bottomCountries.map((country, index) => (
                        <div 
                          key={country.code}
                          className={`country-item ${selectedCountry?.code === country.code ? 'selected' : ''}`}
                          onClick={() => onCountrySelect && onCountrySelect(country)}
                        >
                          <div className="rank bottom-rank">{index + 1}</div>
                          <div className="country-info">
                            <div className="country-name">{country.name}</div>
                            <div className="country-value">
                              {formatValue(country.averageLocal, country.averageUSD, country.code, country.name)}
                            </div>
                          </div>
                          <div 
                            className="country-bar"
                            style={{
                              width: `${((country.averageUSD !== null ? country.averageUSD : country.averageLocal) / (bottomCountries[0].averageUSD !== null ? bottomCountries[0].averageUSD : bottomCountries[0].averageLocal)) * 100}%`,
                              backgroundColor: '#9ca3af'
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="no-data">No data available</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'country' && selectedCountry && (
          <div className="country-insights-content">
            <div className="insights-header">
              <h3>{selectedCountry.name}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  onCountrySelect && onCountrySelect(null)
                  setActiveTab('global')
                }}
                title="Clear selection"
              >
                ×
              </button>
            </div>
            
            {/* All 48 Indicators - Sorted by Spending */}
            {selectedCountryIndicators && (
              <div className="insights-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>All Indicators</h4>
                  <button 
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={sortOrder === 'desc' ? 'Sort ascending' : 'Sort descending'}
                  >
                    {sortOrder === 'desc' ? '↓ High to Low' : '↑ Low to High'}
                  </button>
                </div>
                <div className="indicators-list">
                  {selectedCountryIndicators.map((indicator, index) => (
                    <div key={indicator.code} className="indicator-item">
                      <div className="indicator-rank">{index + 1}</div>
                      <div 
                        className="indicator-category-dot"
                        style={{ backgroundColor: indicator.color }}
                      />
                      <div className="indicator-info">
                        <div className="indicator-name">
                          {indicator.name}
                        </div>
                        <div className="indicator-details">
                          <span className="indicator-code">{indicator.code}</span>
                          <span className="indicator-value">
                            {formatValue(indicator.averageLocal, indicator.averageUSD, selectedCountry.code, selectedCountry.name)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Trend Chart */}
            {countryTrendData && countryTrendData.length > 0 && (
              <div className="insights-section">
                <h4>Spending Trend - {getCategoryName(selectedCategory)}</h4>
                <div className="trend-chart">
                  <svg width="100%" height="150" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid meet" style={{ background: 'white', display: 'block' }}>
                    {/* Simple line chart */}
                    {countryTrendData.map((d, i) => {
                      if (i === 0) return null
                      const prev = countryTrendData[i - 1]
                      const maxValue = Math.max(...countryTrendData.map(d => d.value))
                      const x1 = ((i - 1) / (countryTrendData.length - 1)) * 280 + 20
                      const x2 = (i / (countryTrendData.length - 1)) * 280 + 20
                      const y1 = 130 - (prev.value / maxValue) * 100
                      const y2 = 130 - (d.value / maxValue) * 100
                      
                      return (
                        <g key={i}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={CATEGORY_COLORS[selectedCategory]}
                            strokeWidth="2"
                          />
                          <circle
                            cx={x2}
                            cy={y2}
                            r="5"
                            fill={CATEGORY_COLORS[selectedCategory]}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                              setTrendTooltip({
                                show: true,
                                x: rect.left + x2,
                                y: rect.top + y2 - 10,
                                year: d.year,
                                value: formatValue(d.value, null, selectedCountry.code, selectedCountry.name)
                              })
                            }}
                            onMouseLeave={() => setTrendTooltip({ show: false, x: 0, y: 0, year: '', value: '' })}
                          />
                        </g>
                      )
                    })}
                    {/* Year labels */}
                    {countryTrendData.filter((d, i) => i % Math.ceil(countryTrendData.length / 5) === 0).map((d, i) => {
                      const index = countryTrendData.indexOf(d)
                      const x = (index / (countryTrendData.length - 1)) * 280 + 20
                      return (
                        <text
                          key={d.year}
                          x={x}
                          y="145"
                          fontSize="10"
                          textAnchor="middle"
                          fill="#666"
                        >
                          {d.year}
                        </text>
                      )
                    })}
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Trend Chart Tooltip */}
      {trendTooltip.show && (
        <div
          style={{
            position: 'fixed',
            left: trendTooltip.x,
            top: trendTooltip.y,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 10000,
            whiteSpace: 'nowrap',
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div><strong>Year:</strong> {trendTooltip.year}</div>
          <div><strong>Value:</strong> {trendTooltip.value}</div>
        </div>
      )}
    </div>
  )
}

export default SpendingInsightsPanel
