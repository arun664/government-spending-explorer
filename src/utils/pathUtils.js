/**
 * Utility functions for handling file paths in different environments
 */

/**
 * Get the correct data path for the current environment
 * @param {string} filename - The filename to get the path for
 * @returns {string} The correct path for the current environment
 */
export function getDataPath(filename) {
  // In production (GitHub Pages), use relative path
  // In development, use absolute path from public folder
  const isProduction = import.meta.env.PROD
  const base = import.meta.env.BASE_URL || '/'
  
  if (isProduction) {
    // Remove leading slash from base if it exists, then add data path
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/data/${filename}`
  } else {
    // Development - use absolute path
    return `/data/${filename}`
  }
}

/**
 * Get the correct asset path for the current environment
 * @param {string} assetPath - The asset path relative to public folder
 * @returns {string} The correct path for the current environment
 */
export function getAssetPath(assetPath) {
  const isProduction = import.meta.env.PROD
  const base = import.meta.env.BASE_URL || '/'
  
  if (isProduction) {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/${assetPath}`
  } else {
    return `/${assetPath}`
  }
}