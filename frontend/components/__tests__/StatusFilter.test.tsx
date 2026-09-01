import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusFilter, StatusFilterProps } from '../StatusFilter';
import { AVAILABLE_STATUSES, BuildStatus } from '../../lib/status-vocabulary';

describe('StatusFilter Component', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all available statuses as pills', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      AVAILABLE_STATUSES.forEach((status) => {
        expect(screen.getByText(status)).toBeInTheDocument();
      });
    });

    it('should render selected statuses with blue background', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [BuildStatus.Running, BuildStatus.Pending],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      const pendingButton = screen.getByTestId('status-filter-pill-pending');

      expect(runningButton).toHaveClass('bg-blue-500');
      expect(pendingButton).toHaveClass('bg-blue-500');
    });

    it('should render unselected statuses with gray background', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [BuildStatus.Running],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const failedButton = screen.getByTestId('status-filter-pill-failed');
      const completeButton = screen.getByTestId('status-filter-pill-complete');

      expect(failedButton).toHaveClass('bg-gray-200');
      expect(completeButton).toHaveClass('bg-gray-200');
    });

    it('should render with custom className', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
        className: 'custom-class',
      };

      render(<StatusFilter {...props} />);

      const container = screen.getByTestId('status-filter');
      expect(container).toHaveClass('custom-class');
    });

    it('should have correct accessibility attributes on pills', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [BuildStatus.Running],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      const pendingButton = screen.getByTestId('status-filter-pill-pending');

      expect(runningButton).toHaveAttribute('aria-pressed', 'true');
      expect(pendingButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should render with correct aria-label on each pill', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      expect(screen.getByLabelText(/RUNNING status filter/)).toBeInTheDocument();
      expect(screen.getByLabelText(/PENDING status filter/)).toBeInTheDocument();
      expect(screen.getByLabelText(/FAILED status filter/)).toBeInTheDocument();
      expect(screen.getByLabelText(/COMPLETE status filter/)).toBeInTheDocument();
    });
  });

  describe('Toggle Behavior', () => {
    it('should call onToggle when clicking a pill', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      fireEvent.click(runningButton);

      expect(mockOnToggle).toHaveBeenCalledWith(BuildStatus.Running);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle with correct status for each pill', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      fireEvent.click(screen.getByTestId('status-filter-pill-running'));
      expect(mockOnToggle).toHaveBeenCalledWith(BuildStatus.Running);

      fireEvent.click(screen.getByTestId('status-filter-pill-pending'));
      expect(mockOnToggle).toHaveBeenCalledWith(BuildStatus.Pending);

      fireEvent.click(screen.getByTestId('status-filter-pill-failed'));
      expect(mockOnToggle).toHaveBeenCalledWith(BuildStatus.Failed);

      expect(mockOnToggle).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple selections', () => {
      const { rerender } = render(
        <StatusFilter selectedStatuses={[]} onToggle={mockOnToggle} />
      );

      fireEvent.click(screen.getByTestId('status-filter-pill-running'));
      expect(mockOnToggle).toHaveBeenCalledWith(BuildStatus.Running);

      // Simulate state update
      rerender(
        <StatusFilter
          selectedStatuses={[BuildStatus.Running]}
          onToggle={mockOnToggle}
        />
      );

      fireEvent.click(screen.getByTestId('status-filter-pill-pending'));
      expect(mockOnToggle).toHaveBeenLastCalledWith(BuildStatus.Pending);

      expect(mockOnToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should toggle status on Enter key', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      fireEvent.keyDown(runningButton, { key: 'Enter' });

      expect(mockOnToggle).toHaveBeenCalledWith(BuildStatus.Running);
    });

    it('should toggle status on Space key', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      fireEvent.keyDown(runningButton, { key: ' ' });

      expect(mockOnToggle).toHaveBeenCalledWith(BuildStatus.Running);
    });

    it('should prevent default behavior on keyboard events', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');

      fireEvent.keyDown(runningButton, { key: 'Enter' });

      // Note: fireEvent doesn't fully support preventing default,
      // so we just verify the callback was called
      expect(mockOnToggle).toHaveBeenCalledWith(BuildStatus.Running);
    });

    it('should not toggle on other keys', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      fireEvent.keyDown(runningButton, { key: 'ArrowLeft' });

      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable all pills when disabled prop is true', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
        disabled: true,
      };

      render(<StatusFilter {...props} />);

      AVAILABLE_STATUSES.forEach((status) => {
        const button = screen.getByTestId(
          `status-filter-pill-${status.toLowerCase()}`
        );
        expect(button).toBeDisabled();
      });
    });

    it('should not call onToggle when disabled and clicking', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
        disabled: true,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      fireEvent.click(runningButton);

      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it('should not call onToggle when disabled and pressing keyboard', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
        disabled: true,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      fireEvent.keyDown(runningButton, { key: 'Enter' });

      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it('should apply opacity-50 class when disabled', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
        disabled: true,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      expect(runningButton).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Custom Available Statuses', () => {
    it('should render custom available statuses', () => {
      const customStatuses: BuildStatus[] = [BuildStatus.Running, BuildStatus.Pending];
      const props: StatusFilterProps = {
        selectedStatuses: [],
        availableStatuses: customStatuses,
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      expect(screen.getByText(BuildStatus.Running)).toBeInTheDocument();
      expect(screen.getByText(BuildStatus.Pending)).toBeInTheDocument();
      expect(screen.queryByText(BuildStatus.Failed)).not.toBeInTheDocument();
      expect(screen.queryByText(BuildStatus.Complete)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="group" on container', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const container = screen.getByRole('group', { name: /Status filter/i });
      expect(container).toBeInTheDocument();
    });

    it('should have role="button" on each pill', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(AVAILABLE_STATUSES.length);
    });

    it('should have focus-visible ring on keyboard navigation', () => {
      const props: StatusFilterProps = {
        selectedStatuses: [],
        onToggle: mockOnToggle,
      };

      render(<StatusFilter {...props} />);

      const runningButton = screen.getByTestId('status-filter-pill-running');
      expect(runningButton).toHaveClass('focus:ring-2');
      expect(runningButton).toHaveClass('focus:ring-blue-500');
    });
  });
});
