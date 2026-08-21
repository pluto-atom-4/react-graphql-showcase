import { describe, it, expect } from 'vitest';
import {
  validateDateRange,
  isValidDateFormat,
  parseDateString,
  formatDateString,
} from '../dateRangeValidators';

describe('Date Range Validators', () => {
  describe('isValidDateFormat', () => {
    it('should accept valid YYYY-MM-DD dates', () => {
      expect(isValidDateFormat('2026-01-01')).toBe(true);
      expect(isValidDateFormat('2026-12-31')).toBe(true);
      expect(isValidDateFormat('2024-02-29')).toBe(true); // Leap year
    });

    it('should reject invalid formats', () => {
      expect(isValidDateFormat('2026-1-1')).toBe(false); // Missing padding
      expect(isValidDateFormat('01-01-2026')).toBe(false); // Wrong order
      expect(isValidDateFormat('2026/01/01')).toBe(false); // Wrong separator
      expect(isValidDateFormat('2026-13-01')).toBe(false); // Invalid month
      expect(isValidDateFormat('2026-02-30')).toBe(false); // Invalid day
    });

    it('should reject empty/null values', () => {
      expect(isValidDateFormat('')).toBe(false);
      expect(isValidDateFormat(null as unknown as string)).toBe(false);
      expect(isValidDateFormat(undefined as unknown as string)).toBe(false);
    });

    it('should reject non-string types', () => {
      expect(isValidDateFormat(12345 as unknown as string)).toBe(false);
      expect(isValidDateFormat({} as unknown as string)).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('should return valid for both dates empty', () => {
      const result = validateDateRange('', '');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for null dates', () => {
      const result = validateDateRange(null, null);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for undefined dates', () => {
      const result = validateDateRange(undefined, undefined);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept start date only', () => {
      const result = validateDateRange('2026-01-01', '');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept end date only', () => {
      const result = validateDateRange('', '2026-12-31');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid range where end >= start', () => {
      const result = validateDateRange('2026-01-01', '2026-12-31');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept equal start and end dates', () => {
      const result = validateDateRange('2026-06-15', '2026-06-15');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject range where end < start', () => {
      const result = validateDateRange('2026-12-31', '2026-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('End date must be greater than or equal to start date');
    });

    it('should reject invalid start date format', () => {
      const result = validateDateRange('01-01-2026', '2026-12-31');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Start date must be in YYYY-MM-DD format');
    });

    it('should reject invalid end date format', () => {
      const result = validateDateRange('2026-01-01', '12/31/2026');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('End date must be in YYYY-MM-DD format');
    });

    it('should reject both dates invalid format', () => {
      const result = validateDateRange('01/01/2026', '12/31/2026');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Start date must be in YYYY-MM-DD format');
    });

    it('should prioritize format errors over range errors', () => {
      // Invalid format takes precedence over range check
      const result = validateDateRange('2026-13-01', '2026-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Start date must be in YYYY-MM-DD format');
    });
  });

  describe('parseDateString', () => {
    it('should parse valid date strings', () => {
      const date = parseDateString('2026-06-15');
      expect(date).not.toBeNull();
      expect(date?.getUTCFullYear()).toBe(2026);
      expect(date?.getUTCMonth()).toBe(5); // 0-indexed
      expect(date?.getUTCDate()).toBe(15);
    });

    it('should return null for invalid dates', () => {
      expect(parseDateString('2026-13-01')).toBeNull();
      expect(parseDateString('invalid')).toBeNull();
    });

    it('should return null for empty/null values', () => {
      expect(parseDateString('')).toBeNull();
      expect(parseDateString(null)).toBeNull();
      expect(parseDateString(undefined)).toBeNull();
    });

    it('should handle leap year dates', () => {
      const date = parseDateString('2024-02-29');
      expect(date).not.toBeNull();
      expect(date?.getUTCDate()).toBe(29);
    });
  });

  describe('formatDateString', () => {
    it('should format Date to YYYY-MM-DD', () => {
      const date = new Date(Date.UTC(2026, 5, 15)); // June 15, 2026
      expect(formatDateString(date)).toBe('2026-06-15');
    });

    it('should pad month and day with zeros', () => {
      const date = new Date(Date.UTC(2026, 0, 1)); // January 1, 2026
      expect(formatDateString(date)).toBe('2026-01-01');

      const date2 = new Date(Date.UTC(2026, 8, 9)); // September 9, 2026
      expect(formatDateString(date2)).toBe('2026-09-09');
    });

    it('should handle leap year dates', () => {
      const date = new Date(Date.UTC(2024, 1, 29)); // February 29, 2024
      expect(formatDateString(date)).toBe('2024-02-29');
    });
  });

  describe('Round-trip parsing and formatting', () => {
    it('should preserve dates through parse and format cycle', () => {
      const original = '2026-06-15';
      const parsed = parseDateString(original);
      const formatted = formatDateString(parsed!);
      expect(formatted).toBe(original);
    });

    it('should handle multiple round trips', () => {
      let date = '2026-12-31';
      for (let i = 0; i < 5; i++) {
        const parsed = parseDateString(date);
        date = formatDateString(parsed!);
      }
      expect(date).toBe('2026-12-31');
    });
  });
});
