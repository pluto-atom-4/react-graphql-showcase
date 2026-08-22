import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  SearchHighlightProvider,
  useSearchHighlightContext,
} from '../SearchHighlightContext';

/**
 * Test component that uses SearchHighlightContext
 */
const TestComponent: React.FC = () => {
  const {
    state,
    setSearchTerm,
    clearSearchTerm,
    toggleCaseSensitive,
    setHighlightedMatches,
    resetHighlighting,
  } = useSearchHighlightContext();

  return (
    <div>
      <div data-testid="search-term">{state.searchTerm}</div>
      <div data-testid="is-active">{String(state.isActive)}</div>
      <div data-testid="case-sensitive">{String(state.caseSensitive)}</div>
      <div data-testid="highlighted-matches">{state.highlightedMatches}</div>

      <button data-testid="set-search" onClick={() => setSearchTerm('test')}>
        Set Search
      </button>
      <button data-testid="clear-search" onClick={clearSearchTerm}>
        Clear Search
      </button>
      <button
        data-testid="toggle-case"
        onClick={toggleCaseSensitive}
      >
        Toggle Case
      </button>
      <button
        data-testid="set-matches"
        onClick={() => setHighlightedMatches(5)}
      >
        Set Matches
      </button>
      <button data-testid="reset-all" onClick={resetHighlighting}>
        Reset All
      </button>
    </div>
  );
};

describe('SearchHighlightContext', () => {
  beforeEach(() => {
    // Clear any test state
  });

  describe('SearchHighlightProvider', () => {
    it('should render children', () => {
      render(
        <SearchHighlightProvider>
          <div data-testid="child">Child Content</div>
        </SearchHighlightProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
    });

    it('should throw error when useSearchHighlightContext used outside provider', () => {
      // Create a component that uses context outside provider
      const BadComponent = () => {
        useSearchHighlightContext();
        return <div>Bad</div>;
      };

      // Suppress error output for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<BadComponent />);
      }).toThrow(
        'useSearchHighlightContext must be used within a SearchHighlightProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('useSearchHighlightContext Hook', () => {
    it('should provide initial state', () => {
      render(
        <SearchHighlightProvider>
          <TestComponent />
        </SearchHighlightProvider>
      );

      expect(screen.getByTestId('search-term')).toHaveTextContent('');
      expect(screen.getByTestId('is-active')).toHaveTextContent('false');
      expect(screen.getByTestId('case-sensitive')).toHaveTextContent('false');
      expect(screen.getByTestId('highlighted-matches')).toHaveTextContent('0');
    });

    it('should update search term through context', () => {
      render(
        <SearchHighlightProvider>
          <TestComponent />
        </SearchHighlightProvider>
      );

      const setSearchButton = screen.getByTestId('set-search');
      fireEvent.click(setSearchButton);

      expect(screen.getByTestId('search-term')).toHaveTextContent('test');
      expect(screen.getByTestId('is-active')).toHaveTextContent('true');
    });

    it('should clear search term through context', () => {
      render(
        <SearchHighlightProvider>
          <TestComponent />
        </SearchHighlightProvider>
      );

      // Set search term
      fireEvent.click(screen.getByTestId('set-search'));
      expect(screen.getByTestId('search-term')).toHaveTextContent('test');

      // Clear it
      fireEvent.click(screen.getByTestId('clear-search'));
      expect(screen.getByTestId('search-term')).toHaveTextContent('');
      expect(screen.getByTestId('is-active')).toHaveTextContent('false');
    });

    it('should toggle case sensitivity through context', () => {
      render(
        <SearchHighlightProvider>
          <TestComponent />
        </SearchHighlightProvider>
      );

      expect(screen.getByTestId('case-sensitive')).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('toggle-case'));
      expect(screen.getByTestId('case-sensitive')).toHaveTextContent('true');

      fireEvent.click(screen.getByTestId('toggle-case'));
      expect(screen.getByTestId('case-sensitive')).toHaveTextContent('false');
    });

    it('should update highlighted matches through context', () => {
      render(
        <SearchHighlightProvider>
          <TestComponent />
        </SearchHighlightProvider>
      );

      fireEvent.click(screen.getByTestId('set-matches'));
      expect(screen.getByTestId('highlighted-matches')).toHaveTextContent('5');
    });

    it('should reset all highlighting through context', () => {
      render(
        <SearchHighlightProvider>
          <TestComponent />
        </SearchHighlightProvider>
      );

      // Set some state
      fireEvent.click(screen.getByTestId('set-search'));
      fireEvent.click(screen.getByTestId('toggle-case'));
      fireEvent.click(screen.getByTestId('set-matches'));

      expect(screen.getByTestId('search-term')).toHaveTextContent('test');
      expect(screen.getByTestId('case-sensitive')).toHaveTextContent('true');
      expect(screen.getByTestId('highlighted-matches')).toHaveTextContent('5');

      // Reset
      fireEvent.click(screen.getByTestId('reset-all'));

      expect(screen.getByTestId('search-term')).toHaveTextContent('');
      expect(screen.getByTestId('is-active')).toHaveTextContent('false');
      expect(screen.getByTestId('case-sensitive')).toHaveTextContent('false');
      expect(screen.getByTestId('highlighted-matches')).toHaveTextContent('0');
    });

    it('should maintain context across multiple components', () => {
      const SecondTestComponent: React.FC = () => {
        const { state } = useSearchHighlightContext();
        return <div data-testid="second-component">{state.searchTerm}</div>;
      };

      render(
        <SearchHighlightProvider>
          <TestComponent />
          <SecondTestComponent />
        </SearchHighlightProvider>
      );

      // Set search in first component
      fireEvent.click(screen.getByTestId('set-search'));

      // Both should show the same value
      expect(screen.getByTestId('search-term')).toHaveTextContent('test');
      expect(screen.getByTestId('second-component')).toHaveTextContent('test');
    });

    it('should handle rapid state updates', () => {
      render(
        <SearchHighlightProvider>
          <TestComponent />
        </SearchHighlightProvider>
      );

      // Rapid updates
      fireEvent.click(screen.getByTestId('set-search'));
      fireEvent.click(screen.getByTestId('toggle-case'));
      fireEvent.click(screen.getByTestId('set-matches'));

      expect(screen.getByTestId('search-term')).toHaveTextContent('test');
      expect(screen.getByTestId('case-sensitive')).toHaveTextContent('true');
      expect(screen.getByTestId('highlighted-matches')).toHaveTextContent('5');
    });
  });

  describe('Provider Display Name', () => {
    it('should have correct display name for debugging', () => {
      expect(SearchHighlightProvider.displayName).toBe('SearchHighlightProvider');
    });
  });
});
