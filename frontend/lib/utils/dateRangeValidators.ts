/**
 * Date range validation utilities
 *
 * Provides functions for validating date ranges in filters.
 * All dates should be in YYYY-MM-DD format.
 */

export interface DateValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a date string is in YYYY-MM-DD format
 *
 * @param date Date string to validate
 * @returns true if valid format, false otherwise
 */
export const isValidDateFormat = (date: string): boolean => {
  if (typeof date !== 'string') return false;
  if (!date) return false;

  // Check format: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  // Parse date components
  const [yearStr, monthStr, dayStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Check month range
  if (month < 1 || month > 12) return false;

  // Check day range based on month and year
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Adjust for leap years
  if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
    daysInMonth[1] = 29;
  }

  if (day < 1 || day > daysInMonth[month - 1]) {
    return false;
  }

  // Also validate with Date constructor
  const parsedDate = new Date(date);
  return !Number.isNaN(parsedDate.getTime());
};

/**
 * Validate a date range (end >= start)
 *
 * Returns object with validation result and optional error message.
 * Handles edge cases: null, undefined, empty strings.
 *
 * @param startDate Start date in YYYY-MM-DD format (optional)
 * @param endDate End date in YYYY-MM-DD format (optional)
 * @returns {valid: boolean, error?: string}
 *
 * @example
 * validateDateRange('2026-01-01', '2026-12-31') // { valid: true }
 * validateDateRange('2026-12-31', '2026-01-01') // { valid: false, error: "..." }
 * validateDateRange('', '2026-12-31') // { valid: true } (empty start OK)
 * validateDateRange('2026-01-01', '') // { valid: true } (empty end OK)
 * validateDateRange('', '') // { valid: true } (both empty OK)
 */
export const validateDateRange = (
  startDate?: string | null,
  endDate?: string | null
): DateValidationResult => {
  // Both missing or empty: valid
  if (!startDate && !endDate) {
    return { valid: true };
  }

  // Only start date provided: valid if format is correct
  if (startDate && !endDate) {
    if (!isValidDateFormat(startDate)) {
      return {
        valid: false,
        error: 'Start date must be in YYYY-MM-DD format',
      };
    }
    return { valid: true };
  }

  // Only end date provided: valid if format is correct
  if (!startDate && endDate) {
    if (!isValidDateFormat(endDate)) {
      return {
        valid: false,
        error: 'End date must be in YYYY-MM-DD format',
      };
    }
    return { valid: true };
  }

  // Both provided: check format and range
  if (startDate && endDate) {
    if (!isValidDateFormat(startDate)) {
      return {
        valid: false,
        error: 'Start date must be in YYYY-MM-DD format',
      };
    }

    if (!isValidDateFormat(endDate)) {
      return {
        valid: false,
        error: 'End date must be in YYYY-MM-DD format',
      };
    }

    // Check that end >= start
    if (endDate < startDate) {
      return {
        valid: false,
        error: 'End date must be greater than or equal to start date',
      };
    }

    return { valid: true };
  }

  return { valid: true };
};

/**
 * Parse and normalize dates for comparison
 *
 * @param date Date string in YYYY-MM-DD format
 * @returns Date object for comparison, or null if invalid
 */
export const parseDateString = (date: string | null | undefined): Date | null => {
  if (!date) return null;
  if (!isValidDateFormat(date)) return null;

  // Parse YYYY-MM-DD string as UTC date
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

/**
 * Format Date object to YYYY-MM-DD string
 *
 * @param date Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateString = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
