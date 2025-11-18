/**
 * Utility functions for formatting values in the spending dashboard
 */

/**
 * Format spending values with M/B/T suffixes
 * NOTE: CSV data now contains actual values in domestic currency (not pre-converted to millions)
 * @param {number} value - The value in actual domestic currency
 * @returns {string} Formatted value with appropriate suffix
 */
export function formatSpendingValue(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  
  // Values are in actual domestic currency, so we need to scale appropriately
  if (absValue >= 1e12) {
    // Trillions
    return `${sign}${(absValue / 1e12).toFixed(1)}T`
  } else if (absValue >= 1e9) {
    // Billions
    return `${sign}${(absValue / 1e9).toFixed(1)}B`
  } else if (absValue >= 1e6) {
    // Millions
    return `${sign}${(absValue / 1e6).toFixed(1)}M`
  } else if (absValue >= 1e3) {
    // Thousands
    return `${sign}${(absValue / 1e3).toFixed(1)}K`
  } else if (absValue > 0) {
    // Less than 1000
    return `${sign}${absValue.toFixed(0)}`
  } else {
    // Exactly zero
    return '0'
  }
}

/**
 * Format large numbers with appropriate suffixes
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted value
 */
export function formatLargeNumber(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  
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
 * Get category color from spending data
 * @param {Object} spendingData - The spending data object
 * @returns {string} Category color
 */
export function getCategoryColor(spendingData) {
  // Use ColorSchemeService colors for consistency
  const CATEGORY_COLORS = {
    overview: '#667eea',      // Purple-blue
    personnel: '#f093fb',     // Pink-purple
    transfers: '#4facfe',     // Light blue
    debt: '#f5576c',          // Red-pink (FIXED!)
    operations: '#43e97b',    // Green (FIXED!)
    other: '#ffa726',         // Orange
    services: '#ab47bc',      // Purple
    social: '#26c6da',        // Cyan
    programs: '#66bb6a'       // Green
  }
  
  return CATEGORY_COLORS[spendingData?.category] || CATEGORY_COLORS.overview
}

/**
 * Format percentage values
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  return `${value.toFixed(decimals)}%`
}