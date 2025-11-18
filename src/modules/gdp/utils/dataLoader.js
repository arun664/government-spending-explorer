/**
 * Data Loader Utilities for GDP Module
 */

export const loadAllData = async () => {
  // Load GDP data from gdp_vals.csv (actual GDP values)
  try {
    const { getDataPath } = await import('../../../utils/pathUtils.js')
    const response = await fetch(getDataPath('gdp_vals.csv'))
    const text = await response.text()
    // Parse CSV data
    const gdpData = parseGDPValsCSV(text)
    
    // Convert to the expected format with gdp and expenses arrays
    const gdpArray = Object.values(gdpData).flatMap(country => 
      country.data.map(entry => ({
        countryName: country.name,
        countryCode: country.code,
        year: entry.year,
        gdpGrowth: entry.growth,
        gdpValue: entry.gdp // Include actual GDP value
      }))
    )
    
    return {
      gdp: gdpArray,
      expenses: [] // No expense data available yet
    }
  } catch (error) {
    console.error('Error loading GDP data:', error)
    return {
      gdp: [],
      expenses: []
    }
  }
}

export const getUniqueCountries = (data) => {
  const countries = new Set()
  if (Array.isArray(data)) {
    data.forEach(entry => {
      if (entry.countryName) {
        countries.add(entry.countryName)
      }
    })
  } else {
    // Fallback for object format
    Object.values(data).forEach(country => {
      if (country.name) {
        countries.add(country.name)
      }
    })
  }
  return Array.from(countries).sort()
}

export const getUniqueYears = (data) => {
  const years = new Set()
  if (Array.isArray(data)) {
    data.forEach(entry => {
      if (entry.year) {
        years.add(entry.year)
      }
    })
  } else {
    // Fallback for object format
    Object.values(data).forEach(country => {
      if (country.data) {
        country.data.forEach(entry => {
          if (entry.year) {
            years.add(entry.year)
          }
        })
      }
    })
  }
  return Array.from(years).sort((a, b) => a - b)
}

export const filterData = (data, filters, startYear, endYear) => {
  if (!Array.isArray(data)) {
    return []
  }
  
  return data.filter(entry => {
    // Apply year range filter
    if (startYear && endYear) {
      if (entry.year < startYear || entry.year > endYear) {
        return false
      }
    }
    
    // Apply other filters as needed
    if (filters) {
      // Add more filter logic here if needed
    }
    
    return true
  })
}

const parseCSVData = (csvText) => {
  // Simple CSV parser for GDP data (legacy - for gdp_clean.csv)
  const lines = csvText.split('\n')
  const headers = lines[0].split(',')
  const data = {}
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    if (values.length >= headers.length) {
      const countryCode = values[1]
      const countryName = values[0]
      const year = parseInt(values[2])
      const growth = parseFloat(values[3])
      
      if (!data[countryCode]) {
        data[countryCode] = {
          name: countryName,
          code: countryCode,
          data: []
        }
      }
      
      if (!isNaN(year) && !isNaN(growth)) {
        data[countryCode].data.push({ year, growth })
      }
    }
  }
  
  return data
}

const parseGDPValsCSV = (csvText) => {
  // Parser for gdp_vals.csv format
  // Format: Country Name,Country Code,Indicator Name,Indicator Code,1960,1961,...,2024
  const lines = csvText.split('\n')
  const headerLine = lines[0]
  const headers = headerLine.split(',')
  
  // Extract year columns (starting from index 4)
  const yearColumns = headers.slice(4).map(h => parseInt(h.trim())).filter(y => !isNaN(y))
  
  const data = {}
  
  // Filter out regional aggregates
  const regionalCodes = new Set([
    'ARB', 'CSS', 'CEB', 'EAR', 'EAS', 'EAP', 'TEA', 'EMU', 'ECS', 'ECA', 'TEC',
    'EUU', 'FCS', 'HPC', 'HIC', 'IBD', 'IBT', 'IDB', 'IDX', 'IDA', 'LTE', 'LCN',
    'LAC', 'TLA', 'LDC', 'LMY', 'LIC', 'LMC', 'MEA', 'MNA', 'TMN', 'MIC', 'NAC',
    'OED', 'OSS', 'PSS', 'PST', 'PRE', 'SST', 'SAS', 'TSA', 'SSF', 'SSA', 'TSS',
    'UMC', 'WLD', 'AFE', 'AFW'
  ])
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(',')
    if (values.length < 5) continue
    
    const countryName = values[0]
    const countryCode = values[1]
    
    // Skip regional aggregates
    if (regionalCodes.has(countryCode)) continue
    
    if (!data[countryCode]) {
      data[countryCode] = {
        name: countryName,
        code: countryCode,
        data: []
      }
    }
    
    // Parse GDP values for each year
    for (let j = 0; j < yearColumns.length; j++) {
      const year = yearColumns[j]
      const gdpValue = parseFloat(values[4 + j])
      
      if (!isNaN(gdpValue) && gdpValue > 0) {
        // Calculate growth rate if we have previous year data
        const prevYearData = data[countryCode].data.find(d => d.year === year - 1)
        let growth = 0
        
        if (prevYearData && prevYearData.gdp > 0) {
          growth = ((gdpValue - prevYearData.gdp) / prevYearData.gdp) * 100
        }
        
        data[countryCode].data.push({ 
          year, 
          gdp: gdpValue,
          growth: growth
        })
      }
    }
    
    // Sort data by year
    data[countryCode].data.sort((a, b) => a.year - b.year)
    
    // Recalculate growth rates now that data is sorted
    for (let j = 1; j < data[countryCode].data.length; j++) {
      const current = data[countryCode].data[j]
      const previous = data[countryCode].data[j - 1]
      
      if (previous.gdp > 0) {
        current.growth = ((current.gdp - previous.gdp) / previous.gdp) * 100
      }
    }
  }
  
  return data
}

/**
 * Format GDP value for display
 * @param {number} gdpValue - GDP value in USD
 * @returns {string} Formatted string (e.g., "$21.4T" or "$543.2B")
 */
export const formatGDPValue = (gdpValue) => {
  if (gdpValue === null || gdpValue === undefined || isNaN(gdpValue)) {
    return 'N/A'
  }
  
  const absValue = Math.abs(gdpValue)
  
  if (absValue >= 1e12) {
    // Trillions
    return `$${(gdpValue / 1e12).toFixed(1)}T`
  } else if (absValue >= 1e9) {
    // Billions
    return `$${(gdpValue / 1e9).toFixed(1)}B`
  } else if (absValue >= 1e6) {
    // Millions
    return `$${(gdpValue / 1e6).toFixed(1)}M`
  } else {
    // Less than a million
    return `$${gdpValue.toFixed(0)}`
  }
}