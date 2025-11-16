/**
 * ComparisonModes Utility
 * Handles switching between different data view modes and transformations
 * for government expense and GDP comparisons
 */

class ComparisonModes {
  constructor() {
    this.currentMode = {
      valueType: 'absolute', // 'absolute' | 'per_capita'
      displayType: 'raw', // 'raw' | 'percentage'
      timeMode: 'current', // 'current' | 'historical' | 'growth'
      normalization: 'none' // 'none' | 'gdp_ratio' | 'population' | 'regional_avg'
    };
    
    this.modeDefinitions = {
      valueType: {
        absolute: {
          label: 'Absolute Values',
          description: 'Show raw spending amounts in original currency',
          formatter: this.formatAbsolute.bind(this),
          transformer: this.transformAbsolute.bind(this)
        },
        per_capita: {
          label: 'Per Capita',
          description: 'Show spending per person',
          formatter: this.formatPerCapita.bind(this),
          transformer: this.transformPerCapita.bind(this)
        }
      },
      displayType: {
        raw: {
          label: 'Raw Values',
          description: 'Display actual calculated values',
          formatter: this.formatRaw.bind(this),
          transformer: this.transformRaw.bind(this)
        },
        percentage: {
          label: 'Percentage',
          description: 'Show as percentage of total or baseline',
          formatter: this.formatPercentage.bind(this),
          transformer: this.transformPercentage.bind(this)
        }
      },
      timeMode: {
        current: {
          label: 'Current Year',
          description: 'Show most recent available data',
          transformer: this.transformCurrent.bind(this)
        },
        historical: {
          label: 'Historical Average',
          description: 'Show average over selected time period',
          transformer: this.transformHistorical.bind(this)
        },
        growth: {
          label: 'Growth Rate',
          description: 'Show year-over-year growth rates',
          transformer: this.transformGrowth.bind(this),
          formatter: this.formatGrowthRate.bind(this)
        }
      },
      normalization: {
        none: {
          label: 'No Normalization',
          description: 'Show values as-is',
          transformer: this.transformNone.bind(this)
        },
        gdp_ratio: {
          label: 'GDP Ratio',
          description: 'Normalize by GDP percentage',
          transformer: this.transformGdpRatio.bind(this),
          formatter: this.formatGdpRatio.bind(this)
        },
        population: {
          label: 'Population Adjusted',
          description: 'Adjust for population size',
          transformer: this.transformPopulation.bind(this)
        },
        regional_avg: {
          label: 'Regional Average',
          description: 'Compare to regional average',
          transformer: this.transformRegionalAvg.bind(this),
          formatter: this.formatRegionalComparison.bind(this)
        }
      }
    };
  }

  /**
   * Set the current comparison mode
   * @param {Object} mode - Mode configuration
   * @returns {Object} Updated mode configuration
   */
  setMode(mode) {
    this.currentMode = { ...this.currentMode, ...mode };
    return this.currentMode;
  }

  /**
   * Get current mode configuration
   * @returns {Object} Current mode
   */
  getCurrentMode() {
    return { ...this.currentMode };
  }

  /**
   * Get available modes for a specific category
   * @param {string} category - Mode category
   * @returns {Object} Available modes
   */
  getAvailableModes(category) {
    return this.modeDefinitions[category] || {};
  }

  /**
   * Transform data according to current mode settings
   * @param {Array} data - Raw data array
   * @param {Object} options - Additional transformation options
   * @returns {Array} Transformed data
   */
  transformData(data, options = {}) {
    if (!data || data.length === 0) return [];

    let transformedData = [...data];

    // Apply value type transformation
    const valueTypeTransformer = this.modeDefinitions.valueType[this.currentMode.valueType]?.transformer;
    if (valueTypeTransformer) {
      transformedData = valueTypeTransformer(transformedData, options);
    }

    // Apply time mode transformation
    const timeModeTransformer = this.modeDefinitions.timeMode[this.currentMode.timeMode]?.transformer;
    if (timeModeTransformer) {
      transformedData = timeModeTransformer(transformedData, options);
    }

    // Apply normalization
    const normalizationTransformer = this.modeDefinitions.normalization[this.currentMode.normalization]?.transformer;
    if (normalizationTransformer) {
      transformedData = normalizationTransformer(transformedData, options);
    }

    // Apply display type transformation
    const displayTypeTransformer = this.modeDefinitions.displayType[this.currentMode.displayType]?.transformer;
    if (displayTypeTransformer) {
      transformedData = displayTypeTransformer(transformedData, options);
    }

    return transformedData;
  }

  /**
   * Format a value according to current mode settings
   * @param {number} value - Value to format
   * @param {Object} context - Additional context for formatting
   * @returns {string} Formatted value
   */
  formatValue(value, context = {}) {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    // Apply formatters in order of precedence
    const formatters = [
      this.modeDefinitions.timeMode[this.currentMode.timeMode]?.formatter,
      this.modeDefinitions.normalization[this.currentMode.normalization]?.formatter,
      this.modeDefinitions.displayType[this.currentMode.displayType]?.formatter,
      this.modeDefinitions.valueType[this.currentMode.valueType]?.formatter
    ].filter(Boolean);

    let formattedValue = value;
    for (const formatter of formatters) {
      formattedValue = formatter(formattedValue, context);
      if (typeof formattedValue === 'string') break;
    }

    return typeof formattedValue === 'string' ? formattedValue : this.formatDefault(formattedValue);
  }

  // Value Type Transformers
  transformAbsolute(data, options) {
    return data.map(item => ({
      ...item,
      displayValue: item.spending || item.value || 0,
      originalValue: item.spending || item.value || 0
    }));
  }

  transformPerCapita(data, options) {
    return data.map(item => ({
      ...item,
      displayValue: item.population && item.population > 0 
        ? (item.spending || item.value || 0) / item.population 
        : 0,
      originalValue: item.spending || item.value || 0
    }));
  }

  // Display Type Transformers
  transformRaw(data, options) {
    return data; // No transformation needed for raw values
  }

  transformPercentage(data, options) {
    const baseline = options.baseline || this.calculateBaseline(data, options);
    
    return data.map(item => ({
      ...item,
      displayValue: baseline > 0 ? ((item.displayValue || item.value || 0) / baseline) * 100 : 0,
      baseline
    }));
  }

  // Time Mode Transformers
  transformCurrent(data, options) {
    const currentYear = options.currentYear || Math.max(...data.map(d => d.year || 0));
    return data.filter(item => (item.year || 0) === currentYear);
  }

  transformHistorical(data, options) {
    const yearRange = options.yearRange || [Math.min(...data.map(d => d.year || 0)), Math.max(...data.map(d => d.year || 0))];
    const filteredData = data.filter(item => {
      const year = item.year || 0;
      return year >= yearRange[0] && year <= yearRange[1];
    });

    // Group by country and calculate averages
    const grouped = {};
    filteredData.forEach(item => {
      const key = item.country || item.countryCode || item.id;
      if (!grouped[key]) {
        grouped[key] = { ...item, values: [] };
      }
      grouped[key].values.push(item.displayValue || item.value || 0);
    });

    return Object.values(grouped).map(group => ({
      ...group,
      displayValue: group.values.reduce((sum, val) => sum + val, 0) / group.values.length,
      dataPoints: group.values.length
    }));
  }

  transformGrowth(data, options) {
    const grouped = {};
    
    // Group by country
    data.forEach(item => {
      const key = item.country || item.countryCode || item.id;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // Calculate growth rates
    return Object.values(grouped).map(countryData => {
      const sorted = countryData.sort((a, b) => (a.year || 0) - (b.year || 0));
      if (sorted.length < 2) {
        return { ...sorted[0], displayValue: 0, growthRate: 0 };
      }

      const firstValue = sorted[0].displayValue || sorted[0].value || 0;
      const lastValue = sorted[sorted.length - 1].displayValue || sorted[sorted.length - 1].value || 0;
      const years = sorted.length - 1;
      
      const growthRate = firstValue > 0 ? Math.pow(lastValue / firstValue, 1 / years) - 1 : 0;
      
      return {
        ...sorted[sorted.length - 1],
        displayValue: growthRate,
        growthRate,
        timeSpan: years
      };
    });
  }

  // Normalization Transformers
  transformNone(data, options) {
    return data; // No normalization
  }

  transformGdpRatio(data, options) {
    return data.map(item => ({
      ...item,
      displayValue: item.gdp && item.gdp > 0 
        ? ((item.displayValue || item.value || 0) / item.gdp) * 100 
        : 0,
      gdpRatio: item.gdp && item.gdp > 0 ? ((item.displayValue || item.value || 0) / item.gdp) * 100 : 0
    }));
  }

  transformPopulation(data, options) {
    return data.map(item => ({
      ...item,
      displayValue: item.population && item.population > 0 
        ? (item.displayValue || item.value || 0) / item.population 
        : 0
    }));
  }

  transformRegionalAvg(data, options) {
    // Calculate regional averages
    const regionalAverages = {};
    const regionalCounts = {};

    data.forEach(item => {
      const region = item.region || 'Unknown';
      if (!regionalAverages[region]) {
        regionalAverages[region] = 0;
        regionalCounts[region] = 0;
      }
      regionalAverages[region] += item.displayValue || item.value || 0;
      regionalCounts[region]++;
    });

    Object.keys(regionalAverages).forEach(region => {
      regionalAverages[region] /= regionalCounts[region];
    });

    return data.map(item => {
      const region = item.region || 'Unknown';
      const regionalAvg = regionalAverages[region] || 0;
      const value = item.displayValue || item.value || 0;
      
      return {
        ...item,
        displayValue: regionalAvg > 0 ? ((value / regionalAvg) - 1) * 100 : 0,
        regionalAverage: regionalAvg,
        deviationFromRegional: regionalAvg > 0 ? ((value / regionalAvg) - 1) * 100 : 0
      };
    });
  }

  // Formatters
  formatAbsolute(value, context) {
    return this.formatCurrency(value, context.currency || 'USD');
  }

  formatPerCapita(value, context) {
    return this.formatCurrency(value, context.currency || 'USD') + ' per capita';
  }

  formatRaw(value, context) {
    return value; // Return as number for further formatting
  }

  formatPercentage(value, context) {
    return `${value.toFixed(1)}%`;
  }

  formatGrowthRate(value, context) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)}% annually`;
  }

  formatGdpRatio(value, context) {
    return `${value.toFixed(2)}% of GDP`;
  }

  formatRegionalComparison(value, context) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}% vs regional avg`;
  }

  formatCurrency(value, currency = 'USD') {
    if (Math.abs(value) >= 1e12) {
      return `${(value / 1e12).toFixed(1)}T ${currency}`;
    } else if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B ${currency}`;
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M ${currency}`;
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K ${currency}`;
    } else {
      return `${value.toFixed(0)} ${currency}`;
    }
  }

  formatDefault(value) {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  }

  // Utility Methods
  calculateBaseline(data, options) {
    if (options.baselineType === 'max') {
      return Math.max(...data.map(d => d.displayValue || d.value || 0));
    } else if (options.baselineType === 'average') {
      const values = data.map(d => d.displayValue || d.value || 0);
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    } else if (options.baselineCountry) {
      const baseline = data.find(d => 
        (d.country || d.countryCode) === options.baselineCountry
      );
      return baseline ? (baseline.displayValue || baseline.value || 0) : 0;
    }
    
    // Default to total sum
    return data.reduce((sum, d) => sum + (d.displayValue || d.value || 0), 0);
  }

  /**
   * Get mode description for UI display
   * @returns {string} Human-readable description of current mode
   */
  getModeDescription() {
    const valueTypeDesc = this.modeDefinitions.valueType[this.currentMode.valueType]?.description || '';
    const displayTypeDesc = this.modeDefinitions.displayType[this.currentMode.displayType]?.description || '';
    const timeModeDesc = this.modeDefinitions.timeMode[this.currentMode.timeMode]?.description || '';
    const normalizationDesc = this.modeDefinitions.normalization[this.currentMode.normalization]?.description || '';

    return `${valueTypeDesc}, ${displayTypeDesc.toLowerCase()}, ${timeModeDesc.toLowerCase()}, ${normalizationDesc.toLowerCase()}`;
  }

  /**
   * Create a preset mode configuration
   * @param {string} presetName - Name of the preset
   * @returns {Object} Preset configuration
   */
  getPreset(presetName) {
    const presets = {
      'basic_comparison': {
        valueType: 'absolute',
        displayType: 'raw',
        timeMode: 'current',
        normalization: 'none'
      },
      'per_capita_analysis': {
        valueType: 'per_capita',
        displayType: 'raw',
        timeMode: 'current',
        normalization: 'none'
      },
      'gdp_efficiency': {
        valueType: 'absolute',
        displayType: 'raw',
        timeMode: 'current',
        normalization: 'gdp_ratio'
      },
      'growth_analysis': {
        valueType: 'absolute',
        displayType: 'raw',
        timeMode: 'growth',
        normalization: 'none'
      },
      'regional_comparison': {
        valueType: 'absolute',
        displayType: 'percentage',
        timeMode: 'current',
        normalization: 'regional_avg'
      },
      'historical_trends': {
        valueType: 'absolute',
        displayType: 'raw',
        timeMode: 'historical',
        normalization: 'none'
      }
    };

    return presets[presetName] || presets['basic_comparison'];
  }

  /**
   * Apply a preset mode configuration
   * @param {string} presetName - Name of the preset to apply
   * @returns {Object} Applied mode configuration
   */
  applyPreset(presetName) {
    const preset = this.getPreset(presetName);
    return this.setMode(preset);
  }
}

export default ComparisonModes;