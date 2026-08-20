/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SearchBar } from '../components/SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render search input with placeholder', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar
          value=""
          onChange={handleChange}
          placeholder="Search builds..."
        />
      );

      const input = screen.getByPlaceholderText('Search builds...');
      expect(input).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('should display value in input', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="test query" onChange={handleChange} />
      );

      const input = screen.getByDisplayValue('test query') as HTMLInputElement;
      expect(input.value).toBe('test query');
    });

    it('should show clear button when value present', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="test" onChange={handleChange} />
      );

      const clearButton = screen.getByTestId('search-clear-btn');
      expect(clearButton).toBeInTheDocument();
    });

    it('should not show clear button when value empty', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} />
      );

      const clearButton = screen.queryByTestId('search-clear-btn');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('should hide clear button when disabled', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="test" onChange={handleChange} disabled />
      );

      const clearButton = screen.queryByTestId('search-clear-btn');
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Debounce', () => {
    it('should debounce input change (300ms by default)', async () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      // onChange should not be called immediately
      expect(handleChange).not.toHaveBeenCalled();

      // Fast-forward time by 299ms - should not call yet
      vi.advanceTimersByTime(299);
      expect(handleChange).not.toHaveBeenCalled();

      // Fast-forward remaining 1ms to reach 300ms
      vi.advanceTimersByTime(1);
      expect(handleChange).toHaveBeenCalledWith('test');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous debounce when new input arrives', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} />
      );

      const input = screen.getByPlaceholderText('Search...');

      // First input
      fireEvent.change(input, { target: { value: 'first' } });
      vi.advanceTimersByTime(150);

      // Second input before first debounce completes
      fireEvent.change(input, { target: { value: 'second' } });
      vi.advanceTimersByTime(150);

      // At this point, only 300ms has passed since last change
      // Should not have called onChange yet
      expect(handleChange).not.toHaveBeenCalled();

      // Complete the debounce
      vi.advanceTimersByTime(150);
      expect(handleChange).toHaveBeenCalledWith('second');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should support custom debounce ms', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar
          value=""
          onChange={handleChange}
          debounceMs={500}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      vi.advanceTimersByTime(300);
      expect(handleChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      expect(handleChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Keyboard Handlers', () => {
    it('should flush debounce and call onChange on Enter key', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} />
      );

      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'query' } });

      // Before Enter, debounce should not have fired
      expect(handleChange).not.toHaveBeenCalled();

      // Press Enter to flush debounce
      fireEvent.keyDown(input, { key: 'Enter' });

      // onChange should be called immediately, not debounced
      expect(handleChange).toHaveBeenCalledWith('query');
    });

    it('should clear search on Escape key', () => {
      const handleChange = vi.fn();
      const handleClear = vi.fn();
      render(
        <SearchBar
          value="query"
          onChange={handleChange}
          onClear={handleClear}
        />
      );

      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'new' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should call both clear and onChange
      expect(handleChange).toHaveBeenCalledWith('');
      expect(handleClear).toHaveBeenCalled();
    });

    it('should not respond to other keys', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Clear Button', () => {
    it('should clear input and call onClear when clicked', () => {
      const handleChange = vi.fn();
      const handleClear = vi.fn();
      render(
        <SearchBar
          value="test"
          onChange={handleChange}
          onClear={handleClear}
        />
      );

      const clearButton = screen.getByTestId('search-clear-btn');
      fireEvent.click(clearButton);

      expect(handleChange).toHaveBeenCalledWith('');
      expect(handleClear).toHaveBeenCalled();
    });

    it('should flush debounce when clear button clicked', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      // Click clear button before debounce completes
      const clearButton = screen.getByTestId('search-clear-btn');
      fireEvent.click(clearButton);

      // Should be cleared immediately
      expect(handleChange).toHaveBeenCalledWith('');
    });
  });

  describe('Blur Handler', () => {
    it('should call onBlur with current value', () => {
      const handleChange = vi.fn();
      const handleBlur = vi.fn();
      render(
        <SearchBar
          value=""
          onChange={handleChange}
          onBlur={handleBlur}
        />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'query' } });
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledWith('query');
    });

    it('should flush debounce on blur', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      // Blur before debounce completes
      fireEvent.blur(input);

      // Should have called onChange immediately
      expect(handleChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on input', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} />
      );

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveAttribute('aria-label', 'Search input');
    });

    it('should have aria-label on clear button', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="test" onChange={handleChange} />
      );

      const clearButton = screen.getByTestId('search-clear-btn');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} disabled />
      );

      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should not respond to input when disabled', () => {
      const handleChange = vi.fn();
      render(
        <SearchBar value="" onChange={handleChange} disabled />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      vi.advanceTimersByTime(300);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('External Value Updates', () => {
    it('should sync external value changes to input', () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <SearchBar value="initial" onChange={handleChange} />
      );

      let input = screen.getByDisplayValue('initial') as HTMLInputElement;
      expect(input.value).toBe('initial');

      rerender(
        <SearchBar value="updated" onChange={handleChange} />
      );

      input = screen.getByDisplayValue('updated') as HTMLInputElement;
      expect(input.value).toBe('updated');
    });
  });

  describe('Cleanup', () => {
    it('should clear debounce timer on unmount', () => {
      const handleChange = vi.fn();
      const { unmount } = render(
        <SearchBar value="" onChange={handleChange} />
      );

      const input = screen.getByPlaceholderText('Search...');
      fireEvent.change(input, { target: { value: 'test' } });

      unmount();

      // Advance time past debounce - should not call onChange
      vi.advanceTimersByTime(300);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
