/**
 * formatComparisonValue.js - Value formatting for comparison charts
 * 
 * Formats values in millions USD to T/B/M suffix format
 */

/**
 * Format value in millions USD to T/B/M suffix
 * @param {number} valueInMillions - Value in millions USD
 * @returns {string} Formatted string (e.g., "$26.00T", "$543.20B", "$850.00M")
 */
export function formatComparisonValue(valueInMillions) {
  if (valueInMillions === null || valueInMillions === undefined || isNaN(valueInMillions)) {
    return 'N/A'
  }
  
  const absValue = Math.abs(valueInMillions)
  
  // Convert millions to trillions (divide by 1,000,000)
  if (absValue >= 1_000_000) {
    return `$${(valueInMillions / 1_000_000).toFixed(2)}T`
  }
  
  // Convert millions to billions (divide by 1,000)
  if (absValue >= 1_000) {
    return `$${(valueInMillions / 1_000).toFixed(2)}B`
  }
  
  // Already in millions
  return `$${valueInMillions.toFixed(2)}M`
}

/**
 * Format value in millions USD to T/B/M suffix (short version with 1 decimal)
 * @param {number} valueInMillions - Value in millions USD
 * @returns {string} Formatted string (e.g., "$26.0T", "$543.2B", "$850.0M")
 */
export function formatComparisonValueShort(valueInMillions) {
  if (valueInMillions === null || valueInMillions === undefined || isNaN(valueInMillions)) {
    return 'N/A'
  }
  
  const absValue = Math.abs(valueInMillions)
  
  if (absValue >= 1_000_000) {
    return `$${(valueInMillions / 1_000_000).toFixed(1)}T`
  }
  
  if (absValue >= 1_000) {
    return `$${(valueInMillions / 1_000).toFixed(1)}B`
  }
  
  return `$${valueInMillions.toFixed(1)}M`
}

/**
 * Format percentage value
 * @param {number} percentage - Percentage value
 * @returns {string} Formatted string (e.g., "19.75%")
 */
export function formatPercentage(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return 'N/A'
  }
  
  return `${percentage.toFixed(2)}%`
}

export default {
  formatComparisonValue,
  formatComparisonValueShort,
  formatPercentage
}
