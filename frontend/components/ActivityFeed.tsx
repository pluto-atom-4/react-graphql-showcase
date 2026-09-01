'use client';

import type { ReactElement } from 'react';
import { useState, useMemo } from 'react';
import type { BuildEvent, BuildEventType } from '../lib/types/activity-types';
import { TimelineEvent } from './TimelineEvent';
import { filterEventsByType, filterEventsByDateRange, sortEventsByDate } from '../lib/status-utils';

/**
 * Props for ActivityFeed component
 */
export interface ActivityFeedProps {
  /** Build ID for reference */
  buildId: string;
  /** Array of events to display */
  events: BuildEvent[];
  /** Available event types for filtering */
  eventTypes?: BuildEventType[];
  /** Loading state */
  isLoading?: boolean;
  /** Number of items per page */
  pageSize?: number;
  /** Optional callback when an event is clicked */
  onEventClick?: (event: BuildEvent) => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * ActivityFeed Component
 *
 * Displays chronological list of build events with pagination and filtering.
 * Shows status changes, test runs, manual updates, and system events.
 *
 * Features:
 * - Chronological event listing (newest first)
 * - Event type filtering
 * - Date range filtering
 * - Pagination (load more)
 * - Expandable event details
 * - Loading skeleton state
 * - Empty state
 * - Responsive design
 * - Accessibility (semantic HTML, ARIA labels)
 *
 * @example
 * <ActivityFeed
 *   buildId="build-123"
 *   events={events}
 *   eventTypes={['status_change', 'test_run']}
 *   pageSize={20}
 * />
 */
export function ActivityFeed({
  buildId,
  events,
  eventTypes = ['status_change', 'test_run', 'manual_update', 'system_event'],
  isLoading = false,
  pageSize = 20,
  onEventClick,
  className = '',
}: ActivityFeedProps): ReactElement {
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<BuildEventType>>(
    new Set(eventTypes),
  );
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(pageSize);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let typeFiltered = filterEventsByType(
      events,
      Array.from(selectedEventTypes),
    );
    // Apply date range filter if dates are set
    if (dateRange.start || dateRange.end) {
      typeFiltered = filterEventsByDateRange(
        typeFiltered,
        dateRange.start,
        dateRange.end,
      );
    }
    return sortEventsByDate(typeFiltered, false); // Newest first
  }, [events, selectedEventTypes, dateRange]);

  // Paginated events
  const paginatedEvents = filteredEvents.slice(0, displayedCount);
  const hasMore = paginatedEvents.length < filteredEvents.length;

  const handleToggleEventType = (eventType: BuildEventType): void => {
    const newTypes = new Set(selectedEventTypes);
    if (newTypes.has(eventType)) {
      newTypes.delete(eventType);
    } else {
      newTypes.add(eventType);
    }
    setSelectedEventTypes(newTypes);
    setDisplayedCount(pageSize); // Reset pagination on filter change
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null): void => {
    setDateRange({ start, end });
    setDisplayedCount(pageSize); // Reset pagination on filter change
  };

  const handleLoadMore = (): void => {
    setDisplayedCount((prev) => prev + pageSize);
  };

  const handleExpandEvent = (eventId: string, expanded: boolean): void => {
    setExpandedEventId(expanded ? eventId : null);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} role="status" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className={`text-center py-12 text-gray-500 ${className}`}>
        <p className="text-sm font-medium">No activity yet</p>
        <p className="text-xs text-gray-400 mt-1">Events will appear here as they occur</p>
      </div>
    );
  }

  // Empty after filter
  if (filteredEvents.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Filter section */}
        <EventTypeFilterBar
          eventTypes={eventTypes}
          selectedEventTypes={selectedEventTypes}
          onToggleEventType={handleToggleEventType}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Empty state */}
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm font-medium">No events match the selected filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter section */}
      <EventTypeFilterBar
        eventTypes={eventTypes}
        selectedEventTypes={selectedEventTypes}
        onToggleEventType={handleToggleEventType}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Event list */}
      <div
        role="feed"
        aria-label={`Activity feed for build ${buildId}`}
        className="space-y-0 border-l-2 border-gray-200 pl-0"
      >
        <ul role="list" className="list-none">
          {paginatedEvents.map((event, index) => (
            <li
              key={event.id}
              onClick={() => onEventClick?.(event)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onEventClick?.(event);
                }
              }}
              role="none"
            >
              <TimelineEvent
                event={event}
                expanded={expandedEventId === event.id}
                onExpand={handleExpandEvent}
                index={index}
                totalEvents={paginatedEvents.length}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Load more ({filteredEvents.length - displayedCount} remaining)
          </button>
        </div>
      )}

      {/* Results summary */}
      <div className="text-center text-xs text-gray-500 pt-2">
        <p>
          Showing {paginatedEvents.length} of {filteredEvents.length} events
        </p>
      </div>
    </div>
  );
}

/**
 * Event type filter bar component
 */
interface EventTypeFilterBarProps {
  eventTypes: BuildEventType[];
  selectedEventTypes: Set<BuildEventType>;
  onToggleEventType: (eventType: BuildEventType) => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

function EventTypeFilterBar({
  eventTypes,
  selectedEventTypes,
  onToggleEventType,
  dateRange,
  onDateRangeChange,
}: EventTypeFilterBarProps): ReactElement {
  const eventTypeLabels: Record<BuildEventType, string> = {
    status_change: 'Status Changes',
    test_run: 'Test Runs',
    manual_update: 'Manual Updates',
    system_event: 'System Events',
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newStart = e.target.value ? new Date(e.target.value) : null;
    onDateRangeChange(newStart, dateRange.end);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newEnd = e.target.value ? new Date(e.target.value) : null;
    onDateRangeChange(dateRange.start, newEnd);
  };

  const handleClearDates = (): void => {
    onDateRangeChange(null, null);
  };

  return (
    <div className="space-y-3">
      {/* Event type filters */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter events by type">
        {eventTypes.map((eventType) => (
          <button
            key={eventType}
            type="button"
            onClick={() => onToggleEventType(eventType)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${
                selectedEventTypes.has(eventType)
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            aria-pressed={selectedEventTypes.has(eventType)}
          >
            {eventTypeLabels[eventType]}
          </button>
        ))}
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label htmlFor="date-start" className="block text-xs font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            id="date-start"
            type="date"
            value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
            onChange={handleStartDateChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="date-end" className="block text-xs font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            id="date-end"
            type="date"
            value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
            onChange={handleEndDateChange}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(dateRange.start || dateRange.end) && (
          <button
            type="button"
            onClick={handleClearDates}
            className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Clear date filters"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
