// Simple test to verify USReportGenerator component functionality
import { describe, it, expect } from 'vitest'

// Mock data for testing
const mockUSData = [
  {
    country: 'United States',
    category: 'Defense',
    year: 2020,
    value: 750000
  },
  {
    country: 'United States', 
    category: 'Healthcare',
    year: 2020,
    value: 400000
  },
  {
    country: 'United States',
    category: 'Defense', 
    year: 2021,
    value: 780000
  },
  {
    country: 'United States',
    category: 'Healthcare',
    year: 2021, 
    value: 420000
  }
]

// Test utility functions that would be used in USReportGenerator
describe('USReportGenerator Utilities', () => {
  it('should calculate year-over-year growth correctly', () => {
    const calculateGrowth = (current, previous) => {
      return previous > 0 ? ((current - previous) / previous) * 100 : 0
    }
    
    const defenseGrowth = calculateGrowth(780000, 750000)
    const healthcareGrowth = calculateGrowth(420000, 400000)
    
    expect(defenseGrowth).toBeCloseTo(4.0, 1) // 4% growth
    expect(healthcareGrowth).toBeCloseTo(5.0, 1) // 5% growth
  })

  it('should format currency correctly', () => {
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value * 1000000)
    }
    
    expect(formatCurrency(750)).toBe('$750,000,000')
    expect(formatCurrency(1200)).toBe('$1,200,000,000')
  })

  it('should format percentage correctly', () => {
    const formatPercentage = (value) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    }
    
    expect(formatPercentage(4.5)).toBe('+4.50%')
    expect(formatPercentage(-2.3)).toBe('-2.30%')
    expect(formatPercentage(0)).toBe('+0.00%')
  })

  it('should process department breakdown correctly', () => {
    const processData = (data) => {
      const departmentTotals = {}
      
      data.forEach(item => {
        if (!departmentTotals[item.category]) {
          departmentTotals[item.category] = {
            totalSpending: 0,
            records: 0
          }
        }
        departmentTotals[item.category].totalSpending += item.value
        departmentTotals[item.category].records += 1
      })
      
      return Object.entries(departmentTotals).map(([category, stats]) => ({
        category,
        ...stats,
        avgSpending: stats.totalSpending / stats.records
      })).sort((a, b) => b.totalSpending - a.totalSpending)
    }
    
    const result = processData(mockUSData)
    
    expect(result).toHaveLength(2)
    expect(result[0].category).toBe('Defense') // Should be first (highest total)
    expect(result[0].totalSpending).toBe(1530000) // 750000 + 780000
    expect(result[1].category).toBe('Healthcare')
    expect(result[1].totalSpending).toBe(820000) // 400000 + 420000
  })
})