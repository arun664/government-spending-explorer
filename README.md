# Government Expense and GDP Data Visualization Dashboard
- Live Dashboard: https://arun664.github.io/government-spending-explorer (_deployed using github pages_)

An interactive web application for analyzing and visualizing government spending patterns and GDP data across countries from 2005 to 2022. This dashboard provides comprehensive tools for exploring the relationship between economic growth and government expenditure through multiple visualization perspectives.

## Overview

This project enables users to explore government spending data across different countries and time periods, compare GDP trends with government expenditure, and analyze spending patterns by category. The dashboard features interactive maps, charts, and filtering capabilities designed for policy makers, economists, researchers, and students.

## Key Features

### GDP Visualization
- Interactive world map showing GDP distribution by country
- Color-coded intensity mapping for easy comparison
- Year-by-year navigation from 2005 to 2022
- Hover tooltips with detailed country information

### Government Spending Analysis
- Stacked area charts showing spending by category over time
- Bar charts comparing spending across different expense categories
- Category breakdown including Education, Health, Defense, Social Protection, and more
- Interactive legend for showing/hiding specific categories

### GDP vs Spending Comparison
- Trend line charts overlaying GDP and spending patterns
- Side-by-side bar charts comparing top 15 countries
- Heatmap visualization showing GDP-spending density distribution
- Real-time metrics panel with key insights
- Animation feature to cycle through years automatically

### Interactive Controls
- Year range filtering (2005-2022)
- Country selection (World view or individual countries)
- Data series toggles (GDP and Spending)
- Play/pause animation for temporal analysis
- Responsive tooltips with formatted values

## Technologies Used

### Core Framework
- React 18.2.0 - Component-based UI framework with hooks
- Vite 5.0.8 - Fast build tool and development server
- JavaScript ES6+ - Modern JavaScript features

### Data Visualization
- D3.js v7.8.5 - Data-driven document manipulation for charts and maps
- TopoJSON - Efficient geographic data format for world maps
- Custom color scales and interpolation for data representation

### Data Processing
- D3-dsv - CSV parsing and data loading
- Custom normalization utilities for GDP and spending data
- Aggregation and statistical calculation functions

### Styling
- CSS3 with Grid and Flexbox layouts
- CSS custom properties for theming
- Responsive design for multiple screen sizes
- Gradient backgrounds and modern UI elements

### Development Tools
- ESLint - Code quality and consistency
- Vite HMR - Hot module replacement for fast development
- React Developer Tools compatible

## Project Structure

```
government-expense-dashboard/
├── src/
│   ├── modules/
│   │   ├── gdp/                    # GDP visualization module
│   │   │   ├── components/         # GDP map and related components
│   │   │   └── services/           # GDP data loading services
│   │   ├── spending/               # Government spending module
│   │   │   ├── components/         # Spending charts and filters
│   │   │   └── services/           # Spending data processing
│   │   └── comparison/             # GDP vs Spending comparison
│   │       ├── components/         # Comparison charts and dashboard
│   │       ├── utils/              # Data normalization utilities
│   │       └── styles/             # Module-specific styles
│   ├── shared/
│   │   └── components/             # Reusable components
│   ├── utils/                      # Common utilities
│   ├── App.jsx                     # Main application component
│   └── main.jsx                    # Application entry point
├── data/                           # CSV data files
│   ├── gdp_vals.csv               # GDP data by country and year
│   ├── expense_clean_usd.csv      # Government spending data
│   └── countries-110m.json        # Geographic boundaries
├── public/                         # Static assets
└── package.json                    # Dependencies and scripts
```

## Data Sources

### GDP Data (gdp_vals.csv)
Source: World Bank Open Data
- Contains GDP values in USD for 200+ countries
- Time period: 1960-2022
- Format: Country Name, Country Code, yearly columns
- Values in actual USD (converted to millions for visualization)
- Reference: https://data.worldbank.org/indicator/NY.GDP.MKTP.CD

### Government Spending Data (expense_clean_usd.csv)
Source: International Monetary Fund (IMF) Government Finance Statistics
- Government expenditure by functional classification
- Categories: Education, Health, Defense, Social Protection, Economic Affairs, General Public Services, Public Order and Safety, Environmental Protection, Housing and Community Amenities, Recreation Culture and Religion
- Time period: 2005-2022
- Format: Country Name, Year, Expense Category, Value in USD
- Values in actual USD (converted to millions for consistency)
- Reference: https://data360.worldbank.org/en/dataset/IMF_GFSE


### Geographic Data (countries-110m.json)
Source: Natural Earth Data via TopoJSON
- Country boundaries and geographic coordinates
- Simplified topology for web performance
- ISO country code mapping for data joining
- Reference: https://github.com/topojson/world-atlas

## Installation and Setup

### Prerequisites
- Node.js version 16.0 or higher
- npm version 7.0 or higher (or yarn)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation Steps

1. Navigate to the project directory:
```bash
cd government-expense-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

### Build for Production

Create an optimized production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create optimized production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## Usage Guide

### Viewing GDP Data
1. Navigate to the GDP page from the main menu
2. Use the year slider to select different years
3. Hover over countries to see detailed GDP information
4. Colors indicate relative GDP values (darker = higher GDP)

### Analyzing Government Spending
1. Go to the Spending page
2. Select a country from the dropdown
3. Choose a year range to analyze
4. View spending breakdown by category in charts
5. Toggle categories on/off using the legend

### Comparing GDP and Spending
1. Access the Comparison page
2. Set year range filters (default: 2005-2022)
3. Select "World" for global view or specific country
4. Use checkboxes to show/hide GDP or Spending data
5. Click "Animate" to see year-by-year progression
6. Hover over charts for detailed tooltips

### Understanding Visualizations

Trend Line Chart: Shows GDP and spending over time with smooth curves

Bar Chart: Compares top 15 countries using 3-letter country codes (USA, CHN, JPN, etc.)

Heatmap: Displays density of countries by GDP and spending ranges (yellow = few countries, red = many countries)

Key Insights Panel: Shows real-time metrics including country count, average spending/GDP ratio, and growth indicators

## Data Processing Notes

### Normalization
- GDP values are converted from actual USD to millions USD (divide by 1,000,000)
- Spending values are converted to millions USD for consistency
- All monetary values displayed with appropriate units (T = trillions, B = billions, M = millions)

### Filtering
- Regional aggregates are excluded to show only individual countries
- Missing or invalid data points are filtered out
- Year range filtering applied at data load time for performance

### Calculations
- Spending/GDP ratio calculated as (spending / GDP) × 100
- Average ratios computed across all available data points
- Growth rates calculated between first and last years in range

## Performance Optimizations

- Data filtered at load time to reduce memory usage
- Memoization prevents unnecessary recalculations
- D3 efficient update patterns minimize DOM manipulation
- SVG rendering optimized for large datasets
- Responsive sizing using percentage-based dimensions

## Browser Compatibility

Tested and supported on:
- Google Chrome 90+
- Mozilla Firefox 88+
- Safari 14+
- Microsoft Edge 90+

## Accessibility Features

- Keyboard navigation support
- ARIA labels for interactive elements
- High contrast color schemes
- Responsive text sizing
- Screen reader compatible tooltips

## Known Limitations

- Data availability varies by country and year
- Some countries have incomplete spending category data
- 2023 data may not be available for all countries
- Map projection may distort country sizes near poles

## Future Enhancements

- Add more granular spending subcategories
- Include additional economic indicators (inflation, unemployment)
- Implement predictive analytics for trend forecasting
- Add data export functionality (CSV, PDF)
- Support for multiple languages
- Mobile-optimized touch interactions

## Contributing

Contributions are welcome. Please follow these guidelines:
- Use functional React components with hooks
- Follow existing code style and naming conventions
- Ensure all visualizations are accessible
- Test across different browsers and screen sizes
- Update documentation for new features

## License

This project is licensed under the MIT License.

## Acknowledgments

- World Bank for GDP data
- International Monetary Fund for government spending data
- Natural Earth for geographic data
- D3.js community for visualization examples
- React community for component patterns

## Contact

For questions or issues, please open an issue in the project repository.

---

Last Updated: November 2025
