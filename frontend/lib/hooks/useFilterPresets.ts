'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { FilterState, sanitizeFilterState } from './useFilter';

/**
 * Single preset entry with metadata
 */
export interface FilterPreset {
  id: string; // UUID v4 or similar
  name: string; // User-provided name (max 50 chars)
  state: FilterState; // The complete filter state
  createdAt: number; // milliseconds since epoch
  lastUsed?: number; // When preset was last selected/used
}

/**
 * State shape for filter presets management
 */
export interface FilterPresetsState {
  presets: FilterPreset[];
  maxPresets: number; // Maximum number of presets to keep (default 10)
}

/**
 * Union type for all filter preset actions
 */
export type FilterPresetsAction =
  | { type: 'CREATE_PRESET'; payload: { name: string; state: FilterState } }
  | { type: 'DELETE_PRESET'; payload: string } // payload is preset id
  | { type: 'RENAME_PRESET'; payload: { id: string; name: string } }
  | { type: 'UPDATE_PRESET_STATE'; payload: { id: string; state: FilterState } }
  | { type: 'RECORD_PRESET_USAGE'; payload: string } // payload is preset id
  | { type: 'CLEAR_PRESETS' }
  | { type: 'HYDRATE_FROM_STORAGE'; payload: FilterPresetsState }
  | { type: 'SET_MAX_PRESETS'; payload: number };

/**
 * Default initial state for filter presets
 */
export const defaultFilterPresetsState: FilterPresetsState = {
  presets: [],
  maxPresets: 10,
};

/**
 * Generate a unique ID for preset
 * Simple implementation using timestamp + random
 *
 * @returns Unique ID string
 */
const generateId = (): string => {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Validate preset name (not empty, max 50 chars)
 *
 * @param name Name to validate
 * @returns true if valid, false otherwise
 */
const isValidPresetName = (name: string): boolean => {
  return typeof name === 'string' && name.length > 0 && name.length <= 50;
};

/**
 * Trim preset name to max 50 chars
 *
 * @param name Name to trim
 * @returns Trimmed name
 */
const trimPresetName = (name: string): string => {
  return name.slice(0, 50);
};

/**
 * Filter presets reducer function
 *
 * Manages presets state:
 * - Creating new presets with name and filter state (with max preset limit)
 * - Deleting specific presets
 * - Renaming presets
 * - Updating preset filter state
 * - Recording when a preset is used
 * - Clearing all presets
 * - Hydrating from localStorage
 * - Adjusting max presets limit
 *
 * @param state Current presets state
 * @param action Action to apply
 * @returns New presets state
 */
export const filterPresetsReducer = (
  state: FilterPresetsState,
  action: FilterPresetsAction
): FilterPresetsState => {
  switch (action.type) {
    case 'CREATE_PRESET': {
      // Validate name
      if (!isValidPresetName(action.payload.name)) {
        console.warn(
          `[useFilterPresets] Cannot create preset: name must be 1-50 characters`
        );
        return state;
      }

      // Check if preset with same name already exists (case-insensitive)
      const nameExists = state.presets.some(
        (p) => p.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      if (nameExists) {
        console.warn(
          `[useFilterPresets] Cannot create preset: name "${action.payload.name}" already exists`
        );
        return state;
      }

      // Check max presets limit
      if (state.presets.length >= state.maxPresets) {
        console.warn(
          `[useFilterPresets] Cannot create preset: max ${state.maxPresets} presets reached`
        );
        return state;
      }

      // Create new preset
      const newPreset: FilterPreset = {
        id: generateId(),
        name: trimPresetName(action.payload.name),
        state: action.payload.state,
        createdAt: Date.now(),
      };

      return {
        ...state,
        presets: [...state.presets, newPreset],
      };
    }

    case 'DELETE_PRESET': {
      return {
        ...state,
        presets: state.presets.filter((p) => p.id !== action.payload),
      };
    }

    case 'RENAME_PRESET': {
      // Validate new name
      if (!isValidPresetName(action.payload.name)) {
        console.warn(
          `[useFilterPresets] Cannot rename preset: name must be 1-50 characters`
        );
        return state;
      }

      // Check if new name already exists (case-insensitive, excluding current preset)
      const nameExists = state.presets.some(
        (p) =>
          p.id !== action.payload.id &&
          p.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      if (nameExists) {
        console.warn(
          `[useFilterPresets] Cannot rename preset: name "${action.payload.name}" already exists`
        );
        return state;
      }

      return {
        ...state,
        presets: state.presets.map((p) =>
          p.id === action.payload.id
            ? { ...p, name: trimPresetName(action.payload.name) }
            : p
        ),
      };
    }

    case 'UPDATE_PRESET_STATE': {
      return {
        ...state,
        presets: state.presets.map((p) =>
          p.id === action.payload.id
            ? { ...p, state: action.payload.state }
            : p
        ),
      };
    }

    case 'RECORD_PRESET_USAGE': {
      return {
        ...state,
        presets: state.presets.map((p) =>
          p.id === action.payload
            ? { ...p, lastUsed: Date.now() }
            : p
        ),
      };
    }

    case 'CLEAR_PRESETS': {
      return {
        ...state,
        presets: [],
      };
    }

    case 'HYDRATE_FROM_STORAGE':
      return action.payload;

    case 'SET_MAX_PRESETS': {
      const maxPresets = Math.max(1, action.payload); // Minimum 1 preset
      const presets =
        state.presets.length > maxPresets
          ? state.presets.slice(0, maxPresets)
          : state.presets;

      return {
        ...state,
        maxPresets,
        presets,
      };
    }

    default:
      return state;
  }
};

/**
 * Validate filter presets state schema
 *
 * @param state State to validate
 * @returns true if valid, false otherwise
 */
const isValidFilterPresetsState = (state: unknown): state is FilterPresetsState => {
  if (typeof state !== 'object' || state === null) {
    return false;
  }

  const obj = state as Record<string, unknown>;

  // Check required fields
  if (!Array.isArray(obj.presets)) return false;
  if (typeof obj.maxPresets !== 'number') return false;

  // Validate each preset
  if (
    !obj.presets.every((preset: unknown) => {
      if (typeof preset !== 'object' || preset === null) return false;
      const p = preset as Record<string, unknown>;
      return (
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        typeof p.createdAt === 'number' &&
        typeof p.state === 'object' &&
        p.state !== null &&
        (p.lastUsed === undefined || typeof p.lastUsed === 'number')
      );
    })
  ) {
    return false;
  }

  return true;
};

/**
 * Load filter presets from localStorage with validation
 *
 * @param storageKey Key to read from localStorage
 * @returns Validated presets state or default
 */
const loadFromStorage = (storageKey: string): FilterPresetsState => {
  if (typeof window === 'undefined') {
    return defaultFilterPresetsState;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (isValidFilterPresetsState(parsed)) {
        // Drop statuses that are no longer part of the schema vocabulary
        // rather than discarding the whole preset. See sanitizeFilterState.
        return {
          ...parsed,
          presets: parsed.presets.map((preset) => ({
            ...preset,
            state: sanitizeFilterState(preset.state),
          })),
        };
      }
      console.warn(`[useFilterPresets] Invalid stored state for key "${storageKey}"`);
    }
  } catch (error) {
    console.warn(
      `[useFilterPresets] Error loading from localStorage: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }

  return defaultFilterPresetsState;
};

/**
 * Save filter presets to localStorage with error handling
 *
 * @param storageKey Key to write to localStorage
 * @param state State to persist
 */
export const savePresetsToStorage = (storageKey: string, state: FilterPresetsState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`[useFilterPresets] localStorage quota exceeded for key "${storageKey}"`);
    } else {
      console.warn(
        `[useFilterPresets] Error saving to localStorage: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }
};

/**
 * useFilterPresets Hook - Manage filter presets state with localStorage persistence
 *
 * Features:
 * - Tracks user-created filter presets (up to 10)
 * - Create presets with custom names
 * - Delete presets
 * - Rename presets (with duplicate name prevention)
 * - Update preset filter state
 * - Record usage timestamps
 * - Automatic localStorage sync on state changes
 * - Schema validation and error handling
 * - Graceful fallback on errors
 * - No external dependencies
 *
 * @param contextName Unique identifier for this presets context (used in localStorage key)
 * @param maxPresets Maximum presets to keep (default 10)
 * @returns Tuple of [state, dispatch] and convenience methods
 *
 * @example
 * const { state, dispatch, createPreset, deletePreset, renamePreset } = useFilterPresets('builds');
 *
 * // Create a new preset
 * createPreset('My Filters', filterState);
 *
 * // Delete a preset
 * deletePreset(presetId);
 *
 * // Rename a preset
 * renamePreset(presetId, 'Updated Name');
 *
 * // Record when preset is used
 * recordUsage(presetId);
 */
export function useFilterPresets(
  contextName: string,
  maxPresets: number = 10
): [
  FilterPresetsState,
  React.Dispatch<FilterPresetsAction>,
  {
    createPreset: (name: string, state: FilterState) => void;
    deletePreset: (id: string) => void;
    renamePreset: (id: string, name: string) => void;
    updatePresetState: (id: string, state: FilterState) => void;
    recordUsage: (id: string) => void;
    clearPresets: () => void;
  }
] {
  const storageKey = `filter-presets:${contextName}`;

  // Initialize from localStorage
  const [state, dispatch] = useReducer(filterPresetsReducer, undefined, () => {
    const stored = loadFromStorage(storageKey);
    // Override maxPresets if provided
    if (maxPresets !== stored.maxPresets) {
      return { ...stored, maxPresets };
    }
    return stored;
  });

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    savePresetsToStorage(storageKey, state);
  }, [state, storageKey]);

  // Convenience method to create preset
  const createPreset = useCallback(
    (name: string, filterState: FilterState) => {
      dispatch({ type: 'CREATE_PRESET', payload: { name, state: filterState } });
    },
    []
  );

  // Convenience method to delete preset
  const deletePreset = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PRESET', payload: id });
  }, []);

  // Convenience method to rename preset
  const renamePreset = useCallback((id: string, name: string) => {
    dispatch({ type: 'RENAME_PRESET', payload: { id, name } });
  }, []);

  // Convenience method to update preset state
  const updatePresetState = useCallback((id: string, filterState: FilterState) => {
    dispatch({ type: 'UPDATE_PRESET_STATE', payload: { id, state: filterState } });
  }, []);

  // Convenience method to record preset usage
  const recordUsage = useCallback((id: string) => {
    dispatch({ type: 'RECORD_PRESET_USAGE', payload: id });
  }, []);

  // Convenience method to clear all presets
  const clearPresets = useCallback(() => {
    dispatch({ type: 'CLEAR_PRESETS' });
  }, []);

  return [
    state,
    dispatch,
    {
      createPreset,
      deletePreset,
      renamePreset,
      updatePresetState,
      recordUsage,
      clearPresets,
    },
  ];
}

export default useFilterPresets;
