/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  SearchProvider,
  useSearchContext,
  FilterProvider,
} from '../SearchContext';

function TestComponent() {
  const { state, dispatch } = useSearchContext();

  return (
    <div>
      <div data-testid="search-term">{state.search}</div>
      <button
        onClick={() => dispatch({ type: 'SET_SEARCH', payload: 'test' })}
        data-testid="set-btn"
      >
        Set
      </button>
      <button
        onClick={() => dispatch({ type: 'CLEAR_SEARCH' })}
        data-testid="clear-btn"
      >
        Clear
      </button>
    </div>
  );
}

describe('SearchContext', () => {
  describe('SearchProvider', () => {
    it('should provide initial search state', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      const searchTerm = screen.getByTestId('search-term');
      expect(searchTerm).toHaveTextContent('');
    });

    it('should accept custom initial state', () => {
      render(
        <SearchProvider initialState={{ search: 'custom' }}>
          <TestComponent />
        </SearchProvider>
      );

      const searchTerm = screen.getByTestId('search-term');
      expect(searchTerm).toHaveTextContent('custom');
    });

  });

  describe('useSearchContext', () => {
    it('should provide state and dispatch', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      const setButton = screen.getByTestId('set-btn');
      act(() => {
        setButton.click();
      });

      const searchTerm = screen.getByTestId('search-term');
      expect(searchTerm).toHaveTextContent('test');
    });

    it('should dispatch SET_SEARCH action', () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      const setButton = screen.getByTestId('set-btn');
      act(() => {
        setButton.click();
      });

      const searchTerm = screen.getByTestId('search-term');
      expect(searchTerm).toHaveTextContent('test');
    });

    it('should dispatch CLEAR_SEARCH action', () => {
      render(
        <SearchProvider initialState={{ search: 'initial' }}>
          <TestComponent />
        </SearchProvider>
      );

      let searchTerm = screen.getByTestId('search-term');
      expect(searchTerm).toHaveTextContent('initial');

      const clearButton = screen.getByTestId('clear-btn');
      act(() => {
        clearButton.click();
      });

      searchTerm = screen.getByTestId('search-term');
      expect(searchTerm).toBeEmptyDOMElement();
    });

    it('should throw error when used outside provider', () => {
      // Mock console.error to suppress the error output in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSearchContext must be used within a SearchProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('FilterProvider Alias', () => {
    it('should work as alias for SearchProvider', () => {
      render(
        <FilterProvider>
          <TestComponent />
        </FilterProvider>
      );

      const searchTerm = screen.getByTestId('search-term');
      expect(searchTerm).toBeInTheDocument();
    });
  });
});
