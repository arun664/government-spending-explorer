import * as d3 from 'd3'
import { getDataPath } from '../utils/pathUtils.js'

class IndicatorsDataService {
  constructor() {
    this.cache = new Map()
    this.metadata = null
    this.globalInsights = null
    this.usData = null
  }

  /**
   * Dynamically enumerate all indicator files and extract their INDICATOR_LABELs
   * Returns: Array of { code, label, file }
   */
  async enumerateIndicators() {
    let indicators = [];
    try {
      const metadata = await this.loadMetadata();
      if (metadata && metadata.priority_indicators) {
        indicators = Object.entries(metadata.priority_indicators).map(([file, label]) => {
          // Extract code from file name (e.g., IMF_GFSE_GECE_G14 -> GECE)
          const match = file.match(/IMF_GFSE_([A-Z_]+)_G14/);
          const code = match ? match[1] : file;
          return { code, label, file };
        });
      }
    } catch (e) {
      indicators = [];
    }
    return indicators;
  }

  /**
   * Load metadata about the indicators
   */
  async loadMetadata() {
    if (this.metadata) return this.metadata

    try {
      const response = await fetch(getDataPath('metadata.json'))
      this.metadata = await response.json()
      return this.metadata
    } catch (error) {
      console.error('Error loading metadata:', error)
      throw error
    }
  }

  /**
   * Load global insights (top/bottom performers)
   */
  async loadGlobalInsights() {
    if (this.globalInsights) return this.globalInsights

    try {
      const response = await fetch(getDataPath('global_insights.json'))
      this.globalInsights = await response.json()
      return this.globalInsights
    } catch (error) {
      console.error('Error loading global insights:', error)
      throw error
    }
  }

  /**
   * Load US-specific spending data
   */
  async loadUSData() {
    if (this.usData) return this.usData

    try {
      const response = await fetch(getDataPath('us_summary.json'))
      this.usData = await response.json()
      return this.usData
    } catch (error) {
      console.error('Error loading US data:', error)
      throw error
    }
  }

  /**
   * Load specific indicator data from 48 indicators CSV files
   * @param {string} indicatorCode - Code of the indicator (e.g., 'GE', 'GECE')
   */
  async loadIndicatorData(indicatorCode) {
    const cacheKey = `indicator_${indicatorCode}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const fileName = `IMF_GFSE_${indicatorCode}_G14.csv`;
      const response = await fetch(getDataPath(`48-indicators/${fileName}`));
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
      }
      const csvText = await response.text();
      const rawData = d3.csvParse(csvText);
      const processedData = this.transformIndicatorData(rawData, indicatorCode);
      this.cache.set(cacheKey, processedData);
      return processedData;
    } catch (error) {
      console.error(`Error loading indicator ${indicatorCode}:`, error);
      throw error;
    }
  }

  /**
   * Transform 48 indicators data into dashboard-friendly format
   */
  transformIndicatorData(rawData, indicatorCode) {
    const countries = {};
    const years = new Set();
    let totalValues = [];
    let minSpending = Infinity;
    let maxSpending = -Infinity;

    rawData.forEach(row => {
      const countryName = row.REF_AREA_LABEL;
      const year = parseInt(row.TIME_PERIOD);
      let value = parseFloat(row.OBS_VALUE);
      const sector = row.COMP_BREAKDOWN_1_LABEL || 'General Government';
      const unit = row.UNIT_MEASURE;
      const unitLabel = row.UNIT_MEASURE_LABEL;
      const unitMult = row.UNIT_MULT_LABEL;

      if (!countryName || isNaN(year) || isNaN(value)) return;

      // Convert millions to actual values for better comparison
      if (unitMult === 'Millions') {
        value = value * 1000000;
      }

      if (!countries[countryName]) {
        countries[countryName] = {
          data: {},
          sectors: {},
          unit,
          unitLabel,
          unitMult
        };
      }

      // Aggregate by year (sum across sectors for same country/year)
      if (!countries[countryName].data[year]) {
        countries[countryName].data[year] = 0;
      }
      countries[countryName].data[year] += value;

      // Track sector data separately
      if (!countries[countryName].sectors[sector]) {
        countries[countryName].sectors[sector] = {};
      }
      if (!countries[countryName].sectors[sector][year]) {
        countries[countryName].sectors[sector][year] = 0;
      }
      countries[countryName].sectors[sector][year] += value;

      years.add(year);
      totalValues.push(value);
      minSpending = Math.min(minSpending, value);
      maxSpending = Math.max(maxSpending, value);
    });

    const yearsArray = Array.from(years).sort();

    // Calculate global statistics
    const globalStats = {
      totalCountries: Object.keys(countries).length,
      minSpending: minSpending === Infinity ? 0 : minSpending,
      maxSpending: maxSpending === -Infinity ? 100 : maxSpending,
      avgSpending: totalValues.length > 0 ? totalValues.reduce((a, b) => a + b, 0) / totalValues.length : 0,
      totalDataPoints: totalValues.length
    };

    return {
      countries,
      years: yearsArray,
      indicatorCode,
      globalStats,
      metadata: {
        totalCountries: Object.keys(countries).length,
        yearRange: yearsArray.length > 0 ? [Math.min(...yearsArray), Math.max(...yearsArray)] : [2005, 2022],
        totalRecords: totalValues.length,
        availableUnits: [...new Set(rawData.map(row => row.UNIT_MEASURE_LABEL))],
        availableSectors: [...new Set(rawData.map(row => row.COMP_BREAKDOWN_1_LABEL))]
      }
    };
  }

  /**
   * Load US spending breakdown by sector and year
   */
  async loadUSBreakdown() {
    const cacheKey = 'us_breakdown'
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await fetch(getDataPath('us_spending_breakdown.csv'))
      const csvText = await response.text()
      const rawData = d3.csvParse(csvText, d => ({
        indicatorCode: d.IndicatorCode,
        indicator: d.Indicator,
        sectorGroup: d.SectorGroup,
        year: parseInt(d.Year),
        value: parseFloat(d.Value),
        yoyChange: parseFloat(d.YoY_Change)
      }))

      // Group by indicator and sector
      const processedData = this.groupUSBreakdown(rawData)
      const result = {
        spendingCategories: Object.keys(processedData),
        data: processedData
      }
      
      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      console.error('Error loading US breakdown:', error)
      throw error
    }
  }

  /**
   * Group US breakdown data by indicator and sector
   */
  groupUSBreakdown(rawData) {
    const grouped = {}

    rawData.forEach(item => {
      if (!grouped[item.indicator]) {
        grouped[item.indicator] = {
          name: item.indicator,
          code: item.indicatorCode,
          sectors: {},
          totalByYear: {}
        }
      }

      // Group by sector
      if (!grouped[item.indicator].sectors[item.sectorGroup]) {
        grouped[item.indicator].sectors[item.sectorGroup] = []
      }
      grouped[item.indicator].sectors[item.sectorGroup].push(item)

      // Total by year (sum across sectors)
      if (!grouped[item.indicator].totalByYear[item.year]) {
        grouped[item.indicator].totalByYear[item.year] = 0
      }
      grouped[item.indicator].totalByYear[item.year] += item.value || 0
    })

    return grouped
  }

  /**
   * Get comparative analysis between countries for a specific indicator
   */
  async getComparativeAnalysis(indicatorName, countries, yearRange = [2015, 2022]) {
    const data = await this.loadIndicatorMatrix(indicatorName)
    const insights = await this.loadGlobalInsights()
    
    const analysis = {
      countries: {},
      rankings: [],
      trends: {},
      summary: {}
    }

    // Filter data for selected countries and years
    countries.forEach(countryName => {
      if (data.countries[countryName]) {
        const countryData = data.countries[countryName].data.filter(d => 
          d.year >= yearRange[0] && d.year <= yearRange[1]
        )
        
        if (countryData.length > 0) {
          const values = countryData.map(d => d.value)
          const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length
          
          analysis.countries[countryName] = {
            data: countryData,
            average: avgValue,
            min: Math.min(...values),
            max: Math.max(...values),
            trend: this.calculateTrend(countryData)
          }
        }
      }
    })

    // Create rankings
    analysis.rankings = Object.entries(analysis.countries)
      .map(([name, data]) => ({ name, average: data.average }))
      .sort((a, b) => b.average - a.average)

    // Add global context from insights
    if (insights[indicatorName]) {
      analysis.globalContext = insights[indicatorName]
    }

    return analysis
  }

  /**
   * Calculate trend (simple linear regression slope)
   */
  calculateTrend(data) {
    if (data.length < 2) return 0

    const n = data.length
    const sumX = data.reduce((sum, d) => sum + d.year, 0)
    const sumY = data.reduce((sum, d) => sum + d.value, 0)
    const sumXY = data.reduce((sum, d) => sum + (d.year * d.value), 0)
    const sumXX = data.reduce((sum, d) => sum + (d.year * d.year), 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    return slope || 0
  }

  /**
   * Get dashboard summary data
   */
  async getDashboardSummary() {
    try {
      const [metadata, globalInsights, usData] = await Promise.all([
        this.loadMetadata(),
        this.loadGlobalInsights(),
        this.loadUSData()
      ])

      return {
        metadata,
        globalInsights,
        usData,
        indicators: metadata.priority_indicators,
        coverage: {
          countries: metadata.countries_covered,
          years: metadata.date_range,
          totalRecords: metadata.total_records
        }
      }
    } catch (error) {
      console.error('Error loading dashboard summary:', error)
      throw error
    }
  }

  /**
   * Search countries by name or code
   */
  async searchCountries(query) {
    const data = await this.loadIndicatorData('GE') // Use Total Government Expense as default
    const countries = Object.keys(data.countries)
    
    if (!query) return countries.slice(0, 20)
    
    const filtered = countries.filter(name => 
      name.toLowerCase().includes(query.toLowerCase())
    )
    
    return filtered.slice(0, 20)
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    this.metadata = null
    this.globalInsights = null
    this.usData = null
  }
}

// Create singleton instance
export const indicatorsDataService = new IndicatorsDataService()
export default IndicatorsDataService