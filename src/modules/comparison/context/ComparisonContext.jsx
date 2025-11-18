/**
 * ComparisonContext - React Context for comparison page state management
 * 
 * Features:
 * - Centralized state for chart type, indicator, filters, and data
 * - Actions for updating state
 * - Automatic data loading when dependencies change
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 6.1, 6.2, 6.3
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { comparisonDataService } from '../services/ComparisonDataService.js'

// Initial state
const initialState = {
  // UI State
  headerCollapsed: false,
  chartType: 'timeSeries',
  loading: false,
  error: null,
  
  // Data State
  selectedIndicator: 'GE', // Total Government Expense (default)
  selectedCountries: [],
  selectedYear: null,
  yearRange: [2010, 2022],
  
  // Filter State (persisted across chart type changes)
  filters: {
    regions: [],
    incomeLevel: [],
    dataAvailability: 'all' // 'all', 'complete', 'partial'
  },
  filterPanelOpen: false,
  
  // Chart State
  chartData: null,
  metrics: null,
  highlights: {
    topPerformers: [],
    trends: [],
    outliers: []
  },
  
  // Interaction State
  hoveredCountry: null,
  selectedDataPoint: null,
  tooltipData: null
}

// Action types
const ActionTypes = {
  SET_CHART_TYPE: 'SET_CHART_TYPE',
  TOGGLE_HEADER: 'TOGGLE_HEADER',
  SET_SELECTED_INDICATOR: 'SET_SELECTED_INDICATOR',
  SET_FILTERS: 'SET_FILTERS',
  SET_CHART_DATA: 'SET_CHART_DATA',
  SET_METRICS: 'SET_METRICS',
  SET_HIGHLIGHTS: 'SET_HIGHLIGHTS',
  SET_TOOLTIP: 'SET_TOOLTIP',
  SELECT_COUNTRY: 'SELECT_COUNTRY',
  SET_HOVERED_COUNTRY: 'SET_HOVERED_COUNTRY',
  SET_YEAR_RANGE: 'SET_YEAR_RANGE',
  SET_SELECTED_YEAR: 'SET_SELECTED_YEAR',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
  TOGGLE_FILTER_PANEL: 'TOGGLE_FILTER_PANEL',
  APPLY_FILTERS: 'APPLY_FILTERS'
}

// Reducer
function comparisonReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_CHART_TYPE:
      return { ...state, chartType: action.payload }
    
    case ActionTypes.TOGGLE_HEADER:
      return { ...state, headerCollapsed: !state.headerCollapsed }
    
    case ActionTypes.SET_SELECTED_INDICATOR:
      return { ...state, selectedIndicator: action.payload, loading: true }
    
    case ActionTypes.SET_FILTERS:
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload },
        loading: true
      }
    
    case ActionTypes.SET_CHART_DATA:
      return { ...state, chartData: action.payload, loading: false, error: null }
    
    case ActionTypes.SET_METRICS:
      return { ...state, metrics: action.payload }
    
    case ActionTypes.SET_HIGHLIGHTS:
      return { ...state, highlights: { ...state.highlights, ...action.payload } }
    
    case ActionTypes.SET_TOOLTIP:
      return { ...state, tooltipData: action.payload }
    
    case ActionTypes.SELECT_COUNTRY:
      const country = action.payload
      const isSelected = state.selectedCountries.includes(country)
      return {
        ...state,
        selectedCountries: isSelected
          ? state.selectedCountries.filter(c => c !== country)
          : [...state.selectedCountries, country]
      }
    
    case ActionTypes.SET_HOVERED_COUNTRY:
      return { ...state, hoveredCountry: action.payload }
    
    case ActionTypes.SET_YEAR_RANGE:
      return { ...state, yearRange: action.payload, loading: true }
    
    case ActionTypes.SET_SELECTED_YEAR:
      return { ...state, selectedYear: action.payload }
    
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload }
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
    
    case ActionTypes.RESET_STATE:
      return { ...initialState }
    
    case ActionTypes.TOGGLE_FILTER_PANEL:
      return { ...state, filterPanelOpen: !state.filterPanelOpen }
    
    case ActionTypes.APPLY_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        loading: true,
        filterPanelOpen: false
      }
    
    default:
      return state
  }
}

// Create context
const ComparisonContext = createContext(null)

// Provider component
export function ComparisonProvider({ children, onLoadingChange }) {
  const [state, dispatch] = useReducer(comparisonReducer, initialState)

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(state.loading)
    }
  }, [state.loading, onLoadingChange])

  // Load data when indicator changes (filters handled separately to avoid infinite loop)
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true })
        
        // Load indicator data
        const data = await comparisonDataService.loadIndicatorData(
          state.selectedIndicator,
          {
            yearRange: state.yearRange,
            filters: state.filters
          }
        )

        if (!isMounted) return

        dispatch({ type: ActionTypes.SET_CHART_DATA, payload: data })

        // Calculate metrics
        const metrics = comparisonDataService.calculateMetrics(data, state.chartType)
        dispatch({ type: ActionTypes.SET_METRICS, payload: metrics })

        // Calculate highlights
        const topPerformers = comparisonDataService.getTopPerformers(data, 5)
        const trends = comparisonDataService.identifyTrends(data)
        const outliers = comparisonDataService.identifyOutliers(data)

        dispatch({
          type: ActionTypes.SET_HIGHLIGHTS,
          payload: { topPerformers, trends, outliers }
        })

        // Set loading to false after everything is loaded
        if (isMounted) {
          dispatch({ type: ActionTypes.SET_LOADING, payload: false })
        }

      } catch (error) {
        console.error('Error loading comparison data:', error)
        if (isMounted) {
          dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
          dispatch({ type: ActionTypes.SET_LOADING, payload: false })
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [state.selectedIndicator])

  // Recalculate metrics when chart type changes
  useEffect(() => {
    if (state.chartData) {
      const metrics = comparisonDataService.calculateMetrics(state.chartData, state.chartType)
      dispatch({ type: ActionTypes.SET_METRICS, payload: metrics })
    }
  }, [state.chartType, state.chartData])

  // Actions
  const actions = {
    setChartType: useCallback((chartType) => {
      dispatch({ type: ActionTypes.SET_CHART_TYPE, payload: chartType })
    }, []),

    toggleHeader: useCallback(() => {
      dispatch({ type: ActionTypes.TOGGLE_HEADER })
    }, []),

    setSelectedIndicator: useCallback((indicator) => {
      dispatch({ type: ActionTypes.SET_SELECTED_INDICATOR, payload: indicator })
    }, []),

    setFilters: useCallback((filters) => {
      dispatch({ type: ActionTypes.SET_FILTERS, payload: filters })
    }, []),

    selectCountry: useCallback((country) => {
      dispatch({ type: ActionTypes.SELECT_COUNTRY, payload: country })
    }, []),

    setHoveredCountry: useCallback((country) => {
      dispatch({ type: ActionTypes.SET_HOVERED_COUNTRY, payload: country })
    }, []),

    setTooltip: useCallback((tooltipData) => {
      dispatch({ type: ActionTypes.SET_TOOLTIP, payload: tooltipData })
    }, []),

    setYearRange: useCallback((yearRange) => {
      dispatch({ type: ActionTypes.SET_YEAR_RANGE, payload: yearRange })
    }, []),

    setSelectedYear: useCallback((year) => {
      dispatch({ type: ActionTypes.SET_SELECTED_YEAR, payload: year })
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: ActionTypes.RESET_STATE })
    }, []),

    toggleFilterPanel: useCallback(() => {
      dispatch({ type: ActionTypes.TOGGLE_FILTER_PANEL })
    }, []),

    applyFilters: useCallback((filters) => {
      dispatch({ type: ActionTypes.APPLY_FILTERS, payload: filters })
    }, [])
  }

  const value = {
    state,
    actions
  }

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  )
}

ComparisonProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onLoadingChange: PropTypes.func
}

// Custom hook to use comparison context
export function useComparison() {
  const context = useContext(ComparisonContext)
  
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider')
  }
  
  return context
}

export default ComparisonContext
