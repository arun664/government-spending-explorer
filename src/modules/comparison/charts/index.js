/**
 * Chart Components - Lazy-loaded exports for code splitting
 * 
 * All chart components are lazy-loaded to improve initial page load performance
 * Requirements: 7.4
 */

import { lazy } from 'react'

// Lazy load all chart components for code splitting
export const TimeSeriesChart = lazy(() => import('./TimeSeriesChart.jsx'))
export const ScatterPlotChart = lazy(() => import('./ScatterPlotChart.jsx'))
export const RankingBarChart = lazy(() => import('./RankingBarChart.jsx'))
export const BubbleChart = lazy(() => import('./BubbleChart.jsx'))
export const HeatmapChart = lazy(() => import('./HeatmapChart.jsx'))
export const BoxPlotChart = lazy(() => import('./BoxPlotChart.jsx'))

// Chart type metadata
export const CHART_TYPES = [
  {
    id: 'timeSeries',
    name: 'Time Series',
    description: 'Show trends over time',
    icon: '📈',
    component: TimeSeriesChart
  },
  {
    id: 'scatter',
    name: 'Scatter Plot',
    description: 'Correlation analysis',
    icon: '⚫',
    component: ScatterPlotChart
  },
  {
    id: 'ranking',
    name: 'Bar Chart',
    description: 'Country ranking',
    icon: '📊',
    component: RankingBarChart
  },
  {
    id: 'bubble',
    name: 'Bubble Chart',
    description: 'Multi-dimensional',
    icon: '🫧',
    component: BubbleChart
  },
  {
    id: 'heatmap',
    name: 'Heatmap',
    description: 'Correlation matrix',
    icon: '🔥',
    component: HeatmapChart
  },
  {
    id: 'boxplot',
    name: 'Box Plot',
    description: 'Distribution by region',
    icon: '📦',
    component: BoxPlotChart
  }
]

export default {
  TimeSeriesChart,
  ScatterPlotChart,
  RankingBarChart,
  BubbleChart,
  HeatmapChart,
  BoxPlotChart,
  CHART_TYPES
}
