/**
 * Status utility functions for Issue #259 implementation
 * Provides helper functions for status transitions, color mapping, and event filtering
 */

import type { BuildStatus } from './generated/graphql';
import { STATUS_LABELS } from './status-vocabulary';

/**
 * Status display labels.
 *
 * Re-exported from `./status-vocabulary`, the canonical source of truth. This
 * module does not own the copy — see
 * `.claude/patterns/search-filter-patterns.md` ("Single source of truth for status").
 */
export { STATUS_LABELS };

/**
 * Status color mapping (Tailwind classes)
 */
export const STATUS_COLORS: Record<BuildStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  COMPLETE: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

/**
 * Status node colors (for progression visualization)
 */
export const STATUS_NODE_COLORS: Record<BuildStatus, string> = {
  PENDING: 'bg-yellow-500',
  RUNNING: 'bg-blue-500',
  COMPLETE: 'bg-green-500',
  FAILED: 'bg-red-500',
};

/**
 * Convert status to human-readable transition description
 * @example formatStatusTransition('PENDING', 'RUNNING') => 'Started running'
 */
export function formatStatusTransition(
  from: BuildStatus | undefined,
  to: BuildStatus,
): string {
  if (!from) {
    return `Moved to ${STATUS_LABELS[to]}`;
  }

  if (from === to) {
    return `Remained in ${STATUS_LABELS[to]}`;
  }

  const transitions: Record<string, string> = {
    'PENDING:RUNNING': 'Started running',
    'PENDING:COMPLETE': 'Completed',
    'PENDING:FAILED': 'Failed',
    'RUNNING:COMPLETE': 'Completed successfully',
    'RUNNING:FAILED': 'Failed during execution',
    'COMPLETE:PENDING': 'Returned to pending',
    'COMPLETE:RUNNING': 'Resumed',
    'FAILED:PENDING': 'Reset to pending',
    'FAILED:RUNNING': 'Retried',
  };

  const key = `${from}:${to}`;
  return transitions[key] || `Changed from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}`;
}

/**
 * Get color class for status
 */
export function getStatusColor(status: BuildStatus): string {
  return STATUS_COLORS[status];
}

/**
 * Get node color for progression visualization
 */
export function getStatusNodeColor(status: BuildStatus): string {
  return STATUS_NODE_COLORS[status];
}

/**
 * Calculate time spent in a status
 */
export function calculateStatusDuration(
  currentTimestamp: Date,
  nextTimestamp: Date | undefined,
): number {
  if (!nextTimestamp) {
    return Date.now() - currentTimestamp.getTime();
  }
  return nextTimestamp.getTime() - currentTimestamp.getTime();
}

/**
 * Format duration in milliseconds to human-readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  // Fallback to absolute date for older events
  return date.toLocaleDateString();
}

/**
 * Group events by date
 */
export function groupEventsByDate(
  events: Array<{ timestamp: Date; [key: string]: unknown }>,
): Map<string, Array<{ timestamp: Date; [key: string]: unknown }>> {
  const grouped = new Map<string, Array<{ timestamp: Date; [key: string]: unknown }>>();

  events.forEach((event) => {
    const date = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  });

  return grouped;
}

/**
 * Filter events by type
 */
export function filterEventsByType<T extends { eventType: string }>(
  events: T[],
  eventTypes: string[],
): T[] {
  if (eventTypes.length === 0) return events;
  return events.filter((event) => eventTypes.includes(event.eventType));
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange<T extends { timestamp: Date | string }>(
  events: T[],
  startDate: Date | null,
  endDate: Date | null,
): T[] {
  return events.filter((event) => {
    const eventDate = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);
    const afterStart = !startDate || eventDate >= startDate;
    const beforeEnd = !endDate || eventDate <= endDate;
    return afterStart && beforeEnd;
  });
}

/**
 * Sort events chronologically (newest first)
 */
export function sortEventsByDate<T extends { timestamp: Date | string }>(
  events: T[],
  ascending = false,
): T[] {
  const sorted = [...events].sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return ascending ? aTime - bTime : bTime - aTime;
  });
  return sorted;
}
