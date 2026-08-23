'use client';

import { useReducer, useCallback } from 'react';

/**
 * State shape for search highlighting
 */
export interface SearchHighlightState {
  searchTerm: string;
  isActive: boolean;
  caseSensitive: boolean;
  highlightedMatches: number;
}

/**
 * Union type for all search highlight actions
 */
export type SearchHighlightAction =
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'CLEAR_SEARCH_TERM' }
  | { type: 'TOGGLE_CASE_SENSITIVE' }
  | { type: 'SET_HIGHLIGHTED_MATCHES'; payload: number }
  | { type: 'RESET_HIGHLIGHTING' };

/**
 * Default initial state for search highlighting
 */
export const defaultSearchHighlightState: SearchHighlightState = {
  searchTerm: '',
  isActive: false,
  caseSensitive: false,
  highlightedMatches: 0,
};

/**
 * Search highlight reducer function
 *
 * Manages highlight state:
 * - Search term tracking
 * - Active/inactive state
 * - Case sensitivity toggle
 * - Match count tracking
 *
 * @param state Current highlight state
 * @param action Action to apply
 * @returns New highlight state
 */
export const searchHighlightReducer = (
  state: SearchHighlightState,
  action: SearchHighlightAction
): SearchHighlightState => {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload,
        isActive: action.payload.trim().length > 0,
        highlightedMatches: 0, // Reset match count when search term changes
      };

    case 'CLEAR_SEARCH_TERM':
      return {
        ...state,
        searchTerm: '',
        isActive: false,
        highlightedMatches: 0,
      };

    case 'TOGGLE_CASE_SENSITIVE':
      return {
        ...state,
        caseSensitive: !state.caseSensitive,
      };

    case 'SET_HIGHLIGHTED_MATCHES':
      return {
        ...state,
        highlightedMatches: action.payload,
      };

    case 'RESET_HIGHLIGHTING':
      return { ...defaultSearchHighlightState };

    default:
      return state;
  }
};

/**
 * useSearchHighlight Hook - Manage search highlighting state
 *
 * Features:
 * - Tracks search term for highlighting
 * - Manages active/inactive state
 * - Supports case-sensitive toggle
 * - Tracks number of matches found
 * - Reducer-based state management
 *
 * @returns Tuple of [state, dispatch] and convenience methods
 *
 * @example
 * const { state, dispatch, setSearchTerm, clearSearchTerm } = useSearchHighlight();
 *
 * // Set search term
 * setSearchTerm('query');
 *
 * // Clear highlighting
 * clearSearchTerm();
 */
export function useSearchHighlight() {
  const [state, dispatch] = useReducer(
    searchHighlightReducer,
    defaultSearchHighlightState
  );

  // Convenience method to set search term
  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  // Convenience method to clear search term
  const clearSearchTerm = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH_TERM' });
  }, []);

  // Convenience method to toggle case sensitivity
  const toggleCaseSensitive = useCallback(() => {
    dispatch({ type: 'TOGGLE_CASE_SENSITIVE' });
  }, []);

  // Convenience method to set number of highlighted matches
  const setHighlightedMatches = useCallback((count: number) => {
    dispatch({ type: 'SET_HIGHLIGHTED_MATCHES', payload: count });
  }, []);

  // Convenience method to reset all highlighting
  const resetHighlighting = useCallback(() => {
    dispatch({ type: 'RESET_HIGHLIGHTING' });
  }, []);

  return {
    state,
    dispatch,
    setSearchTerm,
    clearSearchTerm,
    toggleCaseSensitive,
    setHighlightedMatches,
    resetHighlighting,
  };
}

export default useSearchHighlight;
