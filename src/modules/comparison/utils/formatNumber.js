/**
 * formatNumber - Utility for formatting large numbers
 * 
 * Converts large numbers to readable format:
 * - Millions (M) for values >= 1,000,000
 * - Billions (B) for values >= 1,000,000,000
 * - Trillions (T) for values >= 1,000,000,000,000
 * 
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A'
  }

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(decimals)}T`
  } else if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`
  } else {
    return `${sign}${absValue.toFixed(decimals)}`
  }
}

/**
 * formatNumberWithCommas - Format number with thousand separators
 * 
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string with commas
 */
export function formatNumberWithCommas(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A'
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * formatValueInMillions - Format values that are already in millions
 * NOTE: CSV data is already in millions, so values are in millions of domestic currency
 * 
 * @param {number} value - The value in millions
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted value with appropriate suffix
 */
export function formatValueInMillions(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  
  const absValue = Math.abs(value)
  
  // Values are already in millions from CSV
  // So we just need to format them appropriately
  if (absValue >= 1000000) {
    // If value is >= 1 trillion (in millions), show as T
    return `${(value / 1000000).toFixed(decimals)}T`
  } else if (absValue >= 1000) {
    // If value is >= 1 billion (in millions), show as B
    return `${(value / 1000).toFixed(decimals)}B`
  } else if (absValue >= 1) {
    // If value is >= 1 million, show as M
    return `${value.toFixed(decimals)}M`
  } else {
    // If value is < 1 million, show with decimals
    return `${value.toFixed(2)}M`
  }
}

/**
 * getNumberFormatter - Get a D3-compatible number formatter
 * 
 * @param {number} maxValue - Maximum value in the dataset
 * @returns {function} D3-compatible formatter function
 */
export function getNumberFormatter(maxValue) {
  const absMax = Math.abs(maxValue)

  if (absMax >= 1e12) {
    return (value) => `${(value / 1e12).toFixed(1)}T`
  } else if (absMax >= 1e9) {
    return (value) => `${(value / 1e9).toFixed(1)}B`
  } else if (absMax >= 1e6) {
    return (value) => `${(value / 1e6).toFixed(1)}M`
  } else if (absMax >= 1e3) {
    return (value) => `${(value / 1e3).toFixed(1)}K`
  } else {
    return (value) => value.toFixed(0)
  }
}
