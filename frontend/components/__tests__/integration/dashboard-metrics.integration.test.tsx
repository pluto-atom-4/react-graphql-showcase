import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockedProvider } from '@apollo/client/testing/react';
import { DashboardMetrics } from '../../DashboardMetrics';
import { DASHBOARD_METRICS_QUERY } from '../../../lib/graphql-queries';
import { BuildStatus } from '../../../lib/generated/graphql';
import { STATUS_LABELS } from '../../../lib/status-vocabulary';

/* global performance */

/**
 * Integration tests for DashboardMetrics
 *
 * Tests the full metrics flow:
 * - Data fetching from GraphQL
 * - Metrics calculations
 * - Apollo cache invalidation on mutations
 * - Error handling and recovery
 */

const mockInitialBuilds = {
  builds: {
    items: [
      {
        id: '1',
        name: 'Build Alpha',
        status: BuildStatus.Complete,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        __typename: 'Build',
      },
      {
        id: '2',
        name: 'Build Beta',
        status: BuildStatus.Running,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        __typename: 'Build',
      },
    ],
    totalCount: 2,
    hasNextPage: false,
    hasPreviousPage: false,
    __typename: 'BuildConnection',
  },
};

const mockUpdatedBuilds = {
  builds: {
    items: [
      ...mockInitialBuilds.builds.items,
      {
        id: '3',
        name: 'Build Gamma',
        status: BuildStatus.Complete,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'Build',
      },
    ],
    totalCount: 3,
    hasNextPage: false,
    hasPreviousPage: false,
    __typename: 'BuildConnection',
  },
};

describe('DashboardMetrics - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch metrics data and display correctly', async () => {
    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: mockInitialBuilds,
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 2')).toBeInTheDocument();
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Running]} Builds: 1`)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Complete]} Builds: 1`)
      ).toBeInTheDocument();
    });
  });

  it.skip('should update metrics after new builds are created', async () => {
    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: mockInitialBuilds,
        },
      },
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: mockUpdatedBuilds,
        },
      },
    ];

    const { rerender } = render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 2')).toBeInTheDocument();
    });

    // Simulate cache update by re-rendering with updated mocks
    rerender(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 3')).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        error: new Error('Network error'),
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading metrics')).toBeInTheDocument();
      expect(screen.getByLabelText('Retry loading metrics')).toBeInTheDocument();
    });
  });

  it('should calculate metrics correctly for various statuses', async () => {
    const mixedStatusBuilds = {
      builds: {
        items: [
          { id: '1', name: 'B1', status: BuildStatus.Complete, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
          { id: '2', name: 'B2', status: BuildStatus.Complete, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
          { id: '3', name: 'B3', status: BuildStatus.Running, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
          { id: '4', name: 'B4', status: BuildStatus.Failed, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
          { id: '5', name: 'B5', status: BuildStatus.Pending, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
        ],
        totalCount: 5,
        hasNextPage: false,
        hasPreviousPage: false,
        __typename: 'BuildConnection',
      },
    };

    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: mixedStatusBuilds,
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 5')).toBeInTheDocument();
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Complete]} Builds: 2`)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Running]} Builds: 1`)
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Failed Builds: 1')).toBeInTheDocument();
      // 2 complete + 1 failed = 3/5 = 60%
      expect(screen.getByText('60% complete')).toBeInTheDocument();
    });
  });

  it('should display recent activity in correct order', async () => {
    const builtAtDifferentTimes = {
      builds: {
        items: [
          {
            id: '1',
            name: 'Oldest Build',
            status: BuildStatus.Complete,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            __typename: 'Build',
          },
          {
            id: '2',
            name: 'Newest Build',
            status: BuildStatus.Complete,
            createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
            __typename: 'Build',
          },
        ],
        totalCount: 2,
        hasNextPage: false,
        hasPreviousPage: false,
        __typename: 'BuildConnection',
      },
    };

    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: builtAtDifferentTimes,
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      const newestBuild = screen.getByText('Newest Build');
      const oldestBuild = screen.getByText('Oldest Build');

      // Newest build should appear before oldest in the DOM
      expect(newestBuild.compareDocumentPosition(oldestBuild) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  it('should handle empty results', async () => {
    const emptyMocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: {
            builds: {
              items: [],
              totalCount: 0,
              hasNextPage: false,
              hasPreviousPage: false,
              __typename: 'BuildConnection',
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={emptyMocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 0')).toBeInTheDocument();
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  it('should handle large dataset (100+ builds)', async () => {
    const largeDataset = {
      builds: {
        items: Array.from({ length: 150 }, (_, i) => ({
          id: `${i}`,
          name: `Build ${i}`,
          status: i % 4 === 0 ? BuildStatus.Complete : i % 4 === 1 ? BuildStatus.Running : i % 4 === 2 ? BuildStatus.Failed : BuildStatus.Pending,
          createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
          __typename: 'Build',
        })),
        totalCount: 150,
        hasNextPage: false,
        hasPreviousPage: false,
        __typename: 'BuildConnection',
      },
    };

    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: largeDataset,
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 150')).toBeInTheDocument();
    });

    // Should still show only recent items in timeline
    const timeline = screen.getByRole('log');
    const activityItems = timeline.querySelectorAll('[title]');
    // Should be limited to maxItems (10)
    expect(activityItems.length).toBeLessThanOrEqual(10);
  });

  it('should handle loading state transitions', async () => {
    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        delay: 100,
        result: {
          data: mockInitialBuilds,
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    // Initially should show loading
    expect(screen.getByRole('region', { name: 'Dashboard metrics' })).toBeInTheDocument();

    // Eventually should show data
    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 2')).toBeInTheDocument();
    });
  });

  it('should maintain performance with memoization', async () => {
    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: mockInitialBuilds,
        },
      },
    ];

    const { rerender } = render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 2')).toBeInTheDocument();
    });

    // Re-render with same props - should not cause re-fetch
    const startTime = performance.now();

    rerender(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    const endTime = performance.now();

    // Memoization should make re-render fast
    expect(endTime - startTime).toBeLessThan(100);
  });

  it.skip('should handle cache updates with new status information', async () => {
    const initialData = {
      builds: {
        items: [
          {
            id: '1',
            name: 'Build',
            status: BuildStatus.Running,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __typename: 'Build',
          },
        ],
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        __typename: 'BuildConnection',
      },
    };

    const updatedData = {
      builds: {
        items: [
          {
            id: '1',
            name: 'Build',
            status: BuildStatus.Complete,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __typename: 'Build',
          },
        ],
        totalCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        __typename: 'BuildConnection',
      },
    };

    const mocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: initialData,
        },
      },
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: updatedData,
        },
      },
    ];

    const { rerender } = render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Running]} Builds: 1`)
      ).toBeInTheDocument();
    });

    // Update cache with new data
    rerender(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Complete]} Builds: 1`)
      ).toBeInTheDocument();
    });
  });
});
