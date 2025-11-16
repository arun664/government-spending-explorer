/**
 * Standardized value formatting utilities
 * All values displayed in millions of USD
 */

export const ValueFormatUtils = {
  /**
   * Format value in millions with M suffix
   * @param {number} value - Value in millions
   * @returns {string} Formatted value (e.g., "1,234M" or "1.5B")
   */
  formatMillions(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }

    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    
    if (absValue >= 1000) {
      // Display in billions for very large values
      return `${sign}${(absValue / 1000).toFixed(1)}B`
    } else {
      // Display in millions with comma separators
      return `${sign}${this.formatWithCommas(Math.round(absValue))}M`
    }
  },

  /**
   * Format number with comma separators
   * @param {number|string} value - Number to format
   * @returns {string} Formatted number with commas (e.g., "1,234,567")
   */
  formatWithCommas(value) {
    if (value === null || value === undefined) {
      return '0'
    }
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  /**
   * Parse user input as millions
   * @param {string|number} input - User input value
   * @returns {number} Value in millions
   */
  parseMillions(input) {
    if (typeof input === 'number') {
      return input
    }
    
    if (!input || input === '') {
      return 0
    }
    
    // Remove all non-numeric characters except decimal point and minus sign
    const cleaned = input.toString().replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    
    return isNaN(parsed) ? 0 : parsed
  },

  /**
   * Create value range label
   * @param {number} min - Minimum value in millions
   * @param {number} max - Maximum value in millions
   * @returns {string} Formatted range label (e.g., "100M - 1.5B")
   */
  createRangeLabel(min, max) {
    return `${this.formatMillions(min)} - ${this.formatMillions(max)}`
  },

  /**
   * Validate value range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {Object} Validation result with isValid flag and error message
   */
  validateRange(min, max) {
    if (min > max) {
      return {
        isValid: false,
        error: 'Minimum cannot exceed maximum'
      }
    }
    
    if (min < 0) {
      return {
        isValid: false,
        error: 'Values must be positive'
      }
    }
    
    return {
      isValid: true,
      error: null
    }
  }
}
