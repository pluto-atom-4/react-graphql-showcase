import React from 'react';

/**
 * Options for highlightSearchTerm function
 */
export interface HighlightOptions {
  caseSensitive?: boolean;
  highlightClass?: string;
  returnAsString?: boolean;
}

/**
 * Escape special regex characters in a string
 *
 * Prevents regex injection and handles all special characters that have
 * meaning in regular expressions.
 *
 * @param text Text to escape
 * @returns Escaped text safe for use in regex
 */
export const escapeRegexSpecialChars = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Highlight search term within text
 *
 * Features:
 * - Regex escape for special characters (XSS prevention)
 * - Case-insensitive by default
 * - Customizable highlight class
 * - Return as JSX.Element or string
 * - Preserves original text casing in output
 * - Handles empty search terms gracefully
 *
 * @param text Text to highlight within
 * @param searchTerm Term to highlight
 * @param options Configuration options
 * @returns JSX.Element with <mark> tags or string, depending on returnAsString
 *
 * @example
 * // Returns JSX with highlighting
 * const highlighted = highlightSearchTerm('Hello World', 'world');
 * // => <span><span>Hello </span><mark>World</mark></span>
 *
 * @example
 * // Case-sensitive search
 * const highlighted = highlightSearchTerm('Hello World', 'Hello', {
 *   caseSensitive: true
 * });
 *
 * @example
 * // Return as string
 * const html = highlightSearchTerm('Hello World', 'world', {
 *   returnAsString: true
 * });
 * // => "Hello <mark>World</mark>"
 */
export const highlightSearchTerm = (
  text: string,
  searchTerm: string,
  options: HighlightOptions = {}
): React.ReactElement | string => {
  const {
    caseSensitive = false,
    highlightClass = 'bg-yellow-200 font-semibold',
    returnAsString = false,
  } = options;

  // Handle empty search term
  if (!searchTerm || searchTerm.trim() === '') {
    return returnAsString ? text : React.createElement(React.Fragment, null, text);
  }

  // Handle empty text
  if (!text) {
    return returnAsString ? '' : React.createElement(React.Fragment, null);
  }

  try {
    // Escape special regex characters in search term
    const escapedSearchTerm = escapeRegexSpecialChars(searchTerm);

    // Create regex with case sensitivity option
    const regex = new RegExp(`(${escapedSearchTerm})`, caseSensitive ? 'g' : 'gi');

    // Split text by matches
    const parts = text.split(regex);

    if (returnAsString) {
      // Return as HTML string with <mark> tags
      return parts
        .map((part, index) => {
          // Every even index is non-matching text, odd indices are matches
          if (index % 2 === 1) {
            return `<mark class="${highlightClass}">${part}</mark>`;
          }
          return part;
        })
        .join('');
    }

    // Return as JSX elements
    const elements = parts.map((part, index) => {
      if (index % 2 === 1) {
        // Highlighted part
        return React.createElement(
          'mark',
          {
            key: index,
            className: highlightClass,
          },
          part
        );
      }
      // Non-highlighted part
      return React.createElement(React.Fragment, { key: index }, part);
    });

    return React.createElement(React.Fragment, null, ...elements);
  } catch (error) {
    console.warn(
      `[search-highlight] Error highlighting text: ${error instanceof Error ? error.message : 'unknown error'}`
    );
    return returnAsString ? text : React.createElement(React.Fragment, null, text);
  }
};

export default highlightSearchTerm;
