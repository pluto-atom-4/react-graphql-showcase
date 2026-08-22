import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useFilterPresets,
  filterPresetsReducer,
  defaultFilterPresetsState,
  FilterPresetsState,
} from '../useFilterPresets';
import { FilterState } from '../useFilter';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test data
const mockFilterState1: FilterState = {
  search: 'test1',
  statuses: ['Active'],
};

const mockFilterState2: FilterState = {
  search: 'test2',
  statuses: ['Failed', 'Idle'],
  dateStart: '2024-01-01',
  dateEnd: '2024-01-31',
};

const mockFilterState3: FilterState = {
  search: 'test3',
  statuses: [],
};

describe('useFilterPresets Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Initial State', () => {
    it('should initialize with empty presets', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      expect(result.current[0].presets).toEqual([]);
      expect(result.current[0].maxPresets).toBe(10);
    });

    it('should initialize with custom maxPresets', () => {
      const { result } = renderHook(() => useFilterPresets('test', 5));

      expect(result.current[0].maxPresets).toBe(5);
    });

    it('should have convenience methods', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      const [, , methods] = result.current;
      expect(typeof methods.createPreset).toBe('function');
      expect(typeof methods.deletePreset).toBe('function');
      expect(typeof methods.renamePreset).toBe('function');
      expect(typeof methods.updatePresetState).toBe('function');
      expect(typeof methods.recordUsage).toBe('function');
      expect(typeof methods.clearPresets).toBe('function');
    });
  });

  describe('CREATE_PRESET Action', () => {
    it('should create a new preset with valid name and state', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      act(() => {
        result.current[2].createPreset('My Preset', mockFilterState1);
      });

      expect(result.current[0].presets).toHaveLength(1);
      expect(result.current[0].presets[0].name).toBe('My Preset');
      expect(result.current[0].presets[0].state).toEqual(mockFilterState1);
      expect(result.current[0].presets[0].createdAt).toBeDefined();
      expect(result.current[0].presets[0].id).toBeDefined();
    });

    it('should reject empty preset name', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      act(() => {
        result.current[2].createPreset('', mockFilterState1);
      });

      expect(result.current[0].presets).toHaveLength(0);
    });

    it('should reject preset name longer than 50 characters', () => {
      const { result } = renderHook(() => useFilterPresets('test'));
      const longName = 'a'.repeat(51);

      act(() => {
        result.current[2].createPreset(longName, mockFilterState1);
      });

      expect(result.current[0].presets).toHaveLength(0);
    });

    it('should reject duplicate preset names (case-insensitive)', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      act(() => {
        result.current[2].createPreset('My Preset', mockFilterState1);
        result.current[2].createPreset('MY PRESET', mockFilterState2);
      });

      expect(result.current[0].presets).toHaveLength(1);
    });

    it('should enforce max presets limit', () => {
      const { result } = renderHook(() => useFilterPresets('test', 3));

      act(() => {
        result.current[2].createPreset('Preset 1', mockFilterState1);
        result.current[2].createPreset('Preset 2', mockFilterState2);
        result.current[2].createPreset('Preset 3', mockFilterState3);
        result.current[2].createPreset('Preset 4', mockFilterState1);
      });

      expect(result.current[0].presets).toHaveLength(3);
    });

    it('should allow preset names up to 50 characters', () => {
      const { result } = renderHook(() => useFilterPresets('test'));
      const maxLengthName = 'a'.repeat(50);

      act(() => {
        result.current[2].createPreset(maxLengthName, mockFilterState1);
      });

      expect(result.current[0].presets).toHaveLength(1);
      expect(result.current[0].presets[0].name).toHaveLength(50);
    });
  });

  describe('DELETE_PRESET Action', () => {
    it('should delete a preset by id', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      let presetId: string;

      act(() => {
        result.current[2].createPreset('My Preset', mockFilterState1);
      });

      presetId = result.current[0].presets[0].id;

      act(() => {
        result.current[2].deletePreset(presetId);
      });

      expect(result.current[0].presets).toHaveLength(0);
    });

    it('should not affect other presets when deleting one', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      let preset1Id: string;
      let preset2Id: string;

      act(() => {
        result.current[2].createPreset('Preset 1', mockFilterState1);
        result.current[2].createPreset('Preset 2', mockFilterState2);
      });

      preset1Id = result.current[0].presets[0].id;
      preset2Id = result.current[0].presets[1].id;

      act(() => {
        result.current[2].deletePreset(preset1Id);
      });

      expect(result.current[0].presets).toHaveLength(1);
      expect(result.current[0].presets[0].id).toBe(preset2Id);
    });
  });

  describe('RENAME_PRESET Action', () => {
    it('should rename a preset', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      let presetId: string;

      act(() => {
        result.current[2].createPreset('Old Name', mockFilterState1);
      });

      presetId = result.current[0].presets[0].id;

      act(() => {
        result.current[2].renamePreset(presetId, 'New Name');
      });

      expect(result.current[0].presets[0].name).toBe('New Name');
    });

    it('should reject empty rename', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      let presetId: string;

      act(() => {
        result.current[2].createPreset('My Preset', mockFilterState1);
      });

      presetId = result.current[0].presets[0].id;

      act(() => {
        result.current[2].renamePreset(presetId, '');
      });

      expect(result.current[0].presets[0].name).toBe('My Preset');
    });

    it('should reject duplicate rename (case-insensitive)', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      let preset1Id: string;

      act(() => {
        result.current[2].createPreset('Preset 1', mockFilterState1);
        result.current[2].createPreset('Preset 2', mockFilterState2);
      });

      preset1Id = result.current[0].presets[0].id;

      act(() => {
        result.current[2].renamePreset(preset1Id, 'preset 2');
      });

      // Should still have old name
      expect(result.current[0].presets[0].name).toBe('Preset 1');
    });
  });

  describe('UPDATE_PRESET_STATE Action', () => {
    it('should update preset filter state', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      let presetId: string;

      act(() => {
        result.current[2].createPreset('My Preset', mockFilterState1);
      });

      presetId = result.current[0].presets[0].id;

      act(() => {
        result.current[2].updatePresetState(presetId, mockFilterState2);
      });

      expect(result.current[0].presets[0].state).toEqual(mockFilterState2);
    });

    it('should not affect other presets when updating one', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      let preset1Id: string;

      act(() => {
        result.current[2].createPreset('Preset 1', mockFilterState1);
        result.current[2].createPreset('Preset 2', mockFilterState2);
      });

      preset1Id = result.current[0].presets[0].id;

      act(() => {
        result.current[2].updatePresetState(preset1Id, mockFilterState3);
      });

      expect(result.current[0].presets[0].state).toEqual(mockFilterState3);
      expect(result.current[0].presets[1].state).toEqual(mockFilterState2);
    });
  });

  describe('RECORD_PRESET_USAGE Action', () => {
    it('should record last used timestamp', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      let presetId: string;
      const beforeTime = Date.now();

      act(() => {
        result.current[2].createPreset('My Preset', mockFilterState1);
      });

      presetId = result.current[0].presets[0].id;
      const initialLastUsed = result.current[0].presets[0].lastUsed;

      act(() => {
        result.current[2].recordUsage(presetId);
      });

      const afterTime = Date.now();
      const lastUsed = result.current[0].presets[0].lastUsed!;

      expect(lastUsed).toBeGreaterThanOrEqual(beforeTime);
      expect(lastUsed).toBeLessThanOrEqual(afterTime);
      expect(lastUsed).not.toEqual(initialLastUsed);
    });
  });

  describe('CLEAR_PRESETS Action', () => {
    it('should clear all presets', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      act(() => {
        result.current[2].createPreset('Preset 1', mockFilterState1);
        result.current[2].createPreset('Preset 2', mockFilterState2);
      });

      expect(result.current[0].presets).toHaveLength(2);

      act(() => {
        result.current[2].clearPresets();
      });

      expect(result.current[0].presets).toHaveLength(0);
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist presets to localStorage', () => {
      const { result } = renderHook(() => useFilterPresets('test'));

      act(() => {
        result.current[2].createPreset('My Preset', mockFilterState1);
      });

      const stored = localStorageMock.getItem('filter-presets:test');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.presets).toHaveLength(1);
      expect(parsed.presets[0].name).toBe('My Preset');
    });

    it('should load presets from localStorage on mount', () => {
      const testData: FilterPresetsState = {
        presets: [
          {
            id: 'preset-123',
            name: 'Loaded Preset',
            state: mockFilterState1,
            createdAt: Date.now(),
          },
        ],
        maxPresets: 10,
      };

      localStorageMock.setItem('filter-presets:test', JSON.stringify(testData));

      const { result } = renderHook(() => useFilterPresets('test'));

      expect(result.current[0].presets).toHaveLength(1);
      expect(result.current[0].presets[0].name).toBe('Loaded Preset');
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.setItem('filter-presets:test', 'invalid json');

      const { result } = renderHook(() => useFilterPresets('test'));

      expect(result.current[0].presets).toHaveLength(0);
      expect(result.current[0].maxPresets).toBe(10);
    });
  });

  describe('Reducer Edge Cases', () => {
    it('should handle max presets correctly', () => {
      const { result } = renderHook(() => useFilterPresets('test', 2));

      act(() => {
        result.current[2].createPreset('Preset 1', mockFilterState1);
        result.current[2].createPreset('Preset 2', mockFilterState2);
      });

      expect(result.current[0].presets).toHaveLength(2);

      act(() => {
        result.current[2].createPreset('Preset 3', mockFilterState3);
      });

      expect(result.current[0].presets).toHaveLength(2);
    });

    it('should properly initialize with custom maxPresets override', () => {
      const testData: FilterPresetsState = {
        presets: [
          {
            id: 'preset-123',
            name: 'Preset 1',
            state: mockFilterState1,
            createdAt: Date.now(),
          },
        ],
        maxPresets: 20, // Old max
      };

      localStorageMock.setItem('filter-presets:test', JSON.stringify(testData));

      const { result } = renderHook(() => useFilterPresets('test', 5)); // New max

      expect(result.current[0].maxPresets).toBe(5);
      expect(result.current[0].presets).toHaveLength(1);
    });
  });

  describe('Reducer Function Directly', () => {
    it('should handle unknown action by returning state unchanged', () => {
      const state = { ...defaultFilterPresetsState };
      const action = { type: 'UNKNOWN' } as any;

      const newState = filterPresetsReducer(state, action);

      expect(newState).toEqual(state);
    });

    it('should handle SET_MAX_PRESETS with minimum enforcement', () => {
      const state = { ...defaultFilterPresetsState };
      const action = { type: 'SET_MAX_PRESETS', payload: 0 } as any;

      const newState = filterPresetsReducer(state, action);

      expect(newState.maxPresets).toBe(1);
    });
  });
});
