/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FilterChips } from '../components/FilterChips';
import type { FilterState } from '../lib/hooks/useFilter';
import { BuildStatus, STATUS_LABELS } from '../lib/status-vocabulary';

describe('FilterChips Component', () => {
  describe('Rendering', () => {
    it('should return null when no searchTerm', () => {
      const handleRemove = vi.fn();
      const { container } = render(
        <FilterChips searchTerm="" onRemove={handleRemove} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should display search term as chip', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="important" onRemove={handleRemove} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('important');
    });

    it('should truncate long search terms', () => {
      const handleRemove = vi.fn();
      const longTerm = 'a'.repeat(40);

      render(
        <FilterChips searchTerm={longTerm} onRemove={handleRemove} maxLength={30} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toHaveTextContent('a'.repeat(30) + '...');
    });

    it('should display full term in title attribute', () => {
      const handleRemove = vi.fn();
      const longTerm = 'a'.repeat(40);

      render(
        <FilterChips searchTerm={longTerm} onRemove={handleRemove} maxLength={30} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toHaveAttribute('title', longTerm);
    });

    it('should have remove button with aria-label', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="test" onRemove={handleRemove} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove');
      expect(removeButton).toHaveAttribute('aria-label', 'Remove filter: test');
    });
  });

  describe('Remove Functionality', () => {
    it('should call onRemove when remove button clicked', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="test" onRemove={handleRemove} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove');
      fireEvent.click(removeButton);

      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('should call onRemove with correct search term in aria-label', () => {
      const handleRemove = vi.fn();
      const searchTerm = 'specific-term';

      render(
        <FilterChips searchTerm={searchTerm} onRemove={handleRemove} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove');
      expect(removeButton).toHaveAttribute(
        'aria-label',
        `Remove filter: ${searchTerm}`
      );
    });
  });

  describe('Styling', () => {
    it('should have blue chip styling classes', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="test" onRemove={handleRemove} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toHaveClass('bg-blue-100');
      expect(chip).toHaveClass('text-blue-900');
    });

    it('should render filter-chips container', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="test" onRemove={handleRemove} />
      );

      const container = screen.getByTestId('filter-chips');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only search term', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="   " onRemove={handleRemove} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toBeInTheDocument();
      // The chip contains the text plus the close button
      expect(chip.textContent).toContain('   ');
    });

    it('should handle very short search term', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="a" onRemove={handleRemove} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toHaveTextContent('a');
    });
  });

  describe('Multi-Filter Mode', () => {
    it('should render empty container when no filters are active', () => {
      const handleRemoveFilter = vi.fn();
      const emptyFilters: FilterState = {
        search: '',
        statuses: [],
      };

      render(
        <FilterChips filters={emptyFilters} onRemoveFilter={handleRemoveFilter} />
      );

      // Should render container even when empty
      const container = screen.getByTestId('filter-chips');
      expect(container).toBeInTheDocument();
      // But no individual chips should be rendered
      expect(container.children).toHaveLength(0);
    });

    it('should render search term chip when search is active', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: 'query',
        statuses: [],
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      const searchChip = screen.getByTestId('filter-chip-search');
      expect(searchChip).toBeInTheDocument();
      expect(searchChip).toHaveTextContent('query');
    });

    it('should render status chips for each selected status', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: '',
        statuses: [BuildStatus.Running, BuildStatus.Failed],
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      const runningChip = screen.getByTestId('filter-chip-status-RUNNING');
      const failedChip = screen.getByTestId('filter-chip-status-FAILED');

      // Chip data-testid is keyed on the wire value; the text is the label.
      expect(runningChip).toBeInTheDocument();
      expect(runningChip).toHaveTextContent(STATUS_LABELS[BuildStatus.Running]);
      expect(runningChip).not.toHaveTextContent(BuildStatus.Running);
      expect(failedChip).toBeInTheDocument();
      expect(failedChip).toHaveTextContent(STATUS_LABELS[BuildStatus.Failed]);
      expect(failedChip).not.toHaveTextContent(BuildStatus.Failed);
    });

    it('should render date range chips', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      const startChip = screen.getByTestId('filter-chip-dateStart');
      const endChip = screen.getByTestId('filter-chip-dateEnd');

      expect(startChip).toBeInTheDocument();
      expect(startChip).toHaveTextContent('From 2026-01-01');
      expect(endChip).toBeInTheDocument();
      expect(endChip).toHaveTextContent('Until 2026-12-31');
    });

    it('should render all active dimensions together', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: 'important',
        statuses: [BuildStatus.Running, BuildStatus.Pending],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      // Verify all chips are rendered
      expect(screen.getByTestId('filter-chip-search')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-status-RUNNING')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-status-PENDING')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-dateStart')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-dateEnd')).toBeInTheDocument();
    });

    it('should dispatch CLEAR_SEARCH action when search chip remove clicked', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: 'query',
        statuses: [],
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove-search');
      fireEvent.click(removeButton);

      expect(handleRemoveFilter).toHaveBeenCalledWith({ type: 'CLEAR_SEARCH' });
    });

    it('should dispatch REMOVE_STATUS action when status chip remove clicked', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: '',
        statuses: [BuildStatus.Running, BuildStatus.Failed],
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove-status-RUNNING');
      fireEvent.click(removeButton);

      expect(handleRemoveFilter).toHaveBeenCalledWith({
        type: 'REMOVE_STATUS',
        payload: BuildStatus.Running,
      });
    });

    it('should dispatch SET_DATE_RANGE action when date chip remove clicked', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove-dateStart');
      fireEvent.click(removeButton);

      expect(handleRemoveFilter).toHaveBeenCalledWith({
        type: 'SET_DATE_RANGE',
        payload: { start: undefined, end: '2026-12-31' },
      });
    });

    it('should truncate long status names and search terms in multi-filter mode', () => {
      const handleRemoveFilter = vi.fn();
      const longSearch = 'a'.repeat(40);
      const filters: FilterState = {
        search: longSearch,
        statuses: [BuildStatus.Running],
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} maxLength={30} />
      );

      const searchChip = screen.getByTestId('filter-chip-search');
      expect(searchChip).toHaveTextContent('a'.repeat(30) + '...');
    });

    it('should render with correct styling classes', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: 'test',
        statuses: [BuildStatus.Running],
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      const searchChip = screen.getByTestId('filter-chip-search');
      expect(searchChip).toHaveClass('bg-blue-100');
      expect(searchChip).toHaveClass('text-blue-900');
      expect(searchChip).toHaveClass('rounded-full');
    });

    it('should render flex container for multiple chips', () => {
      const handleRemoveFilter = vi.fn();
      const filters: FilterState = {
        search: 'query',
        statuses: [BuildStatus.Running],
      };

      render(
        <FilterChips filters={filters} onRemoveFilter={handleRemoveFilter} />
      );

      const container = screen.getByTestId('filter-chips');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('flex-wrap');
      expect(container).toHaveClass('gap-2');
    });
  });
});
