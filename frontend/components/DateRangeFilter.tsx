'use client';

import React, { useCallback, useMemo } from 'react';
import { validateDateRange, DateValidationResult } from '../lib/utils/dateRangeValidators';

/**
 * Props for DateRangeFilter component
 */
export interface DateRangeFilterProps {
  /** Start date in YYYY-MM-DD format */
  startDate?: string;
  /** End date in YYYY-MM-DD format */
  endDate?: string;
  /** Callback when dates change */
  onDateChange: (startDate?: string, endDate?: string, error?: string) => void;
  /** Whether the filter is disabled */
  disabled?: boolean;
  /** Whether to validate strictly (end >= start) */
  validateStrict?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * DateRangeFilter Component - Date range picker with HTML5 date inputs
 *
 * Features:
 * - Two HTML5 date input fields (From and To)
 * - Strict validation: end date >= start date
 * - Inline error message display
 * - Keyboard support: Tab navigation between inputs
 * - Accessibility: aria-labels, aria-describedby, aria-invalid
 * - Tailwind styling (gray borders, blue focus)
 * - Micro-interactions: smooth transitions
 * - Returns {valid, error} validation object to component
 *
 * @example
 * <DateRangeFilter
 *   startDate="2026-01-01"
 *   endDate="2026-12-31"
 *   onDateChange={(start, end, error) => handleDateChange(start, end, error)}
 *   validateStrict={true}
 * />
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onDateChange,
  disabled = false,
  validateStrict = true,
  className = '',
  'data-testid': dataTestId = 'date-range-filter',
}) => {
  // Validate current date range
  const validation = useMemo<DateValidationResult>(() => {
    if (!validateStrict) {
      return { valid: true };
    }
    return validateDateRange(startDate, endDate);
  }, [startDate, endDate, validateStrict]);

  // Handle start date change
  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const newStartDate = e.target.value || undefined;
      onDateChange(newStartDate, endDate);
    },
    [endDate, onDateChange, disabled]
  );

  // Handle end date change
  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const newEndDate = e.target.value || undefined;
      onDateChange(startDate, newEndDate, validation.error);
    },
    [startDate, onDateChange, validation.error, disabled]
  );

  const containerClasses = `
    flex flex-col gap-3 p-4 border border-gray-300 rounded-lg bg-white
    transition-all duration-200
    ${validation.valid ? 'border-gray-300' : 'border-red-400'}
    ${disabled ? 'bg-gray-100 opacity-50' : 'bg-white'}
    ${className}
  `;

  const labelClasses = 'text-sm font-medium text-gray-700';

  const inputContainerClasses = 'flex flex-col gap-2';

  const inputClasses = `
    w-full px-3 py-2 border border-gray-300 rounded-md
    bg-white text-gray-900 text-sm
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    ${!validation.valid ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''}
  `;

  const errorClasses = 'text-sm text-red-600 mt-1';

  return (
    <div
      className={containerClasses}
      data-testid={dataTestId}
      role="group"
      aria-label="Date range filter"
      aria-describedby={!validation.valid ? 'date-error' : undefined}
    >
      {/* Start Date Input */}
      <div className={inputContainerClasses}>
        <label htmlFor="date-start" className={labelClasses}>
          From
        </label>
        <input
          id="date-start"
          type="date"
          value={startDate || ''}
          onChange={handleStartDateChange}
          onBlur={() => {
            // Trigger validation on blur
            if (validateStrict && !validation.valid) {
              onDateChange(startDate, endDate, validation.error);
            }
          }}
          disabled={disabled}
          className={inputClasses}
          aria-label="Start date"
          aria-describedby={!validation.valid ? 'date-error' : undefined}
          aria-invalid={!validation.valid}
          data-testid="date-range-filter-start"
        />
      </div>

      {/* End Date Input */}
      <div className={inputContainerClasses}>
        <label htmlFor="date-end" className={labelClasses}>
          To
        </label>
        <input
          id="date-end"
          type="date"
          value={endDate || ''}
          onChange={handleEndDateChange}
          onBlur={() => {
            // Trigger validation on blur
            if (validateStrict && !validation.valid) {
              onDateChange(startDate, endDate, validation.error);
            }
          }}
          disabled={disabled}
          className={inputClasses}
          aria-label="End date"
          aria-describedby={!validation.valid ? 'date-error' : undefined}
          aria-invalid={!validation.valid}
          data-testid="date-range-filter-end"
        />
      </div>

      {/* Error Message */}
      {!validation.valid && (
        <div id="date-error" className={errorClasses} role="alert">
          {validation.error}
        </div>
      )}
    </div>
  );
};

DateRangeFilter.displayName = 'DateRangeFilter';

export default DateRangeFilter;
