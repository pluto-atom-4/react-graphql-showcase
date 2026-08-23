import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNav, KeyboardNavConfig } from '../useKeyboardNav';

describe('useKeyboardNav Hook', () => {
  beforeEach(() => {
    // Setup DOM with focusable elements
    const container = document.createElement('div');
    container.id = 'nav-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'focus-input';
    input.className = 'focusable-input';

    const button1 = document.createElement('button');
    button1.id = 'focus-button-1';
    button1.className = 'focusable-button';
    button1.textContent = 'Button 1';

    const button2 = document.createElement('button');
    button2.id = 'focus-button-2';
    button2.className = 'focusable-button';
    button2.textContent = 'Button 2';

    container.appendChild(input);
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);
  });

  afterEach(() => {
    const container = document.getElementById('nav-container');
    if (container) {
      container.remove();
    }
  });

  describe('Initialization', () => {
    it('should initialize with valid config', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input', '.focusable-button'],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(result.current).toBeDefined();
      expect(typeof result.current.setFocus).toBe('function');
      expect(typeof result.current.getCurrentFocusIndex).toBe('function');
    });

    it('should return focus management methods', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(result.current.setFocus).toBeDefined();
      expect(result.current.getCurrentFocusIndex).toBeDefined();
      expect(result.current.focusNext).toBeDefined();
      expect(result.current.focusPrevious).toBeDefined();
      expect(result.current.focusFirst).toBeDefined();
      expect(result.current.focusLast).toBeDefined();
    });
  });

  describe('Focus Management', () => {
    it('should support setFocus method', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input', '.focusable-button'],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(() => {
        act(() => {
          result.current.setFocus(0);
        });
      }).not.toThrow();
    });

    it('should support focusFirst method', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input', '.focusable-button'],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(() => {
        act(() => {
          result.current.focusFirst();
        });
      }).not.toThrow();
    });

    it('should support focusLast method', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input', '.focusable-button'],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(() => {
        act(() => {
          result.current.focusLast();
        });
      }).not.toThrow();
    });

    it('should accept loopFocus configuration', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input', '.focusable-button'],
        loopFocus: true,
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(result.current).toBeDefined();
    });

    it('should accept loopFocus disabled configuration', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input', '.focusable-button'],
        loopFocus: false,
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(result.current).toBeDefined();
    });

    it('should return -1 when no element is focused', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      const index = result.current.getCurrentFocusIndex();
      expect(index).toBe(-1);
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should handle Escape key when enabled', () => {
      const onEscape = vi.fn();
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
        handleEscape: true,
        onEscape,
      };

      renderHook(() => useKeyboardNav(config));

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(onEscape).toHaveBeenCalled();
    });

    it('should not handle Escape key when disabled', () => {
      const onEscape = vi.fn();
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
        handleEscape: false,
        onEscape,
      };

      renderHook(() => useKeyboardNav(config));

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('should handle Ctrl+Z for undo', () => {
      const onUndo = vi.fn();
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
        handleUndoRedo: true,
        onUndo,
      };

      renderHook(() => useKeyboardNav(config));

      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(onUndo).toHaveBeenCalled();
    });

    it('should handle Cmd+Z for undo on Mac', () => {
      const onUndo = vi.fn();
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
        handleUndoRedo: true,
        onUndo,
      };

      renderHook(() => useKeyboardNav(config));

      const event = new KeyboardEvent('keydown', { key: 'z', metaKey: true });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(onUndo).toHaveBeenCalled();
    });

    it('should handle Ctrl+Y for redo', () => {
      const onRedo = vi.fn();
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
        handleUndoRedo: true,
        onRedo,
      };

      renderHook(() => useKeyboardNav(config));

      const event = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(onRedo).toHaveBeenCalled();
    });

    it('should not handle undo/redo when disabled', () => {
      const onUndo = vi.fn();
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
        handleUndoRedo: false,
        onUndo,
      };

      renderHook(() => useKeyboardNav(config));

      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      act(() => {
        document.dispatchEvent(event);
      });

      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selector list', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: [],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(() => {
        result.current.focusFirst();
      }).not.toThrow();
    });

    it('should handle invalid CSS selectors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input', 'invalid:::selector'],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      act(() => {
        result.current.focusFirst();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid selector')
      );

      consoleSpy.mockRestore();
    });

    it('should handle non-matching selectors', () => {
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.non-existent-class'],
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(() => {
        result.current.focusFirst();
      }).not.toThrow();

      expect(result.current.getCurrentFocusIndex()).toBe(-1);
    });
  });

  describe('Container Scoping', () => {
    it('should accept containerRef config', () => {
      const containerRef = { current: document.getElementById('nav-container') as HTMLElement | null };
      const config: KeyboardNavConfig = {
        focusableSelectors: ['.focusable-input'],
        containerRef: containerRef as React.RefObject<HTMLElement>,
      };

      const { result } = renderHook(() => useKeyboardNav(config));

      expect(result.current).toBeDefined();
    });
  });
});
