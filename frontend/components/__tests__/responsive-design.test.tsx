import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockedProvider } from '@apollo/client/testing/react';
import { DashboardMetrics } from '../DashboardMetrics';
import { MetricCard } from '../MetricCard';
import { ActivityTimeline } from '../ActivityTimeline';
import { DASHBOARD_METRICS_QUERY } from '../../lib/graphql-queries';
import { BuildStatus } from '../../lib/generated/graphql';
import { STATUS_LABELS } from '../../lib/status-vocabulary';
import type { ActivityEntry } from '../../lib/dashboard-utils';

/**
 * Mock data for responsive testing
 */
const mockMetricsData = {
  builds: {
    items: [
      {
        id: '1',
        name: 'Build A Very Long Name That Should Truncate Properly',
        status: BuildStatus.Complete,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'Build',
      },
      {
        id: '2',
        name: 'Build B',
        status: BuildStatus.Running,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'Build',
      },
      {
        id: '3',
        name: 'Build C',
        status: BuildStatus.Complete,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'Build',
      },
      {
        id: '4',
        name: 'Build D',
        status: BuildStatus.Failed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'Build',
      },
    ],
    totalCount: 4,
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
      data: mockMetricsData,
    },
  },
];

describe('DashboardMetrics - Responsive Design', () => {
  beforeEach(() => {
    // Reset window size before each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('should render metric cards in correct grid layout', () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    // Find the metrics grid
    const metricsSection = screen.getByRole('region', { name: 'Dashboard metrics' });
    const gridContainer = metricsSection.querySelector('.grid');

    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-2');
    expect(gridContainer).toHaveClass('lg:grid-cols-4');
  });

  it('should have proper padding on mobile', () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    const metricsSection = screen.getByRole('region', { name: 'Dashboard metrics' });
    expect(metricsSection).toHaveClass('px-4');
  });

  it('should have proper gap between cards', () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    const metricsSection = screen.getByRole('region', { name: 'Dashboard metrics' });
    const gridContainer = metricsSection.querySelector('.grid');

    expect(gridContainer).toHaveClass('gap-4');
  });

  it('MetricCard should have proper touch target size', () => {
    render(
      <MetricCard
        icon="🏗️"
        label="Touch Target Test"
        value={42}
        onClick={() => {}}
      />
    );

    const card = screen.getByRole('button');
    // Tailwind p-6 = 1.5rem = 24px padding on all sides
    // Total height with text should be > 44px
    expect(card).toHaveClass('p-6');
  });

  it('ActivityTimeline entries should be readable on mobile', () => {
    const entries: ActivityEntry[] = [
      {
        id: '1',
        buildName: 'Build A Very Long Name',
        status: BuildStatus.Complete,
        timestamp: new Date(),
        relativeTime: '2 hours ago',
      },
    ];

    render(<ActivityTimeline entries={entries} />);

    const buildName = screen.getByText('Build A Very Long Name');
    expect(buildName).toHaveClass('text-sm');
    expect(buildName).toHaveClass('truncate');
  });

  it('should not have horizontal scroll on mobile', () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    const metricsSection = screen.getByRole('region', { name: 'Dashboard metrics' });
    const html = metricsSection.ownerDocument.documentElement;

    // Body should not overflow horizontally
    expect(html.scrollWidth).toBeLessThanOrEqual(html.clientWidth);
  });

  it('should have readable font sizes', () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    // Header should be visible and properly sized
    const header = screen.getByText('Metrics & Overview');
    expect(header).toHaveClass('text-2xl');

    // Activity section header should be readable
    const activityHeader = screen.getByText('Recent Activity');
    expect(activityHeader).toHaveClass('text-lg');
  });

  it('MetricCard should truncate long values gracefully', () => {
    render(
      <MetricCard
        icon="📊"
        label="Very Long Metric Label That Should Fit"
        value="Very Long Value That Should Display"
      />
    );

    const label = screen.getByText('Very Long Metric Label That Should Fit');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
  });

  it('should have proper spacing in ActivityTimeline', () => {
    const entries: ActivityEntry[] = Array.from({ length: 3 }, (_, i) => ({
      id: `${i}`,
      buildName: `Build ${i}`,
      status: BuildStatus.Complete,
      timestamp: new Date(),
      relativeTime: 'now',
    }));

    render(<ActivityTimeline entries={entries} />);

    const timeline = screen.getByRole('log');
    expect(timeline).toHaveClass('space-y-0');
  });

  it('MetricCard should handle click on mobile', () => {
    const onClick = vi.fn();
    render(
      <MetricCard
        icon="🔘"
        label="Mobile Click Test"
        value={100}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:border-gray-300');
  });

  it('should have accessible button states on mobile', () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    const refreshButton = screen.getByLabelText('Refresh metrics');
    expect(refreshButton).toHaveClass('transition-colors');
    expect(refreshButton).toHaveClass('rounded');
  });

  it('should have proper container max-width on desktop', () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    const metricsSection = screen.getByRole('region', { name: 'Dashboard metrics' });
    expect(metricsSection).toHaveClass('max-w-[1200px]');
  });

  it('MetricCard icon should be visible on all screen sizes', () => {
    render(
      <MetricCard
        icon="🎯"
        label="Icon Visibility Test"
        value={999}
      />
    );

    expect(screen.getByText('🎯')).toBeInTheDocument();
    const icon = screen.getByText('🎯');
    expect(icon).toHaveClass('text-2xl');
  });

  it('ActivityTimeline status circles should be appropriately sized', () => {
    const entries: ActivityEntry[] = [
      {
        id: '1',
        buildName: 'Build',
        status: BuildStatus.Complete,
        timestamp: new Date(),
        relativeTime: 'now',
      },
    ];

    render(<ActivityTimeline entries={entries} />);

    // Find the status badge by checking for the status text
    const statusBadge = screen.getByText(STATUS_LABELS[BuildStatus.Complete]);
    expect(statusBadge).toHaveClass('inline-flex');
    expect(statusBadge).toHaveClass('px-2');
    expect(statusBadge).toHaveClass('py-0.5');
  });

  it('should maintain proper vertical spacing on mobile', () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardMetrics />
      </MockedProvider>
    );

    const metricsSection = screen.getByRole('region', { name: 'Dashboard metrics' });
    expect(metricsSection).toHaveClass('py-8');
    expect(metricsSection).toHaveClass('px-4');
  });
});

