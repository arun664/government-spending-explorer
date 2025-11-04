/**
 * Country Name Mapping Utilities for Spending Module
 * Maps between world map country names and spending data country names
 */

/**
 * Normalize country names for matching between map and spending data
 */
export const normalizeCountryName = (name) => {
  const nameMap = {
    // Common map to data mappings
    'United States of America': 'United States',
    'USA': 'United States',
    'Russia': 'Russian Federation',
    'South Korea': 'Korea, Rep.',
    'Korea, Republic of': 'Korea, Rep.',
    'North Korea': 'Korea, Dem. People\'s Rep.',
    'Democratic People\'s Republic of Korea': 'Korea, Dem. People\'s Rep.',
    'Iran': 'Iran, Islamic Rep.',
    'Venezuela': 'Venezuela, RB',
    'Egypt': 'Egypt, Arab Rep.',
    'Yemen': 'Yemen, Rep.',
    'Syria': 'Syrian Arab Republic',
    'Laos': 'Lao PDR',
    'Vietnam': 'Viet Nam',
    'Congo': 'Congo, Rep.',
    'Democratic Republic of the Congo': 'Congo, Dem. Rep.',
    'Tanzania': 'Tanzania',
    'Macedonia': 'North Macedonia',
    'Czech Republic': 'Czechia',
    'Slovakia': 'Slovak Republic',
    'The Bahamas': 'Bahamas, The',
    'The Gambia': 'Gambia, The',
    'Ivory Coast': 'Cote d\'Ivoire',
    'Cape Verde': 'Cabo Verde',
    'Swaziland': 'Eswatini',
    'Myanmar': 'Myanmar',
    'Burma': 'Myanmar',
    'East Timor': 'Timor-Leste',
    'Brunei': 'Brunei Darussalam',
    'Kyrgyzstan': 'Kyrgyz Republic',
    'Palestine': 'West Bank and Gaza',
    'Turkey': 'Turkiye',
    'Türkiye': 'Turkiye',
    // European countries
    'United Kingdom': 'United Kingdom',
    'Great Britain': 'United Kingdom',
    'UK': 'United Kingdom',
    'Bosnia and Herzegovina': 'Bosnia and Herzegovina',
    'Serbia': 'Serbia',
    'Montenegro': 'Montenegro',
    'Kosovo': 'Kosovo',
    'Moldova': 'Moldova',
    'Belarus': 'Belarus',
    'Ukraine': 'Ukraine',
    'Georgia': 'Georgia',
    'Armenia': 'Armenia',
    'Azerbaijan': 'Azerbaijan',
    // Central Asian countries
    'Kazakhstan': 'Kazakhstan',
    'Uzbekistan': 'Uzbekistan',
    'Turkmenistan': 'Turkmenistan',
    'Tajikistan': 'Tajikistan',
    // South Asian countries
    'Afghanistan': 'Afghanistan',
    'Pakistan': 'Pakistan',
    'India': 'India',
    'Bangladesh': 'Bangladesh',
    'Sri Lanka': 'Sri Lanka',
    'Nepal': 'Nepal',
    'Bhutan': 'Bhutan',
    'Maldives': 'Maldives',
    // Southeast Asian countries
    'Thailand': 'Thailand',
    'Cambodia': 'Cambodia',
    'Malaysia': 'Malaysia',
    'Singapore': 'Singapore',
    'Indonesia': 'Indonesia',
    'Philippines': 'Philippines',
    // East Asian countries
    'Japan': 'Japan',
    'China': 'China',
    'Mongolia': 'Mongolia',
    // Oceania
    'Australia': 'Australia',
    'New Zealand': 'New Zealand',
    'Papua New Guinea': 'Papua New Guinea',
    'Fiji': 'Fiji',
    'Solomon Islands': 'Solomon Islands',
    'Vanuatu': 'Vanuatu',
    'Samoa': 'Samoa',
    'Tonga': 'Tonga',
    'Palau': 'Palau',
    'Marshall Islands': 'Marshall Islands',
    'Micronesia': 'Micronesia, Fed. Sts.',
    'Kiribati': 'Kiribati',
    'Tuvalu': 'Tuvalu',
    'Nauru': 'Nauru',
    // African countries
    'South Africa': 'South Africa',
    'Nigeria': 'Nigeria',
    'Kenya': 'Kenya',
    'Ghana': 'Ghana',
    'Ethiopia': 'Ethiopia',
    'Morocco': 'Morocco',
    'Algeria': 'Algeria',
    'Tunisia': 'Tunisia',
    'Libya': 'Libya',
    'Sudan': 'Sudan',
    'Chad': 'Chad',
    'Niger': 'Niger',
    'Mali': 'Mali',
    'Burkina Faso': 'Burkina Faso',
    'Senegal': 'Senegal',
    'Guinea': 'Guinea',
    'Sierra Leone': 'Sierra Leone',
    'Liberia': 'Liberia',
    'Mauritania': 'Mauritania',
    // Latin American countries
    'Brazil': 'Brazil',
    'Argentina': 'Argentina',
    'Chile': 'Chile',
    'Peru': 'Peru',
    'Colombia': 'Colombia',
    'Ecuador': 'Ecuador',
    'Bolivia': 'Bolivia',
    'Paraguay': 'Paraguay',
    'Uruguay': 'Uruguay',
    'Mexico': 'Mexico',
    'Guatemala': 'Guatemala',
    'Honduras': 'Honduras',
    'El Salvador': 'El Salvador',
    'Nicaragua': 'Nicaragua',
    'Costa Rica': 'Costa Rica',
    'Panama': 'Panama'
  };
  return nameMap[name] || name;
};

/**
 * Find country in spending data by map name (with normalization)
 */
export const findCountryByMapName = (mapName, spendingData) => {
  if (!spendingData?.countries) return null;
  
  const normalizedMapName = normalizeCountryName(mapName);
  
  // Try direct match first
  let country = spendingData.countries[normalizedMapName];
  if (country) return country;
  
  // Try original name
  country = spendingData.countries[mapName];
  if (country) return country;
  
  // Try case-insensitive partial match
  const countryNames = Object.keys(spendingData.countries);
  const matchedName = countryNames.find(name => 
    name.toLowerCase().includes(mapName.toLowerCase()) ||
    mapName.toLowerCase().includes(name.toLowerCase())
  );
  
  return matchedName ? spendingData.countries[matchedName] : null;
};

/**
 * Get spending value for a country by map name
 */
export const getSpendingValueByMapName = (mapName, spendingData, yearRange = [2015, 2023]) => {
  const country = findCountryByMapName(mapName, spendingData);
  if (!country?.data) return null;
  
  // Get values within year range
  const valuesInRange = [];
  Object.entries(country.data).forEach(([year, value]) => {
    const yearNum = parseInt(year);
    if (yearNum >= yearRange[0] && yearNum <= yearRange[1] && !isNaN(value)) {
      valuesInRange.push(value);
    }
  });
  
  if (valuesInRange.length === 0) return null;
  
  // Return average value for the year range
  return valuesInRange.reduce((sum, val) => sum + val, 0) / valuesInRange.length;
};

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
export const getCountryTooltipInfo = (mapName, spendingData, yearRange = [2015, 2023]) => {
  const country = findCountryByMapName(mapName, spendingData);
  const spendingValue = getSpendingValueByMapName(mapName, spendingData, yearRange);
  
  if (!country) {
    return {
      name: mapName,
      hasData: false,
      message: 'No spending data available'
    };
  }
  
  if (spendingValue === null) {
    return {
      name: country.name,
      hasData: false,
      message: `No data for ${yearRange[0]}-${yearRange[1]}`
    };
  }
  
  return {
    name: country.name,
    hasData: true,
    spendingValue: spendingValue,
    formattedValue: formatSpendingValue(spendingValue),
    yearRange: yearRange,
    unitMeasure: country.unitMeasure || 'Millions USD'
  };
};