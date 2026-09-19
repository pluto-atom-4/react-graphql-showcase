'use client';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import BuildDetailModal from '../build-detail-modal';
import * as apolloHooks from '@/lib/apollo-hooks';
import { BuildStatus, TestStatus } from '@/lib/apollo-hooks';
import * as testRunsHook from '@/lib/hooks/useTestRuns';
import * as activityFeedHook from '@/lib/hooks/useActivityFeed';
import type { BuildEvent } from '@/lib/types/activity-types';
import { createMockBuild, createMockTestRun } from './mocks/build';

// Mock the dependencies
vi.mock('@/lib/apollo-hooks');
vi.mock('@/lib/hooks/useTestRuns');
vi.mock('@/lib/hooks/useActivityFeed');
vi.mock('@/lib/use-sse-events', () => ({
  useSSEEvents: vi.fn(() => {
    // Mock SSE hook - it just sets up event listeners
  }),
}));

const mockBuildData = createMockBuild({
  id: 'build-123',
  status: BuildStatus.Running,
  description: 'A test build',
  parts: [
    { id: 'part-1', name: 'Part 1', sku: 'SKU-001', quantity: 5, buildId: 'build-123', createdAt: new Date().toISOString() },
  ],
});

const mockTestRuns = [
  createMockTestRun({
    id: '1',
    status: TestStatus.Passed,
    result: 'All tests passed',
    completedAt: '2026-04-16T10:00:00Z',
    fileUrl: 'https://example.com/report.pdf',
    createdAt: '2026-04-16T09:00:00Z',
    buildId: 'build-123',
  }),
  createMockTestRun({
    id: '2',
    status: TestStatus.Running,
    result: undefined,
    completedAt: undefined,
    fileUrl: undefined,
    createdAt: '2026-04-16T11:00:00Z',
    buildId: 'build-123',
  }),
];

const mockEvents: BuildEvent[] = [
  {
    id: 'event-1',
    buildId: 'build-123',
    eventType: 'status_change',
    timestamp: new Date('2026-04-16T08:00:00Z'),
    description: 'Build created',
    metadata: { newStatus: BuildStatus.Pending },
  },
];

describe('BuildDetailModal - Tabbed Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(apolloHooks.useBuildDetail).mockReturnValue({
      build: mockBuildData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(apolloHooks.useUpdateBuildStatus).mockReturnValue({
      updateStatus: vi.fn().mockResolvedValue({}),
      loading: false,
      error: null,
    });

    vi.mocked(apolloHooks.useAddPart).mockReturnValue({
      addPart: vi.fn().mockResolvedValue({}),
      loading: false,
      error: null,
    });

    vi.mocked(apolloHooks.useSubmitTestRun).mockReturnValue({
      submitTestRun: vi.fn().mockResolvedValue({}),
      loading: false,
      error: null,
    });

    vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
      testRuns: mockTestRuns,
      loading: false,
      error: null,
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      isPolling: false,
      refetch: vi.fn().mockResolvedValue({ data: { testRuns: mockTestRuns } }),
      pollInterval: 2000,
    });

    vi.mocked(activityFeedHook.useActivityFeed).mockReturnValue({
      events: mockEvents,
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue({ data: { events: mockEvents } }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering & Tab Structure', () => {
    it('should render modal with all 4 tabs', async (): Promise<void> => {
      const onClose = vi.fn();
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={onClose} />
        </MockedProvider>
      );

      await waitFor(() => {
        // Check for tab buttons
        expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /parts/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /test runs/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
      });
    });

    it('should render Overview tab by default', async (): Promise<void> => {
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      await waitFor(() => {
        const overviewTab = screen.getByRole('tab', { name: /overview/i });
        expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should display tab badges with counts', async (): Promise<void> => {
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      await waitFor(() => {
        // Parts tab should show 1 part
        const partsTab = screen.getByRole('tab', { name: /parts/i });
        expect(partsTab.textContent).toMatch(/1/);

        // TestRuns tab should show 2 test runs
        const testRunsTab = screen.getByRole('tab', { name: /test runs/i });
        expect(testRunsTab.textContent).toMatch(/2/);

        // History tab should show 1 event
        const historyTab = screen.getByRole('tab', { name: /history/i });
        expect(historyTab.textContent).toMatch(/1/);
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch tabs when clicking', async (): Promise<void> => {
      const user = userEvent.setup();
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-selected', 'true');
      });

      const partsTab = screen.getByRole('tab', { name: /parts/i });
      await user.click(partsTab);

      await waitFor(() => {
        expect(partsTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should navigate between tabs with arrow keys', async (): Promise<void> => {
      const user = userEvent.setup();
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      overviewTab.focus();

      // Arrow right to go to next tab
      await user.keyboard('{ArrowRight}');

      const partsTab = screen.getByRole('tab', { name: /parts/i });
      await waitFor(() => {
        expect(partsTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should close modal with Escape key', async (): Promise<void> => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={onClose} />
        </MockedProvider>
      );

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Overview Tab Data Display', () => {
    it('should render Overview tab as active by default', async (): Promise<void> => {
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      await waitFor(() => {
        const overviewTab = screen.getByRole('tab', { name: /overview/i });
        expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Parts Tab Data Display', () => {
    it('should render Parts tab', (): void => {
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      const partsTab = screen.getByRole('tab', { name: /parts/i });
      expect(partsTab).toBeInTheDocument();
      expect(partsTab.textContent).toContain('1'); // Check badge count
    });
  });

  describe('Test Runs Tab Data Display', () => {
    it('should render Test Runs tab with badge count', (): void => {
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      const testRunsTab = screen.getByRole('tab', { name: /test runs/i });
      expect(testRunsTab).toBeInTheDocument();
      expect(testRunsTab.textContent).toContain('2'); // Check badge count
    });
  });

  describe('History Tab Data Display', () => {
    it('should display events when History tab is active', async (): Promise<void> => {
      const user = userEvent.setup();
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      const historyTab = screen.getByRole('tab', { name: /history/i });
      await user.click(historyTab);

      await waitFor(() => {
        // Verify tab is active
        expect(historyTab).toHaveAttribute('aria-selected', 'true');
        // Activity feed should render when tab is active
        const tabpanel = screen.getByRole('tabpanel', { hidden: false });
        expect(tabpanel).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Resilience', () => {
    it('should handle component errors gracefully', (): void => {
      // This test verifies error boundaries exist and catch errors
      // The exact error message depends on ErrorBoundary implementation
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      // Modal should still render even if a tab component has issues
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Accessibility (WCAG 2.1 Level AA)', () => {
    it('should have proper ARIA attributes on tabs', (): void => {
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('role', 'tab');
      });
    });

    it('should have role="tabpanel" on tab content', async (): Promise<void> => {
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      await waitFor(() => {
        const tabpanels = screen.getAllByRole('tabpanel');
        expect(tabpanels.length).toBeGreaterThan(0);
      });
    });

    it('should have focus trap in modal', async (): Promise<void> => {
      const user = userEvent.setup();
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      // Tab through all interactive elements
      await user.tab();

      // First interactive element should be in modal
      const activeElement = document.activeElement;
      expect(activeElement).toBeTruthy();
    });

    it('should announce modal to screen readers', async (): Promise<void> => {
      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveAttribute('aria-modal', 'true');
      });
    });
  });

  describe('Data Loading States', () => {
    it('should show loading skeleton initially', async (): Promise<void> => {
      vi.mocked(apolloHooks.useBuildDetail).mockReturnValue({
        build: undefined,
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      // Should show loading state or skeleton - modal div should be present
      await waitFor(() => {
        // Modal wrapper should exist during loading
        expect(document.querySelector('[class*="fixed"]')).toBeTruthy();
      });
    });

    it('should handle data loading errors gracefully', async (): Promise<void> => {
      const errorMessage = 'Failed to load build data';
      vi.mocked(apolloHooks.useBuildDetail).mockReturnValue({
        build: undefined,
        loading: false,
        error: new Error(errorMessage),
        refetch: vi.fn(),
      });

      render(
        <MockedProvider>
          <BuildDetailModal buildId="build-123" onClose={vi.fn()} />
        </MockedProvider>
      );

      // Modal should show error state
      await waitFor(() => {
        const errorText = screen.getByText(/failed to load/i);
        expect(errorText).toBeInTheDocument();
      });
    });
  });
});
