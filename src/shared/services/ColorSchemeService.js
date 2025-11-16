/**
 * Centralized Color Management Service
 * Single source of truth for all color schemes across the application
 * 
 * This service provides consistent color mappings for:
 * - Indicator categories (overview, personnel, transfers, etc.)
 * - Geographic regions (Africa, Asia, Europe, etc.)
 * - Color scale creation for D3 visualizations
 * - Legend generation
 * 
 * Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3
 */

import * as d3 from 'd3'

/**
 * Category colors for spending indicators
 * Each category has a distinct, visually appealing color
 */
const CATEGORY_COLORS = {
  overview: '#667eea',
  personnel: '#f093fb',
  transfers: '#4facfe',
  debt: '#f5576c',
  operations: '#43e97b',
  other: '#ffa726',
  services: '#ab47bc',
  social: '#26c6da',
  programs: '#66bb6a'
}

/**
 * Region colors for geographic visualization
 * Colors chosen for clear distinction and accessibility
 */
const REGION_COLORS = {
  'Africa': '#ff7f0e',
  'Asia': '#2ca02c',
  'Europe': '#1f77b4',
  'North America': '#d62728',
  'South America': '#9467bd',
  'Oceania': '#8c564b',
  'Middle East': '#e377c2',
  'Unknown': '#7f7f7f'
}

/**
 * Human-readable labels for categories
 */
const CATEGORY_LABELS = {
  overview: 'Overview',
  personnel: 'Personnel',
  transfers: 'Transfers & Grants',
  debt: 'Debt & Interest',
  operations: 'Operations',
  other: 'Other Expenses',
  services: 'Public Services',
  social: 'Social Benefits',
  programs: 'Specific Programs'
}

/**
 * ColorSchemeService - Centralized color management
 */
export const ColorSchemeService = {
  /**
   * Get color for a specific category
   * @param {string} category - Category name (e.g., 'overview', 'personnel')
   * @returns {string} Hex color code
   */
  getCategoryColor(category) {
    if (!category) {
      return CATEGORY_COLORS.overview
    }
    const normalizedCategory = category.toLowerCase()
    return CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.overview
  },

  /**
   * Get color for a specific region
   * @param {string} region - Region name (e.g., 'Africa', 'Asia')
   * @returns {string} Hex color code
   */
  getRegionColor(region) {
    if (!region) {
      return REGION_COLORS['Unknown']
    }
    return REGION_COLORS[region] || REGION_COLORS['Unknown']
  },

  /**
   * Create D3 color scale for categories
   * @returns {d3.ScaleOrdinal} D3 ordinal color scale
   */
  createCategoryColorScale() {
    return d3.scaleOrdinal()
      .domain(Object.keys(CATEGORY_COLORS))
      .range(Object.values(CATEGORY_COLORS))
  },

  /**
   * Create D3 color scale for regions
   * @returns {d3.ScaleOrdinal} D3 ordinal color scale
   */
  createRegionColorScale() {
    return d3.scaleOrdinal()
      .domain(Object.keys(REGION_COLORS))
      .range(Object.values(REGION_COLORS))
  },

  /**
   * Get all category colors as array for legend generation
   * @returns {Array<{category: string, color: string, label: string}>}
   */
  getCategoryColorArray() {
    return Object.entries(CATEGORY_COLORS).map(([category, color]) => ({
      category,
      color,
      label: this.formatCategoryLabel(category)
    }))
  },

  /**
   * Get all region colors as array for legend generation
   * @returns {Array<{region: string, color: string, label: string}>}
   */
  getRegionColorArray() {
    return Object.entries(REGION_COLORS).map(([region, color]) => ({
      region,
      color,
      label: region
    }))
  },

  /**
   * Format category label for display
   * Converts internal category names to human-readable labels
   * @param {string} category - Category name
   * @returns {string} Formatted label
   */
  formatCategoryLabel(category) {
    if (!category) {
      return 'Unknown'
    }
    const normalizedCategory = category.toLowerCase()
    return CATEGORY_LABELS[normalizedCategory] || category
  },

  /**
   * Get all available categories
   * @returns {Array<string>} Array of category names
   */
  getAvailableCategories() {
    return Object.keys(CATEGORY_COLORS)
  },

  /**
   * Get all available regions
   * @returns {Array<string>} Array of region names
   */
  getAvailableRegions() {
    return Object.keys(REGION_COLORS)
  },

  /**
   * Create sequential color scale for a specific category
   * Used for intensity-based visualizations within a category
   * @param {string} category - Category name
   * @param {Array<number>} domain - [min, max] values for the scale
   * @returns {d3.ScaleSequential} D3 sequential color scale
   */
  createCategoryIntensityScale(category, domain = [0, 100]) {
    const baseColor = this.getCategoryColor(category)
    return d3.scaleSequential()
      .domain(domain)
      .interpolator(d3.interpolateRgb('#ffffff', baseColor))
  },

  /**
   * Get color with opacity
   * @param {string} color - Hex color code
   * @param {number} opacity - Opacity value (0-1)
   * @returns {string} RGBA color string
   */
  getColorWithOpacity(color, opacity = 1) {
    const rgb = d3.rgb(color)
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
  },

  /**
   * Check if a category exists
   * @param {string} category - Category name
   * @returns {boolean} True if category exists
   */
  isCategoryValid(category) {
    if (!category) return false
    const normalizedCategory = category.toLowerCase()
    return normalizedCategory in CATEGORY_COLORS
  },

  /**
   * Check if a region exists
   * @param {string} region - Region name
   * @returns {boolean} True if region exists
   */
  isRegionValid(region) {
    return region in REGION_COLORS
  }
}

// Export as default for convenience
export default ColorSchemeService
