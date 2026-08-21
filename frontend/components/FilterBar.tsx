'use client';

import React, { useCallback } from 'react';
import { SearchBar } from './SearchBar';
import { StatusFilter } from './StatusFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { FilterState, BuildStatus } from '../lib/hooks/useFilter';
import { hasActiveFilters } from '../lib/utils/filterComposers';

/**
 * Props for FilterBar component
 */
export interface FilterBarProps {
  /** Current filter state */
  filters: FilterState;
  /** Callback to dispatch filter actions */
  onFilterChange: (action: any) => void;
  /** Optional placeholder for search bar */
  searchPlaceholder?: string;
  /** Whether filters are disabled */
  disabled?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * FilterBar Component - Orchestrator for all filter types (search + status + date)
 *
 * Layout:
 * - SearchBar (full width, top)
 * - StatusFilter (horizontal row)
 * - DateRangeFilter (horizontal row)
 * - Clear All button (if any filters active)
 *
 * Features:
 * - Composition of SearchBar, StatusFilter, DateRangeFilter
 * - Horizontal layout for status and date filters
 * - Clear All button visible when filters are active
 * - Full accessibility with aria-labels and semantic HTML
 * - Tailwind styling (blue border, white background, rounded)
 *
 * @example
 * <FilterBar
 *   filters={filterState}
 *   onFilterChange={dispatch}
 *   searchPlaceholder="Search builds..."
 * />
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  'data-testid': dataTestId = 'filter-bar',
}) => {
  // Handle search change
  const handleSearchChange = useCallback(
    (value: string) => {
      onFilterChange({ type: 'SET_SEARCH', payload: value });
    },
    [onFilterChange]
  );

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    onFilterChange({ type: 'CLEAR_SEARCH' });
  }, [onFilterChange]);

  // Handle status toggle
  const handleStatusToggle = useCallback(
    (status: BuildStatus) => {
      onFilterChange({ type: 'TOGGLE_STATUS', payload: status });
    },
    [onFilterChange]
  );

  // Handle date change
  const handleDateChange = useCallback(
    (startDate?: string, endDate?: string, _error?: string) => {
      onFilterChange({
        type: 'SET_DATE_RANGE',
        payload: { start: startDate, end: endDate },
      });
    },
    [onFilterChange]
  );

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    onFilterChange({ type: 'RESET_FILTERS' });
  }, [onFilterChange]);

  const hasFilters = hasActiveFilters(filters);

  const containerClasses = `
    flex flex-col gap-4 p-4 border border-blue-500 rounded-lg bg-white
    transition-all duration-200
    ${disabled ? 'opacity-50 pointer-events-none' : ''}
    ${className}
  `;

  return (
    <div
      className={containerClasses}
      data-testid={dataTestId}
      role="region"
      aria-label="Search and filter controls"
    >
      {/* Search Bar - Full Width */}
      <div className="w-full">
        <SearchBar
          value={filters.search}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder={searchPlaceholder}
          disabled={disabled}
          data-testid="filter-bar-search"
        />
      </div>

      {/* Status Filter - Horizontal Row */}
      <div className="w-full">
        <StatusFilter
          selectedStatuses={filters.statuses}
          onToggle={handleStatusToggle}
          disabled={disabled}
          data-testid="filter-bar-status"
        />
      </div>

      {/* Date Range Filter - Horizontal Layout */}
      <div className="w-full">
        <DateRangeFilter
          startDate={filters.dateStart}
          endDate={filters.dateEnd}
          onDateChange={handleDateChange}
          disabled={disabled}
          validateStrict={true}
          data-testid="filter-bar-dates"
        />
      </div>

      {/* Clear All Button - Visible when filters active */}
      {hasFilters && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className={`
              px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md
              transition-all duration-150
              hover:bg-red-600 active:bg-red-700
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="Clear all filters"
            data-testid="filter-bar-clear-all"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

FilterBar.displayName = 'FilterBar';

export default FilterBar;
