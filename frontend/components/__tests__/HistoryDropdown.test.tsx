import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HistoryDropdown } from '../HistoryDropdown';
import { FilterHistoryState, FilterHistoryItem } from '../../lib/hooks/useFilterHistory';
import { FilterState } from '../../lib/hooks/useFilter';
import { BuildStatus } from '../../lib/status-vocabulary';

describe('HistoryDropdown Component', () => {
  const mockFilterState1: FilterState = {
    search: 'test1',
    statuses: [BuildStatus.Running],
  };

  const mockFilterState2: FilterState = {
    search: 'test2',
    statuses: [BuildStatus.Failed],
    dateStart: '2024-01-01',
    dateEnd: '2024-12-31',
  };

  const mockHistoryItem1: FilterHistoryItem = {
    id: 'item-1',
    state: mockFilterState1,
    timestamp: Date.now() - 60000, // 1 minute ago
    label: 'Search for test1',
  };

  const mockHistoryItem2: FilterHistoryItem = {
    id: 'item-2',
    state: mockFilterState2,
    timestamp: Date.now() - 120000, // 2 minutes ago
  };

  const mockHistoryState: FilterHistoryState = {
    items: [mockHistoryItem1, mockHistoryItem2],
    maxItems: 20,
  };

  const emptyHistoryState: FilterHistoryState = {
    items: [],
    maxItems: 20,
  };

  describe('Rendering', () => {
    it('should render dropdown container', () => {
      const { container } = render(
        <HistoryDropdown
          history={emptyHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={false}
          onToggleOpen={vi.fn()}
        />
      );

      expect(container.querySelector('[data-testid="history-dropdown"]')).toBeTruthy();
    });

    it('should not render dropdown menu when closed', () => {
      render(
        <HistoryDropdown
          history={emptyHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={false}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should render dropdown menu when open', () => {
      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should show empty state when no history items', () => {
      render(
        <HistoryDropdown
          history={emptyHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.getByText('No filter history yet')).toBeInTheDocument();
    });

    it('should not show empty state when history items exist', () => {
      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.queryByText('No filter history yet')).not.toBeInTheDocument();
    });
  });

  describe('History Items Display', () => {
    it('should display all history items', () => {
      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.getByText('Search for test1')).toBeInTheDocument();
      expect(screen.getByText(/Status: Failed/)).toBeInTheDocument();
    });

    it('should display user-provided label for items', () => {
      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.getByText('Search for test1')).toBeInTheDocument();
    });

    it('should display summarized filters when no label provided', () => {
      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.getByText(/Status: Failed/)).toBeInTheDocument();
      expect(screen.getByText(/Dates:/)).toBeInTheDocument();
    });

    it('should display timestamps for each item', () => {
      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      // Should have time display
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should display remove buttons for each item', () => {
      const { container } = render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      const removeButtons = container.querySelectorAll('[data-testid^="history-dropdown-remove-"]');
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe('User Interactions', () => {
    it('should call onSelectHistory when item is clicked', () => {
      const onSelectHistory = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={onSelectHistory}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      const firstItem = screen.getByText('Search for test1').closest('[role="menuitem"]');
      fireEvent.click(firstItem!);

      expect(onSelectHistory).toHaveBeenCalledWith(mockHistoryItem1);
    });

    it('should close dropdown after selecting an item', () => {
      const onToggleOpen = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={onToggleOpen}
        />
      );

      const firstItem = screen.getByText('Search for test1').closest('[role="menuitem"]');
      fireEvent.click(firstItem!);

      expect(onToggleOpen).toHaveBeenCalledWith(false);
    });

    it('should call onRemoveHistory when remove button is clicked', () => {
      const onRemoveHistory = vi.fn();
      const { container } = render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={onRemoveHistory}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      const removeButton = container.querySelector(
        '[data-testid="history-dropdown-remove-item-1"]'
      ) as HTMLElement;

      fireEvent.click(removeButton);

      expect(onRemoveHistory).toHaveBeenCalledWith('item-1');
    });

    it('should not call onSelectHistory when remove button is clicked', () => {
      const onSelectHistory = vi.fn();
      const onRemoveHistory = vi.fn();
      const { container } = render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={onSelectHistory}
          onRemoveHistory={onRemoveHistory}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      const removeButton = container.querySelector(
        '[data-testid="history-dropdown-remove-item-1"]'
      ) as HTMLElement;

      fireEvent.click(removeButton);

      expect(onSelectHistory).not.toHaveBeenCalled();
    });

    it('should call onClearHistory when clear button is clicked', () => {
      const onClearHistory = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={onClearHistory}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      const clearButton = screen.getByText('Clear History');
      fireEvent.click(clearButton);

      expect(onClearHistory).toHaveBeenCalled();
    });

    it('should close dropdown after clearing history', () => {
      const onToggleOpen = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={onToggleOpen}
        />
      );

      const clearButton = screen.getByText('Clear History');
      fireEvent.click(clearButton);

      expect(onToggleOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close dropdown when Escape key is pressed', () => {
      const onToggleOpen = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={onToggleOpen}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onToggleOpen).toHaveBeenCalledWith(false);
    });

    it('should select item when Enter key is pressed on menuitem', () => {
      const onSelectHistory = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={onSelectHistory}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      const firstItem = screen.getByText('Search for test1').closest('[role="menuitem"]') as HTMLElement;
      fireEvent.keyDown(firstItem, { key: 'Enter' });

      expect(onSelectHistory).toHaveBeenCalledWith(mockHistoryItem1);
    });

    it('should select item when Space key is pressed on menuitem', () => {
      const onSelectHistory = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={onSelectHistory}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      const firstItem = screen.getByText('Search for test1').closest('[role="menuitem"]') as HTMLElement;
      fireEvent.keyDown(firstItem, { key: ' ' });

      expect(onSelectHistory).toHaveBeenCalledWith(mockHistoryItem1);
    });
  });

  describe('Click Outside Handling', () => {
    it('should close dropdown when clicking outside', () => {
      const onToggleOpen = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={onToggleOpen}
        />
      );

      fireEvent.mouseDown(document.body);

      expect(onToggleOpen).toHaveBeenCalledWith(false);
    });

    it('should not close dropdown when clicking inside dropdown', () => {
      const onToggleOpen = vi.fn();

      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={onToggleOpen}
        />
      );

      const menuItem = screen.getByText('Search for test1');
      fireEvent.mouseDown(menuItem);

      expect(onToggleOpen).not.toHaveBeenCalled();
    });
  });

  describe('Props and Styling', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <HistoryDropdown
          history={emptyHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={false}
          onToggleOpen={vi.fn()}
          className="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeTruthy();
    });

    it('should accept custom data-testid', () => {
      const { container } = render(
        <HistoryDropdown
          history={emptyHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={false}
          onToggleOpen={vi.fn()}
          data-testid="custom-history-dropdown"
        />
      );

      expect(container.querySelector('[data-testid="custom-history-dropdown"]')).toBeTruthy();
    });
  });

  describe('Empty State Handling', () => {
    it('should not display clear button when history is empty', () => {
      render(
        <HistoryDropdown
          history={emptyHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.queryByText('Clear History')).not.toBeInTheDocument();
    });

    it('should display "No filter history yet" message when empty', () => {
      render(
        <HistoryDropdown
          history={emptyHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.getByText('No filter history yet')).toBeInTheDocument();
    });
  });

  describe('Filter Summary Display', () => {
    it('should summarize search term in filter display', () => {
      const stateWithSearch: FilterState = {
        search: 'my search',
        statuses: [],
      };

      const itemWithSearch: FilterHistoryItem = {
        id: 'test-id',
        state: stateWithSearch,
        timestamp: Date.now(),
      };

      const historyWithSearch: FilterHistoryState = {
        items: [itemWithSearch],
        maxItems: 20,
      };

      render(
        <HistoryDropdown
          history={historyWithSearch}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.getByText(/"my search"/)).toBeInTheDocument();
    });

    it('should display "No filters" when all fields are empty', () => {
      const emptyState: FilterState = {
        search: '',
        statuses: [],
      };

      const emptyItem: FilterHistoryItem = {
        id: 'test-id',
        state: emptyState,
        timestamp: Date.now(),
      };

      const historyWithEmpty: FilterHistoryState = {
        items: [emptyItem],
        maxItems: 20,
      };

      render(
        <HistoryDropdown
          history={historyWithEmpty}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      expect(screen.getByText('No filters')).toBeInTheDocument();
    });
  });
  describe('Exit animation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const renderDropdown = (isOpen: boolean): ReturnType<typeof render> =>
      render(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={isOpen}
          onToggleOpen={vi.fn()}
        />
      );

    it('should keep the menu mounted at 199ms after closing and remove it at 200ms', () => {
      const { rerender } = renderDropdown(true);

      expect(screen.getByRole('menu')).toBeInTheDocument();

      rerender(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={false}
          onToggleOpen={vi.fn()}
        />
      );

      // Still mounted immediately after close so the fade-out can run
      expect(screen.getByRole('menu')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(screen.getByRole('menu')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should fade the menu out by switching to opacity-0 while still mounted', () => {
      const { rerender } = renderDropdown(true);

      expect(screen.getByRole('menu').className).toContain('opacity-100');

      rerender(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={false}
          onToggleOpen={vi.fn()}
        />
      );

      const menu = screen.getByRole('menu');
      expect(menu.className).toContain('opacity-0');
      expect(menu.className).toContain('transition-opacity');
      expect(menu.className).toContain('duration-200');
    });

    it('should cancel the pending hide when reopened before the delay elapses', () => {
      const { rerender } = renderDropdown(true);

      rerender(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={false}
          onToggleOpen={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(150);
      });

      rerender(
        <HistoryDropdown
          history={mockHistoryState}
          onSelectHistory={vi.fn()}
          onRemoveHistory={vi.fn()}
          onClearHistory={vi.fn()}
          isOpen={true}
          onToggleOpen={vi.fn()}
        />
      );

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menu').className).toContain('opacity-100');
    });
  });
});
