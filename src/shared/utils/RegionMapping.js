/**
 * Region Mapping Utilities
 * Maps countries to their geographic regions for filtering and visualization
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

/**
 * Country to region mapping
 * Based on UN geographic regions with some adjustments for clarity
 */
const COUNTRY_REGION_MAP = {
  // Africa
  'Algeria': 'Africa',
  'Angola': 'Africa',
  'Benin': 'Africa',
  'Botswana': 'Africa',
  'Burkina Faso': 'Africa',
  'Burundi': 'Africa',
  'Cabo Verde': 'Africa',
  'Cameroon': 'Africa',
  'Central African Republic': 'Africa',
  'Chad': 'Africa',
  'Comoros': 'Africa',
  'Congo, Dem. Rep.': 'Africa',
  'Congo, Rep.': 'Africa',
  'Cote d\'Ivoire': 'Africa',
  'Djibouti': 'Africa',
  'Egypt': 'Africa',
  'Egypt, Arab Rep.': 'Africa',
  'Equatorial Guinea': 'Africa',
  'Eritrea': 'Africa',
  'Eswatini': 'Africa',
  'Ethiopia': 'Africa',
  'Gabon': 'Africa',
  'Gambia, The': 'Africa',
  'Ghana': 'Africa',
  'Guinea': 'Africa',
  'Guinea-Bissau': 'Africa',
  'Kenya': 'Africa',
  'Lesotho': 'Africa',
  'Liberia': 'Africa',
  'Libya': 'Africa',
  'Madagascar': 'Africa',
  'Malawi': 'Africa',
  'Mali': 'Africa',
  'Mauritania': 'Africa',
  'Mauritius': 'Africa',
  'Morocco': 'Africa',
  'Mozambique': 'Africa',
  'Namibia': 'Africa',
  'Niger': 'Africa',
  'Nigeria': 'Africa',
  'Rwanda': 'Africa',
  'Sao Tome and Principe': 'Africa',
  'Senegal': 'Africa',
  'Seychelles': 'Africa',
  'Sierra Leone': 'Africa',
  'Somalia': 'Africa',
  'South Africa': 'Africa',
  'South Sudan': 'Africa',
  'Sudan': 'Africa',
  'Tanzania': 'Africa',
  'Togo': 'Africa',
  'Tunisia': 'Africa',
  'Uganda': 'Africa',
  'Zambia': 'Africa',
  'Zimbabwe': 'Africa',

  // Asia
  'Afghanistan': 'Asia',
  'Armenia': 'Asia',
  'Azerbaijan': 'Asia',
  'Bahrain': 'Asia',
  'Bangladesh': 'Asia',
  'Bhutan': 'Asia',
  'Brunei Darussalam': 'Asia',
  'Cambodia': 'Asia',
  'China': 'Asia',
  'Georgia': 'Asia',
  'Hong Kong SAR, China': 'Asia',
  'India': 'Asia',
  'Indonesia': 'Asia',
  'Iran, Islamic Rep.': 'Asia',
  'Iraq': 'Asia',
  'Israel': 'Asia',
  'Japan': 'Asia',
  'Jordan': 'Asia',
  'Kazakhstan': 'Asia',
  'Korea, Dem. People\'s Rep.': 'Asia',
  'Korea, Rep.': 'Asia',
  'Kuwait': 'Asia',
  'Kyrgyz Republic': 'Asia',
  'Lao PDR': 'Asia',
  'Lebanon': 'Asia',
  'Macao SAR, China': 'Asia',
  'Malaysia': 'Asia',
  'Maldives': 'Asia',
  'Mongolia': 'Asia',
  'Myanmar': 'Asia',
  'Nepal': 'Asia',
  'Oman': 'Asia',
  'Pakistan': 'Asia',
  'Philippines': 'Asia',
  'Qatar': 'Asia',
  'Saudi Arabia': 'Asia',
  'Singapore': 'Asia',
  'Sri Lanka': 'Asia',
  'Syrian Arab Republic': 'Asia',
  'Taiwan, China': 'Asia',
  'Tajikistan': 'Asia',
  'Thailand': 'Asia',
  'Timor-Leste': 'Asia',
  'Turkiye': 'Asia',
  'Turkey': 'Asia',
  'Turkmenistan': 'Asia',
  'United Arab Emirates': 'Asia',
  'Uzbekistan': 'Asia',
  'Viet Nam': 'Asia',
  'West Bank and Gaza': 'Asia',
  'Yemen, Rep.': 'Asia',

  // Europe
  'Albania': 'Europe',
  'Andorra': 'Europe',
  'Austria': 'Europe',
  'Belarus': 'Europe',
  'Belgium': 'Europe',
  'Bosnia and Herzegovina': 'Europe',
  'Bulgaria': 'Europe',
  'Croatia': 'Europe',
  'Cyprus': 'Europe',
  'Czechia': 'Europe',
  'Czech Republic': 'Europe',
  'Denmark': 'Europe',
  'Estonia': 'Europe',
  'Finland': 'Europe',
  'France': 'Europe',
  'Germany': 'Europe',
  'Greece': 'Europe',
  'Hungary': 'Europe',
  'Iceland': 'Europe',
  'Ireland': 'Europe',
  'Italy': 'Europe',
  'Kosovo': 'Europe',
  'Latvia': 'Europe',
  'Liechtenstein': 'Europe',
  'Lithuania': 'Europe',
  'Luxembourg': 'Europe',
  'Malta': 'Europe',
  'Moldova': 'Europe',
  'Monaco': 'Europe',
  'Montenegro': 'Europe',
  'Netherlands': 'Europe',
  'North Macedonia': 'Europe',
  'Norway': 'Europe',
  'Poland': 'Europe',
  'Portugal': 'Europe',
  'Romania': 'Europe',
  'Russian Federation': 'Europe',
  'Russia': 'Europe',
  'San Marino': 'Europe',
  'Serbia': 'Europe',
  'Slovak Republic': 'Europe',
  'Slovakia': 'Europe',
  'Slovenia': 'Europe',
  'Spain': 'Europe',
  'Sweden': 'Europe',
  'Switzerland': 'Europe',
  'Ukraine': 'Europe',
  'United Kingdom': 'Europe',
  'Vatican City': 'Europe',

  // North America
  'Antigua and Barbuda': 'North America',
  'Aruba': 'North America',
  'Bahamas, The': 'North America',
  'Barbados': 'North America',
  'Belize': 'North America',
  'Bermuda': 'North America',
  'Canada': 'North America',
  'Cayman Islands': 'North America',
  'Costa Rica': 'North America',
  'Cuba': 'North America',
  'Curacao': 'North America',
  'Dominica': 'North America',
  'Dominican Republic': 'North America',
  'El Salvador': 'North America',
  'Greenland': 'North America',
  'Grenada': 'North America',
  'Guatemala': 'North America',
  'Haiti': 'North America',
  'Honduras': 'North America',
  'Jamaica': 'North America',
  'Mexico': 'North America',
  'Nicaragua': 'North America',
  'Panama': 'North America',
  'Puerto Rico': 'North America',
  'St. Kitts and Nevis': 'North America',
  'St. Lucia': 'North America',
  'St. Martin (French part)': 'North America',
  'St. Vincent and the Grenadines': 'North America',
  'Trinidad and Tobago': 'North America',
  'Turks and Caicos Islands': 'North America',
  'United States': 'North America',
  'United States of America': 'North America',
  'Virgin Islands (U.S.)': 'North America',

  // South America
  'Argentina': 'South America',
  'Bolivia': 'South America',
  'Brazil': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Ecuador': 'South America',
  'French Guiana': 'South America',
  'Guyana': 'South America',
  'Paraguay': 'South America',
  'Peru': 'South America',
  'Suriname': 'South America',
  'Uruguay': 'South America',
  'Venezuela, RB': 'South America',

  // Oceania
  'American Samoa': 'Oceania',
  'Australia': 'Oceania',
  'Fiji': 'Oceania',
  'French Polynesia': 'Oceania',
  'Guam': 'Oceania',
  'Kiribati': 'Oceania',
  'Marshall Islands': 'Oceania',
  'Micronesia, Fed. Sts.': 'Oceania',
  'Nauru': 'Oceania',
  'New Caledonia': 'Oceania',
  'New Zealand': 'Oceania',
  'Northern Mariana Islands': 'Oceania',
  'Palau': 'Oceania',
  'Papua New Guinea': 'Oceania',
  'Samoa': 'Oceania',
  'Solomon Islands': 'Oceania',
  'Tonga': 'Oceania',
  'Tuvalu': 'Oceania',
  'Vanuatu': 'Oceania'
}

/**
 * Get region for a country
 * @param {string} countryName - Country name
 * @returns {string} Region name or 'Unknown'
 */
export function getCountryRegion(countryName) {
  if (!countryName) {
    return 'Unknown'
  }

  // Direct lookup
  if (COUNTRY_REGION_MAP[countryName]) {
    return COUNTRY_REGION_MAP[countryName]
  }

  // Try case-insensitive match
  const normalizedName = countryName.trim()
  const matchedKey = Object.keys(COUNTRY_REGION_MAP).find(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  )

  if (matchedKey) {
    return COUNTRY_REGION_MAP[matchedKey]
  }

  return 'Unknown'
}

/**
 * Get all countries in a region
 * @param {string} region - Region name
 * @returns {Array<string>} Array of country names
 */
export function getCountriesInRegion(region) {
  return Object.entries(COUNTRY_REGION_MAP)
    .filter(([_, countryRegion]) => countryRegion === region)
    .map(([country, _]) => country)
}

/**
 * Get all available regions
 * @returns {Array<string>} Array of unique region names
 */
export function getAvailableRegions() {
  return [...new Set(Object.values(COUNTRY_REGION_MAP))].sort()
}

/**
 * Check if a country belongs to a region
 * @param {string} countryName - Country name
 * @param {string} region - Region name
 * @returns {boolean} True if country is in region
 */
export function isCountryInRegion(countryName, region) {
  return getCountryRegion(countryName) === region
}

/**
 * Filter countries by regions
 * @param {Array<string>} countries - Array of country names
 * @param {Array<string>} regions - Array of region names to filter by
 * @returns {Array<string>} Filtered array of country names
 */
export function filterCountriesByRegions(countries, regions) {
  if (!regions || regions.length === 0) {
    return countries
  }

  return countries.filter(country => {
    const countryRegion = getCountryRegion(country)
    return regions.includes(countryRegion)
  })
}

export default {
  getCountryRegion,
  getCountriesInRegion,
  getAvailableRegions,
  isCountryInRegion,
  filterCountriesByRegions
}
