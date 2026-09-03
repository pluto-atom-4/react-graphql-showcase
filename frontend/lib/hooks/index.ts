/**
 * React Hooks Exports
 *
 * Custom hooks for search, filter, history, presets, and state management
 */

export { useFilter, filterReducer, defaultInitialState, saveToStorage, type FilterState, type FilterAction } from './useFilter';
export { useSearchHighlight, searchHighlightReducer, defaultSearchHighlightState, type SearchHighlightState, type SearchHighlightAction } from './useSearchHighlight';
export { useFilterHistory, filterHistoryReducer, defaultFilterHistoryState, saveHistoryToStorage, type FilterHistoryState, type FilterHistoryAction, type FilterHistoryItem } from './useFilterHistory';
export { useFilterPresets, filterPresetsReducer, defaultFilterPresetsState, savePresetsToStorage, type FilterPresetsState, type FilterPresetsAction, type FilterPreset } from './useFilterPresets';
export { useUndoRedo, undoRedoReducer, saveUndoRedoToStorage, type UndoRedoState, type UndoRedoAction, type UndoRedoItem } from './useUndoRedo';
export { useKeyboardNav, type KeyboardNavConfig } from './useKeyboardNav';
export { useDelayedVisibility } from './useDelayedVisibility';
