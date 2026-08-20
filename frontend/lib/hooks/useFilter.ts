'use client';

import { useReducer } from 'react';

/**
 * State shape for filter management
 */
export interface FilterState {
  search: string;
  lastSynced?: number;
}

/**
 * Union type for all filter actions
 */
export type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'HYDRATE_FROM_STORAGE'; payload: FilterState }
  | { type: 'RESET_FILTERS' }
  | { type: 'UPDATE_STATE'; payload: Partial<FilterState> };


/**
 * Default initial state for filters
 */
export const defaultInitialState: FilterState = {
  search: '',
};

/**
 * Filter reducer function with 5 actions
 *
 * Actions:
 * - SET_SEARCH: Set search term
 * - CLEAR_SEARCH: Clear search term
 * - HYDRATE_FROM_STORAGE: Restore state from localStorage
 * - RESET_FILTERS: Reset all filters to default
 * - UPDATE_STATE: Merge partial state
 *
 * @param state Current filter state
 * @param action Action to apply
 * @returns New filter state
 */
export const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'CLEAR_SEARCH':
      return { ...state, search: '' };
    case 'HYDRATE_FROM_STORAGE':
      return action.payload;
    case 'RESET_FILTERS':
      return { ...defaultInitialState };
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

/**
 * Validate filter state schema
 *
 * @param state State to validate
 * @returns true if valid, false otherwise
 */
const isValidFilterState = (state: unknown): state is FilterState => {
  if (typeof state !== 'object' || state === null) {
    return false;
  }

  const obj = state as Record<string, unknown>;
  return (
    typeof obj.search === 'string' &&
    (obj.lastSynced === undefined || typeof obj.lastSynced === 'number')
  );
};

/**
 * Load filter state from localStorage with validation
 *
 * @param storageKey Key to read from localStorage
 * @returns Validated filter state or default
 */
const loadFromStorage = (storageKey: string): FilterState => {
  if (typeof window === 'undefined') {
    return defaultInitialState;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidFilterState(parsed)) {
        return parsed;
      }
      console.warn(`[useFilter] Invalid stored state for key "${storageKey}"`);
    }
  } catch (error) {
    console.warn(`[useFilter] Error loading from localStorage: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  return defaultInitialState;
};

/**
 * Save filter state to localStorage with error handling
 *
 * Used by components to persist filter state on blur or other events.
 * Adds a lastSynced timestamp automatically.
 *
 * @param storageKey Key to write to localStorage
 * @param state State to persist
 *
 * @example
 * const handleBlur = () => {
 *   saveToStorage('search-filter:builds', state);
 * }
 */
export const saveToStorage = (storageKey: string, state: FilterState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stateWithTimestamp = {
      ...state,
      lastSynced: Date.now(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`[useFilter] localStorage quota exceeded for key "${storageKey}"`);
    } else {
      console.warn(
        `[useFilter] Error saving to localStorage: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }
};

/**
 * useFilter Hook - Manage search/filter state with localStorage persistence
 *
 * Features:
 * - 5-action reducer for filter management
 * - localStorage sync with schema validation
 * - Error handling (quota exceeded, validation errors)
 * - Graceful fallback on errors
 * - No external dependencies
 *
 * @param contextName Unique identifier for this filter context (used in localStorage key)
 * @returns Tuple of [state, dispatch] similar to useReducer
 *
 * @example
 * const [state, dispatch] = useFilter('search');
 *
 * // Set search term
 * dispatch({ type: 'SET_SEARCH', payload: 'query' });
 *
 * // Clear search
 * dispatch({ type: 'CLEAR_SEARCH' });
 */
export function useFilter(
  contextName: string
): [FilterState, React.Dispatch<FilterAction>] {
  const storageKey = `search-filter:${contextName}`;

  // Initialize from localStorage
  const [state, dispatch] = useReducer(filterReducer, undefined, () =>
    loadFromStorage(storageKey)
  );

  // Return state and dispatch
  return [state, dispatch];
}

export default useFilter;
