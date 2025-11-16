/**
 * Comparison Module Exports
 */

// Components - Core interactive visualizations
export { default as GDPSpendingComparison } from './components/GDPSpendingComparison.jsx'
export { default as ScatterPlotChart } from './components/ScatterPlotChart.jsx'
export { default as BubbleChart } from './components/BubbleChart.jsx'

// Components - Statistical Analysis Charts
export { default as CorrelationHeatmap } from './components/CorrelationHeatmap.jsx'
export { default as ParallelCoordinates } from './components/ParallelCoordinates.jsx'
export { default as StatisticalAnalysisCharts } from './components/StatisticalAnalysisCharts.jsx'

// Components - Specialized Flow & Hierarchical Charts
export { default as SankeyDiagram } from './components/SankeyDiagram.jsx'
// export { default as RadarChart } from './components/RadarChart.jsx'
export { default as TreemapChart } from './components/TreemapChart.jsx'
export { default as SpecializedFlowCharts } from './components/SpecializedFlowCharts.jsx'

// Components - Advanced Network & Temporal Charts
export { default as NetworkGraph } from './components/NetworkGraph.jsx'
export { default as StreamGraph } from './components/StreamGraph.jsx'
export { default as AdvancedNetworkTemporalCharts } from './components/AdvancedNetworkTemporalCharts.jsx'

// Components - Dashboard and Layout
export { default as ComparisonDashboard } from './components/ComparisonDashboard.jsx'
export { default as ChartWrapper } from './components/ChartWrapper.jsx'
export { default as DashboardDemo } from './components/DashboardDemo.jsx'

// Services - Independent data infrastructure
export { ComparisonDataLoader, comparisonDataLoader } from './services/ComparisonDataLoader.js'
export { ComparisonDataProcessor, comparisonDataProcessor } from './services/ComparisonDataProcessor.js'
export { ChartInteractionManager, chartInteractionManager } from './services/ChartInteractionManager.js'

// Services - Export and Performance
export { default as ComparisonExporter } from './services/ComparisonExporter.js'
export { default as ExportPerformanceIntegration } from './services/ExportPerformanceIntegration.js'

// Utils - Independent utilities with M/B formatting and validation
export { NumberFormatter, numberFormatter, formatMB, formatCurrency, formatPercentage, formatGDPGrowth, formatTrend } from './utils/NumberFormatter.js'
export { ValidationUtils, validationUtils } from './utils/ValidationUtils.js'
export { TimeSeriesAnimator, timeSeriesAnimator, createAnimator, animationPresets } from './utils/TimeSeriesAnimator.js'
export { InteractionUtils, interactionUtils, createZoomBehavior, createBrushBehavior, analyzeQuadrants } from './utils/InteractionUtils.js'

// Utils - Performance Management
export { default as PerformanceManager } from './utils/PerformanceManager.js'

// Legacy exports (existing utilities)
export * from './utils/comparisonDataLoader.js'
export * from './utils/regionMapping.js'