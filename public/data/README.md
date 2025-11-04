# Data Directory

This directory contains the data files used by the Government Expense Dashboard.

## Available Data Files

### GDP Data
- **gdp_clean.csv**: Cleaned GDP data with country names, codes, years, and GDP growth rates
- **gdp_growth.csv**: Additional GDP growth data

### Government Expense Data
- **expense_clean.csv**: Cleaned government expense data (large file, may need special handling)
- **government_expense.csv**: Raw government expense data (large file, may need special handling)

## Data Structure

### GDP Data Format
```csv
Country Name,Country Code,Year,GDP Growth
United States,USA,2020,2.3
Germany,DEU,2020,1.8
...
```

### Expense Data Format (Expected)
```csv
Country Name,Country Code,Year,Total Spending,Per Capita Spending,Category
United States,USA,2020,4500000000000,13500,Defense
United States,USA,2020,1200000000000,3600,Healthcare
...
```

## Data Sources

The data in this directory is sourced from:
- World Bank Open Data
- Government financial reports
- International Monetary Fund (IMF) statistics
- OECD government finance statistics

## Usage Notes

1. Large CSV files (>50MB) may require streaming or chunked loading
2. Data should be validated and cleaned before use in visualizations
3. Missing values should be handled appropriately in analysis
4. Currency values may need normalization for cross-country comparisons

## Data Processing

The dashboard includes utilities for:
- Data loading and parsing (`src/utils/dataLoader.js`)
- Data cleaning and validation (`src/utils/dataProcessor.js`)
- Statistical analysis and calculations
- Data quality assessment

## Performance Considerations

- Large datasets should be loaded asynchronously
- Consider implementing data pagination for better performance
- Use data caching for frequently accessed datasets
- Implement progressive loading for better user experience