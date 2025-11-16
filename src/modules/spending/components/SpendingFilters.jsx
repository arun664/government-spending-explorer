import { useState, useEffect, useRef } from 'react'
import { formatSpendingValue, getCategoryColor } from '../utils/formatUtils.js'
import { ColorSchemeService } from '../../../shared/services/ColorSchemeService.js'
import { filterStateManager } from '../../../shared/services/FilterStateManager.js'
import { ValueFormatUtils } from '../../../shared/utils/ValueFormatUtils.js'
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
      const endYear = currentFilters.yearRange[1]
      const startYear = Math.min(newValue, endYear)
      filterStateManager.updateFilters({ yearRange: [startYear, endYear] })
    } else {
      const startYear = currentFilters.yearRange[0]
      const endYear = Math.max(newValue, startYear)
      filterStateManager.updateFilters({ yearRange: [startYear, endYear] })
    }
  }

  const handleValueRangeChange = (field, value) => {
    const currentFilters = filterStateManager.getFilters()
    const parsedValue = ValueFormatUtils.parseMillions(value)
    const newRange = field === 'min' 
      ? [parsedValue, currentFilters.valueRange[1]]
      : [currentFilters.valueRange[0], parsedValue]
    
    const validation = ValueFormatUtils.validateRange(newRange[0], newRange[1])
    if (validation.isValid) {
      filterStateManager.updateFilters({ valueRange: newRange })
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
                  <span>Countries:</span>
                  <span>{spendingData.globalStats.totalCountries}</span>
                </div>
                <div className="stat-row">
                  <span>Average:</span>
                  <span>{formatSpendingValue(spendingData.globalStats.avgSpending)}</span>
                </div>
                <div className="stat-row">
                  <span>Range:</span>
                  <span>
                    {formatSpendingValue(spendingData.globalStats.minSpending)} - 
                    {formatSpendingValue(spendingData.globalStats.maxSpending)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCountry && spendingData.countries && (
        <div className="selected-country-info">
          <h4>Selected Country</h4>
          <div className="country-card">
            <div className="country-name">{selectedCountry.name}</div>
            
            {(() => {
              // Find country data in spending data
              const countryData = spendingData.countries[selectedCountry.name] || 
                                 Object.values(spendingData.countries).find(c => 
                                   c.name === selectedCountry.name || c.code === selectedCountry.code
                                 )
              
              if (!countryData || !countryData.data) {
                return (
                  <div className="no-data-message">
                    <span className="info-icon">ℹ️</span>
                    <span>No data available for this indicator</span>
                  </div>
                )
              }
              
              // Calculate stats from the data
              const values = Object.values(countryData.data).filter(v => !isNaN(v) && v !== null)
              const years = Object.keys(countryData.data).map(y => parseInt(y)).sort()
              
              if (values.length === 0) {
                return (
                  <div className="no-data-message">
                    <span className="info-icon">ℹ️</span>
                    <span>No data available for selected year range</span>
                  </div>
                )
              }
              
              const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
              const minValue = Math.min(...values)
              const maxValue = Math.max(...values)
              const latestYear = Math.max(...years)
              const latestValue = countryData.data[latestYear]
              
              return (
                <div className="country-stats">
                  <div className="stat-item highlight">
                    <span className="stat-label">Latest Value ({latestYear})</span>
                    <span className="stat-value">
                      {formatSpendingValue(latestValue)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average</span>
                    <span className="stat-value">
                      {formatSpendingValue(avgValue)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Range</span>
                    <span className="stat-value">
                      {formatSpendingValue(minValue)} - {formatSpendingValue(maxValue)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Data Points</span>
                    <span className="stat-value">
                      {values.length} years
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Year Range</span>
                    <span className="stat-value">
                      {Math.min(...years)} - {Math.max(...years)}
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
                  left: `${((filters.yearRange[0] - 2000) / (2023 - 2000)) * 100}%`,
                  width: `${((filters.yearRange[1] - filters.yearRange[0]) / (2023 - 2000)) * 100}%`,
                  backgroundColor: spendingData?.category ? ColorSchemeService.getCategoryColor(spendingData.category) : '#667eea'
                }}
              />
            </div>
            <input
              type="range"
              min="2000"
              max="2023"
              value={filters.yearRange[0]}
              onChange={(e) => handleYearRangeChange('start', e.target.value)}
              className="slider-input slider-min"
              aria-label="Start year"
            />
            <input
              type="range"
              min="2000"
              max="2023"
              value={filters.yearRange[1]}
              onChange={(e) => handleYearRangeChange('end', e.target.value)}
              className="slider-input slider-max"
              aria-label="End year"
            />
          </div>
          
          {/* Year tick marks */}
          <div className="year-ticks">
            {[2000, 2005, 2010, 2015, 2020, 2023].map(year => (
              <div 
                key={year} 
                className="year-tick"
                style={{ left: `${((year - 2000) / (2023 - 2000)) * 100}%` }}
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

          <div className="filter-group">
            <label className="filter-label" id="value-range-label">Value Range (Millions USD)</label>
            <div className="value-range-inputs" role="group" aria-labelledby="value-range-label">
              <div className="value-input">
                <label htmlFor="value-min">Min</label>
                <div className="input-with-suffix">
                  <input
                    id="value-min"
                    type="number"
                    min="0"
                    step="100"
                    value={filters.valueRange[0]}
                    onChange={(e) => handleValueRangeChange('min', e.target.value)}
                    placeholder="0"
                    aria-label="Minimum value in millions USD"
                  />
                  <span className="unit-suffix" aria-hidden="true">M</span>
                </div>
              </div>
              <div className="value-input">
                <label htmlFor="value-max">Max</label>
                <div className="input-with-suffix">
                  <input
                    id="value-max"
                    type="number"
                    min="0"
                    step="100"
                    value={filters.valueRange[1]}
                    onChange={(e) => handleValueRangeChange('max', e.target.value)}
                    placeholder="100,000"
                    aria-label="Maximum value in millions USD"
                  />
                  <span className="unit-suffix" aria-hidden="true">M</span>
                </div>
              </div>
            </div>
            <div className="range-display" aria-live="polite">
              {ValueFormatUtils.createRangeLabel(filters.valueRange[0], filters.valueRange[1])}
            </div>
          </div>
        </>
      )}




    </div>
  )
}

export default SpendingFilters