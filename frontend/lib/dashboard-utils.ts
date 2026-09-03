/**
 * Dashboard Metrics Utilities
 *
 * Helper functions for calculating and formatting dashboard metrics.
 * Provides metrics aggregation, date formatting, and status color mapping.
 */

import type { BuildStatus } from './generated/graphql';
import { BuildStatus as BuildStatusEnum } from './generated/graphql';
import { STATUS_LABELS } from './status-vocabulary';

/**
 * Aggregated metrics for the dashboard
 */
export interface DashboardMetrics {
  totalBuilds: number;
  inProgress: number;
  completed: number;
  failed: number;
  pending: number;
  completionRate: number; // percentage: 0-100
}

/**
 * Status distribution for visualization
 */
export interface StatusDistribution {
  status: BuildStatus;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Activity timeline entry
 */
export interface ActivityEntry {
  id: string;
  buildName: string;
  status: BuildStatus;
  timestamp: Date;
  relativeTime: string; // "2 hours ago"
}

/**
 * Build data for metrics calculation
 */
export interface BuildData {
  id: string;
  name: string;
  status: BuildStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculate dashboard metrics from builds array
 * @param builds - Array of builds
 * @returns Aggregated metrics
 */
export function calculateMetrics(builds: BuildData[]): DashboardMetrics {
  const totalBuilds = builds.length;

  const statusCounts = {
    [BuildStatusEnum.Pending]: 0,
    [BuildStatusEnum.Running]: 0,
    [BuildStatusEnum.Complete]: 0,
    [BuildStatusEnum.Failed]: 0,
  };

  builds.forEach(build => {
    if (build.status === BuildStatusEnum.Pending) {
      statusCounts[BuildStatusEnum.Pending]++;
    } else if (build.status === BuildStatusEnum.Running) {
      statusCounts[BuildStatusEnum.Running]++;
    } else if (build.status === BuildStatusEnum.Complete) {
      statusCounts[BuildStatusEnum.Complete]++;
    } else if (build.status === BuildStatusEnum.Failed) {
      statusCounts[BuildStatusEnum.Failed]++;
    }
  });

  const inProgress = statusCounts[BuildStatusEnum.Running];
  const completed = statusCounts[BuildStatusEnum.Complete];
  const failed = statusCounts[BuildStatusEnum.Failed];
  const pending = statusCounts[BuildStatusEnum.Pending];

  const finishedBuilds = completed + failed;
  const completionRate = totalBuilds > 0 ? Math.round((finishedBuilds / totalBuilds) * 100) : 0;

  return {
    totalBuilds,
    inProgress,
    completed,
    failed,
    pending,
    completionRate,
  };
}

/**
 * Calculate status distribution for visualization
 * @param builds - Array of builds
 * @returns Array of status distributions with percentages
 */
export function calculateStatusDistribution(builds: BuildData[]): StatusDistribution[] {
  const metrics = calculateMetrics(builds);
  const total = metrics.totalBuilds;

  if (total === 0) {
    return [];
  }

  return [
    {
      status: BuildStatusEnum.Complete,
      count: metrics.completed,
      percentage: Math.round((metrics.completed / total) * 100),
      color: '#10b981', // green
    },
    {
      status: BuildStatusEnum.Running,
      count: metrics.inProgress,
      percentage: Math.round((metrics.inProgress / total) * 100),
      color: '#3b82f6', // blue
    },
    {
      status: BuildStatusEnum.Failed,
      count: metrics.failed,
      percentage: Math.round((metrics.failed / total) * 100),
      color: '#ef4444', // red
    },
    {
      status: BuildStatusEnum.Pending,
      count: metrics.pending,
      percentage: Math.round((metrics.pending / total) * 100),
      color: '#f59e0b', // amber
    },
  ].filter(dist => dist.count > 0);
}

/**
 * Get Tailwind color class for build status
 * @param status - Build status
 * @returns Tailwind CSS color class
 */
export function getStatusColor(status: BuildStatus): string {
  switch (status) {
    case BuildStatusEnum.Complete:
      return 'bg-green-100 text-green-800';
    case BuildStatusEnum.Running:
      return 'bg-blue-100 text-blue-800';
    case BuildStatusEnum.Failed:
      return 'bg-red-100 text-red-800';
    case BuildStatusEnum.Pending:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get Tailwind background color for status badge
 * @param status - Build status
 * @returns Tailwind CSS background color
 */
export function getStatusBgColor(status: BuildStatus): string {
  switch (status) {
    case BuildStatusEnum.Complete:
      return 'bg-green-500';
    case BuildStatusEnum.Running:
      return 'bg-blue-500';
    case BuildStatusEnum.Failed:
      return 'bg-red-500';
    case BuildStatusEnum.Pending:
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const timestamp = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return timestamp.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date to short format (e.g., "May 12")
 * @param date - Date to format
 * @returns Short date string
 */
export function formatDateShort(date: string | Date): string {
  const timestamp = typeof date === 'string' ? new Date(date) : date;
  return timestamp.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get recent activity from builds (last N builds sorted by updated time)
 * @param builds - Array of builds
 * @param limit - Maximum number of recent builds to return
 * @returns Array of activity entries
 */
export function getRecentActivity(builds: BuildData[], limit: number = 10): ActivityEntry[] {
  return [...builds]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
    .map(build => ({
      id: build.id,
      buildName: build.name,
      status: build.status,
      timestamp: new Date(build.updatedAt),
      relativeTime: formatRelativeTime(build.updatedAt),
    }));
}

/**
 * Status display labels.
 *
 * Re-exported from `./status-vocabulary`, the canonical source of truth. This
 * module previously owned a divergent copy ('In Progress' / 'Completed') that
 * disagreed with the badge shown beside it — see
 * `.claude/patterns/search-filter-patterns.md` ("Single source of truth for status").
 */
export { STATUS_LABELS };
