/**
 * Distributed Tracing Module - Public API
 * Exports all tracing utilities for use in React components and Apollo Client
 */

// Types
export type { TraceContext, SpanAttributes, TraceEvent, WebVital, TracedError } from './types'
export { TraceEventType } from './types'

// Core Tracing Utilities
export {
  generateTraceId,
  generateSpanId,
  generateTraceparent,
  parseTraceparent,
  createTraceContext,
  createChildSpan,
  isValidTraceContext,
} from './tracing'

// Context Management
export { getTraceContext, setTraceContext, clearTraceContext, traceContextManager } from './context-manager'

// React Hooks
export {
  TraceProvider,
  useTraceContext,
  useTraceContextSafe,
  useChildSpan,
  useSetTraceContext,
  useClearTraceContext,
  useTraceLogging,
  useTraceparentHeader,
  useTraceId,
} from './hooks'
