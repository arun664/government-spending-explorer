# Comparison Page User Guide

## Overview

The Comparison Page provides comprehensive cross-country analysis of government spending data using all 48 IMF indicators. This guide will help you navigate the interface, understand the visualizations, and make the most of the analytical features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Page Layout](#page-layout)
3. [Chart Types](#chart-types)
4. [Filtering Data](#filtering-data)
5. [Interactive Features](#interactive-features)
6. [Exporting Data](#exporting-data)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Mobile Usage](#mobile-usage)
9. [Accessibility Features](#accessibility-features)
10. [Performance Tips](#performance-tips)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Comparison Page

Navigate to the Comparison section from the main dashboard menu. The page will load with default settings:
- **Chart Type**: Time Series (showing trends over time)
- **Indicator**: Total Government Expense (GE)
- **Countries**: All countries with available data
- **Year Range**: Full available range (typically 2010-2023)

### First Look

The page is organized into a fixed grid layout with:
- **Header** (top): Navigation and controls
- **Top Metrics** (below header): Summary statistics
- **Main Chart** (center): Primary visualization (70-80% of screen)
- **Bottom Metrics** (below chart): Statistical measures
- **Right Sidebar**: Highlights, top performers, trends, and outliers

---

## Page Layout

### Fixed Layout Design

The Comparison Page uses a **no-scroll design** - everything fits on one screen. This maximizes your focus on the data without distractions.

### Header Section

The header contains:
- **Hamburger Menu** (☰): Collapse/expand header to maximize chart space
- **Chart Type Dropdown**: Switch between 6 visualization types
- **Filter Button**: Open filtering panel
- **Export Button**: Export charts and data

**Tip**: Click the hamburger menu to hide the header and use the full screen for analysis.

### Metric Cards

**Top Metrics** (4 cards):
- Total countries with data
- Selected year/year range
- Active filters count
- Data coverage percentage

**Bottom Metrics** (6 cards):
- Average value
- Median value
- Standard deviation
- Minimum value (with country)
- Maximum value (with country)
- Range (max - min)

### Right Sidebar

The sidebar provides contextual insights:

1. **Top Performers**: Top 3-5 countries for the selected indicator
2. **Notable Trends**: Countries with significant increasing or decreasing trends
3. **Significant Outliers**: Countries with unusual values (using IQR method)

---

## Chart Types

The Comparison Page offers 6 specialized chart types, each designed for specific analytical purposes.

### 1. Time Series Chart (Default)

**Purpose**: Show trends over time for multiple countries

**Best For**:
- Identifying long-term trends
- Comparing growth rates
- Spotting inflection points

**Features**:
- Multiple country lines with distinct colors
- Interactive hover for detailed values
- Zoom and pan for detailed exploration
- Legend showing up to 10 countries

**How to Use**:
- Hover over lines to see country name and values
- Click a line to select/highlight that country
- Scroll to zoom in/out
- Drag to pan across years
- Double-click to reset zoom

### 2. Scatter Plot

**Purpose**: Show correlation between two indicators

**Best For**:
- Correlation analysis
- Identifying relationships
- Spotting outliers

**Features**:
- Each point represents a country
- Color-coded by region
- Trend line with correlation coefficient
- Interactive tooltips

**How to Use**:
- Select two indicators to compare
- Hover over points for country details
- Observe the trend line direction (positive/negative correlation)
- Check R² value for correlation strength

### 3. Bar Chart (Ranking)

**Purpose**: Compare all countries by a single indicator

**Best For**:
- Country rankings
- Identifying leaders and laggards
- Quick comparisons

**Features**:
- Horizontal bars for all countries
- Sorted by value (highest to lowest)
- Color-coded by region
- Virtualized rendering for 100+ countries

**How to Use**:
- Scroll through the full country list
- Hover over bars for exact values
- Click to select a country
- Use filters to narrow the list

### 4. Bubble Chart

**Purpose**: Multi-dimensional comparison (3-4 variables)

**Best For**:
- Complex relationships
- Size comparisons
- Multi-factor analysis

**Features**:
- X-axis: First indicator
- Y-axis: Second indicator
- Bubble size: Third indicator
- Color: Region or income level

**How to Use**:
- Select 3 indicators to visualize
- Larger bubbles = higher values for third indicator
- Hover for detailed breakdown
- Look for clusters and patterns

### 5. Heatmap

**Purpose**: Show correlation matrix between indicators

**Best For**:
- Pattern recognition
- Finding related indicators
- Comprehensive correlation analysis

**Features**:
- Color scale from negative to positive correlation
- All 48 indicators displayed
- Interactive cell selection
- Correlation coefficients shown

**How to Use**:
- Darker colors = stronger correlations
- Red = negative correlation
- Blue = positive correlation
- Click cells to see detailed correlation data

### 6. Box Plot

**Purpose**: Show distribution by region or income level

**Best For**:
- Statistical distribution
- Comparing groups
- Identifying outliers within groups

**Features**:
- Quartiles (Q1, Q2/median, Q3)
- Whiskers (min/max within 1.5×IQR)
- Outlier points
- Group comparisons

**How to Use**:
- Select grouping (region or income level)
- Box shows middle 50% of data
- Line in box = median
- Points outside whiskers = outliers

---

## Filtering Data

### Opening the Filter Panel

Click the **Filter** button in the header to open the filtering panel.

### Available Filters

#### 1. Region Filter
Select one or more regions:
- Europe
- Asia
- North America
- South America
- Africa
- Oceania
- Middle East

**Example**: Select "Europe" and "Asia" to compare only European and Asian countries.

#### 2. Income Level Filter
Filter by World Bank income classifications:
- High Income
- Upper Middle Income
- Lower Middle Income
- Low Income

**Example**: Select "High Income" to analyze only developed economies.

#### 3. Data Availability Filter
Control which countries appear based on data completeness:
- **All**: Show all countries with any data
- **Complete**: Show only countries with 80%+ data coverage
- **Partial**: Show only countries with incomplete data

**Example**: Select "Complete" for more reliable trend analysis.

### Applying Filters

1. Select your desired filters
2. Click **Apply** to update the chart
3. The filtered country count appears in the top metrics
4. Click **Reset** to clear all filters

**Note**: Filters persist when you switch chart types, maintaining your analysis context.

---

## Interactive Features

### Tooltips

**Desktop**: Hover over any data point to see detailed information
**Mobile**: Tap and hold on a data point

Tooltip shows:
- Country name and flag
- Indicator value
- Year
- Rank (if applicable)
- Additional context

### Zoom and Pan

**Desktop**:
- Scroll to zoom in/out
- Click and drag to pan
- Double-click to reset

**Mobile**:
- Pinch to zoom
- Drag with one finger to pan
- Double-tap to reset

### Country Selection

Click on any country (line, bar, point) to:
- Highlight that country across all visualizations
- Update metric cards with country-specific data
- Show detailed information in the sidebar

**Keyboard**: Use Tab to navigate, Enter/Space to select

### Chart Interactions

All charts support:
- **Hover**: Show tooltips
- **Click**: Select countries
- **Zoom**: Detailed exploration
- **Pan**: Navigate large datasets

---

## Exporting Data

### Export Options

Click the **Export** button to access export options:

#### 1. PNG Image
- Exports the current chart as a high-resolution PNG
- Includes metric cards and highlights
- Suitable for presentations and reports

#### 2. SVG Vector
- Exports as scalable vector graphics
- Perfect for publications
- Can be edited in design software

#### 3. CSV Data
- Exports the underlying data as CSV
- Includes all visible data points
- Column headers included
- Opens in Excel or any spreadsheet software

#### 4. Complete View
- Exports the entire page layout
- Includes all sections (header, metrics, chart, sidebar)
- Best for comprehensive documentation

### Export Process

1. Click **Export** button
2. Select format
3. Wait for processing (typically 1-3 seconds)
4. File downloads automatically
5. Success notification appears

**Tip**: For large datasets, CSV export may take a few seconds. A progress indicator will show the status.

---

## Keyboard Shortcuts

Enhance your productivity with keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `H` | Toggle header collapse/expand |
| `F` | Open filter panel |
| `E` | Open export menu |
| `Escape` | Close open modals/menus |
| `Tab` | Navigate through interactive elements |
| `Enter` / `Space` | Select focused element |
| `Arrow Keys` | Navigate chart elements |
| `+` / `-` | Zoom in/out (when chart is focused) |

**Tip**: Press `H` to quickly maximize chart space when analyzing data.

---

## Mobile Usage

The Comparison Page is fully optimized for mobile devices with touch-friendly interactions.

### Mobile Layout

On screens < 768px:
- **Stacked layout**: All sections stack vertically
- **Metric carousel**: Swipe through metric cards
- **Collapsible sidebar**: Tap to expand/collapse
- **Larger touch targets**: All buttons are 44×44px minimum

### Touch Gestures

- **Tap**: Select data points
- **Tap and hold**: Show tooltip
- **Swipe**: Navigate metric carousel
- **Pinch**: Zoom in/out on charts
- **Drag**: Pan across chart area
- **Double-tap**: Reset zoom

### Mobile Tips

1. **Rotate to landscape** for better chart viewing
2. **Use the hamburger menu** to hide header and maximize space
3. **Swipe through metrics** instead of scrolling
4. **Tap sidebar header** to collapse and see more chart
5. **Pinch zoom** works on all chart types

### Tablet Layout (768-1200px)

Tablets get a simplified grid:
- Sidebar moves to bottom
- Larger touch targets
- Optimized spacing
- Full chart functionality

---

## Accessibility Features

The Comparison Page is designed to be fully accessible to all users.

### Screen Reader Support

- **ARIA labels**: All charts and interactive elements have descriptive labels
- **Live regions**: Dynamic updates announced to screen readers
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Alt text**: All visual elements have text alternatives

### Keyboard Navigation

- **Full keyboard access**: Navigate entire page without a mouse
- **Focus indicators**: Clear visual focus on active elements
- **Tab order**: Logical navigation sequence
- **Focus trap**: Modals trap focus until closed

### Visual Accessibility

- **Color contrast**: WCAG 2.1 AA compliant (4.5:1 minimum)
- **Non-color indicators**: Patterns and labels supplement color
- **Resizable text**: Text scales up to 200% without breaking layout
- **Focus indicators**: High-contrast focus outlines

### Using with Screen Readers

1. **Navigate by headings**: Use heading navigation (H key in NVDA/JAWS)
2. **Explore charts**: Tab through chart elements to hear descriptions
3. **Access data**: Use arrow keys to navigate data points
4. **Hear updates**: Live regions announce filter and data changes

**Recommended Screen Readers**:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

---

## Performance Tips

### Optimizing Performance

The Comparison Page is optimized for large datasets, but you can improve performance further:

#### 1. Use Filters
- Narrow down to relevant countries
- Reduces rendering time
- Improves interaction responsiveness

#### 2. Choose Appropriate Chart Types
- **Time Series**: Fast for up to 50 countries
- **Bar Chart**: Virtualized for 100+ countries
- **Scatter Plot**: Efficient for correlation analysis
- **Heatmap**: Best for indicator relationships

#### 3. Clear Cache Periodically
- Browser cache stores processed data
- Clear if experiencing slowdowns
- Data reloads automatically

#### 4. Close Unused Tabs
- Frees up browser memory
- Improves overall performance

### Performance Targets

The page is designed to meet these targets:
- **Initial load**: < 2 seconds
- **Chart render**: < 500ms
- **Interaction latency**: < 100ms
- **Memory usage**: < 300MB
- **Animations**: 60 FPS

### Large Dataset Handling

For datasets with 200+ countries:
- **Virtualization**: Only visible items rendered
- **Canvas rendering**: Used for 500+ data points
- **Progressive loading**: Data loads incrementally
- **Caching**: Processed data cached for 5 minutes

---

## Troubleshooting

### Common Issues and Solutions

#### Chart Not Loading

**Symptoms**: Blank chart area or loading spinner

**Solutions**:
1. Check internet connection
2. Refresh the page (F5)
3. Clear browser cache
4. Try a different browser
5. Check browser console for errors

#### Slow Performance

**Symptoms**: Laggy interactions, slow rendering

**Solutions**:
1. Apply filters to reduce data
2. Close other browser tabs
3. Use a simpler chart type
4. Clear browser cache
5. Update your browser

#### Export Not Working

**Symptoms**: Export button doesn't respond or fails

**Solutions**:
1. Check browser pop-up blocker
2. Ensure sufficient disk space
3. Try a different export format
4. Refresh the page and try again
5. Check browser console for errors

#### Data Mismatch

**Symptoms**: Numbers don't match expectations

**Solutions**:
1. Check active filters
2. Verify selected indicator
3. Check year range
4. Compare with Spending module for consistency
5. Review data availability filter

#### Mobile Issues

**Symptoms**: Layout broken or interactions not working

**Solutions**:
1. Rotate device to landscape
2. Update mobile browser
3. Clear mobile browser cache
4. Try desktop mode
5. Use a different mobile browser

### Browser Compatibility

**Supported Browsers**:
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

**Not Supported**:
- Internet Explorer (any version)
- Browsers older than 2 years

### Getting Help

If you continue to experience issues:

1. **Check the console**: Press F12 and look for error messages
2. **Take a screenshot**: Capture the issue for reference
3. **Note the steps**: Document what you were doing when the issue occurred
4. **Contact support**: Provide browser version, OS, and error details

---

## Best Practices

### Analytical Workflow

1. **Start broad**: Begin with Time Series to see overall trends
2. **Apply filters**: Narrow to relevant countries/regions
3. **Switch views**: Use different chart types for different insights
4. **Identify patterns**: Look for trends, outliers, and correlations
5. **Export findings**: Save charts and data for reports

### Effective Comparisons

- **Compare similar countries**: Use income level or region filters
- **Look at multiple indicators**: Switch between related indicators
- **Check outliers**: Investigate unusual values in the sidebar
- **Verify trends**: Use Time Series to confirm patterns
- **Cross-reference**: Compare with Spending module data

### Data Interpretation

- **Context matters**: Consider economic, political, and social factors
- **Check data quality**: Use data availability filter
- **Look for patterns**: Trends are more reliable than single data points
- **Compare groups**: Use Box Plot for regional comparisons
- **Verify correlations**: Use Scatter Plot with R² values

---

## Advanced Features

### Country Mapping Consistency

The Comparison Page uses the same country mapping as the Spending module, ensuring:
- Consistent country names across the application
- Reliable cross-module comparisons
- Accurate data matching

### Caching and Performance

- **5-minute cache**: Processed data cached for quick access
- **Automatic refresh**: Cache expires and reloads automatically
- **Memoization**: Expensive calculations cached
- **Progressive rendering**: Large datasets load incrementally

### Statistical Methods

**Outlier Detection**:
- Uses Interquartile Range (IQR) method
- Outliers: Values > Q3 + 1.5×IQR or < Q1 - 1.5×IQR
- Robust to extreme values

**Trend Identification**:
- Linear regression analysis
- R² > 0.5 for significance
- Slope > 0.5 for notable trends

**Correlation Analysis**:
- Pearson correlation coefficient
- Range: -1 (negative) to +1 (positive)
- Displayed in Scatter Plot and Heatmap

---

## Glossary

**IMF Indicators**: 48 government spending indicators from the International Monetary Fund dataset

**IQR**: Interquartile Range - statistical measure of variability (Q3 - Q1)

**Normalization**: Process of standardizing country names for consistent matching

**Virtualization**: Rendering technique that only displays visible items for performance

**Canvas Rendering**: Using HTML5 canvas for efficient rendering of large datasets

**Memoization**: Caching technique that stores results of expensive calculations

**WCAG**: Web Content Accessibility Guidelines - standards for accessible web content

**ARIA**: Accessible Rich Internet Applications - specifications for accessibility

---

## Changelog

### Version 1.0 (Current)
- Initial release with 6 chart types
- All 48 IMF indicators accessible
- Complete country coverage (no sampling)
- Mobile-responsive design
- Full accessibility compliance
- Export functionality (PNG, SVG, CSV)
- Advanced filtering
- Performance optimizations

---

## Feedback

We're constantly improving the Comparison Page. Your feedback helps us make it better!

**What we'd love to hear about**:
- Feature requests
- Usability issues
- Performance problems
- Accessibility concerns
- Data accuracy questions

---

## Quick Reference Card

### Essential Actions
- **Switch chart**: Click dropdown in header
- **Filter data**: Click Filter button
- **Export**: Click Export button
- **Maximize chart**: Press `H` or click hamburger menu
- **Select country**: Click any data point
- **Zoom**: Scroll or pinch
- **Reset view**: Double-click or double-tap

### Key Metrics
- **Top cards**: Summary statistics
- **Bottom cards**: Statistical measures
- **Right sidebar**: Insights and highlights

### Chart Types
1. Time Series - Trends over time
2. Scatter Plot - Correlation analysis
3. Bar Chart - Country rankings
4. Bubble Chart - Multi-dimensional
5. Heatmap - Correlation matrix
6. Box Plot - Distribution by group

---

*Last updated: November 2025*
*Version: 1.0*
