/**
 * FocusTrap - Trap keyboard focus within a container
 * 
 * Features:
 * - Traps Tab key within active modal/dropdown
 * - Handles Shift+Tab for reverse navigation
 * - Automatically focuses first element on mount
 * - Restores focus on unmount
 * 
 * Requirements: 15.2
 */

import { useEffect, useRef } from 'react'

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ')

export function FocusTrap({ children, active = true, autoFocus = true, restoreFocus = true }) {
  const containerRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement

    // Get all focusable elements
    const focusableElements = containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
    
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Auto-focus first element
    if (autoFocus) {
      firstElement.focus()
    }

    // Handle Tab key
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      // Shift+Tab (backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } 
      // Tab (forwards)
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Add event listener
    containerRef.current.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown)
      }

      // Restore focus to previous element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [active, autoFocus, restoreFocus])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

export default FocusTrap
