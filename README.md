# Government Expense Dashboard

A comprehensive web-based application for government expense analysis, visualization, and reporting. This dashboard provides detailed analysis capabilities for government spending data across countries, with special focus on United States expense reporting and GDP statistics integration.

## Features

- **Interactive Visualizations**: World map with expense data heatmaps and interactive charts
- **Country Comparison**: Compare government spending across countries with alphabetical ordering
- **US Government Reports**: Detailed expense breakdowns by departments and agencies
- **GDP Analysis**: Integration of GDP statistics with spending data analysis
- **Advanced Filtering**: Multi-select filtering by regions, years, and expense categories
- **Export Capabilities**: PDF reports and CSV data exports
- **Statistical Analysis**: Data cleaning, statistical metrics, and anomaly detection

## Technology Stack

- **Frontend**: React 18.2.0 with modern hooks and functional components
- **Visualization**: D3.js v7.8.5 for interactive charts and maps
- **Build Tool**: Vite 5.0.8 for fast development and optimized builds
- **Geographic Data**: TopoJSON for world map visualizations
- **Styling**: Modern CSS with Grid and Flexbox layouts

## Project Structure

```
government-expense-dashboard/
├── src/
│   ├── components/          # React components
│   ├── services/           # Data processing and API services
│   ├── utils/              # Utility functions and helpers
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   ├── App.css             # Application styles
│   └── index.css           # Global styles
├── data/                   # Data files (CSV format)
├── public/                 # Static assets
├── package.json            # Project dependencies and scripts
├── vite.config.js          # Vite configuration
└── index.html              # HTML template
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository and navigate to the project directory:
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

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Data Sources

The dashboard uses government spending and GDP data from various sources:

- **Government Expense Data**: Comprehensive spending data by country and category
- **GDP Statistics**: Economic indicators and growth data
- **Geographic Data**: Country boundaries and regional information

## Development

### Adding New Components

Components should be placed in the `src/components/` directory and follow React functional component patterns with hooks.

### Data Processing

Data processing utilities are located in `src/services/` and `src/utils/` directories. The system includes:

- Data cleaning and validation
- Statistical analysis functions
- Export functionality
- Performance optimizations

### Styling

The project uses modern CSS with:

- CSS Grid and Flexbox for layouts
- CSS custom properties for theming
- Responsive design principles
- Accessibility considerations

## Performance Considerations

- Data caching for frequently accessed datasets
- Virtual scrolling for large country lists
- Lazy loading of visualization components
- Optimized bundle splitting with Vite

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style and patterns
2. Ensure all components are accessible
3. Test across different screen sizes
4. Update documentation as needed

## License

MIT License - see LICENSE file for details