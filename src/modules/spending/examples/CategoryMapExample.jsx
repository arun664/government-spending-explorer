import React, { useState, useEffect } from 'react'
import * as d3 from 'd3'
import { 
  loadCategorySpendingData,
  createCategoryColorFunction 
} from '../services/SimpleSpendingService.js'
import SpendingWorldMap from '../components/SpendingWorldMap.jsx'

/**
 * Example component demonstrating category-based map visualization
 * 
 * This example shows how to:
 * 1. Load multi-category spending data
 * 2. Create category-based color functions
 * 3. Display countries colored by their dominant spending category
 */
const CategoryMapExample = () => {
  const [worldData, setWorldData] = useState(null)
  const [categoryData, setCategoryData] = useState(null)
  const [colorFunction, setColorFunction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState(null)

  useEffect(() => {
    loadExampleData()
  }, [])

  const loadExampleData = async () => {
    try {
      setLoading(true)

      // Load world map data and category spending data in parallel
      const [world, categorySpendingData] = await Promise.all([
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
        loadCategorySpendingData(
          ['GE', 'GECE', 'GEG', 'GEI', 'GES', 'GEOM'], // Key indicators from different categories
          [2015, 2022] // Year range
        )
      ])

      setWorldData(world)
      setCategoryData(categorySpendingData)

      // Create category-based color function
      const colorFunc = createCategoryColorFunction(categorySpendingData)
      setColorFunction(() => colorFunc)

      console.log('Category data loaded:', {
        countries: Object.keys(categorySpendingData.countries).length,
        categories: Object.keys(categorySpendingData.categoryColors),
        sampleCountry: Object.values(categorySpendingData.countries)[0]
      })

    } catch (error) {
      console.error('Error loading example data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    console.log('Selected country:', country)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading category-based map visualization...</p>
        </div>
      </div>
    )
  }

  if (!worldData || !categoryData || !colorFunction) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <p>Failed to load data. Please check console for errors.</p>
        <button onClick={loadExampleData}>Retry</button>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      <div style={{ 
        padding: '16px', 
        background: 'white', 
        borderBottom: '1px solid #e0e0e0',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
          Category-Based Spending Visualization Example
        </h3>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Countries are colored by their dominant spending category. 
          Hover over countries to see category breakdown.
        </p>
        
        {selectedCountry && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            background: '#f8f9ff', 
            borderRadius: '6px',
            border: '1px solid #e8ecff'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#667eea' }}>
              {selectedCountry.name}
            </h4>
            {selectedCountry.spending?.dominantCategory && (
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
                  <strong>Dominant Category:</strong> {selectedCountry.spending.dominantCategory}
                </p>
                <p style={{ margin: '0', fontSize: '13px' }}>
                  <strong>Total Spending:</strong> {selectedCountry.spending.average?.toFixed(2)}M USD
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 'calc(100% - 120px)' }}>
        <SpendingWorldMap
          worldData={worldData}
          spendingData={categoryData}
          colorScale={colorFunction}
          filters={{
            yearRange: [2015, 2022],
            visualizationMode: 'dominant'
          }}
          selectedCountry={selectedCountry}
          onCountrySelect={handleCountrySelect}
        />
      </div>
    </div>
  )
}

export default CategoryMapExample