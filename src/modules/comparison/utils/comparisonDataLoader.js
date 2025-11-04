/**
 * Comparison Data Loader - Loads both GDP and Spending data
 */

export const loadComparisonData = async () => {
  try {
    // Load both GDP and spending data in parallel
    const { getDataPath } = await import('../../../utils/pathUtils.js')
    const [gdpResponse, spendingResponse] = await Promise.all([
      fetch(getDataPath('gdp_clean.csv')),
      fetch(getDataPath('48-indicators/IMF_GFSE_GE_G14.csv')) // General government expenditure
    ])

    const [gdpText, spendingText] = await Promise.all([
      gdpResponse.text(),
      spendingResponse.text()
    ])

    // Parse both datasets
    const gdpData = parseGDPData(gdpText)
    const spendingData = parseSpendingData(spendingText)

    return {
      gdp: gdpData,
      expenses: spendingData
    }
  } catch (error) {
    console.error('Error loading comparison data:', error)
    return {
      gdp: [],
      expenses: []
    }
  }
}

const parseGDPData = (csvText) => {
  const lines = csvText.split('\n')
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    if (values.length >= 4) {
      const countryName = values[0]?.trim()
      const countryCode = values[1]?.trim()
      const year = parseInt(values[2])
      const gdpGrowth = parseFloat(values[3])
      
      if (countryName && countryCode && !isNaN(year) && !isNaN(gdpGrowth)) {
        data.push({
          countryName,
          countryCode,
          year,
          gdpGrowth
        })
      }
    }
  }
  
  return data
}

const parseSpendingData = (csvText) => {
  const lines = csvText.split('\n')
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    if (values.length >= 4) {
      const countryName = values[0]?.trim()
      const countryCode = values[1]?.trim()
      const year = parseInt(values[2])
      const spending = parseFloat(values[3])
      
      if (countryName && countryCode && !isNaN(year) && !isNaN(spending)) {
        data.push({
          countryName,
          countryCode,
          year,
          spending,
          sector: 'General Government' // Default sector
        })
      }
    }
  }
  
  return data
}

export const getUniqueCountries = (gdpData, spendingData) => {
  const countries = new Set()
  
  gdpData.forEach(entry => {
    if (entry.countryName) {
      countries.add(entry.countryName)
    }
  })
  
  spendingData.forEach(entry => {
    if (entry.countryName) {
      countries.add(entry.countryName)
    }
  })
  
  return Array.from(countries).sort()
}

export const getUniqueYears = (gdpData, spendingData) => {
  const years = new Set()
  
  gdpData.forEach(entry => {
    if (entry.year) {
      years.add(entry.year)
    }
  })
  
  spendingData.forEach(entry => {
    if (entry.year) {
      years.add(entry.year)
    }
  })
  
  return Array.from(years).sort((a, b) => a - b)
}

export const filterDataByYear = (data, startYear, endYear) => {
  if (!Array.isArray(data)) {
    return []
  }
  
  return data.filter(entry => {
    return entry.year >= startYear && entry.year <= endYear
  })
}