import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { getCountryCodeFromMapName } from '../utils/countryMapping.js'
import { getCountryRegion } from '../../../shared/utils/RegionMapping.js'
import { MapColorService } from '../../../shared/services/MapColorService.js'

export function initializeSpendingMap(svgRef, gRef, zoomRef, worldData, spendingData, colorScale, filters, callbacks) {
  if (!worldData || !spendingData?.countries) {
    console.warn('Map init skipped - missing data:', {
      hasWorldData: !!worldData,
      hasSpendingData: !!spendingData,
      hasCountries: !!spendingData?.countries
    })
    return
  }
  
  if (!colorScale) {
    console.error('ColorScale is null/undefined! Category:', spendingData.category)
    return
  }

  const svg = d3.select(svgRef.current)
  const g = d3.select(gRef.current)

  g.selectAll('*').remove()

  const container = svgRef.current.parentElement
  const containerRect = container.getBoundingClientRect()
  const width = containerRect.width
  const height = containerRect.height

  svg.attr('width', width).attr('height', height)

  // Setup projection
  const countries = topojson.feature(worldData, worldData.objects.countries)
  const projection = d3.geoNaturalEarth1()
    .fitSize([width - 40, height - 40], countries)
    .translate([width / 2, (height / 2) - 20])

  const path = d3.geoPath().projection(projection)

  // Create countries group
  const countriesGroup = g.append('g').attr('class', 'countries-group')
  
  // Add pattern for zero-value countries (diagonal stripes)
  const defs = svg.append('defs')
  
  // Background for the pattern
  defs.append('pattern')
    .attr('id', 'zero-value-pattern')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 8)
    .attr('height', 8)
    .selectAll('g')
    .data([null])
    .enter()
    .append('g')
    .call(g => {
      // Light background
      g.append('rect')
        .attr('width', 8)
        .attr('height', 8)
        .attr('fill', '#f5f5f5')
      
      // Diagonal stripes
      g.append('path')
        .attr('d', 'M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2')
        .attr('stroke', '#999')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.4)
    })

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

  // Apply filters to get filtered countries
  const filteredCountries = MapColorService.applyFiltersToMapData(countries.features, filters, spendingData)
  const filteredCountryNames = new Set(filteredCountries.map(f => getCountryNameFromFeature(f)))
  
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
      
      // Check if country passes all filters
      const passesFilters = filteredCountryNames.has(countryName)
      if (!passesFilters) {
        return '#e0e0e0' // Gray out filtered countries
      }
      
      if (isCategoryVisualization) {
        if (typeof colorScale === 'function') {
          return colorScale(countryName, visualizationMode)
        } else {
          const categoryColorScale = MapColorService.createCategoryVisualizationScale(spendingData, visualizationMode)
          return categoryColorScale(countryName)
        }
      } else {
        // For single indicator, use the color scale with spending values
        const countryData = MapColorService.findCountryData(countryName, spendingData)
        
        if (!countryData || !countryData.data) {
          return '#e8e8e8' // No data
        }
        
        // Calculate average spending for year range
        const spendingValue = getCountrySpendingForMap(spendingData, countryName, filters.yearRange)
        
        let finalColor = '#e8e8e8'
        // CRITICAL FIX: Only color if value is greater than 0
        if (spendingValue !== null && !isNaN(spendingValue) && spendingValue > 0 && colorScale && typeof colorScale === 'function') {
          finalColor = colorScale(spendingValue)
        } else if (spendingValue === 0 || (spendingValue === null && countryData && countryData.data)) {
          // Countries with 0 spending or no data in range get a striped pattern
          return 'url(#zero-value-pattern)'
        }
        
        return finalColor
      }
    })
    .attr('opacity', d => {
      const countryName = getCountryNameFromFeature(d)
      if (!countryName || countryName === 'Unknown Country') return 0.3
      
      // Reduce opacity for filtered out countries
      const passesFilters = filteredCountryNames.has(countryName)
      if (!passesFilters) {
        return 0.2
      }
      
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
      
      // Check if country has pattern fill (0 spending)
      const spendingValue = getCountrySpendingForMap(spendingData, countryName, filters.yearRange)
      if (spendingValue === 0 || (spendingValue === null && MapColorService.findCountryData(countryName, spendingData)?.data)) {
        return '#666' // Darker border for pattern-filled countries
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
    .classed('selected', d => {
      // Add selected class for CSS styling - Requirement 10.3
      const countryName = getCountryNameFromFeature(d)
      return callbacks.selectedCountry && countryName === callbacks.selectedCountry.name
    })
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      const countryName = getCountryNameFromFeature(d)
      
      // Only change stroke, don't change fill to avoid glitching
      d3.select(this)
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
      
      // Show tooltip
      if (callbacks.onCountryHover) {
        const spendingValues = getCountrySpendingWithUSDForMap(spendingData, countryName, filters.yearRange)
        
        callbacks.onCountryHover({
          name: countryName,
          code: getCountryCodeFromMapName(countryName),
          spending: spendingValues.local,
          spendingUSD: spendingValues.usd,
          category: spendingData.category,
          indicatorName: spendingData.name,
          hasData: spendingValues.local !== null,
          x: event.pageX,
          y: event.pageY
        })
      }
    })
    .on('mousemove', function(event) {
      // Update tooltip position
      if (callbacks.onCountryHover) {
        const countryName = getCountryNameFromFeature(d3.select(this).datum())
        const spendingValues = getCountrySpendingWithUSDForMap(spendingData, countryName, filters.yearRange)
        
        callbacks.onCountryHover({
          name: countryName,
          code: getCountryCodeFromMapName(countryName),
          spending: spendingValues.local,
          spendingUSD: spendingValues.usd,
          category: spendingData.category,
          indicatorName: spendingData.name,
          hasData: spendingValues.local !== null,
          x: event.pageX,
          y: event.pageY
        })
      }
    })
    .on('mouseleave', function(_, d) {
      const countryName = getCountryNameFromFeature(d)
      const isSelected = callbacks.selectedCountry && countryName === callbacks.selectedCountry.name
      
      // Restore original stroke
      d3.select(this)
        .attr('stroke', isSelected ? '#ff6b00' : '#333')
        .attr('stroke-width', isSelected ? 3 : 1)
      
      // Hide tooltip
      if (callbacks.onCountryHoverEnd) {
        callbacks.onCountryHoverEnd()
      }
    })
    .on('click', (_, d) => {
      const countryName = getCountryNameFromFeature(d)
      if (!countryName || countryName === 'Unknown Country') return
      
      // Prepare country data
      let countryData = null
      
      if (isCategoryVisualization) {
        const data = spendingData.countries[countryName]
        if (data) {
          countryData = {
            name: countryName,
            code: data.code,
            region: getCountryRegion(countryName),
            spending: { 
              average: data.totalSpending, 
              latest: data.totalSpending, 
              dataPoints: 1,
              dominantCategory: data.dominantCategory,
              categoryBreakdown: data.categories,
              categoryPercentages: data.categoryPercentages
            }
          }
        }
      } else {
        const spendingValue = getCountrySpendingForMap(spendingData, countryName, filters.yearRange)
        if (spendingValue !== null) {
          countryData = {
            name: countryName,
            code: countryName.substring(0, 3).toUpperCase(),
            region: getCountryRegion(countryName),
            spending: { average: spendingValue, latest: spendingValue, dataPoints: 1 }
          }
        }
      }
      
      if (!countryData) return
      
      // Check if clicking on already selected country to deselect
      const isAlreadySelected = callbacks.selectedCountry && countryName === callbacks.selectedCountry.name
      
      if (isAlreadySelected) {
        // Deselect country
        if (callbacks.onCountryClick) {
          callbacks.onCountryClick(null)
        }
      } else {
        // Select country
        if (callbacks.onCountryClick) {
          callbacks.onCountryClick(countryData)
        }
      }
    })
}

/**
 * Calculate country spending statistics for a given year range
 * This is the single source of truth for spending calculations
 */
export function calculateCountrySpending(countryData, yearRange) {
  if (!countryData || !countryData.data) {
    return null
  }
  
  const values = []
  const years = []
  
  Object.entries(countryData.data).forEach(([year, value]) => {
    const y = parseInt(year)
    if (y >= yearRange[0] && y <= yearRange[1] && !isNaN(value) && value !== null) {
      values.push(value)
      years.push(y)
    }
  })
  
  if (values.length === 0) {
    return null
  }
  
  const sortedYears = years.sort((a, b) => a - b)
  const sortedValues = sortedYears.map(y => countryData.data[y])
  
  return {
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    latest: sortedValues[sortedValues.length - 1],
    latestYear: sortedYears[sortedYears.length - 1],
    years: sortedYears,
    dataPoints: values.length
  }
}

function getCountrySpendingForMap(spendingData, countryName, yearRange = [2015, 2022]) {
  if (!spendingData?.countries || !countryName) return null
  
  // Use MapColorService to find country data (handles both code and name lookups)
  const countryData = MapColorService.findCountryData(countryName, spendingData)
  if (!countryData) return null
  
  // CRITICAL FIX: Use USD values for heatmap to ensure consistent comparison across countries
  const spendingValues = getCountrySpendingWithUSDForMap(spendingData, countryName, yearRange)
  
  // Prefer USD values for heatmap, fallback to local if USD not available
  return spendingValues.usd !== null ? spendingValues.usd : spendingValues.local
}

/**
 * Get country spending with both local and USD values for map tooltips
 * Returns both local currency and USD equivalent values
 */
function getCountrySpendingWithUSDForMap(spendingData, countryName, yearRange = [2015, 2022]) {
  if (!spendingData?.countries || !countryName) {
    return { local: null, usd: null }
  }
  
  // Use MapColorService to find country data (handles both code and name lookups)
  const countryData = MapColorService.findCountryData(countryName, spendingData)
  if (!countryData) {
    return { local: null, usd: null }
  }
  
  // Calculate average for both local and USD values
  const localValues = []
  const usdValues = []
  
  if (countryData.data) {
    Object.entries(countryData.data).forEach(([year, value]) => {
      const y = parseInt(year)
      if (y >= yearRange[0] && y <= yearRange[1]) {
        // Handle both old format (number) and new format ({local, usd})
        if (typeof value === 'object' && value !== null) {
          if (!isNaN(value.local) && value.local !== null) {
            localValues.push(value.local)
          }
          if (!isNaN(value.usd) && value.usd !== null) {
            usdValues.push(value.usd)
          }
        } else if (!isNaN(value) && value !== null) {
          // Old format - just a number
          localValues.push(value)
        }
      }
    })
  }
  
  const localAvg = localValues.length > 0 
    ? localValues.reduce((sum, v) => sum + v, 0) / localValues.length 
    : null
  
  const usdAvg = usdValues.length > 0 
    ? usdValues.reduce((sum, v) => sum + v, 0) / usdValues.length 
    : null
  
  return { local: localAvg, usd: usdAvg }
}

function getCountryNameFromFeature(feature) {
  return feature.properties?.NAME || 
         feature.properties?.name || 
         feature.properties?.NAME_EN || 
         feature.properties?.NAME_LONG ||
         feature.properties?.ADMIN ||
         'Unknown Country'
}

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

export function zoomToCountry(svgRef, zoomRef, worldData, countryName) {
  if (!svgRef.current || !zoomRef.current || !worldData || !countryName) {
    console.warn('Missing required parameters for zoomToCountry')
    return
  }

  const svg = d3.select(svgRef.current)
  const container = svgRef.current.parentElement
  const containerRect = container.getBoundingClientRect()
  const width = containerRect.width
  const height = containerRect.height

  // Get the projection and path
  const countries = topojson.feature(worldData, worldData.objects.countries)
  const projection = d3.geoNaturalEarth1()
    .fitSize([width - 40, height - 40], countries)
    .translate([width / 2, (height / 2) - 20])

  const path = d3.geoPath().projection(projection)

  // Find the country feature
  const countryFeature = countries.features.find(d => {
    const featureName = getCountryNameFromFeature(d)
    return featureName === countryName
  })

  if (!countryFeature) {
    console.warn(`Country not found: ${countryName}`)
    return
  }

  // Calculate bounds and zoom parameters
  const bounds = path.bounds(countryFeature)
  const dx = bounds[1][0] - bounds[0][0]
  const dy = bounds[1][1] - bounds[0][1]
  const x = (bounds[0][0] + bounds[1][0]) / 2
  const y = (bounds[0][1] + bounds[1][1]) / 2
  
  // Calculate scale with max zoom of 8
  const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height))
  const translate = [width / 2 - scale * x, height / 2 - scale * y]

  // Animate zoom with 750ms duration
  svg.transition()
    .duration(750)
    .call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    )
}

export function createSpendingColorScale(minValue, maxValue, spendingData = null, colorMode = 'category') {
  if (spendingData) {
    return MapColorService.createMapColorScale(spendingData, colorMode, { minValue, maxValue })
  }
  
  return MapColorService.createDefaultColorScale({ minValue, maxValue })
}