'use client';

import { useReducer, useEffect, useRef } from 'react';
import { sanitizeStatuses, type BuildStatus } from '../status-vocabulary';

/**
 * State shape for filter management
 *
 * Phase 1 fields:
 * - search: string - search term
 * - lastSynced?: number - last sync timestamp
 *
 * Phase 2 fields:
 * - statuses: BuildStatus[] - selected statuses (multi-select, max 4)
 * - dateStart?: string - start date in YYYY-MM-DD format
 * - dateEnd?: string - end date in YYYY-MM-DD format
 */
export interface FilterState {
  search: string;
  lastSynced?: number;
  statuses: BuildStatus[];
  dateStart?: string;
  dateEnd?: string;
}

/**
 * Union type for all filter actions (10 total)
 *
 * Phase 1 actions (5):
 * - SET_SEARCH: Set search term
 * - CLEAR_SEARCH: Clear search term
 * - HYDRATE_FROM_STORAGE: Restore state from localStorage
 * - RESET_FILTERS: Reset all filters to default
 * - UPDATE_STATE: Merge partial state
 *
 * Phase 2 actions (5):
 * - ADD_STATUS: Add a status to selection
 * - REMOVE_STATUS: Remove a status from selection
 * - TOGGLE_STATUS: Toggle a status (add if not present, remove if present)
 * - SET_DATE_RANGE: Set both start and end dates
 * - CLEAR_DATE_RANGE: Clear date filters
 */
export type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'HYDRATE_FROM_STORAGE'; payload: FilterState }
  | { type: 'RESET_FILTERS' }
  | { type: 'UPDATE_STATE'; payload: Partial<FilterState> }
  | { type: 'ADD_STATUS'; payload: BuildStatus }
  | { type: 'REMOVE_STATUS'; payload: BuildStatus }
  | { type: 'TOGGLE_STATUS'; payload: BuildStatus }
  | { type: 'SET_DATE_RANGE'; payload: { start?: string; end?: string } }
  | { type: 'CLEAR_DATE_RANGE' };


/**
 * Default initial state for filters
 */
export const defaultInitialState: FilterState = {
  search: '',
  statuses: [],
};

/**
 * Count total active filters (excluding empty values)
 * - search (1 if non-empty)
 * - each status (1 per status)
 * - dateStart (1 if present)
 * - dateEnd (1 if present)
 *
 * @param state Filter state
 * @returns Total filter count
 */
const countActiveFilters = (state: FilterState): number => {
  let count = 0;
  if (state.search) count++;
  count += state.statuses.length;
  if (state.dateStart) count++;
  if (state.dateEnd) count++;
  return count;
};

/**
 * Validate date range (end >= start)
 *
 * @param start Start date in YYYY-MM-DD format
 * @param end End date in YYYY-MM-DD format
 * @returns true if valid, false otherwise
 */
const isValidDateRange = (start?: string, end?: string): boolean => {
  if (!start || !end) return true; // Valid if either is empty
  return end >= start;
};

/**
 * Filter reducer function with 10 actions (Phase 1 + Phase 2)
 *
 * Phase 1 Actions (5):
 * - SET_SEARCH: Set search term
 * - CLEAR_SEARCH: Clear search term
 * - HYDRATE_FROM_STORAGE: Restore state from localStorage
 * - RESET_FILTERS: Reset all filters to default
 * - UPDATE_STATE: Merge partial state
 *
 * Phase 2 Actions (5):
 * - ADD_STATUS: Add a status (max 10 filters enforced)
 * - REMOVE_STATUS: Remove a status
 * - TOGGLE_STATUS: Toggle status on/off
 * - SET_DATE_RANGE: Set date range (validates end >= start)
 * - CLEAR_DATE_RANGE: Clear date filters
 *
 * Max Filters: Enforces 10 total filters (search + statuses + dates)
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

    case 'ADD_STATUS': {
      // Check if already present
      if (state.statuses.includes(action.payload)) {
        return state;
      }
      // Check max filters: search (1) + current statuses + new status (1) + dates (0-2)
      const wouldBe = countActiveFilters(state) + 1;
      if (wouldBe > 10) {
        console.warn(
          `[useFilter] Cannot add status: max 10 filters exceeded (would be ${wouldBe})`
        );
        return state;
      }
      return {
        ...state,
        statuses: [...state.statuses, action.payload],
      };
    }

    case 'REMOVE_STATUS': {
      return {
        ...state,
        statuses: state.statuses.filter((s) => s !== action.payload),
      };
    }

    case 'TOGGLE_STATUS': {
      if (state.statuses.includes(action.payload)) {
        // Remove if present
        return {
          ...state,
          statuses: state.statuses.filter((s) => s !== action.payload),
        };
      } else {
        // Add if not present (with max filters check)
        const wouldBe = countActiveFilters(state) + 1;
        if (wouldBe > 10) {
          console.warn(
            `[useFilter] Cannot toggle status: max 10 filters exceeded (would be ${wouldBe})`
          );
          return state;
        }
        return {
          ...state,
          statuses: [...state.statuses, action.payload],
        };
      }
    }

    case 'SET_DATE_RANGE': {
      const start = action.payload.start ?? state.dateStart;
      const end = action.payload.end ?? state.dateEnd;

      // Validate date range
      if (!isValidDateRange(start, end)) {
        console.warn(
          `[useFilter] Invalid date range: end date must be >= start date`
        );
        return state;
      }

      // Check max filters
      const newDatesCount = (start ? 1 : 0) + (end ? 1 : 0);
      const oldDatesCount = (state.dateStart ? 1 : 0) + (state.dateEnd ? 1 : 0);
      const dateDiff = newDatesCount - oldDatesCount;

      if (dateDiff > 0) {
        const wouldBe = countActiveFilters(state) + dateDiff;
        if (wouldBe > 10) {
          console.warn(
            `[useFilter] Cannot set date range: max 10 filters exceeded (would be ${wouldBe})`
          );
          return state;
        }
      }

      return {
        ...state,
        dateStart: start,
        dateEnd: end,
      };
    }

    case 'CLEAR_DATE_RANGE': {
      return {
        ...state,
        dateStart: undefined,
        dateEnd: undefined,
      };
    }

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
 * Drop statuses that are not part of the canonical vocabulary, keeping the rest
 * of the state intact.
 *
 * Rehydration must fail *open*, not closed. Builds before #347 persisted
 * 'Active' / 'Idle' / 'Completed', which no longer exist. Rejecting the whole
 * blob would silently throw away the user's search term and date range too, so
 * only the unrecognised statuses are removed.
 *
 * Returns the input unchanged (same reference) when nothing had to be dropped.
 *
 * @param state Filter state, possibly rehydrated from an older schema
 * @returns State whose `statuses` contains only known BuildStatus members
 *
 * @example
 * sanitizeFilterState({ search: 'x', statuses: ['Active', 'FAILED'] });
 * // { search: 'x', statuses: ['FAILED'] }
 */
export const sanitizeFilterState = (state: FilterState): FilterState => {
  const statuses = sanitizeStatuses(state.statuses);
  if (Array.isArray(state.statuses) && statuses.length === state.statuses.length) {
    return state;
  }
  return { ...state, statuses };
};

/**
 * Validate filter state schema
 *
 * Handles both Phase 1 (search only) and Phase 2 (search + statuses + dates) formats.
 * Automatically upgrades old format to new format.
 *
 * Unknown status values are NOT a validation failure - `loadFromStorage` drops
 * them via `sanitizeFilterState` instead. See that function for why.
 *
 * @param state State to validate
 * @returns true if valid, false otherwise
 */
const isValidFilterState = (state: unknown): state is FilterState => {
  if (typeof state !== 'object' || state === null) {
    return false;
  }

  const obj = state as Record<string, unknown>;

  // Required fields
  if (typeof obj.search !== 'string') return false;

  // Optional fields
  if (obj.lastSynced !== undefined && typeof obj.lastSynced !== 'number') return false;
  if (obj.dateStart !== undefined && typeof obj.dateStart !== 'string') return false;
  if (obj.dateEnd !== undefined && typeof obj.dateEnd !== 'string') return false;

  return true;
};

/**
 * Load filter state from localStorage with validation
 *
 * Handles backward compatibility: upgrades Phase 1 format (search-only) to Phase 2 format.
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
      const parsed: unknown = JSON.parse(stored);
      if (isValidFilterState(parsed)) {
        // Migrate Phase 1 format (search only) to Phase 2, and drop any status
        // value that is no longer part of the schema vocabulary.
        const statuses = sanitizeStatuses(parsed.statuses);
        if (Array.isArray(parsed.statuses) && statuses.length !== parsed.statuses.length) {
          console.warn(
            `[useFilter] Dropped unrecognized status values for key "${storageKey}"`
          );
        }
        const migrated: FilterState = {
          search: parsed.search,
          statuses,
          lastSynced: parsed.lastSynced,
          dateStart: parsed.dateStart,
          dateEnd: parsed.dateEnd,
        };
        return migrated;
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
 * @param seed Optional initial state to use if localStorage is empty (used by SearchProvider)
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
 *
 * // With custom seed (used by SearchProvider)
 * const [state, dispatch] = useFilter('search', { search: 'initial', statuses: [] });
 */
export function useFilter(
  contextName: string,
  seed?: FilterState
): [FilterState, React.Dispatch<FilterAction>] {
  const storageKey = `search-filter:${contextName}`;
  const isFirstRender = useRef(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<FilterState>(defaultInitialState);

  // Initialize from localStorage with seed fallback
  const [state, dispatch] = useReducer(filterReducer, undefined, () => {
    // Try to load from storage first
    const stored = loadFromStorage(storageKey);

    // If storage returned the default state (nothing found or invalid),
    // check if we should use the seed instead
    if (stored === defaultInitialState && seed !== undefined) {
      // Check if storage actually has the key (not just validation failure)
      if (typeof window !== 'undefined') {
        const storageKey = `search-filter:${contextName}`;
        if (!window.localStorage.getItem(storageKey)) {
          // Key doesn't exist and seed is provided, use seed
          return seed;
        }
      }
    }

    // Use stored value (either has content or key exists with invalid data)
    return stored;
  });

  // Update ref with latest state (for use in unmount cleanup)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Debounced auto-save to localStorage on state change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip first render to prevent hydration issues
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced timer
    debounceTimerRef.current = setTimeout(() => {
      saveToStorage(storageKey, state);
    }, 500);

    // Cleanup: only clear the timer, don't save here
    // (flushing pending writes is handled by the unmount effect below)
    return (): void => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state, storageKey]);

  // Flush pending writes on unmount
  useEffect(() => {
    return (): void => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        // Flush the pending write with the latest state
        saveToStorage(storageKey, stateRef.current);
      }
    };
  }, [storageKey]);

  // Return state and dispatch
  return [state, dispatch];
}

export default useFilter;
