/**
 * ComparisonAnalytics Service
 * Provides advanced analytical capabilities for government expense data
 * including correlation analysis, trend detection, and outlier identification
 */

class ComparisonAnalytics {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate correlation coefficient between two datasets
   * @param {Array} x - First dataset
   * @param {Array} y - Second dataset
   * @returns {number} Correlation coefficient (-1 to 1)
   */
  calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate correlation matrix for multiple variables
   * @param {Object} data - Object with variable names as keys and arrays as values
   * @returns {Object} Correlation matrix
   */
  calculateCorrelationMatrix(data) {
    const cacheKey = `correlation_matrix_${JSON.stringify(Object.keys(data))}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const variables = Object.keys(data);
    const matrix = {};

    variables.forEach(var1 => {
      matrix[var1] = {};
      variables.forEach(var2 => {
        if (var1 === var2) {
          matrix[var1][var2] = 1;
        } else {
          matrix[var1][var2] = this.calculateCorrelation(data[var1], data[var2]);
        }
      });
    });

    this.setCache(cacheKey, matrix);
    return matrix;
  }

  /**
   * Perform trend analysis on time series data
   * @param {Array} data - Array of {year, value} objects
   * @returns {Object} Trend analysis results
   */
  analyzeTrend(data) {
    if (!data || data.length < 2) {
      return {
        trend: 'insufficient_data',
        slope: 0,
        r_squared: 0,
        forecast: null,
        volatility: 0
      };
    }

    // Sort by year
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    const years = sortedData.map(d => d.year);
    const values = sortedData.map(d => d.value);

    // Calculate linear regression
    const regression = this.calculateLinearRegression(years, values);
    
    // Calculate volatility (standard deviation of year-over-year changes)
    const volatility = this.calculateVolatility(values);

    // Determine trend direction
    let trend = 'stable';
    if (Math.abs(regression.slope) > 0.01) {
      trend = regression.slope > 0 ? 'increasing' : 'decreasing';
    }

    // Generate forecast for next 3 years
    const lastYear = Math.max(...years);
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const forecastYear = lastYear + i;
      const forecastValue = regression.intercept + regression.slope * forecastYear;
      forecast.push({
        year: forecastYear,
        value: Math.max(0, forecastValue), // Ensure non-negative
        confidence: Math.max(0.1, regression.r_squared * (1 - i * 0.1)) // Decreasing confidence
      });
    }

    return {
      trend,
      slope: regression.slope,
      r_squared: regression.r_squared,
      forecast,
      volatility,
      growth_rate: this.calculateAverageGrowthRate(values),
      trend_strength: this.categorizeTrendStrength(regression.r_squared)
    };
  }

  /**
   * Calculate linear regression
   * @param {Array} x - Independent variable
   * @param {Array} y - Dependent variable
   * @returns {Object} Regression results
   */
  calculateLinearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = intercept + slope * x[i];
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const r_squared = 1 - (residualSumSquares / totalSumSquares);

    return { slope, intercept, r_squared };
  }

  /**
   * Calculate volatility (standard deviation of year-over-year changes)
   * @param {Array} values - Array of values
   * @returns {number} Volatility measure
   */
  calculateVolatility(values) {
    if (values.length < 2) return 0;

    const changes = [];
    for (let i = 1; i < values.length; i++) {
      const change = (values[i] - values[i - 1]) / values[i - 1];
      changes.push(change);
    }

    const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate average growth rate
   * @param {Array} values - Array of values
   * @returns {number} Average annual growth rate
   */
  calculateAverageGrowthRate(values) {
    if (values.length < 2) return 0;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const years = values.length - 1;

    return Math.pow(lastValue / firstValue, 1 / years) - 1;
  }

  /**
   * Categorize trend strength based on R-squared
   * @param {number} rSquared - R-squared value
   * @returns {string} Trend strength category
   */
  categorizeTrendStrength(rSquared) {
    if (rSquared >= 0.8) return 'very_strong';
    if (rSquared >= 0.6) return 'strong';
    if (rSquared >= 0.4) return 'moderate';
    if (rSquared >= 0.2) return 'weak';
    return 'very_weak';
  }

  /**
   * Detect outliers using IQR method
   * @param {Array} data - Array of data points
   * @returns {Object} Outlier analysis results
   */
  detectOutliers(data) {
    if (!data || data.length < 4) {
      return {
        outliers: [],
        lowerBound: null,
        upperBound: null,
        method: 'insufficient_data'
      };
    }

    const values = data.map(d => typeof d === 'object' ? d.value : d);
    const sorted = [...values].sort((a, b) => a - b);
    
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = data.filter((d, index) => {
      const value = typeof d === 'object' ? d.value : d;
      const isOutlier = value < lowerBound || value > upperBound;
      return isOutlier ? { ...d, index, value, type: value < lowerBound ? 'low' : 'high' } : false;
    }).filter(Boolean);

    return {
      outliers,
      lowerBound,
      upperBound,
      q1,
      q3,
      iqr,
      method: 'iqr',
      outlierCount: outliers.length,
      outlierPercentage: (outliers.length / data.length) * 100
    };
  }

  /**
   * Perform clustering analysis using k-means
   * @param {Array} data - Array of data points with multiple dimensions
   * @param {number} k - Number of clusters
   * @returns {Object} Clustering results
   */
  performClustering(data, k = 3) {
    if (!data || data.length < k) {
      return {
        clusters: [],
        centroids: [],
        error: 'insufficient_data'
      };
    }

    const cacheKey = `clustering_${k}_${data.length}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Extract features for clustering
    const features = this.extractFeatures(data);
    
    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Perform k-means clustering
    const result = this.kMeansClustering(normalizedFeatures, k);
    
    // Add cluster assignments to original data
    const clusteredData = data.map((item, index) => ({
      ...item,
      cluster: result.assignments[index],
      distanceToCenter: result.distances[index]
    }));

    const finalResult = {
      clusters: this.groupByCluster(clusteredData),
      centroids: result.centroids,
      assignments: result.assignments,
      inertia: result.inertia,
      silhouetteScore: this.calculateSilhouetteScore(normalizedFeatures, result.assignments)
    };

    this.setCache(cacheKey, finalResult);
    return finalResult;
  }

  /**
   * Extract numerical features from data for clustering
   * @param {Array} data - Raw data
   * @returns {Array} Feature matrix
   */
  extractFeatures(data) {
    return data.map(item => [
      item.gdp || 0,
      item.spending || 0,
      item.gdpPerCapita || 0,
      item.spendingPerCapita || 0,
      item.spendingGdpRatio || 0
    ]);
  }

  /**
   * Normalize features to 0-1 range
   * @param {Array} features - Feature matrix
   * @returns {Array} Normalized feature matrix
   */
  normalizeFeatures(features) {
    const numFeatures = features[0].length;
    const mins = new Array(numFeatures).fill(Infinity);
    const maxs = new Array(numFeatures).fill(-Infinity);

    // Find min and max for each feature
    features.forEach(row => {
      row.forEach((value, i) => {
        mins[i] = Math.min(mins[i], value);
        maxs[i] = Math.max(maxs[i], value);
      });
    });

    // Normalize
    return features.map(row =>
      row.map((value, i) => {
        const range = maxs[i] - mins[i];
        return range === 0 ? 0 : (value - mins[i]) / range;
      })
    );
  }

  /**
   * K-means clustering implementation
   * @param {Array} data - Normalized feature matrix
   * @param {number} k - Number of clusters
   * @returns {Object} Clustering results
   */
  kMeansClustering(data, k) {
    const maxIterations = 100;
    const tolerance = 1e-6;

    // Initialize centroids randomly
    let centroids = this.initializeCentroids(data, k);
    let assignments = new Array(data.length);
    let distances = new Array(data.length);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Assign points to nearest centroid
      let changed = false;
      for (let i = 0; i < data.length; i++) {
        const newAssignment = this.findNearestCentroid(data[i], centroids);
        if (assignments[i] !== newAssignment) {
          changed = true;
          assignments[i] = newAssignment;
        }
        distances[i] = this.euclideanDistance(data[i], centroids[newAssignment]);
      }

      if (!changed) break;

      // Update centroids
      const newCentroids = this.updateCentroids(data, assignments, k);
      
      // Check for convergence
      const centroidChange = this.calculateCentroidChange(centroids, newCentroids);
      centroids = newCentroids;
      
      if (centroidChange < tolerance) break;
    }

    // Calculate inertia (within-cluster sum of squares)
    const inertia = distances.reduce((sum, dist) => sum + dist * dist, 0);

    return { centroids, assignments, distances, inertia };
  }

  /**
   * Initialize centroids using k-means++ method
   * @param {Array} data - Data points
   * @param {number} k - Number of clusters
   * @returns {Array} Initial centroids
   */
  initializeCentroids(data, k) {
    const centroids = [];
    
    // Choose first centroid randomly
    centroids.push([...data[Math.floor(Math.random() * data.length)]]);
    
    // Choose remaining centroids using k-means++
    for (let i = 1; i < k; i++) {
      const distances = data.map(point => {
        const minDist = Math.min(...centroids.map(centroid => 
          this.euclideanDistance(point, centroid)
        ));
        return minDist * minDist;
      });
      
      const totalDist = distances.reduce((sum, dist) => sum + dist, 0);
      const threshold = Math.random() * totalDist;
      
      let cumulative = 0;
      for (let j = 0; j < data.length; j++) {
        cumulative += distances[j];
        if (cumulative >= threshold) {
          centroids.push([...data[j]]);
          break;
        }
      }
    }
    
    return centroids;
  }

  /**
   * Find nearest centroid for a data point
   * @param {Array} point - Data point
   * @param {Array} centroids - Array of centroids
   * @returns {number} Index of nearest centroid
   */
  findNearestCentroid(point, centroids) {
    let minDistance = Infinity;
    let nearestIndex = 0;

    centroids.forEach((centroid, index) => {
      const distance = this.euclideanDistance(point, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  /**
   * Calculate Euclidean distance between two points
   * @param {Array} point1 - First point
   * @param {Array} point2 - Second point
   * @returns {number} Euclidean distance
   */
  euclideanDistance(point1, point2) {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  /**
   * Update centroids based on current assignments
   * @param {Array} data - Data points
   * @param {Array} assignments - Cluster assignments
   * @param {number} k - Number of clusters
   * @returns {Array} Updated centroids
   */
  updateCentroids(data, assignments, k) {
    const centroids = [];
    
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, index) => assignments[index] === i);
      
      if (clusterPoints.length === 0) {
        // If cluster is empty, keep previous centroid or initialize randomly
        centroids.push(new Array(data[0].length).fill(0));
      } else {
        const centroid = new Array(data[0].length).fill(0);
        clusterPoints.forEach(point => {
          point.forEach((value, j) => {
            centroid[j] += value;
          });
        });
        centroids.push(centroid.map(sum => sum / clusterPoints.length));
      }
    }
    
    return centroids;
  }

  /**
   * Calculate change in centroids between iterations
   * @param {Array} oldCentroids - Previous centroids
   * @param {Array} newCentroids - New centroids
   * @returns {number} Total change
   */
  calculateCentroidChange(oldCentroids, newCentroids) {
    return oldCentroids.reduce((totalChange, oldCentroid, i) => {
      const change = this.euclideanDistance(oldCentroid, newCentroids[i]);
      return totalChange + change;
    }, 0);
  }

  /**
   * Group data by cluster assignment
   * @param {Array} data - Data with cluster assignments
   * @returns {Array} Array of clusters
   */
  groupByCluster(data) {
    const clusters = {};
    
    data.forEach(item => {
      const cluster = item.cluster;
      if (!clusters[cluster]) {
        clusters[cluster] = [];
      }
      clusters[cluster].push(item);
    });
    
    return Object.values(clusters);
  }

  /**
   * Calculate silhouette score for clustering quality
   * @param {Array} data - Data points
   * @param {Array} assignments - Cluster assignments
   * @returns {number} Silhouette score
   */
  calculateSilhouetteScore(data, assignments) {
    if (data.length < 2) return 0;

    const scores = data.map((point, i) => {
      const cluster = assignments[i];
      
      // Calculate average distance to points in same cluster (a)
      const sameClusterPoints = data.filter((_, j) => assignments[j] === cluster && i !== j);
      const a = sameClusterPoints.length === 0 ? 0 : 
        sameClusterPoints.reduce((sum, other) => sum + this.euclideanDistance(point, other), 0) / sameClusterPoints.length;
      
      // Calculate minimum average distance to points in other clusters (b)
      const otherClusters = [...new Set(assignments)].filter(c => c !== cluster);
      const b = Math.min(...otherClusters.map(otherCluster => {
        const otherClusterPoints = data.filter((_, j) => assignments[j] === otherCluster);
        return otherClusterPoints.reduce((sum, other) => sum + this.euclideanDistance(point, other), 0) / otherClusterPoints.length;
      }));
      
      return (b - a) / Math.max(a, b);
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Perform predictive modeling using simple linear regression
   * @param {Array} historicalData - Historical data points
   * @param {number} forecastPeriods - Number of periods to forecast
   * @returns {Object} Prediction results
   */
  performPredictiveModeling(historicalData, forecastPeriods = 3) {
    const trendAnalysis = this.analyzeTrend(historicalData);
    
    if (trendAnalysis.trend === 'insufficient_data') {
      return {
        predictions: [],
        confidence: 0,
        model: 'insufficient_data'
      };
    }

    const lastYear = Math.max(...historicalData.map(d => d.year));
    const predictions = [];
    
    for (let i = 1; i <= forecastPeriods; i++) {
      const year = lastYear + i;
      const baseValue = trendAnalysis.forecast.find(f => f.year === year)?.value || 0;
      
      // Add uncertainty based on historical volatility
      const uncertainty = trendAnalysis.volatility * baseValue * i * 0.1;
      
      predictions.push({
        year,
        predicted: baseValue,
        lowerBound: Math.max(0, baseValue - uncertainty),
        upperBound: baseValue + uncertainty,
        confidence: Math.max(0.1, trendAnalysis.r_squared * (1 - i * 0.15))
      });
    }

    return {
      predictions,
      model: 'linear_regression',
      modelQuality: trendAnalysis.trend_strength,
      r_squared: trendAnalysis.r_squared,
      volatility: trendAnalysis.volatility
    };
  }

  /**
   * Cache management methods
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

export default ComparisonAnalytics;