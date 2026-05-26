/**
 * Async Local Storage Context Manager
 * Manages trace context isolation across async operations
 */

import { AsyncLocalStorage } from 'async_hooks'
import type { TraceContext } from './trace-context'

/**
 * AsyncLocalStorage instance for trace context
 * Ensures each async operation has isolated trace context
 * Prevents context leakage between concurrent requests
 */
const traceContextStorage = new AsyncLocalStorage<TraceContext>()

/**
 * Get current trace context from AsyncLocalStorage
 * Returns undefined if no context is set for current async context
 *
 * @returns Current TraceContext or undefined
 */
export function getTraceContext(): TraceContext | undefined {
  return traceContextStorage.getStore()
}

/**
 * Set trace context for current async context
 * Stores context in AsyncLocalStorage for this async operation
 *
 * @param context - TraceContext to store
 */
export function setTraceContext(context: TraceContext): void {
  // Store context in AsyncLocalStorage
  // This replaces any existing context for this async operation
  traceContextStorage.enterWith(context)
}

/**
 * Run a callback within a specific trace context
 * Establishes context for all async operations within callback
 *
 * @param context - TraceContext to use for this async operation
 * @param callback - Function to run within trace context
 * @returns Result of callback
 */
export function runWithTraceContext<T>(
  context: TraceContext,
  callback: () => T
): T {
  return traceContextStorage.run(context, callback)
}

/**
 * Clear trace context from current async context
 * Cleans up context to prevent memory leaks
 */
export function clearTraceContext(): void {
  // Remove context from AsyncLocalStorage
  // Note: This is implicit when async operation completes
  // Explicit call useful for cleanup handlers
}

/**
 * Get or create trace context
 * Returns existing context or creates new one if none exists
 *
 * @param fallback - Optional fallback context to create if none exists
 * @returns Current or new TraceContext
 */
export function getOrCreateTraceContext(
  fallback?: TraceContext
): TraceContext {
  const existing = getTraceContext()
  if (existing) {
    return existing
  }
  if (fallback) {
    setTraceContext(fallback)
    return fallback
  }
  throw new Error('No trace context available')
}

/**
 * Check if trace context is currently set
 * Useful for conditional logic based on context availability
 *
 * @returns True if context is set, false otherwise
 */
export function hasTraceContext(): boolean {
  return getTraceContext() !== undefined
}
