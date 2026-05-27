import { trace, context as otelContext } from '@opentelemetry/api'

const tracer = trace.getTracer('prisma-otel-bridge', '1.0.0')

// Create symbol keys for OpenTelemetry context
const PRISMA_SPAN_KEY = Symbol('prismaSpan')
const DB_TRACER_KEY = Symbol('dbTracer')

/**
 * Prisma ORM Span Bridge
 *
 * Creates spans for Prisma database operations and links them
 * to parent GraphQL resolver spans via OpenTelemetry context
 */

/**
 * Get current Prisma trace context from OpenTelemetry
 * Returns tracer and parent span if available
 */
export function getPrismaTraceContext() {
  try {
    const ctx = otelContext.active()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const span = ctx.getValue(PRISMA_SPAN_KEY as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbTracer = ctx.getValue(DB_TRACER_KEY as any)
    return { span, tracer: dbTracer }
  } catch (error) {
    console.error('[Prisma Bridge] Error getting trace context:', error)
    return { span: null, tracer: null }
  }
}

/**
 * Create a span for a Prisma database operation
 *
 * @param operation - Operation type (query, create, update, delete, etc.)
 * @param metadata - Optional metadata (table name, query details, etc.)
 * @returns Span object or null if tracing unavailable
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPrismaSpan(operation: string, metadata?: Record<string, any>) {
  try {
    const span = tracer.startSpan(
      `db.prisma.${operation}`,
      {
        attributes: {
          'db.system': 'postgresql',
          'db.operation': operation,
          'db.engine': 'prisma',
          ...metadata,
        },
      }
    )

    return span
  } catch (error) {
    console.error('[Prisma Bridge] Error creating Prisma span:', error)
    return null
  }
}

/**
 * Wrap a Prisma query to create a span
 *
 * @param queryName - Name of the Prisma query (e.g., "build.findMany")
 * @param queryFn - Async function that performs the query
 * @param metadata - Optional metadata
 * @returns Result of the query
 */
export async function withPrismaSpan<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
): Promise<T> {
  const span = createPrismaSpan('query', {
    'db.query.name': queryName,
    ...metadata,
  })

  if (!span) {
    // Tracing not available, execute query directly
    return queryFn()
  }

  try {
    const startTime = Date.now()
    const result = await queryFn()
    const duration = Date.now() - startTime

    span.addEvent('db.query.complete', {
      'duration_ms': duration,
    })

    return result
  } catch (error) {
    span.recordException(error as Error)
    span.setStatus({ code: 1, message: 'ERROR' })
    throw error
  } finally {
    span.end()
  }
}

/**
 * Wrap multiple Prisma queries in a transaction with a span
 *
 * @param txName - Name of the transaction
 * @param txFn - Function that performs the transaction
 * @returns Result of the transaction
 */
export async function withPrismaTransaction<T>(
  txName: string,
  txFn: () => Promise<T>
): Promise<T> {
  const span = createPrismaSpan('transaction', {
    'db.transaction.name': txName,
  })

  if (!span) {
    return txFn()
  }

  try {
    const result = await txFn()
    span.addEvent('db.transaction.commit')
    return result
  } catch (error) {
    span.recordException(error as Error)
    span.addEvent('db.transaction.rollback')
    span.setStatus({ code: 1, message: 'ERROR' })
    throw error
  } finally {
    span.end()
  }
}

/**
 * Record Prisma errors in span
 *
 * @param span - OpenTelemetry span
 * @param error - Error object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function recordPrismaError(span: any, error: Error) {
  if (span) {
    span.recordException(error)
    span.addEvent('db.error', {
      'error.message': error.message,
      'error.type': error.name,
    })
  }
}

/**
 * Decorator for wrapping Prisma model methods with tracing
 *
 * @param modelName - Prisma model name (e.g., "Build")
 * @param operationName - Operation name (e.g., "findMany")
 * @returns Decorator function
 */
export function tracePrismaOperation(modelName: string, operationName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const span = createPrismaSpan(`${modelName}.${operationName}`, {
        'db.model': modelName,
        'db.operation': operationName,
      })

      if (!span) {
        return originalMethod.apply(this, args)
      }

      try {
        const result = await originalMethod.apply(this, args)
        return result
      } catch (error) {
        recordPrismaError(span, error as Error)
        throw error
      } finally {
        span.end()
      }
    }

    return descriptor
  }
}

/**
 * Helper to get formatted Prisma query info from Prisma event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPrismaQueryInfo(event: any) {
  return {
    query: event.query,
    params: event.params,
    duration: event.duration,
    target: event.target,
  }
}
