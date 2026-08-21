import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangeFilter, DateRangeFilterProps } from '../DateRangeFilter';

describe('DateRangeFilter Component', () => {
  const mockOnDateChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render start and end date input fields', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.getByLabelText('From')).toBeInTheDocument();
      expect(screen.getByLabelText('To')).toBeInTheDocument();
    });

    it('should render with empty date fields by default', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start') as HTMLInputElement;
      const endInput = screen.getByTestId('date-range-filter-end') as HTMLInputElement;

      expect(startInput.value).toBe('');
      expect(endInput.value).toBe('');
    });

    it('should populate start and end dates when provided', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start') as HTMLInputElement;
      const endInput = screen.getByTestId('date-range-filter-end') as HTMLInputElement;

      expect(startInput.value).toBe('2026-01-01');
      expect(endInput.value).toBe('2026-12-31');
    });

    it('should not display error message when dates are valid', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should have correct accessibility attributes', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start');
      const endInput = screen.getByTestId('date-range-filter-end');

      expect(startInput).toHaveAttribute('aria-label', 'Start date');
      expect(endInput).toHaveAttribute('aria-label', 'End date');
    });
  });

  describe('Date Input Changes', () => {
    it('should call onDateChange when start date changes', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start');
      fireEvent.change(startInput, { target: { value: '2026-01-01' } });

      expect(mockOnDateChange).toHaveBeenCalledWith('2026-01-01', undefined);
    });

    it('should call onDateChange when end date changes', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const endInput = screen.getByTestId('date-range-filter-end');
      fireEvent.change(endInput, { target: { value: '2026-12-31' } });

      expect(mockOnDateChange).toHaveBeenCalledWith(undefined, '2026-12-31', undefined);
    });

    it('should clear start date when input is cleared', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-01-01',
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start');
      fireEvent.change(startInput, { target: { value: '' } });

      expect(mockOnDateChange).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should clear end date when input is cleared', () => {
      const props: DateRangeFilterProps = {
        endDate: '2026-12-31',
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const endInput = screen.getByTestId('date-range-filter-end');
      fireEvent.change(endInput, { target: { value: '' } });

      expect(mockOnDateChange).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });

  describe('Validation', () => {
    it('should display error when end date is before start date', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-12-31',
        endDate: '2026-01-01',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert.textContent).toContain('End date must be greater than or equal to start date');
    });

    it('should not display error when dates are equal', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-06-15',
        endDate: '2026-06-15',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not display error when only start date is provided', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-01-01',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not display error when only end date is provided', () => {
      const props: DateRangeFilterProps = {
        endDate: '2026-12-31',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should skip validation when validateStrict is false', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-12-31',
        endDate: '2026-01-01',
        onDateChange: mockOnDateChange,
        validateStrict: false,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should have aria-invalid on inputs when error is present', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-12-31',
        endDate: '2026-01-01',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start');
      const endInput = screen.getByTestId('date-range-filter-end');

      expect(startInput).toHaveAttribute('aria-invalid', 'true');
      expect(endInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should disable input fields when disabled prop is true', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
        disabled: true,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start');
      const endInput = screen.getByTestId('date-range-filter-end');

      expect(startInput).toBeDisabled();
      expect(endInput).toBeDisabled();
    });

    it('should not call onDateChange when disabled', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
        disabled: true,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start');
      fireEvent.change(startInput, { target: { value: '2026-01-01' } });

      expect(mockOnDateChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year dates', () => {
      const props: DateRangeFilterProps = {
        startDate: '2024-02-29',
        endDate: '2024-02-29',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle year-long date ranges', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle dates on different years', () => {
      const props: DateRangeFilterProps = {
        startDate: '2025-12-31',
        endDate: '2026-01-01',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      expect(screen.getByLabelText('From')).toBeInTheDocument();
      expect(screen.getByLabelText('To')).toBeInTheDocument();
    });

    it('should have aria-describedby when error is present', () => {
      const props: DateRangeFilterProps = {
        startDate: '2026-12-31',
        endDate: '2026-01-01',
        onDateChange: mockOnDateChange,
        validateStrict: true,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start');
      expect(startInput).toHaveAttribute('aria-describedby', 'date-error');
    });

    it('should have role="group" on container', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const container = screen.getByRole('group', { name: /Date range filter/i });
      expect(container).toBeInTheDocument();
    });

    it('should have focus ring on inputs', () => {
      const props: DateRangeFilterProps = {
        onDateChange: mockOnDateChange,
      };

      render(<DateRangeFilter {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start');
      expect(startInput).toHaveClass('focus:ring-2');
      expect(startInput).toHaveClass('focus:ring-blue-500');
    });
  });
});
