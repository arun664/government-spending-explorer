/**
 * Utility functions for formatting values in the spending dashboard
 */

/**
 * Format spending values with M/B suffixes
 * @param {number} value - The value to format
 * @returns {string} Formatted value with appropriate suffix
 */
export function formatSpendingValue(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  
  const absValue = Math.abs(value)
  
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1)}B`
  } else if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1)}M`
  } else if (absValue >= 1) {
    return `${value.toFixed(1)}K`
  } else {
    return value.toFixed(2)
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
  
  if (absValue >= 1e12) {
    return `${(value / 1e12).toFixed(decimals)}T`
  } else if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`
  } else {
    return value.toFixed(decimals)
  }
}

/**
 * Get category color from spending data
 * @param {Object} spendingData - The spending data object
 * @returns {string} Category color
 */
export function getCategoryColor(spendingData) {
  // Import category colors dynamically to avoid circular dependencies
  const CATEGORY_COLORS = {
    overview: '#667eea',
    personnel: '#f093fb',
    transfers: '#4facfe',
    debt: '#43e97b',
    operations: '#fa709a',
    social: '#fee140',
    infrastructure: '#a8edea'
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