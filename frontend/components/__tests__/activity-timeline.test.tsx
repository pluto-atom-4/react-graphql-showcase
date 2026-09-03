import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityTimeline } from '../ActivityTimeline';
import type { ActivityEntry } from '../../lib/dashboard-utils';
import { BuildStatus } from '../../lib/generated/graphql';
import { STATUS_LABELS } from '../../lib/status-vocabulary';

describe('ActivityTimeline Component', () => {
  const mockEntries: ActivityEntry[] = [
    {
      id: '1',
      buildName: 'Build A',
      status: BuildStatus.Complete,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      relativeTime: '2 hours ago',
    },
    {
      id: '2',
      buildName: 'Build B',
      status: BuildStatus.Running,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      relativeTime: '30 minutes ago',
    },
    {
      id: '3',
      buildName: 'Build C',
      status: BuildStatus.Failed,
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      relativeTime: '5 minutes ago',
    },
  ];

  it('should render activity timeline with entries', () => {
    render(<ActivityTimeline entries={mockEntries} />);

    expect(screen.getByText('Build A')).toBeInTheDocument();
    expect(screen.getByText('Build B')).toBeInTheDocument();
    expect(screen.getByText('Build C')).toBeInTheDocument();
  });

  it('should render status badges with correct labels', () => {
    render(<ActivityTimeline entries={mockEntries} />);

    expect(screen.getByText(STATUS_LABELS[BuildStatus.Complete])).toBeInTheDocument();
    expect(screen.getByText(STATUS_LABELS[BuildStatus.Running])).toBeInTheDocument();
    expect(screen.getByText(STATUS_LABELS[BuildStatus.Failed])).toBeInTheDocument();
  });

  it('should render relative timestamps', () => {
    render(<ActivityTimeline entries={mockEntries} />);

    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('30 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
  });

  it('should show loading skeleton when isLoading is true', () => {
    render(<ActivityTimeline entries={[]} isLoading={true} />);

    const container = screen.getByRole('log');
    expect(container).toHaveAttribute('aria-busy', 'true');

    // Check for skeleton elements (animate-pulse divs)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state when no entries', () => {
    render(<ActivityTimeline entries={[]} />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText(/Builds will appear here/i)).toBeInTheDocument();
  });

  it('should respect maxItems limit', () => {
    const manyEntries = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      buildName: `Build ${i}`,
      status: BuildStatus.Complete,
      timestamp: new Date(),
      relativeTime: 'now',
    }));

    render(<ActivityTimeline entries={manyEntries} maxItems={5} />);

    // Should only show 5 items
    const buildNames = screen.getAllByText(/^Build \d+$/);
    expect(buildNames.length).toBe(5);
  });

  it('should have log role for accessibility', () => {
    render(<ActivityTimeline entries={mockEntries} />);

    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('should have aria-label on log element', () => {
    render(<ActivityTimeline entries={mockEntries} />);

    expect(screen.getByLabelText('Recent build activity')).toBeInTheDocument();
  });

  it('should truncate long build names', () => {
    const longNameEntry: ActivityEntry = {
      id: '1',
      buildName: 'This is a very long build name that should be truncated to prevent layout issues',
      status: BuildStatus.Complete,
      timestamp: new Date(),
      relativeTime: 'just now',
    };

    render(<ActivityTimeline entries={[longNameEntry]} />);

    const buildNameElement = screen.getByText(
      'This is a very long build name that should be truncated to prevent layout issues'
    );
    expect(buildNameElement).toHaveClass('truncate');
  });

  it('should display different status colors', () => {
    const statusEntries: ActivityEntry[] = [
      {
        id: '1',
        buildName: 'Complete Build',
        status: BuildStatus.Complete,
        timestamp: new Date(),
        relativeTime: 'now',
      },
      {
        id: '2',
        buildName: 'Failed Build',
        status: BuildStatus.Failed,
        timestamp: new Date(),
        relativeTime: 'now',
      },
      {
        id: '3',
        buildName: 'Running Build',
        status: BuildStatus.Running,
        timestamp: new Date(),
        relativeTime: 'now',
      },
      {
        id: '4',
        buildName: 'Pending Build',
        status: BuildStatus.Pending,
        timestamp: new Date(),
        relativeTime: 'now',
      },
    ];

    render(<ActivityTimeline entries={statusEntries} />);

    // Check that all status badges are present
    expect(screen.getByText(STATUS_LABELS[BuildStatus.Complete])).toBeInTheDocument();
    expect(screen.getByText(STATUS_LABELS[BuildStatus.Failed])).toBeInTheDocument();
    expect(screen.getByText(STATUS_LABELS[BuildStatus.Running])).toBeInTheDocument();
    expect(screen.getByText(STATUS_LABELS[BuildStatus.Pending])).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <ActivityTimeline
        entries={mockEntries}
        className="custom-timeline-class"
      />
    );

    const timeline = screen.getByRole('log');
    expect(timeline).toHaveClass('custom-timeline-class');
  });

  it('should render status circle abbreviations', () => {
    render(<ActivityTimeline entries={mockEntries} />);

    // Each status should have a first letter circle
    const expectedTitles = [
      BuildStatus.Complete,
      BuildStatus.Running,
      BuildStatus.Failed,
    ].map(status => STATUS_LABELS[status]);
    const circles = screen.getAllByTitle(
      new RegExp(`^(${expectedTitles.join('|')})$`)
    );
    expect(circles).toHaveLength(mockEntries.length);
  });

  it('should handle single entry', () => {
    render(<ActivityTimeline entries={[mockEntries[0]]} />);

    expect(screen.getByText('Build A')).toBeInTheDocument();
    // Should not have vertical line connector for last item
    const timelineContainer = screen.getByRole('log');
    const connectors = timelineContainer.querySelectorAll('.absolute');
    // The last entry should not have a connecting line
    expect(connectors.length).toBe(0);
  });

  it('should not show loading skeleton and entries simultaneously', () => {
    render(
      <ActivityTimeline
        entries={mockEntries}
        isLoading={true}
      />
    );

    // When loading is true, should show skeleton, not entries
    expect(screen.queryByText('Build A')).not.toBeInTheDocument();
    expect(screen.queryByText('Build B')).not.toBeInTheDocument();
  });

  it('should be memoized and handle prop changes correctly', () => {
    const { rerender } = render(<ActivityTimeline entries={mockEntries} />);

    expect(screen.getByText('Build A')).toBeInTheDocument();

    // Change entries
    const newEntries = [
      {
        id: '4',
        buildName: 'New Build',
        status: BuildStatus.Complete,
        timestamp: new Date(),
        relativeTime: 'just now',
      },
    ];

    rerender(<ActivityTimeline entries={newEntries} />);

    expect(screen.getByText('New Build')).toBeInTheDocument();
    expect(screen.queryByText('Build A')).not.toBeInTheDocument();
  });

  it('should handle default maxItems value', () => {
    const manyEntries = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      buildName: `Build ${i}`,
      status: BuildStatus.Complete,
      timestamp: new Date(),
      relativeTime: 'now',
    }));

    render(<ActivityTimeline entries={manyEntries} />);

    // Should show only 10 by default
    const buildNames = screen.getAllByText(/^Build \d+$/);
    expect(buildNames.length).toBe(10);
  });
});
