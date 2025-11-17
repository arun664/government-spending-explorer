/**
 * ChartsDemo - Demo component to test all chart implementations
 * This file can be used for testing and development purposes
 */

import { useState } from 'react'
import { ComparisonProvider } from '../context/ComparisonContext.jsx'
import ChartContainer from '../components/ChartContainer.jsx'
import {
  TimeSeriesChart,
  ScatterPlotChart,
  RankingBarChart,
  BubbleChart,
  HeatmapChart,
  BoxPlotChart
} from './index.js'

export function ChartsDemo() {
  const [selectedChart, setSelectedChart] = useState('timeSeries')

  const charts = {
    timeSeries: { component: TimeSeriesChart, name: 'Time Series' },
    scatter: { component: ScatterPlotChart, name: 'Scatter Plot' },
    ranking: { component: RankingBarChart, name: 'Ranking Bar Chart' },
    bubble: { component: BubbleChart, name: 'Bubble Chart' },
    heatmap: { component: HeatmapChart, name: 'Heatmap' },
    boxplot: { component: BoxPlotChart, name: 'Box Plot' }
  }

  const ChartComponent = charts[selectedChart].component

  return (
    <ComparisonProvider>
      <div style={{ padding: '20px' }}>
        <h1>Charts Demo</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="chart-select">Select Chart: </label>
          <select
            id="chart-select"
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value)}
            style={{ padding: '8px', fontSize: '14px' }}
          >
            {Object.entries(charts).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <ChartContainer>
          <ChartComponent width={1000} height={600} />
        </ChartContainer>
      </div>
    </ComparisonProvider>
  )
}

export default ChartsDemo
