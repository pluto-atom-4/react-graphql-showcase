/**
 * OpenTelemetry Tracer Setup and Initialization
 * Initializes OpenTelemetry SDK and provides tracer instance
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api'
import {
  resourceFromAttributes,
  defaultResource,
} from '@opentelemetry/resources'
import {
  SemanticResourceAttributes,
} from '@opentelemetry/semantic-conventions'

/**
 * Get OpenTelemetry tracer instance
 * Used for creating spans and tracking distributed requests
 */
export const tracer = trace.getTracer('express-sse-tracing', '1.0.0')

/**
 * Initialize OpenTelemetry tracing
 * Call this on application startup to enable distributed tracing
 */
export function initializeTracing(): void {
  // Log initialization (tracer is already initialized via getTracer above)
  console.error('[Tracing] OpenTelemetry tracer initialized')
}

/**
 * Create a resource representing this service
 * Used for identifying this backend in traces
 *
 * @returns Resource instance
 */
export function createResource() {
  return defaultResource().merge(
    resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: 'express-backend',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    })
  )
}

/**
 * Get active trace context from OpenTelemetry context
 * Returns current span's trace context if available
 *
 * @returns TraceId or undefined if not in active span
 */
export function getActiveTraceId(): string | undefined {
  const span = trace.getActiveSpan()
  if (span) {
    const spanContext = span.spanContext()
    return spanContext.traceId
  }
  return undefined
}

/**
 * Run callback within a span context
 * Useful for wrapping async operations with tracing
 *
 * @param spanName - Name of the span
 * @param callback - Function to run within span
 * @returns Result of callback
 */
export function withSpan<T>(
  spanName: string,
  callback: () => T
): T {
  const span = tracer.startSpan(spanName)
  try {
    return context.with(trace.setSpan(context.active(), span), callback)
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR })
    span.recordException(error as Error)
    throw error
  } finally {
    span.end()
  }
}

/**
 * Run async callback within a span context
 * For async operations that need tracing
 *
 * @param spanName - Name of the span
 * @param callback - Async function to run within span
 * @returns Promise that resolves when callback completes
 */
export async function withSpanAsync<T>(
  spanName: string,
  callback: () => Promise<T>
): Promise<T> {
  const span = tracer.startSpan(spanName)
  try {
    return await context.with(
      trace.setSpan(context.active(), span),
      callback
    )
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR })
    span.recordException(error as Error)
    throw error
  } finally {
    span.end()
  }
}
