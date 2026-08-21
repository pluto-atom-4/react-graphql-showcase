/**
 * Filter composition logic - AND logic for combining multiple filter types
 *
 * All filters must match for an item to be included in results.
 */

import { FilterState } from '../hooks/useFilter';

export interface Filterable {
  id: string;
  name?: string;
  title?: string;
  status?: string;
  createdAt?: string | Date;
  [key: string]: unknown;
}

/**
 * Match search term against item properties
 *
 * Searches in: name, title, and any string property
 * Case-insensitive partial matching.
 *
 * @param item Item to match
 * @param searchTerm Search term (empty matches all)
 * @returns true if matches, false otherwise
 */
const matchesSearch = (item: Filterable, searchTerm: string): boolean => {
  if (!searchTerm) return true;

  const lowerSearch = searchTerm.toLowerCase();

  // Check name field
  if (item.name && String(item.name).toLowerCase().includes(lowerSearch)) {
    return true;
  }

  // Check title field
  if (item.title && String(item.title).toLowerCase().includes(lowerSearch)) {
    return true;
  }

  // Check all string properties
  for (const [, value] of Object.entries(item)) {
    if (typeof value === 'string' && value.toLowerCase().includes(lowerSearch)) {
      return true;
    }
  }

  return false;
};

/**
 * Match status filter against item status
 *
 * If no statuses selected, matches all items.
 * If statuses selected, item status must be in the selection.
 *
 * @param item Item to match
 * @param selectedStatuses Selected statuses to match against
 * @returns true if matches, false otherwise
 */
const matchesStatus = (item: Filterable, selectedStatuses: string[]): boolean => {
  if (selectedStatuses.length === 0) return true;

  const itemStatus = String(item.status || '');
  return selectedStatuses.includes(itemStatus);
};

/**
 * Match date range filter against item creation date
 *
 * Checks if item's createdAt falls within [dateStart, dateEnd] range.
 * If either date is missing, uses one-sided comparison.
 *
 * @param item Item to match
 * @param dateStart Start date in YYYY-MM-DD format (optional)
 * @param dateEnd End date in YYYY-MM-DD format (optional)
 * @returns true if matches, false otherwise
 */
const matchesDateRange = (
  item: Filterable,
  dateStart?: string,
  dateEnd?: string
): boolean => {
  if (!dateStart && !dateEnd) return true;

  const itemDate = item.createdAt ? String(item.createdAt).split('T')[0] : null;
  if (!itemDate) return true; // No date to compare, so match

  // Check start date (item.date >= start)
  if (dateStart && itemDate < dateStart) {
    return false;
  }

  // Check end date (item.date <= end)
  if (dateEnd && itemDate > dateEnd) {
    return false;
  }

  return true;
};

/**
 * Compose and apply all filters with AND logic
 *
 * All conditions must match:
 * - Search term matches (if provided)
 * - Status is in selection (if selected)
 * - Date is within range (if dates provided)
 *
 * Memoization hint: This function is pure and can be memoized.
 * Usage: const filtered = useMemo(() => applyFilters(items, filters), [items, filters])
 *
 * @param items Array of items to filter
 * @param filters Current filter state
 * @returns Filtered array of items
 *
 * @example
 * const filtered = applyFilters(builds, {
 *   search: 'important',
 *   statuses: ['Active', 'Idle'],
 *   dateStart: '2026-01-01',
 *   dateEnd: '2026-12-31',
 * });
 */
export const applyFilters = <T extends Filterable>(
  items: T[],
  filters: FilterState
): T[] => {
  return items.filter((item) => {
    // AND logic: all conditions must be true
    return (
      matchesSearch(item, filters.search) &&
      matchesStatus(item, filters.statuses) &&
      matchesDateRange(item, filters.dateStart, filters.dateEnd)
    );
  });
};

/**
 * Create a memoizable filter composer for a specific filter state
 *
 * Returns a function that filters items using the given filter state.
 * Useful for creating memoizable functions with dependencies.
 *
 * @param filters Filter state to compose
 * @returns Function that filters items
 *
 * @example
 * const composer = createFilterComposer(filters);
 * const filtered = useMemo(() => composer(items), [items, filters]);
 */
export const createFilterComposer = (filters: FilterState) => {
  return <T extends Filterable>(items: T[]): T[] => {
    return applyFilters(items, filters);
  };
};

/**
 * Check if any filters are currently active
 *
 * @param filters Filter state
 * @returns true if any filter is active, false otherwise
 */
export const hasActiveFilters = (filters: FilterState): boolean => {
  return (
    !!filters.search ||
    filters.statuses.length > 0 ||
    !!filters.dateStart ||
    !!filters.dateEnd
  );
};

/**
 * Get count of active filters
 *
 * Useful for UI indicators like "Clear All (3 filters)"
 *
 * @param filters Filter state
 * @returns Number of active filters
 */
export const countActiveFilters = (filters: FilterState): number => {
  let count = 0;
  if (filters.search) count++;
  count += filters.statuses.length;
  if (filters.dateStart) count++;
  if (filters.dateEnd) count++;
  return count;
};
