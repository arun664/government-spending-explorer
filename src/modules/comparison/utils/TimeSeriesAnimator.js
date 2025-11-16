/**
 * TimeSeriesAnimator - Utility for animating time-series data in visualizations
 * 
 * Features:
 * - Play/pause controls for time-series animation
 * - Country trajectory trails with smooth transitions
 * - Configurable animation speed and interpolation
 * - Event-driven architecture for chart synchronization
 */

export class TimeSeriesAnimator {
  constructor(options = {}) {
    this.options = {
      defaultSpeed: 1000, // milliseconds per frame
      minSpeed: 100,
      maxSpeed: 3000,
      interpolation: 'linear', // 'linear', 'ease', 'bounce'
      loop: false,
      autoReverse: false,
      ...options
    }

    this.isPlaying = false
    this.isPaused = false
    this.currentIndex = 0
    this.direction = 1 // 1 for forward, -1 for reverse
    this.timelineData = []
    this.intervalId = null
    this.listeners = new Map()
    this.speed = this.options.defaultSpeed
  }

  /**
   * Set the timeline data for animation
   * @param {Array} data - Array of time-ordered data points
   * @param {string} timeField - Field name containing time/year values
   */
  setTimelineData(data, timeField = 'year') {
    // Group data by time periods and sort
    const timeGroups = new Map()
    
    data.forEach(record => {
      const timeValue = record[timeField]
      if (!timeGroups.has(timeValue)) {
        timeGroups.set(timeValue, [])
      }
      timeGroups.get(timeValue).push(record)
    })

    // Convert to sorted array
    this.timelineData = Array.from(timeGroups.entries())
      .sort((a, b) => a[0] - b[0]) // Sort by time value
      .map(([timeValue, records]) => ({
        time: timeValue,
        data: records,
        index: this.timelineData.length
      }))

    this.currentIndex = 0
    this.emit('timelineLoaded', {
      totalFrames: this.timelineData.length,
      timeRange: {
        start: this.timelineData[0]?.time,
        end: this.timelineData[this.timelineData.length - 1]?.time
      }
    })

    return this
  }

  /**
   * Start animation playback
   * @param {Object} options - Playback options
   */
  play(options = {}) {
    if (this.isPlaying) return this

    const playOptions = { ...this.options, ...options }
    this.speed = playOptions.speed || this.speed
    this.isPlaying = true
    this.isPaused = false

    this.emit('playStarted', { 
      currentIndex: this.currentIndex,
      totalFrames: this.timelineData.length 
    })

    this.intervalId = setInterval(() => {
      this.nextFrame()
    }, this.speed)

    return this
  }

  /**
   * Pause animation
   */
  pause() {
    if (!this.isPlaying || this.isPaused) return this

    this.isPaused = true
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.emit('paused', { 
      currentIndex: this.currentIndex,
      currentTime: this.getCurrentTime()
    })

    return this
  }

  /**
   * Resume paused animation
   */
  resume() {
    if (!this.isPaused) return this

    this.isPaused = false
    this.intervalId = setInterval(() => {
      this.nextFrame()
    }, this.speed)

    this.emit('resumed', { 
      currentIndex: this.currentIndex,
      currentTime: this.getCurrentTime()
    })

    return this
  }

  /**
   * Stop animation and reset to beginning
   */
  stop() {
    this.isPlaying = false
    this.isPaused = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.currentIndex = 0
    this.direction = 1

    this.emit('stopped', { 
      currentIndex: this.currentIndex,
      currentTime: this.getCurrentTime()
    })

    return this
  }

  /**
   * Jump to specific frame
   * @param {number} index - Frame index to jump to
   */
  jumpToFrame(index) {
    if (index < 0 || index >= this.timelineData.length) return this

    this.currentIndex = index
    this.emitCurrentFrame()

    return this
  }

  /**
   * Jump to specific time value
   * @param {number|string} timeValue - Time value to jump to
   */
  jumpToTime(timeValue) {
    const frameIndex = this.timelineData.findIndex(frame => frame.time === timeValue)
    if (frameIndex !== -1) {
      this.jumpToFrame(frameIndex)
    }

    return this
  }

  /**
   * Move to next frame
   */
  nextFrame() {
    if (this.timelineData.length === 0) return this

    const nextIndex = this.currentIndex + this.direction

    // Handle end of timeline
    if (nextIndex >= this.timelineData.length) {
      if (this.options.loop) {
        if (this.options.autoReverse) {
          this.direction = -1
          this.currentIndex = this.timelineData.length - 2
        } else {
          this.currentIndex = 0
        }
      } else {
        this.stop()
        this.emit('animationComplete', { 
          direction: 'forward',
          finalIndex: this.timelineData.length - 1
        })
        return this
      }
    }
    // Handle beginning of timeline (reverse)
    else if (nextIndex < 0) {
      if (this.options.loop && this.options.autoReverse) {
        this.direction = 1
        this.currentIndex = 1
      } else {
        this.stop()
        this.emit('animationComplete', { 
          direction: 'reverse',
          finalIndex: 0
        })
        return this
      }
    } else {
      this.currentIndex = nextIndex
    }

    this.emitCurrentFrame()
    return this
  }

  /**
   * Move to previous frame
   */
  previousFrame() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.emitCurrentFrame()
    }

    return this
  }

  /**
   * Set animation speed
   * @param {number} speed - Speed in milliseconds per frame
   */
  setSpeed(speed) {
    this.speed = Math.max(
      this.options.minSpeed, 
      Math.min(this.options.maxSpeed, speed)
    )

    // Update interval if currently playing
    if (this.isPlaying && !this.isPaused && this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = setInterval(() => {
        this.nextFrame()
      }, this.speed)
    }

    this.emit('speedChanged', { speed: this.speed })
    return this
  }

  /**
   * Set animation direction
   * @param {number} direction - 1 for forward, -1 for reverse
   */
  setDirection(direction) {
    this.direction = direction === -1 ? -1 : 1
    this.emit('directionChanged', { direction: this.direction })
    return this
  }

  /**
   * Get current frame data
   * @returns {Object} Current frame data
   */
  getCurrentFrame() {
    return this.timelineData[this.currentIndex] || null
  }

  /**
   * Get current time value
   * @returns {number|string} Current time value
   */
  getCurrentTime() {
    const frame = this.getCurrentFrame()
    return frame ? frame.time : null
  }

  /**
   * Get current data for the frame
   * @returns {Array} Current frame's data
   */
  getCurrentData() {
    const frame = this.getCurrentFrame()
    return frame ? frame.data : []
  }

  /**
   * Get animation progress (0-1)
   * @returns {number} Progress percentage
   */
  getProgress() {
    if (this.timelineData.length === 0) return 0
    return this.currentIndex / (this.timelineData.length - 1)
  }

  /**
   * Get all available time values
   * @returns {Array} Array of time values
   */
  getTimeValues() {
    return this.timelineData.map(frame => frame.time)
  }

  /**
   * Generate trajectory data for a specific entity
   * @param {string} entityField - Field to group trajectories by (e.g., 'country')
   * @param {string} entityValue - Specific entity value to get trajectory for
   * @param {number} maxLength - Maximum trajectory length (0 = unlimited)
   * @returns {Array} Trajectory data points
   */
  getTrajectory(entityField, entityValue, maxLength = 0) {
    const trajectory = []
    
    // Get data up to current frame
    const endIndex = Math.min(this.currentIndex + 1, this.timelineData.length)
    const startIndex = maxLength > 0 ? Math.max(0, endIndex - maxLength) : 0

    for (let i = startIndex; i < endIndex; i++) {
      const frame = this.timelineData[i]
      const entityData = frame.data.find(d => d[entityField] === entityValue)
      
      if (entityData) {
        trajectory.push({
          ...entityData,
          frameIndex: i,
          time: frame.time
        })
      }
    }

    return trajectory
  }

  /**
   * Generate trajectories for all entities
   * @param {string} entityField - Field to group trajectories by
   * @param {number} maxLength - Maximum trajectory length per entity
   * @returns {Map} Map of entity -> trajectory data
   */
  getAllTrajectories(entityField, maxLength = 0) {
    const trajectories = new Map()
    
    // Get all unique entities
    const entities = new Set()
    this.timelineData.forEach(frame => {
      frame.data.forEach(d => {
        if (d[entityField]) {
          entities.add(d[entityField])
        }
      })
    })

    // Generate trajectory for each entity
    entities.forEach(entity => {
      const trajectory = this.getTrajectory(entityField, entity, maxLength)
      if (trajectory.length > 0) {
        trajectories.set(entity, trajectory)
      }
    })

    return trajectories
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
    return this
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
    return this
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data = {}) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in TimeSeriesAnimator event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Emit current frame data
   */
  emitCurrentFrame() {
    const frame = this.getCurrentFrame()
    if (frame) {
      this.emit('frameChanged', {
        index: this.currentIndex,
        time: frame.time,
        data: frame.data,
        progress: this.getProgress(),
        direction: this.direction
      })
    }
  }

  /**
   * Create interpolated frame between two time points
   * @param {number} fromIndex - Starting frame index
   * @param {number} toIndex - Ending frame index
   * @param {number} t - Interpolation factor (0-1)
   * @returns {Object} Interpolated frame data
   */
  interpolateFrame(fromIndex, toIndex, t) {
    if (fromIndex < 0 || toIndex >= this.timelineData.length) return null

    const fromFrame = this.timelineData[fromIndex]
    const toFrame = this.timelineData[toIndex]

    // Simple linear interpolation for numeric values
    const interpolatedData = []
    
    fromFrame.data.forEach(fromRecord => {
      const toRecord = toFrame.data.find(r => r.country === fromRecord.country)
      
      if (toRecord) {
        const interpolated = { ...fromRecord }
        
        // Interpolate numeric fields
        Object.keys(fromRecord).forEach(key => {
          if (typeof fromRecord[key] === 'number' && typeof toRecord[key] === 'number') {
            interpolated[key] = fromRecord[key] + (toRecord[key] - fromRecord[key]) * t
          }
        })
        
        interpolatedData.push(interpolated)
      }
    })

    return {
      time: fromFrame.time + (toFrame.time - fromFrame.time) * t,
      data: interpolatedData,
      index: fromIndex + (toIndex - fromIndex) * t,
      isInterpolated: true
    }
  }

  /**
   * Get animation state
   * @returns {Object} Current animation state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      currentTime: this.getCurrentTime(),
      direction: this.direction,
      speed: this.speed,
      progress: this.getProgress(),
      totalFrames: this.timelineData.length,
      hasData: this.timelineData.length > 0
    }
  }

  /**
   * Destroy animator and clean up resources
   */
  destroy() {
    this.stop()
    this.listeners.clear()
    this.timelineData = []
    this.currentIndex = 0
  }
}

// Export singleton instance and class
export const timeSeriesAnimator = new TimeSeriesAnimator()

// Export utility functions
export const createAnimator = (options) => new TimeSeriesAnimator(options)

export const animationPresets = {
  slow: { defaultSpeed: 2000, interpolation: 'ease' },
  normal: { defaultSpeed: 1000, interpolation: 'linear' },
  fast: { defaultSpeed: 500, interpolation: 'linear' },
  smooth: { defaultSpeed: 1500, interpolation: 'ease' },
  bounce: { defaultSpeed: 1200, interpolation: 'bounce' }
}