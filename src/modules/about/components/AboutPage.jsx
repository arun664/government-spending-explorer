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
              <li><strong>Government Expenditure Data</strong> by functional classification across countries</li>
              <li><strong>Categories:</strong> Education, Health, Defense, Social Protection, Economic Affairs, General Public Services, Public Order and Safety, Environmental Protection, Housing and Community Amenities, Recreation Culture and Religion</li>
              <li><strong>Coverage:</strong> 2005-2022 (varies by country and category)</li>
              <li><strong>Size:</strong> 14.27 MB (expense_clean_usd.csv)</li>
              <li><strong>Currency:</strong> Converted to USD for cross-country comparison</li>
              <li><strong>Link:</strong> <a href="https://data360.worldbank.org/en/dataset/IMF_GFSE" target="_blank" rel="noopener noreferrer">World Bank - IMF Government Finance Statistics</a></li>
            </ul>
          </div>

          <div className="data-source-card">
            <h3>World Bank GDP Statistics</h3>
            <ul>
              <li><strong>GDP Values</strong> in current USD for economic analysis</li>
              <li><strong>200+ Countries</strong> with comprehensive coverage</li>
              <li><strong>Coverage:</strong> 1960-2022</li>
              <li><strong>Size:</strong> 0.16 MB (gdp_vals.csv)</li>
              <li><strong>Link:</strong> <a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD" target="_blank" rel="noopener noreferrer">World Bank GDP Data</a></li>
            </ul>
          </div>
        </section>

        <section className="about-section highlight">
          <h2>🚧 Future Enhancements</h2>
          <div className="warning-card">
            <h3>Planned Features</h3>
            
            <h4>1. US-Specific Government Spending Analysis</h4>
            <p>
              Detailed US spending analysis with transaction-level insights from <a href="https://www.usaspending.gov/download_center/custom_award_data" target="_blank" rel="noopener noreferrer">USAspending.gov</a>:
            </p>
            <ul>
              <li>Department and agency-level spending breakdown</li>
              <li>Contract and grant analysis</li>
              <li>Geographic distribution of federal spending</li>
              <li>Historical trends with detailed categorization</li>
              <li>Transaction-level data exploration</li>
            </ul>

            <h4>2. Advanced Analytics</h4>
            <ul>
              <li>Predictive spending forecasts using machine learning</li>
              <li>Correlation analysis between spending and economic indicators</li>
              <li>Anomaly detection for unusual spending patterns</li>
              <li>Regional spending comparisons and benchmarks</li>
            </ul>

            <h4>3. Enhanced Visualizations</h4>
            <ul>
              <li>Sankey diagrams for spending flow analysis</li>
              <li>Comparative bubble charts for multi-dimensional analysis</li>
              <li>Interactive treemaps for hierarchical spending breakdown</li>
              <li>Additional economic indicators (inflation, unemployment)</li>
            </ul>

            <h4>4. Additional Features</h4>
            <ul>
              <li>Data export functionality (CSV, PDF)</li>
              <li>Support for multiple languages</li>
              <li>Mobile-optimized touch interactions</li>
              <li>More granular spending subcategories</li>
            </ul>
          </div>
        </section>

        <section className="about-section footer-section">
          <h2>🔗 Data Source Links</h2>
          <ul>
            <li><a href="https://data360.worldbank.org/en/dataset/IMF_GFSE" target="_blank" rel="noopener noreferrer">World Bank - IMF Government Finance Statistics</a> - Primary data source for government spending by category</li>
            <li><a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD" target="_blank" rel="noopener noreferrer">World Bank GDP Data</a> - GDP values in current USD</li>
            <li><a href="https://www.usaspending.gov/download_center/custom_award_data" target="_blank" rel="noopener noreferrer">USAspending.gov</a> - US federal spending data (planned for future integration)</li>
          </ul>
        </section>

        <footer className="about-footer">
          <p>Dashboard Version 1.0 | Data Coverage: 2005-2022</p>
          <p>Built with React, D3.js, and World Bank Data</p>
        </footer>
      </div>
    </div>
  )
}

export default AboutPage
