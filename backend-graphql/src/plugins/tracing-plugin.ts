import { trace, context as otelContext } from '@opentelemetry/api'
import { AsyncLocalStorage } from 'async_hooks'

const tracer = trace.getTracer('apollo-graphql', '1.0.0')

// Re-export type from Express if available, fallback to basic type
interface TraceContext {
  traceId: string
  parentSpanId: string
  traceFlags: string
}

// Create symbol keys for OpenTelemetry context
const OPERATION_SPAN_KEY = Symbol('operationSpan')

// AsyncLocalStorage for trace context (shared with Express middleware)
const traceContextStorage = new AsyncLocalStorage<TraceContext>()

function getTraceContext(): TraceContext | undefined {
  return traceContextStorage.getStore()
}

/**
 * Apollo Server plugin for W3C distributed tracing
 *
 * Hooks into GraphQL operation lifecycle to:
 * - Create operation spans with trace context
 * - Record operation type, name, and status
 * - Link to parent trace context from Express middleware
 * - Capture errors in spans
 */
export const tracingPlugin = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async didResolveOperation(requestContext: any) {
    try {
      // Extract trace context from AsyncLocalStorage (set by Express middleware)
      const parentTraceContext = getTraceContext()

      // Create operation span
      const operationType = requestContext.operation?.operation || 'unknown'
      const operationName = requestContext.operationName || 'unnamed'

      const span = tracer.startSpan(
        `graphql.${operationType}`,
        {
          attributes: {
            'graphql.operation.name': operationName,
            'graphql.operation.type': operationType,
            'trace.id': parentTraceContext?.traceId || 'unknown',
            'trace.parent_span_id': parentTraceContext?.parentSpanId || 'unknown',
            'trace.flags': parentTraceContext?.traceFlags || '00',
          },
        }
      )

      // Store span and tracer in context for access in resolvers
      if (!requestContext.context) {
        requestContext.context = {}
      }
      requestContext.context.otelSpan = span
      requestContext.context.otelTracer = tracer
      requestContext.context.parentTraceContext = parentTraceContext

      // Set OpenTelemetry context for async operations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = otelContext.active().setValue(OPERATION_SPAN_KEY as any, span)
      requestContext.context.otelCtx = ctx
    } catch (error) {
      console.error('[Tracing Plugin] Error in didResolveOperation:', error)
      // Continue without tracing if error occurs
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async willSendResponse(requestContext: any) {
    try {
      const span = requestContext.context?.otelSpan
      if (span) {
        // Add response status
        if (requestContext.response?.errors && requestContext.response.errors.length > 0) {
          span.setAttribute('graphql.response.errors.count', requestContext.response.errors.length)
          span.setStatus({ code: 1 }) // ERROR status
        } else {
          span.setStatus({ code: 0 }) // OK status
        }
        span.end()
      }
    } catch (error) {
      console.error('[Tracing Plugin] Error in willSendResponse:', error)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async didEncounterErrors(requestContext: any) {
    try {
      const span = requestContext.context?.otelSpan
      if (span && requestContext.errors && requestContext.errors.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requestContext.errors.forEach((error: any, index: number) => {
          span.addEvent('graphql.error', {
            'error.index': index,
            'error.message': error.message,
            'error.type': error.extensions?.code || 'UNKNOWN',
          })
        })
      }
    } catch (error) {
      console.error('[Tracing Plugin] Error in didEncounterErrors:', error)
    }
  },
}

/**
 * Helper to create a child span within a GraphQL resolver
 * Useful for wrapping specific operations (DB queries, external calls, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createResolverSpan(operationName: string, attributes?: Record<string, any>) {
  try {
    const span = tracer.startSpan(operationName, {
      attributes: {
        'graphql.resolver.operation': operationName,
        ...attributes,
      },
    })
    return span
  } catch (error) {
    console.error('[Tracing Plugin] Error creating resolver span:', error)
    return null
  }
}
