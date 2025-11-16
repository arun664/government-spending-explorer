/**
 * ExportPerformanceIntegration - Integration service for export and performance features
 * 
 * This service coordinates between ComparisonExporter and PerformanceManager
 * to provide seamless export capabilities with optimized performance
 */

import ComparisonExporter from './ComparisonExporter.js';
import PerformanceManager from '../utils/PerformanceManager.js';

export class ExportPerformanceIntegration {
  constructor() {
    this.exporter = new ComparisonExporter();
    this.performanceManager = new PerformanceManager();
    this.isInitialized = false;
    
    // Export queue for batch operations
    this.exportQueue = [];
    this.isProcessingQueue = false;
    
    // Performance thresholds
    this.performanceThresholds = {
      maxDataPoints: 10000,
      maxExportSize: 50 * 1024 * 1024, // 50MB
      minFPS: 30,
      maxRenderTime: 100 // milliseconds
    };
  }

  /**
   * Initialize the integration service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize performance monitoring
      this.performanceManager.initializePerformanceMonitoring();
      
      // Set up export event listeners
      this.setupExportEventListeners();
      
      this.isInitialized = true;
      console.log('ExportPerformanceIntegration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ExportPerformanceIntegration:', error);
      throw error;
    }
  }

  /**
   * Export dashboard with performance optimization
   * @param {Object} dashboardData - Complete dashboard data
   * @param {Array} chartElements - Array of chart DOM elements
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportDashboardOptimized(dashboardData, chartElements, options = {}) {
    const config = {
      format: 'png',
      includeData: true,
      optimizeForSize: true,
      useProgressiveLoading: true,
      maxConcurrentExports: 3,
      ...options
    };

    try {
      // Check performance constraints
      const canExport = await this.checkExportFeasibility(dashboardData, chartElements, config);
      if (!canExport.feasible) {
        throw new Error(`Export not feasible: ${canExport.reason}`);
      }

      // Optimize data if needed
      const optimizedData = config.optimizeForSize 
        ? await this.optimizeDataForExport(dashboardData)
        : dashboardData;

      // Prepare charts for export
      const preparedCharts = await this.prepareChartsForExport(chartElements, config);

      // Execute export based on format
      let result;
      switch (config.format.toLowerCase()) {
        case 'png':
        case 'svg':
          result = await this.exportChartsOptimized(preparedCharts, config);
          break;
        case 'pdf':
          result = await this.exportPDFOptimized(optimizedData, preparedCharts, config);
          break;
        case 'html':
          result = await this.exportHTMLOptimized(optimizedData, preparedCharts, config);
          break;
        case 'data':
          result = await this.exportDataOptimized(optimizedData, config);
          break;
        default:
          throw new Error(`Unsupported export format: ${config.format}`);
      }

      return {
        success: true,
        result,
        performanceMetrics: this.performanceManager.getPerformanceMetrics(),
        exportTime: result.exportTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        performanceMetrics: this.performanceManager.getPerformanceMetrics()
      };
    }
  }

  /**
   * Check if export is feasible given current performance constraints
   * @param {Object} data - Data to export
   * @param {Array} charts - Chart elements
   * @param {Object} config - Export configuration
   * @returns {Promise<Object>} Feasibility result
   */
  async checkExportFeasibility(data, charts, config) {
    const metrics = this.performanceManager.getPerformanceMetrics();
    
    // Check data size
    const dataSize = this.estimateDataSize(data);
    if (dataSize > this.performanceThresholds.maxExportSize) {
      return {
        feasible: false,
        reason: `Data size (${Math.round(dataSize / 1024 / 1024)}MB) exceeds maximum (${this.performanceThresholds.maxExportSize / 1024 / 1024}MB)`
      };
    }

    // Check number of data points
    const dataPoints = this.countDataPoints(data);
    if (dataPoints > this.performanceThresholds.maxDataPoints && !config.useProgressiveLoading) {
      return {
        feasible: false,
        reason: `Too many data points (${dataPoints}) without progressive loading enabled`
      };
    }

    // Check current performance
    if (metrics.averageFPS < this.performanceThresholds.minFPS) {
      return {
        feasible: false,
        reason: `Current FPS (${metrics.averageFPS}) below minimum threshold (${this.performanceThresholds.minFPS})`
      };
    }

    // Check memory usage
    if (metrics.memoryUsage > 500) { // 500MB threshold
      return {
        feasible: false,
        reason: `High memory usage (${Math.round(metrics.memoryUsage)}MB) may cause export failure`
      };
    }

    return { feasible: true };
  }

  /**
   * Optimize data for export by reducing size and complexity
   * @param {Object} data - Original data
   * @returns {Promise<Object>} Optimized data
   */
  async optimizeDataForExport(data) {
    const startTime = performance.now();
    
    const optimized = {
      ...data,
      // Remove unnecessary metadata
      metadata: {
        exportDate: new Date().toISOString(),
        optimized: true
      }
    };

    // Reduce precision of numeric values
    if (data.values && Array.isArray(data.values)) {
      optimized.values = data.values.map(item => ({
        ...item,
        // Round numeric values to reduce file size
        value: typeof item.value === 'number' ? Math.round(item.value * 100) / 100 : item.value
      }));
    }

    // Remove duplicate entries
    if (optimized.values) {
      const seen = new Set();
      optimized.values = optimized.values.filter(item => {
        const key = `${item.country}-${item.year}-${item.category}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const optimizationTime = performance.now() - startTime;
    console.log(`Data optimization completed in ${optimizationTime.toFixed(2)}ms`);

    return optimized;
  }

  /**
   * Prepare charts for export with performance optimizations
   * @param {Array} chartElements - Chart DOM elements
   * @param {Object} config - Export configuration
   * @returns {Promise<Array>} Prepared charts
   */
  async prepareChartsForExport(chartElements, config) {
    const prepared = [];

    for (let i = 0; i < chartElements.length; i++) {
      const element = chartElements[i];
      
      try {
        // Create high-resolution version if needed
        let exportElement = element;
        
        if (config.format === 'png' && config.highResolution) {
          exportElement = await this.createHighResolutionChart(element);
        }

        // Optimize SVG elements
        if (element.tagName === 'svg') {
          exportElement = this.optimizeSVGForExport(exportElement);
        }

        prepared.push({
          original: element,
          export: exportElement,
          title: element.getAttribute('data-title') || `Chart ${i + 1}`,
          type: element.tagName.toLowerCase(),
          index: i
        });

      } catch (error) {
        console.warn(`Failed to prepare chart ${i} for export:`, error);
        // Include original element as fallback
        prepared.push({
          original: element,
          export: element,
          title: `Chart ${i + 1} (fallback)`,
          type: element.tagName.toLowerCase(),
          index: i,
          error: error.message
        });
      }
    }

    return prepared;
  }

  /**
   * Export charts with performance optimization
   * @param {Array} preparedCharts - Prepared chart data
   * @param {Object} config - Export configuration
   * @returns {Promise<Object>} Export result
   */
  async exportChartsOptimized(preparedCharts, config) {
    const startTime = performance.now();
    const results = [];

    // Use batch export for better performance
    if (preparedCharts.length > 1 && config.maxConcurrentExports > 1) {
      const batches = this.createExportBatches(preparedCharts, config.maxConcurrentExports);
      
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(chart => this.exportSingleChart(chart, config))
        );
        
        results.push(...batchResults.map((result, index) => ({
          chart: batch[index],
          success: result.status === 'fulfilled',
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason : null
        })));
      }
    } else {
      // Sequential export for single charts or when concurrency is disabled
      for (const chart of preparedCharts) {
        try {
          const data = await this.exportSingleChart(chart, config);
          results.push({ chart, success: true, data });
        } catch (error) {
          results.push({ chart, success: false, error: error.message });
        }
      }
    }

    const exportTime = performance.now() - startTime;

    return {
      results,
      exportTime,
      successCount: results.filter(r => r.success).length,
      totalCount: results.length
    };
  }

  /**
   * Export single chart with format-specific optimization
   * @param {Object} chart - Chart data
   * @param {Object} config - Export configuration
   * @returns {Promise<Blob>} Chart blob
   */
  async exportSingleChart(chart, config) {
    switch (config.format.toLowerCase()) {
      case 'png':
        return await this.exporter.exportToPNG(chart.export, {
          width: config.width || 1920,
          height: config.height || 1080,
          scale: config.scale || 2,
          backgroundColor: config.backgroundColor || '#ffffff'
        });
        
      case 'svg':
        return this.exporter.exportToSVG(chart.export, {
          width: config.width || 1920,
          height: config.height || 1080,
          includeMetadata: config.includeMetadata !== false
        });
        
      default:
        throw new Error(`Unsupported chart export format: ${config.format}`);
    }
  }

  /**
   * Export PDF with performance optimization
   * @param {Object} data - Optimized data
   * @param {Array} charts - Prepared charts
   * @param {Object} config - Export configuration
   * @returns {Promise<Object>} PDF export result
   */
  async exportPDFOptimized(data, charts, config) {
    const startTime = performance.now();

    // Limit charts in PDF to prevent memory issues
    const maxChartsInPDF = 10;
    const chartsToInclude = charts.slice(0, maxChartsInPDF);

    const pdfBlob = await this.exporter.generatePDFReport(
      data.values || [],
      chartsToInclude.map(c => ({ element: c.export, title: c.title })),
      {
        title: config.title || 'Government Expense Dashboard Report',
        includeCharts: config.includeCharts !== false,
        includeData: config.includeData !== false
      }
    );

    const exportTime = performance.now() - startTime;

    return {
      blob: pdfBlob,
      exportTime,
      chartsIncluded: chartsToInclude.length,
      chartsSkipped: charts.length - chartsToInclude.length
    };
  }

  /**
   * Export HTML with performance optimization
   * @param {Object} data - Optimized data
   * @param {Array} charts - Prepared charts
   * @param {Object} config - Export configuration
   * @returns {Promise<Object>} HTML export result
   */
  async exportHTMLOptimized(data, charts, config) {
    const startTime = performance.now();

    const htmlBlob = await this.exporter.exportToHTML(
      data,
      charts.map(c => ({ element: c.export, title: c.title })),
      {
        includeInteractivity: config.includeInteractivity !== false,
        includeStyles: config.includeStyles !== false,
        standalone: config.standalone !== false
      }
    );

    const exportTime = performance.now() - startTime;

    return {
      blob: htmlBlob,
      exportTime,
      interactive: config.includeInteractivity !== false
    };
  }

  /**
   * Export data with performance optimization
   * @param {Object} data - Optimized data
   * @param {Object} config - Export configuration
   * @returns {Promise<Object>} Data export result
   */
  async exportDataOptimized(data, config) {
    const startTime = performance.now();
    
    const format = config.dataFormat || 'csv';
    const blob = this.exporter.exportFilteredData(
      data.values || [],
      format,
      {
        includeHeaders: config.includeHeaders !== false,
        delimiter: config.delimiter || ',',
        dateFormat: config.dateFormat || 'ISO'
      }
    );

    const exportTime = performance.now() - startTime;

    return {
      blob,
      exportTime,
      format,
      recordCount: (data.values || []).length
    };
  }

  /**
   * Queue export for batch processing
   * @param {Object} exportRequest - Export request
   * @returns {Promise<Object>} Export result
   */
  async queueExport(exportRequest) {
    return new Promise((resolve, reject) => {
      this.exportQueue.push({
        ...exportRequest,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processExportQueue();
    });
  }

  /**
   * Process export queue
   */
  async processExportQueue() {
    if (this.isProcessingQueue || this.exportQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.exportQueue.length > 0) {
      const request = this.exportQueue.shift();
      
      try {
        const result = await this.exportDashboardOptimized(
          request.data,
          request.charts,
          request.options
        );
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isProcessingQueue = false;
  }

  // Helper methods
  createExportBatches(charts, batchSize) {
    const batches = [];
    for (let i = 0; i < charts.length; i += batchSize) {
      batches.push(charts.slice(i, i + batchSize));
    }
    return batches;
  }

  estimateDataSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }

  countDataPoints(data) {
    if (!data || !data.values) return 0;
    return data.values.length;
  }

  async createHighResolutionChart(element) {
    // Clone and scale up the chart for high-resolution export
    const clone = element.cloneNode(true);
    const scale = 2;
    
    if (clone.tagName === 'svg') {
      const width = parseInt(clone.getAttribute('width') || '800') * scale;
      const height = parseInt(clone.getAttribute('height') || '600') * scale;
      
      clone.setAttribute('width', width);
      clone.setAttribute('height', height);
      clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    
    return clone;
  }

  optimizeSVGForExport(svgElement) {
    const clone = svgElement.cloneNode(true);
    
    // Remove unnecessary attributes
    const unnecessaryAttrs = ['data-reactroot', 'data-react-checksum'];
    unnecessaryAttrs.forEach(attr => {
      clone.removeAttribute(attr);
    });
    
    // Optimize paths and shapes
    const paths = clone.querySelectorAll('path');
    paths.forEach(path => {
      const d = path.getAttribute('d');
      if (d) {
        // Simplify path data (basic optimization)
        const simplified = d.replace(/(\d+\.\d{3,})/g, (match) => {
          return parseFloat(match).toFixed(2);
        });
        path.setAttribute('d', simplified);
      }
    });
    
    return clone;
  }

  setupExportEventListeners() {
    // Listen for performance warnings
    this.performanceManager.onPerformanceWarning = (warning) => {
      console.warn('Performance warning during export:', warning);
    };

    // Listen for memory pressure
    if ('memory' in performance) {
      setInterval(() => {
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (memoryUsage > 400) { // 400MB threshold
          console.warn(`High memory usage detected: ${memoryUsage.toFixed(2)}MB`);
        }
      }, 5000);
    }
  }

  /**
   * Get export and performance statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      performance: this.performanceManager.getPerformanceMetrics(),
      exports: {
        queueLength: this.exportQueue.length,
        isProcessing: this.isProcessingQueue
      },
      thresholds: this.performanceThresholds
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.performanceManager.destroy();
    this.exportQueue = [];
    this.isProcessingQueue = false;
    this.isInitialized = false;
  }
}

export default ExportPerformanceIntegration;