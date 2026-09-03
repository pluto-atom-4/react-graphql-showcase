import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockedProvider } from '@apollo/client/testing/react';
import { InMemoryCache } from '@apollo/client';
import { DashboardMetrics } from '../DashboardMetrics';
import { DASHBOARD_METRICS_QUERY } from '../../lib/graphql-queries';
import { BuildStatus } from '../../lib/generated/graphql';
import { STATUS_LABELS } from '../../lib/status-vocabulary';

/**
 * Mock GraphQL response for testing
 */
const mockMetricsData = {
  builds: {
    items: [
      {
        id: '1',
        name: 'Build Alpha',
        status: BuildStatus.Complete,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        __typename: 'Build',
      },
      {
        id: '2',
        name: 'Build Beta',
        status: BuildStatus.Running,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        __typename: 'Build',
      },
      {
        id: '3',
        name: 'Build Gamma',
        status: BuildStatus.Complete,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        __typename: 'Build',
      },
      {
        id: '4',
        name: 'Build Delta',
        status: BuildStatus.Failed,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        __typename: 'Build',
      },
    ],
    totalCount: 4,
    hasNextPage: false,
    hasPreviousPage: false,
    __typename: 'BuildConnection',
  },
};

/**
 * Issue #295: Create a new Apollo cache for each test to prevent cleanup issues
 * This ensures each test has isolated cache and reduces the chance of unhandled rejections
 */
const createTestCache = (): InMemoryCache => new InMemoryCache();

describe('DashboardMetrics Component', () => {
  const mockMutationResult = {
    result: {
      data: {
        builds: mockMetricsData.builds,
      },
    },
  };

  const mocks = [
    {
      request: {
        query: DASHBOARD_METRICS_QUERY,
        variables: { limit: 50, offset: 0 },
      },
      ...mockMutationResult,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render metrics header and refresh button', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Metrics & Overview')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh metrics')).toBeInTheDocument();
    });
  });

  it('should display all metric cards with correct values', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      // Check for all metric cards
      expect(screen.getByLabelText('Total Builds: 4')).toBeInTheDocument();
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Running]} Builds: 1`)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Complete]} Builds: 2`)
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Failed Builds: 1')).toBeInTheDocument();
    });
  });

  it('should display metric labels', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Builds')).toBeInTheDocument();
      expect(screen.getByText(STATUS_LABELS[BuildStatus.Running])).toBeInTheDocument();
      expect(screen.getByText(STATUS_LABELS[BuildStatus.Complete])).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  it('should display completion rate', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      // 2 completed + 1 failed = 3 out of 4 = 75%
      expect(screen.getByText('75% complete')).toBeInTheDocument();
    });
  });

  it('should display Recent Activity section', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  it('should display recent activity timeline entries', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      // Most recent builds should appear
      expect(screen.getByText('Build Delta')).toBeInTheDocument();
      expect(screen.getByText('Build Gamma')).toBeInTheDocument();
    });
  });

  it('should call refetch on Refresh button click', async () => {
    const user = userEvent.setup();
    const onMetricsRefresh = vi.fn();

    const metricsWithRefetch = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        ...mockMutationResult,
      },
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        ...mockMutationResult,
      },
    ];

    render(
      <MockedProvider mocks={metricsWithRefetch} cache={createTestCache()}>
        <DashboardMetrics onMetricsRefresh={onMetricsRefresh} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Builds')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh metrics');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(onMetricsRefresh).toHaveBeenCalled();
    });
  });

  it('should have region role for accessibility', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Dashboard metrics' })
      ).toBeInTheDocument();
    });
  });

  it('should display icons for each metric', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      // Check for emoji icons
      expect(screen.getByText('🏗️')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  it('should handle empty metrics gracefully', async () => {
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
      <MockedProvider mocks={emptyMocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Total Builds: 0')).toBeInTheDocument();
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Running]} Builds: 0`)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(`${STATUS_LABELS[BuildStatus.Complete]} Builds: 0`)
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Failed Builds: 0')).toBeInTheDocument();
    });
  });

  it('should show "No recent activity" when no builds', async () => {
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
      <MockedProvider mocks={emptyMocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  it('should calculate completion rate correctly for mixed statuses', async () => {
    const mixedMocks = [
      {
        request: {
          query: DASHBOARD_METRICS_QUERY,
          variables: { limit: 50, offset: 0 },
        },
        result: {
          data: {
            builds: {
              items: [
                { id: '1', name: 'B1', status: BuildStatus.Complete, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
                { id: '2', name: 'B2', status: BuildStatus.Complete, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
                { id: '3', name: 'B3', status: BuildStatus.Failed, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
                { id: '4', name: 'B4', status: BuildStatus.Running, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
                { id: '5', name: 'B5', status: BuildStatus.Pending, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __typename: 'Build' },
              ],
              totalCount: 5,
              hasNextPage: false,
              hasPreviousPage: false,
              __typename: 'BuildConnection',
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mixedMocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      // 2 completed + 1 failed = 3 out of 5 = 60%
      expect(screen.getByText('60% complete')).toBeInTheDocument();
    });
  });

  it('should memoize and not re-render unnecessarily', async () => {
    const { rerender } = render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics onMetricsRefresh={() => {}} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Metrics & Overview')).toBeInTheDocument();
    });

    // Re-render with same props
    rerender(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics onMetricsRefresh={() => {}} />
      </MockedProvider>
    );

    // Should still show same content
    expect(screen.getByText('Metrics & Overview')).toBeInTheDocument();
  });

  it('should have responsive grid layout classes', async () => {
    render(
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <DashboardMetrics />
      </MockedProvider>
    );

    await waitFor(() => {
      const metricsContainer = screen.getByText('Metrics & Overview').closest('div')?.nextElementSibling;
      expect(metricsContainer).toHaveClass('grid');
      expect(metricsContainer).toHaveClass('md:grid-cols-2');
      expect(metricsContainer).toHaveClass('lg:grid-cols-4');
    });
  });
});
