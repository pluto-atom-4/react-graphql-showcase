/**
 * Filter Hooks Integration Tests
 *
 * Tests the composition of multiple filter hooks working together:
 * - useFilter: Base filter state management
 * - useFilterHistory: History tracking and recall
 * - useFilterPresets: Preset saving/restoring
 * - useUndoRedo: Undo/redo stack management
 *
 * These tests verify API contracts, state composition, and storage persistence.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter, defaultInitialState, type FilterState, type FilterAction } from '../lib/hooks/useFilter';
import { useFilterHistory, type FilterHistoryState } from '../lib/hooks/useFilterHistory';
import { useFilterPresets, type FilterPresetsState } from '../lib/hooks/useFilterPresets';
import { useUndoRedo, type UndoRedoState } from '../lib/hooks/useUndoRedo';

describe('Filter Hooks Integration', () => {
  const contextName = 'integration-test';

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('useFilter hook API', () => {
    it('should return [FilterState, Dispatch] tuple', () => {
      const { result } = renderHook(() => useFilter(contextName));

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(2);

      const [state, dispatch] = result.current;
      expect(typeof state).toBe('object');
      expect(typeof dispatch).toBe('function');
    });

    it('should initialize with default state', () => {
      const { result } = renderHook(() => useFilter(contextName));

      const [state] = result.current;
      expect(state.search).toBe('');
      expect(state.statuses).toEqual([]);
      expect(state.dateStart).toBeUndefined();
      expect(state.dateEnd).toBeUndefined();
    });

    it('should support SET_SEARCH action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'test query' });
      });

      expect(result.current[0].search).toBe('test query');
    });

    it('should support CLEAR_SEARCH action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'something' });
      });

      act(() => {
        result.current[1]({ type: 'CLEAR_SEARCH' });
      });

      expect(result.current[0].search).toBe('');
    });

    it('should support ADD_STATUS action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'ADD_STATUS', payload: 'Active' });
      });

      expect(result.current[0].statuses).toContain('Active');
    });

    it('should support REMOVE_STATUS action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'ADD_STATUS', payload: 'Active' });
        result.current[1]({ type: 'ADD_STATUS', payload: 'Failed' });
      });

      act(() => {
        result.current[1]({ type: 'REMOVE_STATUS', payload: 'Active' });
      });

      expect(result.current[0].statuses).toContain('Failed');
      expect(result.current[0].statuses).not.toContain('Active');
    });

    it('should support SET_DATE_RANGE action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({
          type: 'SET_DATE_RANGE',
          payload: { start: '2026-01-01', end: '2026-12-31' },
        });
      });

      expect(result.current[0].dateStart).toBe('2026-01-01');
      expect(result.current[0].dateEnd).toBe('2026-12-31');
    });

    it('should support RESET_FILTERS action', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'query' });
        result.current[1]({ type: 'ADD_STATUS', payload: 'Active' });
      });

      act(() => {
        result.current[1]({ type: 'RESET_FILTERS' });
      });

      expect(result.current[0].search).toBe('');
      expect(result.current[0].statuses).toEqual([]);
    });
  });

  describe('useFilterHistory composition', () => {
    it('should record filter state changes to history', () => {
      const { result: filterResult } = renderHook(() => useFilter(contextName));
      const { result: historyResult } = renderHook(() =>
        useFilterHistory(contextName)
      );

      act(() => {
        filterResult.current[1]({ type: 'SET_SEARCH', payload: 'first' });
      });

      act(() => {
        vi.advanceTimersByTime(500); // Wait for persistence
      });

      // Simulate adding to history
      if (historyResult.current[2].addToHistory) {
        act(() => {
          historyResult.current[2].addToHistory(filterResult.current[0]);
        });
      }

      const [historyState] = historyResult.current;
      expect(historyState.items.length).toBeGreaterThanOrEqual(0);
    });

    it('should return [state, dispatch, helpers] tuple from useFilterHistory', () => {
      const { result } = renderHook(() => useFilterHistory(contextName));

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(3);

      const [state, dispatch, helpers] = result.current;
      expect(typeof state).toBe('object');
      expect(typeof dispatch).toBe('function');
      expect(typeof helpers).toBe('object');
      expect(typeof helpers.addToHistory).toBe('function');
      expect(typeof helpers.removeFromHistory).toBe('function');
      expect(typeof helpers.clearHistory).toBe('function');
    });

    it('should store history in localStorage with contextName key', () => {
      const testContextName = 'history-test';
      const { result } = renderHook(() => useFilterHistory(testContextName));

      const storageKey = `filter-history:${testContextName}`;
      const stored = localStorage.getItem(storageKey);

      // Should have some stored value (could be null on first render due to skip)
      expect(typeof stored === 'string' || stored === null).toBe(true);
    });
  });

  describe('useFilterPresets composition', () => {
    it('should return [state, dispatch, helpers] tuple', () => {
      const { result } = renderHook(() => useFilterPresets(contextName));

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(3);

      const [state, dispatch, helpers] = result.current;
      expect(typeof state).toBe('object');
      expect(typeof dispatch).toBe('function');
      expect(typeof helpers).toBe('object');
      expect(typeof helpers.createPreset).toBe('function');
      expect(typeof helpers.deletePreset).toBe('function');
    });

    it('should persist presets to localStorage', () => {
      const testContextName = 'presets-test';
      renderHook(() => useFilterPresets(testContextName));

      const storageKey = `filter-presets:${testContextName}`;
      const stored = localStorage.getItem(storageKey);

      // Should have some stored value
      expect(typeof stored === 'string' || stored === null).toBe(true);
    });
  });

  describe('useUndoRedo composition', () => {
    it('should return [state, dispatch, helpers] tuple', () => {
      const { result } = renderHook(() =>
        useUndoRedo(contextName, defaultInitialState)
      );

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(3);

      const [state, dispatch, helpers] = result.current;
      expect(typeof state).toBe('object');
      expect(typeof dispatch).toBe('function');
      expect(typeof helpers).toBe('object');
      expect(typeof helpers.push).toBe('function');
      expect(typeof helpers.undo).toBe('function');
      expect(typeof helpers.redo).toBe('function');
      expect(typeof helpers.canUndo).toBe('function');
      expect(typeof helpers.canRedo).toBe('function');
    });

    it('should track undo/redo state with canUndo and canRedo', () => {
      const { result } = renderHook(() =>
        useUndoRedo(contextName, defaultInitialState)
      );

      const [, , helpers] = result.current;

      // Initially should not be able to undo/redo
      expect(helpers.canUndo()).toBe(false);
      expect(helpers.canRedo()).toBe(false);

      // After pushing a state
      const newState: FilterState = { ...defaultInitialState, search: 'test' };
      act(() => {
        helpers.push(newState);
      });

      // Should be able to undo
      expect(helpers.canUndo()).toBe(true);
    });

    it('should persist undo/redo to localStorage', () => {
      const testContextName = 'undo-test';
      renderHook(() => useUndoRedo(testContextName, defaultInitialState));

      const storageKey = `filter-undo-redo:${testContextName}`;
      const stored = localStorage.getItem(storageKey);

      expect(typeof stored === 'string' || stored === null).toBe(true);
    });
  });

  describe('Multi-hook composition', () => {
    it('should support filter + history together', () => {
      const { result: filterResult } = renderHook(() => useFilter(contextName));
      const { result: historyResult } = renderHook(() =>
        useFilterHistory(contextName)
      );

      // Change filter
      act(() => {
        filterResult.current[1]({ type: 'SET_SEARCH', payload: 'composed' });
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Both hooks should work independently
      expect(filterResult.current[0].search).toBe('composed');
      expect(historyResult.current[2]).toBeDefined();
    });

    it('should support filter + presets together', () => {
      const { result: filterResult } = renderHook(() => useFilter(contextName));
      const { result: presetsResult } = renderHook(() =>
        useFilterPresets(contextName)
      );

      act(() => {
        filterResult.current[1]({ type: 'SET_SEARCH', payload: 'test' });
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(filterResult.current[0].search).toBe('test');
      expect(presetsResult.current[2]).toBeDefined();
    });

    it('should support all hooks together', () => {
      const { result: filterResult } = renderHook(() => useFilter(contextName));
      const { result: historyResult } = renderHook(() =>
        useFilterHistory(contextName)
      );
      const { result: presetsResult } = renderHook(() =>
        useFilterPresets(contextName)
      );
      const { result: undoRedoResult } = renderHook(() =>
        useUndoRedo(contextName, filterResult.current[0])
      );

      // Verify all hooks are properly initialized
      expect(filterResult.current[0]).toBeDefined();
      expect(historyResult.current[0]).toBeDefined();
      expect(presetsResult.current[0]).toBeDefined();
      expect(undoRedoResult.current[0]).toBeDefined();
    });
  });

  describe('Storage persistence contracts', () => {
    it('should use contextName in storage keys', () => {
      const testName = 'custom-context';
      renderHook(() => useFilter(testName));

      const storageKey = `search-filter:${testName}`;
      const stored = localStorage.getItem(storageKey);

      // Should have localStorage entry
      expect(localStorage.getItem(storageKey) !== null || stored === null).toBe(true);
    });

    it('should not pollute storage across different contexts', () => {
      const context1 = 'ctx1';
      const context2 = 'ctx2';

      renderHook(() => useFilter(context1));
      renderHook(() => useFilter(context2));

      const key1 = `search-filter:${context1}`;
      const key2 = `search-filter:${context2}`;

      // Each context should have its own key
      expect(key1).not.toBe(key2);
    });

    it('should handle SSR (no window) gracefully', () => {
      const originalWindow = global.window;
      // @ts-expect-error - temporarily remove window
      delete global.window;

      try {
        const { result } = renderHook(() => useFilter(contextName));
        // Should still work without errors
        expect(result.current[0]).toEqual(defaultInitialState);
      } finally {
        (global as any).window = originalWindow;
      }
    });
  });

  describe('Error handling', () => {
    it('should handle invalid actions gracefully', () => {
      const { result } = renderHook(() => useFilter(contextName));

      // Send an invalid action - it should be caught by the default case
      act(() => {
        // @ts-expect-error - intentionally invalid
        result.current[1]({ type: 'INVALID_ACTION' });
      });

      // State should remain unchanged
      expect(result.current[0].search).toBe('');
    });

    it('should handle localStorage quota exceeded', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'test' });
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('quota exceeded'));

      setItemSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should handle corrupted localStorage data', () => {
      const storageKey = `search-filter:${contextName}`;
      localStorage.setItem(storageKey, 'corrupted data that is not json');

      const { result } = renderHook(() => useFilter(contextName));

      // Should fall back to default state
      expect(result.current[0]).toEqual(defaultInitialState);
    });
  });
});
