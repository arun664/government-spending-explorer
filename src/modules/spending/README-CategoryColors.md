# Category-Based Map Visualization

This document explains how to use the new category-based color scheme for the government spending map visualization.

## Overview

The map now supports two visualization modes:

1. **Single Category Mode**: Traditional single-color scale for one indicator
2. **Multi-Category Mode**: Countries colored by their dominant spending category

## Key Features

- **Category Colors**: Each spending category has a distinct color (personnel, transfers, debt, operations, etc.)
- **Dominant Category Visualization**: Countries are colored based on which category they spend the most on
- **Intensity Mapping**: Color intensity represents the total spending amount
- **Interactive Tooltips**: Hover to see category breakdown and percentages

## Usage

### 1. Load Category-Based Data

```javascript
import { loadCategorySpendingData } from '../services/SimpleSpendingService.js'

// Load data for multiple indicators across different categories
const categoryData = await loadCategorySpendingData(
  ['GE', 'GECE', 'GEG', 'GEI', 'GES', 'GEOM'], // Indicator codes
  [2015, 2023] // Year range
)
```

### 2. Create Category Color Function

```javascript
import { createCategoryColorFunction } from '../services/SimpleSpendingService.js'

// Create color function for category-based visualization
const colorFunction = createCategoryColorFunction(categoryData)
```

### 3. Use with SpendingWorldMap

```javascript
<SpendingWorldMap
  worldData={worldData}
  spendingData={categoryData}
  colorScale={colorFunction}
  filters={{
    yearRange: [2015, 2023],
    visualizationMode: 'dominant'
  }}
  selectedCountry={selectedCountry}
  onCountrySelect={handleCountrySelect}
/>
```

## Data Structure

The category data includes:

```javascript
{
  name: 'Multi-Category Government Spending Analysis',
  category: 'multi-category',
  countries: {
    'United States': {
      name: 'United States',
      code: 'USA',
      categories: {
        personnel: 1500.5,
        transfers: 2300.2,
        debt: 800.1,
        // ... other categories
      },
      totalSpending: 5200.8,
      dominantCategory: 'transfers',
      categoryPercentages: {
        personnel: 28.8,
        transfers: 44.2,
        debt: 15.4,
        // ... other percentages
      }
    }
  },
  categoryColors: {
    overview: '#667eea',
    personnel: '#f093fb',
    transfers: '#4facfe',
    debt: '#f5576c',
    operations: '#43e97b',
    other: '#ffa726',
    services: '#ab47bc',
    social: '#26c6da',
    programs: '#66bb6a'
  }
}
```

## Category Colors

| Category | Color | Description |
|----------|-------|-------------|
| Overview | #667eea | General government spending |
| Personnel | #f093fb | Employee compensation |
| Transfers | #4facfe | Grants and subsidies |
| Debt | #f5576c | Interest payments |
| Operations | #43e97b | Goods and services |
| Other | #ffa726 | Miscellaneous expenses |
| Services | #ab47bc | Public services |
| Social | #26c6da | Social benefits |
| Programs | #66bb6a | Specific programs |

## Visualization Modes

### Dominant Category Mode
- Countries colored by their highest spending category
- Color intensity based on total spending amount
- Shows which category dominates each country's budget

### Total Spending Mode
- All countries use the same color scale
- Intensity based on total spending across all categories
- Good for comparing overall government size

## Example Implementation

See `CategoryMapExample.jsx` for a complete working example of how to implement category-based visualization.

## Integration with Existing Components

The category-based functionality is fully compatible with existing components:

- **SpendingAnalysis**: Toggle between single and multi-category modes
- **SpendingWorldMap**: Automatically detects category data and renders appropriate legend
- **SpendingMapService**: Handles both traditional and category-based coloring

## Performance Notes

- Category data loading processes multiple CSV files in parallel
- Color functions are optimized for real-time map rendering
- Data is cached to avoid repeated processing

## Troubleshooting

1. **Colors not showing**: Ensure `spendingData.category === 'multi-category'`
2. **Missing tooltips**: Check that country data includes `dominantCategory` and `categoryPercentages`
3. **Performance issues**: Reduce the number of indicators or year range for faster loading