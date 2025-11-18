import React, { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import '../styles/InfoPanel.css'
import { formatGDPValue } from '../utils/dataLoader'

const InfoPanel = ({ country, onClose, yearRange = [2005, 2024], embedded = false, compareMode = false }) => {
  const chartRef = useRef(null)

  // Calculate insights based on year range - supports single or multiple countries
  const insights = useMemo(() => {
    if (!country) return null;

    // Handle multiple countries - with compare mode support
    if (country.code === 'MULTI' && country.countries) {
      const allFilteredData = [];
      const countriesData = [];

      // Collect data from all selected countries
      country.countries.forEach(c => {
        if (c.data && c.data.length > 0) {
          const filteredData = c.data.filter(
            d => d.year >= yearRange[0] && d.year <= yearRange[1]
          );
          if (filteredData.length > 0) {
            allFilteredData.push(...filteredData);
            countriesData.push({ name: c.name, data: filteredData });
          }
        }
      });

      if (allFilteredData.length === 0) {
        return null;
      }

      // Calculate combined statistics
      const gdpValues = allFilteredData.map(d => d.gdp);
      const avgGDP = gdpValues.reduce((sum, val) => sum + val, 0) / gdpValues.length;
      const maxGDP = Math.max(...gdpValues);
      const minGDP = Math.min(...gdpValues);
      
      // Find which country had max/min
      const maxEntry = allFilteredData.find(d => d.gdp === maxGDP);
      const minEntry = allFilteredData.find(d => d.gdp === minGDP);
      const maxCountry = countriesData.find(c => c.data.includes(maxEntry))?.name || 'Unknown';
      const minCountry = countriesData.find(c => c.data.includes(minEntry))?.name || 'Unknown';
      const maxYear = maxEntry?.year;
      const minYear = minEntry?.year;
      
      // Calculate volatility (standard deviation)
      const mean = avgGDP;
      const variance = gdpValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gdpValues.length;
      const volatility = Math.sqrt(variance);
      
      // Calculate trend (comparing first half vs second half)
      const midPoint = Math.floor(allFilteredData.length / 2);
      const sortedByYear = [...allFilteredData].sort((a, b) => a.year - b.year);
      const firstHalf = sortedByYear.slice(0, midPoint);
      const secondHalf = sortedByYear.slice(midPoint);
      const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.gdp, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.gdp, 0) / secondHalf.length;
      const trend = secondHalfAvg - firstHalfAvg;
      
      // Count increasing and decreasing GDP years
      const increasingYears = sortedByYear.filter((d, i) => i > 0 && d.gdp > sortedByYear[i-1].gdp).length;
      const decreasingYears = sortedByYear.filter((d, i) => i > 0 && d.gdp < sortedByYear[i-1].gdp).length;
      
      // Calculate individual country patterns
      const countryPatterns = countriesData.map(c => {
        const gdps = c.data.map(d => d.gdp);
        const sortedData = [...c.data].sort((a, b) => a.year - b.year);
        const increasing = sortedData.filter((d, i) => i > 0 && d.gdp > sortedData[i-1].gdp).length;
        const decreasing = sortedData.filter((d, i) => i > 0 && d.gdp < sortedData[i-1].gdp).length;
        const total = gdps.length;
        const avg = gdps.reduce((sum, val) => sum + val, 0) / total;
        
        return {
          name: c.name,
          increasingYears: increasing,
          decreasingYears: decreasing,
          totalYears: total,
          increasingPercent: (increasing / (total - 1)) * 100,
          decreasingPercent: (decreasing / (total - 1)) * 100,
          avgGDP: avg
        };
      });
      
      // Aggregate data by year for chart (average across countries)
      const yearMap = new Map();
      allFilteredData.forEach(d => {
        if (!yearMap.has(d.year)) {
          yearMap.set(d.year, []);
        }
        yearMap.get(d.year).push(d.gdp);
      });
      
      const aggregatedData = Array.from(yearMap.entries()).map(([year, values]) => ({
        year,
        gdp: values.reduce((sum, val) => sum + val, 0) / values.length
      })).sort((a, b) => a.year - b.year);
      
      return {
        avgGDP,
        maxGDP,
        minGDP,
        maxYear,
        minYear,
        maxCountry,
        minCountry,
        volatility,
        trend,
        increasingYears,
        decreasingYears,
        totalYears: allFilteredData.length,
        filteredData: aggregatedData,
        isMultiple: true,
        countryCount: country.countries.length,
        countriesData, // Keep individual country data for multi-line chart
        countryPatterns // Individual country GDP patterns
      };
    }

    // Handle single country
    if (!country.data || country.data.length === 0) {
      return null;
    }

    // Filter data by year range
    const filteredData = country.data.filter(
      d => d.year >= yearRange[0] && d.year <= yearRange[1]
    );

    if (filteredData.length === 0) {
      return null;
    }

    // Calculate statistics
    const gdpValues = filteredData.map(d => d.gdp);
    const avgGDP = gdpValues.reduce((sum, val) => sum + val, 0) / gdpValues.length;
    const maxGDP = Math.max(...gdpValues);
    const minGDP = Math.min(...gdpValues);
    const maxYear = filteredData.find(d => d.gdp === maxGDP)?.year;
    const minYear = filteredData.find(d => d.gdp === minGDP)?.year;
    
    // Calculate volatility (standard deviation)
    const mean = avgGDP;
    const variance = gdpValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gdpValues.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midPoint);
    const secondHalf = filteredData.slice(midPoint);
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.gdp, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.gdp, 0) / secondHalf.length;
    const trend = secondHalfAvg - firstHalfAvg;
    
    // Count increasing and decreasing GDP years
    const sortedData = [...filteredData].sort((a, b) => a.year - b.year);
    const increasingYears = sortedData.filter((d, i) => i > 0 && d.gdp > sortedData[i-1].gdp).length;
    const decreasingYears = sortedData.filter((d, i) => i > 0 && d.gdp < sortedData[i-1].gdp).length;
    
    return {
      avgGDP,
      maxGDP,
      minGDP,
      maxYear,
      minYear,
      volatility,
      trend,
      increasingYears,
      decreasingYears,
      totalYears: filteredData.length,
      filteredData,
      isMultiple: false
    };
  }, [country, yearRange]);

  useEffect(() => {
    if (insights && insights.filteredData && insights.filteredData.length > 0) {
      if (insights.isMultiple && insights.countriesData) {
        drawMultiCountryChart(insights.countriesData);
      } else {
        drawChart(insights.filteredData);
      }
    }
  }, [insights]);

  const drawChart = (data) => {
    const container = d3.select(chartRef.current)
    container.selectAll('*').remove()

    if (!data || data.length === 0) {
      container
        .append('p')
        .attr('class', 'no-data')
        .text('No historical data available')
      return
    }

    // Get the actual container width
    const containerWidth = chartRef.current.offsetWidth || 320
    const margin = { top: 10, right: 10, bottom: 30, left: 60 } // Increased left margin from 40 to 60
    const width = containerWidth - margin.left - margin.right
    const height = 200 - margin.top - margin.bottom

    const svg = container
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Sort data by year
    const sortedData = [...data].sort((a, b) => a.year - b.year)

    // Scales
    const x = d3
      .scaleLinear()
      .domain(d3.extent(sortedData, (d) => d.year))
      .range([0, width])

    const gdpExtent = d3.extent(sortedData, (d) => d.gdp)
    const gdpRange = gdpExtent[1] - gdpExtent[0]
    const y = d3
      .scaleLinear()
      .domain([
        gdpExtent[0] - gdpRange * 0.1,
        gdpExtent[1] + gdpRange * 0.1,
      ])
      .range([height, 0])

    // Line generator
    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.gdp))

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(d3.format('d'))
        .ticks(Math.min(sortedData.length, 8))) // Limit number of ticks
      .style('font-size', '10px')
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')

    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => formatGDPValue(d)))
      .style('font-size', '10px')

    // Add line
    svg
      .append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', '#667eea')
      .attr('stroke-width', 2)
      .attr('d', line)

    // Add dots
    svg
      .selectAll('circle')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.year))
      .attr('cy', (d) => y(d.gdp))
      .attr('r', 3)
      .attr('fill', '#667eea')
      .append('title')
      .text((d) => {
        const gdpValue = d.gdp || d.GDP
        if (gdpValue) {
          return `${d.year}\nGDP: ${formatGDPValue(gdpValue)}`
        }
        return `${d.year}: N/A`
      })
  }

  const drawMultiCountryChart = (countriesData) => {
    const container = d3.select(chartRef.current)
    container.selectAll('*').remove()

    if (!countriesData || countriesData.length === 0) {
      container
        .append('p')
        .attr('class', 'no-data')
        .text('No historical data available')
      return
    }

    // Get the actual container width
    const containerWidth = chartRef.current.offsetWidth || 320
    const legendHeight = Math.ceil(countriesData.length / Math.floor((containerWidth - 80) / 120)) * 20 + 20
    const margin = { top: 20, right: 20, bottom: 30 + legendHeight, left: 60 } // Increased left margin from 40 to 60
    const width = containerWidth - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const svg = container
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Collect all data points to determine scales
    const allData = countriesData.flatMap(c => c.data)
    
    // Color scale for different countries
    const colors = ['#667eea', '#f6ad55', '#48bb78', '#ed64a6', '#4299e1', '#9f7aea', '#f56565', '#38b2ac']
    const colorScale = (index) => colors[index % colors.length]

    // Scales
    const x = d3
      .scaleLinear()
      .domain(d3.extent(allData, (d) => d.year))
      .range([0, width])

    const gdpExtent = d3.extent(allData, (d) => d.gdp)
    const gdpRange = gdpExtent[1] - gdpExtent[0]
    const y = d3
      .scaleLinear()
      .domain([
        gdpExtent[0] - gdpRange * 0.1,
        gdpExtent[1] + gdpRange * 0.1,
      ])
      .range([height, 0])

    // Line generator
    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.gdp))

    // Add axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(d3.format('d'))
        .ticks(Math.min(allData.length / countriesData.length, 8)))
      .style('font-size', '10px')
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')

    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => formatGDPValue(d)))
      .style('font-size', '10px')

    // Draw line for each country
    countriesData.forEach((countryData, index) => {
      const sortedData = [...countryData.data].sort((a, b) => a.year - b.year)
      const color = colorScale(index)

      // Add line
      svg
        .append('path')
        .datum(sortedData)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line)

      // Add dots
      svg
        .selectAll(`.dots-${index}`)
        .data(sortedData)
        .enter()
        .append('circle')
        .attr('class', `dots-${index}`)
        .attr('cx', (d) => x(d.year))
        .attr('cy', (d) => y(d.gdp))
        .attr('r', 3)
        .attr('fill', color)
        .append('title')
        .text((d) => {
          const gdpValue = d.gdp || d.GDP
          if (gdpValue) {
            return `${countryData.name} ${d.year}\nGDP: ${formatGDPValue(gdpValue)}`
          }
          return `${countryData.name} ${d.year}: N/A`
        })
    })

    // Add legend below the chart
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, ${height + 50})`)

    const legendItemWidth = 120
    const itemsPerRow = Math.floor(width / legendItemWidth)

    countriesData.forEach((countryData, index) => {
      const row = Math.floor(index / itemsPerRow)
      const col = index % itemsPerRow
      
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(${col * legendItemWidth}, ${row * 20})`)
        .attr('class', 'legend-item')

      // Add background highlight for better visibility
      legendRow
        .append('rect')
        .attr('x', -4)
        .attr('y', -2)
        .attr('width', legendItemWidth - 10)
        .attr('height', 16)
        .attr('fill', '#f3f4f6')
        .attr('rx', 4)
        .attr('opacity', 0.5)

      legendRow
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colorScale(index))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)

      legendRow
        .append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', '#1f2937')
        .text(countryData.name.length > 15 ? countryData.name.substring(0, 12) + '...' : countryData.name)
        .append('title')
        .text(countryData.name)
    })
  }

  if (!country) return null

  // If embedded, return only the content without the sliding panel wrapper
  if (embedded) {
    return (
      <div className="info-content-embedded">
        {/* Compare Mode Indicator */}
        {compareMode && insights?.isMultiple && (
          <div className="compare-mode-banner">
            <span className="compare-icon">📊</span>
            <span className="compare-text">Compare Mode: Combined Statistics</span>
          </div>
        )}
        
        {insights ? (
          <>
            <div className="info-section">
              <h3>GDP Information</h3>
              <div className="year-range-indicator">
                {yearRange[0] === yearRange[1] 
                  ? `Year: ${yearRange[0]}`
                  : `Period: ${yearRange[0]} - ${yearRange[1]}`
                }
              </div>
              {insights.isMultiple ? (
                <div className="info-stat">
                  <label>Countries:</label>
                  <span className="value">{insights.countryCount} selected</span>
                </div>
              ) : (
                <>
                  <div className="info-stat">
                    <label>Latest GDP Growth:</label>
                    <span className="value">
                      {country.latest
                        ? `${country.latest.growth.toFixed(2)}%`
                        : 'No data'}
                    </span>
                  </div>
                  <div className="info-stat">
                    <label>Year:</label>
                    <span className="value">
                      {country.latest ? country.latest.year : '-'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="info-section">
              <h3>Period Statistics ({yearRange[0]}-{yearRange[1]})</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <label>Average GDP</label>
                  <span className="stat-value">
                    {formatGDPValue(insights.avgGDP)}
                  </span>
                  {insights.isMultiple && (
                    <span className="stat-year">combined avg</span>
                  )}
                </div>
                <div className="stat-card">
                  <label>Highest GDP</label>
                  <span className="stat-value positive">
                    {formatGDPValue(insights.maxGDP)}
                  </span>
                  <span className="stat-year">
                    {insights.isMultiple 
                      ? `${insights.maxCountry}, ${insights.maxYear}`
                      : `in ${insights.maxYear}`}
                  </span>
                </div>
                <div className="stat-card">
                  <label>Lowest GDP</label>
                  <span className="stat-value negative">
                    {formatGDPValue(insights.minGDP)}
                  </span>
                  <span className="stat-year">
                    {insights.isMultiple 
                      ? `${insights.minCountry}, ${insights.minYear}`
                      : `in ${insights.minYear}`}
                  </span>
                </div>
                <div className="stat-card">
                  <label>Volatility</label>
                  <span className="stat-value">
                    {formatGDPValue(insights.volatility)}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Growth Pattern Comparison</h3>
              {insights.isMultiple && insights.countryPatterns ? (
                <div className="pattern-stats">
                  {insights.countryPatterns.map((pattern, index) => (
                    <div key={index} className="country-pattern-item">
                      <div className="country-pattern-header">
                        <span className="country-pattern-name">{pattern.name}</span>
                        <span className="country-pattern-avg" style={{
                          color: '#667eea',
                          fontWeight: '600'
                        }}>
                          ${formatGDPValue(pattern.avgGDP)}
                        </span>
                      </div>
                      <div className="pattern-bars-container">
                        <div className="pattern-item">
                          <div className="pattern-bar">
                            <div 
                              className="pattern-fill positive" 
                              style={{width: `${pattern.increasingPercent}%`}}
                            ></div>
                          </div>
                          <span className="pattern-label">
                            {pattern.increasingYears} increasing ({pattern.increasingPercent.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="pattern-item">
                          <div className="pattern-bar">
                            <div 
                              className="pattern-fill negative" 
                              style={{width: `${pattern.decreasingPercent}%`}}
                            ></div>
                          </div>
                          <span className="pattern-label">
                            {pattern.decreasingYears} decreasing ({pattern.decreasingPercent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="trend-indicator">
                    <label>Overall Trend:</label>
                    <span className={`trend-value ${insights.trend >= 0 ? 'positive' : 'negative'}`}>
                      {insights.trend >= 0 ? '↑' : '↓'} 
                      {insights.trend >= 0 ? ' Increasing' : ' Decreasing'}
                      <span className="trend-detail">
                        ({formatGDPValue(Math.abs(insights.trend))} change)
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pattern-stats">
                  <div className="pattern-item">
                    <div className="pattern-bar">
                      <div 
                        className="pattern-fill positive" 
                        style={{width: `${(insights.increasingYears / (insights.totalYears - 1)) * 100}%`}}
                      ></div>
                    </div>
                    <span className="pattern-label">
                      {insights.increasingYears} increasing years ({((insights.increasingYears / (insights.totalYears - 1)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="pattern-item">
                    <div className="pattern-bar">
                      <div 
                        className="pattern-fill negative" 
                        style={{width: `${(insights.decreasingYears / (insights.totalYears - 1)) * 100}%`}}
                      ></div>
                    </div>
                    <span className="pattern-label">
                      {insights.decreasingYears} decreasing years ({((insights.decreasingYears / (insights.totalYears - 1)) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="trend-indicator">
                    <label>Trend Direction:</label>
                    <span className={`trend-value ${insights.trend >= 0 ? 'positive' : 'negative'}`}>
                      {insights.trend >= 0 ? '↑' : '↓'} 
                      {insights.trend >= 0 ? ' Increasing' : ' Decreasing'}
                      <span className="trend-detail">
                        ({formatGDPValue(Math.abs(insights.trend))} change)
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="info-section gdp-growth-trend-section">
              <h3>GDP Trend</h3>
              <div className="gdp-chart-wrapper">
                <div ref={chartRef} className="gdp-chart"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-data-message">
            <p>No data available for the selected year range</p>
          </div>
        )}
      </div>
    )
  }

  // Original slide-in panel for non-embedded mode
  return (
    <div className={`info-panel ${country ? 'active' : ''}`}>
      <div className="info-header">
        <h2>{country.name}</h2>
        <p>{country.code}</p>
        <button className="close-panel" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="info-content">
        {insights ? (
          <>
            <div className="info-section">
              <h3>GDP Information</h3>
              <div className="year-range-indicator">
                {yearRange[0] === yearRange[1] 
                  ? `Year: ${yearRange[0]}`
                  : `Period: ${yearRange[0]} - ${yearRange[1]}`
                }
              </div>
              <div className="info-stat">
                <label>Latest GDP Growth:</label>
                <span className="value">
                  {country.latest
                    ? `${country.latest.growth.toFixed(2)}%`
                    : 'No data'}
                </span>
              </div>
              <div className="info-stat">
                <label>Year:</label>
                <span className="value">
                  {country.latest ? country.latest.year : '-'}
                </span>
              </div>
            </div>

            <div className="info-section">
              <h3>Period Statistics ({yearRange[0]}-{yearRange[1]})</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <label>Average GDP</label>
                  <span className="stat-value">
                    ${formatGDPValue(insights.avgGDP)}
                  </span>
                </div>
                <div className="stat-card">
                  <label>Highest GDP</label>
                  <span className="stat-value positive">
                    ${formatGDPValue(insights.maxGDP)}
                  </span>
                  <span className="stat-year">in {insights.maxYear}</span>
                </div>
                <div className="stat-card">
                  <label>Lowest GDP</label>
                  <span className="stat-value negative">
                    ${formatGDPValue(insights.minGDP)}
                  </span>
                  <span className="stat-year">in {insights.minYear}</span>
                </div>
                <div className="stat-card">
                  <label>Volatility</label>
                  <span className="stat-value">
                    ${formatGDPValue(insights.volatility)}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>GDP Pattern</h3>
              <div className="pattern-stats">
                <div className="pattern-item">
                  <div className="pattern-bar">
                    <div 
                      className="pattern-fill positive" 
                      style={{width: `${(insights.increasingYears / (insights.totalYears - 1)) * 100}%`}}
                    ></div>
                  </div>
                  <span className="pattern-label">
                    {insights.increasingYears} increasing years ({((insights.increasingYears / (insights.totalYears - 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="pattern-item">
                  <div className="pattern-bar">
                    <div 
                      className="pattern-fill negative" 
                      style={{width: `${(insights.decreasingYears / (insights.totalYears - 1)) * 100}%`}}
                    ></div>
                  </div>
                  <span className="pattern-label">
                    {insights.decreasingYears} decreasing years ({((insights.decreasingYears / (insights.totalYears - 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="trend-indicator">
                  <label>Trend Direction:</label>
                  <span className={`trend-value ${insights.trend >= 0 ? 'positive' : 'negative'}`}>
                    {insights.trend >= 0 ? '↑' : '↓'} 
                    {insights.trend >= 0 ? ' Increasing' : ' Decreasing'}
                    <span className="trend-detail">
                      (${formatGDPValue(Math.abs(insights.trend))} change)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section gdp-growth-trend-section">
              <h3>GDP Trend</h3>
              <div className="gdp-chart-wrapper">
                <div ref={chartRef} className="gdp-chart"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-data-message">
            <p>No data available for the selected year range</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InfoPanel
