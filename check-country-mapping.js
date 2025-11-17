/**
 * Diagnostic script to check country name mapping between map and data
 */

import * as d3 from 'd3'

// Load map data
const worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
const topojson = await import('topojson-client')
const countries = topojson.feature(worldData, worldData.objects.countries)

// Load one indicator data to check country names
const csvData = await d3.csv('public/data/48-indicators/IMF_GFSE_GE_G14.csv')

// Get unique country names from data
const dataCountries = new Set()
csvData.forEach(row => {
  const country = row.REF_AREA_LABEL
  if (country) dataCountries.add(country)
})

console.log(`\n📊 Data has ${dataCountries.size} unique countries`)
console.log('Sample data countries:', Array.from(dataCountries).slice(0, 10))

// Get country names from map
const mapCountries = countries.features.map(f => 
  f.properties?.NAME || 
  f.properties?.name || 
  f.properties?.NAME_EN || 
  f.properties?.NAME_LONG ||
  f.properties?.ADMIN ||
  'Unknown'
).filter(name => name !== 'Unknown')

console.log(`\n🗺️ Map has ${mapCountries.length} countries`)
console.log('Sample map countries:', mapCountries.slice(0, 10))

// Check specific problematic countries
const problematic = ['Malaysia', 'Vietnam', 'Argentina', 'Morocco', 'Uruguay', 'Mozambique']

console.log('\n🔍 Checking problematic countries:')
problematic.forEach(country => {
  const inMap = mapCountries.includes(country)
  const inData = dataCountries.has(country)
  const dataMatches = Array.from(dataCountries).filter(c => 
    c.toLowerCase().includes(country.toLowerCase())
  )
  
  console.log(`\n${country}:`)
  console.log(`  In map: ${inMap}`)
  console.log(`  In data: ${inData}`)
  console.log(`  Data matches: ${dataMatches.join(', ') || 'None'}`)
})

// Find all countries in map but not in data
console.log('\n\n⚠️ Countries in MAP but NOT in DATA:')
const notInData = mapCountries.filter(mapName => !dataCountries.has(mapName))
console.log(`Total: ${notInData.length}`)
notInData.slice(0, 30).forEach(name => console.log(`  - ${name}`))

// Find all countries in data but not in map
console.log('\n\n⚠️ Countries in DATA but NOT in MAP:')
const notInMap = Array.from(dataCountries).filter(dataName => !mapCountries.includes(dataName))
console.log(`Total: ${notInMap.length}`)
notInMap.slice(0, 30).forEach(name => console.log(`  - ${name}`))
