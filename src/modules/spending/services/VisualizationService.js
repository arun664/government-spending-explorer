import * as d3 from 'd3'
import { getIndicatorData, getMultiIndicatorData, getCountryData, INDICATOR_METADATA, CATEGORY_COLORS } from './UnifiedDataService.js'

/**
 * Visualization Service for Government Spending Data
 * Generates charts and visualizations from unified data
 */

/**
 * Generate time series chart data for a country
 */
export function generateTimeSeriesData(countryName, indicatorCodes, yearRange = null) {
  const countryData = getCountryData(countryName, indicatorCodes)
  if (!countryData) return null

  const series = []
  
  indicatorCodes.forEach(indicatorCode => {
    if (countryData.indicators[indicatorCode]) {
      const metadata = countryData.indicators[indicatorCode].metadata
      const data = countryData.indicators[indicatorCode].data
      
      const points = Object.entries(data)
        .map(([year, value]) => ({
          year: parseInt(year),
          value: parseFloat(value)
        }))
        .filter(point => {
          if (yearRange) {
            return point.year >= yearRange[0] && point.year <= yearRange[1]
          }
          return true
        })
        .sort((a, b) => a.year - b.year)

      if (points.length > 0) {
        series.push({
          indicatorCode,
          name: metadata.name,
          category: metadata.category,
          color: CATEGORY_COLORS[metadata.category],
          unit: metadata.unit,
          data: points
        })
      }
    }
  })

  return {
    country: countryName,
    series,
    yearRange: yearRange || [
      Math.min(...series.flatMap(s => s.data.map(d => d.year))),
      Math.max(...series.flatMap(s => s.data.map(d => d.year)))
    ]
  }
}

/**
 * Generate comparison chart data for multiple countries
 */
export function generateCountryComparisonData(countryNames, indicatorCode, yearRange = null) {
  const indicatorData = getIndicatorData(indicatorCode, yearRange)
  if (!indicatorData) return null

  const series = []
  
  countryNames.forEach(countryName => {
    if (indicatorData.countries[countryName]) {
      const countryData = indicatorData.countries[countryName]
      
      const points = Object.entries(countryData.data)
        .map(([year, value]) => ({
          year: parseInt(year),
          value: parseFloat(value)
        }))
        .sort((a, b) => a.year - b.year)

      if (points.length > 0) {
        series.push({
          country: countryName,
          code: countryData.code,
          data: points
        })
      }
    }
  })

  return {
    indicator: {
      code: indicatorCode,
      name: indicatorData.name,
      category: indicatorData.category,
      unit: indicatorData.unit
    },
    series,
    yearRange: yearRange || indicatorData.years
  }
}

/**
 * Generate category breakdown data for a country
 */
export function generateCategoryBreakdownData(countryName, year = null) {
  const countryData = getCountryData(countryName)
  if (!countryData) return null

  // Use latest year if not specified
  const targetYear = year || Math.max(
    ...Object.values(countryData.indicators)
      .flatMap(indicator => Object.keys(indicator.data).map(y => parseInt(y)))
  )

  const categories = {}
  
  Object.entries(countryData.indicators).forEach(([indicatorCode, indicator]) => {
    const value = indicator.data[targetYear]
    if (value && !isNaN(value)) {
      const category = indicator.metadata.category
      
      if (!categories[category]) {
        categories[category] = {
          category,
          color: CATEGORY_COLORS[category],
          total: 0,
          indicators: []
        }
      }
      
      categories[category].total += value
      categories[category].indicators.push({
        code: indicatorCode,
        name: indicator.metadata.name,
        value,
        unit: indicator.metadata.unit
      })
    }
  })

  return {
    country: countryName,
    year: targetYear,
    categories: Object.values(categories).sort((a, b) => b.total - a.total)
  }
}

/**
 * Generate top countries data for an indicator
 */
export function generateTopCountriesData(indicatorCode, year = null, limit = 10) {
  const indicatorData = getIndicatorData(indicatorCode)
  if (!indicatorData) return null

  // Use latest year if not specified
  const targetYear = year || Math.max(...indicatorData.years)

  const countryValues = []
  
  Object.entries(indicatorData.countries).forEach(([countryName, countryData]) => {
    const value = countryData.data[targetYear]
    if (value && !isNaN(value)) {
      countryValues.push({
        country: countryName,
        code: countryData.code,
        value,
        year: targetYear
      })
    }
  })

  // Sort by value (descending) and take top N
  const topCountries = countryValues
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)

  return {
    indicator: {
      code: indicatorCode,
      name: indicatorData.name,
      category: indicatorData.category,
      unit: indicatorData.unit
    },
    year: targetYear,
    countries: topCountries
  }
}

/**
 * Generate regional aggregation data
 */
export function generateRegionalData(indicatorCode, yearRange = null) {
  const indicatorData = getIndicatorData(indicatorCode, yearRange)
  if (!indicatorData) return null

  // Simple regional grouping based on country names
  // In a real implementation, you'd have a proper country-to-region mapping
  const regions = {
    'North America': [],
    'Europe': [],
    'Asia': [],
    'Africa': [],
    'South America': [],
    'Oceania': [],
    'Other': []
  }

  Object.entries(indicatorData.countries).forEach(([countryName, countryData]) => {
    // Simple heuristic for regional classification
    let region = 'Other'
    
    if (['United States', 'Canada', 'Mexico'].some(c => countryName.includes(c))) {
      region = 'North America'
    } else if (['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Austria', 'Switzerland', 'Portugal', 'Greece', 'Poland', 'Czech', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovenia', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Cyprus', 'Ireland', 'Iceland'].some(c => countryName.includes(c))) {
      region = 'Europe'
    } else if (['China', 'Japan', 'India', 'South Korea', 'Indonesia', 'Thailand', 'Malaysia', 'Singapore', 'Philippines', 'Vietnam', 'Bangladesh', 'Pakistan', 'Sri Lanka', 'Myanmar', 'Cambodia', 'Laos', 'Mongolia', 'Nepal', 'Bhutan', 'Maldives', 'Brunei'].some(c => countryName.includes(c))) {
      region = 'Asia'
    } else if (['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Ghana', 'Morocco', 'Tunisia', 'Algeria', 'Ethiopia', 'Uganda', 'Tanzania', 'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Mauritius', 'Seychelles'].some(c => countryName.includes(c))) {
      region = 'Africa'
    } else if (['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname'].some(c => countryName.includes(c))) {
      region = 'South America'
    } else if (['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga', 'Vanuatu', 'Solomon Islands', 'Palau', 'Marshall Islands', 'Micronesia', 'Kiribati', 'Tuvalu', 'Nauru'].some(c => countryName.includes(c))) {
      region = 'Oceania'
    }

    regions[region].push({
      country: countryName,
      code: countryData.code,
      data: countryData.data
    })
  })

  // Calculate regional averages
  const regionalStats = Object.entries(regions).map(([regionName, countries]) => {
    if (countries.length === 0) return null

    const allValues = countries.flatMap(country => Object.values(country.data))
    const validValues = allValues.filter(v => !isNaN(v))

    if (validValues.length === 0) return null

    return {
      region: regionName,
      countries: countries.length,
      average: validValues.reduce((a, b) => a + b, 0) / validValues.length,
      min: Math.min(...validValues),
      max: Math.max(...validValues),
      total: validValues.reduce((a, b) => a + b, 0)
    }
  }).filter(Boolean)

  return {
    indicator: {
      code: indicatorCode,
      name: indicatorData.name,
      category: indicatorData.category,
      unit: indicatorData.unit
    },
    regions: regionalStats.sort((a, b) => b.average - a.average)
  }
}

/**
 * Generate correlation analysis between indicators
 */
export function generateCorrelationData(indicatorCodes, yearRange = null) {
  const indicators = getMultiIndicatorData(indicatorCodes, yearRange)
  if (!indicators || indicators.length < 2) return null

  const correlations = []
  
  for (let i = 0; i < indicators.length; i++) {
    for (let j = i + 1; j < indicators.length; j++) {
      const indicator1 = indicators[i]
      const indicator2 = indicators[j]
      
      // Find common countries
      const commonCountries = Object.keys(indicator1.countries).filter(
        country => indicator2.countries[country]
      )

      if (commonCountries.length < 3) continue // Need at least 3 points for correlation

      // Calculate correlation for each year
      const yearCorrelations = []
      
      const allYears = [...new Set([...indicator1.years, ...indicator2.years])].sort()
      
      allYears.forEach(year => {
        const pairs = []
        
        commonCountries.forEach(country => {
          const value1 = indicator1.countries[country].data[year]
          const value2 = indicator2.countries[country].data[year]
          
          if (value1 !== undefined && value2 !== undefined && !isNaN(value1) && !isNaN(value2)) {
            pairs.push([value1, value2])
          }
        })

        if (pairs.length >= 3) {
          const correlation = calculatePearsonCorrelation(pairs)
          if (!isNaN(correlation)) {
            yearCorrelations.push({
              year,
              correlation,
              sampleSize: pairs.length
            })
          }
        }
      })

      if (yearCorrelations.length > 0) {
        correlations.push({
          indicator1: {
            code: indicator1.indicator,
            name: indicator1.name,
            category: indicator1.category
          },
          indicator2: {
            code: indicator2.indicator,
            name: indicator2.name,
            category: indicator2.category
          },
          correlations: yearCorrelations,
          averageCorrelation: yearCorrelations.reduce((sum, c) => sum + c.correlation, 0) / yearCorrelations.length
        })
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.averageCorrelation) - Math.abs(a.averageCorrelation))
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculatePearsonCorrelation(pairs) {
  const n = pairs.length
  if (n < 2) return NaN

  const sumX = pairs.reduce((sum, [x, y]) => sum + x, 0)
  const sumY = pairs.reduce((sum, [x, y]) => sum + y, 0)
  const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0)
  const sumX2 = pairs.reduce((sum, [x, y]) => sum + x * x, 0)
  const sumY2 = pairs.reduce((sum, [x, y]) => sum + y * y, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Export chart data as CSV
 */
export function exportChartDataAsCSV(chartData, chartType) {
  let csvContent = ''
  
  switch (chartType) {
    case 'timeSeries':
      csvContent = 'Year,Indicator,Value,Country\n'
      chartData.series.forEach(series => {
        series.data.forEach(point => {
          csvContent += `${point.year},${series.name},${point.value},${chartData.country}\n`
        })
      })
      break
      
    case 'countryComparison':
      csvContent = 'Year,Country,Value\n'
      chartData.series.forEach(series => {
        series.data.forEach(point => {
          csvContent += `${point.year},${series.country},${point.value}\n`
        })
      })
      break
      
    case 'topCountries':
      csvContent = 'Country,Value,Year\n'
      chartData.countries.forEach(country => {
        csvContent += `${country.country},${country.value},${country.year}\n`
      })
      break
      
    default:
      csvContent = JSON.stringify(chartData, null, 2)
  }
  
  return csvContent
}