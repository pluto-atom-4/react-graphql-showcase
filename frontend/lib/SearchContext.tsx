'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FilterState, FilterAction, defaultInitialState, useFilter } from './hooks/useFilter';

/**
 * Search/Filter context for managing search state across components
 */
export const SearchContext = createContext<{
  state: FilterState;
  dispatch: React.Dispatch<FilterAction>;
} | undefined>(undefined);

/**
 * Props for SearchProvider component
 */
export interface SearchProviderProps {
  children: ReactNode;
  contextName?: string;
  initialState?: FilterState;
}

/**
 * SearchProvider Component - Context provider for search/filter functionality
 *
 * Provides SearchContext to child components for centralized search state management.
 * Uses useFilter hook for localStorage-backed state management and auto-persistence.
 *
 * Features:
 * - Provides FilterState and dispatch via context
 * - Automatic localStorage persistence (500ms debounce)
 * - Initializes from storage or provided initialState
 * - Fail-fast error on missing provider
 *
 * @example
 * <SearchProvider contextName="build-search">
 *   <App />
 * </SearchProvider>
 */
export const SearchProvider: React.FC<SearchProviderProps> = ({
  children,
  contextName = 'search',
  initialState = defaultInitialState,
}) => {
  // Use useFilter for automatic localStorage persistence
  const [baseState, dispatch] = useFilter(contextName);

  // Merge stored state with initialState seed: stored ?? initialState ?? defaults
  const state: FilterState = baseState || initialState || defaultInitialState;

  return (
    <SearchContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchContext.Provider>
  );
};

SearchProvider.displayName = 'SearchProvider';

/**
 * Alias for SearchProvider (backwards compatibility)
 */
export const FilterProvider = SearchProvider;

/**
 * useSearchContext Hook - Access search state and dispatch
 *
 * Must be used within a SearchProvider. Throws error if provider is missing.
 * Enables fail-fast debugging if context is not properly wrapped.
 *
 * Features:
 * - Type-safe access to search state and dispatch
 * - Throws descriptive error if provider missing
 *
 * @returns Object with state and dispatch
 * @throws Error if used outside SearchProvider
 *
 * @example
 * const { state, dispatch } = useSearchContext();
 * dispatch({ type: 'SET_SEARCH', payload: 'term' });
 */
export function useSearchContext(): {
  state: FilterState;
  dispatch: React.Dispatch<FilterAction>;
} {
  const context = useContext(SearchContext);

  if (context === undefined) {
    throw new Error(
      'useSearchContext must be used within a SearchProvider. ' +
      'Wrap your component tree with <SearchProvider>...</SearchProvider>'
    );
  }

  return context;
}

export default SearchProvider;
