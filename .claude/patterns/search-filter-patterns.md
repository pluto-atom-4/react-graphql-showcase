# Search & Filtering Patterns - Phase 3

This document provides implementation patterns and best practices for the advanced search and filtering system (Phase 3, Issue #335).

## Overview

Phase 3 provides a complete, production-ready search and filtering system with four major features:

1. **Phase 3.1**: Search Highlighting - Real-time highlighting of search terms
2. **Phase 3.2**: Filter History - Automatic tracking of filter changes
3. **Phase 3.3**: Filter Presets - Save and restore filter combinations
4. **Phase 3.4**: Keyboard Navigation & Undo/Redo - Full accessibility support

All features integrate seamlessly through the `FilterBar` component and work with localStorage for persistence.

## Quick Start

```tsx
import { useFilter } from '@/lib/hooks/useFilter';
import { useFilterHistory } from '@/lib/hooks/useFilterHistory';
import { useFilterPresets } from '@/lib/hooks/useFilterPresets';
import { useUndoRedo } from '@/lib/hooks/useUndoRedo';
import { FilterBar } from '@/components/FilterBar';

export function SearchExample() {
  // Returns: [FilterState, Dispatch<FilterAction>]
  const [filters, dispatch] = useFilter('my-filters');
  
  // Returns: [FilterHistoryState, Dispatch, { addToHistory, removeFromHistory, clearHistory }]
  const [history, historyDispatch, historyHelpers] = useFilterHistory('my-filters');
  
  // Returns: [FilterPresetsState, Dispatch, { createPreset, deletePreset, renamePreset, ... }]
  const [presets, presetsDispatch, presetsHelpers] = useFilterPresets('my-filters');
  
  // Returns: [UndoRedoState, Dispatch, { push, undo, redo, canUndo, canRedo, reset }]
  const [undoRedo, undoRedoDispatch, undoRedoHelpers] = useUndoRedo('my-filters', filters);

  return (
    <FilterBar
      filters={filters}
      onFilterChange={dispatch}
      history={history}
      presets={presets}
      undoRedo={undoRedo}
      onSelectFromHistory={(item) => dispatch({ type: 'UPDATE_STATE', payload: item.filters })}
      onSelectPreset={(preset) => dispatch({ type: 'UPDATE_STATE', payload: preset.filters })}
      onCreatePreset={(name) => presetsHelpers.createPreset(name)}
      onUndo={() => undoRedoHelpers.undo()}
      onRedo={() => undoRedoHelpers.redo()}
    />
  );
}
```

## Phase 3.1: Search Highlighting

### Overview

Search highlighting provides real-time visual feedback for search queries with case sensitivity options.

### Key Features

- **Search Term Tracking**: Maintains current search term in state
- **Case Sensitivity**: Toggle between case-sensitive and case-insensitive matching
- **Match Counter**: Tracks number of matches found
- **Active State**: Indicates when highlighting is active

### Implementation

```tsx
import { useSearchHighlight } from '@/lib/hooks/useSearchHighlight';

export function SearchableList() {
  const { state, setSearchTerm, clearSearchTerm, toggleCaseSensitive } = 
    useSearchHighlight();

  const highlightMatches = (text: string) => {
    if (!state.searchTerm) return text;
    
    const flags = state.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${state.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
    
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  return (
    <>
      <input
        value={state.searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      <label>
        <input
          type="checkbox"
          checked={state.caseSensitive}
          onChange={toggleCaseSensitive}
        />
        Case Sensitive
      </label>
      <div>Matches: {state.highlightedMatches}</div>
    </>
  );
}
```

### Pattern: Safe Regex Escaping

Always escape special characters in search terms:

```typescript
const escapeRegexString = (str: string): string => 
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Usage
const regex = new RegExp(`(${escapeRegexString(searchTerm)})`, 'gi');
```

## Phase 3.2: Filter History

### Overview

Filter history automatically tracks all filter changes, enabling users to recall previous filter states without duplicates.

### Key Features

- **Automatic Tracking**: Records every filter change
- **Duplicate Prevention**: Avoids consecutive identical states
- **Configurable Limit**: Customize max history items (default: 50)
- **localStorage Persistence**: Auto-saves to browser storage

### Implementation

```tsx
import { useFilterHistory } from '@/lib/hooks/useFilterHistory';

export function FilterHistoryExample() {
  const [history, dispatch, { addToHistory }] = useFilterHistory('my-filters');

  const handleFilterChange = (newFilters: FilterState) => {
    // History automatically prevents duplicates
    addToHistory(newFilters);
  };

  return (
    <>
      <button onClick={() => {
        if (history.items[0]) {
          dispatch({ type: 'RESTORE_FROM_HISTORY', payload: history.items[0].filters });
        }
      }}>
        Restore Previous
      </button>
      <div>History Items: {history.items.length}</div>
      <ul>
        {history.items.map((item) => (
          <li key={item.id}>
            {item.filters.search} at {new Date(item.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </>
  );
}
```

### Pattern: Duplicate Detection

The hook prevents duplicate consecutive history items:

```typescript
const addToHistory = (filters: FilterState) => {
  const lastItem = history.items[history.items.length - 1];
  
  // Skip if identical to last item
  if (lastItem && JSON.stringify(lastItem.filters) === JSON.stringify(filters)) {
    return;
  }

  // Add new item
  dispatch({
    type: 'ADD_HISTORY_ITEM',
    payload: { id: generateId(), timestamp: Date.now(), filters }
  });
};
```

## Phase 3.3: Filter Presets

### Overview

Presets allow users to save and restore frequently used filter combinations with names for easy reference.

### Key Features

- **Create Presets**: Save current filter state with custom name
- **Load Presets**: Quickly restore saved filter combinations
- **Rename Presets**: Update preset names
- **Delete Presets**: Remove unwanted presets
- **localStorage Persistence**: Auto-saves to browser storage

### Implementation

```tsx
import { useFilterPresets } from '@/lib/hooks/useFilterPresets';

export function PresetsExample() {
  const [presets, dispatch, { createPreset, deletePreset, renamePreset }] = 
    useFilterPresets('my-filters');

  const handleSavePreset = (name: string) => {
    // createPreset returns void, preset is saved via dispatch
    createPreset(name);
    console.log('Preset saved');
  };

  return (
    <>
      <input
        type="text"
        placeholder="New preset name"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSavePreset(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />

      <ul>
        {presets.presets.map((preset) => (
          <li key={preset.id}>
            <span>{preset.name}</span>
            <button onClick={() => renamePreset(preset.id, 'New Name')}>
              Rename
            </button>
            <button onClick={() => deletePreset(preset.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </>
  );
}
```

### Pattern: Preset Validation

Always validate presets before restoration:

```typescript
const selectPreset = (preset: FilterPreset) => {
  // Validate preset structure
  if (!preset.filters || typeof preset.filters.search !== 'string') {
    console.error('Invalid preset structure');
    return false;
  }

  dispatch({ type: 'UPDATE_STATE', payload: preset.filters });
  return true;
};
```

## Phase 3.4: Keyboard Navigation & Undo/Redo

### Overview

Complete keyboard support including undo/redo functionality for accessibility and power-user workflows.

### Undo/Redo Features

- **State Stack Management**: Maintains past and future stacks
- **Configurable Levels**: Control max undo/redo depth (default: 20)
- **localStorage Persistence**: Saves undo/redo state
- **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Y (redo)

### Implementation

```tsx
import { useUndoRedo } from '@/lib/hooks/useUndoRedo';
import { defaultInitialState } from '@/lib/hooks/useFilter';

export function UndoRedoExample() {
  const [undoRedo, dispatch, { push, undo, redo, canUndo, canRedo }] = useUndoRedo('my-filters', defaultInitialState);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <>
      <button onClick={undo} disabled={!undoRedo.past.length}>
        Undo
      </button>
      <button onClick={redo} disabled={!undoRedo.future.length}>
        Redo
      </button>
      <div>Undo levels: {undoRedo.past.length}, Redo levels: {undoRedo.future.length}</div>
    </>
  );
}
```

### Keyboard Navigation Features

- **Tab Navigation**: Navigate through filter inputs
- **Arrow Keys**: Navigate through options in dropdowns
- **Enter**: Activate/confirm selections
- **Escape**: Close dropdowns, cancel operations
- **Boundary Looping**: Loop focus at start/end of focus group

### Implementation

```tsx
import { useKeyboardNav } from '@/lib/hooks/useKeyboardNav';
import { useRef } from 'react';

export function KeyboardNavExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    focusedIndex,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  } = useKeyboardNav({
    containerRef,
    focusableSelectors: ['button', 'input', '[role="option"]'],
    loopFocus: true,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusPrevious();
          break;
        case 'Home':
          e.preventDefault();
          focusFirst();
          break;
        case 'End':
          e.preventDefault();
          focusLast();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusNext, focusPrevious, focusFirst, focusLast]);

  return <div ref={containerRef}>...</div>;
}
```

## FilterBar Integration

The `FilterBar` component orchestrates all Phase 3 features seamlessly:

```tsx
<FilterBar
  // Phase 1 & 2: Basic filters
  filters={filters}
  onFilterChange={dispatch}
  searchPlaceholder="Search builds..."
  disabled={isLoading}

  // Phase 3.2: History
  history={history}
  onSelectFromHistory={handleSelectHistory}
  onRemoveFromHistory={handleRemoveFromHistory}
  onClearHistory={handleClearHistory}

  // Phase 3.3: Presets
  presets={presets}
  onSelectPreset={handleSelectPreset}
  onCreatePreset={handleCreatePreset}
  onDeletePreset={handleDeletePreset}
  onRenamePreset={handleRenamePreset}

  // Phase 3.4: Undo/Redo
  undoRedo={undoRedo}
  onUndo={handleUndo}
  onRedo={handleRedo}
/>
```

## Best Practices

### 1. State Management

```typescript
// Do: Use reducer pattern for complex state
const [state, dispatch] = useReducer(filterReducer, initialState);

// Don't: Direct useState for multiple related values
const [search, setSearch] = useState('');
const [statuses, setStatuses] = useState([]);
```

### 2. Performance

```typescript
// Do: Debounce search input
const debouncedSearch = useCallback(
  debounce((term: string) => dispatch({ type: 'SET_SEARCH', payload: term }), 300),
  []
);

// Don't: Immediate dispatch on every keystroke
onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })
```

### 3. Accessibility

```typescript
// Do: Provide aria labels and keyboard shortcuts
<button
  aria-label="Undo (Ctrl+Z)"
  onClick={undo}
  disabled={!canUndo}
>
  Undo
</button>

// Don't: Forget accessibility attributes
<button onClick={undo}>↶</button>
```

### 4. Storage Safety

```typescript
// Do: Validate and handle storage errors
try {
  const saved = localStorage.getItem('filter-state');
  if (saved) dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) });
} catch (e) {
  console.warn('Failed to load filter state:', e);
}

// Don't: Assume storage always works
const state = JSON.parse(localStorage.getItem('filter-state'));
```

### 5. Testing

```typescript
// Do: Test reducer pure functions
describe('filterReducer', () => {
  it('should toggle status correctly', () => {
    const state = { search: '', statuses: [] };
    const action = { type: 'TOGGLE_STATUS', payload: 'PENDING' };
    const newState = filterReducer(state, action);
    expect(newState.statuses).toContain('PENDING');
  });
});

// Don't: Only test components in integration tests
```

## Performance Targets

All operations should complete in the specified timeframes:

| Operation | Target | Typical |
|-----------|--------|---------|
| Search filtering | <100ms | <50ms |
| Undo/Redo | <10ms | <5ms |
| History lookup | <10ms | <3ms |
| Preset restore | <50ms | <20ms |
| Keyboard navigation | <5ms | <2ms |

## File Organization

```
frontend/
├── lib/
│   ├── hooks/
│   │   ├── useFilter.ts
│   │   ├── useSearchHighlight.ts
│   │   ├── useFilterHistory.ts
│   │   ├── useFilterPresets.ts
│   │   ├── useUndoRedo.ts
│   │   ├── useKeyboardNav.ts
│   │   └── __tests__/
│   │       ├── useFilter.test.ts
│   │       ├── useSearchHighlight.test.ts
│   │       ├── useFilterHistory.test.ts
│   │       ├── useFilterPresets.test.ts
│   │       ├── useUndoRedo.test.ts
│   │       └── useKeyboardNav.test.ts
│   └── utils/
│       ├── filterComposers.ts
│       ├── dateRangeValidators.ts
│       └── __tests__/
│           ├── filterComposers.test.ts
│           └── dateRangeValidators.test.ts
├── components/
│   ├── SearchBar.tsx
│   ├── StatusFilter.tsx
│   ├── DateRangeFilter.tsx
│   ├── FilterChips.tsx
│   ├── SearchHighlight.tsx
│   ├── HistoryDropdown.tsx
│   ├── PresetsManager.tsx
│   ├── FilterBar.tsx
│   └── __tests__/
│       ├── FilterBar.test.tsx
│       ├── HistoryDropdown.test.tsx
│       ├── PresetsManager.test.tsx
│       └── ...
└── __tests__/
    ├── FilterChips.test.tsx
    ├── filter-hooks.integration.test.ts
    └── filter-ui.integration.test.tsx
```

## Testing Strategy

### Unit Tests

Test individual hooks and utilities in isolation:

```bash
pnpm test:frontend -- useFilter.test.ts
pnpm test:frontend -- filterComposers.test.ts
```

### Component Tests

Test components with mocked props and callbacks:

```bash
pnpm test:frontend -- FilterBar.test.tsx
pnpm test:frontend -- HistoryDropdown.test.tsx
```

### Integration Tests

Test multiple features working together:

```bash
# Test hook composition and contracts
pnpm test:frontend -- filter-hooks.integration.test.ts

# Test UI components and user interactions
pnpm test:frontend -- filter-ui.integration.test.tsx
```

### E2E Tests (Future)

Test full user workflows through the application.

## Troubleshooting

### History not persisting

- Check localStorage is enabled
- Verify localStorage key matches: `filter-history:${contextName}` (e.g., `filter-history:search`)
- Check browser storage quota

### Presets disappearing

- Verify JSON serialization of complex filter objects
- Check localStorage isn't cleared on app close
- Validate preset structure on load
- Storage key: `filter-presets:${contextName}`

### Undo/Redo not working

- Verify `useUndoRedo` is integrated with filter dispatch
- Check keyboard event listeners are attached
- Verify maxLevels isn't too restrictive
- Storage key: `filter-undo-redo:${contextName}`

### Accessibility issues

- Run WCAG 2.1 AA checker on FilterBar
- Test with screen readers (NVDA, JAWS)
- Verify keyboard navigation works without mouse
- Check aria-labels and roles

### Status vocabulary mismatch

**Note**: Issue #347 tracks a vocabulary mismatch where `AVAILABLE_STATUSES` in useFilter.ts uses ['Active','Idle','Failed','Completed'] but the generated BuildStatus enum uses ['COMPLETE','FAILED','PENDING','RUNNING']. For now, use the hook's AVAILABLE_STATUSES. This will be unified in #347.

## See Also

- [DESIGN.md](../../DESIGN.md) - Architecture overview
- [CLAUDE.md](../../CLAUDE.md) - Getting started guide
- [Phase 3 Commits](https://github.com/stoke-space/react-graphql-playground/commits/feat/issue-265-phase3)
- [Issue #335](https://github.com/stoke-space/react-graphql-playground/issues/335) - Phase 3 requirements
