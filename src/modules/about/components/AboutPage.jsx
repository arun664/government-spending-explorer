/**
 * About Page - Data Sources and Future Enhancements
 */

import '../styles/AboutPage.css'

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <header className="about-header">
          <h1>📊 Government Expense Dashboard</h1>
          <p className="subtitle-main">Data Sources and Future Enhancements</p>
        </header>

        <section className="about-section">
          <h2>📈 Data Sources</h2>
          <div className="data-source-card">
            <h3>IMF Government Finance Statistics (GFSE Database)</h3>
            <ul>
              <li><strong>48 Spending Indicators</strong> covering personnel, transfers, debt, operations, and social programs</li>
              <li><strong>177 Countries</strong> with varying data availability</li>
              <li><strong>Coverage:</strong> 1972-2023 (varies by country and indicator)</li>
              <li><strong>Size:</strong> 54MB expense_clean.csv + 150MB individual indicator files</li>
              <li><strong>Currency:</strong> Data displayed in each country's domestic currency (USD, EUR, INR, etc.)</li>
              <li><strong>Link:</strong> <a href="https://data.imf.org/?sk=a0867067-d23c-4ebc-ad23-d3b015045405" target="_blank" rel="noopener noreferrer">IMF Government Finance Statistics</a></li>
            </ul>
          </div>

          <div className="data-source-card">
            <h3>World Bank GDP Statistics</h3>
            <ul>
              <li><strong>GDP Growth Rates</strong> for global economic analysis</li>
              <li><strong>177 Countries</strong> with comprehensive coverage</li>
              <li><strong>Coverage:</strong> 2005-2023</li>
              <li><strong>Size:</strong> 207KB gdp_clean.csv</li>
              <li><strong>Link:</strong> <a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG" target="_blank" rel="noopener noreferrer">World Bank GDP Growth Data</a></li>
            </ul>
          </div>
        </section>

        <section className="about-section highlight">
          <h2>🚧 Future Enhancements</h2>
          <div className="warning-card">
            <h3>Planned Features</h3>
            
            <h4>1. USD Currency Conversion</h4>
            <p>
              Convert all spending values to USD using historical exchange rates to enable:
            </p>
            <ul>
              <li><strong>Accurate cross-country comparisons</strong> - Compare spending levels meaningfully</li>
              <li><strong>Value range filtering</strong> - Filter countries by spending amount in USD</li>
              <li><strong>Trend analysis</strong> - Track real spending changes adjusted for exchange rates</li>
              <li><strong>Ranking and benchmarking</strong> - Identify top/bottom spenders globally</li>
            </ul>

            <h4>2. US-Specific Analysis</h4>
            <p>
              Detailed US spending analysis with transaction-level insights from <a href="https://www.usaspending.gov/download_center/custom_award_data" target="_blank" rel="noopener noreferrer">USAspending.gov</a>:
            </p>
            <ul>
              <li>Agency-level spending breakdown</li>
              <li>Contract and grant analysis</li>
              <li>Geographic distribution of federal spending</li>
              <li>Historical trends with detailed categorization</li>
            </ul>

            <h4>3. Advanced Analytics</h4>
            <ul>
              <li>Predictive spending forecasts using machine learning</li>
              <li>Correlation analysis between spending and economic indicators</li>
              <li>Anomaly detection for unusual spending patterns</li>
              <li>Regional spending comparisons and benchmarks</li>
            </ul>

            <h4>4. Enhanced Visualizations</h4>
            <ul>
              <li>Time-series animations showing spending evolution</li>
              <li>Sankey diagrams for spending flow analysis</li>
              <li>Comparative bubble charts for multi-dimensional analysis</li>
              <li>Interactive treemaps for hierarchical spending breakdown</li>
            </ul>
          </div>
        </section>

        <section className="about-section footer-section">
          <h2>🔗 Data Source Links</h2>
          <ul>
            <li><a href="https://data.imf.org/?sk=a0867067-d23c-4ebc-ad23-d3b015045405" target="_blank" rel="noopener noreferrer">IMF Government Finance Statistics</a> - Primary data source for government spending indicators</li>
            <li><a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG" target="_blank" rel="noopener noreferrer">World Bank GDP Growth Data</a> - GDP growth rates and economic indicators</li>
            <li><a href="https://www.usaspending.gov/download_center/custom_award_data" target="_blank" rel="noopener noreferrer">USAspending.gov</a> - US federal spending data (planned for future integration)</li>
          </ul>
        </section>

        <footer className="about-footer">
          <p>Dashboard Version 1.0 | Data Last Updated: 2023</p>
          <p>Built with React, D3.js, and IMF Government Finance Statistics</p>
        </footer>
      </div>
    </div>
  )
}

export default AboutPage
