/**
 * Trace Context Manager
 * Handles trace persistence across storage tiers:
 * 1. In-memory (current request)
 * 2. sessionStorage (cross-page navigation)
 * 3. localStorage (multi-session continuity)
 */

import type { TraceContext } from './types'
import { createTraceContext, isValidTraceContext } from './tracing'

class TraceContextManagerImpl {
  private static readonly SESSION_KEY = 'trace-context-session'
  private static readonly LOCAL_KEY = 'trace-context-local'
  private inMemory: TraceContext | null = null

  /**
   * Get current trace context
   * Searches: in-memory → sessionStorage → localStorage → create new
   */
  getTraceContext(): TraceContext {
    // Try in-memory first (fastest)
    if (this.inMemory && isValidTraceContext(this.inMemory)) {
      return this.inMemory
    }

    // Try sessionStorage (page navigations)
    try {
      const sessionStored = sessionStorage?.getItem(TraceContextManagerImpl.SESSION_KEY)
      if (sessionStored) {
        const parsed = JSON.parse(sessionStored) as TraceContext
        if (isValidTraceContext(parsed)) {
          this.inMemory = parsed
          return parsed
        }
      }
    } catch (e) {
      // sessionStorage may be unavailable (private browsing, etc.)
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Tracing] sessionStorage access failed:', e)
      }
    }

    // Try localStorage (multi-session)
    try {
      const localStored = localStorage?.getItem(TraceContextManagerImpl.LOCAL_KEY)
      if (localStored) {
        const parsed = JSON.parse(localStored) as TraceContext
        if (isValidTraceContext(parsed)) {
          this.inMemory = parsed
          return parsed
        }
      }
    } catch (e) {
      // localStorage may be unavailable
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Tracing] localStorage access failed:', e)
      }
    }

    // Create new trace
    const trace = createTraceContext()
    this.setTraceContext(trace)
    return trace
  }

  /**
   * Set trace context and persist to storage
   */
  setTraceContext(trace: TraceContext): void {
    this.inMemory = trace

    // Persist to sessionStorage
    try {
      sessionStorage?.setItem(TraceContextManagerImpl.SESSION_KEY, JSON.stringify(trace))
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Tracing] Failed to store in sessionStorage:', e)
      }
    }

    // Persist to localStorage
    try {
      localStorage?.setItem(TraceContextManagerImpl.LOCAL_KEY, JSON.stringify(trace))
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Tracing] Failed to store in localStorage:', e)
      }
    }
  }

  /**
   * Clear trace context (for logout, etc.)
   */
  clearTraceContext(): void {
    this.inMemory = null

    try {
      sessionStorage?.removeItem(TraceContextManagerImpl.SESSION_KEY)
    } catch (e) {
      // Ignore
    }

    try {
      localStorage?.removeItem(TraceContextManagerImpl.LOCAL_KEY)
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Check if trace context is available
   */
  hasTraceContext(): boolean {
    return this.inMemory !== null
  }
}

// Singleton instance
export const traceContextManager = new TraceContextManagerImpl()

/**
 * Get global trace context
 */
export function getTraceContext(): TraceContext {
  return traceContextManager.getTraceContext()
}

/**
 * Set global trace context
 */
export function setTraceContext(trace: TraceContext): void {
  traceContextManager.setTraceContext(trace)
}

/**
 * Clear global trace context
 */
export function clearTraceContext(): void {
  traceContextManager.clearTraceContext()
}
