/**
 * Utility functions for handling file paths in different environments
 */

/**
 * Get the correct data path for the current environment
 * @param {string} filename - The filename to get the path for
 * @returns {string} The correct path for the current environment
 */
export function getDataPath(filename) {
  const isProduction = import.meta.env.PROD
  const base = import.meta.env.BASE_URL || '/'
  
  // Debug logging (remove in production)
  console.log('getDataPath debug:', { 
    filename, 
    isProduction, 
    base, 
    mode: import.meta.env.MODE,
    hostname: window.location.hostname
  })
  
  if (isProduction) {
    // For GitHub Pages, ensure we use the correct base path
    let cleanBase = base
    
    // Handle case where base might be '/' but we're on GitHub Pages
    if (base === '/' && window.location.hostname.includes('github.io')) {
      cleanBase = '/government-spending-explorer'
    } else if (base.endsWith('/')) {
      cleanBase = base.slice(0, -1)
    }
    
    const fullPath = `${cleanBase}/data/${filename}`
    console.log('Production path:', fullPath)
    return fullPath
  } else {
    // Development - use absolute path
    const devPath = `/data/${filename}`
    console.log('Development path:', devPath)
    return devPath
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