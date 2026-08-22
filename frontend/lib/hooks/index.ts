/**
 * React Hooks Exports
 *
 * Custom hooks for search, filter, history, and state management
 */

export { useFilter, filterReducer, defaultInitialState, saveToStorage, type FilterState, type FilterAction } from './useFilter';
export { useSearchHighlight, searchHighlightReducer, defaultSearchHighlightState, type SearchHighlightState, type SearchHighlightAction } from './useSearchHighlight';
export { useFilterHistory, filterHistoryReducer, defaultFilterHistoryState, saveHistoryToStorage, type FilterHistoryState, type FilterHistoryAction, type FilterHistoryItem } from './useFilterHistory';
