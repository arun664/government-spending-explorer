import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { getDataPath } from '../../../utils/pathUtils.js'
import SearchBar from './SearchBar.jsx';
import Filters from './Filters.jsx';
import ZoomControls from './ZoomControls.jsx';
import Legend from './Legend.jsx';
import InfoPanel from './InfoPanel.jsx';
import CompareView from './CompareView.jsx';
import '../styles/GDPAnalysis.css'

const GDPAnalysis = ({ compareMode = false, showGDPView = true, onLoadingChange }) => {
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const zoomRef = useRef(null)
  
  const [gdpData, setGdpData] = useState({})
  const [filteredCountries, setFilteredCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedCountries, setSelectedCountries] = useState([]) // For search selections
  const [colorScale, setColorScale] = useState(null)
  const [extent, setExtent] = useState([0, 20])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLabels, setShowLabels] = useState(false) // Toggle for labels
  const [allYears, setAllYears] = useState({ min: 2005, max: 2023 })
  const [filters, setFilters] = useState({
    regions: [],
    yearRange: [2005, 2023],
    gdpRange: [-100, 100],
    countries: [] // Selected countries from search
  })
  const [globalStats, setGlobalStats] = useState(null)
  const [showUSDeepDive, setShowUSDeepDive] = useState(false)
  const [showTopPerformers, setShowTopPerformers] = useState(false)
  const [showBottomPerformers, setShowBottomPerformers] = useState(false)
  const [activeInsightTab, setActiveInsightTab] = useState('global') // 'global' or 'country'

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (Object.keys(gdpData).length > 0) {
      applyFilters()
    }
  }, [gdpData, filters])

  // Sync loading state with parent component
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading)
    }
  }, [loading, onLoadingChange])

  useEffect(() => {
    if (filteredCountries.length > 0) {
      drawMap()
    }
  }, [filteredCountries, selectedCountry])

  useEffect(() => {
    // Update label visibility when toggle changes
    if (svgRef.current && gRef.current) {
      const currentZoom = zoomRef.current ? d3.zoomTransform(svgRef.current).k : 1
      const g = d3.select(gRef.current)
      
      if (!showLabels) {
        g.selectAll('.country-label').style('opacity', 0)
      } else {
        // Re-apply zoom-based visibility
        const svg = d3.select(svgRef.current)
        const event = d3.zoomTransform(svg.node())
        if (event) {
          g.selectAll('.country-label').each(function(d) {
            // Will be updated by the zoom handler
          })
        }
      }
    }
  }, [showLabels])

  // Helper function to normalize country names for matching
  const normalizeCountryName = (name) => {
    const nameMap = {
      // ...existing code from InfoPanel.jsx...
      'United States of America': 'United States',
      'United States': 'United States',
      'USA': 'United States',
      'Russia': 'Russian Federation',
      'Russian Federation': 'Russian Federation',
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
      'Timor-Leste': 'Timor-Leste',
      'Brunei': 'Brunei Darussalam',
      'Kyrgyzstan': 'Kyrgyz Republic',
      'Palestine': 'West Bank and Gaza',
      'West Bank and Gaza': 'West Bank and Gaza',
      'Turkey': 'Turkiye',
      'Türkiye': 'Turkiye'
    };
    return nameMap[name] || name;
  };

  // Helper function to find country by name (with normalization)
  const findCountryByName = (mapName, gdpData) => {
    const normalizedMapName = normalizeCountryName(mapName);
    
    // Try direct match first
    let country = Object.values(gdpData).find(c => c.name === normalizedMapName);
    if (country) return country;
    
    // Try original name
    country = Object.values(gdpData).find(c => c.name === mapName);
    if (country) return country;
    
    // Try case-insensitive partial match
    country = Object.values(gdpData).find(c => 
      c.name.toLowerCase().includes(mapName.toLowerCase()) ||
      mapName.toLowerCase().includes(c.name.toLowerCase())
    );
    
    return country;
  };
  
  // Helper function to determine region from country code
  const getRegion = (code) => {
    const regionMap = {
      // Africa
      'DZA': 'Africa', 'AGO': 'Africa', 'BEN': 'Africa', 'BWA': 'Africa', 'BFA': 'Africa',
      'BDI': 'Africa', 'CMR': 'Africa', 'CPV': 'Africa', 'CAF': 'Africa', 'TCD': 'Africa',
      'COM': 'Africa', 'COG': 'Africa', 'COD': 'Africa', 'CIV': 'Africa', 'DJI': 'Africa',
      'EGY': 'Africa', 'GNQ': 'Africa', 'ERI': 'Africa', 'ETH': 'Africa', 'GAB': 'Africa',
      'GMB': 'Africa', 'GHA': 'Africa', 'GIN': 'Africa', 'GNB': 'Africa', 'KEN': 'Africa',
      'LSO': 'Africa', 'LBR': 'Africa', 'LBY': 'Africa', 'MDG': 'Africa', 'MWI': 'Africa',
      'MLI': 'Africa', 'MRT': 'Africa', 'MUS': 'Africa', 'MAR': 'Africa', 'MOZ': 'Africa',
      'NAM': 'Africa', 'NER': 'Africa', 'NGA': 'Africa', 'RWA': 'Africa', 'STP': 'Africa',
      'SEN': 'Africa', 'SYC': 'Africa', 'SLE': 'Africa', 'SOM': 'Africa', 'ZAF': 'Africa',
      'SSD': 'Africa', 'SDN': 'Africa', 'SWZ': 'Africa', 'TZA': 'Africa', 'TGO': 'Africa',
      'TUN': 'Africa', 'UGA': 'Africa', 'ZMB': 'Africa', 'ZWE': 'Africa',
      
      // Asia
      'AFG': 'Asia', 'ARM': 'Asia', 'AZE': 'Asia', 'BHR': 'Asia', 'BGD': 'Asia',
      'BTN': 'Asia', 'BRN': 'Asia', 'KHM': 'Asia', 'CHN': 'Asia', 'GEO': 'Asia',
      'IND': 'Asia', 'IDN': 'Asia', 'IRN': 'Asia', 'IRQ': 'Asia', 'ISR': 'Asia',
      'JPN': 'Asia', 'JOR': 'Asia', 'KAZ': 'Asia', 'KWT': 'Asia', 'KGZ': 'Asia',
      'LAO': 'Asia', 'LBN': 'Asia', 'MYS': 'Asia', 'MDV': 'Asia', 'MNG': 'Asia',
      'MMR': 'Asia', 'NPL': 'Asia', 'PRK': 'Asia', 'OMN': 'Asia', 'PAK': 'Asia',
      'PSE': 'Asia', 'PHL': 'Asia', 'QAT': 'Asia', 'SAU': 'Asia', 'SGP': 'Asia',
      'KOR': 'Asia', 'LKA': 'Asia', 'SYR': 'Asia', 'TWN': 'Asia', 'TJK': 'Asia',
      'THA': 'Asia', 'TLS': 'Asia', 'TUR': 'Asia', 'TKM': 'Asia', 'ARE': 'Asia',
      'UZB': 'Asia', 'VNM': 'Asia', 'YEM': 'Asia', 'HKG': 'Asia', 'MAC': 'Asia',
      
      // Europe
      'ALB': 'Europe', 'AND': 'Europe', 'AUT': 'Europe', 'BLR': 'Europe', 'BEL': 'Europe',
      'BIH': 'Europe', 'BGR': 'Europe', 'HRV': 'Europe', 'CYP': 'Europe', 'CZE': 'Europe',
      'DNK': 'Europe', 'EST': 'Europe', 'FIN': 'Europe', 'FRA': 'Europe', 'DEU': 'Europe',
      'GRC': 'Europe', 'HUN': 'Europe', 'ISL': 'Europe', 'IRL': 'Europe', 'ITA': 'Europe',
      'XKX': 'Europe', 'LVA': 'Europe', 'LIE': 'Europe', 'LTU': 'Europe', 'LUX': 'Europe',
      'MKD': 'Europe', 'MLT': 'Europe', 'MDA': 'Europe', 'MCO': 'Europe', 'MNE': 'Europe',
      'NLD': 'Europe', 'NOR': 'Europe', 'POL': 'Europe', 'PRT': 'Europe', 'ROU': 'Europe',
      'RUS': 'Europe', 'SMR': 'Europe', 'SRB': 'Europe', 'SVK': 'Europe', 'SVN': 'Europe',
      'ESP': 'Europe', 'SWE': 'Europe', 'CHE': 'Europe', 'UKR': 'Europe', 'GBR': 'Europe',
      'VAT': 'Europe', 'GRL': 'Europe',
      
      // North America
      'ATG': 'North America', 'BHS': 'North America', 'BRB': 'North America', 'BLZ': 'North America',
      'CAN': 'North America', 'CRI': 'North America', 'CUB': 'North America', 'DMA': 'North America',
      'DOM': 'North America', 'SLV': 'North America', 'GRD': 'North America', 'GTM': 'North America',
      'HTI': 'North America', 'HND': 'North America', 'JAM': 'North America', 'MEX': 'North America',
      'NIC': 'North America', 'PAN': 'North America', 'KNA': 'North America', 'LCA': 'North America',
      'VCT': 'North America', 'TTO': 'North America', 'USA': 'North America',
      
      // South America
      'ARG': 'South America', 'BOL': 'South America', 'BRA': 'South America', 'CHL': 'South America',
      'COL': 'South America', 'ECU': 'South America', 'GUY': 'South America', 'PRY': 'South America',
      'PER': 'South America', 'SUR': 'South America', 'URY': 'South America', 'VEN': 'South America',
      
      // Oceania
      'AUS': 'Oceania', 'FJI': 'Oceania', 'KIR': 'Oceania', 'MHL': 'Oceania', 'FSM': 'Oceania',
      'NRU': 'Oceania', 'NZL': 'Oceania', 'PLW': 'Oceania', 'PNG': 'Oceania', 'WSM': 'Oceania',
      'SLB': 'Oceania', 'TON': 'Oceania', 'TUV': 'Oceania', 'VUT': 'Oceania'
    };
    
    return regionMap[code] || 'Other';
  };  const
 applyFilters = () => {
    const countries = Object.values(gdpData)
    
    // Calculate average GDP growth for the selected year range
    const filteredWithAverage = countries.map(country => {
      // Filter data points within year range
      const dataInRange = country.data.filter(d => 
        d.year >= filters.yearRange[0] && d.year <= filters.yearRange[1]
      )
      
      // Calculate average growth for the year range
      if (dataInRange.length > 0) {
        const avgGrowth = dataInRange.reduce((sum, d) => sum + d.growth, 0) / dataInRange.length
        return {
          ...country,
          avgGrowth: avgGrowth,
          dataPointsInRange: dataInRange.length
        }
      }
      
      return {
        ...country,
        avgGrowth: null,
        dataPointsInRange: 0
      }
    })
    
    const filtered = filteredWithAverage.filter(country => {
      // Check if country has valid data in the year range
      if (country.avgGrowth === null || isNaN(country.avgGrowth)) return false
      
      // When region is selected, apply region filter first and ignore GDP range
      if (filters.regions.length > 0) {
        const countryRegion = getRegion(country.code);
        if (!filters.regions.includes(countryRegion)) return false
        
        // Still allow individual country selection within region
        if (filters.countries.length > 0) {
          if (!filters.countries.some(c => c.code === country.code)) return false
        }
        return true
      }
      
      // If no regions selected, apply country filter (from search)
      if (filters.countries.length > 0) {
        if (!filters.countries.some(c => c.code === country.code)) return false
      }
      
      // Apply GDP range filter (only when no regions selected)
      if (country.avgGrowth < filters.gdpRange[0] || country.avgGrowth > filters.gdpRange[1]) return false
      
      return true
    })
    
    // Recalculate color scale extent based on filtered average values
    const avgGrowthValues = filtered
      .map(c => c.avgGrowth)
      .filter(g => g !== null && !isNaN(g))
    
    if (avgGrowthValues.length > 0) {
      const dataExtent = d3.extent(avgGrowthValues)
      setExtent(dataExtent)
      
      // Update color scale
      const scale = d3.scaleSequential()
        .domain(dataExtent)
        .interpolator(d3.interpolateRdYlGn)
      setColorScale(() => scale)
    }
    
    // Calculate global statistics for insights
    if (filtered.length > 0) {
      const avgGlobal = avgGrowthValues.reduce((a, b) => a + b, 0) / avgGrowthValues.length
      const maxGrowth = Math.max(...avgGrowthValues)
      const minGrowth = Math.min(...avgGrowthValues)
      const maxCountry = filtered.find(c => c.avgGrowth === maxGrowth)
      const minCountry = filtered.find(c => c.avgGrowth === minGrowth)
      
      // Get top 10 and bottom 10 performers
      const sortedByGrowth = [...filtered].sort((a, b) => b.avgGrowth - a.avgGrowth)
      const top10 = sortedByGrowth.slice(0, 10)
      const bottom10 = sortedByGrowth.slice(-10).reverse()
      
      // Calculate data availability
      const totalAllCountries = Object.keys(gdpData).length
      const countriesWithData = filtered.length
      const countriesInScope = filters.countries && filters.countries.length > 0 
        ? filters.countries.map(c => c.code)
        : Object.keys(gdpData)
      const countriesWithoutData = countriesInScope.filter(code => {
        const country = filteredWithAverage.find(c => c.code === code)
        return !country || country.avgGrowth === null
      }).length
      
      setGlobalStats({
        avgGrowth: avgGlobal,
        maxGrowth,
        minGrowth,
        maxCountry: maxCountry?.name,
        minCountry: minCountry?.name,
        totalCountries: filtered.length,
        totalAllCountries,
        countriesWithoutData,
        yearRange: filters.yearRange,
        top10,
        bottom10
      })
    } else {
      setGlobalStats(null)
    }
    
    setFilteredCountries(filtered)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load world map and GDP data
      const [worldData, gdpCSV] = await Promise.all([
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        d3.csv(getDataPath('gdp_clean.csv'))
      ])

      // Regional aggregate codes to filter out (these are not individual countries)
      const regionalCodes = new Set([
        'ARB', 'CSS', 'CEB', 'EAR', 'EAS', 'EAP', 'TEA', 'EMU', 'ECS', 'ECA', 'TEC',
        'EUU', 'FCS', 'HPC', 'HIC', 'IBD', 'IBT', 'IDB', 'IDX', 'IDA', 'LTE', 'LCN',
        'LAC', 'TLA', 'LDC', 'LMY', 'LIC', 'LMC', 'MEA', 'MNA', 'TMN', 'MIC', 'NAC',
        'OED', 'OSS', 'PSS', 'PST', 'PRE', 'SST', 'SAS', 'TSA', 'SSF', 'SSA', 'TSS',
        'UMC', 'WLD'
      ])

      // Process GDP data
      const processedGDP = {}
      gdpCSV.forEach(d => {
        const code = d['Country Code']
        const year = +d.Year
        const growth = +d['GDP Growth']
        
        // Skip regional aggregates
        if (regionalCodes.has(code)) return
        
        if (!processedGDP[code]) {
          processedGDP[code] = {
            name: d['Country Name'],
            code: code,
            data: []
          }
        }
        processedGDP[code].data.push({ year, growth })
      })

      // Sort and get latest GDP for each country
      Object.keys(processedGDP).forEach(code => {
        processedGDP[code].data.sort((a, b) => b.year - a.year)
        processedGDP[code].latest = processedGDP[code].data[0]
      })

      // Get min and max years from data
      const allYearValues = gdpCSV.map(d => +d.Year)
      const minYear = Math.min(...allYearValues)
      const maxYear = Math.max(...allYearValues)
      setAllYears({ min: minYear, max: maxYear })
      setFilters(prev => ({
        ...prev,
        yearRange: [minYear, maxYear]
      }))

      // Calculate extent for color scale from filtered data
      const growthValues = Object.values(processedGDP)
        .map(d => d.latest?.growth)
        .filter(d => d !== undefined && !isNaN(d))
      
      const dataExtent = growthValues.length > 0 
        ? d3.extent(growthValues)
        : [-10, 20] // Default extent if no data
      
      setExtent(dataExtent)

      // Create color scale - using a more visible color scheme
      const scale = d3.scaleSequential()
        .domain(dataExtent)
        .interpolator(d3.interpolateRdYlGn)
      
      setColorScale(() => scale)

      setGdpData(processedGDP)
      
      // Store world data for drawing
      window.worldMapData = worldData
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load GDP data. Please check your connection and try again.')
      setLoading(false)
    }
  }
  
  const drawMap = () => {
    if (!window.worldMapData || !colorScale) return

    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    // Clear existing content to prevent duplicates
    g.selectAll('*').remove()

    const width = window.innerWidth - 630 // Account for left filters (270px) and right insights (360px) panels
    const height = window.innerHeight // Full viewport height now available
    
    svg.attr('width', width)
      .attr('height', height)

    // Convert TopoJSON to GeoJSON first to get bounds
    const allCountries = topojson.feature(
      window.worldMapData,
      window.worldMapData.objects.countries
    )
    
    // Filter out Antarctica which has no data
    const countries = {
      ...allCountries,
      features: allCountries.features.filter(f => f.properties.name !== 'Antarctica')
    }

    // Setup projection to fit the map with more space
    const projection = d3.geoMercator()
      .fitSize([width - 60, height - 60], countries) // Less margin needed now
    
    // Center the projection within the available space
    const [x, y] = projection.translate()
    projection.translate([x, y]) // No adjustment needed with full height

    const path = d3.geoPath().projection(projection)

    // Create separate groups for countries and labels
    const countriesGroup = g.append('g').attr('class', 'countries-group')
    const labelsGroup = g.append('g').attr('class', 'labels-group')
    
    // Setup zoom with drag enabled and label update on zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 20])
      .on('zoom', (event) => {
        // Apply transformation only to the countries group
        countriesGroup.attr('transform', event.transform)
        
        // For labels, reposition but keep font size consistent
        labelsGroup.selectAll('.country-label')
          .attr('transform', function(d) {
            const centroid = path.centroid(d)
            // Apply zoom translation to centroid, but no scaling to labels
            return `translate(${centroid[0] * event.transform.k + event.transform.x}, 
                              ${centroid[1] * event.transform.k + event.transform.y})`
          })
        
        // Update label visibility based on zoom level
        updateLabelVisibility(event.transform.k)
      })

    svg.call(zoom)
    zoomRef.current = zoom

    // Function to update label visibility based on zoom level
    const updateLabelVisibility = (zoomLevel) => {
      if (!showLabels) {
        // If labels are toggled off, hide all
        labelsGroup.selectAll('.country-label').style('opacity', 0)
        return
      }

      labelsGroup.selectAll('.country-label').each(function(d) {
        const countryGDP = findCountryByName(d.properties.name, gdpData)
        if (!countryGDP || !countryGDP.latest) {
          d3.select(this).style('opacity', 0)
          return
        }

        const bbox = path.bounds(d)
        const width = bbox[1][0] - bbox[0][0]
        const height = bbox[1][1] - bbox[0][1]
        const area = width * height

        // Major countries/regions - only truly large countries
        const majorCountries = ['USA', 'CAN', 'MEX', 'BRA', 'ARG', 'RUS', 'CHN', 'IND', 
                                'AUS', 'SAU', 'DZA', 'LBY', 'COD', 'SDN']
        
        const isMajor = majorCountries.includes(countryGDP.code)
        
        // Progressive label visibility based on zoom with inverse font scaling
        let opacity = 0
        // Base font size inversely scales with zoom to keep visual size consistent
        let fontSize = Math.max(5, 7 / zoomLevel) // Shrinks as zoom increases
        
        if (zoomLevel >= 12) {
          // Maximum zoom: show all countries with very small font
          opacity = 0.85
          fontSize = Math.max(4, 7 / zoomLevel)
        } else if (zoomLevel >= 8) {
          // Very high zoom: show most countries
          if (isMajor || area > 400) {
            opacity = 0.8
            fontSize = Math.max(4, 7 / zoomLevel)
          } else if (area > 200) {
            opacity = 0.7
            fontSize = Math.max(3.5, 6 / zoomLevel)
          }
        } else if (zoomLevel >= 5) {
          // High zoom: show major + medium countries
          if (isMajor || area > 1000) {
            opacity = 0.75
            fontSize = Math.max(4.5, 7 / zoomLevel)
          } else if (area > 600) {
            opacity = 0.65
            fontSize = Math.max(4, 6 / zoomLevel)
          }
        } else if (zoomLevel >= 3) {
          // Medium zoom: major + large countries
          if (isMajor || area > 2000) {
            opacity = 0.7
            fontSize = Math.max(5, 7 / zoomLevel)
          } else if (area > 1200) {
            opacity = 0.5
            fontSize = Math.max(4.5, 6 / zoomLevel)
          }
        } else if (zoomLevel >= 1.5) {
          // Low zoom: only major countries
          if (isMajor && area > 1000) {
            opacity = 0.65
            fontSize = 6
          }
        } else {
          // Default zoom: only very large major countries
          if (isMajor && area > 3000) {
            opacity = 0.6
            fontSize = 7
          }
        }
        
        d3.select(this)
          .style('opacity', opacity)
          .style('font-size', `${fontSize}px`)
          .style('letter-spacing', '0.5px')
      })
    }

    // Draw countries
    const countryPaths = countriesGroup.selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', d => {
        // Find country in filteredCountries (which has avgGrowth)
        // Use normalized name matching instead of direct comparison
        const mapCountry = findCountryByName(d.properties.name, gdpData)
        const countryGDP = mapCountry ? filteredCountries.find(
          c => c.code === mapCountry.code
        ) : null
        
        // Use average growth if available, otherwise check in full gdpData
        if (countryGDP && countryGDP.avgGrowth !== null && !isNaN(countryGDP.avgGrowth)) {
          const color = colorScale(countryGDP.avgGrowth)
          return color
        }
        
        // Fallback to original gdpData if not in filtered
        const originalCountry = findCountryByName(d.properties.name, gdpData)
        if (originalCountry && originalCountry.latest && !isNaN(originalCountry.latest.growth)) {
          // Country exists but not in year range - show dimmed
          return '#e0e0e0'
        }
        
        return '#e0e0e0'
      })
      .attr('stroke', d => {
        const countryGDP = findCountryByName(d.properties.name, gdpData)
        
        // Check if country is selected
        if (selectedCountry && countryGDP && countryGDP.code === selectedCountry.code) {
          return '#ff6b00'
        }
        
        // Check if country's region is in selected regions
        if (filters.regions.length > 0 && countryGDP) {
          const countryRegion = getRegion(countryGDP.code)
          if (filters.regions.includes(countryRegion)) {
            return '#667eea' // Purple highlight for selected regions
          }
        }
        
        return '#fff'
      })
      .attr('stroke-width', d => {
        const countryGDP = findCountryByName(d.properties.name, gdpData)
        
        // Thicker stroke for selected country
        if (selectedCountry && countryGDP && countryGDP.code === selectedCountry.code) {
          return 3
        }
        
        // Medium stroke for selected regions
        if (filters.regions.length > 0 && countryGDP) {
          const countryRegion = getRegion(countryGDP.code)
          if (filters.regions.includes(countryRegion)) {
            return 2
          }
        }
        
        return 0.5
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const countryGDP = findCountryByName(d.properties.name, gdpData)
        if (countryGDP) {
          handleCountrySelect(countryGDP)
        }
      })
      .on('mouseenter', function(event, d) {
        const countryGDP = findCountryByName(d.properties.name, gdpData)
        const isSelected = selectedCountry && countryGDP && countryGDP.code === selectedCountry.code
        
        if (!isSelected) {
          d3.select(this)
            .attr('stroke', '#333')
            .attr('stroke-width', 2)
        }
      })
      .on('mouseleave', function(event, d) {
        const countryGDP = findCountryByName(d.properties.name, gdpData)
        const isSelected = selectedCountry && countryGDP && countryGDP.code === selectedCountry.code
        
        if (!isSelected) {
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
        }
      })
      .append('title')
      .text(d => {
        const countryGDP = filteredCountries.find(
          c => c.name === d.properties.name
        )
        if (countryGDP && countryGDP.avgGrowth !== null) {
          const yearRangeText = filters.yearRange[0] === filters.yearRange[1] 
            ? `${filters.yearRange[0]}`
            : `${filters.yearRange[0]}-${filters.yearRange[1]}`
          return `${d.properties.name}\nAvg GDP Growth (${yearRangeText}): ${countryGDP.avgGrowth.toFixed(2)}%\nData points: ${countryGDP.dataPointsInRange}`
        }
        return d.properties.name
      })

    // Add country labels with better centering and clarity
    labelsGroup.selectAll('text')
      .data(countries.features)
      .enter()
      .append('text')
      .attr('class', 'country-label')
      .attr('transform', d => {
        const centroid = path.centroid(d)
        return `translate(${centroid[0]}, ${centroid[1]})`
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '8px')
      .attr('font-weight', '800')
      .attr('font-family', 'Arial Black, Arial, sans-serif')
      .attr('fill', '#1a1a2e')
      .attr('pointer-events', 'none')
      .style('opacity', 0)
      .style('user-select', 'none')
      .text(d => {
        const countryGDP = findCountryByName(d.properties.name, gdpData)
        return countryGDP ? countryGDP.code : ''
      })

    // Update label visibility immediately
    updateLabelVisibility(1)
  }

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(zoomRef.current.scaleBy, 1.5)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(zoomRef.current.scaleBy, 0.67)
    }
  }

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity)
    }
  }

  const handleCountrySelect = (country) => {
    // Toggle country selection - if already selected, deselect it
    setFilters(prev => {
      const countries = prev.countries || [];
      const exists = countries.some(c => c.code === country.code);
      
      if (exists) {
        // Deselect - remove from list
        const newCountries = countries.filter(c => c.code !== country.code);
        
        // If no countries left, close country tab
        if (newCountries.length === 0) {
          setSelectedCountry(null);
          setActiveInsightTab('global');
        } else {
          // Update selectedCountry to show combined stats
          setSelectedCountry(newCountries.length === 1 ? newCountries[0] : { 
            name: 'Multiple Countries', 
            code: 'MULTI',
            countries: newCountries 
          });
        }
        
        return {
          ...prev,
          countries: newCountries
        };
      } else {
        // Select - add to list
        const newCountries = [...countries, country];
        
        // Set selectedCountry for info panel
        setSelectedCountry(newCountries.length === 1 ? newCountries[0] : { 
          name: 'Multiple Countries', 
          code: 'MULTI',
          countries: newCountries 
        });
        setActiveInsightTab('country'); // Switch to country tab
        
        return {
          ...prev,
          countries: newCountries
        };
      }
    });
  }

  const handleSearchSelect = (country) => {
    // Toggle country selection - if already selected, deselect it
    setFilters(prev => {
      const countries = prev.countries || [];
      const exists = countries.some(c => c.code === country.code);
      
      if (exists) {
        // Deselect - remove from list
        const newCountries = countries.filter(c => c.code !== country.code);
        
        // If no countries left, close country tab
        if (newCountries.length === 0) {
          setSelectedCountry(null);
          setActiveInsightTab('global');
        } else {
          // Update selectedCountry to show combined stats
          setSelectedCountry(newCountries.length === 1 ? newCountries[0] : { 
            name: 'Multiple Countries', 
            code: 'MULTI',
            countries: newCountries 
          });
        }
        
        return {
          ...prev,
          countries: newCountries
        };
      } else {
        // Select - add to list
        const newCountries = [...countries, country];
        
        // Set selectedCountry for info panel
        setSelectedCountry(newCountries.length === 1 ? newCountries[0] : { 
          name: 'Multiple Countries', 
          code: 'MULTI',
          countries: newCountries 
        });
        setActiveInsightTab('country'); // Switch to country tab
        
        return {
          ...prev,
          countries: newCountries
        };
      }
    });
  }

  const handleRemoveCountry = (countryCode) => {
    setFilters(prev => {
      const newCountries = prev.countries.filter(c => c.code !== countryCode);
      
      // Update selectedCountry based on remaining countries
      if (newCountries.length === 0) {
        setSelectedCountry(null);
        setActiveInsightTab('global');
      } else {
        setSelectedCountry(newCountries.length === 1 ? newCountries[0] : { 
          name: 'Multiple Countries', 
          code: 'MULTI',
          countries: newCountries 
        });
      }
      
      return {
        ...prev,
        countries: newCountries
      };
    });
  }

  const handleClosePanel = () => {
    setSelectedCountry(null)
    setActiveInsightTab('global') // Switch back to global tab
    // Clear all selected countries when closing the tab
    setFilters(prev => ({
      ...prev,
      countries: []
    }))
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  // If compare mode is active, show CompareView
  if (compareMode) {
    const selectedCountriesData = filters.countries.map(code => 
      Object.values(gdpData).find(c => c.code === code)
    ).filter(Boolean)

    // If two countries are selected and no data, show a message
    if (selectedCountriesData.length === 2 && selectedCountriesData.every(c => !c.data || c.data.length === 0)) {
      return (
        <div className="no-data-message">
          <p>No data available for the selected countries in this period.</p>
        </div>
      );
    }

    return (
      <CompareView 
        selectedCountries={selectedCountriesData.length > 0 ? selectedCountriesData : Object.values(gdpData).slice(0, 5)}
        gdpData={gdpData}
        yearRange={filters.yearRange}
        showGDPView={showGDPView}
      />
    )
  }

  return (
    <div className="world-map-container">
      <div className="gdp-header">
        <div className="header-left">
          <h2>GDP Analysis Dashboard</h2>
          <p>Interactive GDP growth analysis with country comparisons</p>
        </div>
      </div>

      {/* Centered Search Bar */}
      <div className="search-bar-container">
        <SearchBar
          countries={Object.values(gdpData).map(country => ({
            countryName: country.name,
            countryCode: country.code,
            region: getRegion(country.code)
          }))} 
          onCountrySelect={(selectedCountry) => {
            // Find the country in gdpData and call handleSearchSelect
            const countryData = Object.values(gdpData).find(c => c.code === selectedCountry.countryCode)
            if (countryData) {
              handleSearchSelect(countryData)
            }
          }}
          placeholder="Search countries by name or code..."
        />
      </div>

      {/* Unified Insights Panel with Tabs */}
      <div className="insights-panel">
        {/* Tab Headers */}
        <div className="insights-tabs">
          <button 
            className={`tab-button ${activeInsightTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveInsightTab('global')}
          >
            <span className="tab-icon">🌍</span>
            Global Insights
          </button>
          <button 
            className={`tab-button ${activeInsightTab === 'country' ? 'active' : ''}`}
            onClick={() => setActiveInsightTab('country')}
            disabled={!selectedCountry}
          >
            <span className="tab-icon">{selectedCountry?.code === 'MULTI' ? '🏴🏴' : '🏴'}</span>
            {selectedCountry 
              ? (selectedCountry.code === 'MULTI' 
                  ? `${selectedCountry.countries.length} Countries` 
                  : selectedCountry.name)
              : 'Country'}
          </button>
          {selectedCountry && activeInsightTab === 'country' && (
            <button className="close-tab-btn" onClick={handleClosePanel} title="Close country view">
              ×
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Global Insights Tab */}
          {activeInsightTab === 'global' && globalStats && (
            <div className="global-insights-content">
              <div className="insights-header">
                <h3>
                  {filters.countries && filters.countries.length > 0 
                    ? 'SELECTED COUNTRIES INSIGHTS' 
                    : 'GLOBAL INSIGHTS'}
                </h3>
                <span className="year-range-badge">
                  {globalStats.yearRange[0] === globalStats.yearRange[1] 
                    ? globalStats.yearRange[0]
                    : `${globalStats.yearRange[0]} - ${globalStats.yearRange[1]}`
                  }
                </span>
              </div>

              {/* Data Availability Warning */}
              {globalStats.countriesWithoutData > 0 && (
                <div className="data-warning">
                  <span className="warning-icon">⚠️</span>
                  <div className="warning-text">
                    <strong>
                      {globalStats.countriesWithoutData} {globalStats.countriesWithoutData === 1 ? 'country has' : 'countries have'}
                    </strong> no data in this period
                  </div>
                </div>
              )}

              <div className="insights-grid">
                <div className="insight-card">
                  <span className="insight-label">Average Growth</span>
                  <span className="insight-value">{globalStats.avgGrowth.toFixed(2)}%</span>
                  {filters.countries && filters.countries.length > 0 && (
                    <span className="insight-subvalue">selected only</span>
                  )}
                </div>
                <div className="insight-card">
                  <span className="insight-label">Countries with Data</span>
                  <span className="insight-value">{globalStats.totalCountries}</span>
                  <span className="insight-subvalue">
                    {filters.countries && filters.countries.length > 0 
                      ? `of ${filters.countries.length} selected`
                      : `of ${globalStats.totalAllCountries} total`}
                  </span>
                </div>
                <div className="insight-card highlight">
                  <span className="insight-label">Top Performer</span>
                  <span className="insight-value">{globalStats.maxCountry}</span>
                  <span className="insight-subvalue">{globalStats.maxGrowth.toFixed(2)}%</span>
                </div>
                <div className="insight-card highlight">
                  <span className="insight-label">Lowest Growth</span>
                  <span className="insight-value">{globalStats.minCountry}</span>
                  <span className="insight-subvalue">{globalStats.minGrowth.toFixed(2)}%</span>
                </div>
              </div>

              {/* Top 10 Performers Accordion */}
              <div className="accordion">
                <button 
                  className={`accordion-header ${showTopPerformers ? 'active' : ''}`}
                  onClick={() => setShowTopPerformers(!showTopPerformers)}
                >
                  <span>🏆 Top 10 Performers</span>
                  <span className="accordion-icon">{showTopPerformers ? '−' : '+'}</span>
                </button>
                {showTopPerformers && (
                  <div className="accordion-content">
                    <table className="performers-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Country</th>
                          <th>Avg Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {globalStats.top10.map((country, index) => (
                          <tr key={country.code}>
                            <td className="rank">{index + 1}</td>
                            <td className="country-name">{country.name}</td>
                            <td className="growth-value positive">{country.avgGrowth.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom 10 Performers Accordion */}
              <div className="accordion">
                <button 
                  className={`accordion-header ${showBottomPerformers ? 'active' : ''}`}
                  onClick={() => setShowBottomPerformers(!showBottomPerformers)}
                >
                  <span>📉 Bottom 10 Performers</span>
                  <span className="accordion-icon">{showBottomPerformers ? '−' : '+'}</span>
                </button>
                {showBottomPerformers && (
                  <div className="accordion-content">
                    <table className="performers-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Country</th>
                          <th>Avg Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {globalStats.bottom10.map((country, index) => (
                          <tr key={country.code}>
                            <td className="rank">{index + 1}</td>
                            <td className="country-name">{country.name}</td>
                            <td className="growth-value negative">{country.avgGrowth.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Country Insights Tab */}
          {activeInsightTab === 'country' && selectedCountry && (
            <InfoPanel
              country={selectedCountry}
              onClose={handleClosePanel}
              yearRange={filters.yearRange}
              embedded={true}
              compareMode={compareMode}
            />
          )}
        </div>
      </div>
      
      <Filters
        onFilterChange={handleFilterChange}
        minYear={allYears.min}
        maxYear={allYears.max}
        selectedCountries={filters.countries || []}
        onRemoveCountry={handleRemoveCountry}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        availableCountries={Object.values(gdpData).map(country => ({
          name: country.name,
          code: country.code,
          region: getRegion(country.code)
        }))}
        onCountrySelect={handleSearchSelect}
      />
      
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
      />
      
      <Legend extent={extent} colorScale={colorScale} />
      
      <svg ref={svgRef}>
        <g ref={gRef}></g>
      </svg>
      

    </div>
  )
}

export default GDPAnalysis