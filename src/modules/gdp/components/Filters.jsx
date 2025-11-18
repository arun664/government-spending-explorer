import React, { useState, useEffect } from 'react'
import { filterStateManager } from '../../../shared/services/FilterStateManager.js'
import FilterStatusIndicator from '../../../shared/components/FilterStatusIndicator.jsx'
import '../styles/Filters.css'

const Filters = ({ 
  onFilterChange, 
  minYear = 2005, 
  maxYear = 2022, 
  selectedCountries = [], 
  onRemoveCountry, 
  showLabels, 
  onToggleLabels,
  availableCountries = [],
  onCountrySelect
}) => {
  // Initialize from FilterStateManager
  const initialFilters = filterStateManager.getFiltersForModule('gdp')
  const [tempFilters, setTempFilters] = useState({
    regions: initialFilters.regions || [],
    yearRange: initialFilters.yearRange || [minYear, maxYear],
    gdpRange: initialFilters.gdpRange || [0, 30000],
    countries: selectedCountries
  });

  // Removed Antarctica since it has no data
  const regions = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America', 'Other'];

  // Subscribe to filter changes from FilterStateManager
  useEffect(() => {
    const unsubscribe = filterStateManager.subscribe((newFilters) => {
      const gdpFilters = filterStateManager.getFiltersForModule('gdp')
      setTempFilters(prev => ({
        ...prev,
        regions: gdpFilters.regions || [],
        yearRange: gdpFilters.yearRange || [minYear, maxYear],
        gdpRange: gdpFilters.gdpRange || [0, 30000]
      }))
    }, 'gdp')
    return unsubscribe
  }, [minYear, maxYear])

  // Update tempFilters.countries when selectedCountries prop changes
  useEffect(() => {
    setTempFilters(prev => ({
      ...prev,
      countries: selectedCountries
    }));
  }, [selectedCountries]);

  const handleRegionChange = (region) => {
    const newRegions = tempFilters.regions.includes(region)
      ? tempFilters.regions.filter(r => r !== region)
      : [...tempFilters.regions, region];
    
    // When region is selected/deselected, clear country selections
    // but keep year range
    const updatedFilters = { 
      ...tempFilters, 
      regions: newRegions,
      countries: []
    };
    setTempFilters(updatedFilters);
    
    // Update FilterStateManager
    filterStateManager.updateFilters({ regions: newRegions }, false, 'gdp');
    
    // Apply filters immediately in real-time
    onFilterChange(updatedFilters);
    
    // Clear selected countries from parent
    if (selectedCountries.length > 0 && newRegions.length > 0) {
      selectedCountries.forEach(country => onRemoveCountry(country.code));
    }
  };

  const handleYearRangeChange = (index, value) => {
    const newYearRange = [...tempFilters.yearRange];
    const newValue = parseInt(value) || minYear;
    
    // Ensure left slider never goes past right slider and vice versa
    if (index === 0) {
      // Left slider (start year) - cannot exceed end year
      newYearRange[0] = Math.min(newValue, tempFilters.yearRange[1]);
    } else {
      // Right slider (end year) - cannot go before start year
      newYearRange[1] = Math.max(newValue, tempFilters.yearRange[0]);
    }
    
    const updatedFilters = { ...tempFilters, yearRange: newYearRange };
    setTempFilters(updatedFilters);
    // Update FilterStateManager
    filterStateManager.updateFilters({ yearRange: newYearRange }, false, 'gdp');
    // Apply filters immediately in real-time
    onFilterChange(updatedFilters);
  };

  const handleGdpRangeChange = (index, value) => {
    const newGdpRange = [...tempFilters.gdpRange];
    newGdpRange[index] = parseFloat(value) || 0;
    const updatedFilters = { ...tempFilters, gdpRange: newGdpRange };
    setTempFilters(updatedFilters);
    // Update FilterStateManager
    filterStateManager.updateFilters({ gdpRange: newGdpRange }, false, 'gdp');
    // Apply filters immediately in real-time
    onFilterChange(updatedFilters);
  };

  // Compare mode has been removed

  const handleReset = () => {
    const resetFilters = {
      regions: [],
      yearRange: [minYear, maxYear],
      gdpRange: [0, 30000],
      countries: []
      // Removed compareMode and compareYear
    };
    setTempFilters(resetFilters);
    // Reset FilterStateManager for GDP module
    filterStateManager.resetFilters('gdp');
    // Apply reset immediately
    onFilterChange(resetFilters);
    // Clear all selected countries
    if (selectedCountries.length > 0) {
      selectedCountries.forEach(country => onRemoveCountry(country.code));
    }
  }; 
 return (
    <div className="filters-container">
      <div className="filters-header">
        <h3>FILTERS</h3>
        <span className="realtime-badge">Real-time</span>
      </div>
      
      {/* Filter Status Indicator */}
      <FilterStatusIndicator module="gdp" />
      
      <div className="filter-section">
        <label className="filter-label">REGIONS:</label>
        <div className="filter-chips">
          {regions.map(region => (
            <button
              key={region}
              className={`filter-chip ${tempFilters.regions.includes(region) ? 'active' : ''}`}
              onClick={() => handleRegionChange(region)}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">YEAR RANGE:</label>
        <div className="year-slider-wrapper">
          <div className="slider-container">
            <div className="slider-track">
              <div 
                className="slider-range" 
                style={{
                  left: `${((tempFilters.yearRange[0] - minYear) / (maxYear - minYear)) * 100}%`,
                  width: `${((tempFilters.yearRange[1] - tempFilters.yearRange[0]) / (maxYear - minYear)) * 100}%`
                }}
              />
            </div>
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={tempFilters.yearRange[0]}
              onChange={(e) => handleYearRangeChange(0, e.target.value)}
              className="slider-input slider-min"
              aria-label="Start year"
            />
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={tempFilters.yearRange[1]}
              onChange={(e) => handleYearRangeChange(1, e.target.value)}
              className="slider-input slider-max"
              aria-label="End year"
            />
          </div>
          <div className="year-display">
            {tempFilters.yearRange[0]} - {tempFilters.yearRange[1]}
          </div>
          
          {/* Direct year input fields */}
          <div className="year-inputs">
            <div className="year-input-field">
              <label htmlFor="gdp-start-year">From</label>
              <input
                id="gdp-start-year"
                type="number"
                min={minYear}
                max={maxYear}
                value={tempFilters.yearRange[0]}
                onChange={(e) => handleYearRangeChange(0, e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (val < minYear) handleYearRangeChange(0, minYear)
                  if (val > maxYear) handleYearRangeChange(0, maxYear)
                }}
              />
            </div>
            <span className="year-separator">to</span>
            <div className="year-input-field">
              <label htmlFor="gdp-end-year">To</label>
              <input
                id="gdp-end-year"
                type="number"
                min={minYear}
                max={maxYear}
                value={tempFilters.yearRange[1]}
                onChange={(e) => handleYearRangeChange(1, e.target.value)}
                onBlur={(e) => {
                  const val = parseInt(e.target.value)
                  if (val < minYear) handleYearRangeChange(1, minYear)
                  if (val > maxYear) handleYearRangeChange(1, maxYear)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          GDP (Billions USD):
          {tempFilters.regions.length > 0 && (
            <span className="disabled-label"> (disabled when region selected)</span>
          )}
        </label>
        <div className="range-inputs">
          <input
            type="number"
            step="100"
            value={tempFilters.gdpRange[0]}
            onChange={(e) => handleGdpRangeChange(0, e.target.value)}
            className="range-input"
            placeholder="Min"
            disabled={tempFilters.regions.length > 0}
          />
          <span>to</span>
          <input
            type="number"
            step="100"
            value={tempFilters.gdpRange[1]}
            onChange={(e) => handleGdpRangeChange(1, e.target.value)}
            className="range-input"
            placeholder="Max"
            disabled={tempFilters.regions.length > 0}
          />
        </div>
      </div>

      {selectedCountries.length > 0 && (
        <div className="filter-section">
          <label className="filter-label">SELECTED COUNTRIES:</label>
          <div className="selected-countries">
            {selectedCountries.map(country => (
              <div key={country.code} className="selected-country-item">
                <span>{country.name}</span>
                <button 
                  className="remove-country-btn"
                  onClick={() => onRemoveCountry(country.code)}
                  title="Remove country"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filter-section">
        <label className="filter-label">
          <span>🏷️ LABELS:</span>
        </label>
        <div className="labels-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={showLabels || false}
              onChange={onToggleLabels}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">
              {showLabels ? 'ON' : 'OFF'}
            </span>
          </label>
        </div>
      </div>

      <div className="filter-actions">
        <button className="reset-filters-btn" onClick={handleReset}>
          Reset All Filters
        </button>
      </div>
    </div>
  )
}

export default Filters