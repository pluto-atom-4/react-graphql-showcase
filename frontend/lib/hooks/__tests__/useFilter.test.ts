import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useFilter,
  filterReducer,
  FilterState,
  FilterAction,
  defaultInitialState,
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
      const state: FilterState = { search: '' };
      const action: FilterAction = { type: 'SET_SEARCH', payload: 'test query' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('test query');
    });

    it('should replace existing search term', () => {
      const state: FilterState = { search: 'old query' };
      const action: FilterAction = { type: 'SET_SEARCH', payload: 'new query' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('new query');
    });

    it('should handle empty string search', () => {
      const state: FilterState = { search: 'query' };
      const action: FilterAction = { type: 'SET_SEARCH', payload: '' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('');
    });

    it('should preserve lastSynced when setting search', () => {
      const now = Date.now();
      const state: FilterState = { search: '', lastSynced: now };
      const action: FilterAction = { type: 'SET_SEARCH', payload: 'query' };

      const result = filterReducer(state, action);

      expect(result.lastSynced).toBe(now);
      expect(result.search).toBe('query');
    });
  });

  describe('Reducer: CLEAR_SEARCH', () => {
    it('should clear search term', () => {
      const state: FilterState = { search: 'test query' };
      const action: FilterAction = { type: 'CLEAR_SEARCH' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('');
    });

    it('should preserve lastSynced when clearing', () => {
      const now = Date.now();
      const state: FilterState = { search: 'query', lastSynced: now };
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
      };
      const action: FilterAction = {
        type: 'HYDRATE_FROM_STORAGE',
        payload: storedState,
      };

      const result = filterReducer(defaultInitialState, action);

      expect(result).toEqual(storedState);
    });

    it('should replace existing state completely', () => {
      const currentState: FilterState = { search: 'current' };
      const storedState: FilterState = { search: 'stored', lastSynced: 999 };
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
      const state: FilterState = { search: 'query', lastSynced: 999 };
      const action: FilterAction = { type: 'RESET_FILTERS' };

      const result = filterReducer(state, action);

      expect(result).toEqual(defaultInitialState);
    });

    it('should clear search and timestamp', () => {
      const state: FilterState = { search: 'anything', lastSynced: 12345 };
      const action: FilterAction = { type: 'RESET_FILTERS' };

      const result = filterReducer(state, action);

      expect(result.search).toBe('');
      expect(result.lastSynced).toBeUndefined();
    });
  });

  describe('Reducer: UPDATE_STATE', () => {
    it('should merge partial state', () => {
      const state: FilterState = { search: 'query', lastSynced: 999 };
      const action: FilterAction = {
        type: 'UPDATE_STATE',
        payload: { lastSynced: 111 },
      };

      const result = filterReducer(state, action);

      expect(result.search).toBe('query');
      expect(result.lastSynced).toBe(111);
    });

    it('should update search via UPDATE_STATE', () => {
      const state: FilterState = { search: '', lastSynced: 999 };
      const action: FilterAction = {
        type: 'UPDATE_STATE',
        payload: { search: 'new' },
      };

      const result = filterReducer(state, action);

      expect(result.search).toBe('new');
      expect(result.lastSynced).toBe(999);
    });

    it('should handle empty partial update', () => {
      const state: FilterState = { search: 'query', lastSynced: 999 };
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
      const state: FilterState = { search: 'query' };
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

      expect(result.current[0]).toEqual(storedState);
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
});
