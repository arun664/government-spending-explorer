/**
 * ComparisonExporter - Service for high-resolution chart exports and custom reports
 * 
 * Features:
 * - High-resolution PNG and SVG chart exports
 * - Custom PDF report generation
 * - Interactive HTML exports
 * - Filtered data export functionality
 */

import * as d3 from 'd3';

export class ComparisonExporter {
  constructor() {
    this.exportFormats = ['png', 'svg', 'pdf', 'html', 'csv', 'json'];
    this.defaultOptions = {
      width: 1920,
      height: 1080,
      scale: 2, // For high-resolution exports
      backgroundColor: '#ffffff',
      includeMetadata: true,
      compression: 0.9
    };
  }

  /**
   * Export chart as high-resolution PNG
   * @param {SVGElement} svgElement - The SVG element to export
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} PNG blob
   */
  async exportToPNG(svgElement, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      // Clone SVG to avoid modifying original
      const clonedSvg = svgElement.cloneNode(true);
      
      // Set dimensions and styling
      clonedSvg.setAttribute('width', config.width);
      clonedSvg.setAttribute('height', config.height);
      clonedSvg.style.backgroundColor = config.backgroundColor;
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create canvas and draw SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = config.width * config.scale;
      canvas.height = config.height * config.scale;
      ctx.scale(config.scale, config.scale);
      
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.fillStyle = config.backgroundColor;
          ctx.fillRect(0, 0, config.width, config.height);
          ctx.drawImage(img, 0, 0, config.width, config.height);
          
          canvas.toBlob(resolve, 'image/png', config.compression);
          URL.revokeObjectURL(svgUrl);
        };
        
        img.onerror = reject;
        img.src = svgUrl;
      });
    } catch (error) {
      throw new Error(`PNG export failed: ${error.message}`);
    }
  }

  /**
   * Export chart as SVG
   * @param {SVGElement} svgElement - The SVG element to export
   * @param {Object} options - Export options
   * @returns {Blob} SVG blob
   */
  exportToSVG(svgElement, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      const clonedSvg = svgElement.cloneNode(true);
      
      // Set dimensions and add metadata
      clonedSvg.setAttribute('width', config.width);
      clonedSvg.setAttribute('height', config.height);
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      if (config.includeMetadata) {
        const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
        metadata.textContent = JSON.stringify({
          exportDate: new Date().toISOString(),
          dimensions: { width: config.width, height: config.height },
          source: 'Government Expense Dashboard'
        });
        clonedSvg.insertBefore(metadata, clonedSvg.firstChild);
      }
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      return new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    } catch (error) {
      throw new Error(`SVG export failed: ${error.message}`);
    }
  }

  /**
   * Generate custom PDF report
   * @param {Object} reportData - Data for the report
   * @param {Array} charts - Array of chart elements
   * @param {Object} options - Report options
   * @returns {Promise<Blob>} PDF blob
   */
  async generatePDFReport(reportData, charts = [], options = {}) {
    const config = {
      title: 'Government Expense Comparison Report',
      includeCharts: true,
      includeData: true,
      pageSize: 'A4',
      ...options
    };

    try {
      // Create HTML content for PDF generation
      const htmlContent = await this.createReportHTML(reportData, charts, config);
      
      // Use browser's print functionality for PDF generation
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Return a promise that resolves when user completes print dialog
      return new Promise((resolve) => {
        printWindow.onafterprint = () => {
          printWindow.close();
          resolve(new Blob(['PDF generation completed'], { type: 'application/pdf' }));
        };
        
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      });
    } catch (error) {
      throw new Error(`PDF report generation failed: ${error.message}`);
    }
  }

  /**
   * Create interactive HTML export
   * @param {Object} dashboardData - Complete dashboard data
   * @param {Array} charts - Array of chart configurations
   * @param {Object} options - Export options
   * @returns {Blob} HTML blob
   */
  async exportToHTML(dashboardData, charts = [], options = {}) {
    const config = {
      includeInteractivity: true,
      includeStyles: true,
      standalone: true,
      ...options
    };

    try {
      const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Government Expense Dashboard Export</title>
    ${config.includeStyles ? await this.getEmbeddedStyles() : ''}
    <script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
    <div id="dashboard-export">
        <header>
            <h1>Government Expense Dashboard</h1>
            <p>Exported on: ${new Date().toLocaleDateString()}</p>
        </header>
        
        <div id="charts-container">
            ${await this.renderChartsForHTML(charts, dashboardData)}
        </div>
        
        <div id="data-summary">
            ${this.createDataSummaryHTML(dashboardData)}
        </div>
    </div>
    
    ${config.includeInteractivity ? await this.getInteractivityScript() : ''}
</body>
</html>`;

      return new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
    } catch (error) {
      throw new Error(`HTML export failed: ${error.message}`);
    }
  }

  /**
   * Export filtered data in various formats
   * @param {Array} data - Filtered data array
   * @param {string} format - Export format (csv, json, xlsx)
   * @param {Object} options - Export options
   * @returns {Blob} Data blob
   */
  exportFilteredData(data, format = 'csv', options = {}) {
    const config = {
      includeHeaders: true,
      delimiter: ',',
      dateFormat: 'ISO',
      ...options
    };

    try {
      switch (format.toLowerCase()) {
        case 'csv':
          return this.exportToCSV(data, config);
        case 'json':
          return this.exportToJSON(data, config);
        case 'xlsx':
          return this.exportToExcel(data, config);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Data export failed: ${error.message}`);
    }
  }

  /**
   * Export data as CSV
   * @param {Array} data - Data array
   * @param {Object} config - Configuration options
   * @returns {Blob} CSV blob
   */
  exportToCSV(data, config) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    let csvContent = '';

    if (config.includeHeaders) {
      csvContent += headers.join(config.delimiter) + '\n';
    }

    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        
        // Handle different data types
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string' && value.includes(config.delimiter)) {
          value = `"${value.replace(/"/g, '""')}"`;
        } else if (value instanceof Date) {
          value = config.dateFormat === 'ISO' ? value.toISOString() : value.toLocaleDateString();
        }
        
        return value;
      });
      
      csvContent += values.join(config.delimiter) + '\n';
    });

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  /**
   * Export data as JSON
   * @param {Array} data - Data array
   * @param {Object} config - Configuration options
   * @returns {Blob} JSON blob
   */
  exportToJSON(data, config) {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        source: 'Government Expense Dashboard'
      },
      data: data
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  }

  /**
   * Trigger download of exported file
   * @param {Blob} blob - File blob
   * @param {string} filename - Filename with extension
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Batch export multiple charts
   * @param {Array} charts - Array of chart elements and configurations
   * @param {string} format - Export format
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Array of export results
   */
  async batchExport(charts, format = 'png', options = {}) {
    const results = [];
    
    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      try {
        let blob;
        
        switch (format.toLowerCase()) {
          case 'png':
            blob = await this.exportToPNG(chart.element, options);
            break;
          case 'svg':
            blob = this.exportToSVG(chart.element, options);
            break;
          default:
            throw new Error(`Unsupported batch export format: ${format}`);
        }
        
        results.push({
          success: true,
          filename: chart.filename || `chart_${i + 1}.${format}`,
          blob: blob
        });
      } catch (error) {
        results.push({
          success: false,
          filename: chart.filename || `chart_${i + 1}.${format}`,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Helper methods for HTML export
  async getEmbeddedStyles() {
    return `
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      #dashboard-export { max-width: 1200px; margin: 0 auto; }
      header { text-align: center; margin-bottom: 30px; }
      #charts-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
      .chart-wrapper { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
      #data-summary { margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #f2f2f2; }
    </style>`;
  }

  async renderChartsForHTML(charts, data) {
    return charts.map((chart, index) => `
      <div class="chart-wrapper">
        <h3>${chart.title || `Chart ${index + 1}`}</h3>
        <div id="chart-${index}"></div>
      </div>
    `).join('');
  }

  createDataSummaryHTML(data) {
    if (!data || !data.summary) return '<p>No data summary available</p>';
    
    return `
      <h2>Data Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(data.summary).map(([key, value]) => `
            <tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  async getInteractivityScript() {
    return `
    <script>
      // Basic interactivity for exported charts
      document.addEventListener('DOMContentLoaded', function() {
        console.log('Interactive dashboard export loaded');
        
        // Add hover effects to chart elements
        const chartElements = document.querySelectorAll('.chart-wrapper');
        chartElements.forEach(element => {
          element.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
          });
          
          element.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
          });
        });
      });
    </script>`;
  }

  async createReportHTML(reportData, charts, config) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${config.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .chart-section { page-break-inside: avoid; margin-bottom: 30px; }
        .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background-color: #f2f2f2; }
        @media print { .chart-section { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>${config.title}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
    
    ${config.includeCharts ? charts.map((chart, i) => `
        <div class="chart-section">
            <h2>Chart ${i + 1}: ${chart.title || 'Untitled'}</h2>
            <div>${chart.element ? chart.element.outerHTML : 'Chart not available'}</div>
        </div>
    `).join('') : ''}
    
    ${config.includeData && reportData ? `
        <div class="data-section">
            <h2>Data Summary</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        ${Object.keys(reportData[0] || {}).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${reportData.slice(0, 50).map(row => `
                        <tr>
                            ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    ` : ''}
</body>
</html>`;
  }
}

export default ComparisonExporter;