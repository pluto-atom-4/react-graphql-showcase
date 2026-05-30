import {
  context as otelContext,
  SpanStatusCode,
  trace,
  type Context as OtelContext,
  type SpanContext,
  type Tracer,
} from '@opentelemetry/api';
import type { ApolloServerPlugin } from '@apollo/server';
import { getTraceContext } from '@repo/shared-tracing';
import type { BuildContext } from '../types';

const TRACER_NAME = 'apollo-graphql';

let pluginTracer: Tracer = trace.getTracer(TRACER_NAME, '1.0.0');

export function setTracingPluginTracerForTests(tracer: Tracer): void {
  pluginTracer = tracer;
}

export function resetTracingPluginTracerForTests(): void {
  pluginTracer = trace.getTracer(TRACER_NAME, '1.0.0');
}

function buildRemoteParentContext(traceContext: BuildContext['traceContext'] | undefined): OtelContext {
  if (!traceContext) {
    return otelContext.active();
  }

  const parentSpanContext: SpanContext = {
    traceId: traceContext.traceId,
    spanId: traceContext.parentSpanId,
    traceFlags: parseInt(traceContext.traceFlags, 16),
    isRemote: true,
  };

  return trace.setSpan(otelContext.active(), trace.wrapSpanContext(parentSpanContext));
}

export const tracingPlugin: ApolloServerPlugin<BuildContext> = {
  async requestDidStart() {
    return {
      async didResolveOperation(requestContext) {
        try {
          const traceContext = requestContext.contextValue.traceContext ?? getTraceContext();
          const parentContext = buildRemoteParentContext(traceContext);
          const operationType = requestContext.operation?.operation ?? 'unknown';
          const operationName =
            requestContext.operationName ?? requestContext.operation?.name?.value ?? 'anonymous';
          const span = pluginTracer.startSpan(
            `graphql.${operationType}`,
            {
              attributes: {
                'graphql.operation.name': operationName,
                'graphql.operation.type': operationType,
                'trace.id': traceContext?.traceId ?? 'unknown',
                'trace.parent_span_id': traceContext?.parentSpanId ?? 'unknown',
                'trace.flags': traceContext?.traceFlags ?? '00',
              },
            },
            parentContext
          );
          const activeContext = trace.setSpan(parentContext, span);

          requestContext.contextValue.traceContext = traceContext ?? requestContext.contextValue.traceContext;
          requestContext.contextValue.otelTracer = pluginTracer;
          requestContext.contextValue.otelSpan = span;
          requestContext.contextValue.otelContext = activeContext;
        } catch (error) {
          console.error('[Tracing Plugin] Error in didResolveOperation:', error);
        }
      },

      async didEncounterErrors(requestContext) {
        try {
          const span = requestContext.contextValue.otelSpan;
          if (!span || !requestContext.errors.length) {
            return;
          }

          for (const [index, error] of requestContext.errors.entries()) {
            span.recordException(error);
            span.addEvent('graphql.error', {
              'error.index': index,
              'error.message': error.message,
              'error.type': String(error.extensions?.code ?? 'UNKNOWN'),
            });
          }

          span.setStatus({ code: SpanStatusCode.ERROR });
        } catch (error) {
          console.error('[Tracing Plugin] Error in didEncounterErrors:', error);
        }
      },

      async willSendResponse(requestContext) {
        try {
          const span = requestContext.contextValue.otelSpan;
          if (!span) {
            return;
          }

          if (requestContext.response.body.kind === 'single' && requestContext.response.body.singleResult.errors?.length) {
            span.setAttribute(
              'graphql.response.errors.count',
              requestContext.response.body.singleResult.errors.length
            );
            span.setStatus({ code: SpanStatusCode.ERROR });
          } else {
            span.setStatus({ code: SpanStatusCode.OK });
          }

          span.end();
        } catch (error) {
          console.error('[Tracing Plugin] Error in willSendResponse:', error);
        }
      },
    };
  },
};

export function createResolverSpan(
  operationName: string,
  attributes?: Record<string, string | number | boolean | undefined>
) {
  try {
    return pluginTracer.startSpan(operationName, {
      attributes: {
        'graphql.resolver.operation': operationName,
        ...attributes,
      },
    });
  } catch (error) {
    console.error('[Tracing Plugin] Error creating resolver span:', error);
    return null;
  }
}
