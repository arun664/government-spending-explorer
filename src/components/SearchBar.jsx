import React, { useState, useEffect, useRef } from 'react'
import './SearchBar.css'

const SearchBar = ({ 
  countries = [], 
  onCountrySelect, 
  placeholder = "Search countries by name or code...",
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCountries, setFilteredCountries] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)

  // Filter countries based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCountries([])
      setIsDropdownOpen(false)
      return
    }

    const filtered = countries.filter(country => {
      const searchLower = searchTerm.toLowerCase()
      return (
        country.countryName?.toLowerCase().includes(searchLower) ||
        country.countryCode?.toLowerCase().includes(searchLower)
      )
    }).slice(0, 10) // Limit to 10 results for performance

    setFilteredCountries(filtered)
    setIsDropdownOpen(filtered.length > 0)
    setSelectedIndex(-1)
  }, [searchTerm, countries])

  // Handle input change
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
  }

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSearchTerm('') // Clear the search term
    setIsDropdownOpen(false) // Close dropdown
    setSelectedIndex(-1)
    if (onCountrySelect) {
      onCountrySelect(country)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isDropdownOpen || filteredCountries.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredCountries.length) {
          handleCountrySelect(filteredCountries[selectedIndex])
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setSelectedIndex(-1)
        searchRef.current?.blur()
        break
    }
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear search
  const handleClear = () => {
    setSearchTerm('')
    setIsDropdownOpen(false)
    setSelectedIndex(-1)
    searchRef.current?.focus()
  }

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-input-container" ref={searchRef}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search countries"
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        
        {searchTerm && (
          <button
            onClick={handleClear}
            className="search-clear-button"
            aria-label="Clear search"
            type="button"
          >
            ×
          </button>
        )}
        
        <div className="search-icon">
          🔍
        </div>
      </div>

      {isDropdownOpen && filteredCountries.length > 0 && (
        <div 
          className="search-dropdown" 
          ref={dropdownRef}
          role="listbox"
          aria-label="Search results"
        >
          {filteredCountries.map((country, index) => (
            <div
              key={`${country.countryCode}-${country.countryName}`}
              className={`search-dropdown-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleCountrySelect(country)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="country-info">
                <span className="country-name">{country.countryName}</span>
                <span className="country-code">({country.countryCode})</span>
              </div>
              {country.region && (
                <span className="country-region">{country.region}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar