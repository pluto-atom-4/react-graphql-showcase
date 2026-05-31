/**
 * Frontend Tracing Utilities
 * W3C Trace Context format: 00-<trace-id>-<span-id>-<trace-flags>
 * Example: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 */

import type { TraceContext } from './types'

/**
 * Generate a W3C-compliant trace ID (32 hex characters)
 */
export function generateTraceId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use Web Crypto API if available (all modern browsers)
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array)
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  }

  // Fallback: JavaScript-based generation (less random but works everywhere)
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * 16))
  }
  return result
}

/**
 * Generate a W3C-compliant span ID (16 hex characters)
 */
export function generateSpanId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(8)
    crypto.getRandomValues(array)
    return Array.from(array)
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  }

  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * 16))
  }
  return result
}

/**
 * Generate a W3C traceparent header value
 * Format: 00-<trace-id>-<span-id>-<trace-flags>
 */
export function generateTraceparent(
  traceId?: string,
  spanId?: string,
  traceFlags: string = '01'
): string {
  const actualTraceId = traceId || generateTraceId()
  const actualSpanId = spanId || generateSpanId()
  return `00-${actualTraceId}-${actualSpanId}-${traceFlags}`
}

/**
 * Parse a W3C traceparent header value
 * Returns null if invalid format
 */
export function parseTraceparent(traceparent: string): Partial<TraceContext> | null {
  const parts = traceparent.split('-')

  if (parts.length !== 4) {
    return null
  }

  const [version, traceId, spanId, traceFlags] = parts

  // Validate format
  if (version !== '00') return null
  if (traceId.length !== 32) return null
  if (spanId.length !== 16) return null
  if (traceFlags.length !== 2) return null

  // Validate hex format
  if (!/^[0-9a-f]{32}$/.test(traceId)) return null
  if (!/^[0-9a-f]{16}$/.test(spanId)) return null
  if (!/^[0-9a-f]{2}$/.test(traceFlags)) return null

  return {
    traceId,
    spanId,
    traceFlags,
    traceparent,
    timestamp: Date.now(),
  }
}

/**
 * Create a new trace context
 */
export function createTraceContext(): TraceContext {
  const traceId = generateTraceId()
  const spanId = generateSpanId()
  const traceFlags = '01'
  const traceparent = `00-${traceId}-${spanId}-${traceFlags}`

  return {
    traceId,
    spanId,
    traceFlags,
    traceparent,
    timestamp: Date.now(),
  }
}

/**
 * Create a child span from a parent trace context
 */
export function createChildSpan(parentTrace: TraceContext): TraceContext {
  // Reuse trace ID, generate new span ID
  const spanId = generateSpanId()
  const traceparent = `00-${parentTrace.traceId}-${spanId}-${parentTrace.traceFlags}`

  return {
    traceId: parentTrace.traceId,
    spanId,
    traceFlags: parentTrace.traceFlags,
    traceparent,
    timestamp: Date.now(),
  }
}

/**
 * Check if trace context is valid (non-zero trace ID)
 */
export function isValidTraceContext(trace: TraceContext): boolean {
  // Check if trace ID is not all zeros (meaning "not sampled")
  return trace.traceId !== '00000000000000000000000000000000' && trace.traceId.length === 32
}
