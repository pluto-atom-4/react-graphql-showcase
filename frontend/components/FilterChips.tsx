'use client';

import React from 'react';

/**
 * Props for FilterChips component
 */
export interface FilterChipsProps {
  searchTerm: string;
  onRemove: () => void;
  maxLength?: number;
}

/**
 * FilterChips Component - Display and remove search filters as chips
 *
 * Features:
 * - Display search term as blue chip (if present)
 * - Remove button (×) to clear search
 * - Empty state (null if no search term)
 * - Tailwind styling with hover effects
 * - Accessibility: aria-label on remove button
 * - Micro-interactions: smooth transitions
 *
 * @example
 * <FilterChips
 *   searchTerm="important"
 *   onRemove={handleClear}
 *   maxLength={30}
 * />
 *
 * Returns null if no searchTerm provided.
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  searchTerm,
  onRemove,
  maxLength = 30,
}) => {
  // Return null if no search term
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
