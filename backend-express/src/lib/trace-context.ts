/**
 * W3C Trace Context Parser
 * Parses and validates W3C traceparent and tracestate headers
 * Reference: https://www.w3.org/TR/trace-context/
 */

/**
 * Represents a W3C trace context extracted from headers
 */
export interface TraceContext {
  traceId: string        // 32 hex characters
  parentSpanId: string   // 16 hex characters
  traceFlags: string     // 2 hex characters (trace flags like sampled)
  tracestate?: string    // vendor-specific tracing data
  version: string        // W3C version (always "00")
}

/**
 * Parse W3C traceparent header into TraceContext
 * Format: traceparent: 00-TRACE_ID-PARENT_SPAN_ID-TRACE_FLAGS
 *
 * @param header - The traceparent header value
 * @returns Parsed TraceContext or generates new one if invalid/missing
 */
export function parseTraceparent(header?: string): TraceContext {
  if (!header) {
    return generateTraceContext()
  }

  const parts = header.split('-')

  // Validate format: should have exactly 4 parts
  if (parts.length !== 4) {
    return generateTraceContext()
  }

  const [version, traceId, parentSpanId, traceFlags] = parts

  // Validate version (should be "00")
  if (version !== '00') {
    return generateTraceContext()
  }

  // Validate traceId (32 hex characters)
  if (!isValidHex(traceId, 32)) {
    return generateTraceContext()
  }

  // Validate parentSpanId (16 hex characters)
  if (!isValidHex(parentSpanId, 16)) {
    return generateTraceContext()
  }

  // Validate traceFlags (2 hex characters)
  if (!isValidHex(traceFlags, 2)) {
    return generateTraceContext()
  }

  return {
    version: '00',
    traceId,
    parentSpanId,
    traceFlags,
  }
}

/**
 * Parse W3C tracestate header (vendor-specific data)
 * Format: tracestate: vendor1=value1,vendor2=value2
 *
 * @param header - The tracestate header value
 * @returns Parsed tracestate string or undefined
 */
export function parseTracestate(header?: string): string | undefined {
  if (!header) {
    return undefined
  }

  // Basic validation: should not be empty
  return header.trim() === '' ? undefined : header
}

/**
 * Generate new trace ID and context
 * Creates a new UUID-like trace ID if not provided
 *
 * @returns New TraceContext with generated trace ID
 */
export function generateTraceContext(): TraceContext {
  return {
    version: '00',
    traceId: generateTraceId(),
    parentSpanId: generateSpanId(),
    traceFlags: '01', // Sampled (default)
  }
}

/**
 * Generate a random 32-character hex trace ID
 *
 * @returns Hex string (32 characters)
 */
export function generateTraceId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

/**
 * Generate a random 16-character hex span ID
 *
 * @returns Hex string (16 characters)
 */
export function generateSpanId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

/**
 * Format TraceContext back to W3C traceparent header format
 *
 * @param context - TraceContext to format
 * @returns Formatted traceparent header string
 */
export function formatTraceparent(context: TraceContext): string {
  return `${context.version}-${context.traceId}-${context.parentSpanId}-${context.traceFlags}`
}

/**
 * Check if traceparent header is valid
 *
 * @param header - Header string to validate
 * @returns True if valid W3C traceparent format
 */
export function isValidTraceparent(header: string): boolean {
  if (!header) return false

  const parts = header.split('-')
  if (parts.length !== 4) return false

  const [version, traceId, parentSpanId, traceFlags] = parts

  return (
    version === '00' &&
    isValidHex(traceId, 32) &&
    isValidHex(parentSpanId, 16) &&
    isValidHex(traceFlags, 2)
  )
}

/**
 * Validate if string is valid hex of expected length
 *
 * @param str - String to validate
 * @param length - Expected length
 * @returns True if valid hex string of expected length
 */
function isValidHex(str: string, length: number): boolean {
  if (str.length !== length) return false
  return /^[0-9a-f]+$/.test(str)
}
