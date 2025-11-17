/**
 * Comparison Module Exports
 */

// Main Page Component (NEW - uses ComparisonProvider + ComparisonLayout)
export { default as ComparisonPage } from './components/ComparisonPage.jsx'

// Context and Layout
export { ComparisonProvider, useComparison } from './context/ComparisonContext.jsx'
export { default as ComparisonLayout } from './components/ComparisonLayout.jsx'

// Header and Controls
export { default as ComparisonHeader } from './components/ComparisonHeader.jsx'
export { default as ChartTypeDropdown } from './components/ChartTypeDropdown.jsx'
export { default as FilterButton } from './components/FilterButton.jsx'
export { default as ExportButton } from './components/ExportButton.jsx'

// Panels
export { default as FilterPanel } from './components/FilterPanel.jsx'
export { default as ExportMenu } from './components/ExportMenu.jsx'

// Chart Components (NEW - from charts/ folder)
export { default as TimeSeriesChart } from './charts/TimeSeriesChart.jsx'
export { default as RankingBarChart } from './charts/RankingBarChart.jsx'
export { default as ScatterPlotChart } from './charts/ScatterPlotChart.jsx'
export { default as BubbleChart } from './charts/BubbleChart.jsx'
export { default as HeatmapChart } from './charts/HeatmapChart.jsx'
export { default as BoxPlotChart } from './charts/BoxPlotChart.jsx'

// Chart Container
export { default as ChartContainer } from './components/ChartContainer.jsx'
export { default as ChartTooltip } from './components/ChartTooltip.jsx'

// Metric Cards
export { default as TopMetricCards } from './components/TopMetricCards.jsx'
export { default as BottomMetricCards } from './components/BottomMetricCards.jsx'
export { default as MetricCard } from './components/MetricCard.jsx'

// Sidebar Components
export { default as RightSidebar } from './components/RightSidebar.jsx'
export { default as TopPerformers } from './components/TopPerformers.jsx'
export { default as NotableTrends } from './components/NotableTrends.jsx'
export { default as SignificantOutliers } from './components/SignificantOutliers.jsx'

// Services - NEW data infrastructure
export { comparisonDataService } from './services/ComparisonDataService.js'
export { default as ExportService } from './services/ExportService.js'
export { ChartInteractionManager, chartInteractionManager } from './services/ChartInteractionManager.js'

// Utilities
export { NumberFormatter, numberFormatter, formatMB, formatCurrency, formatPercentage, formatGDPGrowth, formatTrend } from './utils/NumberFormatter.js'
export { ValidationUtils, validationUtils } from './utils/ValidationUtils.js'
export { TimeSeriesAnimator, timeSeriesAnimator, createAnimator, animationPresets } from './utils/TimeSeriesAnimator.js'
export { InteractionUtils, interactionUtils, createZoomBehavior, createBrushBehavior, analyzeQuadrants } from './utils/InteractionUtils.js'
export { default as PerformanceManager } from './utils/PerformanceManager.js'
export * from './utils/regionMapping.js'

// Accessibility
export { default as FocusTrap } from './components/FocusTrap.jsx'
export { default as useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'