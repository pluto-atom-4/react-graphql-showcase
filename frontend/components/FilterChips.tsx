'use client';

import React from 'react';
import type { FilterState, FilterAction } from '../lib/hooks/useFilter';
import { STATUS_LABELS, type BuildStatus } from '../lib/status-vocabulary';

/**
 * Props for FilterChips component
 */
export interface FilterChipsProps {
  searchTerm?: string;
  onRemove?: () => void;
  maxLength?: number;
  filters?: FilterState;
  onRemoveFilter?: (action: FilterAction) => void;
}

/**
 * FilterChips Component - Display and remove search filters as chips
 *
 * Features:
 * - Legacy mode: Display search term as single chip
 * - Multi-dimension mode: Display search term, statuses, and date range as chips
 * - Remove button (×) on each chip to remove that filter
 * - Empty state (null if no active filters)
 * - Tailwind styling with hover effects
 * - Accessibility: aria-label on remove button
 * - Micro-interactions: smooth transitions
 *
 * @example
 * // Legacy single search term mode
 * <FilterChips
 *   searchTerm="important"
 *   onRemove={handleClear}
 *   maxLength={30}
 * />
 *
 * // Multi-filter mode
 * <FilterChips
 *   filters={{ search: 'query', statuses: [BuildStatus.Running], dateStart: '2026-01-01' }}
 *   onRemoveFilter={handleDispatch}
 * />
 *
 * Returns null if no filters are active.
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  searchTerm,
  onRemove,
  maxLength = 30,
  filters,
  onRemoveFilter,
}) => {
  // Multi-filter mode: render all active filters
  if (filters && onRemoveFilter) {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    // Add search term chip
    if (filters.search) {
      const displayTerm = filters.search.length > maxLength
        ? `${filters.search.slice(0, maxLength)}...`
        : filters.search;
      chips.push({
        id: 'search',
        label: displayTerm,
        onRemove: () => onRemoveFilter({ type: 'CLEAR_SEARCH' }),
      });
    }

    // Add status chips
    if (filters.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach((status: BuildStatus) => {
        chips.push({
          // id (and therefore data-testid) stays keyed on the wire value;
          // only the visible label comes from STATUS_LABELS.
          id: `status-${status}`,
          label: STATUS_LABELS[status],
          onRemove: () => onRemoveFilter({ type: 'REMOVE_STATUS', payload: status }),
        });
      });
    }

    // Add date start chip
    if (filters.dateStart) {
      chips.push({
        id: 'dateStart',
        label: `From ${filters.dateStart}`,
        onRemove: () => onRemoveFilter({
          type: 'SET_DATE_RANGE',
          payload: { start: undefined, end: filters.dateEnd },
        }),
      });
    }

    // Add date end chip
    if (filters.dateEnd) {
      chips.push({
        id: 'dateEnd',
        label: `Until ${filters.dateEnd}`,
        onRemove: () => onRemoveFilter({
          type: 'SET_DATE_RANGE',
          payload: { start: filters.dateStart, end: undefined },
        }),
      });
    }

    // Always render container in multi-filter mode (empty when no chips)
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="filter-chips">
        {chips.map((chip) => (
          <div
            key={chip.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-900 rounded-full text-sm font-medium border border-blue-200 transition-all duration-150 hover:bg-blue-50"
            data-testid={`filter-chip-${chip.id}`}
            title={chip.label}
          >
            <span className="truncate">{chip.label}</span>
            <button
              type="button"
              onClick={chip.onRemove}
              className="ml-1 flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-800 focus:outline-none rounded transition-colors duration-150 hover:bg-blue-200"
              aria-label={`Remove filter: ${chip.label}`}
              title="Remove filter"
              data-testid={`filter-chip-remove-${chip.id}`}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Legacy mode: single search term only
  if (!searchTerm) {
    return null;
  }

  // Truncate long search terms
  const displayTerm = searchTerm.length > maxLength
    ? `${searchTerm.slice(0, maxLength)}...`
    : searchTerm;

  return (
    <div className="flex items-center gap-2" data-testid="filter-chips">
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-900 rounded-full text-sm font-medium border border-blue-200 transition-all duration-150 hover:bg-blue-50"
        data-testid="filter-chip"
        title={searchTerm}
      >
        <span className="truncate">{displayTerm}</span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-800 focus:outline-none rounded transition-colors duration-150 hover:bg-blue-200"
          aria-label={`Remove filter: ${searchTerm}`}
          title="Remove filter"
          data-testid="filter-chip-remove"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
};

FilterChips.displayName = 'FilterChips';

export default FilterChips;
