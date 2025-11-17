/**
 * GdpExpenseChart - Dual-line chart for GDP vs Expense Growth
 * 
 * Features:
 * - Two lines: GDP growth and Expense growth
 * - Timeline view (years on x-axis)
 * - Interactive tooltips
 * - Formatted axis labels
 * 
 * Requirements: Show GDP and expense growth trends over time
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import ChartTooltip from './ChartTooltip.jsx'
import { getNumberFormatter } from '../utils/formatNumber.js'
import { getCountryData } from '../services/GdpExpenseDataService.js'

// Comprehensive continent mapping - shared across component
const COUNTRY_TO_CONTINENT = {
  // North America
  'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  'Costa Rica': 'North America', 'Panama': 'North America', 'Guatemala': 'North America',
  'Honduras': 'North America', 'Nicaragua': 'North America', 'El Salvador': 'North America',
  'Belize': 'North America', 'Jamaica': 'North America', 'Trinidad and Tobago': 'North America',
  'Bahamas': 'North America', 'Barbados': 'North America', 'Dominican Republic': 'North America',
  'Haiti': 'North America', 'Cuba': 'North America',
  
  // South America
  'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
  'Colombia': 'South America', 'Peru': 'South America', 'Venezuela': 'South America',
  'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
  'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
  'French Guiana': 'South America',
  
  // Europe
  'United Kingdom': 'Europe', 'Germany': 'Europe', 'France': 'Europe', 'Italy': 'Europe',
  'Spain': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe', 'Netherlands': 'Europe',
  'Belgium': 'Europe', 'Greece': 'Europe', 'Portugal': 'Europe', 'Czech Republic': 'Europe',
  'Hungary': 'Europe', 'Sweden': 'Europe', 'Austria': 'Europe', 'Bulgaria': 'Europe',
  'Denmark': 'Europe', 'Finland': 'Europe', 'Slovakia': 'Europe', 'Norway': 'Europe',
  'Ireland': 'Europe', 'Croatia': 'Europe', 'Bosnia and Herzegovina': 'Europe',
  'Albania': 'Europe', 'Lithuania': 'Europe', 'Slovenia': 'Europe', 'Latvia': 'Europe',
  'Estonia': 'Europe', 'Luxembourg': 'Europe', 'Malta': 'Europe', 'Iceland': 'Europe',
  'Switzerland': 'Europe', 'Serbia': 'Europe', 'Montenegro': 'Europe',
  'North Macedonia': 'Europe', 'Moldova': 'Europe', 'Belarus': 'Europe',
  'Ukraine': 'Europe', 'Russia': 'Europe', 'Kosovo': 'Europe',
  
  // Asia
  'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia',
  'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia', 'Philippines': 'Asia',
  'Vietnam': 'Asia', 'Thailand': 'Asia', 'Myanmar': 'Asia', 'Iraq': 'Asia',
  'Afghanistan': 'Asia', 'Saudi Arabia': 'Asia', 'Malaysia': 'Asia', 'Nepal': 'Asia',
  'Yemen': 'Asia', 'North Korea': 'Asia', 'Sri Lanka': 'Asia', 'Cambodia': 'Asia',
  'Jordan': 'Asia', 'Azerbaijan': 'Asia', 'United Arab Emirates': 'Asia',
  'Tajikistan': 'Asia', 'Israel': 'Asia', 'Laos': 'Asia', 'Lebanon': 'Asia',
  'Singapore': 'Asia', 'Oman': 'Asia', 'Kuwait': 'Asia', 'Georgia': 'Asia',
  'Mongolia': 'Asia', 'Armenia': 'Asia', 'Qatar': 'Asia', 'Bahrain': 'Asia',
  'East Timor': 'Asia', 'Cyprus': 'Asia', 'Bhutan': 'Asia', 'Maldives': 'Asia',
  'Brunei': 'Asia', 'Syria': 'Asia', 'Palestine': 'Asia', 'Kazakhstan': 'Asia',
  'Uzbekistan': 'Asia', 'Turkmenistan': 'Asia', 'Kyrgyzstan': 'Asia',
  'Turkey': 'Asia', 'Iran': 'Asia', 'Timor-Leste': 'Asia',
  
  // Africa
  'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'South Africa': 'Africa',
  'Kenya': 'Africa', 'Democratic Republic of the Congo': 'Africa', 'Tanzania': 'Africa',
  'Uganda': 'Africa', 'Algeria': 'Africa', 'Sudan': 'Africa', 'Morocco': 'Africa',
  'Angola': 'Africa', 'Ghana': 'Africa', 'Mozambique': 'Africa', 'Madagascar': 'Africa',
  'Cameroon': 'Africa', 'Ivory Coast': 'Africa', 'Niger': 'Africa',
  'Burkina Faso': 'Africa', 'Mali': 'Africa', 'Malawi': 'Africa', 'Zambia': 'Africa',
  'Senegal': 'Africa', 'Somalia': 'Africa', 'Chad': 'Africa', 'Zimbabwe': 'Africa',
  'Guinea': 'Africa', 'Rwanda': 'Africa', 'Benin': 'Africa', 'Tunisia': 'Africa',
  'Burundi': 'Africa', 'South Sudan': 'Africa', 'Togo': 'Africa',
  'Sierra Leone': 'Africa', 'Libya': 'Africa', 'Liberia': 'Africa',
  'Mauritania': 'Africa', 'Central African Republic': 'Africa', 'Eritrea': 'Africa',
  'Gambia': 'Africa', 'Botswana': 'Africa', 'Namibia': 'Africa', 'Gabon': 'Africa',
  'Lesotho': 'Africa', 'Guinea-Bissau': 'Africa', 'Equatorial Guinea': 'Africa',
  'Mauritius': 'Africa', 'Eswatini': 'Africa', 'Djibouti': 'Africa',
  'Comoros': 'Africa', 'Cape Verde': 'Africa', 'Sao Tome and Principe': 'Africa',
  'Seychelles': 'Africa', 'Réunion': 'Africa', 'Mayotte': 'Africa',
  
  // Oceania
  'Australia': 'Oceania', 'Papua New Guinea': 'Oceania', 'New Zealand': 'Oceania',
  'Fiji': 'Oceania', 'Solomon Islands': 'Oceania', 'Micronesia': 'Oceania',
  'Vanuatu': 'Oceania', 'Samoa': 'Oceania', 'Kiribati': 'Oceania', 'Tonga': 'Oceania',
  'Palau': 'Oceania', 'Marshall Islands': 'Oceania', 'Tuvalu': 'Oceania',
  'Nauru': 'Oceania', 'French Polynesia': 'Oceania', 'New Caledonia': 'Oceania',
  'Guam': 'Oceania'
}

export function GdpExpenseChart({ selectedCountry, data, chartType = 'line', width, height }) {
  // Use dynamic dimensions for bubble chart, fixed for line chart
  // Make bubble chart fit in viewport without scrolling
  const chartWidth = width || (chartType === 'scatter' ? 1400 : 1000)
  const chartHeight = height || (chartType === 'scatter' ? 600 : 500)
  const svgRef = useRef(null)
  const [selectedBubble, setSelectedBubble] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const [selectedContinent, setSelectedContinent] = useState(null)
  const [currentYear, setCurrentYear] = useState(2023)
  const [isAnimating, setIsAnimating] = useState(false)
  const [baselineRatio, setBaselineRatio] = useState(null) // Track starting ratio for cumulative trend
  const [tooltipData, setTooltipData] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)
  const allBubblesRef = useRef(null)
  const animationRef = useRef(null)
  


  // Prepare chart data from real GDP and expense data
  const chartData = useMemo(() => {
    if (!data) return null

    const { gdpData, expenseData, years } = data
    
    // Get GDP and expense data for selected country
    const gdpCountryData = getCountryData(gdpData, selectedCountry, years)
    const expenseCountryData = getCountryData(expenseData, selectedCountry, years)

    return {
      gdpData: gdpCountryData,
      expenseData: expenseCountryData,
      years
    }
  }, [data, selectedCountry])

  // Render bubble chart - force-directed layout with no axes
  const renderScatterPlot = useCallback((svg, chartData, scales, margin, innerWidth, innerHeight, allData) => {
    // Ignore scales for bubble chart - we'll use force simulation
    
    // Continent base colors (will be adjusted by growth rate)
    const continentBaseColors = {
      'Asia': { light: '#ffc9ca', dark: '#c41e1e' },
      'Europe': { light: '#a8d5f7', dark: '#1e4d7a' },
      'Africa': { light: '#ffd699', dark: '#d66a00' },
      'North America': { light: '#b3e5e0', dark: '#2d7a72' },
      'South America': { light: '#a8d99b', dark: '#2d6b1f' },
      'Oceania': { light: '#fff4b3', dark: '#c9a500' },
      'Unknown': { light: '#e0e0e0', dark: '#6b6b6b' }
    }
    
    // Use shared continent mapping
    const countryToContinent = COUNTRY_TO_CONTINENT
    
    const _unused = {
      // North America
      'United States': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'Costa Rica': 'North America',
      'Panama': 'North America',
      'Guatemala': 'North America',
      'Honduras': 'North America',
      'Nicaragua': 'North America',
      'El Salvador': 'North America',
      'Belize': 'North America',
      'Jamaica': 'North America',
      'Trinidad and Tobago': 'North America',
      'Bahamas': 'North America',
      'Barbados': 'North America',
      
      // South America
      'Brazil': 'South America',
      'Argentina': 'South America',
      'Chile': 'South America',
      'Colombia': 'South America',
      'Peru': 'South America',
      'Venezuela': 'South America',
      'Ecuador': 'South America',
      'Bolivia': 'South America',
      'Paraguay': 'South America',
      'Uruguay': 'South America',
      'Guyana': 'South America',
      'Suriname': 'South America',
      
      // Europe
      'United Kingdom': 'Europe',
      'Germany': 'Europe',
      'France': 'Europe',
      'Italy': 'Europe',
      'Spain': 'Europe',
      'Poland': 'Europe',
      'Romania': 'Europe',
      'Netherlands': 'Europe',
      'Belgium': 'Europe',
      'Greece': 'Europe',
      'Portugal': 'Europe',
      'Czech Republic': 'Europe',
      'Hungary': 'Europe',
      'Sweden': 'Europe',
      'Austria': 'Europe',
      'Bulgaria': 'Europe',
      'Denmark': 'Europe',
      'Finland': 'Europe',
      'Slovakia': 'Europe',
      'Norway': 'Europe',
      'Ireland': 'Europe',
      'Croatia': 'Europe',
      'Bosnia and Herzegovina': 'Europe',
      'Albania': 'Europe',
      'Lithuania': 'Europe',
      'Slovenia': 'Europe',
      'Latvia': 'Europe',
      'Estonia': 'Europe',
      'Luxembourg': 'Europe',
      'Malta': 'Europe',
      'Iceland': 'Europe',
      'Switzerland': 'Europe',
      'Serbia': 'Europe',
      'Montenegro': 'Europe',
      'North Macedonia': 'Europe',
      'Moldova': 'Europe',
      'Belarus': 'Europe',
      'Ukraine': 'Europe',
      'Russia': 'Europe',
      
      // Asia
      'China': 'Asia',
      'India': 'Asia',
      'Japan': 'Asia',
      'South Korea': 'Asia',
      'Indonesia': 'Asia',
      'Pakistan': 'Asia',
      'Bangladesh': 'Asia',
      'Philippines': 'Asia',
      'Vietnam': 'Asia',
      'Thailand': 'Asia',
      'Myanmar': 'Asia',
      'Iraq': 'Asia',
      'Afghanistan': 'Asia',
      'Saudi Arabia': 'Asia',
      'Malaysia': 'Asia',
      'Nepal': 'Asia',
      'Yemen': 'Asia',
      'North Korea': 'Asia',
      'Sri Lanka': 'Asia',
      'Cambodia': 'Asia',
      'Jordan': 'Asia',
      'Azerbaijan': 'Asia',
      'United Arab Emirates': 'Asia',
      'Tajikistan': 'Asia',
      'Israel': 'Asia',
      'Laos': 'Asia',
      'Lebanon': 'Asia',
      'Singapore': 'Asia',
      'Oman': 'Asia',
      'Kuwait': 'Asia',
      'Georgia': 'Asia',
      'Mongolia': 'Asia',
      'Armenia': 'Asia',
      'Qatar': 'Asia',
      'Bahrain': 'Asia',
      'East Timor': 'Asia',
      'Cyprus': 'Asia',
      'Bhutan': 'Asia',
      'Maldives': 'Asia',
      'Brunei': 'Asia',
      'Syria': 'Asia',
      'Palestine': 'Asia',
      'Kazakhstan': 'Asia',
      'Uzbekistan': 'Asia',
      'Turkmenistan': 'Asia',
      'Kyrgyzstan': 'Asia',
      'Turkey': 'Asia',
      'Iran': 'Asia',
      
      // Africa
      'Nigeria': 'Africa',
      'Ethiopia': 'Africa',
      'Egypt': 'Africa',
      'Democratic Republic of the Congo': 'Africa',
      'Tanzania': 'Africa',
      'South Africa': 'Africa',
      'Kenya': 'Africa',
      'Uganda': 'Africa',
      'Algeria': 'Africa',
      'Sudan': 'Africa',
      'Morocco': 'Africa',
      'Angola': 'Africa',
      'Ghana': 'Africa',
      'Mozambique': 'Africa',
      'Madagascar': 'Africa',
      'Cameroon': 'Africa',
      'Ivory Coast': 'Africa',
      'Niger': 'Africa',
      'Burkina Faso': 'Africa',
      'Mali': 'Africa',
      'Malawi': 'Africa',
      'Zambia': 'Africa',
      'Senegal': 'Africa',
      'Somalia': 'Africa',
      'Chad': 'Africa',
      'Zimbabwe': 'Africa',
      'Guinea': 'Africa',
      'Rwanda': 'Africa',
      'Benin': 'Africa',
      'Tunisia': 'Africa',
      'Burundi': 'Africa',
      'South Sudan': 'Africa',
      'Togo': 'Africa',
      'Sierra Leone': 'Africa',
      'Libya': 'Africa',
      'Liberia': 'Africa',
      'Mauritania': 'Africa',
      'Central African Republic': 'Africa',
      'Eritrea': 'Africa',
      'Gambia': 'Africa',
      'Botswana': 'Africa',
      'Namibia': 'Africa',
      'Gabon': 'Africa',
      'Lesotho': 'Africa',
      'Guinea-Bissau': 'Africa',
      'Equatorial Guinea': 'Africa',
      'Mauritius': 'Africa',
      'Eswatini': 'Africa',
      'Djibouti': 'Africa',
      'Comoros': 'Africa',
      'Cape Verde': 'Africa',
      'Sao Tome and Principe': 'Africa',
      'Seychelles': 'Africa',
      
      // Oceania
      'Australia': 'Oceania',
      'Papua New Guinea': 'Oceania',
      'New Zealand': 'Oceania',
      'Fiji': 'Oceania',
      'Solomon Islands': 'Oceania',
      'Micronesia': 'Oceania',
      'Vanuatu': 'Oceania',
      'Samoa': 'Oceania',
      'Kiribati': 'Oceania',
      'Tonga': 'Oceania',
      'Palau': 'Oceania',
      'Marshall Islands': 'Oceania',
      'Tuvalu': 'Oceania',
      'Nauru': 'Oceania'
    }
    
    // Create bubble data - one bubble per country (aggregate latest year data)
    const bubbleData = []
    
    if (allData) {
      const { gdpData, expenseData, years } = allData
      const latestYear = Math.max(...years)
      
      // Get unique countries
      const countries = [...new Set(gdpData.map(d => d.countryName))]
      
      // Create a bubble for EVERY country - no filtering
      countries.forEach(country => {
        // Use currentYear only when continent is selected, otherwise show 2023 (aggregate)
        const yearToUse = selectedContinent ? currentYear : 2023
        
        // Get data for selected/latest year and 2005 (baseline)
        const gdpCurrent = gdpData.find(d => d.countryName === country && d.year === yearToUse)
        const gdp2005 = gdpData.find(d => d.countryName === country && d.year === 2005)
        const expenseCurrent = expenseData.find(d => d.countryName === country && d.year === yearToUse)
        const expense2005 = expenseData.find(d => d.countryName === country && d.year === 2005)
        
        // If year not available, try nearby years
        let gdpLatest = gdpCurrent
        let expenseLatest = expenseCurrent
        let dataYear = yearToUse
        
        if (!gdpLatest) {
          for (let y = yearToUse; y >= 2005 && !gdpLatest; y--) {
            gdpLatest = gdpData.find(d => d.countryName === country && d.year === y)
            if (gdpLatest) dataYear = y
          }
        }
        
        if (!expenseLatest) {
          for (let y = yearToUse; y >= 2005 && !expenseLatest; y--) {
            expenseLatest = expenseData.find(d => d.countryName === country && d.year === y)
          }
        }
        
        const gdpValue = gdpLatest?.value || 1000
        const expenseValue = expenseLatest?.value || 500
        const ratio = (expenseValue / gdpValue) * 100
        
        // Calculate OVERALL growth from 2005 to 2023 (aggregate of all years)
        let overallGdpGrowth = 0
        let overallExpenseGrowth = 0
        let growthDiff = 5 // Default
        
        if (gdp2005 && gdpLatest && gdp2005.value > 0) {
          overallGdpGrowth = ((gdpLatest.value - gdp2005.value) / gdp2005.value) * 100
        }
        
        if (expense2005 && expenseLatest && expense2005.value > 0) {
          overallExpenseGrowth = ((expenseLatest.value - expense2005.value) / expense2005.value) * 100
        }
        
        // Size based on overall growth difference (2005-2023)
        if (overallGdpGrowth !== 0 || overallExpenseGrowth !== 0) {
          growthDiff = Math.abs(overallExpenseGrowth - overallGdpGrowth)
        } else {
          // Fallback: use current ratio for sizing
          growthDiff = Math.min(ratio / 5, 30)
        }
        
        bubbleData.push({
          country,
          year: dataYear,
          gdp: gdpValue,
          expense: expenseValue,
          ratio,
          expenseGrowth: overallExpenseGrowth,
          gdpGrowth: overallGdpGrowth,
          growthDiff: Math.max(growthDiff, 2), // Minimum size of 2 for visibility
          continent: countryToContinent[country] || 'Unknown'
        })
      })
      
      console.log(`Bubble chart: Showing ALL ${bubbleData.length} countries`)
      console.log('Sample bubble data:', bubbleData.slice(0, 3).map(d => ({
        country: d.country,
        gdpGrowth: d.gdpGrowth,
        expenseGrowth: d.expenseGrowth,
        growthDiff: d.growthDiff
      })))
      
      // Group countries by continent and find min/max growth for color scaling
      const continentGroups = {}
      bubbleData.forEach(d => {
        if (!continentGroups[d.continent]) {
          continentGroups[d.continent] = []
        }
        continentGroups[d.continent].push(d)
      })
      
      // Calculate color for each bubble based on growth within its continent
      bubbleData.forEach(d => {
        const continentData = continentGroups[d.continent]
        const growthValues = continentData.map(c => c.growthDiff)
        const minGrowth = Math.min(...growthValues)
        const maxGrowth = Math.max(...growthValues)
        
        // Normalize growth to 0-1 scale within continent
        let normalizedGrowth = 0.5 // Default middle
        if (maxGrowth > minGrowth) {
          normalizedGrowth = (d.growthDiff - minGrowth) / (maxGrowth - minGrowth)
        }
        
        // Interpolate between light and dark color
        const colors = continentBaseColors[d.continent] || continentBaseColors['Unknown']
        d.color = d3.interpolate(colors.light, colors.dark)(normalizedGrowth)
      })
    }
    
    const g = svg.select('g')
    
    // Use D3 pack layout for non-overlapping bubbles clustered together
    // Use wider aspect ratio for better horizontal spread and bigger bubbles
    const packWidth = innerWidth * 1.4 // Extend more horizontally for bigger bubbles
    const packHeight = innerHeight * 1.1 // Extend vertically too
    const pack = d3.pack()
      .size([packWidth, packHeight])
      .padding(1) // Minimal padding for bigger bubbles
    
    // Create hierarchy for pack layout with growth difference as value
    const root = d3.hierarchy({ children: bubbleData })
      .sum(d => d.growthDiff ? Math.pow(d.growthDiff, 2) : 1) // Square for better size variation
    
    // Apply pack layout
    const nodes = pack(root).leaves()
    
    // Update bubbleData with pack layout positions AND radii
    // Center the bubbles in the available space
    const offsetX = (innerWidth - packWidth) / 2
    const offsetY = (innerHeight - packHeight) / 2
    nodes.forEach((node, i) => {
      bubbleData[i].x = node.x + offsetX
      bubbleData[i].y = node.y + offsetY
      bubbleData[i].r = node.r // Use pack's calculated radius to prevent overlap
    })
    
    // Draw bubbles with static positions
    const bubbles = g.selectAll('.bubble')
      .data(bubbleData)
      .enter()
      .append('g')
      .attr('class', 'bubble')
      .attr('transform', d => `translate(${d.x},${d.y})`) // Set static position immediately
      .style('cursor', 'pointer')
    
    // Invisible larger circle for easier clicking
    bubbles.append('circle')
      .attr('r', d => Math.max(d.r + 5, 12)) // Add 5px padding or minimum 12px radius
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation()
        console.log('Clicked bubble:', d.country, 'GDP Growth:', d.gdpGrowth, 'Expense Growth:', d.expenseGrowth)
        setSelectedBubble(d)
        setShowPopup(true)
      })
    
    // Visible circle with improved colors
    const circles = bubbles.append('circle')
      .attr('r', d => d.r) // Use pack's exact radius - NEVER changes
      .attr('fill', d => {
        // Darken smaller circles for better visibility
        if (d.r < 15) {
          // Apply darkening filter to small circles
          return d3.color(d.color).darker(0.5).toString()
        }
        return d.color
      })
      .attr('stroke', 'white')
      .attr('stroke-width', d => d.r < 10 ? 1 : 2) // Thinner stroke for tiny circles
      .attr('opacity', d => {
        // Apply continent filter if one is selected
        if (selectedContinent) {
          return d.continent === selectedContinent ? 0.95 : 0.12
        }
        return 0.9
      })
      .attr('class', 'bubble-circle')
      .style('pointer-events', 'none') // Let the invisible circle handle clicks
    
    // Store circles reference for legend filtering
    allBubblesRef.current = circles
    
    // Add country labels (centered, all bubbles get labels based on size)
    bubbles.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', d => {
        // Dynamic font size based on bubble radius
        if (d.r > 50) return '14px'
        if (d.r > 35) return '11px'
        if (d.r > 25) return '9px'
        if (d.r > 15) return '7px'
        if (d.r > 10) return '6px'
        return '5px'
      })
      .style('font-weight', d => d.r < 15 ? '900' : '700') // Bolder for small circles
      .style('fill', 'white')
      .style('pointer-events', 'none')
      .style('text-shadow', d => {
        // Stronger shadow for smaller circles
        if (d.r < 15) return '0 1px 4px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)'
        return '0 1px 3px rgba(0,0,0,0.8)'
      })
      .style('opacity', d => {
        // Dim labels for non-selected continents
        if (selectedContinent && d.continent !== selectedContinent) {
          return 0.25
        }
        return 1
      })
      .text(d => {
        // Show labels for all bubbles, length based on size
        if (d.r > 40) return d.country.substring(0, 8).toUpperCase()
        if (d.r > 30) return d.country.substring(0, 6).toUpperCase()
        if (d.r > 20) return d.country.substring(0, 4).toUpperCase()
        if (d.r > 12) return d.country.substring(0, 3).toUpperCase()
        if (d.r > 8) return d.country.substring(0, 2).toUpperCase()
        return d.country.substring(0, 1).toUpperCase()
      })
  }, [selectedContinent, currentYear])

  useEffect(() => {
    if (!chartData || !svgRef.current) return

    console.log('🎨 Chart rendering...', chartType)
    
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Adjust margins for bubble chart (minimal) vs line chart (with axes)
    const margin = chartType === 'scatter' 
      ? { top: 70, right: 20, bottom: 80, left: 20 }
      : { top: 40, right: 20, bottom: 80, left: 80 }
    const innerWidth = chartWidth - margin.left - margin.right
    const innerHeight = chartHeight - margin.top - margin.bottom

    // Create container group for margins
    const container = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    // Create group inside container
    const g = container
      .append('g')
      .attr('class', 'chart-group')

    // Determine scales based on chart type
    let xScale, yScale, yAxisFormatter
    
    if (chartType === 'scatter') {
      // For scatter plot: Years on X-axis, Growth Difference on Y-axis
      xScale = d3.scaleLinear()
        .domain(d3.extent(chartData.years))
        .range([0, innerWidth])
      
      // Y-axis shows growth difference (expense growth - GDP growth)
      // Range from -50% to +50% to show if expense is growing faster or slower than GDP
      yScale = d3.scaleLinear()
        .domain([-50, 50])
        .range([innerHeight, 0])
      
      yAxisFormatter = d => `${d}%`
    } else {
      // For line chart: Years on X-axis, Values on Y-axis
      xScale = d3.scaleLinear()
        .domain(d3.extent(chartData.years))
        .range([0, innerWidth])

      const allValues = [...chartData.gdpData, ...chartData.expenseData].map(d => d.value)
      const maxValue = d3.max(allValues) || 0
      yAxisFormatter = getNumberFormatter(maxValue)

      yScale = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([innerHeight, 0])
    }

    // Add axes and grid (only for line chart, not bubble chart)
    if (chartType !== 'scatter') {
      const xAxisFormatter = d3.format('d')
      
      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(xAxisFormatter))
        .selectAll('text')
        .style('font-size', '12px')

      g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale).tickFormat(yAxisFormatter))
        .selectAll('text')
        .style('font-size', '12px')

      // Add axis labels
      g.append('text')
        .attr('class', 'axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 45)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Year')

      g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -55)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Value (USD)')
      
      // Add grid lines
      g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat('')
        )
      
      g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale)
          .tickSize(-innerHeight)
          .tickFormat('')
        )
    }

    // Render chart based on type
    if (chartType === 'scatter') {
      // Render bubble chart inline to avoid dependency issues
      renderScatterPlot(svg, chartData, { xScale, yScale }, margin, innerWidth, innerHeight, data)
    } else {
      // Render line chart (default)
      // Line generators
      const gdpLine = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX)

      const expenseLine = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX)

      // Draw GDP line
      g.append('path')
        .datum(chartData.gdpData)
        .attr('class', 'line gdp-line')
        .attr('d', gdpLine)
        .attr('fill', 'none')
        .attr('stroke', '#4e79a7')
        .attr('stroke-width', 3)
        .attr('opacity', 0.9)

      // Draw Expense line
      g.append('path')
        .datum(chartData.expenseData)
        .attr('class', 'line expense-line')
        .attr('d', expenseLine)
        .attr('fill', 'none')
        .attr('stroke', '#e15759')
        .attr('stroke-width', 3)
        .attr('opacity', 0.9)

      // Add data points for GDP
      g.selectAll('.gdp-point')
        .data(chartData.gdpData)
        .enter()
        .append('circle')
        .attr('class', 'gdp-point')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.value))
        .attr('r', 5)
        .attr('fill', '#4e79a7')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('r', 8)
            .attr('stroke-width', 3)
          
          console.log('GDP hover:', d)
          setTooltipData({
            countryName: selectedCountry === 'WORLD' ? 'World Average' : selectedCountry,
            year: d.year,
            value: d.value,
            indicator: 'GDP',
            unit: 'USD'
          })
          setTooltipPosition({ x: event.pageX, y: event.pageY })
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('r', 5)
            .attr('stroke-width', 2)
          
          setTooltipData(null)
          setTooltipPosition(null)
        })

      // Add data points for Expense
      g.selectAll('.expense-point')
        .data(chartData.expenseData)
        .enter()
        .append('circle')
        .attr('class', 'expense-point')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.value))
        .attr('r', 5)
        .attr('fill', '#e15759')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('r', 8)
            .attr('stroke-width', 3)
          
          console.log('Expense hover:', d)
          setTooltipData({
            countryName: selectedCountry === 'WORLD' ? 'World Average' : selectedCountry,
            year: d.year,
            value: d.value,
            indicator: 'Government Expense',
            unit: 'USD'
          })
          setTooltipPosition({ x: event.pageX, y: event.pageY })
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('r', 5)
            .attr('stroke-width', 2)
          
          setTooltipData(null)
          setTooltipPosition(null)
        })
      
    }

    // Add legend below chart (centered)
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth / 2 - 100}, ${innerHeight + 50})`)

    if (chartType === 'scatter') {
      // Scatter plot legend - show continents
      legend.attr('transform', `translate(20, ${innerHeight + 50})`)
      
      const continents = [
        { name: 'Asia', color: '#c41e1e', fullName: 'Asia' },
        { name: 'Europe', color: '#1e4d7a', fullName: 'Europe' },
        { name: 'Africa', color: '#d66a00', fullName: 'Africa' },
        { name: 'N. America', color: '#2d7a72', fullName: 'North America' },
        { name: 'S. America', color: '#2d6b1f', fullName: 'South America' },
        { name: 'Oceania', color: '#c9a500', fullName: 'Oceania' }
      ]
      
      continents.forEach((continent, i) => {
        const xPos = i * 100
        
        const legendGroup = legend.append('g')
          .attr('class', 'legend-item')
          .style('cursor', 'pointer')
          .on('click', function() {
            // Toggle continent selection
            if (selectedContinent === continent.fullName) {
              // Clicking same continent - deselect and stop animation
              setSelectedContinent(null)
              setBaselineRatio(null)
              setIsAnimating(false)
              if (animationRef.current) {
                clearInterval(animationRef.current)
              }
              // Reset all bubbles using stored reference
              if (allBubblesRef.current) {
                allBubblesRef.current
                  .transition()
                  .duration(300)
                  .attr('opacity', 0.9)
              }
            } else {
              // Selecting new continent - reset year to 2005 (no auto-play)
              setSelectedContinent(continent.fullName)
              setCurrentYear(2005)
              setBaselineRatio(null) // Will be set in continentInsights
              
              // Stop any existing animation
              setIsAnimating(false)
              if (animationRef.current) {
                clearInterval(animationRef.current)
              }
              
              // Dim non-selected bubbles using stored reference (more aggressive dimming)
              if (allBubblesRef.current) {
                allBubblesRef.current
                  .transition()
                  .duration(300)
                  .attr('opacity', d => d.continent === continent.fullName ? 0.95 : 0.12)
              }
            }
          })
          .on('mouseover', function() {
            d3.select(this).select('circle')
              .transition()
              .duration(150)
              .attr('r', 8)
              .attr('stroke-width', 2.5)
          })
          .on('mouseout', function() {
            d3.select(this).select('circle')
              .transition()
              .duration(150)
              .attr('r', 6)
              .attr('stroke-width', 1.5)
          })
        
        legendGroup.append('circle')
          .attr('cx', xPos + 8)
          .attr('cy', 0)
          .attr('r', 6)
          .attr('fill', continent.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.9)

        legendGroup.append('text')
          .attr('x', xPos + 18)
          .attr('y', 4)
          .style('font-size', '11px')
          .style('font-weight', '600')
          .text(continent.name)
      })
      
      // Size legend
      legend.append('text')
        .attr('x', innerWidth - 150)
        .attr('y', 4)
        .style('font-size', '11px')
        .style('font-weight', '600')
        .text('Bubble size = Spending')
    } else {
      // Line chart legend
      legend.append('line')
        .attr('x1', 0)
        .attr('x2', 30)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', '#4e79a7')
        .attr('stroke-width', 3)

      legend.append('text')
        .attr('x', 35)
        .attr('y', 4)
        .style('font-size', '13px')
        .text('GDP')

      legend.append('line')
        .attr('x1', 100)
        .attr('x2', 130)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', '#e15759')
        .attr('stroke-width', 3)

      legend.append('text')
        .attr('x', 135)
        .attr('y', 4)
        .style('font-size', '13px')
        .text('Gov. Expense')
    }

    // Add title
    let titleText
    if (chartType === 'scatter') {
      titleText = 'Global Country Network - GDP vs Government Spending'
    } else {
      titleText = `${selectedCountry === 'WORLD' ? 'World Average' : selectedCountry} - GDP vs Government Expense`
    }
    
    svg.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', chartType === 'scatter' ? '24px' : '18px')
      .style('font-weight', '700')
      .text(titleText)
    
    // Add subtitle for bubble chart
    if (chartType === 'scatter') {
      svg.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', 48)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('Bubble size represents spending growth disparity | Hover to explore country details')
    }
    
    // Add interactivity instructions
    if (chartType === 'scatter') {
      svg.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#999')
        .text('💡 Click bubbles for details | Click legend to filter by continent')
    } else {
      svg.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#999')
        .text('💡 Hover over data points for detailed information')
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, chartWidth, chartHeight, selectedCountry, chartType, data, selectedContinent, currentYear])

  if (!chartData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
        <p>No data available for the selected country.</p>
      </div>
    )
  }

  // Calculate aggregate insights for selected continent and year
  const continentInsights = useMemo(() => {
    if (chartType !== 'scatter' || !data || !selectedContinent) return null
    
    const { gdpData, expenseData } = data
    
    // Use shared continent mapping and get all countries from actual data
    const allCountries = [...new Set(gdpData.map(d => d.countryName))]
    
    // Filter to only countries in the selected continent
    const continentCountries = allCountries.filter(country => 
      COUNTRY_TO_CONTINENT[country] === selectedContinent
    )
    
    console.log(`${selectedContinent}: Found ${continentCountries.length} countries`, continentCountries.slice(0, 5))
    
    // Get data for current year and next year (for trend)
    const currentYearData = []
    const nextYearData = []
    
    continentCountries.forEach(country => {
      const gdpCurrent = gdpData.find(d => d.countryName === country && d.year === currentYear)
      const expenseCurrent = expenseData.find(d => d.countryName === country && d.year === currentYear)
      const gdpNext = gdpData.find(d => d.countryName === country && d.year === currentYear + 1)
      const expenseNext = expenseData.find(d => d.countryName === country && d.year === currentYear + 1)
      
      if (gdpCurrent && expenseCurrent) {
        currentYearData.push({
          country,
          gdp: gdpCurrent.value,
          expense: expenseCurrent.value,
          ratio: (expenseCurrent.value / gdpCurrent.value) * 100
        })
      }
      
      if (gdpNext && expenseNext) {
        nextYearData.push({
          country,
          gdp: gdpNext.value,
          expense: expenseNext.value
        })
      }
    })
    
    if (currentYearData.length === 0) return null
    
    // Calculate aggregates
    const totalGdp = currentYearData.reduce((sum, d) => sum + d.gdp, 0)
    const totalExpense = currentYearData.reduce((sum, d) => sum + d.expense, 0)
    const avgRatio = (totalExpense / totalGdp) * 100
    
    // Set baseline ratio on first calculation (year 2005 or when continent first selected)
    if (baselineRatio === null && currentYear === 2005) {
      setBaselineRatio(avgRatio)
    }
    
    // Calculate cumulative change from baseline
    const cumulativeChange = baselineRatio !== null ? avgRatio - baselineRatio : 0
    
    // Calculate trend (if next year data available)
    let trend = 'stable'
    let trendPercent = 0
    
    if (nextYearData.length > 0) {
      const nextTotalGdp = nextYearData.reduce((sum, d) => sum + d.gdp, 0)
      const nextTotalExpense = nextYearData.reduce((sum, d) => sum + d.expense, 0)
      const nextRatio = (nextTotalExpense / nextTotalGdp) * 100
      
      trendPercent = nextRatio - avgRatio
      
      if (trendPercent > 1) {
        trend = 'increasing'
      } else if (trendPercent < -1) {
        trend = 'decreasing'
      }
    }
    
    return {
      continent: selectedContinent,
      year: currentYear,
      countryCount: currentYearData.length,
      totalGdp,
      totalExpense,
      avgRatio,
      trend,
      trendPercent,
      cumulativeChange,
      baselineYear: 2005
    }
  }, [chartType, data, selectedContinent, currentYear])
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Add keyframe animation for insights panel */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      
      <div className="gdp-expense-chart" style={{ position: 'relative', width: '100%', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Chart and Controls Side by Side */}
      <div style={{ 
        display: 'flex', 
        gap: selectedContinent ? '20px' : '0', 
        alignItems: 'flex-start',
        flex: 1,
        minHeight: 0,
        maxHeight: '100%',
        transition: 'all 0.5s ease-in-out',
        overflow: 'hidden'
      }}>
        {/* Chart Container */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: '100%',
          transition: 'all 0.5s ease-in-out',
          position: 'relative'
        }}>
          <svg
            ref={svgRef}
            width={chartWidth}
            height={chartHeight}
            style={{ 
              width: '100%', 
              height: '100%',
              maxHeight: '100%',
              display: 'block',
              transition: 'all 0.5s ease-in-out'
            }}
            viewBox={chartType === 'scatter' ? `0 0 ${chartWidth} ${chartHeight}` : undefined}
            preserveAspectRatio={chartType === 'scatter' ? 'xMidYMid meet' : undefined}
          />
        </div>
        
        {/* Continent Insights Panel - Only show when continent selected */}
        {chartType === 'scatter' && selectedContinent && continentInsights && (
          <div style={{
            width: '300px',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '100%',
            overflow: 'hidden',
            gap: '12px'
          }}>
            {/* Year Slider - Above insights panel */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '6px',
              padding: '8px 15px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {/* Play/Pause Button */}
              <button
                onClick={() => {
                  if (isAnimating) {
                    // Stop animation
                    setIsAnimating(false)
                    if (animationRef.current) {
                      clearInterval(animationRef.current)
                    }
                  } else {
                    // Start animation from current year
                    setIsAnimating(true)
                    
                    // If at the end, restart from 2005
                    if (currentYear >= 2023) {
                      setCurrentYear(2005)
                      setBaselineRatio(null) // Will be recalculated
                    }
                    
                    animationRef.current = setInterval(() => {
                      setCurrentYear(prevYear => {
                        if (prevYear >= 2023) {
                          // Stop at end
                          setIsAnimating(false)
                          if (animationRef.current) {
                            clearInterval(animationRef.current)
                          }
                          return 2023
                        }
                        return prevYear + 1
                      })
                    }, 800) // Change year every 800ms
                  }
                }}
                style={{
                  background: isAnimating ? '#ef4444' : '#4e79a7',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  height: '28px'
                }}
                title={isAnimating ? 'Pause' : 'Play'}
              >
                {isAnimating ? '⏸' : '▶'}
              </button>
              
              <label style={{ fontWeight: '600', fontSize: '11px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                Year:
              </label>
              <input
                type="range"
                min="2005"
                max="2023"
                value={currentYear}
                onChange={(e) => {
                  setCurrentYear(parseInt(e.target.value))
                  if (isAnimating) {
                    setIsAnimating(false)
                    if (animationRef.current) {
                      clearInterval(animationRef.current)
                    }
                  }
                }}
                style={{ flex: 1, minWidth: '100px' }}
              />
              <span style={{ fontWeight: '700', fontSize: '12px', color: '#2d3748', minWidth: '40px' }}>
                {currentYear}
              </span>
            </div>
            {continentInsights && (
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                flex: 1,
                overflow: 'auto',
                minHeight: 0
              }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '14px', 
              fontWeight: '700', 
              color: '#2d3748',
              borderBottom: '2px solid #4e79a7',
              paddingBottom: '6px'
            }}>
              📊 {continentInsights.continent}
            </h3>
            
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div style={{ 
                marginBottom: '8px', 
                padding: '8px', 
                background: '#f7fafc', 
                borderRadius: '4px' 
              }}>
                <div style={{ fontWeight: '600', color: '#4a5568', marginBottom: '4px', fontSize: '11px' }}>
                  📅 Year: {continentInsights.year}
                </div>
                <div style={{ color: '#718096' }}>
                  Countries: {continentInsights.countryCount}
                </div>
              </div>
              
              <div style={{ 
                marginBottom: '8px', 
                padding: '8px', 
                background: '#f7fafc', 
                borderRadius: '4px' 
              }}>
                <div style={{ fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
                  💰 Aggregate Economics
                </div>
                <div style={{ color: '#718096', marginBottom: '4px' }}>
                  <strong>Total GDP:</strong> {getNumberFormatter(continentInsights.totalGdp)(continentInsights.totalGdp)}
                </div>
                <div style={{ color: '#718096', marginBottom: '4px' }}>
                  <strong>Total Expense:</strong> {getNumberFormatter(continentInsights.totalExpense)(continentInsights.totalExpense)}
                </div>
                <div style={{ color: '#718096' }}>
                  <strong>Avg Ratio:</strong> {continentInsights.avgRatio.toFixed(1)}%
                </div>
              </div>
              
              {/* Cumulative Change Display - Only show if change is significant (> 0.1%) */}
              {Math.abs(continentInsights.cumulativeChange) > 0.1 && (
                <div style={{ 
                  marginBottom: '8px',
                  padding: '10px', 
                  background: continentInsights.cumulativeChange > 0 ? '#fef3c7' : '#dbeafe',
                  borderRadius: '4px',
                  border: `2px solid ${continentInsights.cumulativeChange > 0 ? '#f59e0b' : '#3b82f6'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>
                    Since {continentInsights.baselineYear}
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: '900',
                    color: continentInsights.cumulativeChange > 0 ? '#d97706' : '#2563eb'
                  }}>
                    {continentInsights.cumulativeChange > 0 ? '+' : ''}{continentInsights.cumulativeChange.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                    {continentInsights.cumulativeChange > 0 ? 'Spending ↑' : 'GDP ↑'}
                  </div>
                </div>
              )}
              
            </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
      
      {/* Detailed Popup for Selected Bubble */}
      {showPopup && selectedBubble && chartType === 'scatter' && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          border: '3px solid #4e79a7',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          minWidth: '400px',
          maxWidth: '500px',
          zIndex: 10001
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#2d3748' }}>
              {selectedBubble.country}
            </h3>
            <button 
              onClick={() => setShowPopup(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                padding: '0',
                color: '#999',
                lineHeight: '1'
              }}
            >×</button>
          </div>
          
          <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#4a5568' }}>
            <div style={{ marginBottom: '15px', padding: '12px', background: '#f7fafc', borderRadius: '6px' }}>
              <div style={{ fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>📍 Location</div>
              <div><strong>Continent:</strong> {selectedBubble.continent}</div>
              <div><strong>Year:</strong> {selectedBubble.year}</div>
            </div>
            
            <div style={{ marginBottom: '15px', padding: '12px', background: '#f7fafc', borderRadius: '6px' }}>
              <div style={{ fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>💰 Economic Data</div>
              <div><strong>GDP:</strong> {getNumberFormatter(selectedBubble.gdp)(selectedBubble.gdp)}</div>
              <div><strong>Government Expense:</strong> {getNumberFormatter(selectedBubble.expense)(selectedBubble.expense)}</div>
              <div><strong>Expense-to-GDP Ratio:</strong> {selectedBubble.ratio.toFixed(1)}%</div>
            </div>

          </div>
        </div>
      )}
      
      {/* Tooltip for line chart */}
      {tooltipData && tooltipPosition && chartType !== 'scatter' && (
        <ChartTooltip 
          data={tooltipData}
          position={tooltipPosition}
        />
      )}
    </>
  )
}

export default GdpExpenseChart
