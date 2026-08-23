'use client';

import React from 'react';
import { highlightSearchTerm, HighlightOptions } from '../lib/search-highlight';

/**
 * Props for SearchHighlight component
 */
export interface SearchHighlightProps {
  /** Text content to highlight */
  text: string;
  /** Search term to highlight */
  searchTerm: string;
  /** Optional highlight configuration */
  options?: HighlightOptions;
  /** Optional CSS class for the container */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * SearchHighlight Component - Highlights search terms in text
 *
 * Wrapper around the highlightSearchTerm utility that integrates with React.
 * Renders text with matched terms highlighted with yellow background and bold font.
 *
 * Features:
 * - Case-insensitive highlighting by default (configurable)
 * - Yellow background + bold text styling (Tailwind)
 * - Handles special characters safely (regex escape)
 * - Preserves original text casing in output
 * - Handles empty search terms gracefully
 *
 * Styling:
 * - Highlighted matches: bg-yellow-200 font-semibold
 * - Can be customized via HighlightOptions.highlightClass
 *
 * @example
 * // Basic usage
 * <SearchHighlight text="Hello World" searchTerm="world" />
 *
 * @example
 * // Case-sensitive search
 * <SearchHighlight
 *   text="Hello World"
 *   searchTerm="Hello"
 *   options={{ caseSensitive: true }}
 * />
 *
 * @example
 * // Custom highlight class
 * <SearchHighlight
 *   text="Hello World"
 *   searchTerm="world"
 *   options={{ highlightClass: 'bg-blue-200 font-bold' }}
 * />
 */
export const SearchHighlight: React.FC<SearchHighlightProps> = ({
  text,
  searchTerm,
  options,
  className = '',
  'data-testid': dataTestId,
}) => {
  // Use utility to highlight search term
  const highlighted = highlightSearchTerm(text, searchTerm, {
    caseSensitive: false,
    highlightClass: 'bg-yellow-200 font-semibold',
    returnAsString: false,
    ...options,
  });

  return (
    <span className={className} data-testid={dataTestId}>
      {highlighted}
    </span>
  );
};

SearchHighlight.displayName = 'SearchHighlight';

export default SearchHighlight;
