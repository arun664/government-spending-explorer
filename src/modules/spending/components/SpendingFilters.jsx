import { useState, useEffect, useRef, useMemo } from 'react'
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
  
  // Calculate available year range based on selected country's data
  const availableYearRange = useMemo(() => {
    if (!selectedCountry || !spendingData.countries) {
      return [2005, 2022] // Default reliable data range (consistent with other modules)
    }
    
    const countryData = MapColorService.findCountryData(selectedCountry.name, spendingData)
    if (!countryData || !countryData.data) {
      return [2005, 2022]
    }
    
    const years = Object.keys(countryData.data)
      .map(y => parseInt(y))
      .filter(y => !isNaN(y) && countryData.data[y] > 0)
      .sort((a, b) => a - b)
    
    if (years.length === 0) {
      return [2005, 2022]
    }
    
    // Allow country-specific range but ensure it doesn't go below 1970 for UI purposes
    return [Math.max(years[0], 1970), years[years.length - 1]]
  }, [selectedCountry, spendingData])

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

      <div className="filters-content">
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



      <div className="filter-group year-range-group">
        <label className="filter-label" id="year-range-label">YEAR RANGE:</label>
        <div className="year-slider-wrapper">
          <div className="slider-container">
            <div className="slider-track">
              <div 
                className="slider-range" 
                style={{
                  left: `${((filters.yearRange[0] - availableYearRange[0]) / (availableYearRange[1] - availableYearRange[0])) * 100}%`,
                  width: `${((filters.yearRange[1] - filters.yearRange[0]) / (availableYearRange[1] - availableYearRange[0])) * 100}%`,
                  backgroundColor: spendingData?.category ? ColorSchemeService.getCategoryColor(spendingData.category) : '#667eea'
                }}
              />
            </div>
            <input
              type="range"
              min={availableYearRange[0]}
              max={availableYearRange[1]}
              value={filters.yearRange[0]}
              onChange={(e) => handleYearRangeChange('start', e.target.value)}
              className="slider-input slider-min"
              aria-label="Start year"
            />
            <input
              type="range"
              min={availableYearRange[0]}
              max={availableYearRange[1]}
              value={filters.yearRange[1]}
              onChange={(e) => handleYearRangeChange('end', e.target.value)}
              className="slider-input slider-max"
              aria-label="End year"
            />
          </div>
          
          {/* Year tick marks */}
          <div className="year-ticks">
            {(() => {
              const range = availableYearRange[1] - availableYearRange[0]
              const tickYears = range <= 10 
                ? [availableYearRange[0], availableYearRange[1]]
                : range <= 20
                ? [availableYearRange[0], Math.floor((availableYearRange[0] + availableYearRange[1]) / 2), availableYearRange[1]]
                : [availableYearRange[0], Math.floor(availableYearRange[0] + range * 0.25), Math.floor(availableYearRange[0] + range * 0.5), Math.floor(availableYearRange[0] + range * 0.75), availableYearRange[1]]
              
              return tickYears.map(year => (
                <div 
                  key={year} 
                  className="year-tick"
                  style={{ left: `${((year - availableYearRange[0]) / (availableYearRange[1] - availableYearRange[0])) * 100}%` }}
                >
                  <span className="tick-mark"></span>
                  <span className="tick-label">{year}</span>
                </div>
              ))
            })()}
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
                min={availableYearRange[0]}
                max={availableYearRange[1]}
                value={filters.yearRange[0]}
                onChange={(e) => handleYearRangeChange('start', e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (val < availableYearRange[0]) handleYearRangeChange('start', availableYearRange[0].toString())
                  if (val > availableYearRange[1]) handleYearRangeChange('start', availableYearRange[1].toString())
                }}
              />
            </div>
            <span className="year-separator">to</span>
            <div className="year-input-field">
              <label htmlFor="end-year">To</label>
              <input
                id="end-year"
                type="number"
                min={availableYearRange[0]}
                max={availableYearRange[1]}
                value={filters.yearRange[1]}
                onChange={(e) => handleYearRangeChange('end', e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (val < availableYearRange[0]) handleYearRangeChange('end', availableYearRange[0].toString())
                  if (val > availableYearRange[1]) handleYearRangeChange('end', availableYearRange[1].toString())
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
    </div>
  )
}

export default SpendingFilters