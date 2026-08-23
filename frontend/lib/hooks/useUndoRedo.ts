'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { FilterState } from './useFilter';

/**
 * Single undo/redo stack entry with state snapshot
 */
export interface UndoRedoItem {
  id: string; // UUID v4 or similar
  state: FilterState;
  timestamp: number; // milliseconds since epoch
  label?: string; // Optional description
}

/**
 * State shape for undo/redo management
 */
export interface UndoRedoState {
  past: UndoRedoItem[]; // Stack of previous states (newest last)
  present: UndoRedoItem; // Current state
  future: UndoRedoItem[]; // Stack of redoable states (oldest last)
  maxLevels: number; // Maximum undo/redo levels to keep
}

/**
 * Union type for all undo/redo actions
 */
export type UndoRedoAction =
  | { type: 'PUSH'; payload: FilterState; label?: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' }
  | { type: 'CLEAR_FUTURE' }
  | { type: 'HYDRATE_FROM_STORAGE'; payload: UndoRedoState }
  | { type: 'SET_MAX_LEVELS'; payload: number };

/**
 * Generate a unique ID for undo/redo item
 * Simple implementation using timestamp + random
 *
 * @returns Unique ID string
 */
const generateId = (): string => {
  return `undo-redo-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Create an undo/redo item from filter state
 *
 * @param state Filter state to store
 * @param label Optional label
 * @returns UndoRedoItem
 */
const createUndoRedoItem = (state: FilterState, label?: string): UndoRedoItem => {
  return {
    id: generateId(),
    state,
    timestamp: Date.now(),
    label,
  };
};

/**
 * Create initial present state
 *
 * @param state Initial filter state
 * @returns Initial UndoRedoItem
 */
const createInitialPresent = (state: FilterState): UndoRedoItem => {
  return {
    id: generateId(),
    state,
    timestamp: Date.now(),
    label: 'Initial state',
  };
};

/**
 * Undo/Redo reducer function
 *
 * Manages undo/redo state:
 * - Push new state to past, update present
 * - Undo: move present to future, pop from past
 * - Redo: move present to past, pop from future
 * - Reset: clear all history
 * - Hydrate from localStorage
 * - Enforce max levels limit
 *
 * @param state Current undo/redo state
 * @param action Action to apply
 * @returns New undo/redo state
 */
export const undoRedoReducer = (state: UndoRedoState, action: UndoRedoAction): UndoRedoState => {
  switch (action.type) {
    case 'PUSH': {
      // Create new item
      const newItem = createUndoRedoItem(action.payload, action.label);

      // Check if state already matches present
      if (JSON.stringify(state.present.state) === JSON.stringify(action.payload)) {
        return state;
      }

      // Add current state to past
      const newPast = [...state.past, state.present];

      // Enforce max levels limit on past
      const pastToUse =
        newPast.length > state.maxLevels ? newPast.slice(-state.maxLevels) : newPast;

      // Clear future when new action is pushed
      return {
        ...state,
        past: pastToUse,
        present: newItem,
        future: [], // Clear redo stack
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) {
        return state; // Nothing to undo
      }

      // Pop from past
      const newPast = state.past.slice(0, -1);
      const newPresent = state.past[state.past.length - 1];
      const newFuture = [state.present, ...state.future];

      return {
        ...state,
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) {
        return state; // Nothing to redo
      }

      // Pop from future
      const newFuture = state.future.slice(1);
      const newPresent = state.future[0];
      const newPast = [...state.past, state.present];

      return {
        ...state,
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    }

    case 'RESET': {
      return {
        ...state,
        past: [],
        future: [],
      };
    }

    case 'CLEAR_FUTURE': {
      return {
        ...state,
        future: [],
      };
    }

    case 'HYDRATE_FROM_STORAGE':
      return action.payload;

    case 'SET_MAX_LEVELS': {
      const maxLevels = Math.max(5, action.payload); // Minimum 5 levels
      const past =
        state.past.length > maxLevels ? state.past.slice(-maxLevels) : state.past;

      return {
        ...state,
        maxLevels,
        past,
      };
    }

    default:
      return state;
  }
};

/**
 * Validate undo/redo state schema
 *
 * @param state State to validate
 * @returns true if valid, false otherwise
 */
const isValidUndoRedoState = (state: unknown): state is UndoRedoState => {
  if (typeof state !== 'object' || state === null) {
    return false;
  }

  const obj = state as Record<string, unknown>;

  // Check required fields
  if (!Array.isArray(obj.past)) return false;
  if (!Array.isArray(obj.future)) return false;
  if (typeof obj.maxLevels !== 'number') return false;
  if (typeof obj.present !== 'object' || obj.present === null) return false;

  // Validate present item
  const present = obj.present as Record<string, unknown>;
  if (
    typeof present.id !== 'string' ||
    typeof present.timestamp !== 'number' ||
    typeof present.state !== 'object' ||
    present.state === null
  ) {
    return false;
  }

  // Validate each item in past and future
  const validateItems = (items: unknown[]): boolean => {
    return items.every((item: unknown) => {
      if (typeof item !== 'object' || item === null) return false;
      const i = item as Record<string, unknown>;
      return (
        typeof i.id === 'string' &&
        typeof i.timestamp === 'number' &&
        typeof i.state === 'object' &&
        i.state !== null
      );
    });
  };

  return validateItems(obj.past) && validateItems(obj.future);
};

/**
 * Load undo/redo state from localStorage with validation
 *
 * @param storageKey Key to read from localStorage
 * @param initialState Initial filter state for present
 * @returns Validated undo/redo state or default
 */
const loadFromStorage = (storageKey: string, initialState: FilterState): UndoRedoState => {
  if (typeof window === 'undefined') {
    return {
      past: [],
      present: createInitialPresent(initialState),
      future: [],
      maxLevels: 20,
    };
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidUndoRedoState(parsed)) {
        return parsed;
      }
      console.warn(`[useUndoRedo] Invalid stored state for key "${storageKey}"`);
    }
  } catch (error) {
    console.warn(
      `[useUndoRedo] Error loading from localStorage: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }

  return {
    past: [],
    present: createInitialPresent(initialState),
    future: [],
    maxLevels: 20,
  };
};

/**
 * Save undo/redo state to localStorage with error handling
 *
 * @param storageKey Key to write to localStorage
 * @param state State to persist
 */
export const saveUndoRedoToStorage = (storageKey: string, state: UndoRedoState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`[useUndoRedo] localStorage quota exceeded for key "${storageKey}"`);
    } else {
      console.warn(
        `[useUndoRedo] Error saving to localStorage: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }
};

/**
 * useUndoRedo Hook - Manage undo/redo state with localStorage persistence
 *
 * Features:
 * - Tracks filter state history (up to 20 levels)
 * - Undo/redo support with separate past/future stacks
 * - Automatic localStorage sync on state changes
 * - Schema validation and error handling
 * - Graceful fallback on errors
 * - Future stack cleared when new action is pushed (standard undo/redo behavior)
 * - No external dependencies
 *
 * @param contextName Unique identifier for this undo/redo context (used in localStorage key)
 * @param initialState Initial filter state
 * @param maxLevels Maximum undo/redo levels to keep (default 20)
 * @returns Tuple of [state, dispatch] and convenience methods
 *
 * @example
 * const { state, dispatch, push, undo, redo, canUndo, canRedo } = useUndoRedo('builds', filterState, 20);
 *
 * // Push new state to undo stack
 * push(newFilterState, 'Applied search filter');
 *
 * // Undo previous action
 * if (canUndo) undo();
 *
 * // Redo previous undo
 * if (canRedo) redo();
 *
 * // Get current state
 * const currentState = state.present.state;
 */
export function useUndoRedo(
  contextName: string,
  initialState: FilterState,
  maxLevels: number = 20
): [
  UndoRedoState,
  React.Dispatch<UndoRedoAction>,
  {
    push: (state: FilterState, label?: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    reset: () => void;
  }
] {
  const storageKey = `undo-redo:${contextName}`;

  // Initialize from localStorage
  const [state, dispatch] = useReducer(undoRedoReducer, undefined, () => {
    const stored = loadFromStorage(storageKey, initialState);
    // Override maxLevels if provided
    if (maxLevels !== stored.maxLevels) {
      return { ...stored, maxLevels };
    }
    return stored;
  });

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveUndoRedoToStorage(storageKey, state);
  }, [state, storageKey]);

  // Convenience method to push new state
  const push = useCallback((filterState: FilterState, label?: string) => {
    dispatch({ type: 'PUSH', payload: filterState, label });
  }, []);

  // Convenience method to undo
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  // Convenience method to redo
  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  // Convenience method to reset
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Check if undo is possible
  const canUndo = state.past.length > 0;

  // Check if redo is possible
  const canRedo = state.future.length > 0;

  return [
    state,
    dispatch,
    {
      push,
      undo,
      redo,
      canUndo,
      canRedo,
      reset,
    },
  ];
}

export default useUndoRedo;
