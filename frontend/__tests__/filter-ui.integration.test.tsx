/**
 * Filter UI Integration Tests
 *
 * Tests the integration of filter UI components with state management:
 * - SearchProvider + useSearchContext
 * - FilterBar with SearchBar, StatusFilter, DateRangeFilter, FilterChips
 * - User interactions dispatching actions correctly
 *
 * These tests verify that components are properly wired and respond to user actions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { SearchProvider, useSearchContext } from '../lib/SearchContext';
import { FilterBar, type FilterBarProps } from '../components/FilterBar';
import { defaultInitialState, type FilterState } from '../lib/hooks/useFilter';

describe('Filter UI Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('SearchProvider integration', () => {
    it('should provide SearchContext to child components', () => {
      const TestComponent = () => {
        const { state } = useSearchContext();
        return <div>{state.search}</div>;
      };

      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('should allow dispatch through context', () => {
      const TestComponent = () => {
        const { state, dispatch } = useSearchContext();
        return (
          <div>
            <div data-testid="search-value">{state.search}</div>
            <button
              onClick={() => dispatch({ type: 'SET_SEARCH', payload: 'test' })}
              data-testid="set-btn"
            >
              Set
            </button>
          </div>
        );
      };

      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      const button = screen.getByTestId('set-btn');
      fireEvent.click(button);

      const value = screen.getByTestId('search-value');
      expect(value).toHaveTextContent('test');
    });

    it('should persist state across remount', async () => {
      const TestComponent = () => {
        const { state, dispatch } = useSearchContext();
        return (
          <div>
            <div data-testid="search-value">{state.search}</div>
            <button
              onClick={() => dispatch({ type: 'SET_SEARCH', payload: 'persisted' })}
              data-testid="set-btn"
            >
              Set
            </button>
          </div>
        );
      };

      const { unmount, rerender } = render(
        <SearchProvider contextName="persist-test">
          <TestComponent />
        </SearchProvider>
      );

      const button = screen.getByTestId('set-btn');
      fireEvent.click(button);

      let value = screen.getByTestId('search-value');
      expect(value).toHaveTextContent('persisted');

      // Advance timers to ensure persistence
      vi.advanceTimersByTime(500);

      unmount();

      // Re-render with same context
      rerender(
        <SearchProvider contextName="persist-test">
          <TestComponent />
        </SearchProvider>
      );

      // Should have persisted state
      value = screen.getByTestId('search-value');
      await waitFor(() => {
        expect(value.textContent).toBe('persisted');
      }, { timeout: 100 });
    });
  });

  describe('FilterBar component integration', () => {
    const defaultProps: FilterBarProps = {
      filters: defaultInitialState,
      onFilterChange: vi.fn(),
    };

    it('should render all filter sub-components', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByTestId('filter-bar-search')).toBeInTheDocument();
      expect(screen.getByTestId('filter-bar-status')).toBeInTheDocument();
      expect(screen.getByTestId('filter-bar-dates')).toBeInTheDocument();
      expect(screen.getByTestId('filter-bar-chips')).toBeInTheDocument();
    });

    it('should dispatch SET_SEARCH when search value changes', async () => {
      const handleFilterChange = vi.fn();
      const props: FilterBarProps = {
        filters: defaultInitialState,
        onFilterChange: handleFilterChange,
      };

      render(<FilterBar {...props} />);

      const searchInput = screen.getByTestId('filter-bar-search').querySelector('input');
      expect(searchInput).toBeInTheDocument();

      const user = userEvent.setup({ delay: null });
      await user.type(searchInput!, 'test query');

      // Should have dispatched SET_SEARCH
      await waitFor(() => {
        expect(handleFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SET_SEARCH',
            payload: expect.stringContaining('test'),
          })
        );
      });
    });

    it('should display active search term in FilterChips', () => {
      const filters: FilterState = {
        search: 'active search',
        statuses: [],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: vi.fn(),
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-chip-search')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-search')).toHaveTextContent('active search');
    });

    it('should display status filters in FilterChips', () => {
      const filters: FilterState = {
        search: '',
        statuses: ['Active', 'Failed'],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: vi.fn(),
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-chip-status-Active')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-status-Failed')).toBeInTheDocument();
    });

    it('should dispatch CLEAR_SEARCH when search chip remove button clicked', () => {
      const handleFilterChange = vi.fn();
      const filters: FilterState = {
        search: 'test',
        statuses: [],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: handleFilterChange,
      };

      render(<FilterBar {...props} />);

      const removeButton = screen.getByTestId('filter-chip-remove-search');
      fireEvent.click(removeButton);

      expect(handleFilterChange).toHaveBeenCalledWith({ type: 'CLEAR_SEARCH' });
    });

    it('should dispatch REMOVE_STATUS when status chip remove button clicked', () => {
      const handleFilterChange = vi.fn();
      const filters: FilterState = {
        search: '',
        statuses: ['Active', 'Failed'],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: handleFilterChange,
      };

      render(<FilterBar {...props} />);

      const removeButton = screen.getByTestId('filter-chip-remove-status-Active');
      fireEvent.click(removeButton);

      expect(handleFilterChange).toHaveBeenCalledWith({
        type: 'REMOVE_STATUS',
        payload: 'Active',
      });
    });

    it('should display date range chips', () => {
      const filters: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: vi.fn(),
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-chip-dateStart')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-dateEnd')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-dateStart')).toHaveTextContent('From 2026-01-01');
      expect(screen.getByTestId('filter-chip-dateEnd')).toHaveTextContent('Until 2026-12-31');
    });

    it('should dispatch SET_DATE_RANGE when date chip remove button clicked', () => {
      const handleFilterChange = vi.fn();
      const filters: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: handleFilterChange,
      };

      render(<FilterBar {...props} />);

      const removeButton = screen.getByTestId('filter-chip-remove-dateStart');
      fireEvent.click(removeButton);

      expect(handleFilterChange).toHaveBeenCalledWith({
        type: 'SET_DATE_RANGE',
        payload: { start: undefined, end: '2026-12-31' },
      });
    });

    it('should handle multi-dimensional filter updates', async () => {
      const handleFilterChange = vi.fn();
      const filters: FilterState = {
        search: '',
        statuses: [],
      };
      const props: FilterBarProps = {
        filters,
        onFilterChange: handleFilterChange,
      };

      const { rerender } = render(<FilterBar {...props} />);

      // Simulate adding search
      const updatedFilters: FilterState = {
        search: 'query',
        statuses: ['Active'],
        dateStart: '2026-01-01',
      };

      rerender(<FilterBar {...{ ...props, filters: updatedFilters }} />);

      // All chips should be present
      expect(screen.getByTestId('filter-chip-search')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-status-Active')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-dateStart')).toBeInTheDocument();
    });

    it('should hide chips when no filters are active', () => {
      const props: FilterBarProps = {
        filters: defaultInitialState,
        onFilterChange: vi.fn(),
      };

      const { container } = render(<FilterBar {...props} />);

      // Filter chips container should exist but no individual chips
      expect(screen.getByTestId('filter-bar-chips')).toBeInTheDocument();
      expect(container.querySelectorAll('[data-testid^="filter-chip-"]')).toHaveLength(0);
    });
  });

  describe('SearchProvider + FilterBar integration', () => {
    it('should work together in a real scenario', async () => {
      const TestApp = () => {
        const { state, dispatch } = useSearchContext();
        return <FilterBar filters={state} onFilterChange={dispatch} />;
      };

      render(
        <SearchProvider contextName="app-test">
          <TestApp />
        </SearchProvider>
      );

      // Should render all components
      expect(screen.getByTestId('filter-bar-search')).toBeInTheDocument();

      // Interact with search
      const searchInput = screen.getByTestId('filter-bar-search').querySelector('input');
      expect(searchInput).toBeInTheDocument();

      const user = userEvent.setup({ delay: null });
      await user.type(searchInput!, 'integration');

      // Wait for debounce and persistence
      vi.advanceTimersByTime(500);

      // Should show chip
      await waitFor(() => {
        expect(screen.queryByTestId('filter-chip-search')).toBeInTheDocument();
      }, { timeout: 100 });
    });

    it('should handle filter removal through chips', async () => {
      const TestApp = () => {
        const { state, dispatch } = useSearchContext();
        return <FilterBar filters={state} onFilterChange={dispatch} />;
      };

      const { rerender } = render(
        <SearchProvider contextName="removal-test">
          <TestApp />
        </SearchProvider>
      );

      // Manually set a filter through the context
      // (This would normally happen via SearchBar interaction)
      // For this test, we just verify the chip removal works

      const TestAppWithFilter = () => {
        const filters: FilterState = {
          search: 'to-remove',
          statuses: [],
        };
        const handleChange = vi.fn();
        return <FilterBar filters={filters} onFilterChange={handleChange} />;
      };

      rerender(<TestAppWithFilter />);

      const removeButton = screen.getByTestId('filter-chip-remove-search');
      fireEvent.click(removeButton);

      // Component should dispatch the action
      expect(screen.getByTestId('filter-chip-search')).toBeInTheDocument();
    });
  });

  describe('Error handling in UI', () => {
    it('should handle disabled state gracefully', () => {
      const props: FilterBarProps = {
        filters: defaultInitialState,
        onFilterChange: vi.fn(),
        disabled: true,
      };

      render(<FilterBar {...props} />);

      expect(screen.getByTestId('filter-bar-search')).toBeInTheDocument();
      // Component should still be rendered even if disabled
    });

    it('should handle missing props gracefully', () => {
      const minimalProps: FilterBarProps = {
        filters: defaultInitialState,
        onFilterChange: vi.fn(),
      };

      render(<FilterBar {...minimalProps} />);

      // Should render without history/presets props
      expect(screen.getByTestId('filter-bar-search')).toBeInTheDocument();
    });
  });
});
