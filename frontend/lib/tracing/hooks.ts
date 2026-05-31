/**
 * React Hooks for Distributed Tracing
 * Provides trace context access in React components
 */

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react'
import type { TraceContext } from './types'
import { getTraceContext, setTraceContext, clearTraceContext } from './context-manager'
import { createChildSpan } from './tracing'

/**
 * React Context for trace data
 * Memoized to prevent unnecessary re-renders
 */
const TraceContextReact = createContext<TraceContext | null>(null)

/**
 * Props for TraceProvider
 */
interface TraceProviderProps {
  children: React.ReactNode
  initialTrace?: TraceContext
}

/**
 * TraceProvider component
 * Wraps application to provide trace context to all child components
 */
export function TraceProvider({ children, initialTrace }: TraceProviderProps): React.ReactElement {
  const [trace] = useState<TraceContext>(() => initialTrace || getTraceContext())

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => trace, [trace.traceId, trace.spanId])

  return <TraceContextReact.Provider value={contextValue}>{children}</TraceContextReact.Provider>
}

/**
 * Hook to access current trace context
 * Throws error if used outside TraceProvider
 *
 * @returns Current trace context
 * @throws Error if used outside TraceProvider
 */
export function useTraceContext(): TraceContext {
  const context = useContext(TraceContextReact)

  if (!context) {
    // Fallback: try to get global trace context
    try {
      return getTraceContext()
    } catch (e) {
      throw new Error('useTraceContext must be used within a TraceProvider or in a component that has access to global trace context')
    }
  }

  return context
}

/**
 * Hook to safely access trace context with fallback
 * Returns null if context unavailable (doesn't throw)
 *
 * @returns Current trace context or null
 */
export function useTraceContextSafe(): TraceContext | null {
  try {
    return useTraceContext()
  } catch {
    return null
  }
}

/**
 * Hook to create a child span from current trace
 *
 * @returns Child trace context with new span ID
 */
export function useChildSpan(): TraceContext {
  const parentTrace = useTraceContext()
  return useMemo(() => createChildSpan(parentTrace), [parentTrace.traceId, parentTrace.spanId])
}

/**
 * Hook to update global trace context
 *
 * @returns Function to set trace context
 */
export function useSetTraceContext(): (trace: TraceContext) => void {
  return useCallback((trace: TraceContext) => {
    setTraceContext(trace)
  }, [])
}

/**
 * Hook to clear trace context (for logout, etc.)
 *
 * @returns Function to clear trace context
 */
export function useClearTraceContext(): () => void {
  return useCallback(() => {
    clearTraceContext()
  }, [])
}

/**
 * Hook to log trace ID (useful for debugging)
 * Logs trace ID to console in development
 */
export function useTraceLogging(prefix: string = 'Component'): void {
  const trace = useTraceContextSafe()

  useEffect(() => {
    if (trace && process.env.NODE_ENV === 'development') {
      console.log(`[${prefix}] Trace ID: ${trace.traceId}`)
    }
  }, [trace?.traceId, prefix])
}

/**
 * Hook to extract traceparent header for API requests
 *
 * @returns traceparent header string
 */
export function useTraceparentHeader(): string {
  const trace = useTraceContextSafe()
  return trace?.traceparent || '00-unknown-unknown-00'
}

/**
 * Hook to get trace ID as string
 *
 * @returns trace ID string
 */
export function useTraceId(): string {
  const trace = useTraceContextSafe()
  return trace?.traceId || 'unknown'
}
