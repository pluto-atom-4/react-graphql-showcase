'use client';

import { useEffect, useState } from 'react';

/**
 * useDelayedVisibility Hook - Keep a component mounted through its exit animation
 *
 * Dropdowns in this codebase fade out rather than disappearing: the opacity class
 * keys off `isOpen`, but the element must stay in the tree for the duration of the
 * CSS transition. This hook returns that "still rendering" flag:
 *
 * - `isOpen` true  -> visible immediately (same render, no flash of unmounted content)
 * - `isOpen` false -> stays visible for `exitDelayMs`, then hides
 * - re-opening before the timer fires cancels the pending hide
 *
 * WHY THE SET-STATE HAPPENS DURING RENDER (do not "fix" this into an effect):
 *
 * The open path adjusts state in the render body, guarded by `isOpen && !isVisible`.
 * This is React's documented "adjusting state when a prop changes" escape hatch
 * (https://react.dev/learn/you-might-not-need-an-effect). React discards the
 * in-progress render output and immediately re-renders with the new state, before
 * anything is committed to the DOM or painted, so it is cheaper and flicker-free
 * compared with `useEffect(() => setIsVisible(true))`.
 *
 * It is also the only form that satisfies the lint config: both
 * `react-hooks/set-state-in-effect` AND `react-hooks/set-state-in-render` are
 * error-level here, and the render-phase set is exempt from the latter precisely
 * because it is conditional and converges (the guard is false on the re-render).
 * Moving it back into an effect trades one error for the other.
 *
 * The close path genuinely needs a timer, so it stays in an effect — an effect that
 * only schedules/cancels a `setTimeout` and never calls setState synchronously.
 *
 * Do NOT replace this with unmount-on-close (`if (!isOpen) return null`): that
 * removes the exit animation silently while still passing lint.
 *
 * @param isOpen - Whether the owning UI is logically open
 * @param exitDelayMs - How long to keep rendering after close, in ms (default 200,
 *                      matching `transition-opacity duration-200`)
 * @returns Whether the component should still be rendered
 *
 * @example
 * const isVisible = useDelayedVisibility(isOpen);
 * return isVisible ? (
 *   <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
 *     ...
 *   </div>
 * ) : null;
 */
export function useDelayedVisibility(isOpen: boolean, exitDelayMs = 200): boolean {
  const [isVisible, setIsVisible] = useState(isOpen);

  // Show synchronously during render — see the rationale above.
  if (isOpen && !isVisible) {
    setIsVisible(true);
  }

  useEffect(() => {
    if (isOpen) return;

    const timer = setTimeout((): void => setIsVisible(false), exitDelayMs);
    return (): void => clearTimeout(timer);
  }, [isOpen, exitDelayMs]);

  return isVisible;
}
