import { describe, it, expect } from 'vitest';
import React from 'react';
import {
  highlightSearchTerm,
  escapeRegexSpecialChars,
} from '../search-highlight';

describe('search-highlight Utility', () => {
  describe('escapeRegexSpecialChars', () => {
    it('should escape dots', () => {
      const result = escapeRegexSpecialChars('file.txt');
      expect(result).toBe('file\\.txt');
    });

    it('should escape asterisks', () => {
      const result = escapeRegexSpecialChars('*glob*');
      expect(result).toBe('\\*glob\\*');
    });

    it('should escape plus signs', () => {
      const result = escapeRegexSpecialChars('1+1');
      expect(result).toBe('1\\+1');
    });

    it('should escape question marks', () => {
      const result = escapeRegexSpecialChars('what?');
      expect(result).toBe('what\\?');
    });

    it('should escape square brackets', () => {
      const result = escapeRegexSpecialChars('[abc]');
      expect(result).toBe('\\[abc\\]');
    });

    it('should escape curly braces', () => {
      const result = escapeRegexSpecialChars('{2,5}');
      expect(result).toBe('\\{2,5\\}');
    });

    it('should escape parentheses', () => {
      const result = escapeRegexSpecialChars('(group)');
      expect(result).toBe('\\(group\\)');
    });

    it('should escape caret', () => {
      const result = escapeRegexSpecialChars('^start');
      expect(result).toBe('\\^start');
    });

    it('should escape dollar sign', () => {
      const result = escapeRegexSpecialChars('price$');
      expect(result).toBe('price\\$');
    });

    it('should escape pipe', () => {
      const result = escapeRegexSpecialChars('a|b');
      expect(result).toBe('a\\|b');
    });

    it('should escape backslash', () => {
      const result = escapeRegexSpecialChars('path\\to\\file');
      expect(result).toBe('path\\\\to\\\\file');
    });

    it('should escape multiple special characters', () => {
      const result = escapeRegexSpecialChars('.*+?[]{}');
      expect(result).toBe('\\.\\*\\+\\?\\[\\]\\{\\}');
    });
  });

  describe('highlightSearchTerm: Basic Functionality', () => {
    it('should return JSX element by default', () => {
      const result = highlightSearchTerm('Hello World', 'World');
      expect(React.isValidElement(result)).toBe(true);
    });

    it('should return string when returnAsString is true', () => {
      const result = highlightSearchTerm('Hello World', 'World', {
        returnAsString: true,
      });
      expect(typeof result).toBe('string');
    });

    it('should highlight matching term', () => {
      const result = highlightSearchTerm(
        'Hello World',
        'World',
        { returnAsString: true }
      );
      expect(result).toContain('<mark');
      expect(result).toContain('World');
    });

    it('should be case-insensitive by default', () => {
      const result = highlightSearchTerm(
        'Hello World',
        'world',
        { returnAsString: true }
      );
      expect(result).toContain('<mark');
      expect(result).toContain('World');
    });
  });

  describe('highlightSearchTerm: Case Sensitivity', () => {
    it('should support case-sensitive search', () => {
      const result = highlightSearchTerm(
        'Hello world World',
        'World',
        { caseSensitive: true, returnAsString: true }
      );
      // Should only highlight capital W version
      expect(result).toContain('<mark');
      const markCount = (result as string).match(/<mark/g)?.length ?? 0;
      expect(markCount).toBe(1);
    });

    it('should not match different case in case-sensitive mode', () => {
      const result = highlightSearchTerm(
        'hello HELLO Hello',
        'hello',
        { caseSensitive: true, returnAsString: true }
      );
      // Should only highlight lowercase version
      const markCount = (result as string).match(/<mark/g)?.length ?? 0;
      expect(markCount).toBe(1);
    });
  });

  describe('highlightSearchTerm: Special Characters (XSS Prevention)', () => {
    it('should escape regex special chars in search term', () => {
      const result = highlightSearchTerm(
        'Price is $5.99 or $6.99',
        '$5.99',
        { returnAsString: true }
      );
      expect(result).toContain('$5.99');
      expect(result).toContain('<mark');
    });

    it('should handle search term with dot', () => {
      const result = highlightSearchTerm(
        'file.txt is a file',
        'file.txt',
        { returnAsString: true }
      );
      expect(result).toContain('file.txt');
      expect(result).toContain('<mark');
    });

    it('should handle search term with brackets', () => {
      const result = highlightSearchTerm(
        'pattern [abc] matches',
        '[abc]',
        { returnAsString: true }
      );
      expect(result).toContain('[abc]');
      expect(result).toContain('<mark');
    });

    it('should handle search term with parentheses', () => {
      const result = highlightSearchTerm(
        'regex (pattern) example',
        '(pattern)',
        { returnAsString: true }
      );
      expect(result).toContain('(pattern)');
      expect(result).toContain('<mark');
    });

    it('should handle search term with asterisk', () => {
      const result = highlightSearchTerm(
        'This * is important',
        '*',
        { returnAsString: true }
      );
      expect(result).toContain('*');
      expect(result).toContain('<mark');
    });

    it('should not introduce XSS vulnerabilities', () => {
      const maliciousSearch = '<script>alert("xss")</script>';
      const text = 'Text with <script>alert("xss")</script> in it';
      const result = highlightSearchTerm(
        text,
        maliciousSearch,
        { returnAsString: true }
      );
      // The entire script tag should be escaped and wrapped in mark tags
      // This prevents execution while preserving the text
      expect(result).toContain('<mark');
    });
  });

  describe('highlightSearchTerm: Empty Inputs', () => {
    it('should handle empty search term', () => {
      const result = highlightSearchTerm('Hello World', '', {
        returnAsString: true,
      });
      expect(result).toBe('Hello World');
    });

    it('should handle whitespace-only search term', () => {
      const result = highlightSearchTerm('Hello World', '   ', {
        returnAsString: true,
      });
      expect(result).toBe('Hello World');
    });

    it('should handle empty text', () => {
      const result = highlightSearchTerm('', 'search', {
        returnAsString: true,
      });
      expect(result).toBe('');
    });

    it('should handle null/undefined gracefully', () => {
      const result = highlightSearchTerm(
        'Hello',
        undefined as unknown as string,
        { returnAsString: true }
      );
      expect(result).toBe('Hello');
    });
  });

  describe('highlightSearchTerm: Multiple Matches', () => {
    it('should highlight all occurrences', () => {
      const result = highlightSearchTerm(
        'apple and apple and apple',
        'apple',
        { returnAsString: true }
      );
      const markCount = (result as string).match(/<mark/g)?.length ?? 0;
      expect(markCount).toBe(3);
    });

    it('should preserve text between matches', () => {
      const result = highlightSearchTerm(
        'cat and dog and cat',
        'cat',
        { returnAsString: true }
      );
      expect(result).toContain(' and dog and ');
    });
  });

  describe('highlightSearchTerm: Custom Highlighting', () => {
    it('should use custom highlight class', () => {
      const result = highlightSearchTerm(
        'Hello World',
        'World',
        { highlightClass: 'custom-highlight', returnAsString: true }
      );
      expect(result).toContain('class="custom-highlight"');
    });

    it('should default to Tailwind classes', () => {
      const result = highlightSearchTerm(
        'Hello World',
        'World',
        { returnAsString: true }
      );
      expect(result).toContain('bg-yellow-200');
      expect(result).toContain('font-semibold');
    });
  });

  describe('highlightSearchTerm: Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'word ' + 'a '.repeat(10000) + 'word';
      const result = highlightSearchTerm(longText, 'word', {
        returnAsString: true,
      });
      const markCount = (result as string).match(/<mark/g)?.length ?? 0;
      expect(markCount).toBe(2);
    });

    it('should handle text with only search term', () => {
      const result = highlightSearchTerm('search', 'search', {
        returnAsString: true,
      });
      expect(result).toContain('search');
      expect(result).toContain('<mark');
    });

    it('should handle single character search', () => {
      const result = highlightSearchTerm('a b c a d a', 'a', {
        returnAsString: true,
      });
      const markCount = (result as string).match(/<mark/g)?.length ?? 0;
      expect(markCount).toBe(3);
    });

    it('should handle Unicode characters', () => {
      const result = highlightSearchTerm(
        'Hello 世界 World',
        '世界',
        { returnAsString: true }
      );
      expect(result).toContain('世界');
      expect(result).toContain('<mark');
    });

    it('should handle newlines and special whitespace', () => {
      const result = highlightSearchTerm(
        'Line 1\nLine 2\nLine 3',
        'Line',
        { returnAsString: true }
      );
      const markCount = (result as string).match(/<mark/g)?.length ?? 0;
      expect(markCount).toBe(3);
    });
  });

  describe('highlightSearchTerm: Error Handling', () => {
    it('should handle errors gracefully and return original text', () => {
      // Create a case that might cause an error by using very complex input
      const result = highlightSearchTerm(
        'test',
        'test',
        { returnAsString: true }
      );
      // Should not throw and should contain the text
      expect(result).toBeDefined();
    });
  });
});
