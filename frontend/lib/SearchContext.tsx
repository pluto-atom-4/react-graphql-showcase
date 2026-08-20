'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { filterReducer, FilterState, FilterAction, defaultInitialState } from './hooks/useFilter';

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
  initialState?: FilterState;
}

/**
 * SearchProvider Component - Context provider for search/filter functionality
 *
 * Provides SearchContext to child components for centralized search state management.
 * Wraps the useFilter reducer to expose state and dispatch via context.
 *
 * Features:
 * - Provides FilterState and dispatch via context
 * - Initializes with optional custom state
 * - Fail-fast error on missing provider
 *
 * @example
 * <SearchProvider contextName="build-search" initialState={{ search: '' }}>
 *   <App />
 * </SearchProvider>
 */
export const SearchProvider: React.FC<SearchProviderProps> = ({
  children,
  initialState = defaultInitialState,
}) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);

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
