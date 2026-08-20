'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Props for SearchBar component
 */
export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: (value: string) => void;
  debounceMs?: number;
}

/**
 * SearchBar Component - Text input with debounce, keyboard handlers, and localStorage sync
 *
 * Features:
 * - 300ms debounce on input (configurable)
 * - Keyboard support: Enter (SET_SEARCH), Escape (CLEAR_SEARCH)
 * - Clear button (×) visible when value present
 * - onBlur triggers localStorage sync
 * - Tailwind styling with focus ring and border
 * - Full accessibility: aria-label, aria-describedby
 * - Micro-interactions: smooth transitions
 *
 * @example
 * <SearchBar
 *   value={search}
 *   onChange={setSearch}
 *   onClear={handleClear}
 *   onBlur={handleSync}
 *   placeholder="Search builds..."
 * />
 */
export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = 'Search...',
      disabled = false,
      onBlur: onBlurProp,
      debounceMs = 300,
      className = '',
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState(value);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync external value changes to input
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Debounced onChange handler
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) {
          return;
        }

        const newValue = e.target.value;
        setInputValue(newValue);

        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set new debounced timer
        debounceTimerRef.current = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      },
      [onChange, debounceMs, disabled]
    );

    // Keyboard handlers
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          // Flush debounce timer on Enter
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          onChange(inputValue);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          // Clear input on Escape
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          setInputValue('');
          onChange('');
          onClear?.();
        }
      },
      [inputValue, onChange, onClear]
    );

    // Blur handler - trigger localStorage sync
    const handleBlur = useCallback(
      () => {
        // Flush debounce on blur
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        onChange(inputValue);
        onBlurProp?.(inputValue);
      },
      [inputValue, onChange, onBlurProp]
    );

    // Clear button click
    const handleClearClick = useCallback(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setInputValue('');
      onChange('');
      onClear?.();
    }, [onChange, onClear]);

    // Cleanup timer on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const baseClasses =
      'relative flex items-center w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 transition-all duration-200 ease-in-out focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed';

    const inputClasses =
      'flex-1 bg-transparent outline-none text-sm placeholder-gray-400';

    const clearButtonClasses =
      'ml-2 flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 focus:outline-none rounded transition-colors duration-150 hover:bg-gray-100';

    return (
      <div className={`${baseClasses} ${className}`} data-testid="search-bar">
        <input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          aria-label="Search input"
          aria-describedby="search-help"
          {...props}
        />

        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClearClick}
            className={clearButtonClasses}
            aria-label="Clear search"
            title="Clear search"
            data-testid="search-clear-btn"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
