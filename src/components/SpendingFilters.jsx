import React, { useState, useEffect } from 'react'
import './SpendingFilters.css'

const SpendingFilters = ({ onFilterChange, minYear = 2005, maxYear = 2023, selectedCountries = [], onRemoveCountry, showLabels, onToggleLabels }) => {
  const [tempFilters, setTempFilters] = useState({
    regions: [],
    yearRange: [minYear, maxYear],
    spendingRange: [0, 100000],
    countries: selectedCountries
  });

  // Removed Antarctica since it has no data
  const regions = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America', 'Other'];

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
    
    // Apply filters immediately in real-time
    onFilterChange(updatedFilters);
    
    // Clear selected countries from parent
    if (selectedCountries.length > 0 && newRegions.length > 0) {
      selectedCountries.forEach(country => onRemoveCountry(country.code));
    }
  };

  const handleYearRangeChange = (index, value) => {
    const newYearRange = [...tempFilters.yearRange];
    const intValue = parseInt(value) || minYear;
    if (index === 0) {
      // Prevent min from exceeding max
      if (intValue > newYearRange[1]) return;
      newYearRange[0] = intValue;
    } else {
      // Prevent max from going below min
      if (intValue < newYearRange[0]) return;
      newYearRange[1] = intValue;
    }
    const updatedFilters = { ...tempFilters, yearRange: newYearRange };
    setTempFilters(updatedFilters);
    // Apply filters immediately in real-time
    onFilterChange(updatedFilters);
  };

  const handleSpendingRangeChange = (index, value) => {
    const newSpendingRange = [...tempFilters.spendingRange];
    newSpendingRange[index] = parseFloat(value) || 0;
    const updatedFilters = { ...tempFilters, spendingRange: newSpendingRange };
    setTempFilters(updatedFilters);
    // Apply filters immediately in real-time
    onFilterChange(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      regions: [],
      yearRange: [minYear, maxYear],
      spendingRange: [0, 100000],
      countries: []
    };
    setTempFilters(resetFilters);
    // Apply reset immediately
    onFilterChange(resetFilters);
    // Clear all selected countries
    if (selectedCountries.length > 0) {
      selectedCountries.forEach(country => onRemoveCountry(country.code));
    }
  };

  return (
    <div className="spending-filters-container">
      <div className="spending-filters-header">
        <h3>FILTERS</h3>
        <span className="realtime-badge">REAL-TIME</span>
      </div>

      <div className="spending-filter-section">
        <label className="spending-filter-label">REGIONS:</label>
        <div className="spending-filter-chips">
          {regions.map(region => (
            <button
              key={region}
              className={`spending-filter-chip ${tempFilters.regions.includes(region) ? 'active' : ''}`}
              onClick={() => handleRegionChange(region)}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="spending-filter-section">
        <label className="spending-filter-label">YEAR RANGE:</label>
        <div className="spending-year-slider-wrapper">
          <div className="spending-slider-container">
            <div className="spending-slider-track">
              <div 
                className="spending-slider-range" 
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
              className="spending-slider-input spending-slider-min"
            />
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={tempFilters.yearRange[1]}
              onChange={(e) => handleYearRangeChange(1, e.target.value)}
              className="spending-slider-input spending-slider-max"
            />
          </div>
          <div className="spending-year-display">
            {tempFilters.yearRange[0]} - {tempFilters.yearRange[1]}
          </div>
        </div>
      </div>

      <div className="spending-filter-section">
        <label className="spending-filter-label">
          SPENDING RANGE (Millions):
          {tempFilters.regions.length > 0 && (
            <span className="spending-disabled-label"> (disabled when region selected)</span>
          )}
        </label>
        <div className="spending-range-inputs">
          <input
            type="number"
            step="1000"
            value={tempFilters.spendingRange[0]}
            onChange={(e) => handleSpendingRangeChange(0, e.target.value)}
            className="spending-range-input"
            placeholder="Min"
            disabled={tempFilters.regions.length > 0}
          />
          <span>to</span>
          <input
            type="number"
            step="1000"
            value={tempFilters.spendingRange[1]}
            onChange={(e) => handleSpendingRangeChange(1, e.target.value)}
            className="spending-range-input"
            placeholder="Max"
            disabled={tempFilters.regions.length > 0}
          />
        </div>
      </div>

      {selectedCountries.length > 0 && (
        <div className="spending-filter-section">
          <label className="spending-filter-label">SELECTED COUNTRIES:</label>
          <div className="spending-selected-countries">
            {selectedCountries.map(country => (
              <div key={country.code} className="spending-selected-country-item">
                <span>{country.name}</span>
                <button 
                  className="spending-remove-country-btn"
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

      {showLabels !== undefined && (
        <div className="spending-filter-section">
          <label className="spending-filter-label">DISPLAY:</label>
          <div className="spending-toggle-switch" onClick={onToggleLabels}>
            <input 
              type="checkbox" 
              checked={showLabels} 
              onChange={onToggleLabels}
            />
            <span className="spending-toggle-slider"></span>
            <span className="spending-toggle-label">Country Labels</span>
          </div>
        </div>
      )}

      <button 
        className="spending-reset-filters-btn"
        onClick={handleReset}
      >
        Reset All Filters
      </button>
    </div>
  )
}

export default SpendingFilters