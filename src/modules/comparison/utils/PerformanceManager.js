/**
 * PerformanceManager - Utility for canvas rendering and performance optimization
 * 
 * Features:
 * - Canvas rendering for large datasets
 * - 60fps animation management
 * - Progressive loading
 * - Efficient data structures
 * - Real-time filtering optimization
 */

import * as d3 from 'd3';

export class PerformanceManager {
  constructor() {
    this.animationFrameId = null;
    this.isAnimating = false;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    this.lastFrameTime = 0;
    this.performanceMetrics = {
      frameCount: 0,
      averageFPS: 0,
      renderTime: 0,
      memoryUsage: 0
    };
    
    // Canvas rendering pools
    this.canvasPool = [];
    this.contextPool = [];
    this.maxPoolSize = 10;
    
    // Data structure optimizations
    this.spatialIndex = new Map();
    this.quadTree = null;
    this.dataCache = new Map();
    this.filterCache = new Map();
    
    // Progressive loading state
    this.loadingState = {
      isLoading: false,
      loadedChunks: 0,
      totalChunks: 0,
      chunkSize: 1000
    };
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      }, 1000);
    }

    // Monitor frame rate
    this.startFPSMonitoring();
  }

  /**
   * Start FPS monitoring
   */
  startFPSMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = (currentTime) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        this.performanceMetrics.averageFPS = frameCount;
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Create optimized canvas renderer for large datasets
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Rendering options
   * @returns {Object} Canvas renderer instance
   */
  createCanvasRenderer(container, options = {}) {
    const config = {
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      devicePixelRatio: window.devicePixelRatio || 1,
      enableWebGL: true,
      bufferSize: 10000,
      ...options
    };

    const canvas = this.getCanvasFromPool() || document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    
    // Set up high-DPI rendering
    const ratio = config.devicePixelRatio;
    canvas.width = config.width * ratio;
    canvas.height = config.height * ratio;
    canvas.style.width = config.width + 'px';
    canvas.style.height = config.height + 'px';
    context.scale(ratio, ratio);

    container.appendChild(canvas);

    return {
      canvas,
      context,
      width: config.width,
      height: config.height,
      ratio,
      
      // Optimized drawing methods
      drawPoints: (points) => this.drawPointsOptimized(context, points, config),
      drawLines: (lines) => this.drawLinesOptimized(context, lines, config),
      drawShapes: (shapes) => this.drawShapesOptimized(context, shapes, config),
      clear: () => context.clearRect(0, 0, config.width, config.height),
      
      // Performance methods
      startBatch: () => context.save(),
      endBatch: () => context.restore(),
      
      // Cleanup
      destroy: () => this.returnCanvasToPool(canvas)
    };
  }

  /**
   * Optimized point rendering for large datasets
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Array} points - Array of point data
   * @param {Object} config - Rendering configuration
   */
  drawPointsOptimized(context, points, config) {
    if (!points || points.length === 0) return;

    const startTime = performance.now();
    
    // Use batch rendering for better performance
    context.save();
    
    // Group points by color/style to minimize state changes
    const pointGroups = this.groupPointsByStyle(points);
    
    for (const [style, groupPoints] of pointGroups) {
      context.fillStyle = style.color || '#333';
      context.globalAlpha = style.opacity || 1;
      
      // Use Path2D for better performance with many points
      const path = new Path2D();
      
      for (const point of groupPoints) {
        if (this.isPointVisible(point, config)) {
          path.arc(point.x, point.y, point.radius || 2, 0, 2 * Math.PI);
        }
      }
      
      context.fill(path);
    }
    
    context.restore();
    
    this.performanceMetrics.renderTime = performance.now() - startTime;
  }

  /**
   * Optimized line rendering
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Array} lines - Array of line data
   * @param {Object} config - Rendering configuration
   */
  drawLinesOptimized(context, lines, config) {
    if (!lines || lines.length === 0) return;

    context.save();
    
    const lineGroups = this.groupLinesByStyle(lines);
    
    for (const [style, groupLines] of lineGroups) {
      context.strokeStyle = style.color || '#333';
      context.lineWidth = style.width || 1;
      context.globalAlpha = style.opacity || 1;
      
      const path = new Path2D();
      
      for (const line of groupLines) {
        if (line.points && line.points.length > 1) {
          path.moveTo(line.points[0].x, line.points[0].y);
          for (let i = 1; i < line.points.length; i++) {
            path.lineTo(line.points[i].x, line.points[i].y);
          }
        }
      }
      
      context.stroke(path);
    }
    
    context.restore();
  }

  /**
   * Create spatial index for efficient collision detection and filtering
   * @param {Array} data - Data points with x, y coordinates
   * @param {Object} bounds - Spatial bounds
   */
  createSpatialIndex(data, bounds) {
    const cellSize = 50; // Adjust based on data density
    this.spatialIndex.clear();
    
    for (const item of data) {
      const cellX = Math.floor(item.x / cellSize);
      const cellY = Math.floor(item.y / cellSize);
      const key = `${cellX},${cellY}`;
      
      if (!this.spatialIndex.has(key)) {
        this.spatialIndex.set(key, []);
      }
      
      this.spatialIndex.get(key).push(item);
    }
  }

  /**
   * Query spatial index for items in a region
   * @param {Object} region - Query region {x, y, width, height}
   * @returns {Array} Items in the region
   */
  querySpatialIndex(region) {
    const cellSize = 50;
    const results = [];
    
    const startX = Math.floor(region.x / cellSize);
    const endX = Math.floor((region.x + region.width) / cellSize);
    const startY = Math.floor(region.y / cellSize);
    const endY = Math.floor((region.y + region.height) / cellSize);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        const items = this.spatialIndex.get(key);
        if (items) {
          results.push(...items);
        }
      }
    }
    
    return results;
  }

  /**
   * Implement progressive loading for large datasets
   * @param {Array} data - Complete dataset
   * @param {Function} renderCallback - Callback to render each chunk
   * @param {Object} options - Loading options
   */
  async progressiveLoad(data, renderCallback, options = {}) {
    const config = {
      chunkSize: this.loadingState.chunkSize,
      delay: 16, // ~60fps
      onProgress: null,
      ...options
    };

    this.loadingState.isLoading = true;
    this.loadingState.totalChunks = Math.ceil(data.length / config.chunkSize);
    this.loadingState.loadedChunks = 0;

    for (let i = 0; i < data.length; i += config.chunkSize) {
      const chunk = data.slice(i, i + config.chunkSize);
      
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          renderCallback(chunk, this.loadingState.loadedChunks);
          this.loadingState.loadedChunks++;
          
          if (config.onProgress) {
            config.onProgress({
              loaded: this.loadingState.loadedChunks,
              total: this.loadingState.totalChunks,
              percentage: (this.loadingState.loadedChunks / this.loadingState.totalChunks) * 100
            });
          }
          
          resolve();
        });
      });
      
      // Small delay to prevent blocking
      if (config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
      }
    }

    this.loadingState.isLoading = false;
  }

  /**
   * Optimized real-time filtering with caching
   * @param {Array} data - Dataset to filter
   * @param {Object} filters - Filter criteria
   * @param {string} cacheKey - Cache key for results
   * @returns {Array} Filtered data
   */
  optimizedFilter(data, filters, cacheKey = null) {
    // Check cache first
    if (cacheKey && this.filterCache.has(cacheKey)) {
      const cached = this.filterCache.get(cacheKey);
      if (this.isFilterCacheValid(cached, filters)) {
        return cached.result;
      }
    }

    const startTime = performance.now();
    
    // Use efficient filtering strategies
    let result = data;
    
    // Apply filters in order of selectivity (most selective first)
    const sortedFilters = this.sortFiltersBySelectivity(filters);
    
    for (const [key, value] of sortedFilters) {
      if (value !== null && value !== undefined) {
        result = this.applyFilter(result, key, value);
      }
    }

    const filterTime = performance.now() - startTime;
    
    // Cache result if beneficial
    if (cacheKey && filterTime > 10) { // Only cache expensive operations
      this.filterCache.set(cacheKey, {
        filters: { ...filters },
        result: result,
        timestamp: Date.now()
      });
    }

    return result;
  }

  /**
   * Smooth 60fps animation manager
   * @param {Function} animationCallback - Animation function
   * @param {Object} options - Animation options
   */
  startSmoothAnimation(animationCallback, options = {}) {
    const config = {
      duration: 1000,
      easing: d3.easeLinear,
      onComplete: null,
      ...options
    };

    if (this.isAnimating) {
      this.stopAnimation();
    }

    this.isAnimating = true;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      if (!this.isAnimating) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / config.duration, 1);
      const easedProgress = config.easing(progress);

      // Throttle to target FPS
      if (currentTime - this.lastFrameTime >= this.frameInterval) {
        animationCallback(easedProgress, elapsed);
        this.lastFrameTime = currentTime;
        this.performanceMetrics.frameCount++;
      }

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        if (config.onComplete) {
          config.onComplete();
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop current animation
   */
  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Efficient data structure for large datasets
   * @param {Array} data - Raw data
   * @returns {Object} Optimized data structure
   */
  createEfficientDataStructure(data) {
    const structure = {
      // Original data
      raw: data,
      
      // Indexed data for fast lookups
      byId: new Map(),
      byCategory: new Map(),
      byYear: new Map(),
      
      // Aggregated data
      aggregates: {
        total: 0,
        count: data.length,
        categories: new Set(),
        years: new Set(),
        countries: new Set()
      },
      
      // Spatial data for geographic visualizations
      spatial: null,
      
      // Time series data
      timeSeries: new Map()
    };

    // Build indices
    for (const item of data) {
      // ID index
      if (item.id) {
        structure.byId.set(item.id, item);
      }
      
      // Category index
      if (item.category) {
        if (!structure.byCategory.has(item.category)) {
          structure.byCategory.set(item.category, []);
        }
        structure.byCategory.get(item.category).push(item);
        structure.aggregates.categories.add(item.category);
      }
      
      // Year index
      if (item.year) {
        if (!structure.byYear.has(item.year)) {
          structure.byYear.set(item.year, []);
        }
        structure.byYear.get(item.year).push(item);
        structure.aggregates.years.add(item.year);
      }
      
      // Country aggregation
      if (item.country) {
        structure.aggregates.countries.add(item.country);
      }
      
      // Value aggregation
      if (typeof item.value === 'number') {
        structure.aggregates.total += item.value;
      }
    }

    return structure;
  }

  // Helper methods
  getCanvasFromPool() {
    return this.canvasPool.length > 0 ? this.canvasPool.pop() : null;
  }

  returnCanvasToPool(canvas) {
    if (this.canvasPool.length < this.maxPoolSize) {
      // Clean canvas before returning to pool
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      this.canvasPool.push(canvas);
    }
  }

  groupPointsByStyle(points) {
    const groups = new Map();
    
    for (const point of points) {
      const styleKey = JSON.stringify({
        color: point.color || '#333',
        opacity: point.opacity || 1
      });
      
      if (!groups.has(styleKey)) {
        groups.set(styleKey, []);
      }
      
      groups.get(styleKey).push(point);
    }
    
    return Array.from(groups.entries()).map(([key, points]) => [JSON.parse(key), points]);
  }

  groupLinesByStyle(lines) {
    const groups = new Map();
    
    for (const line of lines) {
      const styleKey = JSON.stringify({
        color: line.color || '#333',
        width: line.width || 1,
        opacity: line.opacity || 1
      });
      
      if (!groups.has(styleKey)) {
        groups.set(styleKey, []);
      }
      
      groups.get(styleKey).push(line);
    }
    
    return Array.from(groups.entries()).map(([key, lines]) => [JSON.parse(key), lines]);
  }

  isPointVisible(point, config) {
    return point.x >= 0 && point.x <= config.width && 
           point.y >= 0 && point.y <= config.height;
  }

  isFilterCacheValid(cached, filters) {
    const cacheAge = Date.now() - cached.timestamp;
    const maxAge = 30000; // 30 seconds
    
    if (cacheAge > maxAge) return false;
    
    return JSON.stringify(cached.filters) === JSON.stringify(filters);
  }

  sortFiltersBySelectivity(filters) {
    // Sort filters by estimated selectivity (most selective first)
    const filterEntries = Object.entries(filters);
    
    return filterEntries.sort((a, b) => {
      const selectivityA = this.estimateFilterSelectivity(a[0], a[1]);
      const selectivityB = this.estimateFilterSelectivity(b[0], b[1]);
      return selectivityA - selectivityB;
    });
  }

  estimateFilterSelectivity(key, value) {
    // Estimate how selective a filter is (lower = more selective)
    if (Array.isArray(value)) {
      return value.length / 100; // Assume 100 possible values
    }
    
    if (typeof value === 'string') {
      return value.length > 0 ? 0.1 : 1;
    }
    
    if (typeof value === 'number') {
      return 0.2;
    }
    
    return 0.5; // Default selectivity
  }

  applyFilter(data, key, value) {
    if (Array.isArray(value)) {
      return data.filter(item => value.includes(item[key]));
    }
    
    if (typeof value === 'string') {
      return data.filter(item => 
        item[key] && item[key].toString().toLowerCase().includes(value.toLowerCase())
      );
    }
    
    if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
      return data.filter(item => 
        item[key] >= value.min && item[key] <= value.max
      );
    }
    
    return data.filter(item => item[key] === value);
  }

  /**
   * Get current performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Clear all caches and reset performance state
   */
  clearCaches() {
    this.dataCache.clear();
    this.filterCache.clear();
    this.spatialIndex.clear();
    this.performanceMetrics.frameCount = 0;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopAnimation();
    this.clearCaches();
    
    // Return all canvases to pool
    this.canvasPool.forEach(canvas => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    });
    
    this.canvasPool = [];
    this.contextPool = [];
  }
}

export default PerformanceManager;