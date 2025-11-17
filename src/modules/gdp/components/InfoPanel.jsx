import React, { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import '../styles/InfoPanel.css'

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
      const growthValues = allFilteredData.map(d => d.growth);
      const avgGrowth = growthValues.reduce((sum, val) => sum + val, 0) / growthValues.length;
      const maxGrowth = Math.max(...growthValues);
      const minGrowth = Math.min(...growthValues);
      
      // Find which country had max/min
      const maxEntry = allFilteredData.find(d => d.growth === maxGrowth);
      const minEntry = allFilteredData.find(d => d.growth === minGrowth);
      const maxCountry = countriesData.find(c => c.data.includes(maxEntry))?.name || 'Unknown';
      const minCountry = countriesData.find(c => c.data.includes(minEntry))?.name || 'Unknown';
      const maxYear = maxEntry?.year;
      const minYear = minEntry?.year;
      
      // Calculate volatility (standard deviation)
      const mean = avgGrowth;
      const variance = growthValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / growthValues.length;
      const volatility = Math.sqrt(variance);
      
      // Calculate trend (comparing first half vs second half)
      const midPoint = Math.floor(allFilteredData.length / 2);
      const sortedByYear = [...allFilteredData].sort((a, b) => a.year - b.year);
      const firstHalf = sortedByYear.slice(0, midPoint);
      const secondHalf = sortedByYear.slice(midPoint);
      const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.growth, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.growth, 0) / secondHalf.length;
      const trend = secondHalfAvg - firstHalfAvg;
      
      // Count positive and negative growth years
      const positiveYears = growthValues.filter(v => v > 0).length;
      const negativeYears = growthValues.filter(v => v < 0).length;
      
      // Calculate individual country patterns
      const countryPatterns = countriesData.map(c => {
        const growths = c.data.map(d => d.growth);
        const positive = growths.filter(v => v > 0).length;
        const negative = growths.filter(v => v < 0).length;
        const total = growths.length;
        const avg = growths.reduce((sum, val) => sum + val, 0) / total;
        
        return {
          name: c.name,
          positiveYears: positive,
          negativeYears: negative,
          totalYears: total,
          positivePercent: (positive / total) * 100,
          negativePercent: (negative / total) * 100,
          avgGrowth: avg
        };
      });
      
      // Aggregate data by year for chart (average across countries)
      const yearMap = new Map();
      allFilteredData.forEach(d => {
        if (!yearMap.has(d.year)) {
          yearMap.set(d.year, []);
        }
        yearMap.get(d.year).push(d.growth);
      });
      
      const aggregatedData = Array.from(yearMap.entries()).map(([year, values]) => ({
        year,
        growth: values.reduce((sum, val) => sum + val, 0) / values.length
      })).sort((a, b) => a.year - b.year);
      
      return {
        avgGrowth,
        maxGrowth,
        minGrowth,
        maxYear,
        minYear,
        maxCountry,
        minCountry,
        volatility,
        trend,
        positiveYears,
        negativeYears,
        totalYears: allFilteredData.length,
        filteredData: aggregatedData,
        isMultiple: true,
        countryCount: country.countries.length,
        countriesData, // Keep individual country data for multi-line chart
        countryPatterns // Individual country growth patterns
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
    const growthValues = filteredData.map(d => d.growth);
    const avgGrowth = growthValues.reduce((sum, val) => sum + val, 0) / growthValues.length;
    const maxGrowth = Math.max(...growthValues);
    const minGrowth = Math.min(...growthValues);
    const maxYear = filteredData.find(d => d.growth === maxGrowth)?.year;
    const minYear = filteredData.find(d => d.growth === minGrowth)?.year;
    
    // Calculate volatility (standard deviation)
    const mean = avgGrowth;
    const variance = growthValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / growthValues.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midPoint);
    const secondHalf = filteredData.slice(midPoint);
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.growth, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.growth, 0) / secondHalf.length;
    const trend = secondHalfAvg - firstHalfAvg;
    
    // Count positive and negative growth years
    const positiveYears = growthValues.filter(v => v > 0).length;
    const negativeYears = growthValues.filter(v => v < 0).length;
    
    return {
      avgGrowth,
      maxGrowth,
      minGrowth,
      maxYear,
      minYear,
      volatility,
      trend,
      positiveYears,
      negativeYears,
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
    const margin = { top: 10, right: 10, bottom: 30, left: 40 }
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

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(sortedData, (d) => d.growth) - 2,
        d3.max(sortedData, (d) => d.growth) + 2,
      ])
      .range([height, 0])

    // Line generator
    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.growth))

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

    svg.append('g').call(d3.axisLeft(y)).style('font-size', '10px')

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
      .attr('cy', (d) => y(d.growth))
      .attr('r', 3)
      .attr('fill', '#667eea')
      .append('title')
      .text((d) => `${d.year}: ${d.growth.toFixed(2)}%`)
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
    const margin = { top: 20, right: 20, bottom: 30 + legendHeight, left: 40 }
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

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(allData, (d) => d.growth) - 2,
        d3.max(allData, (d) => d.growth) + 2,
      ])
      .range([height, 0])

    // Line generator
    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.growth))

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

    svg.append('g').call(d3.axisLeft(y)).style('font-size', '10px')

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
        .attr('cy', (d) => y(d.growth))
        .attr('r', 3)
        .attr('fill', color)
        .append('title')
        .text((d) => `${countryData.name} ${d.year}: ${d.growth.toFixed(2)}%`)
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

      legendRow
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colorScale(index))

      legendRow
        .append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '10px')
        .style('fill', '#333')
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
                  <label>Average Growth</label>
                  <span className={`stat-value ${insights.avgGrowth >= 0 ? 'positive' : 'negative'}`}>
                    {insights.avgGrowth.toFixed(2)}%
                  </span>
                  {insights.isMultiple && (
                    <span className="stat-year">combined avg</span>
                  )}
                </div>
                <div className="stat-card">
                  <label>Peak Growth</label>
                  <span className="stat-value positive">
                    {insights.maxGrowth.toFixed(2)}%
                  </span>
                  <span className="stat-year">
                    {insights.isMultiple 
                      ? `${insights.maxCountry}, ${insights.maxYear}`
                      : `in ${insights.maxYear}`}
                  </span>
                </div>
                <div className="stat-card">
                  <label>Lowest Growth</label>
                  <span className="stat-value negative">
                    {insights.minGrowth.toFixed(2)}%
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
                    {insights.volatility.toFixed(2)}%
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
                          color: pattern.avgGrowth >= 0 ? '#10b981' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {pattern.avgGrowth >= 0 ? '+' : ''}{pattern.avgGrowth.toFixed(2)}%
                        </span>
                      </div>
                      <div className="pattern-bars-container">
                        <div className="pattern-item">
                          <div className="pattern-bar">
                            <div 
                              className="pattern-fill positive" 
                              style={{width: `${pattern.positivePercent}%`}}
                            ></div>
                          </div>
                          <span className="pattern-label">
                            {pattern.positiveYears} positive ({pattern.positivePercent.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="pattern-item">
                          <div className="pattern-bar">
                            <div 
                              className="pattern-fill negative" 
                              style={{width: `${pattern.negativePercent}%`}}
                            ></div>
                          </div>
                          <span className="pattern-label">
                            {pattern.negativeYears} negative ({pattern.negativePercent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="trend-indicator">
                    <label>Overall Trend:</label>
                    <span className={`trend-value ${insights.trend >= 0 ? 'positive' : 'negative'}`}>
                      {insights.trend >= 0 ? '↑' : '↓'} 
                      {insights.trend >= 0 ? ' Growing' : ' Declining'}
                      <span className="trend-detail">
                        ({Math.abs(insights.trend).toFixed(2)}pp change)
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
                        style={{width: `${(insights.positiveYears / insights.totalYears) * 100}%`}}
                      ></div>
                    </div>
                    <span className="pattern-label">
                      {insights.positiveYears} positive years ({((insights.positiveYears / insights.totalYears) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="pattern-item">
                    <div className="pattern-bar">
                      <div 
                        className="pattern-fill negative" 
                        style={{width: `${(insights.negativeYears / insights.totalYears) * 100}%`}}
                      ></div>
                    </div>
                    <span className="pattern-label">
                      {insights.negativeYears} negative years ({((insights.negativeYears / insights.totalYears) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="trend-indicator">
                    <label>Trend Direction:</label>
                    <span className={`trend-value ${insights.trend >= 0 ? 'positive' : 'negative'}`}>
                      {insights.trend >= 0 ? '↑' : '↓'} 
                      {insights.trend >= 0 ? ' Growing' : ' Declining'}
                      <span className="trend-detail">
                        ({Math.abs(insights.trend).toFixed(2)}pp change)
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="info-section gdp-growth-trend-section">
              <h3>GDP Growth Trend</h3>
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
                  <label>Average Growth</label>
                  <span className={`stat-value ${insights.avgGrowth >= 0 ? 'positive' : 'negative'}`}>
                    {insights.avgGrowth.toFixed(2)}%
                  </span>
                </div>
                <div className="stat-card">
                  <label>Peak Growth</label>
                  <span className="stat-value positive">
                    {insights.maxGrowth.toFixed(2)}%
                  </span>
                  <span className="stat-year">in {insights.maxYear}</span>
                </div>
                <div className="stat-card">
                  <label>Lowest Growth</label>
                  <span className="stat-value negative">
                    {insights.minGrowth.toFixed(2)}%
                  </span>
                  <span className="stat-year">in {insights.minYear}</span>
                </div>
                <div className="stat-card">
                  <label>Volatility</label>
                  <span className="stat-value">
                    {insights.volatility.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Growth Pattern</h3>
              <div className="pattern-stats">
                <div className="pattern-item">
                  <div className="pattern-bar">
                    <div 
                      className="pattern-fill positive" 
                      style={{width: `${(insights.positiveYears / insights.totalYears) * 100}%`}}
                    ></div>
                  </div>
                  <span className="pattern-label">
                    {insights.positiveYears} positive years ({((insights.positiveYears / insights.totalYears) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="pattern-item">
                  <div className="pattern-bar">
                    <div 
                      className="pattern-fill negative" 
                      style={{width: `${(insights.negativeYears / insights.totalYears) * 100}%`}}
                    ></div>
                  </div>
                  <span className="pattern-label">
                    {insights.negativeYears} negative years ({((insights.negativeYears / insights.totalYears) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="trend-indicator">
                  <label>Trend Direction:</label>
                  <span className={`trend-value ${insights.trend >= 0 ? 'positive' : 'negative'}`}>
                    {insights.trend >= 0 ? '↑' : '↓'} 
                    {insights.trend >= 0 ? ' Growing' : ' Declining'}
                    <span className="trend-detail">
                      ({Math.abs(insights.trend).toFixed(2)}pp change)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section gdp-growth-trend-section">
              <h3>GDP Growth Trend</h3>
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
