/**
 * Currency Mapping Utility
 * Maps country codes to their currency codes
 */

export const COUNTRY_CURRENCY_MAP = {
  // Major economies
  'USA': 'USD',
  'CHN': 'CNY',
  'JPN': 'JPY',
  'DEU': 'EUR',
  'GBR': 'GBP',
  'IND': 'INR',
  'FRA': 'EUR',
  'ITA': 'EUR',
  'BRA': 'BRL',
  'CAN': 'CAD',
  'RUS': 'RUB',
  'KOR': 'KRW',
  'AUS': 'AUD',
  'ESP': 'EUR',
  'MEX': 'MXN',
  'IDN': 'IDR',
  'NLD': 'EUR',
  'SAU': 'SAR',
  'TUR': 'TRY',
  'CHE': 'CHF',
  
  // European Union (EUR)
  'AUT': 'EUR', 'BEL': 'EUR', 'CYP': 'EUR', 'EST': 'EUR', 'FIN': 'EUR',
  'GRC': 'EUR', 'IRL': 'EUR', 'LVA': 'EUR', 'LTU': 'EUR', 'LUX': 'EUR',
  'MLT': 'EUR', 'PRT': 'EUR', 'SVK': 'EUR', 'SVN': 'EUR',
  
  // Asia
  'AFG': 'AFN', 'BGD': 'BDT', 'BTN': 'BTN', 'KHM': 'KHR', 'HKG': 'HKD',
  'IRN': 'IRR', 'IRQ': 'IQD', 'ISR': 'ILS', 'JOR': 'JOD', 'KWT': 'KWD',
  'LAO': 'LAK', 'LBN': 'LBP', 'MYS': 'MYR', 'MDV': 'MVR', 'MNG': 'MNT',
  'MMR': 'MMK', 'NPL': 'NPR', 'OMN': 'OMR', 'PAK': 'PKR', 'PHL': 'PHP',
  'QAT': 'QAR', 'SGP': 'SGD', 'LKA': 'LKR', 'SYR': 'SYP', 'TWN': 'TWD',
  'THA': 'THB', 'ARE': 'AED', 'VNM': 'VND', 'YEM': 'YER',
  
  // Africa
  'DZA': 'DZD', 'AGO': 'AOA', 'BWA': 'BWP', 'EGY': 'EGP', 'ETH': 'ETB',
  'GHA': 'GHS', 'KEN': 'KES', 'LBY': 'LYD', 'MAR': 'MAD', 'NGA': 'NGN',
  'ZAF': 'ZAR', 'TZA': 'TZS', 'TUN': 'TND', 'UGA': 'UGX', 'ZMB': 'ZMW',
  'ZWE': 'ZWL',
  
  // Americas
  'ARG': 'ARS', 'BOL': 'BOB', 'CHL': 'CLP', 'COL': 'COP', 'CRI': 'CRC',
  'CUB': 'CUP', 'DOM': 'DOP', 'ECU': 'USD', 'SLV': 'USD', 'GTM': 'GTQ',
  'HTI': 'HTG', 'HND': 'HNL', 'JAM': 'JMD', 'NIC': 'NIO', 'PAN': 'PAB',
  'PRY': 'PYG', 'PER': 'PEN', 'URY': 'UYU', 'VEN': 'VES',
  
  // Europe (non-EUR)
  'ALB': 'ALL', 'BLR': 'BYN', 'BIH': 'BAM', 'BGR': 'BGN', 'HRV': 'HRK',
  'CZE': 'CZK', 'DNK': 'DKK', 'HUN': 'HUF', 'ISL': 'ISK', 'MKD': 'MKD',
  'MDA': 'MDL', 'NOR': 'NOK', 'POL': 'PLN', 'ROU': 'RON', 'SRB': 'RSD',
  'SWE': 'SEK', 'UKR': 'UAH',
  
  // Oceania
  'FJI': 'FJD', 'NZL': 'NZD', 'PNG': 'PGK', 'WSM': 'WST', 'TON': 'TOP',
  'VUT': 'VUV'
}

/**
 * Additional currency mappings based on common knowledge
 * Used as fallback when country code not in main map
 */
const FALLBACK_CURRENCY_MAP = {
  // Additional countries
  'GEO': 'GEL', 'ARM': 'AMD', 'AZE': 'AZN', 'KAZ': 'KZT', 'UZB': 'UZS',
  'TJK': 'TJS', 'TKM': 'TMT', 'KGZ': 'KGS', 'BRN': 'BND', 'TLS': 'USD',
  'PRK': 'KPW', 'MAC': 'MOP', 'PSE': 'ILS', 'SSD': 'SSP', 'ERI': 'ERN',
  'DJI': 'DJF', 'SOM': 'SOS', 'COM': 'KMF', 'SYC': 'SCR', 'MUS': 'MUR',
  'MDG': 'MGA', 'MWI': 'MWK', 'RWA': 'RWF', 'BDI': 'BIF', 'TCD': 'XAF',
  'CAF': 'XAF', 'CMR': 'XAF', 'COG': 'XAF', 'GAB': 'XAF', 'GNQ': 'XAF',
  'BEN': 'XOF', 'BFA': 'XOF', 'CIV': 'XOF', 'GNB': 'XOF', 'MLI': 'XOF',
  'NER': 'XOF', 'SEN': 'XOF', 'TGO': 'XOF', 'GIN': 'GNF', 'SLE': 'SLL',
  'LBR': 'LRD', 'GMB': 'GMD', 'CPV': 'CVE', 'STP': 'STN', 'MRT': 'MRU',
  'NAM': 'NAD', 'BWA': 'BWP', 'LSO': 'LSL', 'SWZ': 'SZL', 'ZWE': 'ZWL',
  'MOZ': 'MZN', 'AGO': 'AOA', 'COD': 'CDF', 'BHS': 'BSD', 'BRB': 'BBD',
  'BLZ': 'BZD', 'TTO': 'TTD', 'GUY': 'GYD', 'SUR': 'SRD', 'FJI': 'FJD',
  'PNG': 'PGK', 'SLB': 'SBD', 'VUT': 'VUV', 'WSM': 'WST', 'TON': 'TOP',
  'KIR': 'AUD', 'TUV': 'AUD', 'NRU': 'AUD', 'PLW': 'USD', 'FSM': 'USD',
  'MHL': 'USD'
}

/**
 * Get currency code for a country with fallback logic
 * @param {string} countryCode - ISO 3-letter country code
 * @returns {string} Currency code (e.g., 'USD', 'INR') or 'Local' if not found
 */
export function getCurrencyCode(countryCode) {
  // Try main map first
  if (COUNTRY_CURRENCY_MAP[countryCode]) {
    return COUNTRY_CURRENCY_MAP[countryCode]
  }
  
  // Try fallback map
  if (FALLBACK_CURRENCY_MAP[countryCode]) {
    return FALLBACK_CURRENCY_MAP[countryCode]
  }
  
  // If still not found, return 'Local' as fallback
  return 'Local'
}

/**
 * Infer currency from country name (additional fallback)
 * @param {string} countryName - Full country name
 * @returns {string|null} Currency code or null if not found
 */
export function inferCurrencyFromName(countryName) {
  const name = countryName.toLowerCase()
  
  // Common patterns
  // IMPORTANT: Check 'indonesia' BEFORE 'india' because 'indonesia' contains 'india' as substring
  if (name.includes('indonesia')) return 'IDR'
  if (name.includes('united states') || name.includes('america')) return 'USD'
  if (name.includes('india')) return 'INR'
  if (name.includes('china')) return 'CNY'
  if (name.includes('japan')) return 'JPY'
  if (name.includes('united kingdom') || name.includes('britain')) return 'GBP'
  if (name.includes('russia')) return 'RUB'
  if (name.includes('brazil')) return 'BRL'
  if (name.includes('canada')) return 'CAD'
  if (name.includes('australia')) return 'AUD'
  if (name.includes('switzerland')) return 'CHF'
  if (name.includes('sweden')) return 'SEK'
  if (name.includes('norway')) return 'NOK'
  if (name.includes('denmark')) return 'DKK'
  if (name.includes('poland')) return 'PLN'
  if (name.includes('turkey')) return 'TRY'
  if (name.includes('mexico')) return 'MXN'
  if (name.includes('south africa')) return 'ZAR'
  if (name.includes('saudi')) return 'SAR'
  if (name.includes('korea')) return 'KRW'
  if (name.includes('thailand')) return 'THB'
  if (name.includes('malaysia')) return 'MYR'
  if (name.includes('singapore')) return 'SGD'
  if (name.includes('philippines')) return 'PHP'
  if (name.includes('vietnam')) return 'VND'
  if (name.includes('egypt')) return 'EGP'
  if (name.includes('nigeria')) return 'NGN'
  if (name.includes('argentina')) return 'ARS'
  if (name.includes('chile')) return 'CLP'
  if (name.includes('colombia')) return 'COP'
  if (name.includes('peru')) return 'PEN'
  if (name.includes('pakistan')) return 'PKR'
  if (name.includes('bangladesh')) return 'BDT'
  if (name.includes('israel')) return 'ILS'
  if (name.includes('new zealand')) return 'NZD'
  
  // Euro zone countries
  const euroCountries = ['germany', 'france', 'italy', 'spain', 'netherlands', 
    'belgium', 'austria', 'portugal', 'greece', 'ireland', 'finland']
  if (euroCountries.some(country => name.includes(country))) return 'EUR'
  
  return null
}

/**
 * Get currency with all fallback methods
 * @param {string} countryCode - ISO 3-letter country code
 * @param {string} countryName - Full country name (optional)
 * @returns {string} Currency code
 */
export function getCurrencyWithFallback(countryCode, countryName = null) {
  // Try code-based lookup first
  let currency = getCurrencyCode(countryCode)
  
  // If still 'Local' and we have country name, try name-based inference
  if (currency === 'Local' && countryName) {
    const inferred = inferCurrencyFromName(countryName)
    if (inferred) {
      return inferred
    }
  }
  
  return currency
}

/**
 * Format value with currency code
 * @param {number} value - The value to format
 * @param {string} currencyCode - Currency code
 * @returns {string} Formatted string with currency
 */
export function formatValueWithCurrency(value, currencyCode) {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T ${currencyCode}`
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B ${currencyCode}`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M ${currencyCode}`
  return `${value.toFixed(0)} ${currencyCode}`
}

/**
 * Rough exchange rates for USD conversion (approximate 2022 rates)
 * Note: These are estimates for reference only
 */
const ROUGH_USD_RATES = {
  'USD': 1,
  'EUR': 1.05,
  'GBP': 1.21,
  'JPY': 0.0074,
  'CNY': 0.14,
  'INR': 0.012,
  'BRL': 0.19,
  'CAD': 0.74,
  'AUD': 0.67,
  'RUB': 0.014,
  'KRW': 0.00077,
  'MXN': 0.050,
  'IDR': 0.000065,
  'TRY': 0.053,
  'CHF': 1.08,
  'SAR': 0.27,
  'ZAR': 0.058,
  'ARS': 0.0056,
  'EGP': 0.033,
  'NGN': 0.0024,
  'THB': 0.028,
  'MYR': 0.23,
  'SGD': 0.74,
  'PHP': 0.018,
  'VND': 0.000043,
  'PLN': 0.23,
  'SEK': 0.096,
  'NOK': 0.10,
  'DKK': 0.14,
  'CLP': 0.0011,
  'COP': 0.00021,
  'PEN': 0.26,
  'PKR': 0.0035,
  'BDT': 0.0094,
  'ILS': 0.29,
  'NZD': 0.62
}

/**
 * Get rough USD equivalent (for display purposes only)
 * @param {number} value - Value in local currency
 * @param {string} currencyCode - Currency code
 * @returns {string|null} Formatted USD equivalent or null if not available
 */
export function getUSDEquivalent(value, currencyCode) {
  const rate = ROUGH_USD_RATES[currencyCode]
  if (!rate || currencyCode === 'USD') return null
  
  const usdValue = value * rate
  return formatValueWithCurrency(usdValue, 'USD')
}

/**
 * Format value with both local currency and USD equivalent
 * Uses actual USD data from expense_clean_usd.csv when available
 * @param {number} localValue - Value in local currency
 * @param {number} usdValue - Value in USD (from expense_clean_usd.csv)
 * @param {string} countryCode - ISO 3-letter country code
 * @param {string} countryName - Full country name (optional)
 * @returns {string} Formatted string with both currencies (e.g., "1.2B IDR (78M USD)")
 */
export function formatWithBothCurrencies(localValue, usdValue, countryCode, countryName = null) {
  const currency = getCurrencyWithFallback(countryCode, countryName)
  const localFormatted = formatValueWithCurrency(localValue, currency)
  
  // Display USD value if available and different currency
  if (usdValue && currency !== 'USD' && !isNaN(usdValue) && usdValue > 0) {
    const usdFormatted = formatValueWithCurrency(usdValue, 'USD')
    return `${localFormatted} (${usdFormatted})`
  }
  
  return localFormatted
}
