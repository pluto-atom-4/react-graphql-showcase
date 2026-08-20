/**
 * Library Utilities and Context Exports
 *
 * Search and filter utilities, context providers, and helpers
 */

// Context
export { SearchProvider, FilterProvider, useSearchContext, SearchContext, type SearchProviderProps } from './SearchContext';

// Utilities
export { highlightSearchTerm, escapeRegexSpecialChars, type HighlightOptions } from './search-highlight';

// Re-export hooks
export { useFilter, filterReducer, defaultInitialState, saveToStorage, type FilterState, type FilterAction } from './hooks';
