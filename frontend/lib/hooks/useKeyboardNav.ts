'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Configuration for keyboard navigation behavior
 */
export interface KeyboardNavConfig {
  /** Array of focusable element selectors in order */
  focusableSelectors: string[];
  /** Whether to loop focus at boundaries (default: true) */
  loopFocus?: boolean;
  /** Whether to handle escape key (default: true) */
  handleEscape?: boolean;
  /** Callback when escape is pressed */
  onEscape?: () => void;
  /** Whether to handle arrow keys for navigation (default: true) */
  handleArrows?: boolean;
  /** Container element reference for scoping focus search */
  containerRef?: React.RefObject<HTMLElement>;
  /** Whether to handle ctrl+z/y for undo/redo (default: false) */
  handleUndoRedo?: boolean;
  /** Callback for undo (ctrl+z) */
  onUndo?: () => void;
  /** Callback for redo (ctrl+y) */
  onRedo?: () => void;
}

/**
 * useKeyboardNav Hook - Manage keyboard navigation across filter components
 *
 * Features:
 * - Tab navigation through focusable elements
 * - Arrow key navigation (left/right or up/down)
 * - Escape key handling with custom callback
 * - Ctrl+Z/Y for undo/redo support
 * - Focus looping at boundaries
 * - Container scoping for focus search
 * - No external dependencies
 *
 * @param config Keyboard navigation configuration
 * @returns Object with focus management methods
 *
 * @example
 * const { setFocus, getCurrentFocusIndex } = useKeyboardNav({
 *   focusableSelectors: ['input', 'button', '[role="button"]'],
 *   onEscape: handleEscapeKeyPress,
 *   handleUndoRedo: true,
 *   onUndo: handleUndo,
 *   onRedo: handleRedo,
 * });
 *
 * // Programmatically set focus
 * setFocus(0); // Focus first element
 *
 * // Get current focus index
 * const index = getCurrentFocusIndex();
 */
export function useKeyboardNav(config: KeyboardNavConfig): {
  setFocus: (index: number) => void;
  getCurrentFocusIndex: () => number;
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
} {
  const {
    focusableSelectors,
    loopFocus = true,
    handleEscape = true,
    onEscape,
    handleArrows = true,
    containerRef,
    handleUndoRedo = false,
    onUndo,
    onRedo,
  } = config;

  const focusIndexRef = useRef<number>(-1);

  /**
   * Get all focusable elements based on selectors
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    let container = containerRef?.current || document;

    if (!container) {
      return [];
    }

    const allElements: HTMLElement[] = [];

    // Collect all elements matching any of the selectors
    focusableSelectors.forEach((selector) => {
      try {
        const elements = container.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        allElements.push(...Array.from(elements));
      } catch (e) {
        console.warn(`[useKeyboardNav] Invalid selector: ${selector}`);
      }
    });

    // Filter out disabled and hidden elements, remove duplicates
    const uniqueElements = Array.from(new Set(allElements));
    const focusable = uniqueElements.filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.offsetParent !== null && // Not hidden with display:none
        getComputedStyle(el).visibility !== 'hidden'
    );

    return focusable;
  }, [focusableSelectors, containerRef]);

  /**
   * Set focus to element at given index
   */
  const setFocus = useCallback(
    (index: number) => {
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      let targetIndex = index;

      // Enforce loop behavior
      if (loopFocus) {
        targetIndex = ((index % elements.length) + elements.length) % elements.length;
      } else {
        targetIndex = Math.max(0, Math.min(index, elements.length - 1));
      }

      elements[targetIndex]?.focus();
      focusIndexRef.current = targetIndex;
    },
    [getFocusableElements, loopFocus]
  );

  /**
   * Get current focus index
   */
  const getCurrentFocusIndex = useCallback((): number => {
    if (focusIndexRef.current >= 0) {
      return focusIndexRef.current;
    }

    const elements = getFocusableElements();
    const activeElement = document.activeElement;

    const index = elements.findIndex((el) => el === activeElement);
    if (index >= 0) {
      focusIndexRef.current = index;
      return index;
    }

    return -1;
  }, [getFocusableElements]);

  /**
   * Focus next element
   */
  const focusNext = useCallback(() => {
    const currentIndex = getCurrentFocusIndex();
    const nextIndex = currentIndex + 1;
    setFocus(nextIndex);
  }, [getCurrentFocusIndex, setFocus]);

  /**
   * Focus previous element
   */
  const focusPrevious = useCallback(() => {
    const currentIndex = getCurrentFocusIndex();
    const previousIndex = currentIndex - 1;
    setFocus(previousIndex);
  }, [getCurrentFocusIndex, setFocus]);

  /**
   * Focus first element
   */
  const focusFirst = useCallback(() => {
    setFocus(0);
  }, [setFocus]);

  /**
   * Focus last element
   */
  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    setFocus(elements.length - 1);
  }, [getFocusableElements, setFocus]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (evt: Event) => {
      const event = evt as KeyboardEvent;

      // Handle Escape key
      if (handleEscape && event.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
      }

      // Handle Undo/Redo with Ctrl+Z/Y
      if (handleUndoRedo) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
          event.preventDefault();
          onUndo?.();
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
          event.preventDefault();
          onRedo?.();
        }
      }

      // Handle arrow key navigation
      if (handleArrows) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          focusNext();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          focusPrevious();
        }
      }
    },
    [handleEscape, onEscape, handleArrows, focusNext, focusPrevious, handleUndoRedo, onUndo, onRedo]
  );

  /**
   * Attach keyboard event listener
   */
  useEffect(() => {
    const container = containerRef?.current || document;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  /**
   * Update focus index when active element changes (e.g., via mouse click)
   */
  useEffect(() => {
    const handleFocusChange = () => {
      const currentIndex = getCurrentFocusIndex();
      // Update ref to track current focus
      focusIndexRef.current = currentIndex;
    };

    document.addEventListener('focusin', handleFocusChange);
    return () => {
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [getCurrentFocusIndex]);

  return {
    setFocus,
    getCurrentFocusIndex,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}

export default useKeyboardNav;
