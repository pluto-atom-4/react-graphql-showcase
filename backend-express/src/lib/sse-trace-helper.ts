/**
 * Server-Sent Events (SSE) Trace Helper
 * Utilities for emitting events with trace metadata
 */

import type { TraceContext } from './trace-context'

/**
 * Event data with optional trace metadata
 */
export interface EventWithTrace {
  event: string
  data: unknown
  traceId?: string
  traceFlags?: string
}

/**
 * Wrap event data with trace metadata from context
 * Adds trace ID and trace flags to event for client reference
 *
 * @param event - Event name
 * @param data - Event payload
 * @param traceContext - Optional trace context
 * @returns Event with trace metadata
 */
export function wrapEventWithTrace(
  event: string,
  data: unknown,
  traceContext?: TraceContext
): EventWithTrace {
  const wrapped: EventWithTrace = {
    event,
    data,
  }

  if (traceContext) {
    wrapped.traceId = traceContext.traceId
    wrapped.traceFlags = traceContext.traceFlags
  }

  return wrapped
}

/**
 * Format event with trace metadata for SSE stream
 * Converts event to SSE-compatible text format
 *
 * @param eventWithTrace - Event with trace metadata
 * @returns SSE-formatted text
 */
export function formatEventForSSE(eventWithTrace: EventWithTrace): string {
  const lines: string[] = []

  // Event name
  lines.push(`event: ${eventWithTrace.event}`)

  // Add trace metadata in custom headers (comments in SSE)
  if (eventWithTrace.traceId) {
    lines.push(`: trace-id: ${eventWithTrace.traceId}`)
  }
  if (eventWithTrace.traceFlags) {
    lines.push(`: trace-flags: ${eventWithTrace.traceFlags}`)
  }

  // Event data
  lines.push(`data: ${JSON.stringify(eventWithTrace.data)}`)

  // Empty line terminates event
  lines.push('')

  return lines.join('\n')
}

/**
 * Check if event should be traced
 * Events with null/undefined trace context are still emitted
 * but without trace metadata
 *
 * @param traceContext - Trace context (optional)
 * @returns True if event should include trace metadata
 */
export function shouldTraceEvent(traceContext?: TraceContext): boolean {
  return traceContext !== undefined && traceContext.traceId !== undefined
}

/**
 * Extract trace ID from event (if present)
 * Useful for client-side filtering or processing
 *
 * @param eventWithTrace - Event that may contain trace ID
 * @returns Trace ID or undefined
 */
export function extractTraceIdFromEvent(
  eventWithTrace: EventWithTrace
): string | undefined {
  return eventWithTrace.traceId
}
