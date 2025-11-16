/**
 * useDataPreload Hook
 * React hook for accessing preloaded data with loading states
 * 
 * Usage:
 * const { data, isLoading, error, retry } = useDataPreload()
 */

import { useState, useEffect } from 'react'
import { dataPreloadService } from '../services/DataPreloadService.js'

export function useDataPreload() {
  const [state, setState] = useState({
    data: null,
    isLoading: true,
    isLoaded: false,
    progress: 0,
    error: null,
    stats: null
  })

  useEffect(() => {
    // Subscribe to preload service updates
    const unsubscribe = dataPreloadService.subscribe((status) => {
      setState(prev => ({
        ...prev,
        isLoading: status.status === 'loading',
        isLoaded: status.status === 'complete',
        progress: status.progress || prev.progress,
        error: status.error || null,
        stats: status.stats || prev.stats
      }))
    })

    // Check if data is already loaded
    if (dataPreloadService.isDataLoaded()) {
      setState({
        data: dataPreloadService.getData(),
        isLoading: false,
        isLoaded: true,
        progress: 100,
        error: null,
        stats: null
      })
    } else if (!dataPreloadService.getStatus().isLoading) {
      // Start preload if not already loading
      dataPreloadService.preload()
        .then(data => {
          setState(prev => ({
            ...prev,
            data,
            isLoading: false,
            isLoaded: true,
            progress: 100
          }))
        })
        .catch(error => {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message
          }))
        })
    }

    return unsubscribe
  }, [])

  const retry = async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      const data = await dataPreloadService.retry()
      setState(prev => ({
        ...prev,
        data,
        isLoading: false,
        isLoaded: true,
        error: null
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }))
    }
  }

  return {
    ...state,
    retry
  }
}

export default useDataPreload
