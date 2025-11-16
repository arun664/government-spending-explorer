/**
 * ValidationUtils - Independent validation and error handling for comparison module
 * 
 * Provides comprehensive data validation, error handling, and data quality assessment
 * specific to the comparison module's requirements.
 * 
 * Requirements addressed:
 * - Data validation specific to comparison module
 * - Error handling and recovery mechanisms
 * - Data quality assessment and reporting
 */

export class ValidationUtils {
  constructor() {
    this.validationRules = {
      gdp: {
        required: ['countryName', 'countryCode', 'year', 'gdpGrowth'],
        ranges: {
          year: { min: 1960, max: new Date().getFullYear() + 1 },
          gdpGrowth: { min: -50, max: 50, extreme: 25 }
        }
      },
      spending: {
        required: ['countryName', 'countryCode', 'year', 'totalSpending'],
        ranges: {
          year: { min: 1960, max: new Date().getFullYear() + 1 },
          totalSpending: { min: 0, max: 100, extreme: 80 }
        }
      },
      merged: {
        required: ['countryName', 'year'],
        optional: ['gdpGrowth', 'totalSpending']
      }
    }

    this.errorTypes = {
      MISSING_REQUIRED_FIELD: 'missing_required_field',
      INVALID_DATA_TYPE: 'invalid_data_type',
      OUT_OF_RANGE: 'out_of_range',
      EXTREME_VALUE: 'extreme_value',
      DUPLICATE_RECORD: 'duplicate_record',
      INCONSISTENT_DATA: 'inconsistent_data',
      EMPTY_DATASET: 'empty_dataset'
    }

    this.severityLevels = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
      INFO: 'info'
    }
  }

  /**
   * Validate GDP data array
   * @param {Array} gdpData - GDP data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation results
   */
  validateGDPData(gdpData, options = {}) {
    const opts = {
      strictMode: false,
      allowMissingValues: true,
      checkDuplicates: true,
      ...options
    }

    if (!Array.isArray(gdpData)) {
      return this._createValidationResult(false, [{
        type: this.errorTypes.INVALID_DATA_TYPE,
        severity: this.severityLevels.CRITICAL,
        message: 'GDP data must be an array',
        field: 'gdpData'
      }])
    }

    if (gdpData.length === 0) {
      return this._createValidationResult(false, [{
        type: this.errorTypes.EMPTY_DATASET,
        severity: this.severityLevels.CRITICAL,
        message: 'GDP data array is empty',
        field: 'gdpData'
      }])
    }

    const errors = []
    const warnings = []
    const duplicateCheck = new Set()

    gdpData.forEach((record, index) => {
      const recordErrors = this._validateGDPRecord(record, index, opts)
      errors.push(...recordErrors.errors)
      warnings.push(...recordErrors.warnings)

      // Check for duplicates
      if (opts.checkDuplicates && record.countryName && record.year) {
        const key = `${record.countryName}_${record.year}`
        if (duplicateCheck.has(key)) {
          errors.push({
            type: this.errorTypes.DUPLICATE_RECORD,
            severity: this.severityLevels.HIGH,
            message: `Duplicate GDP record found for ${record.countryName} in ${record.year}`,
            field: 'countryName, year',
            index
          })
        } else {
          duplicateCheck.add(key)
        }
      }
    })

    const isValid = errors.filter(e => e.severity === this.severityLevels.CRITICAL).length === 0
    
    return this._createValidationResult(isValid, errors, warnings, {
      totalRecords: gdpData.length,
      validRecords: gdpData.length - errors.filter(e => e.severity === this.severityLevels.CRITICAL).length,
      duplicatesFound: gdpData.length - duplicateCheck.size
    })
  }

  /**
   * Validate spending data array
   * @param {Array} spendingData - Spending data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation results
   */
  validateSpendingData(spendingData, options = {}) {
    const opts = {
      strictMode: false,
      allowMissingValues: true,
      checkDuplicates: true,
      ...options
    }

    if (!Array.isArray(spendingData)) {
      return this._createValidationResult(false, [{
        type: this.errorTypes.INVALID_DATA_TYPE,
        severity: this.severityLevels.CRITICAL,
        message: 'Spending data must be an array',
        field: 'spendingData'
      }])
    }

    if (spendingData.length === 0) {
      return this._createValidationResult(false, [{
        type: this.errorTypes.EMPTY_DATASET,
        severity: this.severityLevels.CRITICAL,
        message: 'Spending data array is empty',
        field: 'spendingData'
      }])
    }

    const errors = []
    const warnings = []
    const duplicateCheck = new Set()

    spendingData.forEach((record, index) => {
      const recordErrors = this._validateSpendingRecord(record, index, opts)
      errors.push(...recordErrors.errors)
      warnings.push(...recordErrors.warnings)

      // Check for duplicates
      if (opts.checkDuplicates && record.countryName && record.year) {
        const key = `${record.countryName}_${record.year}`
        if (duplicateCheck.has(key)) {
          errors.push({
            type: this.errorTypes.DUPLICATE_RECORD,
            severity: this.severityLevels.HIGH,
            message: `Duplicate spending record found for ${record.countryName} in ${record.year}`,
            field: 'countryName, year',
            index
          })
        } else {
          duplicateCheck.add(key)
        }
      }
    })

    const isValid = errors.filter(e => e.severity === this.severityLevels.CRITICAL).length === 0
    
    return this._createValidationResult(isValid, errors, warnings, {
      totalRecords: spendingData.length,
      validRecords: spendingData.length - errors.filter(e => e.severity === this.severityLevels.CRITICAL).length,
      duplicatesFound: spendingData.length - duplicateCheck.size
    })
  }

  /**
   * Validate merged comparison data
   * @param {Array} mergedData - Merged data to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation results
   */
  validateMergedData(mergedData, options = {}) {
    const opts = {
      requireBothDatasets: false,
      checkConsistency: true,
      ...options
    }

    if (!Array.isArray(mergedData)) {
      return this._createValidationResult(false, [{
        type: this.errorTypes.INVALID_DATA_TYPE,
        severity: this.severityLevels.CRITICAL,
        message: 'Merged data must be an array',
        field: 'mergedData'
      }])
    }

    if (mergedData.length === 0) {
      return this._createValidationResult(false, [{
        type: this.errorTypes.EMPTY_DATASET,
        severity: this.severityLevels.CRITICAL,
        message: 'Merged data array is empty',
        field: 'mergedData'
      }])
    }

    const errors = []
    const warnings = []

    mergedData.forEach((record, index) => {
      const recordErrors = this._validateMergedRecord(record, index, opts)
      errors.push(...recordErrors.errors)
      warnings.push(...recordErrors.warnings)
    })

    // Check data consistency across records
    if (opts.checkConsistency) {
      const consistencyErrors = this._checkDataConsistency(mergedData)
      errors.push(...consistencyErrors.errors)
      warnings.push(...consistencyErrors.warnings)
    }

    const isValid = errors.filter(e => e.severity === this.severityLevels.CRITICAL).length === 0
    
    return this._createValidationResult(isValid, errors, warnings, {
      totalRecords: mergedData.length,
      recordsWithGDP: mergedData.filter(r => r.gdpGrowth !== null && r.gdpGrowth !== undefined).length,
      recordsWithSpending: mergedData.filter(r => r.totalSpending !== null && r.totalSpending !== undefined).length,
      recordsWithBoth: mergedData.filter(r => 
        r.gdpGrowth !== null && r.gdpGrowth !== undefined &&
        r.totalSpending !== null && r.totalSpending !== undefined
      ).length
    })
  }

  /**
   * Validate individual GDP record
   * @param {Object} record - GDP record to validate
   * @param {number} index - Record index
   * @param {Object} opts - Validation options
   * @returns {Object} Validation results for record
   */
  _validateGDPRecord(record, index, opts) {
    const errors = []
    const warnings = []
    const rules = this.validationRules.gdp

    // Check required fields
    rules.required.forEach(field => {
      if (record[field] === null || record[field] === undefined || record[field] === '') {
        const severity = opts.strictMode ? this.severityLevels.CRITICAL : this.severityLevels.HIGH
        errors.push({
          type: this.errorTypes.MISSING_REQUIRED_FIELD,
          severity,
          message: `Missing required field: ${field}`,
          field,
          index
        })
      }
    })

    // Validate data types and ranges
    if (record.year !== null && record.year !== undefined) {
      if (!Number.isInteger(record.year)) {
        errors.push({
          type: this.errorTypes.INVALID_DATA_TYPE,
          severity: this.severityLevels.HIGH,
          message: 'Year must be an integer',
          field: 'year',
          index,
          value: record.year
        })
      } else if (record.year < rules.ranges.year.min || record.year > rules.ranges.year.max) {
        warnings.push({
          type: this.errorTypes.OUT_OF_RANGE,
          severity: this.severityLevels.MEDIUM,
          message: `Year ${record.year} is outside expected range (${rules.ranges.year.min}-${rules.ranges.year.max})`,
          field: 'year',
          index,
          value: record.year
        })
      }
    }

    if (record.gdpGrowth !== null && record.gdpGrowth !== undefined) {
      if (typeof record.gdpGrowth !== 'number' || isNaN(record.gdpGrowth)) {
        errors.push({
          type: this.errorTypes.INVALID_DATA_TYPE,
          severity: this.severityLevels.HIGH,
          message: 'GDP growth must be a number',
          field: 'gdpGrowth',
          index,
          value: record.gdpGrowth
        })
      } else {
        if (record.gdpGrowth < rules.ranges.gdpGrowth.min || record.gdpGrowth > rules.ranges.gdpGrowth.max) {
          errors.push({
            type: this.errorTypes.OUT_OF_RANGE,
            severity: this.severityLevels.HIGH,
            message: `GDP growth ${record.gdpGrowth}% is outside valid range (${rules.ranges.gdpGrowth.min}% to ${rules.ranges.gdpGrowth.max}%)`,
            field: 'gdpGrowth',
            index,
            value: record.gdpGrowth
          })
        } else if (Math.abs(record.gdpGrowth) > rules.ranges.gdpGrowth.extreme) {
          warnings.push({
            type: this.errorTypes.EXTREME_VALUE,
            severity: this.severityLevels.MEDIUM,
            message: `GDP growth ${record.gdpGrowth}% is an extreme value`,
            field: 'gdpGrowth',
            index,
            value: record.gdpGrowth
          })
        }
      }
    }

    return { errors, warnings }
  }

  /**
   * Validate individual spending record
   * @param {Object} record - Spending record to validate
   * @param {number} index - Record index
   * @param {Object} opts - Validation options
   * @returns {Object} Validation results for record
   */
  _validateSpendingRecord(record, index, opts) {
    const errors = []
    const warnings = []
    const rules = this.validationRules.spending

    // Check required fields
    rules.required.forEach(field => {
      if (record[field] === null || record[field] === undefined || record[field] === '') {
        const severity = opts.strictMode ? this.severityLevels.CRITICAL : this.severityLevels.HIGH
        errors.push({
          type: this.errorTypes.MISSING_REQUIRED_FIELD,
          severity,
          message: `Missing required field: ${field}`,
          field,
          index
        })
      }
    })

    // Validate data types and ranges
    if (record.year !== null && record.year !== undefined) {
      if (!Number.isInteger(record.year)) {
        errors.push({
          type: this.errorTypes.INVALID_DATA_TYPE,
          severity: this.severityLevels.HIGH,
          message: 'Year must be an integer',
          field: 'year',
          index,
          value: record.year
        })
      } else if (record.year < rules.ranges.year.min || record.year > rules.ranges.year.max) {
        warnings.push({
          type: this.errorTypes.OUT_OF_RANGE,
          severity: this.severityLevels.MEDIUM,
          message: `Year ${record.year} is outside expected range (${rules.ranges.year.min}-${rules.ranges.year.max})`,
          field: 'year',
          index,
          value: record.year
        })
      }
    }

    if (record.totalSpending !== null && record.totalSpending !== undefined) {
      if (typeof record.totalSpending !== 'number' || isNaN(record.totalSpending)) {
        errors.push({
          type: this.errorTypes.INVALID_DATA_TYPE,
          severity: this.severityLevels.HIGH,
          message: 'Total spending must be a number',
          field: 'totalSpending',
          index,
          value: record.totalSpending
        })
      } else {
        if (record.totalSpending < rules.ranges.totalSpending.min) {
          errors.push({
            type: this.errorTypes.OUT_OF_RANGE,
            severity: this.severityLevels.HIGH,
            message: `Total spending ${record.totalSpending}% cannot be negative`,
            field: 'totalSpending',
            index,
            value: record.totalSpending
          })
        } else if (record.totalSpending > rules.ranges.totalSpending.max) {
          warnings.push({
            type: this.errorTypes.OUT_OF_RANGE,
            severity: this.severityLevels.MEDIUM,
            message: `Total spending ${record.totalSpending}% exceeds 100% of GDP`,
            field: 'totalSpending',
            index,
            value: record.totalSpending
          })
        } else if (record.totalSpending > rules.ranges.totalSpending.extreme) {
          warnings.push({
            type: this.errorTypes.EXTREME_VALUE,
            severity: this.severityLevels.MEDIUM,
            message: `Total spending ${record.totalSpending}% is unusually high`,
            field: 'totalSpending',
            index,
            value: record.totalSpending
          })
        }
      }
    }

    return { errors, warnings }
  }

  /**
   * Validate individual merged record
   * @param {Object} record - Merged record to validate
   * @param {number} index - Record index
   * @param {Object} opts - Validation options
   * @returns {Object} Validation results for record
   */
  _validateMergedRecord(record, index, opts) {
    const errors = []
    const warnings = []
    const rules = this.validationRules.merged

    // Check required fields
    rules.required.forEach(field => {
      if (record[field] === null || record[field] === undefined || record[field] === '') {
        errors.push({
          type: this.errorTypes.MISSING_REQUIRED_FIELD,
          severity: this.severityLevels.CRITICAL,
          message: `Missing required field: ${field}`,
          field,
          index
        })
      }
    })

    // Check if at least one data source is present
    if (opts.requireBothDatasets) {
      if ((record.gdpGrowth === null || record.gdpGrowth === undefined) ||
          (record.totalSpending === null || record.totalSpending === undefined)) {
        errors.push({
          type: this.errorTypes.MISSING_REQUIRED_FIELD,
          severity: this.severityLevels.HIGH,
          message: 'Both GDP and spending data required',
          field: 'gdpGrowth, totalSpending',
          index
        })
      }
    } else {
      if ((record.gdpGrowth === null || record.gdpGrowth === undefined) &&
          (record.totalSpending === null || record.totalSpending === undefined)) {
        warnings.push({
          type: this.errorTypes.MISSING_REQUIRED_FIELD,
          severity: this.severityLevels.MEDIUM,
          message: 'No GDP or spending data available',
          field: 'gdpGrowth, totalSpending',
          index
        })
      }
    }

    // Validate data quality flags if present
    if (record.dataQuality) {
      if (!record.dataQuality.hasGDP && !record.dataQuality.hasSpending) {
        warnings.push({
          type: this.errorTypes.INCONSISTENT_DATA,
          severity: this.severityLevels.MEDIUM,
          message: 'Data quality indicates no data sources available',
          field: 'dataQuality',
          index
        })
      }
    }

    return { errors, warnings }
  }

  /**
   * Check data consistency across records
   * @param {Array} mergedData - Merged data array
   * @returns {Object} Consistency check results
   */
  _checkDataConsistency(mergedData) {
    const errors = []
    const warnings = []

    // Check for countries with inconsistent data patterns
    const countryData = {}
    
    mergedData.forEach((record, index) => {
      if (!record.countryName) return
      
      if (!countryData[record.countryName]) {
        countryData[record.countryName] = {
          records: [],
          hasGDP: false,
          hasSpending: false,
          years: new Set()
        }
      }
      
      const countryInfo = countryData[record.countryName]
      countryInfo.records.push({ ...record, index })
      
      if (record.gdpGrowth !== null && record.gdpGrowth !== undefined) {
        countryInfo.hasGDP = true
      }
      
      if (record.totalSpending !== null && record.totalSpending !== undefined) {
        countryInfo.hasSpending = true
      }
      
      countryInfo.years.add(record.year)
    })

    // Check for countries with very few data points
    Object.entries(countryData).forEach(([countryName, info]) => {
      if (info.records.length < 3) {
        warnings.push({
          type: this.errorTypes.INCONSISTENT_DATA,
          severity: this.severityLevels.LOW,
          message: `Country ${countryName} has very few data points (${info.records.length})`,
          field: 'countryName',
          value: countryName
        })
      }

      // Check for large gaps in years
      const years = Array.from(info.years).sort((a, b) => a - b)
      for (let i = 1; i < years.length; i++) {
        if (years[i] - years[i-1] > 5) {
          warnings.push({
            type: this.errorTypes.INCONSISTENT_DATA,
            severity: this.severityLevels.LOW,
            message: `Country ${countryName} has a large gap in data between ${years[i-1]} and ${years[i]}`,
            field: 'year',
            value: countryName
          })
        }
      }
    })

    return { errors, warnings }
  }

  /**
   * Create standardized validation result object
   * @param {boolean} isValid - Whether validation passed
   * @param {Array} errors - Array of error objects
   * @param {Array} warnings - Array of warning objects
   * @param {Object} statistics - Additional statistics
   * @returns {Object} Validation result object
   */
  _createValidationResult(isValid, errors = [], warnings = [], statistics = {}) {
    return {
      isValid,
      errors,
      warnings,
      statistics: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        criticalErrors: errors.filter(e => e.severity === this.severityLevels.CRITICAL).length,
        highErrors: errors.filter(e => e.severity === this.severityLevels.HIGH).length,
        mediumWarnings: warnings.filter(w => w.severity === this.severityLevels.MEDIUM).length,
        lowWarnings: warnings.filter(w => w.severity === this.severityLevels.LOW).length,
        ...statistics
      },
      validatedAt: new Date().toISOString()
    }
  }

  /**
   * Generate validation summary report
   * @param {Object} validationResult - Validation result object
   * @returns {string} Human-readable validation summary
   */
  generateValidationSummary(validationResult) {
    const { isValid, errors, warnings, statistics } = validationResult
    
    let summary = `Validation ${isValid ? 'PASSED' : 'FAILED'}\n`
    summary += `Total Records: ${statistics.totalRecords || 'N/A'}\n`
    
    if (statistics.validRecords !== undefined) {
      summary += `Valid Records: ${statistics.validRecords}\n`
    }
    
    if (errors.length > 0) {
      summary += `\nErrors (${errors.length}):\n`
      errors.forEach(error => {
        summary += `  - ${error.severity.toUpperCase()}: ${error.message}\n`
      })
    }
    
    if (warnings.length > 0) {
      summary += `\nWarnings (${warnings.length}):\n`
      warnings.forEach(warning => {
        summary += `  - ${warning.severity.toUpperCase()}: ${warning.message}\n`
      })
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      summary += '\nNo issues found.\n'
    }
    
    return summary
  }

  /**
   * Filter out invalid records based on validation results
   * @param {Array} data - Original data array
   * @param {Object} validationResult - Validation result
   * @returns {Array} Filtered data array
   */
  filterValidRecords(data, validationResult) {
    const criticalErrorIndices = new Set(
      validationResult.errors
        .filter(e => e.severity === this.severityLevels.CRITICAL && e.index !== undefined)
        .map(e => e.index)
    )
    
    return data.filter((record, index) => !criticalErrorIndices.has(index))
  }

  /**
   * Get validation rules for a specific data type
   * @param {string} dataType - Type of data ('gdp', 'spending', 'merged')
   * @returns {Object} Validation rules
   */
  getValidationRules(dataType) {
    return this.validationRules[dataType] || {}
  }

  /**
   * Update validation rules
   * @param {string} dataType - Type of data
   * @param {Object} newRules - New validation rules
   */
  updateValidationRules(dataType, newRules) {
    if (this.validationRules[dataType]) {
      this.validationRules[dataType] = { ...this.validationRules[dataType], ...newRules }
    }
  }
}

// Export singleton instance
export const validationUtils = new ValidationUtils()