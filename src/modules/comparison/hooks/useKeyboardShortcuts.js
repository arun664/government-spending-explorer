/**
 * useKeyboardShortcuts - Hook for keyboard shortcuts
 * 
 * Shortcuts:
 * - h: Toggle header
 * - f: Open filters
 * - e: Export
 * - Escape: Close modals/dropdowns
 * - Arrow keys: Navigate chart
 * - +/-: Zoom in/out
 * 
 * Requirements: 15.1, 15.2, 15.3
 */

import { useEffect, useCallback } from 'react'

/**
 * Hook for managing keyboard shortcuts
 * @param {Object} handlers - Object mapping keys to handler functions
 * @param {boolean} enabled - Whether shortcuts are enabled
 */
export function useKeyboardShortcuts(handlers = {}, enabled = true) {
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in input fields
    const activeElement = document.activeElement
    const isInputField = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable
    )

    if (isInputField && event.key !== 'Escape') {
      return
    }

    // Get the handler for this key
    const handler = handlers[event.key]
    
    if (handler) {
      event.preventDefault()
      handler(event)
    }
  }, [handlers, enabled])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Default keyboard shortcuts for comparison page
 * @param {Object} actions - Actions object from ComparisonContext
 * @returns {Object} Keyboard shortcut handlers
 */
export function useComparisonKeyboardShortcuts(actions) {
  const handlers = {
    'h': () => {
      actions.toggleHeader?.()
    },
    'f': () => {
      actions.openFilters?.()
    },
    'e': () => {
      actions.openExport?.()
    },
    'Escape': () => {
      actions.closeModals?.()
    },
    'ArrowLeft': (event) => {
      if (!event.ctrlKey) return
      actions.navigatePrevious?.()
    },
    'ArrowRight': (event) => {
      if (!event.ctrlKey) return
      actions.navigateNext?.()
    },
    '+': (event) => {
      if (!event.ctrlKey) return
      actions.zoomIn?.()
    },
    '=': (event) => {
      if (!event.ctrlKey) return
      actions.zoomIn?.()
    },
    '-': (event) => {
      if (!event.ctrlKey) return
      actions.zoomOut?.()
    }
  }

  useKeyboardShortcuts(handlers, true)

  return handlers
}

export default useKeyboardShortcuts
