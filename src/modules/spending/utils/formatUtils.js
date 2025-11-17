/**
 * Utility functions for formatting values in the spending dashboard
 */

/**
 * Format spending values with M/B suffixes
 * NOTE: CSV data is already in millions (UNIT_MULT=6), so values are in millions of domestic currency
 * @param {number} value - The value in millions
 * @returns {string} Formatted value with appropriate suffix
 */
export function formatSpendingValue(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  
  // Values are already in millions from CSV (UNIT_MULT=6)
  // So we just need to format them appropriately
  if (absValue >= 1000000) {
    // If value is >= 1 trillion (in millions), show as T
    return `${sign}${(absValue / 1000000).toFixed(1)}T`
  } else if (absValue >= 1000) {
    // If value is >= 1 billion (in millions), show as B
    return `${sign}${(absValue / 1000).toFixed(1)}B`
  } else if (absValue >= 1) {
    // If value is >= 1 million, show as M
    return `${sign}${absValue.toFixed(1)}M`
  } else if (absValue >= 0.01) {
    // If value is >= 10,000 (0.01M), show with 2 decimals
    return `${sign}${absValue.toFixed(2)}M`
  } else if (absValue > 0) {
    // For very small values, show with more precision
    return `${sign}${absValue.toFixed(3)}M`
  } else {
    // Exactly zero
    return '0.0M'
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