/**
 * Country Name Mapping Utilities for Spending Module
 * Maps between world map country names and spending data country names
 * Uses same comprehensive mapping as GDP module
 */

/**
 * Comprehensive country name normalization map
 * Maps from GeoJSON map names to spending data names
 */
const COUNTRY_NAME_MAP = {
  // Major countries - exact matches
  'Afghanistan': 'Afghanistan',
  'Albania': 'Albania',
  'Algeria': 'Algeria',
  'Argentina': 'Argentina',
  'Armenia': 'Armenia',
  'Australia': 'Australia',
  'Austria': 'Austria',
  'Azerbaijan': 'Azerbaijan',
  
  // B
  'Bahamas': 'Bahamas, The',
  'The Bahamas': 'Bahamas, The',
  'Bangladesh': 'Bangladesh',
  'Belarus': 'Belarus',
  'Belgium': 'Belgium',
  'Belize': 'Belize',
  'Benin': 'Benin',
  'Bhutan': 'Bhutan',
  'Bolivia': 'Bolivia',
  'Bosnia and Herzegovina': 'Bosnia and Herzegovina',
  'Botswana': 'Botswana',
  'Brazil': 'Brazil',
  'Brunei': 'Brunei Darussalam',
  'Brunei Darussalam': 'Brunei Darussalam',
  'Bulgaria': 'Bulgaria',
  'Burkina Faso': 'Burkina Faso',
  'Burundi': 'Burundi',
  
  // C
  'Cambodia': 'Cambodia',
  'Cameroon': 'Cameroon',
  'Canada': 'Canada',
  'Cape Verde': 'Cabo Verde',
  'Cabo Verde': 'Cabo Verde',
  'Central African Republic': 'Central African Republic',
  'Chad': 'Chad',
  'Chile': 'Chile',
  'China': 'China',
  'Colombia': 'Colombia',
  'Comoros': 'Comoros',
  'Congo': 'Congo, Rep.',
  'Republic of the Congo': 'Congo, Rep.',
  'Congo, Rep.': 'Congo, Rep.',
  'Democratic Republic of the Congo': 'Congo, Dem. Rep.',
  'Congo, Dem. Rep.': 'Congo, Dem. Rep.',
  'Costa Rica': 'Costa Rica',
  'Croatia': 'Croatia',
  'Cuba': 'Cuba',
  'Cyprus': 'Cyprus',
  'Czech Republic': 'Czechia',
  'Czechia': 'Czechia',
  
  // D
  'Denmark': 'Denmark',
  'Djibouti': 'Djibouti',
  'Dominican Republic': 'Dominican Republic',
  
  // E
  'Ecuador': 'Ecuador',
  'Egypt': 'Egypt, Arab Rep.',
  'Egypt, Arab Rep.': 'Egypt, Arab Rep.',
  'El Salvador': 'El Salvador',
  'Equatorial Guinea': 'Equatorial Guinea',
  'Eritrea': 'Eritrea',
  'Estonia': 'Estonia',
  'Eswatini': 'Eswatini',
  'Swaziland': 'Eswatini',
  'Ethiopia': 'Ethiopia',
  
  // F
  'Fiji': 'Fiji',
  'Finland': 'Finland',
  'France': 'France',
  
  // G
  'Gabon': 'Gabon',
  'Gambia': 'Gambia, The',
  'The Gambia': 'Gambia, The',
  'Georgia': 'Georgia',
  'Germany': 'Germany',
  'Ghana': 'Ghana',
  'Greece': 'Greece',
  'Grenada': 'Grenada',
  'Guatemala': 'Guatemala',
  'Guinea': 'Guinea',
  'Guinea-Bissau': 'Guinea-Bissau',
  'Guyana': 'Guyana',
  
  // H
  'Haiti': 'Haiti',
  'Honduras': 'Honduras',
  'Hungary': 'Hungary',
  
  // I
  'Iceland': 'Iceland',
  'India': 'India',
  'Indonesia': 'Indonesia',
  'Iran': 'Iran, Islamic Rep.',
  'Iran, Islamic Rep.': 'Iran, Islamic Rep.',
  'Iraq': 'Iraq',
  'Ireland': 'Ireland',
  'Israel': 'Israel',
  'Italy': 'Italy',
  'Ivory Coast': 'Cote d\'Ivoire',
  'Cote d\'Ivoire': 'Cote d\'Ivoire',
  
  // J
  'Jamaica': 'Jamaica',
  'Japan': 'Japan',
  'Jordan': 'Jordan',
  
  // K
  'Kazakhstan': 'Kazakhstan',
  'Kenya': 'Kenya',
  'Kiribati': 'Kiribati',
  'Kosovo': 'Kosovo',
  'Kuwait': 'Kuwait',
  'Kyrgyzstan': 'Kyrgyz Republic',
  'Kyrgyz Republic': 'Kyrgyz Republic',
  
  // L
  'Laos': 'Lao PDR',
  'Lao PDR': 'Lao PDR',
  'Latvia': 'Latvia',
  'Lebanon': 'Lebanon',
  'Lesotho': 'Lesotho',
  'Liberia': 'Liberia',
  'Libya': 'Libya',
  'Lithuania': 'Lithuania',
  'Luxembourg': 'Luxembourg',
  
  // M
  'Madagascar': 'Madagascar',
  'Malawi': 'Malawi',
  'Malaysia': 'Malaysia',
  'Maldives': 'Maldives',
  'Mali': 'Mali',
  'Malta': 'Malta',
  'Marshall Islands': 'Marshall Islands',
  'Mauritania': 'Mauritania',
  'Mauritius': 'Mauritius',
  'Mexico': 'Mexico',
  'Micronesia': 'Micronesia, Fed. Sts.',
  'Micronesia, Fed. Sts.': 'Micronesia, Fed. Sts.',
  'Moldova': 'Moldova',
  'Mongolia': 'Mongolia',
  'Montenegro': 'Montenegro',
  'Morocco': 'Morocco',
  'Mozambique': 'Mozambique',
  'Myanmar': 'Myanmar',
  'Burma': 'Myanmar',
  
  // N
  'Namibia': 'Namibia',
  'Nauru': 'Nauru',
  'Nepal': 'Nepal',
  'Netherlands': 'Netherlands',
  'New Zealand': 'New Zealand',
  'Nicaragua': 'Nicaragua',
  'Niger': 'Niger',
  'Nigeria': 'Nigeria',
  'North Korea': 'Korea, Dem. People\'s Rep.',
  'Korea, Dem. People\'s Rep.': 'Korea, Dem. People\'s Rep.',
  'North Macedonia': 'North Macedonia',
  'Macedonia': 'North Macedonia',
  'Norway': 'Norway',
  
  // O
  'Oman': 'Oman',
  
  // P
  'Pakistan': 'Pakistan',
  'Palau': 'Palau',
  'Palestine': 'West Bank and Gaza',
  'West Bank and Gaza': 'West Bank and Gaza',
  'Panama': 'Panama',
  'Papua New Guinea': 'Papua New Guinea',
  'Paraguay': 'Paraguay',
  'Peru': 'Peru',
  'Philippines': 'Philippines',
  'Poland': 'Poland',
  'Portugal': 'Portugal',
  
  // Q
  'Qatar': 'Qatar',
  
  // R
  'Romania': 'Romania',
  'Russia': 'Russian Federation',
  'Russian Federation': 'Russian Federation',
  'Rwanda': 'Rwanda',
  
  // S
  'Saint Lucia': 'St. Lucia',
  'St. Lucia': 'St. Lucia',
  'Saint Vincent and the Grenadines': 'St. Vincent and the Grenadines',
  'St. Vincent and the Grenadines': 'St. Vincent and the Grenadines',
  'Samoa': 'Samoa',
  'Saudi Arabia': 'Saudi Arabia',
  'Senegal': 'Senegal',
  'Serbia': 'Serbia',
  'Seychelles': 'Seychelles',
  'Sierra Leone': 'Sierra Leone',
  'Singapore': 'Singapore',
  'Slovakia': 'Slovak Republic',
  'Slovak Republic': 'Slovak Republic',
  'Slovenia': 'Slovenia',
  'Solomon Islands': 'Solomon Islands',
  'Somalia': 'Somalia',
  'South Africa': 'South Africa',
  'South Korea': 'Korea, Rep.',
  'Korea, Rep.': 'Korea, Rep.',
  'Korea, Republic of': 'Korea, Rep.',
  'South Sudan': 'South Sudan',
  'Spain': 'Spain',
  'Sri Lanka': 'Sri Lanka',
  'Sudan': 'Sudan',
  'Suriname': 'Suriname',
  'Sweden': 'Sweden',
  'Switzerland': 'Switzerland',
  'Syria': 'Syrian Arab Republic',
  'Syrian Arab Republic': 'Syrian Arab Republic',
  
  // T
  'Taiwan': 'Taiwan',
  'Tajikistan': 'Tajikistan',
  'Tanzania': 'Tanzania',
  'Thailand': 'Thailand',
  'Timor-Leste': 'Timor-Leste',
  'East Timor': 'Timor-Leste',
  'Togo': 'Togo',
  'Tonga': 'Tonga',
  'Trinidad and Tobago': 'Trinidad and Tobago',
  'Tunisia': 'Tunisia',
  'Turkey': 'Turkiye',
  'Türkiye': 'Turkiye',
  'Turkiye': 'Turkiye',
  'Turkmenistan': 'Turkmenistan',
  'Tuvalu': 'Tuvalu',
  
  // U
  'Uganda': 'Uganda',
  'Ukraine': 'Ukraine',
  'United Arab Emirates': 'United Arab Emirates',
  'United Kingdom': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'UK': 'United Kingdom',
  'United States of America': 'United States',
  'United States': 'United States',
  'USA': 'United States',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Uzbekistan',
  
  // V
  'Vanuatu': 'Vanuatu',
  'Venezuela': 'Venezuela, RB',
  'Venezuela, RB': 'Venezuela, RB',
  'Vietnam': 'Viet Nam',
  'Viet Nam': 'Viet Nam',
  
  // Y
  'Yemen': 'Yemen, Rep.',
  'Yemen, Rep.': 'Yemen, Rep.',
  
  // Z
  'Zambia': 'Zambia',
  'Zimbabwe': 'Zimbabwe'
}

/**
 * Normalize country names for matching between map and spending data
 */
export const normalizeCountryName = (name) => {
  if (!name) return null
  
  // Try exact match first
  if (COUNTRY_NAME_MAP[name]) {
    return COUNTRY_NAME_MAP[name]
  }
  
  // Try case-insensitive match
  const lowerName = name.toLowerCase()
  for (const [key, value] of Object.entries(COUNTRY_NAME_MAP)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }
  
  // Return original if no match found
  return name
}

/**
 * Get country code from map name
 * Mapping from GeoJSON map names to IMF country codes
 * Based on actual IMF data extraction from country-mapping.json
 */
export const getCountryCodeFromMapName = (mapName) => {
  if (!mapName) return null
  
  // IMF country code mapping - based on extracted IMF REF_AREA codes
  // This mapping aligns GeoJSON country names with actual IMF data codes
  const codeMap = {
    // Americas
    'United States of America': 'USA',
    'United States': 'USA',
    'Canada': 'CAN',
    'Mexico': 'MEX',
    'Aruba': 'ABW',
    'Brazil': 'BRA',
    'Argentina': 'ARG',
    'Chile': 'CHL',
    'Colombia': 'COL',
    'Peru': 'PER',
    'Venezuela': 'VEN',
    'Venezuela, RB': 'VEN',
    'Ecuador': 'ECU',
    'Bolivia': 'BOL',
    'Paraguay': 'PRY',
    'Uruguay': 'URY',
    'Guyana': 'GUY',
    'Suriname': 'SUR',
    'Cuba': 'CUB',
    'Dominican Republic': 'DOM',
    'Haiti': 'HTI',
    'Jamaica': 'JAM',
    'Trinidad and Tobago': 'TTO',
    'Costa Rica': 'CRI',
    'Panama': 'PAN',
    'Guatemala': 'GTM',
    'Honduras': 'HND',
    'El Salvador': 'SLV',
    'Nicaragua': 'NIC',
    'Belize': 'BLZ',
    'Bahamas': 'BHS',
    'The Bahamas': 'BHS',
    'Bahamas, The': 'BHS',
    'Barbados': 'BRB',
    'Antigua and Barbuda': 'ATG',
    'Dominica': 'DMA',
    'Grenada': 'GRD',
    'St. Kitts and Nevis': 'KNA',
    'St. Lucia': 'LCA',
    'St. Vincent and the Grenadines': 'VCT',
    
    // Europe
    'United Kingdom': 'GBR',
    'Germany': 'DEU',
    'France': 'FRA',
    'Italy': 'ITA',
    'Spain': 'ESP',
    'Poland': 'POL',
    'Romania': 'ROU',
    'Netherlands': 'NLD',
    'Belgium': 'BEL',
    'Greece': 'GRC',
    'Czech Republic': 'CZE',
    'Czechia': 'CZE',
    'Portugal': 'PRT',
    'Sweden': 'SWE',
    'Hungary': 'HUN',
    'Austria': 'AUT',
    'Serbia': 'SRB',
    'Switzerland': 'CHE',
    'Bulgaria': 'BGR',
    'Denmark': 'DNK',
    'Finland': 'FIN',
    'Slovakia': 'SVK',
    'Slovak Republic': 'SVK',
    'Norway': 'NOR',
    'Ireland': 'IRL',
    'Croatia': 'HRV',
    'Bosnia and Herzegovina': 'BIH',
    'Bosnia and Herz.': 'BIH',
    'Albania': 'ALB',
    'Lithuania': 'LTU',
    'Slovenia': 'SVN',
    'Latvia': 'LVA',
    'Estonia': 'EST',
    'North Macedonia': 'MKD',
    'Macedonia': 'MKD',
    'Luxembourg': 'LUX',
    'Montenegro': 'MNE',
    'Malta': 'MLT',
    'Iceland': 'ISL',
    'Cyprus': 'CYP',
    'N. Cyprus': 'CYP',
    'Moldova': 'MDA',
    'Belarus': 'BLR',
    'Ukraine': 'UKR',
    'Russia': 'RUS',
    'Russian Federation': 'RUS',
    'Andorra': 'AND',
    'Monaco': 'MCO',
    'San Marino': 'SMR',
    'Kosovo': 'XKX',
    
    // Asia
    'China': 'CHN',
    'India': 'IND',
    'Japan': 'JPN',
    'South Korea': 'KOR',
    'Korea, Rep.': 'KOR',
    'Korea, Republic of': 'KOR',
    'Indonesia': 'IDN',
    'Pakistan': 'PAK',
    'Bangladesh': 'BGD',
    'Philippines': 'PHL',
    'Vietnam': 'VNM',
    'Viet Nam': 'VNM',
    'Thailand': 'THA',
    'Myanmar': 'MMR',
    'Burma': 'MMR',
    'Afghanistan': 'AFG',
    'Saudi Arabia': 'SAU',
    'Yemen': 'YEM',
    'Yemen, Rep.': 'YEM',
    'Iraq': 'IRQ',
    'Malaysia': 'MYS',
    'Nepal': 'NPL',
    'Sri Lanka': 'LKA',
    'Cambodia': 'KHM',
    'Jordan': 'JOR',
    'United Arab Emirates': 'ARE',
    'Israel': 'ISR',
    'Laos': 'LAO',
    'Lao PDR': 'LAO',
    'Lebanon': 'LBN',
    'Singapore': 'SGP',
    'Oman': 'OMN',
    'Kuwait': 'KWT',
    'Georgia': 'GEO',
    'Mongolia': 'MNG',
    'Armenia': 'ARM',
    'Qatar': 'QAT',
    'Bahrain': 'BHR',
    'Timor-Leste': 'TLS',
    'East Timor': 'TLS',
    'Bhutan': 'BTN',
    'Maldives': 'MDV',
    'Brunei': 'BRN',
    'Brunei Darussalam': 'BRN',
    'Syria': 'SYR',
    'Syrian Arab Republic': 'SYR',
    'Iran': 'IRN',
    'Iran, Islamic Rep.': 'IRN',
    'Turkey': 'TUR',
    'Türkiye': 'TUR',
    'Turkiye': 'TUR',
    'Kazakhstan': 'KAZ',
    'Uzbekistan': 'UZB',
    'Azerbaijan': 'AZE',
    'Tajikistan': 'TJK',
    'Kyrgyzstan': 'KGZ',
    'Kyrgyz Republic': 'KGZ',
    'Turkmenistan': 'TKM',
    'Taiwan': 'TWN',
    'Hong Kong': 'HKG',
    'Hong Kong SAR, China': 'HKG',
    'Macao SAR, China': 'MAC',
    'West Bank and Gaza': 'PSE',
    'Palestine': 'PSE',
    
    // Africa
    'Nigeria': 'NGA',
    'Ethiopia': 'ETH',
    'Egypt': 'EGY',
    'Egypt, Arab Rep.': 'EGY',
    'Democratic Republic of the Congo': 'COD',
    'Congo, Dem. Rep.': 'COD',
    'Dem. Rep. Congo': 'COD',
    'Tanzania': 'TZA',
    'South Africa': 'ZAF',
    'Kenya': 'KEN',
    'Uganda': 'UGA',
    'Algeria': 'DZA',
    'Sudan': 'SDN',
    'Morocco': 'MAR',
    'Angola': 'AGO',
    'Ghana': 'GHA',
    'Mozambique': 'MOZ',
    'Madagascar': 'MDG',
    'Cameroon': 'CMR',
    'Ivory Coast': 'CIV',
    'Cote d\'Ivoire': 'CIV',
    'Côte d\'Ivoire': 'CIV',
    'Niger': 'NER',
    'Burkina Faso': 'BFA',
    'Mali': 'MLI',
    'Malawi': 'MWI',
    'Zambia': 'ZMB',
    'Senegal': 'SEN',
    'Somalia': 'SOM',
    'Chad': 'TCD',
    'Zimbabwe': 'ZWE',
    'Guinea': 'GIN',
    'Rwanda': 'RWA',
    'Benin': 'BEN',
    'Tunisia': 'TUN',
    'Burundi': 'BDI',
    'South Sudan': 'SSD',
    'S. Sudan': 'SSD',
    'Togo': 'TGO',
    'Sierra Leone': 'SLE',
    'Libya': 'LBY',
    'Liberia': 'LBR',
    'Mauritania': 'MRT',
    'Central African Republic': 'CAF',
    'Central African Rep.': 'CAF',
    'Eritrea': 'ERI',
    'Gambia': 'GMB',
    'The Gambia': 'GMB',
    'Gambia, The': 'GMB',
    'Botswana': 'BWA',
    'Namibia': 'NAM',
    'Gabon': 'GAB',
    'Lesotho': 'LSO',
    'Guinea-Bissau': 'GNB',
    'Equatorial Guinea': 'GNQ',
    'Eq. Guinea': 'GNQ',
    'Mauritius': 'MUS',
    'Eswatini': 'SWZ',
    'eSwatini': 'SWZ',
    'Swaziland': 'SWZ',
    'Djibouti': 'DJI',
    'Comoros': 'COM',
    'Cabo Verde': 'CPV',
    'Cape Verde': 'CPV',
    'Sao Tome and Principe': 'STP',
    'Seychelles': 'SYC',
    'Congo': 'COG',
    'Congo, Rep.': 'COG',
    'Republic of the Congo': 'COG',
    
    // Oceania
    'Australia': 'AUS',
    'Papua New Guinea': 'PNG',
    'New Zealand': 'NZL',
    'Fiji': 'FJI',
    'Solomon Islands': 'SLB',
    'Solomon Is.': 'SLB',
    'Vanuatu': 'VUT',
    'Samoa': 'WSM',
    'Kiribati': 'KIR',
    'Micronesia': 'FSM',
    'Micronesia, Fed. Sts.': 'FSM',
    'Tonga': 'TON',
    'Palau': 'PLW',
    'Marshall Islands': 'MHL',
    'Nauru': 'NRU',
    'Tuvalu': 'TUV'
  }
  
  // Try exact match first
  if (codeMap[mapName]) {
    return codeMap[mapName]
  }
  
  // Try case-insensitive match
  const lowerName = mapName.toLowerCase()
  for (const [key, value] of Object.entries(codeMap)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }
  
  // Fallback: return first 3 letters uppercase
  return mapName.substring(0, 3).toUpperCase()
}

/**
 * Find country in spending data by map name (with normalization)
 */
export const findCountryByMapName = (mapName, spendingData) => {
  if (!spendingData?.countries) return null
  
  // Get country code from map name
  const countryCode = getCountryCodeFromMapName(mapName)
  
  // Try direct code match first (this is the main path now)
  let country = spendingData.countries[countryCode]
  if (country) return country
  
  // Fallback: try to find by name
  const normalizedMapName = normalizeCountryName(mapName)
  const countryEntries = Object.entries(spendingData.countries)
  
  const matchedEntry = countryEntries.find(([, data]) => {
    return data.name === normalizedMapName || 
           data.name === mapName ||
           data.name.toLowerCase() === mapName.toLowerCase()
  })
  
  return matchedEntry ? matchedEntry[1] : null
}

/**
 * Get spending value for a country by map name
 */
export const getSpendingValueByMapName = (mapName, spendingData, yearRange = [2015, 2022]) => {
  const country = findCountryByMapName(mapName, spendingData)
  
  if (!country?.data) return null
  
  // Get values within year range
  const valuesInRange = []
  Object.entries(country.data).forEach(([year, value]) => {
    const yearNum = parseInt(year)
    if (yearNum >= yearRange[0] && yearNum <= yearRange[1] && !isNaN(value)) {
      valuesInRange.push(value)
    }
  })
  
  if (valuesInRange.length === 0) return null
  
  // Return average value for the year range
  return valuesInRange.reduce((sum, val) => sum + val, 0) / valuesInRange.length
}

/**
 * Format spending values with B/M suffixes
 */
const formatSpendingValue = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  
  const absValue = Math.abs(value)
  
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1)}B`
  } else if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1)}M`
  } else {
    return `${value.toFixed(1)}K`
  }
}

/**
 * Get country information for tooltip display
 */
export const getCountryTooltipInfo = (mapName, spendingData, yearRange = [2015, 2022]) => {
  const country = findCountryByMapName(mapName, spendingData)
  const spendingValue = getSpendingValueByMapName(mapName, spendingData, yearRange)
  
  if (!country) {
    return {
      name: mapName,
      hasData: false,
      message: 'No spending data available'
    }
  }
  
  if (spendingValue === null) {
    return {
      name: country.name,
      hasData: false,
      message: `No data for ${yearRange[0]}-${yearRange[1]}`
    }
  }
  
  return {
    name: country.name,
    hasData: true,
    spendingValue: spendingValue,
    formattedValue: formatSpendingValue(spendingValue),
    yearRange: yearRange,
    unitMeasure: country.unitMeasure || 'Millions USD'
  }
}
