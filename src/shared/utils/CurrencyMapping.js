/**
 * Currency Mapping Utility
 * Maps countries to their currency codes
 */

export const COUNTRY_CURRENCY_MAP = {
  // Americas
  'United States': 'USD',
  'United States of America': 'USD',
  'USA': 'USD',
  'US': 'USD',
  'Canada': 'CAD',
  'Mexico': 'MXN',
  'Brazil': 'BRL',
  'Argentina': 'ARS',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Peru': 'PEN',
  'Venezuela': 'VES',
  'Ecuador': 'USD',
  'Bolivia': 'BOB',
  'Paraguay': 'PYG',
  'Uruguay': 'UYU',
  'Guyana': 'GYD',
  'Suriname': 'SRD',
  
  // Europe
  'United Kingdom': 'GBP',
  'Switzerland': 'CHF',
  'Norway': 'NOK',
  'Sweden': 'SEK',
  'Denmark': 'DKK',
  'Poland': 'PLN',
  'Czech Republic': 'CZK',
  'Czechia': 'CZK',
  'Hungary': 'HUF',
  'Romania': 'RON',
  'Bulgaria': 'BGN',
  'Croatia': 'EUR',
  'Serbia': 'RSD',
  'Ukraine': 'UAH',
  'Russia': 'RUB',
  'Russian Federation': 'RUB',
  'Turkey': 'TRY',
  'Turkiye': 'TRY',
  'Iceland': 'ISK',
  'Albania': 'ALL',
  'Bosnia and Herzegovina': 'BAM',
  'North Macedonia': 'MKD',
  'Moldova': 'MDL',
  'Belarus': 'BYN',
  
  // Eurozone countries
  'Germany': 'EUR',
  'France': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Austria': 'EUR',
  'Portugal': 'EUR',
  'Greece': 'EUR',
  'Finland': 'EUR',
  'Ireland': 'EUR',
  'Slovakia': 'EUR',
  'Slovak Republic': 'EUR',
  'Slovenia': 'EUR',
  'Lithuania': 'EUR',
  'Latvia': 'EUR',
  'Estonia': 'EUR',
  'Luxembourg': 'EUR',
  'Malta': 'EUR',
  'Cyprus': 'EUR',
  
  // Asia
  'China': 'CNY',
  'Japan': 'JPY',
  'India': 'INR',
  'South Korea': 'KRW',
  'Korea, Rep.': 'KRW',
  'Indonesia': 'IDR',
  'Thailand': 'THB',
  'Malaysia': 'MYR',
  'Singapore': 'SGD',
  'Philippines': 'PHP',
  'Vietnam': 'VND',
  'Viet Nam': 'VND',
  'Bangladesh': 'BDT',
  'Pakistan': 'PKR',
  'Myanmar': 'MMK',
  'Cambodia': 'KHR',
  'Laos': 'LAK',
  'Lao PDR': 'LAK',
  'Nepal': 'NPR',
  'Sri Lanka': 'LKR',
  'Afghanistan': 'AFN',
  'Mongolia': 'MNT',
  'Brunei': 'BND',
  'Brunei Darussalam': 'BND',
  'Timor-Leste': 'USD',
  
  // Middle East
  'Saudi Arabia': 'SAR',
  'United Arab Emirates': 'AED',
  'Israel': 'ILS',
  'Iran': 'IRR',
  'Iran, Islamic Rep.': 'IRR',
  'Iraq': 'IQD',
  'Kuwait': 'KWD',
  'Qatar': 'QAR',
  'Oman': 'OMR',
  'Bahrain': 'BHD',
  'Jordan': 'JOD',
  'Lebanon': 'LBP',
  'Syria': 'SYP',
  'Syrian Arab Republic': 'SYP',
  'Yemen': 'YER',
  'Yemen, Rep.': 'YER',
  
  // Africa
  'South Africa': 'ZAR',
  'Nigeria': 'NGN',
  'Egypt': 'EGP',
  'Egypt, Arab Rep.': 'EGP',
  'Kenya': 'KES',
  'Ghana': 'GHS',
  'Ethiopia': 'ETB',
  'Tanzania': 'TZS',
  'Uganda': 'UGX',
  'Morocco': 'MAD',
  'Algeria': 'DZD',
  'Tunisia': 'TND',
  'Libya': 'LYD',
  'Angola': 'AOA',
  'Mozambique': 'MZN',
  'Zimbabwe': 'ZWL',
  'Zambia': 'ZMW',
  'Botswana': 'BWP',
  'Namibia': 'NAD',
  'Mauritius': 'MUR',
  'Rwanda': 'RWF',
  'Senegal': 'XOF',
  'Ivory Coast': 'XOF',
  'Cote d\'Ivoire': 'XOF',
  'Cameroon': 'XAF',
  'Mali': 'XOF',
  'Burkina Faso': 'XOF',
  'Niger': 'XOF',
  'Chad': 'XAF',
  'Congo, Rep.': 'XAF',
  'Congo, Dem. Rep.': 'CDF',
  'Gabon': 'XAF',
  'Benin': 'XOF',
  'Togo': 'XOF',
  'Guinea': 'GNF',
  'Madagascar': 'MGA',
  'Malawi': 'MWK',
  'Sudan': 'SDG',
  'South Sudan': 'SSP',
  'Somalia': 'SOS',
  'Eritrea': 'ERN',
  'Djibouti': 'DJF',
  'Burundi': 'BIF',
  'Sierra Leone': 'SLL',
  'Liberia': 'LRD',
  'Mauritania': 'MRU',
  'Gambia': 'GMD',
  'Gambia, The': 'GMD',
  'Cape Verde': 'CVE',
  'Cabo Verde': 'CVE',
  'Sao Tome and Principe': 'STN',
  'Seychelles': 'SCR',
  'Comoros': 'KMF',
  'Eswatini': 'SZL',
  'Lesotho': 'LSL',
  
  // Oceania
  'Australia': 'AUD',
  'New Zealand': 'NZD',
  'Papua New Guinea': 'PGK',
  'Fiji': 'FJD',
  'Solomon Islands': 'SBD',
  'Vanuatu': 'VUV',
  'Samoa': 'WST',
  'Tonga': 'TOP',
  'Kiribati': 'AUD',
  'Micronesia': 'USD',
  'Micronesia, Fed. Sts.': 'USD',
  'Palau': 'USD',
  'Marshall Islands': 'USD',
  'Nauru': 'AUD',
  'Tuvalu': 'AUD',
  
  // Central America & Caribbean
  'Costa Rica': 'CRC',
  'Panama': 'PAB',
  'Guatemala': 'GTQ',
  'Honduras': 'HNL',
  'Nicaragua': 'NIO',
  'El Salvador': 'USD',
  'Belize': 'BZD',
  'Jamaica': 'JMD',
  'Trinidad and Tobago': 'TTD',
  'Bahamas': 'BSD',
  'Bahamas, The': 'BSD',
  'Barbados': 'BBD',
  'Cuba': 'CUP',
  'Haiti': 'HTG',
  'Dominican Republic': 'DOP',
  
  // Central Asia
  'Kazakhstan': 'KZT',
  'Uzbekistan': 'UZS',
  'Turkmenistan': 'TMT',
  'Kyrgyzstan': 'KGS',
  'Kyrgyz Republic': 'KGS',
  'Tajikistan': 'TJS',
  'Armenia': 'AMD',
  'Azerbaijan': 'AZN',
  'Georgia': 'GEL'
}

/**
 * Get currency code for a country
 * @param {string} countryName - Country name
 * @returns {string} Currency code (e.g., 'USD', 'EUR', 'INR')
 */
export function getCurrencyCode(countryName) {
  if (!countryName) return 'Local'
  
  // Direct lookup
  if (COUNTRY_CURRENCY_MAP[countryName]) {
    return COUNTRY_CURRENCY_MAP[countryName]
  }
  
  // Try case-insensitive lookup
  const lowerName = countryName.toLowerCase()
  const matchedKey = Object.keys(COUNTRY_CURRENCY_MAP).find(
    key => key.toLowerCase() === lowerName
  )
  
  if (matchedKey) {
    return COUNTRY_CURRENCY_MAP[matchedKey]
  }
  
  // Try partial match for common variations
  if (lowerName.includes('united states') || lowerName.includes('usa') || lowerName === 'us') {
    return 'USD'
  }
  
  // Log unmatched countries for debugging
  if (countryName !== 'Unknown Country') {
    console.warn(`Currency not found for: "${countryName}"`)
  }
  
  // Default to 'Local' if not found
  return 'Local'
}

/**
 * Format value with currency
 * @param {number} value - Numeric value
 * @param {string} countryName - Country name
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted value with currency (e.g., "123.45M USD")
 */
export function formatValueWithCurrency(value, countryName, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A'
  }
  
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  const currency = getCurrencyCode(countryName)
  
  if (absValue >= 1000) {
    // Display in billions
    return `${sign}${(absValue / 1000).toFixed(decimals)}B ${currency}`
  } else if (absValue >= 1) {
    // Display in millions
    return `${sign}${absValue.toFixed(decimals)}M ${currency}`
  } else if (absValue >= 0.01) {
    // Small values with 2 decimals
    return `${sign}${absValue.toFixed(2)}M ${currency}`
  } else if (absValue > 0) {
    // Very small values with 3 decimals
    return `${sign}${absValue.toFixed(3)}M ${currency}`
  } else {
    return `0.0M ${currency}`
  }
}
