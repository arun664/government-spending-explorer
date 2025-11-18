import { useState, useEffect, useRef } from 'react'
import { formatSpendingValue, getCategoryColor } from '../utils/formatUtils.js'
import { ColorSchemeService } from '../../../shared/services/ColorSchemeService.js'
import { filterStateManager } from '../../../shared/services/FilterStateManager.js'
import { ValueFormatUtils } from '../../../shared/utils/ValueFormatUtils.js'
import { calculateCountrySpending } from '../services/SpendingMapService.js'
import { MapColorService } from '../../../shared/services/MapColorService.js'
import { getCurrencyCode } from '../../../shared/utils/CurrencyMapping.js'
import FilterStatusIndicator from '../../../shared/components/FilterStatusIndicator.jsx'
import CountrySearch from '../../../shared/components/CountrySearch.jsx'
import '../styles/SpendingFilters.css'

const SpendingFilters = ({ 
  onFilterChange, 
  selectedCountry = null, 
  spendingData = {}, 
  matchingCountries = 0,
  onCountrySelect,
  availableCountries = []
}) => {
  const [filters, setFilters] = useState(filterStateManager.getFilters())
  const [isLoading, setIsLoading] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const searchInputRef = useRef(null)

  const regions = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']

  useEffect(() => {
    const unsubscribe = filterStateManager.subscribe((newFilters) => {
      setFilters(newFilters)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = filterStateManager.subscribeToLoading((loading) => {
      setIsLoading(loading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    setFilterCount(filterStateManager.getFilterCount())
  }, [filters])

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, [filters])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        const searchInput = document.querySelector('.country-search .search-input')
        if (searchInput) {
          searchInput.focus()
        }
      }
      if (e.key === 'Escape') {
        document.activeElement?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleYearRangeChange = (field, value) => {
    const newValue = parseInt(value)
    const currentFilters = filterStateManager.getFilters()
    
    if (field === 'start') {
      // Left slider (start year) - cannot exceed end year
      const endYear = currentFilters.yearRange[1]
      const startYear = Math.min(newValue, endYear)
      filterStateManager.updateFilters({ yearRange: [startYear, endYear] })
    } else {
      // Right slider (end year) - cannot go before start year
      const startYear = currentFilters.yearRange[0]
      const endYear = Math.max(newValue, startYear)
      filterStateManager.updateFilters({ yearRange: [startYear, endYear] })
    }
  }

  const handleRegionToggle = (region) => {
    const currentFilters = filterStateManager.getFilters()
    const newRegions = currentFilters.regions.includes(region)
      ? currentFilters.regions.filter(r => r !== region)
      : [...currentFilters.regions, region]
    
    filterStateManager.updateFilters({ regions: newRegions })
  }

  const handleRegionKeyDown = (e, region) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRegionToggle(region)
    }
  }

  const resetFilters = () => {
    filterStateManager.resetFilters()
  }

  const handleCountrySearchSelect = (country) => {
    if (onCountrySelect) {
      onCountrySelect(country)
    }
  }

  const handleClearCountrySelection = () => {
    if (onCountrySelect) {
      onCountrySelect(null)
    }
  }

  return (
    <div className="spending-filters">
      <div className="filters-header">
        <h3>Filters & Analysis</h3>
        <div className="header-actions">
          {isLoading && (
            <div className="loading-indicator" title="Processing filters..." role="status" aria-live="polite">
              <span className="spinner" aria-hidden="true"></span>
              <span className="sr-only">Loading filters...</span>
            </div>
          )}
          <button 
            className="reset-btn" 
            onClick={resetFilters}
            aria-label="Reset all filters to default values"
          >
            Reset
          </button>
        </div>
      </div>



      <FilterStatusIndicator module="spending" />

      {!selectedCountry && availableCountries.length > 0 && (
        <div className="filter-group country-search-group">
          <label className="filter-label" id="country-search-label">
            Search Country
            <span className="keyboard-hint" style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
              (Ctrl+F)
            </span>
          </label>
          <div ref={searchInputRef}>
            <CountrySearch
              countries={availableCountries}
              selectedCountry={selectedCountry}
              onCountrySelect={handleCountrySearchSelect}
              onClearSelection={handleClearCountrySelection}
              placeholder="Search by name or code..."
            />
          </div>
        </div>
      )}

      {spendingData.name && (
        <div className="current-indicator">
          <h4>Current Indicator</h4>
          <div 
            className="indicator-card"
            style={{ borderLeftColor: getCategoryColor(spendingData) }}
          >
            <div className="indicator-name">{spendingData.name}</div>
            <div className="indicator-code">
              <span className="code-label">Code:</span>
              <span className="code-value">{spendingData.indicator || spendingData.code}</span>
            </div>
            <div className="indicator-category">
              <span 
                className="category-badge"
                style={{ backgroundColor: getCategoryColor(spendingData) }}
              >
                {spendingData.category}
              </span>
            </div>
            {spendingData.globalStats && (
              <div className="global-stats">
                <div className="stat-row">
                  <span>Countries with data:</span>
                  <span>{spendingData.globalStats.totalCountries}</span>
                </div>
                <div className="stat-row">
                  <span>Data points:</span>
                  <span>{spendingData.globalStats.totalDataPoints || 'N/A'}</span>
                </div>
                <div className="stat-row note">
                  <span className="note-icon">ℹ️</span>
                  <span className="note-text">Values shown in local currency</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCountry && spendingData.countries && (
        <div className="selected-country-info" key={`${selectedCountry.name}-${filters.yearRange[0]}-${filters.yearRange[1]}`}>
          <h4>Selected Country</h4>
          <div className="country-card">
            <div className="country-name">
              {selectedCountry.name}
              <span className="currency-badge">{getCurrencyCode(selectedCountry.name)}</span>
            </div>
            
            {(() => {
              // Find country data using MapColorService (same as tooltip)
              const countryData = MapColorService.findCountryData(selectedCountry.name, spendingData)
              
              if (!countryData || !countryData.data) {
                return (
                  <div className="no-data-message">
                    <span className="info-icon">ℹ️</span>
                    <span>No data available for this indicator</span>
                  </div>
                )
              }
              
              // Use the SAME calculation function as the tooltip
              const stats = calculateCountrySpending(countryData, filters.yearRange)
              
              if (!stats) {
                return (
                  <div className="no-data-message">
                    <span className="info-icon">ℹ️</span>
                    <span>No data available for selected year range</span>
                  </div>
                )
              }
              
              const currencyCode = getCurrencyCode(selectedCountry.name)
              
              return (
                <div className="country-stats">
                  <div className="stat-item highlight">
                    <span className="stat-label">Latest Value ({stats.latestYear})</span>
                    <span className="stat-value">
                      {formatSpendingValue(stats.latest)} <span className="currency-label">{currencyCode}</span>
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average</span>
                    <span className="stat-value">
                      {formatSpendingValue(stats.average)} <span className="currency-label">{currencyCode}</span>
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Range</span>
                    <span className="stat-value">
                      {formatSpendingValue(stats.min)} - {formatSpendingValue(stats.max)} <span className="currency-label">{currencyCode}</span>
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Data Points</span>
                    <span className="stat-value">
                      {stats.dataPoints} years
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Year Range</span>
                    <span className="stat-value">
                      {stats.years[0]} - {stats.years[stats.years.length - 1]}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      <div className="filter-group year-range-group">
        <label className="filter-label" id="year-range-label">YEAR RANGE:</label>
        <div className="year-slider-wrapper">
          <div className="slider-container">
            <div className="slider-track">
              <div 
                className="slider-range" 
                style={{
                  left: `${((filters.yearRange[0] - 1980) / (2023 - 1980)) * 100}%`,
                  width: `${((filters.yearRange[1] - filters.yearRange[0]) / (2023 - 1980)) * 100}%`,
                  backgroundColor: spendingData?.category ? ColorSchemeService.getCategoryColor(spendingData.category) : '#667eea'
                }}
              />
            </div>
            <input
              type="range"
              min="1980"
              max="2023"
              value={filters.yearRange[0]}
              onChange={(e) => handleYearRangeChange('start', e.target.value)}
              className="slider-input slider-min"
              aria-label="Start year"
            />
            <input
              type="range"
              min="1980"
              max="2023"
              value={filters.yearRange[1]}
              onChange={(e) => handleYearRangeChange('end', e.target.value)}
              className="slider-input slider-max"
              aria-label="End year"
            />
          </div>
          
          {/* Year tick marks */}
          <div className="year-ticks">
            {[1980, 1990, 2000, 2010, 2020, 2023].map(year => (
              <div 
                key={year} 
                className="year-tick"
                style={{ left: `${((year - 1980) / (2023 - 1980)) * 100}%` }}
              >
                <span className="tick-mark"></span>
                <span className="tick-label">{year}</span>
              </div>
            ))}
          </div>
          
          <div className="year-display">
            {filters.yearRange[0]} - {filters.yearRange[1]}
          </div>
          
          {/* Direct year input fields */}
          <div className="year-inputs">
            <div className="year-input-field">
              <label htmlFor="start-year">From</label>
              <input
                id="start-year"
                type="number"
                min="2000"
                max="2023"
                value={filters.yearRange[0]}
                onChange={(e) => handleYearRangeChange('start', e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (val < 2000) handleYearRangeChange('start', '2000')
                  if (val > 2023) handleYearRangeChange('start', '2023')
                }}
              />
            </div>
            <span className="year-separator">to</span>
            <div className="year-input-field">
              <label htmlFor="end-year">To</label>
              <input
                id="end-year"
                type="number"
                min="2000"
                max="2023"
                value={filters.yearRange[1]}
                onChange={(e) => handleYearRangeChange('end', e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (val < 2000) handleYearRangeChange('end', '2000')
                  if (val > 2023) handleYearRangeChange('end', '2023')
                }}
              />
            </div>
          </div>
        </div>
      </div>



      {!selectedCountry && (
        <>
          <div className="filter-group">
            <label className="filter-label" id="region-filter-label">
              Regions
              {filters.regions.length > 0 && (
                <span className="filter-count"> ({filters.regions.length} selected)</span>
              )}
            </label>
            <div className="region-chips" role="group" aria-labelledby="region-filter-label">
              {regions.map(region => {
                const regionColor = ColorSchemeService.getRegionColor(region)
                const isSelected = filters.regions.includes(region)
                return (
                  <button
                    key={region}
                    className={`filter-chip region-chip ${isSelected ? 'active' : ''}`}
                    style={{
                      borderColor: regionColor,
                      backgroundColor: isSelected ? regionColor : 'transparent',
                      color: isSelected ? 'white' : regionColor
                    }}
                    onClick={() => handleRegionToggle(region)}
                    onKeyDown={(e) => handleRegionKeyDown(e, region)}
                    title={`${isSelected ? 'Deselect' : 'Select'} ${region}`}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${region} region`}
                    aria-pressed={isSelected}
                    tabIndex={0}
                  >
                    {region}
                  </button>
                )
              })}
            </div>
          </div>


        </>
      )}




    </div>
  )
}

export default SpendingFilters