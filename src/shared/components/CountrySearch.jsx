import { useState, useEffect, useRef } from 'react'
import { ColorSchemeService } from '../services/ColorSchemeService.js'
import { getCountryRegion } from '../utils/RegionMapping.js'
import './CountrySearch.css'

const CountrySearch = ({ 
  countries = [], 
  selectedCountry = null, 
  onCountrySelect,
  onClearSelection,
  placeholder = "Search countries by name or code..."
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchRef = useRef(null)
  const inputRef = useRef(null)
  const suggestionRefs = useRef([])

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    
    const filtered = countries.filter(country => {
      const name = (country.name || '').toLowerCase()
      const code = (country.code || '').toLowerCase()
      return name.includes(query) || code.includes(query)
    })
    
    const sorted = filtered.sort((a, b) => {
      const aName = (a.name || '').toLowerCase()
      const bName = (b.name || '').toLowerCase()
      const aCode = (a.code || '').toLowerCase()
      const bCode = (b.code || '').toLowerCase()
      
      if (aName === query || aCode === query) return -1
      if (bName === query || bCode === query) return 1
      if (aName.startsWith(query) || aCode.startsWith(query)) return -1
      if (bName.startsWith(query) || bCode.startsWith(query)) return 1
      return aName.localeCompare(bName)
    })
    
    const limited = sorted.slice(0, 10)
    
    setSuggestions(limited)
    setShowSuggestions(true)
    setHighlightedIndex(-1)
  }, [searchQuery])

  useEffect(() => {
    if (selectedCountry) {
      setSearchQuery(selectedCountry.name || '')
      setShowSuggestions(false)
    }
  }, [selectedCountry])

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [highlightedIndex])

  const handleSelectCountry = (country) => {
    setSearchQuery(country.name || '')
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    
    if (onCountrySelect) {
      onCountrySelect(country)
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    
    if (onClearSelection) {
      onClearSelection()
    }
    
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape' && searchQuery) {
        e.preventDefault()
        handleClear()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectCountry(suggestions[highlightedIndex])
        }
        break
      
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        if (inputRef.current) {
          inputRef.current.blur()
        }
        break
      
      case 'Tab':
        setShowSuggestions(false)
        setHighlightedIndex(-1)
        break
      
      default:
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="country-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          aria-label="Search countries"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions}
        />
        
        {searchQuery && (
          <button 
            className="clear-button"
            onClick={handleClear}
            title="Clear search"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {showSuggestions && (
        <div 
          id="search-suggestions"
          className="search-suggestions"
          role="listbox"
          aria-label="Country search results"
        >
          {suggestions.length > 0 ? (
            suggestions.map((country, index) => {
              const region = getCountryRegion(country.code || country.name)
              const regionColor = ColorSchemeService.getRegionColor(region)
              const isSelected = selectedCountry?.code === country.code
              const isHighlighted = index === highlightedIndex
              
              return (
                <div
                  key={country.code || country.name}
                  ref={el => suggestionRefs.current[index] = el}
                  className={`suggestion-item ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  onClick={() => handleSelectCountry(country)}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={`${country.name}, ${country.code}${region && region !== 'Unknown' ? `, ${region}` : ''}`}
                >
                  <div className="suggestion-main">
                    <span className="country-name">{country.name}</span>
                    <span className="country-code">({country.code})</span>
                  </div>
                  {region && region !== 'Unknown' && (
                    <span 
                      className="country-region"
                      style={{ 
                        backgroundColor: regionColor,
                        color: 'white'
                      }}
                      aria-hidden="true"
                    >
                      {region}
                    </span>
                  )}
                </div>
              )
            })
          ) : (
            <div className="no-results" role="status">
              <span className="no-results-icon" aria-hidden="true">🔍</span>
              <span className="no-results-text">No results found</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CountrySearch
