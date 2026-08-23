'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  useSearchHighlight,
  SearchHighlightState,
  SearchHighlightAction,
} from './hooks/useSearchHighlight';

/**
 * Search highlight context for managing highlight state across components
 */
export const SearchHighlightContext = createContext<{
  state: SearchHighlightState;
  dispatch: React.Dispatch<SearchHighlightAction>;
  setSearchTerm: (term: string) => void;
  clearSearchTerm: () => void;
  toggleCaseSensitive: () => void;
  setHighlightedMatches: (count: number) => void;
  resetHighlighting: () => void;
} | undefined>(undefined);

/**
 * Props for SearchHighlightProvider component
 */
export interface SearchHighlightProviderProps {
  children: ReactNode;
}

/**
 * SearchHighlightProvider Component - Context provider for search highlighting
 *
 * Provides SearchHighlightContext to child components for centralized
 * search highlighting state management.
 *
 * Features:
 * - Provides highlight state and dispatch via context
 * - Convenience methods for common operations
 * - Fail-fast error on missing provider
 *
 * @example
 * <SearchHighlightProvider>
 *   <App />
 * </SearchHighlightProvider>
 */
export const SearchHighlightProvider: React.FC<SearchHighlightProviderProps> = ({
  children,
}) => {
  const {
    state,
    dispatch,
    setSearchTerm,
    clearSearchTerm,
    toggleCaseSensitive,
    setHighlightedMatches,
    resetHighlighting,
  } = useSearchHighlight();

  return (
    <SearchHighlightContext.Provider
      value={{
        state,
        dispatch,
        setSearchTerm,
        clearSearchTerm,
        toggleCaseSensitive,
        setHighlightedMatches,
        resetHighlighting,
      }}
    >
      {children}
    </SearchHighlightContext.Provider>
  );
};

SearchHighlightProvider.displayName = 'SearchHighlightProvider';

/**
 * useSearchHighlightContext Hook - Access search highlight state and dispatch
 *
 * Must be used within a SearchHighlightProvider. Throws error if provider is missing.
 * Enables fail-fast debugging if context is not properly wrapped.
 *
 * Features:
 * - Type-safe access to highlight state and methods
 * - Throws descriptive error if provider missing
 * - Direct access to reducer dispatch
 *
 * @returns Object with state, dispatch, and convenience methods
 * @throws Error if used outside SearchHighlightProvider
 *
 * @example
 * const { state, setSearchTerm } = useSearchHighlightContext();
 * setSearchTerm('query');
 */
export function useSearchHighlightContext() {
  const context = useContext(SearchHighlightContext);

  if (context === undefined) {
    throw new Error(
      'useSearchHighlightContext must be used within a SearchHighlightProvider. ' +
      'Wrap your component tree with <SearchHighlightProvider>...</SearchHighlightProvider>'
    );
  }

  return context;
}

export default SearchHighlightProvider;
