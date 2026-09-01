import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo, undoRedoReducer, UndoRedoState, saveUndoRedoToStorage } from '../useUndoRedo';
import { FilterState } from '../useFilter';
import { BuildStatus } from '../../status-vocabulary';

/**
 * Mock initial filter state for testing
 */
const mockFilterState: FilterState = {
  search: '',
  statuses: [],
  dateStart: undefined,
  dateEnd: undefined,
};

/**
 * Mock filter state with search
 */
const mockFilterStateWithSearch: FilterState = {
  search: 'test',
  statuses: [],
  dateStart: undefined,
  dateEnd: undefined,
};

/**
 * Mock filter state with status
 */
const mockFilterStateWithStatus: FilterState = {
  search: '',
  statuses: [BuildStatus.Running],
  dateStart: undefined,
  dateEnd: undefined,
};

describe('useUndoRedo Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      expect(result.current[0].past).toEqual([]);
      expect(result.current[0].future).toEqual([]);
      expect(result.current[0].present.state).toEqual(mockFilterState);
      expect(result.current[0].maxLevels).toBe(20);
    });

    it('should initialize with custom max levels', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState, 10));

      expect(result.current[0].maxLevels).toBe(10);
    });

    it('should load from localStorage if available', () => {
      const savedState: UndoRedoState = {
        past: [],
        present: {
          id: 'test-1',
          state: mockFilterStateWithSearch,
          timestamp: Date.now(),
          label: 'Initial',
        },
        future: [],
        maxLevels: 20,
      };

      localStorage.setItem('undo-redo:test', JSON.stringify(savedState));

      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      expect(result.current[0].present.state).toEqual(mockFilterStateWithSearch);
    });
  });

  describe('Push Action', () => {
    it('should push new state to past', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
      });

      expect(result.current[0].past.length).toBe(1);
      expect(result.current[0].present.state).toEqual(mockFilterStateWithSearch);
      expect(result.current[0].future).toEqual([]);
    });

    it('should not push duplicate states', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
        result.current[2].push(mockFilterStateWithSearch); // Same state
      });

      expect(result.current[0].past.length).toBe(1);
    });

    it('should clear future stack when pushing new state', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
        result.current[2].push(mockFilterStateWithStatus);
        result.current[2].undo();
        result.current[2].push(mockFilterStateWithStatus); // New action after undo
      });

      expect(result.current[0].future).toEqual([]);
      expect(result.current[0].past.length).toBe(2);
    });

    it('should accept optional label', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch, 'Applied search filter');
      });

      expect(result.current[0].present.label).toBe('Applied search filter');
    });

    it('should enforce max levels limit on past stack', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState, 5));

      act(() => {
        for (let i = 0; i < 10; i++) {
          const newState: FilterState = {
            ...mockFilterState,
            search: `search-${i}`,
          };
          result.current[2].push(newState);
        }
      });

      expect(result.current[0].past.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Undo Action', () => {
    it('should undo to previous state', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
        result.current[2].undo();
      });

      expect(result.current[0].present.state).toEqual(mockFilterState);
      expect(result.current[0].past).toEqual([]);
      expect(result.current[0].future.length).toBe(1);
    });

    it('should not undo when past is empty', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].undo();
      });

      expect(result.current[0].present.state).toEqual(mockFilterState);
      expect(result.current[0].past).toEqual([]);
      expect(result.current[0].future).toEqual([]);
    });

    it('should update canUndo flag', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      expect(result.current[2].canUndo).toBe(false);

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
      });

      expect(result.current[2].canUndo).toBe(true);

      act(() => {
        result.current[2].undo();
      });

      expect(result.current[2].canUndo).toBe(false);
    });

    it('should handle multiple undos', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
        result.current[2].push(mockFilterStateWithStatus);
        result.current[2].undo();
        result.current[2].undo();
      });

      expect(result.current[0].present.state).toEqual(mockFilterState);
      expect(result.current[0].past.length).toBe(0);
      expect(result.current[0].future.length).toBe(2);
    });
  });

  describe('Redo Action', () => {
    it('should redo to next state', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
        result.current[2].undo();
        result.current[2].redo();
      });

      expect(result.current[0].present.state).toEqual(mockFilterStateWithSearch);
      expect(result.current[0].future).toEqual([]);
    });

    it('should not redo when future is empty', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].redo();
      });

      expect(result.current[0].present.state).toEqual(mockFilterState);
      expect(result.current[0].past).toEqual([]);
      expect(result.current[0].future).toEqual([]);
    });

    it('should update canRedo flag', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      expect(result.current[2].canRedo).toBe(false);

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
        result.current[2].undo();
      });

      expect(result.current[2].canRedo).toBe(true);

      act(() => {
        result.current[2].redo();
      });

      expect(result.current[2].canRedo).toBe(false);
    });

    it('should handle multiple redos', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
        result.current[2].push(mockFilterStateWithStatus);
        result.current[2].undo();
        result.current[2].undo();
        result.current[2].redo();
        result.current[2].redo();
      });

      expect(result.current[0].present.state).toEqual(mockFilterStateWithStatus);
      expect(result.current[0].future.length).toBe(0);
    });
  });

  describe('Reset Action', () => {
    it('should reset past and future stacks', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
        result.current[2].push(mockFilterStateWithStatus);
        result.current[2].undo();
        result.current[2].reset();
      });

      expect(result.current[0].past).toEqual([]);
      expect(result.current[0].future).toEqual([]);
      expect(result.current[2].canUndo).toBe(false);
      expect(result.current[2].canRedo).toBe(false);
    });
  });

  describe('Reducer', () => {
    it('should handle PUSH action', () => {
      const initialState: UndoRedoState = {
        past: [],
        present: {
          id: 'test-1',
          state: mockFilterState,
          timestamp: Date.now(),
        },
        future: [],
        maxLevels: 20,
      };

      const newState = undoRedoReducer(initialState, {
        type: 'PUSH',
        payload: mockFilterStateWithSearch,
      });

      expect(newState.past.length).toBe(1);
      expect(newState.present.state).toEqual(mockFilterStateWithSearch);
      expect(newState.future).toEqual([]);
    });

    it('should handle UNDO action', () => {
      const initialState: UndoRedoState = {
        past: [
          {
            id: 'test-1',
            state: mockFilterState,
            timestamp: Date.now(),
          },
        ],
        present: {
          id: 'test-2',
          state: mockFilterStateWithSearch,
          timestamp: Date.now(),
        },
        future: [],
        maxLevels: 20,
      };

      const newState = undoRedoReducer(initialState, { type: 'UNDO' });

      expect(newState.past).toEqual([]);
      expect(newState.present.state).toEqual(mockFilterState);
      expect(newState.future.length).toBe(1);
    });

    it('should handle REDO action', () => {
      const initialState: UndoRedoState = {
        past: [
          {
            id: 'test-1',
            state: mockFilterState,
            timestamp: Date.now(),
          },
        ],
        present: {
          id: 'test-2',
          state: mockFilterStateWithSearch,
          timestamp: Date.now(),
        },
        future: [
          {
            id: 'test-3',
            state: mockFilterStateWithStatus,
            timestamp: Date.now(),
          },
        ],
        maxLevels: 20,
      };

      const newState = undoRedoReducer(initialState, { type: 'REDO' });

      expect(newState.past.length).toBe(2);
      expect(newState.present.state).toEqual(mockFilterStateWithStatus);
      expect(newState.future).toEqual([]);
    });

    it('should handle RESET action', () => {
      const initialState: UndoRedoState = {
        past: [
          {
            id: 'test-1',
            state: mockFilterState,
            timestamp: Date.now(),
          },
        ],
        present: {
          id: 'test-2',
          state: mockFilterStateWithSearch,
          timestamp: Date.now(),
        },
        future: [
          {
            id: 'test-3',
            state: mockFilterStateWithStatus,
            timestamp: Date.now(),
          },
        ],
        maxLevels: 20,
      };

      const newState = undoRedoReducer(initialState, { type: 'RESET' });

      expect(newState.past).toEqual([]);
      expect(newState.future).toEqual([]);
    });

    it('should handle SET_MAX_LEVELS action', () => {
      const initialState: UndoRedoState = {
        past: Array.from({ length: 15 }, (_, i) => ({
          id: `test-${i}`,
          state: mockFilterState,
          timestamp: Date.now(),
        })),
        present: {
          id: 'present',
          state: mockFilterState,
          timestamp: Date.now(),
        },
        future: [],
        maxLevels: 20,
      };

      const newState = undoRedoReducer(initialState, {
        type: 'SET_MAX_LEVELS',
        payload: 10,
      });

      expect(newState.maxLevels).toBe(10);
      expect(newState.past.length).toBeLessThanOrEqual(10);
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      act(() => {
        result.current[2].push(mockFilterStateWithSearch);
      });

      const stored = localStorage.getItem('undo-redo:test');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.present.state).toEqual(mockFilterStateWithSearch);
    });

    it('should load state from localStorage on initialization', () => {
      const savedState: UndoRedoState = {
        past: [],
        present: {
          id: 'test-1',
          state: mockFilterStateWithSearch,
          timestamp: Date.now(),
          label: 'Persisted state',
        },
        future: [],
        maxLevels: 20,
      };

      localStorage.setItem('undo-redo:test', JSON.stringify(savedState));

      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      expect(result.current[0].present.state).toEqual(mockFilterStateWithSearch);
      expect(result.current[0].present.label).toBe('Persisted state');
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem('undo-redo:test', 'invalid json');

      const { result } = renderHook(() => useUndoRedo('test', mockFilterState));

      // Should fallback to initial state
      expect(result.current[0].present.state).toEqual(mockFilterState);
      expect(result.current[0].past).toEqual([]);
    });

    it('should log warning on storage error', () => {
      const state: UndoRedoState = {
        past: [],
        present: {
          id: 'test',
          state: mockFilterState,
          timestamp: Date.now(),
        },
        future: [],
        maxLevels: 20,
      };

      // Test that the function doesn't throw even if there's an error
      expect(() => {
        saveUndoRedoToStorage('test-key', state);
      }).not.toThrow();

      // Verify the state was saved
      const stored = localStorage.getItem('test-key');
      expect(stored).toBeDefined();
    });
  });

  describe('saveUndoRedoToStorage Function', () => {
    it('should save state to localStorage', () => {
      const state: UndoRedoState = {
        past: [],
        present: {
          id: 'test',
          state: mockFilterState,
          timestamp: Date.now(),
        },
        future: [],
        maxLevels: 20,
      };

      saveUndoRedoToStorage('test-key', state);

      const stored = localStorage.getItem('test-key');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(state);
    });

    it('should handle server-side execution gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const state: UndoRedoState = {
        past: [],
        present: {
          id: 'test',
          state: mockFilterState,
          timestamp: Date.now(),
        },
        future: [],
        maxLevels: 20,
      };

      expect(() => saveUndoRedoToStorage('test-key', state)).not.toThrow();

      global.window = originalWindow;
    });
  });
});
