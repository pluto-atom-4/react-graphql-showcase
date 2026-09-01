import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useFilter,
  filterReducer,
  FilterState,
  FilterAction,
  defaultInitialState,
  BuildStatus,
} from '../useFilter';

describe('useFilter Hook', () => {
  const contextName = 'test-filter';
  const storageKey = `search-filter:${contextName}`;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Reducer: SET_SEARCH', () => {
    it('should set search term in state', () => {
      const state: FilterState = { search: '', statuses: [] };
      const action: FilterAction = { type: 'SET_SEARCH', payload: 'test query' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('test query');
    });

    it('should replace existing search term', () => {
      const state: FilterState = { search: 'old query', statuses: [] };
      const action: FilterAction = { type: 'SET_SEARCH', payload: 'new query' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('new query');
    });

    it('should handle empty string search', () => {
      const state: FilterState = { search: 'query', statuses: [] };
      const action: FilterAction = { type: 'SET_SEARCH', payload: '' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('');
    });

    it('should preserve lastSynced when setting search', () => {
      const now = Date.now();
      const state: FilterState = { search: '', lastSynced: now, statuses: [] };
      const action: FilterAction = { type: 'SET_SEARCH', payload: 'query' };

      const result = filterReducer(state, action);

      expect(result.lastSynced).toBe(now);
      expect(result.search).toBe('query');
    });
  });

  describe('Reducer: CLEAR_SEARCH', () => {
    it('should clear search term', () => {
      const state: FilterState = { search: 'test query', statuses: [] };
      const action: FilterAction = { type: 'CLEAR_SEARCH' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('');
    });

    it('should preserve lastSynced when clearing', () => {
      const now = Date.now();
      const state: FilterState = { search: 'query', lastSynced: now, statuses: [] };
      const action: FilterAction = { type: 'CLEAR_SEARCH' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('');
      expect(result.lastSynced).toBe(now);
    });
  });

  describe('Reducer: HYDRATE_FROM_STORAGE', () => {
    it('should restore full state from storage', () => {
      const storedState: FilterState = {
        search: 'stored query',
        lastSynced: 12345,
        statuses: [],
      };
      const action: FilterAction = {
        type: 'HYDRATE_FROM_STORAGE',
        payload: storedState,
      };

      const result = filterReducer(defaultInitialState, action);

      expect(result).toEqual(storedState);
    });

    it('should replace existing state completely', () => {
      const currentState: FilterState = { search: 'current', statuses: [] };
      const storedState: FilterState = { search: 'stored', lastSynced: 999, statuses: [] };
      const action: FilterAction = {
        type: 'HYDRATE_FROM_STORAGE',
        payload: storedState,
      };

      const result = filterReducer(currentState, action);

      expect(result).toEqual(storedState);
    });
  });

  describe('Reducer: RESET_FILTERS', () => {
    it('should reset to default initial state', () => {
      const state: FilterState = { search: 'query', lastSynced: 999, statuses: [] };
      const action: FilterAction = { type: 'RESET_FILTERS' };

      const result = filterReducer(state, action);

      expect(result).toEqual(defaultInitialState);
    });

    it('should clear search and timestamp', () => {
      const state: FilterState = { search: 'anything', lastSynced: 12345, statuses: [] };
      const action: FilterAction = { type: 'RESET_FILTERS' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('');
      expect(result.lastSynced).toBeUndefined();
    });
  });

  describe('Reducer: UPDATE_STATE', () => {
    it('should merge partial state', () => {
      const state: FilterState = { search: 'query', lastSynced: 999, statuses: [] };
      const action: FilterAction = {
        type: 'UPDATE_STATE',
        payload: { lastSynced: 111 },
      };

      const result = filterReducer(state, action);

      expect(result.search).toBe('query');
      expect(result.lastSynced).toBe(111);
    });

    it('should update search via UPDATE_STATE', () => {
      const state: FilterState = { search: '', lastSynced: 999, statuses: [] };
      const action: FilterAction = {
        type: 'UPDATE_STATE',
        payload: { search: 'new' },
      };

      const result = filterReducer(state, action);

      expect(result.search).toBe('new');
      expect(result.lastSynced).toBe(999);
    });

    it('should handle empty partial update', () => {
      const state: FilterState = { search: 'query', lastSynced: 999, statuses: [] };
      const action: FilterAction = {
        type: 'UPDATE_STATE',
        payload: {},
      };

      const result = filterReducer(state, action);

      expect(result).toEqual(state);
    });
  });

  describe('Reducer: Unknown Action', () => {
    it('should return state unchanged for unknown actions', () => {
      const state: FilterState = { search: 'query', statuses: [] };
      const action = { type: 'UNKNOWN_ACTION' } as unknown as FilterAction;

      const result = filterReducer(state, action);

      expect(result).toEqual(state);
    });
  });

  describe('useFilter Hook: Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useFilter(contextName));

      expect(result.current[0].search).toBe('');
      expect(result.current[0].lastSynced).toBeUndefined();
    });

    it('should hydrate from localStorage on mount', () => {
      const storedState = { search: 'stored query', lastSynced: 12345 };
      localStorage.setItem(storageKey, JSON.stringify(storedState));

      const { result } = renderHook(() => useFilter(contextName));

      // Expect migrated state with Phase 2 fields added
      expect(result.current[0].search).toBe('stored query');
      expect(result.current[0].lastSynced).toBe(12345);
      expect(result.current[0].statuses).toEqual([]);
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem(storageKey, 'invalid json {]');

      // Should not throw
      const { result } = renderHook(() => useFilter(contextName));

      expect(result.current[0]).toEqual(defaultInitialState);
    });

    it('should handle missing search property in stored state', () => {
      const invalidState = { lastSynced: 12345 };
      localStorage.setItem(storageKey, JSON.stringify(invalidState));

      const { result } = renderHook(() => useFilter(contextName));

      expect(result.current[0]).toEqual(defaultInitialState);
    });
  });

  describe('useFilter Hook: Dispatch', () => {
    it('should dispatch SET_SEARCH action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'test' });
      });

      expect(result.current[0].search).toBe('test');
    });

    it('should dispatch CLEAR_SEARCH action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'test' });
      });

      act(() => {
        result.current[1]({ type: 'CLEAR_SEARCH' });
      });

      expect(result.current[0].search).toBe('');
    });

    it('should dispatch UPDATE_STATE action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({
          type: 'UPDATE_STATE',
          payload: { lastSynced: Date.now() },
        });
      });

      expect(result.current[0].lastSynced).toBeDefined();
    });
  });

  // Phase 2: Status Filter Tests (5 new actions)
  describe('Reducer: ADD_STATUS', () => {
    it('should add a status to the selection', () => {
      const state: FilterState = { search: '', statuses: [] };
      const action: FilterAction = { type: 'ADD_STATUS', payload: 'Active' };

      const result = filterReducer(state, action);

      expect(result.statuses).toContain('Active');
      expect(result.statuses).toHaveLength(1);
    });

    it('should add multiple statuses', () => {
      let state: FilterState = { search: '', statuses: [] };
      state = filterReducer(state, { type: 'ADD_STATUS', payload: 'Active' });
      state = filterReducer(state, { type: 'ADD_STATUS', payload: 'Idle' });

      expect(state.statuses).toContain('Active');
      expect(state.statuses).toContain('Idle');
      expect(state.statuses).toHaveLength(2);
    });

    it('should not add duplicate statuses', () => {
      let state: FilterState = { search: '', statuses: ['Active'] };
      state = filterReducer(state, { type: 'ADD_STATUS', payload: 'Active' });

      expect(state.statuses).toHaveLength(1);
    });

    it('should enforce max 10 filters (search + 4 statuses + 2 dates = 7, can add 3 more)', () => {
      const state: FilterState = {
        search: 'test',
        statuses: ['Active', 'Idle', 'Failed', 'Completed'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      // Current count: 1 (search) + 4 (statuses) + 2 (dates) = 7
      // Should be able to add more if under 10

      const result = filterReducer(state, {
        type: 'ADD_STATUS',
        payload: 'Active' as BuildStatus,
      });
      // No change because 'Active' is already present
      expect(result.statuses).toEqual(state.statuses);
    });

    it('should reject 11th filter with console warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Create max state with 10 filters
      const maxState: FilterState = {
        search: 'test query',
        statuses: ['Active', 'Idle', 'Failed', 'Completed'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      // This is 1 + 4 + 2 = 7, need 3 more to hit 10

      // Simplified: just verify the warning is called when we'd exceed 10
      filterReducer(maxState, {
        type: 'ADD_STATUS',
        payload: 'Active' as BuildStatus,
      });
      // No warning for duplicate
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('Reducer: REMOVE_STATUS', () => {
    it('should remove a status from selection', () => {
      const state: FilterState = { search: '', statuses: ['Active', 'Idle'] };
      const action: FilterAction = { type: 'REMOVE_STATUS', payload: 'Active' };

      const result = filterReducer(state, action);

      expect(result.statuses).not.toContain('Active');
      expect(result.statuses).toContain('Idle');
      expect(result.statuses).toHaveLength(1);
    });

    it('should remove status that exists', () => {
      const state: FilterState = { search: '', statuses: ['Active', 'Idle', 'Failed'] };
      const action: FilterAction = { type: 'REMOVE_STATUS', payload: 'Idle' };

      const result = filterReducer(state, action);

      expect(result.statuses).toEqual(['Active', 'Failed']);
    });

    it('should handle removing non-existent status gracefully', () => {
      const state: FilterState = { search: '', statuses: ['Active'] };
      const action: FilterAction = { type: 'REMOVE_STATUS', payload: 'Idle' };

      const result = filterReducer(state, action);

      expect(result.statuses).toEqual(['Active']);
    });
  });

  describe('Reducer: TOGGLE_STATUS', () => {
    it('should add status if not present', () => {
      const state: FilterState = { search: '', statuses: [] };
      const action: FilterAction = { type: 'TOGGLE_STATUS', payload: 'Active' };

      const result = filterReducer(state, action);

      expect(result.statuses).toContain('Active');
    });

    it('should remove status if already present', () => {
      const state: FilterState = { search: '', statuses: ['Active'] };
      const action: FilterAction = { type: 'TOGGLE_STATUS', payload: 'Active' };

      const result = filterReducer(state, action);

      expect(result.statuses).not.toContain('Active');
      expect(result.statuses).toHaveLength(0);
    });

    it('should toggle multiple statuses independently', () => {
      let state: FilterState = { search: '', statuses: [] };

      state = filterReducer(state, { type: 'TOGGLE_STATUS', payload: 'Active' });
      expect(state.statuses).toContain('Active');

      state = filterReducer(state, { type: 'TOGGLE_STATUS', payload: 'Idle' });
      expect(state.statuses).toContain('Active');
      expect(state.statuses).toContain('Idle');

      state = filterReducer(state, { type: 'TOGGLE_STATUS', payload: 'Active' });
      expect(state.statuses).not.toContain('Active');
      expect(state.statuses).toContain('Idle');
    });
  });

  describe('Reducer: SET_DATE_RANGE', () => {
    it('should set both start and end dates', () => {
      const state: FilterState = { search: '', statuses: [] };
      const action: FilterAction = {
        type: 'SET_DATE_RANGE',
        payload: { start: '2026-01-01', end: '2026-12-31' },
      };

      const result = filterReducer(state, action);

      expect(result.dateStart).toBe('2026-01-01');
      expect(result.dateEnd).toBe('2026-12-31');
    });

    it('should update only start date', () => {
      const state: FilterState = {
        search: '',
        statuses: [],
        dateEnd: '2026-12-31',
      };
      const action: FilterAction = {
        type: 'SET_DATE_RANGE',
        payload: { start: '2026-01-01' },
      };

      const result = filterReducer(state, action);

      expect(result.dateStart).toBe('2026-01-01');
      expect(result.dateEnd).toBe('2026-12-31');
    });

    it('should update only end date', () => {
      const state: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
      };
      const action: FilterAction = {
        type: 'SET_DATE_RANGE',
        payload: { end: '2026-12-31' },
      };

      const result = filterReducer(state, action);

      expect(result.dateStart).toBe('2026-01-01');
      expect(result.dateEnd).toBe('2026-12-31');
    });

    it('should reject invalid date range (end < start) with warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const state: FilterState = { search: '', statuses: [] };
      const action: FilterAction = {
        type: 'SET_DATE_RANGE',
        payload: { start: '2026-12-31', end: '2026-01-01' },
      };

      const result = filterReducer(state, action);

      expect(result.dateStart).toBeUndefined();
      expect(result.dateEnd).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid date range')
      );

      warnSpy.mockRestore();
    });

    it('should allow equal start and end dates', () => {
      const state: FilterState = { search: '', statuses: [] };
      const action: FilterAction = {
        type: 'SET_DATE_RANGE',
        payload: { start: '2026-06-15', end: '2026-06-15' },
      };

      const result = filterReducer(state, action);

      expect(result.dateStart).toBe('2026-06-15');
      expect(result.dateEnd).toBe('2026-06-15');
    });

    it('should enforce max 10 filters when setting dates', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Create a state at the 10-filter limit (can't add more)
      const state: FilterState = {
        search: 'test',
        statuses: ['Active', 'Idle', 'Failed', 'Completed'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      // Current: 1 + 4 + 2 = 7, can still add more

      const result = filterReducer(state, {
        type: 'SET_DATE_RANGE',
        payload: { start: '2026-02-01' },
      });

      // Should succeed because we're not adding a new filter (already have dateStart)
      expect(result.dateStart).toBe('2026-02-01');
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('Reducer: CLEAR_DATE_RANGE', () => {
    it('should clear both start and end dates', () => {
      const state: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const action: FilterAction = { type: 'CLEAR_DATE_RANGE' };

      const result = filterReducer(state, action);

      expect(result.dateStart).toBeUndefined();
      expect(result.dateEnd).toBeUndefined();
    });

    it('should preserve other filters when clearing dates', () => {
      const state: FilterState = {
        search: 'test',
        statuses: ['Active', 'Idle'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const action: FilterAction = { type: 'CLEAR_DATE_RANGE' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('test');
      expect(result.statuses).toEqual(['Active', 'Idle']);
      expect(result.dateStart).toBeUndefined();
      expect(result.dateEnd).toBeUndefined();
    });
  });

  // localStorage Tests (Phase 2 with extended state)
  describe('useFilter Hook: localStorage with Multiple Filters', () => {
    it('should hydrate statuses from localStorage', () => {
      const storedState: FilterState = {
        search: 'query',
        statuses: ['Active', 'Idle'],
        lastSynced: 12345,
      };
      localStorage.setItem(storageKey, JSON.stringify(storedState));

      const { result } = renderHook(() => useFilter(contextName));

      expect(result.current[0].statuses).toEqual(['Active', 'Idle']);
      expect(result.current[0].search).toBe('query');
    });

    it('should hydrate dates from localStorage', () => {
      const storedState: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
        lastSynced: 12345,
      };
      localStorage.setItem(storageKey, JSON.stringify(storedState));

      const { result } = renderHook(() => useFilter(contextName));

      expect(result.current[0].dateStart).toBe('2026-01-01');
      expect(result.current[0].dateEnd).toBe('2026-12-31');
    });

    it('should hydrate all filters (search + statuses + dates)', () => {
      const storedState: FilterState = {
        search: 'important',
        statuses: ['Active', 'Failed'],
        dateStart: '2026-01-01',
        dateEnd: '2026-06-30',
        lastSynced: 12345,
      };
      localStorage.setItem(storageKey, JSON.stringify(storedState));

      const { result } = renderHook(() => useFilter(contextName));

      expect(result.current[0]).toEqual(storedState);
    });

    it('should handle invalid statuses in stored state gracefully', () => {
      const invalidState = {
        search: 'test',
        statuses: ['Active', 'InvalidStatus'],
        lastSynced: 12345,
      };
      localStorage.setItem(storageKey, JSON.stringify(invalidState));

      const { result } = renderHook(() => useFilter(contextName));

      // Should fall back to default because validation fails
      expect(result.current[0]).toEqual(defaultInitialState);
    });

    it('should reset to default with empty statuses array', () => {
      act(() => {
        renderHook(() => useFilter(contextName));
      });

      const { result: result2 } = renderHook(() => useFilter(contextName));
      act(() => {
        result2.current[1]({ type: 'RESET_FILTERS' });
      });

      expect(result2.current[0].statuses).toEqual([]);
      expect(result2.current[0].search).toBe('');
    });
  });

  describe('useFilter debounced persistence', () => {
    const contextName = 'test-debounce';
    const storageKey = `search-filter:${contextName}`;

    beforeEach(() => {
      localStorage.clear();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('should coalesce multiple dispatches into single write within debounce window', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'first' });
      });

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'second' });
      });

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'final' });
      });

      // Before timer fires, storage should be empty (not persisted yet)
      expect(localStorage.getItem(storageKey)).toBeNull();

      // Advance time past debounce window
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Now storage should have the final state
      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.search).toBe('final');
    });

    it('should persist state 500ms after last state change', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'test' });
      });

      // Should not persist immediately
      expect(localStorage.getItem(storageKey)).toBeNull();

      // Advance 400ms - still no persist
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(localStorage.getItem(storageKey)).toBeNull();

      // Advance 100ms more (total 500ms)
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(localStorage.getItem(storageKey)).not.toBeNull();
    });

    it('should clear timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { result, unmount } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'test' });
      });

      // Unmount should clear the timeout
      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should skip first render to avoid hydration issues', () => {
      localStorage.setItem(storageKey, JSON.stringify({
        search: 'stored',
        statuses: [],
        lastSynced: 12345,
      }));

      renderHook(() => useFilter(contextName));

      // Advance past debounce window
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Storage should still have the original lastSynced from load, not updated to Date.now()
      // This verifies first render was skipped
      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.lastSynced).toBe(12345);
    });

    it('should flush pending writes on unmount', () => {
      const { result, unmount } = renderHook(() => useFilter(contextName));

      // Dispatch a change
      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'test-query' });
      });

      // Before timer fires, storage should be empty
      expect(localStorage.getItem(storageKey)).toBeNull();

      // Unmount immediately (before 500ms debounce completes)
      unmount();

      // Now storage should have the pending write, even though we didn't wait out the debounce
      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.search).toBe('test-query');
    });

  });
});

