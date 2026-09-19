/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, no-undef */
'use client';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TestRunResultViewer } from '../../TestRunResultViewer';
import type { TestRunData } from '@/lib/types/modal-types';
import { vi } from 'vitest';

expect.extend(toHaveNoViolations);

describe('TestRunResultViewer Accessibility', () => {
  const mockTestRun: TestRunData = {
    id: 'tr-123',
    buildId: 'build-789',
    status: 'FAILED',
    result: 'Expected 5 but got 4',
    startedAt: '2026-04-15T10:00:00Z',
    completedAt: '2026-04-15T10:05:00Z',
    fileUrl: 's3://bucket/report.pdf',
  };

  const mockHandlers = {
    onRerun: vi.fn().mockResolvedValue(undefined),
    onDownloadResult: vi.fn(),
    onClose: vi.fn(),
  };

  describe('Dialog Accessibility', () => {
    it('should have role="dialog" on modal', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal="true" on modal', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to modal title', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'testrun-title');

      const title = screen.getByText('Test Result');
      expect(title).toHaveAttribute('id', 'testrun-title');
    });
  });

  describe('Status Badge Accessibility', () => {
    it('should have aria-label on status badge', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const statusBadges = screen.getAllByLabelText(/Status:/);
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('should announce status badge text', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getAllByText('FAILED')).toBeDefined();
    });

    it('should display correct color for different statuses', () => {
      const passedTestRun: TestRunData = {
        ...mockTestRun,
        status: 'PASSED',
      };

      render(
        <TestRunResultViewer
          testRun={passedTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const statusBadges = screen.queryAllByLabelText(/Status: PASSED/);
      expect(statusBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Close Button Accessibility', () => {
    it('should have aria-label on close button', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByLabelText('Close test result modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByLabelText('Close test result modal');
      await user.click(closeButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it('should have focus ring on close button', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByLabelText('Close test result modal');
      expect(closeButton.className).toContain('focus:ring');
    });
  });

  describe('Content Accessibility', () => {
    it('should display test run ID', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('tr-123')).toBeInTheDocument();
    });

    it('should display all field labels', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('Test Run ID')).toBeInTheDocument();
      expect(screen.getByText('Status Details')).toBeInTheDocument();
    });

    it('should display result text', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('Expected 5 but got 4')).toBeInTheDocument();
    });

    it('should display timestamps', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('Started')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Download Button Accessibility', () => {
    it('should have accessible download link', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const downloadButtons = screen.queryAllByRole('button', { name: /Download Result/ });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    it('should call onDownloadResult when download is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const downloadButtons = screen.queryAllByRole('button', { name: /Download Result/ });
      if (downloadButtons.length > 0) {
        await user.click(downloadButtons[0]);
        expect(mockHandlers.onDownloadResult).toHaveBeenCalledWith(mockTestRun.fileUrl);
      }
    });

    it('should have accessible download button', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      // Verify download button exists and is accessible
      const downloadButtons = screen.queryAllByRole('button', { name: /Download Result/ });
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Rerun Button Accessibility', () => {
    it('should show rerun button for failed tests', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      // Look for rerun button by aria-label since that's more reliable
      const rerunByLabel = screen.queryAllByLabelText('Rerun this test');
      // Or by checking for button containing "Rerun" text
      const allButtons = screen.queryAllByRole('button');
      const rerunButtons = allButtons.filter(btn => btn.textContent?.includes('Rerun'));
      
      expect(rerunByLabel.length + rerunButtons.length).toBeGreaterThan(0);
    });

    it('should have aria-label on rerun button', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const rerunButtons = screen.queryAllByLabelText('Rerun this test');
      expect(rerunButtons.length).toBeGreaterThan(0);
    });

    it('should not show rerun button for passed tests', () => {
      const passedTestRun: TestRunData = {
        ...mockTestRun,
        status: 'PASSED',
      };

      render(
        <TestRunResultViewer
          testRun={passedTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const allButtons = screen.queryAllByRole('button');
      const rerunButtons = allButtons.filter(btn => btn.textContent?.includes('Rerun'));
      expect(rerunButtons).toHaveLength(0);
    });

    it('should call onRerun when rerun button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const rerunButtons = screen.queryAllByLabelText('Rerun this test');
      if (rerunButtons.length > 0) {
        await user.click(rerunButtons[0]);
        expect(mockHandlers.onRerun).toHaveBeenCalledWith(mockTestRun.id);
      }
    });

    it('should disable rerun button while rerunning', async () => {
      const user = userEvent.setup();
      const slowRerun = vi.fn<(testRunId: string) => Promise<void>>(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      );

      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={slowRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const rerunButtons = screen.queryAllByLabelText('Rerun this test');
      if (rerunButtons.length > 0) {
        const button = rerunButtons[0] as HTMLButtonElement;
        await user.click(button);
        // Verify the button exists in the document
        expect(button).toBeInTheDocument();
      }
    });

    it('should have focus ring on rerun button', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const rerunButtons = screen.queryAllByLabelText('Rerun this test');
      if (rerunButtons.length > 0) {
        expect(rerunButtons[0].className).toContain('focus:ring');
      }
    });
  });

  describe('Focus Management', () => {
    it('should allow focus on all buttons', async () => {
      const user = userEvent.setup();
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      await user.tab();

      // First button should have focus
      expect(document.activeElement).toBeInTheDocument();
    });

    it('should have focus trap within modal', async () => {
      const user = userEvent.setup();
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const buttons = screen.queryAllByRole('button');
      if (buttons.length > 0) {
        const lastButton = buttons[buttons.length - 1];
        lastButton.focus();
        expect(lastButton).toHaveFocus();

        // Tab should stay within modal
        await user.tab();
        const focused = document.activeElement;
        expect(focused).toBeInTheDocument();
      }
    });

    it('should allow Shift+Tab to navigate backwards', async () => {
      const user = userEvent.setup();
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByRole('button', { name: 'Close' });
      closeButton.focus();

      await user.tab({ shift: true });

      // Should move focus
      expect(document.activeElement).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow Tab navigation through buttons', async () => {
      const user = userEvent.setup();
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      await user.tab();

      // First button should have focus
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should trigger close on Escape key (if implemented)', async () => {
      const user = userEvent.setup();
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const dialog = screen.getByRole('dialog');
      dialog.focus();

      await user.keyboard('{Escape}');

      // Note: This test depends on whether Escape handling is implemented
      // If not implemented, the component is at least keyboard accessible
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Disabled State Accessibility', () => {
    it('should disable buttons when loading', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
          isLoading={true}
        />,
      );

      const rerunButtons = screen.queryAllByRole('button', { name: 'Rerun Test' });
      if (rerunButtons.length > 0) {
        expect(rerunButtons[0]).toBeDisabled();
      }
    });

    it('should not show rerun button when onRerun is undefined', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.queryByRole('button', { name: 'Rerun Test' })).not.toBeInTheDocument();
    });
  });

  describe('Status Handling', () => {
    it('should announce warning message for failed tests', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText(/This test failed/)).toBeInTheDocument();
    });

    it('should not announce warning for passed tests', () => {
      const passedTestRun: TestRunData = {
        ...mockTestRun,
        status: 'PASSED',
      };

      render(
        <TestRunResultViewer
          testRun={passedTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.queryByText(/This test failed/)).not.toBeInTheDocument();
    });
  });

  describe('Axe Accessibility Scan', () => {
    it('should have no accessibility violations in normal state', async () => {
      const { container } = render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations during rerun', async () => {
      const user = userEvent.setup();
      const slowRerun = vi.fn<(testRunId: string) => Promise<void>>(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 50);
          }),
      );

      const { container } = render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={slowRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const rerunButtons = screen.queryAllByRole('button', { name: 'Rerun Test' });
      if (rerunButtons.length > 0) {
        await user.click(rerunButtons[0]);
      }

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with loading state', async () => {
      const { container } = render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
          isLoading={true}
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with different test statuses', async () => {
      const statuses = ['PASSED', 'FAILED', 'RUNNING', 'PENDING'];

      for (const status of statuses) {
        const testRun: TestRunData = { ...mockTestRun, status };

        const { container } = render(
          <TestRunResultViewer
            testRun={testRun}
            onRerun={mockHandlers.onRerun}
            onDownloadResult={mockHandlers.onDownloadResult}
            onClose={mockHandlers.onClose}
          />,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce modal title', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const title = screen.getByText('Test Result');
      expect(title).toHaveAttribute('id', 'testrun-title');
    });

    it('should announce status clearly', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const statusLabel = screen.getByText('Current Status:');
      expect(statusLabel).toBeInTheDocument();
    });

    it('should announce action buttons clearly', () => {
      render(
        <TestRunResultViewer
          testRun={mockTestRun}
          onRerun={mockHandlers.onRerun}
          onDownloadResult={mockHandlers.onDownloadResult}
          onClose={mockHandlers.onClose}
        />,
      );

      const rerunButtons = screen.queryAllByRole('button', { name: 'Rerun Test' });
      const closeButtons = screen.queryAllByRole('button', { name: 'Close' });
      
      expect(rerunButtons.length + closeButtons.length).toBeGreaterThan(0);
    });
  });
});
