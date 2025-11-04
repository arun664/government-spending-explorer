import React, { useState, useEffect, useCallback } from 'react'
import { CATEGORY_COLORS } from '../services/SpendingDataService.js'
import { formatSpendingValue, getCategoryColor } from '../utils/formatUtils.js'
import '../styles/SpendingFilters.css'

const SpendingFilters = ({ 
  onFilterChange, 
  selectedCountry = null, 
  spendingData = {}, 
  categories = [], 
  indicators = {} 
}) => {
  const [filters, setFilters] = useState({
    yearRange: [2015, 2023],
    categories: ['overview'],
    regions: [],
    valueRange: [0, 100000],
    sectors: []
  })



  const regions = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']
  const sectors = [
    'Budgetary central government',
    'Extrabudgetary central government', 
    'General government',
    'Local government',
    'State government'
  ]

  // Real-time filter update like GDP page
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, [filters, onFilterChange])

  const handleYearRangeChange = (field, value) => {
    const newValue = parseInt(value)
    
    setFilters(prev => {
      if (field === 'start') {
        // Ensure start year doesn't exceed end year
        const endYear = prev.yearRange[1]
        const startYear = Math.min(newValue, endYear)
        return {
          ...prev,
          yearRange: [startYear, endYear]
        }
      } else {
        // Ensure end year doesn't go below start year
        const startYear = prev.yearRange[0]
        const endYear = Math.max(newValue, startYear)
        return {
          ...prev,
          yearRange: [startYear, endYear]
        }
      }
    })
  }



  const handleValueRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      valueRange: field === 'min' 
        ? [parseInt(value) || 0, prev.valueRange[1]]
        : [prev.valueRange[0], parseInt(value) || 100000]
    }))
  }

  const handleSectorToggle = (sector) => {
    setFilters(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector]
    }))
  }

  const handleRegionToggle = (region) => {
    setFilters(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region]
    }))
  }



  const resetFilters = () => {
    setFilters({
      yearRange: [2015, 2023],
      categories: ['overview'],
      regions: [],
      valueRange: [0, 100000],
      sectors: []
    })
  }

  return (
    <div className="spending-filters">
      <div className="filters-header">
        <h3>Filters & Analysis</h3>
        <button className="reset-btn" onClick={resetFilters}>Reset</button>
      </div>

      {/* Current Indicator Info - Show first */}
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

      {/* Selected Country Info */}
      {selectedCountry && (
        <div className="selected-country-info">
          <h4>Selected Country</h4>
          <div className="country-card">
            <div className="country-name">{selectedCountry.name}</div>
            <div className="country-stats">
              <div className="stat-item">
                <span className="stat-label">Current Value</span>
                <span className="stat-value">
                  {formatSpendingValue(selectedCountry.spending?.average) || 'N/A'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Data Points</span>
                <span className="stat-value">
                  {selectedCountry.spending?.dataPoints || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Year Range Filter - Show second */}
      <div className="filter-group year-range-group">
        <label className="filter-label">Time Period</label>
        <div className="year-range-slider">
          <div className="range-inputs">
            <input
              type="range"
              min="2000"
              max="2023"
              value={filters.yearRange[0]}
              onChange={(e) => handleYearRangeChange('start', e.target.value)}
              className="range-slider range-start"
            />
            <input
              type="range"
              min="2000"
              max="2023"
              value={filters.yearRange[1]}
              onChange={(e) => handleYearRangeChange('end', e.target.value)}
              className="range-slider range-end"
            />
          </div>
          <div className="range-display">
            <span className="year-badge">{filters.yearRange[0]}</span>
            <span className="range-separator">to</span>
            <span className="year-badge">{filters.yearRange[1]}</span>
          </div>
        </div>
      </div>



      {/* Hide other filters when country is selected */}
      {!selectedCountry && (
        <>
          {/* Region Filter */}
          <div className="filter-group">
            <label className="filter-label">Regions</label>
            <div className="region-checkboxes">
              {regions.map(region => (
                <label key={region} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.regions.includes(region)}
                    onChange={() => handleRegionToggle(region)}
                  />
                  {region}
                </label>
              ))}
            </div>
          </div>

          {/* Value Range Filter */}
          <div className="filter-group">
            <label className="filter-label">Value Range</label>
            <div className="value-range-inputs">
              <div className="value-input">
                <label>Min</label>
                <input
                  type="number"
                  min="0"
                  value={filters.valueRange[0]}
                  onChange={(e) => handleValueRangeChange('min', e.target.value)}
                />
              </div>
              <div className="value-input">
                <label>Max</label>
                <input
                  type="number"
                  min="0"
                  value={filters.valueRange[1]}
                  onChange={(e) => handleValueRangeChange('max', e.target.value)}
                />
              </div>
            </div>
          </div>
        </>
      )}

          {/* Sector Filter - Only show when no country selected */}
          <div className="filter-group">
            <label className="filter-label">Government Sectors</label>
            <div className="sector-checkboxes">
              {sectors.map(sector => (
                <label key={sector} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.sectors.includes(sector)}
                    onChange={() => handleSectorToggle(sector)}
                  />
                  {sector}
                </label>
              ))}
            </div>
          </div>

      {/* Active Filters Summary */}
      <div className="active-filters">
        <h4>Active Filters</h4>
        <div className="filter-tags">
          {filters.regions.length > 0 && (
            <span className="filter-tag">
              Regions: {filters.regions.length}
            </span>
          )}
          {filters.sectors.length > 0 && (
            <span className="filter-tag">
              Sectors: {filters.sectors.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpendingFilters