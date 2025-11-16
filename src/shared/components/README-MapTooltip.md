# MapTooltip Component

## Overview
The MapTooltip component provides interactive tooltips for map visualizations, displaying detailed country information with color-coded styling.

## Features
- **200ms Delay**: Prevents flickering by delaying tooltip display
- **Cursor Following**: Tooltip follows cursor with 10px offset
- **Color-Coded**: Uses ColorSchemeService for consistent category and region colors
- **Dynamic Updates**: Updates when indicator category changes
- **Comprehensive Info**: Shows country name, region, code, spending value, and indicator category

## Usage

```jsx
import MapTooltip from '../../../shared/components/MapTooltip.jsx'

<MapTooltip
  country={countryData}
  indicator={indicatorData}
  position={{ x: mouseX, y: mouseY }}
  visible={isVisible}
/>
```

## Props
- `country`: Object with name, code, region, and spending data
- `indicator`: Object with name and category
- `position`: Object with x and y coordinates
- `visible`: Boolean to show/hide tooltip

## Integration
Integrated with:
- SpendingWorldMap component
- GDP WorldMap component

## Requirements
Implements requirements: 9.1, 9.2, 9.3, 9.4, 9.5
