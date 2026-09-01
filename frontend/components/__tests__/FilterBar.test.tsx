import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar, FilterBarProps } from '../FilterBar';
import { FilterState } from '../../lib/hooks/useFilter';

describe('FilterBar Component', () => {
  const mockOnFilterChange = vi.fn();

  const defaultFilters: FilterState = {
    search: '',
    statuses: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all sub-components', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-bar-search')).toBeInTheDocument();
      expect(screen.getByTestId('filter-bar-status')).toBeInTheDocument();
      expect(screen.getByTestId('filter-bar-dates')).toBeInTheDocument();
    });

    it('should not show Clear All button when no filters active', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      expect(screen.queryByTestId('filter-bar-clear-all')).not.toBeInTheDocument();
    });

    it('should show Clear All button when filters are active', () => {
      const filters: FilterState = {
        search: 'test',
        statuses: [],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-bar-clear-all')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const container = screen.getByTestId('filter-bar');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'Search and filter controls');
    });
  });

  describe('Search Functionality', () => {
    it('should dispatch SET_SEARCH action on search change', async () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Wait for debounce (300ms by default in SearchBar)
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(mockOnFilterChange).toHaveBeenCalled();
      const calls = mockOnFilterChange.mock.calls.filter((c) => c[0].type === 'SET_SEARCH');
      expect(calls).toHaveLength(1);
      expect(calls[0][0].payload).toBe('test');
    });

    it('should dispatch CLEAR_SEARCH on search clear', () => {
      const filters: FilterState = { search: 'test', statuses: [] };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const clearButton = screen.getByTestId('search-clear-btn');
      fireEvent.click(clearButton);

      const calls = mockOnFilterChange.mock.calls;
      const clearCall = calls.find((c) => c[0].type === 'CLEAR_SEARCH');
      expect(clearCall).toBeDefined();
    });
  });

  describe('Status Filter Functionality', () => {
    it('should dispatch TOGGLE_STATUS on status click', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const activeButton = screen.getByTestId('status-filter-pill-active');
      fireEvent.click(activeButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'TOGGLE_STATUS',
        payload: 'Active',
      });
    });

    it('should show selected statuses', () => {
      const filters: FilterState = {
        search: '',
        statuses: ['Active', 'Idle'],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const activeButton = screen.getByTestId('status-filter-pill-active');
      const idleButton = screen.getByTestId('status-filter-pill-idle');

      expect(activeButton).toHaveAttribute('aria-pressed', 'true');
      expect(idleButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Date Filter Functionality', () => {
    it('should dispatch SET_DATE_RANGE on date change', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const startDateInput = screen.getByTestId('date-range-filter-start');
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'SET_DATE_RANGE',
        payload: { start: '2026-01-01', end: undefined },
      });
    });

    it('should show selected dates', () => {
      const filters: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const startInput = screen.getByTestId('date-range-filter-start') as HTMLInputElement;
      const endInput = screen.getByTestId('date-range-filter-end') as HTMLInputElement;

      expect(startInput.value).toBe('2026-01-01');
      expect(endInput.value).toBe('2026-12-31');
    });
  });

  describe('Clear All Button', () => {
    it('should dispatch RESET_FILTERS on Clear All click', () => {
      const filters: FilterState = {
        search: 'test',
        statuses: ['Active'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const clearAllButton = screen.getByTestId('filter-bar-clear-all');
      fireEvent.click(clearAllButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'RESET_FILTERS',
      });
    });

    it('should show Clear All button only when filters exist', () => {
      const { rerender } = render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.queryByTestId('filter-bar-clear-all')).not.toBeInTheDocument();

      const filters: FilterState = { search: 'test', statuses: [] };
      rerender(
        <FilterBar
          filters={filters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByTestId('filter-bar-clear-all')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all sub-components when disabled', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
        disabled: true,
      };

      render(<FilterBar {...props} />);

      const searchInput = screen.getByRole('textbox');
      const statusButton = screen.getByTestId('status-filter-pill-active');
      const dateInput = screen.getByTestId('date-range-filter-start');

      expect(searchInput).toBeDisabled();
      expect(statusButton).toBeDisabled();
      expect(dateInput).toBeDisabled();
    });
  });

  describe('Props and Customization', () => {
    it('should use custom search placeholder', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
        searchPlaceholder: 'Search builds...',
      };

      render(<FilterBar {...props} />);

      const searchInput = screen.getByPlaceholderText('Search builds...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should use custom className', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
        className: 'custom-class',
      };

      render(<FilterBar {...props} />);

      const container = screen.getByTestId('filter-bar');
      expect(container).toHaveClass('custom-class');
    });

    it('should use custom data-testid', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
        'data-testid': 'custom-filter-bar',
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('custom-filter-bar')).toBeInTheDocument();
    });
  });

  describe('Integration - All Filters Together', () => {
    it('should handle complex filter combinations', () => {
      const filters: FilterState = {
        search: 'important',
        statuses: ['Active', 'Idle'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      // Verify all filters are displayed
      const searchInput = screen.getByRole('textbox');
      expect((searchInput as HTMLInputElement).value).toBe('important');

      const activeButton = screen.getByTestId('status-filter-pill-active');
      expect(activeButton).toHaveAttribute('aria-pressed', 'true');

      const startDateInput = screen.getByTestId('date-range-filter-start');
      expect((startDateInput as HTMLInputElement).value).toBe('2026-01-01');

      // Clear All should be visible
      expect(screen.getByTestId('filter-bar-clear-all')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('should have accessible buttons and controls', () => {
      const filters: FilterState = {
        search: 'test',
        statuses: [],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const clearButton = screen.getByTestId('filter-bar-clear-all');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear all filters');
    });
  });

  describe('FilterChips Integration', () => {
    it('should render FilterChips with current filters', () => {
      const filters: FilterState = {
        search: 'test',
        statuses: ['Active'],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-bar-chips')).toBeInTheDocument();
    });

    it('should display search chip when search is active', () => {
      const filters: FilterState = {
        search: 'important',
        statuses: [],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-chip-search')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-search')).toHaveTextContent('important');
    });

    it('should display status chips', () => {
      const filters: FilterState = {
        search: '',
        statuses: ['Active', 'Failed'],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-chip-status-Active')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-status-Failed')).toBeInTheDocument();
    });

    it('should dispatch CLEAR_SEARCH when search chip removed', () => {
      const filters: FilterState = {
        search: 'query',
        statuses: [],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const removeButton = screen.getByTestId('filter-chip-remove-search');
      fireEvent.click(removeButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({ type: 'CLEAR_SEARCH' });
    });

    it('should dispatch REMOVE_STATUS when status chip removed', () => {
      const filters: FilterState = {
        search: '',
        statuses: ['Active'],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      const removeButton = screen.getByTestId('filter-chip-remove-status-Active');
      fireEvent.click(removeButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        type: 'REMOVE_STATUS',
        payload: 'Active',
      });
    });

    it('should display date range chips when dates are active', () => {
      const filters: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: mockOnFilterChange,
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-chip-dateStart')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-dateEnd')).toBeInTheDocument();
    });

    it('should hide chips when no filters are active', () => {
      const props: FilterBarProps = {
        filters: defaultFilters,
        onFilterChange: mockOnFilterChange,
      };

      const { container } = render(<FilterBar {...props} />);

      const chipsContainer = screen.getByTestId('filter-bar-chips');
      expect(chipsContainer).toBeInTheDocument();
      // No individual chips should be rendered
      expect(container.querySelectorAll('[data-testid^="filter-chip-"]')).toHaveLength(0);
    });
  });
});
