# Dashboard Utilities Reference

This document describes the dashboard utility functions used for metrics calculation and formatting.

## File: `frontend/lib/dashboard-utils.ts`

### Types

#### `DashboardMetrics`
```typescript
interface DashboardMetrics {
  totalBuilds: number;          // Total number of builds
  inProgress: number;           // Builds with RUNNING status
  completed: number;            // Builds with COMPLETE status
  failed: number;               // Builds with FAILED status
  pending: number;              // Builds with PENDING status
  completionRate: number;       // Percentage of finished builds (0-100)
}
```

#### `StatusDistribution`
```typescript
interface StatusDistribution {
  status: BuildStatus;          // Build status enum value
  count: number;                // Number of builds with this status
  percentage: number;           // Percentage of total (0-100)
  color: string;                // Hex color code for visualization
}
```

#### `ActivityEntry`
```typescript
interface ActivityEntry {
  id: string;                   // Build ID
  buildName: string;            // Display name
  status: BuildStatus;          // Current build status
  timestamp: Date;              // Timestamp of last update
  relativeTime: string;         // Formatted relative time ("2 hours ago")
}
```

#### `BuildData`
```typescript
interface BuildData {
  id: string;
  name: string;
  status: BuildStatus;
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
}
```

### Functions

#### `calculateMetrics(builds: BuildData[]): DashboardMetrics`

Calculates aggregated metrics from an array of builds.

**Parameters**:
- `builds`: Array of build objects from GraphQL query

**Returns**: Object with total, inProgress, completed, failed, pending counts and completionRate percentage

**Example**:
```typescript
const metrics = calculateMetrics(buildsList);
console.log(metrics);
// Output:
// {
//   totalBuilds: 10,
//   inProgress: 2,
//   completed: 7,
//   failed: 1,
//   pending: 0,
//   completionRate: 80
// }
```

**Notes**:
- Completion rate = (completed + failed) / total * 100
- Percentages are rounded to nearest integer
- Returns zeros for empty array

---

#### `calculateStatusDistribution(builds: BuildData[]): StatusDistribution[]`

Calculates status distribution with percentages for visualization (pie chart, etc).

**Parameters**:
- `builds`: Array of build objects from GraphQL query

**Returns**: Array of status distributions, filtered to only include statuses with count > 0

**Example**:
```typescript
const distribution = calculateStatusDistribution(buildsList);
console.log(distribution);
// Output:
// [
//   { status: 'COMPLETE', count: 7, percentage: 70, color: '#10b981' },
//   { status: 'RUNNING', count: 2, percentage: 20, color: '#3b82f6' },
//   { status: 'FAILED', count: 1, percentage: 10, color: '#ef4444' }
// ]
```

**Notes**:
- Includes hex colors for visualization
- Filters out statuses with zero count
- Percentages sum to 100 (with rounding)

---

#### `getStatusColor(status: BuildStatus): string`

Maps build status to Tailwind CSS color classes.

**Parameters**:
- `status`: BuildStatus enum value

**Returns**: Tailwind color classes for background and text

**Example**:
```typescript
const colorClass = getStatusColor('COMPLETE');
// Output: 'bg-green-100 text-green-800'

// Use in JSX:
<span className={colorClass}>Complete</span>
```

**Color Mapping**:
- COMPLETE → `bg-green-100 text-green-800`
- RUNNING → `bg-blue-100 text-blue-800`
- FAILED → `bg-red-100 text-red-800`
- PENDING → `bg-yellow-100 text-yellow-800`
- Unknown → `bg-gray-100 text-gray-800`

---

#### `getStatusBgColor(status: BuildStatus): string`

Maps build status to background color only (used for status circles).

**Parameters**:
- `status`: BuildStatus enum value

**Returns**: Tailwind background color class

**Example**:
```typescript
const bgColor = getStatusBgColor('RUNNING');
// Output: 'bg-blue-500'
```

**Color Mapping**:
- COMPLETE → `bg-green-500`
- RUNNING → `bg-blue-500`
- FAILED → `bg-red-500`
- PENDING → `bg-yellow-500`

---

#### `formatRelativeTime(date: string | Date): string`

Formats a timestamp as relative time ("2 hours ago").

**Parameters**:
- `date`: ISO 8601 string or Date object

**Returns**: Human-readable relative time string

**Examples**:
```typescript
const now = new Date();
const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);

formatRelativeTime(twoHoursAgo);
// Output: "2 hours ago"

formatRelativeTime(now);
// Output: "Just now"

const lastWeek = new Date(now - 10 * 24 * 60 * 60 * 1000);
formatRelativeTime(lastWeek);
// Output: "May 12"
```

**Format Rules**:
- < 1 minute: "Just now"
- < 1 hour: "X minute(s) ago"
- < 24 hours: "X hour(s) ago"
- < 7 days: "X day(s) ago"
- ≥ 7 days: "Month Date" (e.g., "May 12")

---

#### `formatDateShort(date: string | Date): string`

Formats a date as short format (e.g., "May 12").

**Parameters**:
- `date`: ISO 8601 string or Date object

**Returns**: Short date string

**Example**:
```typescript
const date = new Date('2024-05-12');
formatDateShort(date);
// Output: "May 12"
```

---

#### `getRecentActivity(builds: BuildData[], limit: number = 10): ActivityEntry[]`

Extracts recent activity entries from builds, sorted by most recent first.

**Parameters**:
- `builds`: Array of build objects
- `limit`: Maximum number of entries to return (default: 10)

**Returns**: Array of ActivityEntry objects sorted by timestamp (newest first)

**Example**:
```typescript
const activity = getRecentActivity(buildsList, 5);
console.log(activity);
// Output:
// [
//   {
//     id: '5',
//     buildName: 'Build E',
//     status: 'RUNNING',
//     timestamp: Date(now - 1 hour),
//     relativeTime: '1 hour ago'
//   },
//   // ... 4 more entries
// ]
```

**Notes**:
- Sorts by `updatedAt` timestamp in descending order (newest first)
- Uses `formatRelativeTime` for timestamp formatting
- Returns at most `limit` entries

---

### Constants

#### `STATUS_LABELS`

Mapping of BuildStatus enum values to display labels.

**Re-exported from `lib/status-vocabulary.ts`** — this module does not own the
copy. It previously declared its own map with `'In Progress'` / `'Completed'`,
which disagreed with the badge rendered beside it on the dashboard. Change a
label in `status-vocabulary.ts` and every consumer follows.

```typescript
// lib/status-vocabulary.ts — the single source of truth
const STATUS_LABELS: Record<BuildStatus, string> = {
  [BuildStatus.Pending]: 'Pending',
  [BuildStatus.Running]: 'Running',
  [BuildStatus.Complete]: 'Complete',
  [BuildStatus.Failed]: 'Failed',
};

console.log(STATUS_LABELS[BuildStatus.Running]);
// Output: 'Running'
```

---

## Usage in Hooks

### `frontend/lib/hooks/useDashboardMetrics.ts`

The hook uses all these utilities to calculate and return dashboard metrics:

```typescript
export function useDashboardMetrics(limit: number = 1000): UseDashboardMetricsReturn {
  const { data, loading, error, refetch } = useQuery(DASHBOARD_METRICS_QUERY);

  const builds = useMemo(() => data?.builds?.items || [], [data]);

  // Use utilities for memoized calculations
  const metrics = useMemo(() => calculateMetrics(builds), [builds]);
  const statusDistribution = useMemo(() => calculateStatusDistribution(builds), [builds]);
  const recentActivity = useMemo(() => getRecentActivity(builds, 10), [builds]);

  return {
    metrics,
    statusDistribution,
    recentActivity,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
}
```

---

## Performance Considerations

### Memoization

All functions are pure and can be safely memoized:

```typescript
// ✅ Good: Memoized calculations in hooks
const metrics = useMemo(() => calculateMetrics(builds), [builds]);

// ❌ Avoid: Recalculating on every render
const metrics = calculateMetrics(builds);
```

### Complexity

- `calculateMetrics()`: O(n) where n = number of builds (single pass)
- `calculateStatusDistribution()`: O(n) with memoization (single pass)
- `getRecentActivity()`: O(n log n) due to sort (acceptable for typical datasets)
- `formatRelativeTime()`: O(1) (constant time calculation)

### Typical Performance

For typical datasets (10-50 builds):
- Total calculation time: <5ms
- With memoization: <1ms on re-renders

For large datasets (1000+ builds):
- Total calculation time: ~50-100ms
- Consider backend aggregation endpoint for future optimization

---

## Testing

All utilities are covered by unit tests in `frontend/lib/__tests__/dashboard-utils.test.ts`:

```bash
# Run tests
pnpm test:frontend -- dashboard-utils.test.ts

# Run with coverage
pnpm test:frontend -- --coverage dashboard-utils.test.ts
```

---

## Future Enhancements

1. **Backend aggregation endpoint**: For very large datasets, calculate metrics server-side
2. **Caching layer**: Cache metrics for X seconds to reduce calculations
3. **Timezone handling**: Currently uses local timezone; consider UTC standardization
4. **Localization**: Support different date/time formats for international users
5. **Custom color schemes**: Allow theming of status colors

---

## Related Files

- `frontend/components/DashboardMetrics.tsx` - Container component using metrics
- `frontend/components/MetricCard.tsx` - Individual metric display
- `frontend/components/ActivityTimeline.tsx` - Activity list with status colors
- `frontend/lib/hooks/useDashboardMetrics.ts` - Hook for fetching and calculating metrics
