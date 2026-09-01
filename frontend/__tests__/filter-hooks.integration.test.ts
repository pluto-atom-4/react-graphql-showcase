/**
 * Filter Hooks Integration Tests
 *
 * Tests the composition of multiple filter hooks working together:
 * - useFilter: Base filter state management with localStorage persistence
 * - useFilterHistory: History tracking and recall
 * - useFilterPresets: Preset saving/restoring
 * - useUndoRedo: Undo/redo stack management
 *
 * These tests verify API contracts and actual state behavior changes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter, defaultInitialState } from '../lib/hooks/useFilter';
import { BuildStatus } from '../lib/status-vocabulary';
import { useFilterHistory } from '../lib/hooks/useFilterHistory';
import { useFilterPresets } from '../lib/hooks/useFilterPresets';
import { useUndoRedo } from '../lib/hooks/useUndoRedo';

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

  describe('useFilter API contracts', () => {
    it('should return [FilterState, Dispatch] tuple with correct shape', () => {
      const { result } = renderHook(() => useFilter(contextName));

      // Verify tuple structure
      expect(result.current).toHaveLength(2);
      const [state, dispatch] = result.current;

      // Verify state is correct FilterState shape
      expect(state).toEqual({
        search: '',
        statuses: [],
      });

      // Verify dispatch is a function
      expect(typeof dispatch).toBe('function');
    });

    it('should persist state changes to localStorage via debounce', () => {
      const { result } = renderHook(() => useFilter(contextName));

      // Dispatch SET_SEARCH
      act(() => {
        result.current[1]({ type: 'SET_SEARCH', payload: 'test query' });
      });

      // State should update immediately
      expect(result.current[0].search).toBe('test query');

      // Storage should be empty before debounce completes
      const storageKey = `search-filter:${contextName}`;
      expect(localStorage.getItem(storageKey)).toBeNull();

      // Advance past debounce window
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Storage should now contain the state
      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.search).toBe('test query');
    });

    it('should hydrate from localStorage on mount', () => {
      const storageKey = `search-filter:${contextName}`;
      const savedState = {
        search: 'pre-loaded',
        statuses: [BuildStatus.Running],
      };
      localStorage.setItem(storageKey, JSON.stringify(savedState));

      const { result } = renderHook(() => useFilter(contextName));

      expect(result.current[0]).toEqual(savedState);
    });
  });

  describe('useFilterHistory API contracts', () => {
    it('should return [state, dispatch, helpers] tuple', () => {
      const { result } = renderHook(() => useFilterHistory(contextName));

      expect(result.current).toHaveLength(3);
      const [state, dispatch, helpers] = result.current;

      expect(typeof state).toBe('object');
      expect(typeof dispatch).toBe('function');
      expect(typeof helpers).toBe('object');
      expect(typeof helpers.addToHistory).toBe('function');
    });

    it('should auto-save history to localStorage when state changes', () => {
      const { result } = renderHook(() => useFilterHistory(contextName));

      // Trigger a history dispatch
      act(() => {
        result.current[1]({
          type: 'ADD_TO_HISTORY',
          payload: { search: 'history item', statuses: [] },
          label: 'Test',
        });
      });

      // Advance past persistence window
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Verify stored in localStorage
      const storageKey = `filter-history:${contextName}`;
      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed.items)).toBe(true);
    });
  });

  describe('useFilterPresets API contracts', () => {
    it('should return [state, dispatch, helpers] tuple', () => {
      const { result } = renderHook(() => useFilterPresets(contextName));

      expect(result.current).toHaveLength(3);
      const [state, dispatch, helpers] = result.current;

      expect(typeof state).toBe('object');
      expect(typeof dispatch).toBe('function');
      expect(typeof helpers).toBe('object');
      expect(typeof helpers.createPreset).toBe('function');
    });

  });

  describe('useUndoRedo API contracts', () => {
    it('should return [state, dispatch, helpers] tuple', () => {
      const { result } = renderHook(() =>
        useUndoRedo(contextName, defaultInitialState)
      );

      expect(result.current).toHaveLength(3);
      const [state, dispatch, helpers] = result.current;

      expect(typeof state).toBe('object');
      expect(typeof dispatch).toBe('function');
      expect(typeof helpers).toBe('object');
      expect(typeof helpers.push).toBe('function');
      expect(typeof helpers.undo).toBe('function');
      expect(typeof helpers.redo).toBe('function');
    });

  });

  describe('Storage keying by contextName', () => {
    it('should use contextName to isolate storage across contexts', () => {
      const ctx1 = 'ctx-one';
      const ctx2 = 'ctx-two';

      const hook1 = renderHook(() => useFilter(ctx1));
      const hook2 = renderHook(() => useFilter(ctx2));

      // Dispatch different values
      act(() => {
        hook1.result.current[1]({ type: 'SET_SEARCH', payload: 'context1' });
        hook2.result.current[1]({ type: 'SET_SEARCH', payload: 'context2' });
      });

      // Advance persistence
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Verify each context stored its own data
      const key1 = `search-filter:${ctx1}`;
      const key2 = `search-filter:${ctx2}`;

      const stored1 = JSON.parse(localStorage.getItem(key1)!);
      const stored2 = JSON.parse(localStorage.getItem(key2)!);

      expect(stored1.search).toBe('context1');
      expect(stored2.search).toBe('context2');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid action by keeping state unchanged', () => {
      const { result } = renderHook(() => useFilter(contextName));

      act(() => {
        // @ts-expect-error - intentionally invalid action
        result.current[1]({ type: 'NONEXISTENT_ACTION' });
      });

      // State should remain at default
      expect(result.current[0]).toEqual(defaultInitialState);
    });

    it('should handle corrupted localStorage data by falling back to default', () => {
      const storageKey = `search-filter:${contextName}`;
      localStorage.setItem(storageKey, 'not json at all');

      const { result } = renderHook(() => useFilter(contextName));

      // Should use default state
      expect(result.current[0]).toEqual(defaultInitialState);
    });
  });
});
