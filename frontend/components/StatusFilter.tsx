'use client';

import React from 'react';
import { AVAILABLE_STATUSES, STATUS_LABELS, BuildStatus } from '../lib/status-vocabulary';

/**
 * Props for StatusFilter component
 */
export interface StatusFilterProps {
  /** Currently selected statuses */
  selectedStatuses: BuildStatus[];
  /** Available statuses to select from (defaults to AVAILABLE_STATUSES) */
  availableStatuses?: BuildStatus[];
  /** Callback when a status is toggled */
  onToggle: (status: BuildStatus) => void;
  /** Whether the filter is disabled */
  disabled?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * StatusFilter Component - Multi-select status filter with pill UI
 *
 * Features:
 * - Renders pills for each available status, labelled via STATUS_LABELS
 * - Selected statuses highlighted with blue background (bg-blue-500)
 * - Unselected statuses shown as solid gray (bg-gray-200)
 * - Click to toggle selection
 * - Keyboard support: Enter to toggle, Tab navigation
 * - Accessibility: role="button", aria-pressed, aria-label
 * - Tailwind styling with hover effects and transitions
 * - Multi-select behavior (can select multiple statuses)
 *
 * @example
 * <StatusFilter
 *   selectedStatuses={[BuildStatus.Running, BuildStatus.Pending]}
 *   onToggle={(status) => dispatch({ type: 'TOGGLE_STATUS', payload: status })}
 *   disabled={false}
 * />
 */
export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatuses,
  availableStatuses = Array.from(AVAILABLE_STATUSES),
  onToggle,
  disabled = false,
  className = '',
  'data-testid': dataTestId = 'status-filter',
}) => {
  // Handle keyboard interaction (Enter to toggle, Space to toggle)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, status: BuildStatus) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle(status);
    }
  };

  const containerClasses = `flex flex-wrap gap-2 ${className}`;

  return (
    <div className={containerClasses} data-testid={dataTestId} role="group" aria-label="Status filter">
      {availableStatuses.map((status) => {
        const isSelected = selectedStatuses.includes(status);
        // Display copy comes from STATUS_LABELS; the data-testid below stays
        // keyed on the wire value so it survives copy changes.
        const label = STATUS_LABELS[status];

        // Selected: blue background, unselected: gray background
        const pillClasses = isSelected
          ? 'bg-blue-500 text-white border-blue-600'
          : 'bg-gray-200 text-gray-900 border-gray-300';

        return (
          <button
            key={status}
            type="button"
            onClick={() => !disabled && onToggle(status)}
            onKeyDown={(e) => !disabled && handleKeyDown(e, status)}
            disabled={disabled}
            className={`
              px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              hover:shadow-md active:shadow-none
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
              ${pillClasses}
            `}
            aria-pressed={isSelected}
            aria-label={`${label} status filter ${isSelected ? 'selected' : 'not selected'}`}
            data-testid={`status-filter-pill-${status.toLowerCase()}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

StatusFilter.displayName = 'StatusFilter';

export default StatusFilter;
