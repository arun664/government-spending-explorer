/**
 * NumberFormatter - Independent number formatting utility for comparison module
 * 
 * Provides M/B notation formatting (1.2B, 450M, etc.) and other number formatting
 * utilities specific to the comparison module.
 * 
 * Requirements addressed:
 * - M/B notation formatting (1.2B, 450M, etc.)
 * - Independent utility for comparison module
 * - Consistent number formatting across comparison visualizations
 */

export class NumberFormatter {
  constructor() {
    this.defaultOptions = {
      precision: 1,
      useShortNotation: true,
      currency: 'USD',
      locale: 'en-US'
    }
  }

  /**
   * Format number with M/B notation
   * @param {number} value - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number string
   */
  formatWithMBNotation(value, options = {}) {
    const opts = { ...this.defaultOptions, ...options }
    
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }

    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''

    // Handle zero
    if (absValue === 0) {
      return '0'
    }

    // Handle very small numbers
    if (absValue < 1) {
      return `${sign}${absValue.toFixed(opts.precision)}`
    }

    // Trillions
    if (absValue >= 1e12) {
      const formatted = (absValue / 1e12).toFixed(opts.precision)
      return `${sign}${this._removeTrailingZeros(formatted)}T`
    }

    // Billions
    if (absValue >= 1e9) {
      const formatted = (absValue / 1e9).toFixed(opts.precision)
      return `${sign}${this._removeTrailingZeros(formatted)}B`
    }

    // Millions
    if (absValue >= 1e6) {
      const formatted = (absValue / 1e6).toFixed(opts.precision)
      return `${sign}${this._removeTrailingZeros(formatted)}M`
    }

    // Thousands
    if (absValue >= 1e3) {
      const formatted = (absValue / 1e3).toFixed(opts.precision)
      return `${sign}${this._removeTrailingZeros(formatted)}K`
    }

    // Less than 1000
    return `${sign}${absValue.toFixed(opts.precision)}`
  }

  /**
   * Format currency with M/B notation
   * @param {number} value - Currency value to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted currency string
   */
  formatCurrency(value, options = {}) {
    const opts = { ...this.defaultOptions, ...options }
    const formattedNumber = this.formatWithMBNotation(value, opts)
    
    if (formattedNumber === 'N/A') {
      return 'N/A'
    }

    const currencySymbol = this._getCurrencySymbol(opts.currency)
    return `${currencySymbol}${formattedNumber}`
  }

  /**
   * Format percentage
   * @param {number} value - Percentage value (0-100 or 0-1 based on options)
   * @param {Object} options - Formatting options
   * @returns {string} Formatted percentage string
   */
  formatPercentage(value, options = {}) {
    const opts = { 
      ...this.defaultOptions, 
      precision: 1,
      isDecimal: false, // true if value is 0-1, false if 0-100
      ...options 
    }
    
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }

    const percentValue = opts.isDecimal ? value * 100 : value
    const formatted = percentValue.toFixed(opts.precision)
    return `${this._removeTrailingZeros(formatted)}%`
  }

  /**
   * Format GDP growth rate
   * @param {number} value - GDP growth rate
   * @param {Object} options - Formatting options
   * @returns {string} Formatted GDP growth string
   */
  formatGDPGrowth(value, options = {}) {
    const opts = { ...this.defaultOptions, precision: 2, ...options }
    
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }

    const formatted = value.toFixed(opts.precision)
    const sign = value > 0 ? '+' : ''
    return `${sign}${this._removeTrailingZeros(formatted)}%`
  }

  /**
   * Format spending as percentage of GDP
   * @param {number} spendingValue - Spending value
   * @param {number} gdpValue - GDP value
   * @param {Object} options - Formatting options
   * @returns {string} Formatted spending percentage string
   */
  formatSpendingAsGDPPercent(spendingValue, gdpValue, options = {}) {
    if (!spendingValue || !gdpValue || isNaN(spendingValue) || isNaN(gdpValue) || gdpValue === 0) {
      return 'N/A'
    }

    const percentage = (spendingValue / gdpValue) * 100
    return this.formatPercentage(percentage, options)
  }

  /**
   * Format large numbers with commas
   * @param {number} value - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number with commas
   */
  formatWithCommas(value, options = {}) {
    const opts = { ...this.defaultOptions, ...options }
    
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }

    return new Intl.NumberFormat(opts.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: opts.precision
    }).format(value)
  }

  /**
   * Format correlation coefficient
   * @param {number} value - Correlation value (-1 to 1)
   * @param {Object} options - Formatting options
   * @returns {string} Formatted correlation string
   */
  formatCorrelation(value, options = {}) {
    const opts = { ...this.defaultOptions, precision: 3, ...options }
    
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }

    // Clamp value between -1 and 1
    const clampedValue = Math.max(-1, Math.min(1, value))
    return clampedValue.toFixed(opts.precision)
  }

  /**
   * Format trend value with arrow indicators
   * @param {number} value - Trend value
   * @param {Object} options - Formatting options
   * @returns {string} Formatted trend string with arrow
   */
  formatTrend(value, options = {}) {
    const opts = { 
      ...this.defaultOptions, 
      precision: 2,
      showArrow: true,
      threshold: 0.1,
      ...options 
    }
    
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }

    const formatted = this.formatPercentage(value, opts)
    
    if (!opts.showArrow) {
      return formatted
    }

    if (Math.abs(value) < opts.threshold) {
      return `${formatted} →`
    }

    const arrow = value > 0 ? '↗' : '↘'
    return `${formatted} ${arrow}`
  }

  /**
   * Format data range (min - max)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {Object} options - Formatting options
   * @returns {string} Formatted range string
   */
  formatRange(min, max, options = {}) {
    const opts = { ...this.defaultOptions, ...options }
    
    if (min === null || min === undefined || isNaN(min) ||
        max === null || max === undefined || isNaN(max)) {
      return 'N/A'
    }

    const formattedMin = this.formatWithMBNotation(min, opts)
    const formattedMax = this.formatWithMBNotation(max, opts)
    
    return `${formattedMin} - ${formattedMax}`
  }

  /**
   * Format time duration in human readable format
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration string
   */
  formatDuration(milliseconds) {
    if (!milliseconds || isNaN(milliseconds)) {
      return 'N/A'
    }

    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`
    }

    const seconds = milliseconds / 1000
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`
    }

    const minutes = seconds / 60
    if (minutes < 60) {
      return `${minutes.toFixed(1)}m`
    }

    const hours = minutes / 60
    return `${hours.toFixed(1)}h`
  }

  /**
   * Parse formatted number back to numeric value
   * @param {string} formattedValue - Formatted number string
   * @returns {number} Numeric value
   */
  parseFormattedNumber(formattedValue) {
    if (!formattedValue || formattedValue === 'N/A') {
      return null
    }

    // Remove currency symbols and spaces
    let cleanValue = formattedValue.replace(/[$€£¥,\s]/g, '')
    
    // Handle percentage
    if (cleanValue.includes('%')) {
      return parseFloat(cleanValue.replace('%', ''))
    }

    // Handle M/B notation
    const lastChar = cleanValue.slice(-1).toUpperCase()
    const numericPart = parseFloat(cleanValue.slice(0, -1))

    if (isNaN(numericPart)) {
      return parseFloat(cleanValue)
    }

    switch (lastChar) {
      case 'T':
        return numericPart * 1e12
      case 'B':
        return numericPart * 1e9
      case 'M':
        return numericPart * 1e6
      case 'K':
        return numericPart * 1e3
      default:
        return parseFloat(cleanValue)
    }
  }

  /**
   * Remove trailing zeros from decimal numbers
   * @param {string} numberString - Number as string
   * @returns {string} Number string without trailing zeros
   */
  _removeTrailingZeros(numberString) {
    return numberString.replace(/\.?0+$/, '')
  }

  /**
   * Get currency symbol for currency code
   * @param {string} currencyCode - Currency code (USD, EUR, etc.)
   * @returns {string} Currency symbol
   */
  _getCurrencySymbol(currencyCode) {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    }
    
    return symbols[currencyCode] || currencyCode
  }

  /**
   * Get formatting options for specific data types
   * @param {string} dataType - Type of data (gdp, spending, correlation, etc.)
   * @returns {Object} Recommended formatting options
   */
  getRecommendedOptions(dataType) {
    const recommendations = {
      gdp: { precision: 2, useShortNotation: true },
      spending: { precision: 1, useShortNotation: true },
      percentage: { precision: 1, isDecimal: false },
      correlation: { precision: 3, useShortNotation: false },
      currency: { precision: 1, useShortNotation: true, currency: 'USD' },
      trend: { precision: 2, showArrow: true, threshold: 0.1 }
    }
    
    return recommendations[dataType] || this.defaultOptions
  }
}

// Export singleton instance
export const numberFormatter = new NumberFormatter()

// Export utility functions for direct use
export const formatMB = (value, options) => numberFormatter.formatWithMBNotation(value, options)
export const formatCurrency = (value, options) => numberFormatter.formatCurrency(value, options)
export const formatPercentage = (value, options) => numberFormatter.formatPercentage(value, options)
export const formatGDPGrowth = (value, options) => numberFormatter.formatGDPGrowth(value, options)
export const formatTrend = (value, options) => numberFormatter.formatTrend(value, options)