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
  
  const firstCountry = Object.keys(spendingData.countries)[0]
  const firstCountryData = spendingData.countries[firstCountry]
  
  console.log('=== MAP INITIALIZATION ===')
  console.log('Map init:', {
    hasColorScale: !!colorScale,
    colorScaleType: typeof colorScale,
    category: spendingData.category,
    countriesCount: Object.keys(spendingData.countries).length,
    sampleCountry: firstCountry,
    sampleData: firstCountryData,
    filters: filters
  })
  
  if (!colorScale) {
    console.error('ColorScale is null/undefined! Category:', spendingData.category)
    return
  }
  
  // Test the color scale with sample data
  if (firstCountryData?.totalSpending) {
    const testColor = colorScale(firstCountryData.totalSpending)
    console.log('Color scale test:', {
      country: firstCountry,
      spending: firstCountryData.totalSpending,
      resultColor: testColor
    })
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
  
  console.log('Filter processing:', {
    totalCountries: countries.features.length,
    filteredCount: filteredCountries.length,
    filters: filters,
    sampleFiltered: Array.from(filteredCountryNames).slice(0, 5),
    hasSpendingData: !!spendingData?.countries,
    spendingDataKeys: spendingData?.countries ? Object.keys(spendingData.countries).slice(0, 5) : []
  })
  
  // Track color assignments for debugging
  const colorAssignments = []
  
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
        if (spendingValue !== null && !isNaN(spendingValue) && colorScale && typeof colorScale === 'function') {
          finalColor = colorScale(spendingValue)
          
          // Log first 5 countries for debugging
          if (colorAssignments.length < 5) {
            colorAssignments.push({
              country: countryName,
              code: countryData.code,
              spendingValue,
              hasColorScale: !!colorScale,
              colorScaleType: typeof colorScale,
              finalColor,
              passesFilters,
              category: spendingData.category
            })
          }
          
          // Debug specific problematic countries
          if (['Argentina', 'Malaysia', 'Vietnam', 'Morocco', 'Uruguay'].includes(countryName)) {
            console.log(`🎨 Coloring ${countryName}:`, {
              spendingValue,
              finalColor,
              passesFilters,
              hasData: !!countryData,
              dataKeys: countryData ? Object.keys(countryData.data || {}).length : 0
            })
          }
        } else {
          // Debug why color wasn't applied
          if (['Argentina', 'Malaysia', 'Vietnam', 'Morocco', 'Uruguay'].includes(countryName)) {
            console.log(`❌ NOT Coloring ${countryName}:`, {
              spendingValue,
              isNull: spendingValue === null,
              isNaN: isNaN(spendingValue),
              hasColorScale: !!colorScale,
              colorScaleType: typeof colorScale,
              hasCountryData: !!countryData,
              hasData: countryData?.data ? Object.keys(countryData.data).length : 0
            })
          }
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
        const spendingValue = getCountrySpendingForMap(spendingData, countryName, filters.yearRange)
        
        callbacks.onCountryHover({
          name: countryName,
          spending: spendingValue,
          category: spendingData.category,
          indicatorName: spendingData.name,
          hasData: spendingValue !== null,
          x: event.pageX,
          y: event.pageY
        })
      }
    })
    .on('mousemove', function(event) {
      // Update tooltip position
      if (callbacks.onCountryHover) {
        const countryName = getCountryNameFromFeature(d3.select(this).datum())
        const spendingValue = getCountrySpendingForMap(spendingData, countryName, filters.yearRange)
        
        callbacks.onCountryHover({
          name: countryName,
          spending: spendingValue,
          category: spendingData.category,
          indicatorName: spendingData.name,
          hasData: spendingValue !== null,
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
  
  // Log color assignments after all countries are processed
  if (colorAssignments.length > 0) {
    console.log('=== 🎨 COLOR ASSIGNMENTS (First 5 countries) ===')
    colorAssignments.forEach(assignment => {
      console.log(`${assignment.country} (${assignment.code}):`, {
        category: assignment.category,
        spending: assignment.spendingValue,
        color: assignment.finalColor,
        passes: assignment.passesFilters,
        hasScale: assignment.hasColorScale
      })
    })
  } else {
    console.warn('⚠️  NO COLOR ASSIGNMENTS - Check if colorScale is working!')
  }
  
  console.log('=== MAP RENDER COMPLETE ===')
  console.log(`Total countries rendered: ${countries.features.length}`)
  console.log(`Countries passing filters: ${filteredCountries.length}`)
}

function getCountrySpendingForMap(spendingData, countryName, yearRange = [2015, 2023]) {
  if (!spendingData?.countries || !countryName) return null
  
  // Use MapColorService to find country data (handles both code and name lookups)
  const countryData = MapColorService.findCountryData(countryName, spendingData)
  if (!countryData || !countryData.data) return null
  
  // getIndicatorData returns: countries[name] = { name, code, data: {year: value} }
  // Calculate average spending for the year range
  const values = []
  const allYears = Object.keys(countryData.data)
  
  Object.entries(countryData.data).forEach(([year, value]) => {
    const y = parseInt(year)
    if (y >= yearRange[0] && y <= yearRange[1] && !isNaN(value) && value !== null) {
      values.push(value)
    }
  })
  
  // Debug problematic countries
  const problematicCountries = ['Argentina', 'Malaysia', 'Vietnam', 'Morocco', 'Uruguay', 'Mozambique']
  if (problematicCountries.includes(countryName)) {
    console.log(`📊 getCountrySpendingForMap for ${countryName}:`, {
      hasData: !!countryData.data,
      allYears: allYears,
      yearRange,
      valuesInRange: values.length,
      avgSpending: values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null
    })
  }
  
  if (values.length === 0) return null
  
  return values.reduce((sum, v) => sum + v, 0) / values.length
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