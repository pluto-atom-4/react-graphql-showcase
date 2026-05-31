/**
 * W3C Distributed Tracing Types
 * Based on W3C Trace Context specification
 * https://www.w3.org/TR/trace-context/
 */

/** Trace context value passed through application layers */
export interface TraceContext {
  /** W3C trace ID (32 hex characters) */
  traceId: string
  /** W3C span ID (16 hex characters) */
  spanId: string
  /** W3C trace flags (2 hex characters: recorded flag) */
  traceFlags: string
  /** Full traceparent header value */
  traceparent: string
  /** Timestamp when trace was created */
  timestamp: number
}

/** Span attributes for trace events */
export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined
}

/** Span event for tracing operations */
export interface TraceEvent {
  name: string
  timestamp: number
  attributes?: SpanAttributes
}

/** Trace event types */
export enum TraceEventType {
  GraphQL_Query = 'graphql.query',
  GraphQL_Mutation = 'graphql.mutation',
  GraphQL_Error = 'graphql.error',
  Navigation = 'navigation',
  WebVital = 'web.vital',
  Error = 'error',
  SSE_Event = 'sse.event',
}

/** Web Vital metric */
export interface WebVital {
  name: 'LCP' | 'FID' | 'CLS'
  value: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  traceId?: string
}

/** Error tracking */
export interface TracedError {
  message: string
  stack?: string
  traceId: string
  timestamp: number
  context?: Record<string, unknown>
}
