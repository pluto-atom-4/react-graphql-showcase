'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { FilterState } from './useFilter';

/**
 * Single history entry with timestamp
 */
export interface FilterHistoryItem {
  id: string; // UUID v4 or similar
  state: FilterState;
  timestamp: number; // milliseconds since epoch
  label?: string; // Optional user-friendly label
}

/**
 * State shape for filter history management
 */
export interface FilterHistoryState {
  items: FilterHistoryItem[];
  maxItems: number; // Maximum number of items to keep (default 20)
}

/**
 * Union type for all filter history actions
 */
export type FilterHistoryAction =
  | { type: 'ADD_TO_HISTORY'; payload: FilterState; label?: string }
  | { type: 'REMOVE_FROM_HISTORY'; payload: string } // payload is item id
  | { type: 'CLEAR_HISTORY' }
  | { type: 'HYDRATE_FROM_STORAGE'; payload: FilterHistoryState }
  | { type: 'SET_MAX_ITEMS'; payload: number };

/**
 * Default initial state for filter history
 */
export const defaultFilterHistoryState: FilterHistoryState = {
  items: [],
  maxItems: 20,
};

/**
 * Generate a unique ID for history item
 * Simple implementation using timestamp + random
 *
 * @returns Unique ID string
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Create a history item from filter state
 *
 * @param state Filter state to store
 * @param label Optional label
 * @returns History item
 */
const createHistoryItem = (state: FilterState, label?: string): FilterHistoryItem => {
  return {
    id: generateId(),
    state,
    timestamp: Date.now(),
    label,
  };
};

/**
 * Filter history reducer function
 *
 * Manages history state:
 * - Adding new filter combinations (with max item limit)
 * - Removing specific items
 * - Clearing all history
 * - Hydrating from localStorage
 * - Adjusting max items limit
 *
 * @param state Current history state
 * @param action Action to apply
 * @returns New history state
 */
export const filterHistoryReducer = (
  state: FilterHistoryState,
  action: FilterHistoryAction
): FilterHistoryState => {
  switch (action.type) {
    case 'ADD_TO_HISTORY': {
      // Create new history item
      const newItem = createHistoryItem(action.payload, action.label);

      // Check if this exact filter state already exists at the top
      // If so, don't add a duplicate
      if (
        state.items.length > 0 &&
        JSON.stringify(state.items[0].state) === JSON.stringify(action.payload)
      ) {
        return state;
      }

      // Add to beginning (most recent first)
      const updated = [newItem, ...state.items];

      // Enforce max items limit
      if (updated.length > state.maxItems) {
        updated.pop(); // Remove oldest item (last in array)
      }

      return {
        ...state,
        items: updated,
      };
    }

    case 'REMOVE_FROM_HISTORY': {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        items: [],
      };
    }

    case 'HYDRATE_FROM_STORAGE':
      return action.payload;

    case 'SET_MAX_ITEMS': {
      const maxItems = Math.max(5, action.payload); // Minimum 5 items
      const items =
        state.items.length > maxItems
          ? state.items.slice(0, maxItems)
          : state.items;

      return {
        ...state,
        maxItems,
        items,
      };
    }

    default:
      return state;
  }
};

/**
 * Validate filter history state schema
 *
 * @param state State to validate
 * @returns true if valid, false otherwise
 */
const isValidFilterHistoryState = (state: unknown): state is FilterHistoryState => {
  if (typeof state !== 'object' || state === null) {
    return false;
  }

  const obj = state as Record<string, unknown>;

  // Check required fields
  if (!Array.isArray(obj.items)) return false;
  if (typeof obj.maxItems !== 'number') return false;

  // Validate each item
  if (
    !obj.items.every((item: unknown) => {
      if (typeof item !== 'object' || item === null) return false;
      const i = item as Record<string, unknown>;
      return (
        typeof i.id === 'string' &&
        typeof i.timestamp === 'number' &&
        typeof i.state === 'object' &&
        i.state !== null
      );
    })
  ) {
    return false;
  }

  return true;
};

/**
 * Load filter history from localStorage with validation
 *
 * @param storageKey Key to read from localStorage
 * @returns Validated history state or default
 */
const loadFromStorage = (storageKey: string): FilterHistoryState => {
  if (typeof window === 'undefined') {
    return defaultFilterHistoryState;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidFilterHistoryState(parsed)) {
        return parsed;
      }
      console.warn(`[useFilterHistory] Invalid stored state for key "${storageKey}"`);
    }
  } catch (error) {
    console.warn(
      `[useFilterHistory] Error loading from localStorage: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }

  return defaultFilterHistoryState;
};

/**
 * Save filter history to localStorage with error handling
 *
 * @param storageKey Key to write to localStorage
 * @param state State to persist
 */
export const saveHistoryToStorage = (storageKey: string, state: FilterHistoryState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`[useFilterHistory] localStorage quota exceeded for key "${storageKey}"`);
    } else {
      console.warn(
        `[useFilterHistory] Error saving to localStorage: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }
};

/**
 * useFilterHistory Hook - Manage filter history state with localStorage persistence
 *
 * Features:
 * - Tracks recent filter combinations (up to 20)
 * - Automatic localStorage sync on state changes
 * - Schema validation and error handling
 * - Graceful fallback on errors
 * - Most recent first ordering
 * - Duplicate prevention (same filters back-to-back)
 * - No external dependencies
 *
 * @param contextName Unique identifier for this history context (used in localStorage key)
 * @param maxItems Maximum items to keep (default 20)
 * @returns Tuple of [state, dispatch] and convenience methods
 *
 * @example
 * const { state, dispatch, addToHistory, removeFromHistory, clearHistory } = useFilterHistory('builds');
 *
 * // Add current filters to history
 * addToHistory(filterState, 'My saved filters');
 *
 * // Remove a specific history item
 * removeFromHistory(itemId);
 *
 * // Clear all history
 * clearHistory();
 */
export function useFilterHistory(
  contextName: string,
  maxItems: number = 20
): [
  FilterHistoryState,
  React.Dispatch<FilterHistoryAction>,
  {
    addToHistory: (state: FilterState, label?: string) => void;
    removeFromHistory: (id: string) => void;
    clearHistory: () => void;
  }
] {
  const storageKey = `filter-history:${contextName}`;

  // Initialize from localStorage
  const [state, dispatch] = useReducer(filterHistoryReducer, undefined, () => {
    const stored = loadFromStorage(storageKey);
    // Override maxItems if provided
    if (maxItems !== stored.maxItems) {
      return { ...stored, maxItems };
    }
    return stored;
  });

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveHistoryToStorage(storageKey, state);
  }, [state, storageKey]);

  // Convenience method to add to history
  const addToHistory = useCallback(
    (filterState: FilterState, label?: string) => {
      dispatch({ type: 'ADD_TO_HISTORY', payload: filterState, label });
    },
    []
  );

  // Convenience method to remove from history
  const removeFromHistory = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FROM_HISTORY', payload: id });
  }, []);

  // Convenience method to clear history
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  return [
    state,
    dispatch,
    {
      addToHistory,
      removeFromHistory,
      clearHistory,
    },
  ];
}

export default useFilterHistory;
