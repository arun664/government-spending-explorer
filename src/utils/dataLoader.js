import * as d3 from 'd3'
import { getDataPath } from './pathUtils.js'

/**
 * Data loading utilities for the Government Expense Dashboard
 * Handles CSV data loading and basic preprocessing
 */

/**
 * Load GDP data from CSV file
 * @returns {Promise<Array>} Array of GDP data objects
 */
export async function loadGDPData() {
  try {
    const data = await d3.csv(getDataPath('gdp_clean.csv'), d => ({
      countryName: d['Country Name'],
      countryCode: d['Country Code'],
      year: +d.Year,
      gdpGrowth: +d['GDP Growth']
    }))
    
    console.log(`Loaded ${data.length} GDP records`)
    return data
  } catch (error) {
    console.error('Error loading GDP data:', error)
    throw new Error('Failed to load GDP data')
  }
}

/**
 * Load expense data from CSV file
 * @returns {Promise<Array>} Array of expense data objects
 */
export async function loadExpenseData() {
  try {
    const data = await d3.csv(getDataPath('expense_clean.csv'), d => ({
      countryName: d['Country Name'],
      expenseCategory: d['Expense Category'],
      year: +d.Year,
      value: +d.Value
    }))
    
    console.log(`Loaded ${data.length} expense records`)
    return data
  } catch (error) {
    console.error('Error loading expense data:', error)
    throw new Error('Failed to load expense data')
  }
}

/**
 * Load all data sources
 * @returns {Promise<Object>} Object containing all loaded data
 */
export async function loadAllData() {
  try {
    const [gdpData, expenseData] = await Promise.all([
      loadGDPData(),
      loadExpenseData()
    ])
    
    return {
      gdp: gdpData,
      expenses: expenseData
    }
  } catch (error) {
    console.error('Error loading data:', error)
    throw error
  }
}

/**
 * Get unique countries from data
 * @param {Array} data - Array of data objects with countryName property
 * @returns {Array} Array of unique country names
 */
export function getUniqueCountries(data) {
  const countries = [...new Set(data.map(d => d.countryName))]
  return countries.sort()
}

/**
 * Get unique years from data
 * @param {Array} data - Array of data objects with year property
 * @returns {Array} Array of unique years
 */
export function getUniqueYears(data) {
  const years = [...new Set(data.map(d => d.year))]
  return years.sort((a, b) => a - b)
}

/**
 * Filter data by country and year range
 * @param {Array} data - Array of data objects
 * @param {string} country - Country name to filter by (optional)
 * @param {number} startYear - Start year (optional)
 * @param {number} endYear - End year (optional)
 * @returns {Array} Filtered data array
 */
export function filterData(data, country = null, startYear = null, endYear = null) {
  return data.filter(d => {
    if (country && d.countryName !== country) return false
    if (startYear && d.year < startYear) return false
    if (endYear && d.year > endYear) return false
    return true
  })
}