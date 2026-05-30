import {
  SpanStatusCode,
  trace,
  type Context as OtelContext,
  type Tracer,
} from '@opentelemetry/api';
import { getActiveOtelContext, withActiveOtelContext } from './otel-context-store';
import { serializeTraceArgs } from './trace-arg-serializer';

const fallbackTracer = trace.getTracer('apollo-graphql-fields', '1.0.0');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResolverFn = (parent: any, args: any, context: any, info: any) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResolverMap = Record<string, any>;

function getTracer(context: Record<string, unknown>): Tracer | undefined {
  return (context.otelTracer as Tracer | undefined) ?? fallbackTracer;
}

function getParentContext(context: Record<string, unknown>): OtelContext {
  return (context.otelContext as OtelContext | undefined) ?? getActiveOtelContext();
}

export function wrapFieldResolver(resolve: ResolverFn, fieldName: string, typeName: string): ResolverFn {
  return async function wrappedResolver(
    parent: unknown,
    args: unknown,
    context: Record<string, unknown>,
    info: unknown
  ): Promise<unknown> {
    const tracer = getTracer(context ?? {});
    if (!tracer) {
      return resolve(parent, args, context, info);
    }

    const serializedArgs = serializeTraceArgs(args);
    const parentContext = getParentContext(context ?? {});
    const span = tracer.startSpan(
      `graphql.field.${typeName}.${fieldName}`,
      {
        attributes: {
          'graphql.field.name': fieldName,
          'graphql.type.name': typeName,
          'graphql.args': serializedArgs.serialized,
          'graphql.args.redacted': serializedArgs.redacted,
          'graphql.args.truncated': serializedArgs.truncated,
        },
      },
      parentContext
    );
    const spanContext = trace.setSpan(parentContext, span);
    const previousContext = context?.otelContext as OtelContext | undefined;

    try {
      return await withActiveOtelContext(spanContext, async () => {
        if (context) {
          context.otelContext = spanContext;
        }

        const result = await resolve(parent, args, context, info);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'ERROR' });
      throw error;
    } finally {
      if (context) {
        context.otelContext = previousContext;
      }
      span.end();
    }
  };
}

export function wrapResolvers(resolvers: ResolverMap, typeName: string): ResolverMap {
  const wrapped: ResolverMap = {};

  for (const [fieldName, resolver] of Object.entries(resolvers)) {
    if (typeof resolver === 'function') {
      wrapped[fieldName] = wrapFieldResolver(resolver, fieldName, typeName);
      continue;
    }

    if (resolver && typeof resolver === 'object' && '__resolveReference' in resolver) {
      const referenceResolver = resolver.__resolveReference;
      wrapped[fieldName] = {
        ...resolver,
        __resolveReference:
          typeof referenceResolver === 'function'
            ? wrapFieldResolver(referenceResolver, fieldName, typeName)
            : referenceResolver,
      };
      continue;
    }

    wrapped[fieldName] = resolver;
  }

  return wrapped;
}

export function traceResolver(typeName: string, fieldName: string) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as ResolverFn;
    descriptor.value = wrapFieldResolver(originalMethod, fieldName, typeName);
    return descriptor;
  };
}

export function createOperationSpan(
  operationName: string,
  attributes?: Record<string, string | number | boolean | undefined>
) {
  try {
    return fallbackTracer.startSpan(operationName, {
      attributes: {
        'graphql.resolver.operation': operationName,
        ...attributes,
      },
    });
  } catch (error) {
    console.error('[Field Span Wrapper] Error creating operation span:', error);
    return null;
  }
}
