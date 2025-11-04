import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { 
  findCountryByMapName, 
  getSpendingValueByMapName, 
  getCountryTooltipInfo 
} from '../utils/countryMapping.js'

/**
 * Spending Map Service
 * Handles all map-related functionality for government spending visualization
 */

/**
 * Initialize and draw the spending map
 */
export function initializeSpendingMap(svgRef, gRef, zoomRef, worldData, spendingData, colorScale, filters, callbacks) {
  if (!worldData || !spendingData?.countries) {
    console.log('Missing required data for map initialization:', {
      worldData: !!worldData,
      spendingData: !!spendingData,
      countries: !!spendingData?.countries,
      colorScale: typeof colorScale
    })
    return
  }
  
  console.log('Initializing spending map with:', {
    countriesCount: Object.keys(spendingData.countries).length,
    spendingDataCategory: spendingData.category,
    colorScaleType: typeof colorScale,
    visualizationMode: filters.visualizationMode
  })

  const svg = d3.select(svgRef.current)
  const g = d3.select(gRef.current)

  // Clear existing content
  g.selectAll('*').remove()

  // Get container dimensions
  const container = svgRef.current.parentElement
  const containerRect = container.getBoundingClientRect()
  const width = containerRect.width
  const height = containerRect.height

  console.log('Map container dimensions:', { width, height, containerRect })

  svg.attr('width', width).attr('height', height)

  // Setup projection
  const countries = topojson.feature(worldData, worldData.objects.countries)
  const projection = d3.geoNaturalEarth1()
    .fitSize([width - 40, height - 40], countries)
    .translate([width / 2, (height / 2) - 20])

  const path = d3.geoPath().projection(projection)

  // Create countries group
  const countriesGroup = g.append('g').attr('class', 'countries-group')

  // Setup zoom
  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .on('zoom', (event) => {
      countriesGroup.attr('transform', event.transform)
    })

  svg.call(zoom)
  zoomRef.current = zoom

  // Determine if this is category-based visualization
  const isCategoryVisualization = spendingData.category === 'multi-category'
  const visualizationMode = filters.visualizationMode || 'dominant'

  // Draw countries
  countriesGroup.selectAll('path')
    .data(countries.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', d => {
      const countryName = getCountryNameFromFeature(d)
      if (!countryName || countryName === 'Unknown Country') return '#f5f5f5'
      
      if (isCategoryVisualization) {
        // Use category-based coloring with the color function
        if (typeof colorScale === 'function') {
          return colorScale(countryName, visualizationMode)
        } else {
          return getCategoryBasedColor(spendingData, countryName, visualizationMode)
        }
      } else {
        // Use traditional single-color scale
        const spendingValue = getCountrySpendingForMap(spendingData, countryName, filters.yearRange)
        
        if (spendingValue !== null && !isNaN(spendingValue) && colorScale) {
          return colorScale(spendingValue)
        } else {
          return '#e8e8e8' // Slightly darker gray for countries with no data
        }
      }
    })
    .attr('opacity', d => {
      const countryName = getCountryNameFromFeature(d)
      if (!countryName || countryName === 'Unknown Country') return 0.3
      
      if (isCategoryVisualization) {
        const countryData = spendingData.countries[countryName]
        return countryData && countryData.totalSpending > 0 ? 0.9 : 0.3
      } else {
        const spendingValue = getCountrySpendingForMap(spendingData, countryName, filters.yearRange)
        return spendingValue !== null ? 0.9 : 0.3
      }
    })
    .attr('stroke', d => {
      const countryName = getCountryNameFromFeature(d)
      if (callbacks.selectedCountry && countryName === callbacks.selectedCountry.name) {
        return '#ff6b00'
      }
      return '#333' // Dark border for all countries to make them visible
    })
    .attr('stroke-width', d => {
      const countryName = getCountryNameFromFeature(d)
      if (callbacks.selectedCountry && countryName === callbacks.selectedCountry.name) {
        return 3
      }
      return 1 // Thicker border to make countries more visible
    })
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      const countryName = getCountryNameFromFeature(d)
      if (!countryName || countryName === 'Unknown Country') return
      
      // Check if clicking on already selected country to deselect
      const isAlreadySelected = callbacks.selectedCountry && countryName === callbacks.selectedCountry.name
      
      if (isAlreadySelected) {
        // Deselect country
        if (callbacks.onCountryClick) {
          callbacks.onCountryClick(null)
        }
        return
      }
      
      if (isCategoryVisualization) {
        const countryData = spendingData.countries[countryName]
        if (countryData && callbacks.onCountryClick) {
          callbacks.onCountryClick({
            name: countryName,
            code: countryData.code,
            spending: { 
              average: countryData.totalSpending, 
              latest: countryData.totalSpending, 
              dataPoints: 1,
              dominantCategory: countryData.dominantCategory,
              categoryBreakdown: countryData.categories,
              categoryPercentages: countryData.categoryPercentages
            }
          })
        }
      } else {
        const spendingValue = getCountrySpendingForMap(spendingData, countryName, filters.yearRange)
        if (spendingValue !== null && callbacks.onCountryClick) {
          callbacks.onCountryClick({
            name: countryName,
            code: countryName.substring(0, 3).toUpperCase(),
            spending: { average: spendingValue, latest: spendingValue, dataPoints: 1 }
          })
        }
      }
    })
    .append('title')
    .text(d => {
      const mapCountryName = getCountryNameFromFeature(d)
      if (!mapCountryName || mapCountryName === 'Unknown Country') return 'Unknown Country'
      
      if (isCategoryVisualization) {
        return getCategoryTooltipInfo(mapCountryName, spendingData, visualizationMode)
      } else {
        const tooltipInfo = getCountryTooltipInfo(mapCountryName, spendingData, filters.yearRange)
        
        if (tooltipInfo.hasData) {
          const yearRangeText = filters.yearRange[0] === filters.yearRange[1] 
            ? `${filters.yearRange[0]}`
            : `${filters.yearRange[0]}-${filters.yearRange[1]}`
          
          return `${tooltipInfo.name}\n${spendingData.name || 'Spending'}: ${tooltipInfo.formattedValue}\nPeriod: ${yearRangeText}\nUnit: ${tooltipInfo.unitMeasure}`
        }
        
        return `${tooltipInfo.name}\n${tooltipInfo.message}`
      }
    })

  console.log('Spending map initialized successfully')
}

/**
 * Get country spending value for map visualization
 */
function getCountrySpendingForMap(spendingData, countryName, yearRange = [2015, 2023]) {
  return getSpendingValueByMapName(countryName, spendingData, yearRange)
}

/**
 * Get country name from map feature properties
 */
function getCountryNameFromFeature(feature) {
  return feature.properties?.NAME || 
         feature.properties?.name || 
         feature.properties?.NAME_EN || 
         feature.properties?.NAME_LONG ||
         feature.properties?.ADMIN ||
         'Unknown Country'
}


/**
 * Handle zoom controls
 */
export function handleZoomIn(svgRef, zoomRef) {
  if (svgRef.current && zoomRef.current) {
    d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.5)
  }
}

export function handleZoomOut(svgRef, zoomRef) {
  if (svgRef.current && zoomRef.current) {
    d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.67)
  }
}

export function handleResetZoom(svgRef, zoomRef) {
  if (svgRef.current && zoomRef.current) {
    d3.select(svgRef.current).transition().duration(750)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }
}

/**
 * Get category-based color for a country
 */
function getCategoryBasedColor(categoryData, countryName, visualizationMode = 'dominant') {
  const countryData = categoryData.countries[countryName]
  
  if (!countryData || countryData.totalSpending === 0) {
    return '#e8e8e8' // Slightly darker gray for no data to make it visible
  }
  
  if (visualizationMode === 'dominant') {
    // Use the dominant category color
    const categoryColor = categoryData.categoryColors[countryData.dominantCategory] || categoryData.categoryColors.overview
    
    // Create intensity based on spending value relative to global max
    const intensity = Math.min(countryData.totalSpending / categoryData.globalStats.maxSpending, 1)
    
    // Use a more contrasted color range - from light to dark
    // Higher spending = darker color, lower spending = lighter color
    const lightColor = d3.color(categoryColor).brighter(2).toString()
    const darkColor = d3.color(categoryColor).darker(0.5).toString()
    
    return d3.interpolateRgb(lightColor, darkColor)(intensity * 0.8 + 0.2)
  }
  
  // For other modes, use a default approach
  return categoryData.categoryColors.overview || '#667eea'
}

/**
 * Format spending values with B/M suffixes
 */
function formatSpendingValue(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  
  const absValue = Math.abs(value)
  
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1)}B`
  } else if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1)}M`
  } else if (absValue >= 1) {
    return `${value.toFixed(1)}K`
  } else {
    return value.toFixed(2)
  }
}

/**
 * Get tooltip information for category-based visualization
 */
function getCategoryTooltipInfo(countryName, categoryData, visualizationMode = 'dominant') {
  const countryData = categoryData.countries[countryName]
  
  if (!countryData || countryData.totalSpending === 0) {
    return `${countryName}\nNo spending data available`
  }
  
  const yearRangeText = categoryData.yearRange[0] === categoryData.yearRange[1] 
    ? `${categoryData.yearRange[0]}`
    : `${categoryData.yearRange[0]}-${categoryData.yearRange[1]}`
  
  if (visualizationMode === 'dominant') {
    const dominantCategory = countryData.dominantCategory
    const dominantValue = countryData.categories[dominantCategory]
    const dominantPercentage = countryData.categoryPercentages[dominantCategory]
    
    return `${countryName}\nDominant Category: ${dominantCategory.charAt(0).toUpperCase() + dominantCategory.slice(1)}\nSpending: ${formatSpendingValue(dominantValue)} (${dominantPercentage.toFixed(1)}%)\nTotal Spending: ${formatSpendingValue(countryData.totalSpending)}\nPeriod: ${yearRangeText}`
  }
  
  return `${countryName}\nTotal Spending: ${formatSpendingValue(countryData.totalSpending)}\nPeriod: ${yearRangeText}`
}

/**
 * Create color scale for spending visualization
 */
export function createSpendingColorScale(minValue, maxValue) {
  return d3.scaleSequential()
    .domain([minValue, maxValue])
    .interpolator(d3.interpolateViridis)
}