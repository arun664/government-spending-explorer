import React, { useState, useEffect, useCallback } from 'react';
import '../styles/ComparisonFilters.css';

const ComparisonFilters = ({ 
  countries = [], 
  years = [], 
  categories = [], 
  onFiltersChange,
  initialFilters = {}
}) => {
  const [selectedCountries, setSelectedCountries] = useState(initialFilters.countries || []);
  const [selectedYears, setSelectedYears] = useState(initialFilters.years || []);
  const [selectedCategories, setSelectedCategories] = useState(initialFilters.categories || []);
  const [countrySearch, setCountrySearch] = useState('');
  const [yearRange, setYearRange] = useState({
    min: initialFilters.yearRange?.min || Math.min(...years),
    max: initialFilters.yearRange?.max || Math.max(...years)
  });

  // Debounced filter change handler
  const debouncedFilterChange = useCallback(
    debounce((filters) => {
      onFiltersChange?.(filters);
    }, 300),
    [onFiltersChange]
  );

  // Update filters when selections change
  useEffect(() => {
    const filters = {
      countries: selectedCountries,
      years: selectedYears,
      categories: selectedCategories,
      yearRange,
      countrySearch: countrySearch.trim()
    };
    debouncedFilterChange(filters);
  }, [selectedCountries, selectedYears, selectedCategories, yearRange, countrySearch, debouncedFilterChange]);

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Handle country selection
  const handleCountryToggle = (country) => {
    setSelectedCountries(prev => {
      const isSelected = prev.some(c => c.code === country.code);
      if (isSelected) {
        return prev.filter(c => c.code !== country.code);
      } else {
        return [...prev, country];
      }
    });
  };

  // Handle select all countries
  const handleSelectAllCountries = () => {
    if (selectedCountries.length === filteredCountries.length) {
      setSelectedCountries([]);
    } else {
      setSelectedCountries(filteredCountries);
    }
  };

  // Handle year range change
  const handleYearRangeChange = (type, value) => {
    setYearRange(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
    
    // Update selected years based on range
    const newYears = years.filter(year => 
      year >= (type === 'min' ? parseInt(value) : prev.min) &&
      year <= (type === 'max' ? parseInt(value) : prev.max)
    );
    setSelectedYears(newYears);
  };

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Reset all filters
  const handleReset = () => {
    setSelectedCountries([]);
    setSelectedYears([]);
    setSelectedCategories([]);
    setCountrySearch('');
    setYearRange({
      min: Math.min(...years),
      max: Math.max(...years)
    });
  };

  return (
    <div className="comparison-filters">
      <div className="filters-header">
        <h3>Filters & Controls</h3>
        <button className="reset-button" onClick={handleReset}>
          Reset All
        </button>
      </div>

      {/* Country Selection */}
      <div className="filter-section">
        <div className="filter-header">
          <h4>Countries ({selectedCountries.length} selected)</h4>
          <button 
            className="select-all-button"
            onClick={handleSelectAllCountries}
          >
            {selectedCountries.length === filteredCountries.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <div className="country-search">
          <input
            type="text"
            placeholder="Search countries..."
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="country-list">
          {filteredCountries.map(country => (
            <label key={country.code} className="country-item">
              <input
                type="checkbox"
                checked={selectedCountries.some(c => c.code === country.code)}
                onChange={() => handleCountryToggle(country)}
              />
              <span className="country-name">{country.name}</span>
              <span className="country-code">({country.code})</span>
              {country.region && (
                <span className="country-region">{country.region}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Year Range Slider */}
      <div className="filter-section">
        <h4>Year Range ({yearRange.min} - {yearRange.max})</h4>
        <div className="year-slider-container">
          <div className="year-slider">
            <label>
              From:
              <input
                type="range"
                min={Math.min(...years)}
                max={Math.max(...years)}
                value={yearRange.min}
                onChange={(e) => handleYearRangeChange('min', e.target.value)}
                className="slider"
              />
              <span className="year-value">{yearRange.min}</span>
            </label>
          </div>
          <div className="year-slider">
            <label>
              To:
              <input
                type="range"
                min={Math.min(...years)}
                max={Math.max(...years)}
                value={yearRange.max}
                onChange={(e) => handleYearRangeChange('max', e.target.value)}
                className="slider"
              />
              <span className="year-value">{yearRange.max}</span>
            </label>
          </div>
        </div>
        <div className="selected-years">
          Selected Years: {selectedYears.length > 0 ? selectedYears.join(', ') : 'None'}
        </div>
      </div>

      {/* Category Toggles */}
      <div className="filter-section">
        <h4>Spending Categories ({selectedCategories.length} selected)</h4>
        <div className="category-grid">
          {categories.map(category => (
            <label key={category} className="category-item">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
              />
              <span className="category-name">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter Summary */}
      <div className="filter-summary">
        <h4>Active Filters</h4>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Countries:</span>
            <span className="stat-value">{selectedCountries.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Years:</span>
            <span className="stat-value">{selectedYears.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Categories:</span>
            <span className="stat-value">{selectedCategories.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default ComparisonFilters;