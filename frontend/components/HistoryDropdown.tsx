'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FilterHistoryItem, FilterHistoryState } from '../lib/hooks/useFilterHistory';
import { FilterState } from '../lib/hooks/useFilter';
import { STATUS_LABELS } from '../lib/status-vocabulary';

/**
 * Props for HistoryDropdown component
 */
export interface HistoryDropdownProps {
  /** History state containing items to display */
  history: FilterHistoryState;
  /** Callback when a history item is selected */
  onSelectHistory: (item: FilterHistoryItem) => void;
  /** Callback to remove a history item */
  onRemoveHistory: (id: string) => void;
  /** Callback to clear all history */
  onClearHistory: () => void;
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Callback to toggle dropdown open/close */
  onToggleOpen: (open: boolean) => void;
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Format timestamp to readable string
 *
 * @param timestamp Milliseconds since epoch
 * @returns Formatted date/time string
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();

  // Same day: show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // This week: show day and time
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // Older: show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Summarize filter state for display
 *
 * @param state Filter state to summarize
 * @returns Human-readable summary
 */
const summarizeFilters = (state: FilterState): string => {
  const parts: string[] = [];

  if (state.search) {
    parts.push(`"${state.search}"`);
  }

  if (state.statuses && state.statuses.length > 0) {
    // Display labels, not wire values: this string is read by a human.
    parts.push(`Status: ${state.statuses.map((s) => STATUS_LABELS[s]).join(', ')}`);
  }

  if (state.dateStart || state.dateEnd) {
    const dateStr = `${state.dateStart || '?'} to ${state.dateEnd || '?'}`;
    parts.push(`Dates: ${dateStr}`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'No filters';
};

/**
 * HistoryDropdown Component - Display and manage filter history
 *
 * Features:
 * - Shows most recent filter combinations (up to 20)
 * - Click to restore a filter combination
 * - Remove individual items
 * - Clear all history button
 * - Click-outside handling to close dropdown
 * - Keyboard support (Escape to close)
 * - Responsive dropdown positioning
 * - Accessible with aria-labels
 *
 * @example
 * <HistoryDropdown
 *   history={historyState}
 *   onSelectHistory={handleSelectHistory}
 *   onRemoveHistory={handleRemoveHistory}
 *   onClearHistory={handleClearHistory}
 *   isOpen={isOpen}
 *   onToggleOpen={setIsOpen}
 * />
 */
export const HistoryDropdown: React.FC<HistoryDropdownProps> = ({
  history,
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
  isOpen,
  onToggleOpen,
  className = '',
  'data-testid': dataTestId = 'history-dropdown',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggleOpen(false);
      }
    };

    // Handle Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggleOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onToggleOpen]);

  // Update visibility with a small delay for animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      return;
    }

    const timer = setTimeout(() => setIsVisible(false), 200);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const hasHistory = history.items.length > 0;

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
      data-testid={dataTestId}
    >
      {/* Dropdown Menu */}
      {isVisible && (
        <div
          className={`
            absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg
            shadow-lg z-50 max-h-96 overflow-y-auto
            transition-opacity duration-200
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          role="menu"
          aria-label="Filter history menu"
          data-testid={`${dataTestId}-menu`}
        >
          {/* Empty State */}
          {!hasHistory && (
            <div
              className="p-4 text-center text-gray-500 text-sm"
              data-testid={`${dataTestId}-empty`}
            >
              No filter history yet
            </div>
          )}

          {/* History Items */}
          {hasHistory && (
            <>
              <div className="border-b border-gray-200">
                {history.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`
                      px-4 py-3 cursor-pointer transition-colors
                      hover:bg-blue-50 active:bg-blue-100
                      ${index > 0 ? 'border-t border-gray-100' : ''}
                    `}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => {
                      onSelectHistory(item);
                      onToggleOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onSelectHistory(item);
                        onToggleOpen(false);
                      }
                    }}
                    data-testid={`${dataTestId}-item-${item.id}`}
                  >
                    {/* Label or summary */}
                    <div className="font-medium text-gray-900 text-sm mb-1">
                      {item.label || summarizeFilters(item.state)}
                    </div>

                    {/* Timestamp and remove button */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {formatTime(item.timestamp)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveHistory(item.id);
                        }}
                        className={`
                          text-gray-400 hover:text-red-600 transition-colors
                          focus:outline-none focus:ring-1 focus:ring-red-500 rounded px-1
                        `}
                        aria-label={`Remove history item ${item.label || formatTime(item.timestamp)}`}
                        data-testid={`${dataTestId}-remove-${item.id}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear All Button */}
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    onToggleOpen(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-sm font-medium text-red-600 bg-white
                    border border-red-300 rounded-md
                    hover:bg-red-50 active:bg-red-100
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                    transition-colors
                  `}
                  aria-label="Clear all filter history"
                  data-testid={`${dataTestId}-clear-all`}
                >
                  Clear History
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

HistoryDropdown.displayName = 'HistoryDropdown';

export default HistoryDropdown;
