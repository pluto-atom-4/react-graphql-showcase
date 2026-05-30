import {
  SpanStatusCode,
  trace,
  type Context as OtelContext,
  type Span,
  type Tracer,
} from '@opentelemetry/api';
import { getActiveOtelContext, withActiveOtelContext } from './otel-context-store';

const TRACER_NAME = 'prisma-otel-bridge';

let prismaTracer: Tracer = trace.getTracer(TRACER_NAME, '1.0.0');

type SpanAttributes = Record<string, string | number | boolean | undefined>;

export function setPrismaTracerForTests(tracer: Tracer): void {
  prismaTracer = tracer;
}

export function resetPrismaTracerForTests(): void {
  prismaTracer = trace.getTracer(TRACER_NAME, '1.0.0');
}

export function getPrismaTraceContext(): { span: Span | undefined; tracer: Tracer } {
  return {
    span: trace.getSpan(getActiveOtelContext()) ?? undefined,
    tracer: prismaTracer,
  };
}

export function createPrismaSpan(
  operation: string,
  metadata?: SpanAttributes,
  parentContext: OtelContext = getActiveOtelContext()
): Span | null {
  try {
    return prismaTracer.startSpan(
      `db.prisma.${operation}`,
      {
        attributes: {
          'db.system': 'postgresql',
          'db.operation': operation,
          'db.engine': 'prisma',
          ...metadata,
        },
      },
      parentContext
    );
  } catch (error) {
    console.error('[Prisma Bridge] Error creating Prisma span:', error);
    return null;
  }
}

export async function withPrismaSpan<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: SpanAttributes
): Promise<T> {
  const parentContext = getActiveOtelContext();
  const span = createPrismaSpan(
    'query',
    {
      'db.query.name': queryName,
      ...metadata,
    },
    parentContext
  );

  if (!span) {
    return queryFn();
  }

  const spanContext = trace.setSpan(parentContext, span);
  const startTime = Date.now();

  try {
    return await withActiveOtelContext(spanContext, async () => {
      const result = await queryFn();
      span.addEvent('db.query.complete', {
        duration_ms: Date.now() - startTime,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    });
  } catch (error) {
    recordPrismaError(span, error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'ERROR' });
    throw error;
  } finally {
    span.end();
  }
}

export async function withPrismaTransaction<T>(txName: string, txFn: () => Promise<T>): Promise<T> {
  const parentContext = getActiveOtelContext();
  const span = createPrismaSpan(
    'transaction',
    {
      'db.transaction.name': txName,
    },
    parentContext
  );

  if (!span) {
    return txFn();
  }

  const spanContext = trace.setSpan(parentContext, span);

  try {
    return await withActiveOtelContext(spanContext, async () => {
      const result = await txFn();
      span.addEvent('db.transaction.commit');
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    });
  } catch (error) {
    recordPrismaError(span, error as Error);
    span.addEvent('db.transaction.rollback');
    span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'ERROR' });
    throw error;
  } finally {
    span.end();
  }
}

export function recordPrismaError(span: Span | null | undefined, error: Error): void {
  if (!span) {
    return;
  }

  span.recordException(error);
  span.addEvent('db.error', {
    'error.message': error.message,
    'error.type': error.name,
  });
}

export function tracePrismaOperation(modelName: string, operationName: string) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      return withPrismaSpan(`${modelName}.${operationName}`, async () => originalMethod.apply(this, args), {
        'db.model': modelName,
        'db.operation.name': operationName,
      });
    };

    return descriptor;
  };
}

export function getPrismaQueryInfo(event: { query: string; params: string; duration: number; target: string }) {
  return {
    query: event.query,
    params: event.params,
    duration: event.duration,
    target: event.target,
  };
}
