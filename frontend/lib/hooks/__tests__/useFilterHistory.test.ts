import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useFilterHistory,
  filterHistoryReducer,
  defaultFilterHistoryState,
  FilterHistoryState,
  FilterHistoryItem,
} from '../useFilterHistory';
import { FilterState } from '../useFilter';
import { BuildStatus } from '../../status-vocabulary';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test data
const mockFilterState1: FilterState = {
  search: 'test1',
  statuses: [BuildStatus.Running],
};

const mockFilterState2: FilterState = {
  search: 'test2',
  statuses: [BuildStatus.Failed, BuildStatus.Pending],
  dateStart: '2024-01-01',
};

const mockFilterState3: FilterState = {
  search: 'test3',
  statuses: [],
};

describe('useFilterHistory Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Initial State', () => {
    it('should initialize with empty history', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      expect(result.current[0].items).toEqual([]);
      expect(result.current[0].maxItems).toBe(20);
    });

    it('should initialize with custom maxItems', () => {
      const { result } = renderHook(() => useFilterHistory('test', 10));

      expect(result.current[0].maxItems).toBe(10);
    });

    it('should have convenience methods', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      const [, , methods] = result.current;
      expect(typeof methods.addToHistory).toBe('function');
      expect(typeof methods.removeFromHistory).toBe('function');
      expect(typeof methods.clearHistory).toBe('function');
    });
  });

  describe('ADD_TO_HISTORY Action', () => {
    it('should add a new filter state to history', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      expect(result.current[0].items).toHaveLength(1);
      expect(result.current[0].items[0].state).toEqual(mockFilterState1);
    });

    it('should add new items to the beginning (most recent first)', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      act(() => {
        result.current[2].addToHistory(mockFilterState2);
      });

      expect(result.current[0].items).toHaveLength(2);
      expect(result.current[0].items[0].state).toEqual(mockFilterState2);
      expect(result.current[0].items[1].state).toEqual(mockFilterState1);
    });

    it('should not add duplicate filter state (same state back-to-back)', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      expect(result.current[0].items).toHaveLength(1);
    });

    it('should enforce maximum items limit (20 default)', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      // Add 25 items
      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current[2].addToHistory({
            search: `search-${i}`,
            statuses: [],
          });
        }
      });

      expect(result.current[0].items).toHaveLength(20);
      // Most recent (search-24) should be first
      expect(result.current[0].items[0].state.search).toBe('search-24');
      // Oldest (search-5) should be last
      expect(result.current[0].items[19].state.search).toBe('search-5');
    });

    it('should enforce custom maxItems limit', () => {
      const { result } = renderHook(() => useFilterHistory('test', 5));

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current[2].addToHistory({
            search: `search-${i}`,
            statuses: [],
          });
        }
      });

      expect(result.current[0].items).toHaveLength(5);
      expect(result.current[0].items[0].state.search).toBe('search-9');
      expect(result.current[0].items[4].state.search).toBe('search-5');
    });

    it('should support optional label for history items', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1, 'My saved search');
      });

      expect(result.current[0].items[0].label).toBe('My saved search');
    });

    it('should generate unique IDs for each history item', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
        result.current[2].addToHistory(mockFilterState2);
      });

      const id1 = result.current[0].items[1].id;
      const id2 = result.current[0].items[0].id;

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should capture timestamp for each history item', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      const beforeTime = Date.now();

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      const afterTime = Date.now();

      expect(result.current[0].items[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.current[0].items[0].timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('REMOVE_FROM_HISTORY Action', () => {
    it('should remove a specific history item by ID', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      let itemId: string;

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      itemId = result.current[0].items[0].id;

      act(() => {
        result.current[2].removeFromHistory(itemId);
      });

      expect(result.current[0].items).toHaveLength(0);
    });

    it('should only remove the specified item, not others', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
        result.current[2].addToHistory(mockFilterState2);
        result.current[2].addToHistory(mockFilterState3);
      });

      const idToRemove = result.current[0].items[1].id;

      act(() => {
        result.current[2].removeFromHistory(idToRemove);
      });

      expect(result.current[0].items).toHaveLength(2);
      expect(result.current[0].items.some((item) => item.id === idToRemove)).toBe(false);
    });

    it('should handle removing non-existent ID gracefully', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      act(() => {
        result.current[2].removeFromHistory('non-existent-id');
      });

      expect(result.current[0].items).toHaveLength(1);
    });
  });

  describe('CLEAR_HISTORY Action', () => {
    it('should clear all history items', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
        result.current[2].addToHistory(mockFilterState2);
        result.current[2].addToHistory(mockFilterState3);
      });

      expect(result.current[0].items).toHaveLength(3);

      act(() => {
        result.current[2].clearHistory();
      });

      expect(result.current[0].items).toHaveLength(0);
    });

    it('should preserve maxItems setting after clearing history', () => {
      const { result } = renderHook(() => useFilterHistory('test', 15));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      act(() => {
        result.current[2].clearHistory();
      });

      expect(result.current[0].maxItems).toBe(15);
      expect(result.current[0].items).toHaveLength(0);
    });
  });

  describe('Reducer Function', () => {
    it('should handle unknown actions by returning current state', () => {
      const state: FilterHistoryState = {
        items: [],
        maxItems: 20,
      };

      const unknownAction = { type: 'UNKNOWN_ACTION' } as any;
      const result = filterHistoryReducer(state, unknownAction);

      expect(result).toEqual(state);
    });

    it('should hydrate from storage correctly', () => {
      const mockItem: FilterHistoryItem = {
        id: 'test-id',
        state: mockFilterState1,
        timestamp: Date.now(),
      };

      const storedState: FilterHistoryState = {
        items: [mockItem],
        maxItems: 20,
      };

      const state = defaultFilterHistoryState;
      const result = filterHistoryReducer(state, {
        type: 'HYDRATE_FROM_STORAGE',
        payload: storedState,
      });

      expect(result).toEqual(storedState);
    });

    it('should update maxItems setting', () => {
      const state: FilterHistoryState = {
        items: [],
        maxItems: 20,
      };

      const result = filterHistoryReducer(state, {
        type: 'SET_MAX_ITEMS',
        payload: 10,
      });

      expect(result.maxItems).toBe(10);
    });

    it('should enforce minimum maxItems of 5', () => {
      const state: FilterHistoryState = {
        items: [],
        maxItems: 20,
      };

      const result = filterHistoryReducer(state, {
        type: 'SET_MAX_ITEMS',
        payload: 2,
      });

      expect(result.maxItems).toBe(5);
    });

    it('should trim items when reducing maxItems', () => {
      const items: FilterHistoryItem[] = [];
      for (let i = 0; i < 20; i++) {
        items.push({
          id: `id-${i}`,
          state: { search: `search-${i}`, statuses: [] },
          timestamp: Date.now(),
        });
      }

      const state: FilterHistoryState = {
        items,
        maxItems: 20,
      };

      const result = filterHistoryReducer(state, {
        type: 'SET_MAX_ITEMS',
        payload: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.maxItems).toBe(5);
    });
  });

  describe('localStorage Integration', () => {
    it('should persist history to localStorage', () => {
      const { result } = renderHook(() => useFilterHistory('test-context'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      const stored = window.localStorage.getItem('filter-history:test-context');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].state).toEqual(mockFilterState1);
    });

    it('should restore history from localStorage on mount', () => {
      // First hook adds data
      const { result: result1 } = renderHook(() => useFilterHistory('shared-context'));

      act(() => {
        result1.current[2].addToHistory(mockFilterState1);
        result1.current[2].addToHistory(mockFilterState2);
      });

      // Second hook should load same data
      const { result: result2 } = renderHook(() => useFilterHistory('shared-context'));

      expect(result2.current[0].items).toHaveLength(2);
      expect(result2.current[0].items[0].state).toEqual(mockFilterState2);
      expect(result2.current[0].items[1].state).toEqual(mockFilterState1);
    });

    it('should handle invalid localStorage data gracefully', () => {
      window.localStorage.setItem('filter-history:invalid', 'invalid json');

      const { result } = renderHook(() => useFilterHistory('invalid'));

      expect(result.current[0].items).toEqual([]);
    });

    it('should validate localStorage data schema', () => {
      const invalidData = {
        items: 'not-an-array', // Invalid
        maxItems: 20,
      };

      window.localStorage.setItem(
        'filter-history:schema-test',
        JSON.stringify(invalidData)
      );

      const { result } = renderHook(() => useFilterHistory('schema-test'));

      expect(result.current[0].items).toEqual([]);
    });

    it('should drop unknown statuses from a rehydrated item and keep the rest', () => {
      window.localStorage.setItem(
        'filter-history:legacy-vocab',
        JSON.stringify({
          maxItems: 20,
          items: [
            {
              id: 'h1',
              timestamp: 1000,
              state: { search: 'x', statuses: ['Active', 'FAILED'], dateStart: '2026-01-01' },
            },
          ],
        })
      );

      const { result } = renderHook(() => useFilterHistory('legacy-vocab'));

      expect(result.current[0].items).toHaveLength(1);
      expect(result.current[0].items[0].state.statuses).toEqual([BuildStatus.Failed]);
      expect(result.current[0].items[0].state.search).toBe('x');
      expect(result.current[0].items[0].state.dateStart).toBe('2026-01-01');
    });

    it('should use contextName in localStorage key', () => {
      const { result } = renderHook(() => useFilterHistory('my-filters'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
      });

      const key = 'filter-history:my-filters';
      expect(window.localStorage.getItem(key)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large filter states', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      const largeFilterState: FilterState = {
        search: 'x'.repeat(1000),
        statuses: [BuildStatus.Running],
        dateStart: '2024-01-01',
        dateEnd: '2024-12-31',
      };

      act(() => {
        result.current[2].addToHistory(largeFilterState);
      });

      expect(result.current[0].items).toHaveLength(1);
      expect(result.current[0].items[0].state.search).toBe('x'.repeat(1000));
    });

    it('should handle rapid consecutive additions', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      act(() => {
        result.current[2].addToHistory(mockFilterState1);
        result.current[2].addToHistory(mockFilterState2);
        result.current[2].addToHistory(mockFilterState3);
      });

      expect(result.current[0].items).toHaveLength(3);
      expect(result.current[0].items[0].state).toEqual(mockFilterState3);
    });

    it('should handle items with empty statuses array', () => {
      const { result } = renderHook(() => useFilterHistory('test'));

      const emptyStatusState: FilterState = {
        search: '',
        statuses: [],
      };

      act(() => {
        result.current[2].addToHistory(emptyStatusState);
      });

      expect(result.current[0].items).toHaveLength(1);
      expect(result.current[0].items[0].state.statuses).toEqual([]);
    });
  });
});
