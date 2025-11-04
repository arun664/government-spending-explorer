/**
 * Data Loader Utilities for GDP Module
 */

export const loadAllData = async () => {
  // Load GDP data
  try {
    const response = await fetch('/data/gdp_clean.csv')
    const text = await response.text()
    // Parse CSV data
    const gdpData = parseCSVData(text)
    
    // Convert to the expected format with gdp and expenses arrays
    const gdpArray = Object.values(gdpData).flatMap(country => 
      country.data.map(entry => ({
        countryName: country.name,
        countryCode: country.code,
        year: entry.year,
        gdpGrowth: entry.growth
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
  // Simple CSV parser for GDP data
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