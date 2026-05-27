import { trace, context as otelContext } from '@opentelemetry/api'

const tracer = trace.getTracer('apollo-graphql-fields', '1.0.0')

// Create symbol keys for OpenTelemetry context
const FIELD_SPAN_KEY = Symbol('graphqlFieldSpan')

/**
 * Wraps a field resolver to create nested spans for detailed tracing
 *
 * @param resolve - Original resolver function
 * @param fieldName - Name of the field being resolved
 * @param typeName - Name of the parent type
 * @returns Wrapped resolver that creates spans
 */
export function wrapFieldResolver(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (parent: any, args: any, context: any, info: any) => any,
  fieldName: string,
  typeName: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async function wrappedResolver(parent: any, args: any, context: any, info: any) {
    // If tracing not available in context, call resolver normally
    if (!context?.otelTracer) {
      return resolve(parent, args, context, info)
    }

    const span = context.otelTracer.startSpan(
      `graphql.field.${typeName}.${fieldName}`,
      {
        attributes: {
          'graphql.field.name': fieldName,
          'graphql.type.name': typeName,
          'graphql.args': JSON.stringify(args), // Can redact sensitive args if needed
        },
      }
    )

    try {
      const result = await otelContext.with(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        otelContext.active().setValue(FIELD_SPAN_KEY as any, span),
        () => resolve(parent, args, context, info)
      )
      return result
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ code: 1, message: 'ERROR' })
      throw error
    } finally {
      span.end()
    }
  }
}

/**
 * Wraps all resolvers in a type to create field spans
 *
 * @param resolvers - Object with resolver functions
 * @param typeName - Name of the GraphQL type
 * @returns Object with wrapped resolvers
 */
export function wrapResolvers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvers: Record<string, any>,
  typeName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapped: Record<string, any> = {}

  for (const [fieldName, resolver] of Object.entries(resolvers)) {
    if (typeof resolver === 'function') {
      wrapped[fieldName] = wrapFieldResolver(resolver, fieldName, typeName)
    } else if (resolver && typeof resolver === 'object' && '__resolveReference' in resolver) {
      // Handle federation reference resolvers
      wrapped[fieldName] = {
        ...resolver,
        __resolveReference: wrapFieldResolver(
          resolver.__resolveReference,
          fieldName,
          typeName
        ),
      }
    } else {
      wrapped[fieldName] = resolver
    }
  }

  return wrapped
}

/**
 * Simple decorator for wrapping a single resolver with tracing
 *
 * @param typeName - Parent type name
 * @param fieldName - Field name
 * @returns Decorator function
 */
export function traceResolver(typeName: string, fieldName: string) {
  return function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    descriptor.value = wrapFieldResolver(originalMethod, fieldName, typeName)
    return descriptor
  }
}

/**
 * Create a span for a specific operation within a resolver
 * Useful for sub-operations like validation, DB queries, external calls
 */
export function createOperationSpan(
  operationName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: Record<string, any>
) {
  try {
    const span = tracer.startSpan(operationName, {
      attributes: {
        'graphql.resolver.operation': operationName,
        ...attributes,
      },
    })
    return span
  } catch (error) {
    console.error('[Field Span Wrapper] Error creating operation span:', error)
    return null
  }
}
