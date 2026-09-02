import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDelayedVisibility } from '../useDelayedVisibility';

describe('useDelayedVisibility Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Open path', () => {
    it('is visible on the first render when mounted open', () => {
      const { result } = renderHook(() => useDelayedVisibility(true));

      expect(result.current).toBe(true);
    });

    it('is hidden on the first render when mounted closed', () => {
      const { result } = renderHook(() => useDelayedVisibility(false));

      expect(result.current).toBe(false);
    });

    it('becomes visible immediately when isOpen flips to true, without advancing timers', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDelayedVisibility(isOpen),
        { initialProps: { isOpen: false } }
      );

      expect(result.current).toBe(false);

      rerender({ isOpen: true });

      expect(result.current).toBe(true);
    });
  });

  describe('Exit delay', () => {
    it('stays visible at 199ms after close and hides at 200ms', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDelayedVisibility(isOpen),
        { initialProps: { isOpen: true } }
      );

      rerender({ isOpen: false });
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe(false);
    });

    it('honors a custom exitDelayMs', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDelayedVisibility(isOpen, 500),
        { initialProps: { isOpen: true } }
      );

      rerender({ isOpen: false });

      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe(false);
    });

    it('hides immediately when exitDelayMs is 0 and timers run', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDelayedVisibility(isOpen, 0),
        { initialProps: { isOpen: true } }
      );

      rerender({ isOpen: false });
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(result.current).toBe(false);
    });
  });

  describe('Re-open before the timer fires', () => {
    it('stays visible and cancels the pending hide', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDelayedVisibility(isOpen),
        { initialProps: { isOpen: true } }
      );

      rerender({ isOpen: false });

      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(result.current).toBe(true);

      rerender({ isOpen: true });

      // The original timer would have fired at 200ms; it must have been cleared.
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('restarts the delay on a subsequent close', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useDelayedVisibility(isOpen),
        { initialProps: { isOpen: true } }
      );

      rerender({ isOpen: false });
      act(() => {
        vi.advanceTimersByTime(150);
      });
      rerender({ isOpen: true });
      rerender({ isOpen: false });

      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe(false);
    });
  });

  describe('Unmount', () => {
    it('clears the pending timer so no state update happens after unmount', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { rerender, unmount } = renderHook(
        ({ isOpen }) => useDelayedVisibility(isOpen),
        { initialProps: { isOpen: true } }
      );

      rerender({ isOpen: false });
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(errorSpy).not.toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });
});
