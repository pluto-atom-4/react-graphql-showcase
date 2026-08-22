import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSearchHighlight,
  searchHighlightReducer,
  defaultSearchHighlightState,
  SearchHighlightState,
} from '../useSearchHighlight';

describe('useSearchHighlight Hook', () => {
  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSearchHighlight());

      expect(result.current.state).toEqual(defaultSearchHighlightState);
    });

    it('should have empty search term initially', () => {
      const { result } = renderHook(() => useSearchHighlight());

      expect(result.current.state.searchTerm).toBe('');
      expect(result.current.state.isActive).toBe(false);
    });
  });

  describe('setSearchTerm Action', () => {
    it('should set search term and activate highlighting', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setSearchTerm('test');
      });

      expect(result.current.state.searchTerm).toBe('test');
      expect(result.current.state.isActive).toBe(true);
      expect(result.current.state.highlightedMatches).toBe(0);
    });

    it('should handle empty search term by deactivating highlighting', () => {
      const { result } = renderHook(() => useSearchHighlight());

      // First set a term
      act(() => {
        result.current.setSearchTerm('test');
      });

      // Then clear it
      act(() => {
        result.current.setSearchTerm('');
      });

      expect(result.current.state.searchTerm).toBe('');
      expect(result.current.state.isActive).toBe(false);
    });

    it('should handle whitespace-only search term as empty', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setSearchTerm('   ');
      });

      expect(result.current.state.isActive).toBe(false);
    });

    it('should reset highlighted matches count when changing search term', () => {
      const { result } = renderHook(() => useSearchHighlight());

      // Set initial term and matches
      act(() => {
        result.current.setSearchTerm('test');
      });

      act(() => {
        result.current.setHighlightedMatches(5);
      });

      expect(result.current.state.highlightedMatches).toBe(5);

      // Change search term
      act(() => {
        result.current.setSearchTerm('new');
      });

      expect(result.current.state.highlightedMatches).toBe(0);
    });
  });

  describe('clearSearchTerm Action', () => {
    it('should clear search term and deactivate highlighting', () => {
      const { result } = renderHook(() => useSearchHighlight());

      // Set term first
      act(() => {
        result.current.setSearchTerm('test');
      });

      // Clear it
      act(() => {
        result.current.clearSearchTerm();
      });

      expect(result.current.state.searchTerm).toBe('');
      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.highlightedMatches).toBe(0);
    });

    it('should be idempotent', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setSearchTerm('test');
      });

      act(() => {
        result.current.clearSearchTerm();
        result.current.clearSearchTerm();
      });

      expect(result.current.state.searchTerm).toBe('');
      expect(result.current.state.isActive).toBe(false);
    });
  });

  describe('toggleCaseSensitive Action', () => {
    it('should toggle case sensitive flag', () => {
      const { result } = renderHook(() => useSearchHighlight());

      expect(result.current.state.caseSensitive).toBe(false);

      act(() => {
        result.current.toggleCaseSensitive();
      });

      expect(result.current.state.caseSensitive).toBe(true);

      act(() => {
        result.current.toggleCaseSensitive();
      });

      expect(result.current.state.caseSensitive).toBe(false);
    });

    it('should preserve other state when toggling case sensitivity', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setSearchTerm('test');
      });

      const searchTermBefore = result.current.state.searchTerm;

      act(() => {
        result.current.toggleCaseSensitive();
      });

      expect(result.current.state.searchTerm).toBe(searchTermBefore);
      expect(result.current.state.isActive).toBe(true);
    });
  });

  describe('setHighlightedMatches Action', () => {
    it('should set the number of highlighted matches', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setHighlightedMatches(10);
      });

      expect(result.current.state.highlightedMatches).toBe(10);
    });

    it('should handle zero matches', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setHighlightedMatches(5);
      });

      act(() => {
        result.current.setHighlightedMatches(0);
      });

      expect(result.current.state.highlightedMatches).toBe(0);
    });

    it('should handle large match counts', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setHighlightedMatches(1000);
      });

      expect(result.current.state.highlightedMatches).toBe(1000);
    });
  });

  describe('resetHighlighting Action', () => {
    it('should reset all state to defaults', () => {
      const { result } = renderHook(() => useSearchHighlight());

      // Set up some state
      act(() => {
        result.current.setSearchTerm('test');
        result.current.toggleCaseSensitive();
        result.current.setHighlightedMatches(5);
      });

      // Reset
      act(() => {
        result.current.resetHighlighting();
      });

      expect(result.current.state).toEqual(defaultSearchHighlightState);
    });

    it('should work when called on empty state', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.resetHighlighting();
      });

      expect(result.current.state).toEqual(defaultSearchHighlightState);
    });
  });

  describe('searchHighlightReducer', () => {
    it('should handle unknown action type by returning current state', () => {
      const state: SearchHighlightState = {
        searchTerm: 'test',
        isActive: true,
        caseSensitive: false,
        highlightedMatches: 0,
      };

      const result = searchHighlightReducer(state, {
        type: 'UNKNOWN_ACTION' as any,
      });

      expect(result).toEqual(state);
    });
  });

  describe('Convenience Methods', () => {
    it('should provide convenience methods that call dispatch correctly', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setSearchTerm('hello');
      });

      expect(result.current.state.searchTerm).toBe('hello');
      expect(result.current.state.isActive).toBe(true);
    });

    it('should handle rapid consecutive state updates', () => {
      const { result } = renderHook(() => useSearchHighlight());

      act(() => {
        result.current.setSearchTerm('a');
        result.current.setSearchTerm('ab');
        result.current.setSearchTerm('abc');
      });

      expect(result.current.state.searchTerm).toBe('abc');
      expect(result.current.state.isActive).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle special characters without performance degradation', () => {
      const { result } = renderHook(() => useSearchHighlight());

      const specialChars = '.*+?^${}()|[]\\';

      act(() => {
        result.current.setSearchTerm(specialChars);
      });

      expect(result.current.state.searchTerm).toBe(specialChars);
      expect(result.current.state.isActive).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const { result } = renderHook(() => useSearchHighlight());

      const unicodeText = '你好世界 🌍';

      act(() => {
        result.current.setSearchTerm(unicodeText);
      });

      expect(result.current.state.searchTerm).toBe(unicodeText);
      expect(result.current.state.isActive).toBe(true);
    });

    it('should handle very long search terms', () => {
      const { result } = renderHook(() => useSearchHighlight());

      const longTerm = 'a'.repeat(10000);

      act(() => {
        result.current.setSearchTerm(longTerm);
      });

      expect(result.current.state.searchTerm).toBe(longTerm);
      expect(result.current.state.isActive).toBe(true);
    });
  });
});
