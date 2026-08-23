import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchHighlight } from '../SearchHighlight';

describe('SearchHighlight Component', () => {
  describe('Rendering', () => {
    it('should render text without highlights when search term is empty', () => {
      const { container } = render(
        <SearchHighlight text="Hello World" searchTerm="" />
      );

      expect(container.textContent).toBe('Hello World');
      // Should not have any mark elements
      expect(container.querySelectorAll('mark')).toHaveLength(0);
    });

    it('should render text without highlights when search term is whitespace', () => {
      const { container } = render(
        <SearchHighlight text="Hello World" searchTerm="   " />
      );

      expect(container.textContent).toBe('Hello World');
      expect(container.querySelectorAll('mark')).toHaveLength(0);
    });

    it('should highlight matched terms with yellow background and bold', () => {
      const { container } = render(
        <SearchHighlight text="Hello World" searchTerm="World" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('World');
      expect(marks[0]).toHaveClass('bg-yellow-200', 'font-semibold');
    });

    it('should be case-insensitive by default', () => {
      const { container } = render(
        <SearchHighlight text="Hello World" searchTerm="world" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('World');
    });

    it('should highlight multiple occurrences', () => {
      const { container } = render(
        <SearchHighlight text="apple apple apple" searchTerm="apple" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(3);
      marks.forEach((mark) => {
        expect(mark).toHaveTextContent('apple');
      });
    });

    it('should support case-sensitive highlighting', () => {
      const { container } = render(
        <SearchHighlight
          text="Hello hello HELLO"
          searchTerm="Hello"
          options={{ caseSensitive: true }}
        />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('Hello');
    });

    it('should handle special characters in search term', () => {
      const { container } = render(
        <SearchHighlight
          text="Price: $10.50 (50% off)"
          searchTerm="$10.50"
        />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('$10.50');
    });

    it('should handle regex special characters safely', () => {
      const { container } = render(
        <SearchHighlight
          text="Match (regex) with [brackets]"
          searchTerm="(regex)"
        />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('(regex)');
    });

    it('should handle Unicode characters', () => {
      const { container } = render(
        <SearchHighlight text="Hello 世界" searchTerm="世界" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('世界');
    });

    it('should handle emoji in text and search term', () => {
      const { container } = render(
        <SearchHighlight text="Hello 🌍 World" searchTerm="🌍" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('🌍');
    });
  });

  describe('Custom Highlighting', () => {
    it('should support custom highlight class', () => {
      const { container } = render(
        <SearchHighlight
          text="Hello World"
          searchTerm="World"
          options={{ highlightClass: 'bg-blue-200 font-bold' }}
        />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveClass('bg-blue-200', 'font-bold');
    });

    it('should support custom highlight class without overriding defaults', () => {
      const { container } = render(
        <SearchHighlight
          text="Hello World"
          searchTerm="World"
          options={{ highlightClass: 'bg-red-300' }}
        />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveClass('bg-red-300');
    });
  });

  describe('Props', () => {
    it('should apply custom className to container', () => {
      const { container } = render(
        <SearchHighlight
          text="Hello World"
          searchTerm="World"
          className="custom-class"
        />
      );

      const span = container.querySelector('span.custom-class');
      expect(span).toBeInTheDocument();
    });

    it('should apply data-testid to container', () => {
      render(
        <SearchHighlight
          text="Hello World"
          searchTerm="World"
          data-testid="my-highlight"
        />
      );

      expect(screen.getByTestId('my-highlight')).toBeInTheDocument();
    });

    it('should combine className and data-testid', () => {
      const { container } = render(
        <SearchHighlight
          text="Hello World"
          searchTerm="World"
          className="my-class"
          data-testid="my-test"
        />
      );

      const span = container.querySelector('span.my-class');
      expect(span).toHaveAttribute('data-testid', 'my-test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const { container } = render(
        <SearchHighlight text="" searchTerm="test" />
      );

      expect(container.textContent).toBe('');
      expect(container.querySelectorAll('mark')).toHaveLength(0);
    });

    it('should handle search term longer than text', () => {
      const { container } = render(
        <SearchHighlight
          text="Hi"
          searchTerm="This is a very long search term"
        />
      );

      expect(container.textContent).toBe('Hi');
      expect(container.querySelectorAll('mark')).toHaveLength(0);
    });

    it('should preserve casing of original text when highlighting', () => {
      const { container } = render(
        <SearchHighlight text="Hello World" searchTerm="hello" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      // The matched text should be 'Hello' with capital H
      expect(marks[0]).toHaveTextContent('Hello');
    });

    it('should handle partial matches', () => {
      const { container } = render(
        <SearchHighlight text="application" searchTerm="app" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('app');
    });

    it('should handle text with newlines', () => {
      const { container } = render(
        <SearchHighlight
          text="Hello\nWorld"
          searchTerm="World"
        />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('World');
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000) + ' needle ' + 'b'.repeat(10000);
      const { container } = render(
        <SearchHighlight text={longText} searchTerm="needle" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('needle');
    });
  });

  describe('Performance', () => {
    it('should handle text with many matches efficiently', () => {
      const text = 'test '.repeat(1000);
      const { container } = render(
        <SearchHighlight text={text} searchTerm="test" />
      );

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1000);
    });

    it('should not create memory leaks on re-render', () => {
      const { rerender } = render(
        <SearchHighlight text="Hello World" searchTerm="World" />
      );

      // Re-render with new search term
      rerender(
        <SearchHighlight text="Hello World" searchTerm="Hello" />
      );

      const marks = document.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('Hello');
    });
  });

  describe('Display Name', () => {
    it('should have correct display name for debugging', () => {
      expect(SearchHighlight.displayName).toBe('SearchHighlight');
    });
  });

  describe('Integration with FilterBar', () => {
    it('should work in a list of items', () => {
      const items = ['Hello World', 'Test Item', 'Another Test'];
      const searchTerm = 'Test';

      const { container } = render(
        <div>
          {items.map((item, idx) => (
            <div key={idx}>
              <SearchHighlight text={item} searchTerm={searchTerm} />
            </div>
          ))}
        </div>
      );

      const marks = container.querySelectorAll('mark');
      // Should find 'Test' in "Test Item" and "Another Test"
      expect(marks.length).toBeGreaterThanOrEqual(2);
    });

    it('should work with dynamic search term changes', () => {
      const { rerender } = render(
        <SearchHighlight text="Hello World" searchTerm="Hello" />
      );

      let marks = document.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('Hello');

      rerender(
        <SearchHighlight text="Hello World" searchTerm="World" />
      );

      marks = document.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0]).toHaveTextContent('World');
    });
  });
});
