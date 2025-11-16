import React, { useState, useEffect } from 'react';
import ComparisonFilters from './ComparisonFilters';
import ComparisonAnalytics from '../services/ComparisonAnalytics';
import ComparisonModes from '../utils/ComparisonModes';

/**
 * DashboardDemo Component
 * A simplified demonstration of the advanced controls and analytics system
 * Shows ComparisonFilters, ComparisonAnalytics, and ComparisonModes in action
 */
const DashboardDemo = () => {
  const [analytics] = useState(() => new ComparisonAnalytics());
  const [modes] = useState(() => new ComparisonModes());
  const [sampleData] = useState(() => generateDemoData());
  const [filteredData, setFilteredData] = useState([]);
  const [analysisResults, setAnalysisResults] = useState({});
  const [currentMode, setCurrentMode] = useState('basic_comparison');

  useEffect(() => {
    setFilteredData(sampleData);
    performAnalysis(sampleData);
  }, [sampleData]);

  const handleFiltersChange = (filters) => {
    console.log('Filters changed:', filters);
    
    let filtered = [...sampleData];
    
    // Apply country filters
    if (filters.countries && filters.countries.length > 0) {
      filtered = filtered.filter(item => 
        filters.countries.some(country => country.name === item.country)
      );
    }
    
    // Apply year range
    if (filters.yearRange) {
      filtered = filtered.filter(item => 
        item.year >= filters.yearRange.min && item.year <= filters.yearRange.max
      );
    }
    
    // Apply categories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(item => 
        filters.categories.includes(item.category)
      );
    }
    
    setFilteredData(filtered);
    performAnalysis(filtered);
  };

  const performAnalysis = (data) => {
    if (!data.length) return;

    // Correlation analysis
    const correlationData = {
      gdp: data.map(d => d.gdp),
      spending: data.map(d => d.spending),
      population: data.map(d => d.population)
    };
    const correlationMatrix = analytics.calculateCorrelationMatrix(correlationData);

    // Trend analysis for first country
    const firstCountry = data[0]?.country;
    const countryData = data
      .filter(d => d.country === firstCountry)
      .map(d => ({ year: d.year, value: d.spending }));
    const trendAnalysis = analytics.analyzeTrend(countryData);

    // Outlier detection
    const outlierAnalysis = analytics.detectOutliers(data.map(d => ({ 
      country: d.country, 
      value: d.spending 
    })));

    // Clustering
    const clusteringResults = analytics.performClustering(data, 3);

    setAnalysisResults({
      correlationMatrix,
      trendAnalysis,
      outlierAnalysis,
      clusteringResults
    });
  };

  const handleModeChange = (preset) => {
    setCurrentMode(preset);
    modes.applyPreset(preset);
    
    // Transform data according to new mode
    const transformedData = modes.transformData(filteredData);
    console.log('Mode changed to:', preset);
    console.log('Transformed data sample:', transformedData.slice(0, 3));
  };

  const formatValue = (value) => {
    return modes.formatValue(value);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Advanced Controls & Analytics Demo</h1>
      <p>Task 7: ComparisonFilters, ComparisonAnalytics, and ComparisonModes</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Filters Panel */}
        <div>
          <ComparisonFilters
            countries={getUniqueCountries(sampleData)}
            years={getUniqueYears(sampleData)}
            categories={getUniqueCategories(sampleData)}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Main Content */}
        <div>
          {/* Mode Controls */}
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Comparison Modes</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                'basic_comparison',
                'per_capita_analysis', 
                'gdp_efficiency',
                'growth_analysis',
                'regional_comparison'
              ].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleModeChange(preset)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: currentMode === preset ? '#3b82f6' : '#f3f4f6',
                    color: currentMode === preset ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              Current Mode: {modes.getModeDescription()}
            </p>
          </div>

          {/* Analytics Results */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* Correlation Matrix */}
            <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h4>Correlation Analysis</h4>
              {analysisResults.correlationMatrix && (
                <div style={{ fontSize: '12px' }}>
                  {Object.entries(analysisResults.correlationMatrix).map(([var1, correlations]) => (
                    <div key={var1} style={{ marginBottom: '5px' }}>
                      <strong>{var1}:</strong>
                      {Object.entries(correlations).map(([var2, correlation]) => (
                        <span key={var2} style={{ marginLeft: '10px' }}>
                          {var2}: {correlation.toFixed(3)}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trend Analysis */}
            <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h4>Trend Analysis</h4>
              {analysisResults.trendAnalysis && (
                <div style={{ fontSize: '12px' }}>
                  <p><strong>Trend:</strong> {analysisResults.trendAnalysis.trend}</p>
                  <p><strong>Strength:</strong> {analysisResults.trendAnalysis.trend_strength}</p>
                  <p><strong>Growth Rate:</strong> {(analysisResults.trendAnalysis.growth_rate * 100).toFixed(2)}%</p>
                  <p><strong>Volatility:</strong> {(analysisResults.trendAnalysis.volatility * 100).toFixed(2)}%</p>
                </div>
              )}
            </div>

            {/* Outlier Detection */}
            <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h4>Outlier Detection</h4>
              {analysisResults.outlierAnalysis && (
                <div style={{ fontSize: '12px' }}>
                  <p><strong>Outliers Found:</strong> {analysisResults.outlierAnalysis.outlierCount}</p>
                  <p><strong>Percentage:</strong> {analysisResults.outlierAnalysis.outlierPercentage.toFixed(1)}%</p>
                  {analysisResults.outlierAnalysis.outliers.slice(0, 3).map((outlier, index) => (
                    <div key={index} style={{ 
                      padding: '4px', 
                      backgroundColor: outlier.type === 'high' ? '#fef2f2' : '#f0f9ff',
                      margin: '2px 0',
                      borderRadius: '3px'
                    }}>
                      {outlier.country}: {formatValue(outlier.value)} ({outlier.type})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clustering Results */}
            <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <h4>Country Clustering</h4>
              {analysisResults.clusteringResults && (
                <div style={{ fontSize: '12px' }}>
                  <p><strong>Clusters:</strong> {analysisResults.clusteringResults.clusters.length}</p>
                  <p><strong>Quality Score:</strong> {analysisResults.clusteringResults.silhouetteScore?.toFixed(3) || 'N/A'}</p>
                  {analysisResults.clusteringResults.clusters.map((cluster, index) => (
                    <div key={index} style={{ 
                      padding: '4px', 
                      backgroundColor: `hsl(${index * 120}, 70%, 95%)`,
                      margin: '2px 0',
                      borderRadius: '3px'
                    }}>
                      <strong>Cluster {index + 1}:</strong> {cluster.slice(0, 3).map(c => c.country).join(', ')}
                      {cluster.length > 3 && ` (+${cluster.length - 3} more)`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Data Preview */}
          <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h4>Filtered Data Preview ({filteredData.length} records)</h4>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Country</th>
                    <th style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Year</th>
                    <th style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Spending</th>
                    <th style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left' }}>GDP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 8).map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{item.country}</td>
                      <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{item.year}</td>
                      <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{item.category}</td>
                      <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{formatValue(item.spending)}</td>
                      <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{formatValue(item.gdp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getUniqueCountries = (data) => {
  const countries = data.map(d => ({
    name: d.country,
    code: d.countryCode,
    region: d.region
  }));
  
  return countries.filter((country, index, self) => 
    index === self.findIndex(c => c.code === country.code)
  );
};

const getUniqueYears = (data) => {
  return [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
};

const getUniqueCategories = (data) => {
  return [...new Set(data.map(d => d.category))];
};

// Generate demo data
const generateDemoData = () => {
  const countries = [
    { name: 'United States', code: 'US', region: 'North America' },
    { name: 'Germany', code: 'DE', region: 'Europe' },
    { name: 'Japan', code: 'JP', region: 'Asia' },
    { name: 'United Kingdom', code: 'GB', region: 'Europe' },
    { name: 'France', code: 'FR', region: 'Europe' }
  ];
  
  const categories = ['Defense', 'Healthcare', 'Education'];
  const years = [2020, 2021, 2022, 2023];
  
  const data = [];
  
  countries.forEach(country => {
    years.forEach(year => {
      categories.forEach(category => {
        const baseGdp = Math.random() * 10000000000000 + 1000000000000;
        const population = Math.random() * 200000000 + 50000000;
        const spending = baseGdp * (0.1 + Math.random() * 0.1);
        
        data.push({
          country: country.name,
          countryCode: country.code,
          region: country.region,
          year,
          category,
          spending,
          gdp: baseGdp,
          population,
          gdpPerCapita: baseGdp / population,
          spendingPerCapita: spending / population
        });
      });
    });
  });
  
  return data;
};

export default DashboardDemo;