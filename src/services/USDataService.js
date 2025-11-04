// US Data Service - Specialized service for US government expense data processing
import * as d3 from 'd3'

class USDataService {
  constructor() {
    this.usData = []
    this.processedData = null
    this.departmentMapping = this.createDepartmentMapping()
  }

  // Create mapping for better department categorization
  createDepartmentMapping() {
    return {
      'Defense': ['Defense', 'Military', 'Armed Forces', 'Veterans'],
      'Healthcare': ['Health', 'Medical', 'Medicare', 'Medicaid'],
      'Education': ['Education', 'Schools', 'Universities', 'Student'],
      'Social Security': ['Social Security', 'Retirement', 'Disability'],
      'Transportation': ['Transportation', 'Infrastructure', 'Roads', 'Aviation'],
      'Energy': ['Energy', 'Power', 'Renewable', 'Nuclear'],
      'Agriculture': ['Agriculture', 'Farming', 'Food', 'Rural'],
      'Justice': ['Justice', 'Courts', 'Law Enforcement', 'FBI'],
      'Treasury': ['Treasury', 'IRS', 'Financial', 'Customs'],
      'Labor': ['Labor', 'Employment', 'Workers', 'Unemployment']
    }
  }

  // Load and process US expense data
  async loadUSData() {
    try {
      const data = await d3.csv('/data/expense_clean.csv')
      
      this.usData = data
        .filter(d => d['Country Name'] === 'United States' && d.Value && !isNaN(+d.Value))
        .map(d => ({
          country: d['Country Name'],
          category: d['Expense Category'],
          year: +d.Year,
          value: +d.Value,
          department: this.categorizeDepartment(d['Expense Category'])
        }))
        .sort((a, b) => a.year - b.year)

      this.processedData = this.processData()
      return this.usData
    } catch (error) {
      console.error('Error loading US data:', error)
      throw error
    }
  }

  // Categorize expense categories into broader departments
  categorizeDepartment(category) {
    const categoryLower = category.toLowerCase()
    
    for (const [department, keywords] of Object.entries(this.departmentMapping)) {
      if (keywords.some(keyword => categoryLower.includes(keyword.toLowerCase()))) {
        return department
      }
    }
    
    // Default categorization based on common patterns
    if (categoryLower.includes('compensation') || categoryLower.includes('employee')) {
      return 'Personnel'
    } else if (categoryLower.includes('goods') || categoryLower.includes('services')) {
      return 'Operations'
    } else if (categoryLower.includes('capital') || categoryLower.includes('investment')) {
      return 'Capital Investment'
    } else if (categoryLower.includes('transfer') || categoryLower.includes('subsidy')) {
      return 'Transfers & Subsidies'
    }
    
    return 'Other'
  }

  // Process data for analysis
  processData() {
    if (!this.usData.length) return null

    return {
      departmentBreakdown: this.calculateDepartmentBreakdown(),
      timeSeriesAnalysis: this.calculateTimeSeriesAnalysis(),
      growthAnalysis: this.calculateGrowthAnalysis(),
      categoryAnalysis: this.calculateCategoryAnalysis(),
      summary: this.calculateSummaryStatistics()
    }
  }

  // Calculate department-level breakdown
  calculateDepartmentBreakdown() {
    const departmentData = d3.rollup(
      this.usData,
      v => ({
        totalSpending: d3.sum(v, d => d.value),
        avgSpending: d3.mean(v, d => d.value),
        medianSpending: d3.median(v, d => d.value),
        years: [...new Set(v.map(d => d.year))].length,
        records: v.length,
        categories: [...new Set(v.map(d => d.category))],
        yearRange: {
          min: d3.min(v, d => d.year),
          max: d3.max(v, d => d.year)
        }
      }),
      d => d.department
    )

    return Array.from(departmentData, ([department, stats]) => ({
      department,
      ...stats,
      categoryCount: stats.categories.length
    })).sort((a, b) => b.totalSpending - a.totalSpending)
  }

  // Calculate time series analysis
  calculateTimeSeriesAnalysis() {
    const timeSeriesMap = d3.rollup(
      this.usData,
      v => ({
        total: d3.sum(v, d => d.value),
        departments: d3.rollup(v, vv => d3.sum(vv, d => d.value), d => d.department),
        categories: d3.rollup(v, vv => d3.sum(vv, d => d.value), d => d.category),
        recordCount: v.length
      }),
      d => d.year
    )

    return Array.from(timeSeriesMap, ([year, data]) => ({
      year,
      ...data,
      departments: Object.fromEntries(data.departments),
      categories: Object.fromEntries(data.categories)
    })).sort((a, b) => a.year - b.year)
  }

  // Calculate growth analysis
  calculateGrowthAnalysis() {
    const timeSeries = this.calculateTimeSeriesAnalysis()
    if (timeSeries.length < 2) return []

    const growthData = []
    
    for (let i = 1; i < timeSeries.length; i++) {
      const current = timeSeries[i]
      const previous = timeSeries[i - 1]
      
      const totalGrowth = this.calculateGrowthRate(current.total, previous.total)
      
      const departmentGrowth = {}
      Object.keys(current.departments).forEach(dept => {
        const currentValue = current.departments[dept] || 0
        const previousValue = previous.departments[dept] || 0
        departmentGrowth[dept] = this.calculateGrowthRate(currentValue, previousValue)
      })

      growthData.push({
        year: current.year,
        totalGrowth,
        departmentGrowth,
        totalSpending: current.total,
        previousSpending: previous.total
      })
    }

    return growthData
  }

  // Calculate category-level analysis
  calculateCategoryAnalysis() {
    const categoryData = d3.rollup(
      this.usData,
      v => ({
        totalSpending: d3.sum(v, d => d.value),
        avgSpending: d3.mean(v, d => d.value),
        stdDev: d3.deviation(v, d => d.value) || 0,
        years: [...new Set(v.map(d => d.year))].length,
        records: v.length,
        trend: this.calculateTrend(v)
      }),
      d => d.category
    )

    return Array.from(categoryData, ([category, stats]) => ({
      category,
      ...stats,
      department: this.categorizeDepartment(category),
      volatility: stats.stdDev / stats.avgSpending || 0
    })).sort((a, b) => b.totalSpending - a.totalSpending)
  }

  // Calculate summary statistics
  calculateSummaryStatistics() {
    const totalSpending = d3.sum(this.usData, d => d.value)
    const years = [...new Set(this.usData.map(d => d.year))]
    const departments = [...new Set(this.usData.map(d => d.department))]
    const categories = [...new Set(this.usData.map(d => d.category))]

    return {
      totalSpending,
      avgAnnualSpending: totalSpending / years.length,
      yearRange: {
        min: d3.min(years),
        max: d3.max(years),
        count: years.length
      },
      departmentCount: departments.length,
      categoryCount: categories.length,
      recordCount: this.usData.length,
      dataQuality: this.assessDataQuality()
    }
  }

  // Calculate growth rate between two values
  calculateGrowthRate(current, previous) {
    return previous > 0 ? ((current - previous) / previous) * 100 : 0
  }

  // Calculate trend for a series of values
  calculateTrend(data) {
    if (data.length < 2) return 'insufficient_data'
    
    const sortedData = data.sort((a, b) => a.year - b.year)
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2))
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2))
    
    const firstAvg = d3.mean(firstHalf, d => d.value)
    const secondAvg = d3.mean(secondHalf, d => d.value)
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100
    
    if (Math.abs(change) < 5) return 'stable'
    return change > 0 ? 'increasing' : 'decreasing'
  }

  // Assess data quality
  assessDataQuality() {
    const totalRecords = this.usData.length
    const validRecords = this.usData.filter(d => d.value > 0).length
    const completeness = validRecords / totalRecords
    
    const years = [...new Set(this.usData.map(d => d.year))]
    const expectedRecords = years.length * 50 // Assuming ~50 categories per year
    const coverage = totalRecords / expectedRecords
    
    return {
      completeness: Math.min(completeness, 1),
      coverage: Math.min(coverage, 1),
      consistency: this.calculateConsistency(),
      score: (completeness + Math.min(coverage, 1) + this.calculateConsistency()) / 3
    }
  }

  // Calculate data consistency
  calculateConsistency() {
    const yearCounts = d3.rollup(this.usData, v => v.length, d => d.year)
    const counts = Array.from(yearCounts.values())
    const avgCount = d3.mean(counts)
    const stdDev = d3.deviation(counts) || 0
    
    return stdDev > 0 ? Math.max(0, 1 - (stdDev / avgCount)) : 1
  }

  // Get filtered data based on criteria
  getFilteredData(filters = {}) {
    let filteredData = [...this.usData]

    if (filters.yearRange) {
      filteredData = filteredData.filter(d => 
        d.year >= filters.yearRange[0] && d.year <= filters.yearRange[1]
      )
    }

    if (filters.departments && filters.departments.length > 0) {
      filteredData = filteredData.filter(d => 
        filters.departments.includes(d.department)
      )
    }

    if (filters.categories && filters.categories.length > 0) {
      filteredData = filteredData.filter(d => 
        filters.categories.includes(d.category)
      )
    }

    if (filters.minValue) {
      filteredData = filteredData.filter(d => d.value >= filters.minValue)
    }

    return filteredData
  }

  // Get available filter options
  getFilterOptions() {
    return {
      years: [...new Set(this.usData.map(d => d.year))].sort(),
      departments: [...new Set(this.usData.map(d => d.department))].sort(),
      categories: [...new Set(this.usData.map(d => d.category))].sort(),
      valueRange: {
        min: d3.min(this.usData, d => d.value),
        max: d3.max(this.usData, d => d.value)
      }
    }
  }

  // Export data for external use
  exportData(format = 'json') {
    const exportData = {
      summary: this.processedData?.summary,
      departmentBreakdown: this.processedData?.departmentBreakdown,
      timeSeriesAnalysis: this.processedData?.timeSeriesAnalysis,
      growthAnalysis: this.processedData?.growthAnalysis,
      rawData: this.usData
    }

    if (format === 'csv') {
      return this.convertToCSV(exportData.rawData)
    }

    return exportData
  }

  // Convert data to CSV format
  convertToCSV(data) {
    if (!data.length) return ''
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n')

    return csvContent
  }
}

// Create singleton instance
const usDataService = new USDataService()

export default usDataService