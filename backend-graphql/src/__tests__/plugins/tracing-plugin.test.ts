import { trace, type Context as OtelContext } from '@opentelemetry/api';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BuildContext } from '../../types';
import {
  resetTracingPluginTracerForTests,
  setTracingPluginTracerForTests,
  tracingPlugin,
} from '../../plugins/tracing-plugin';

class FakeSpan {
  public readonly ended = { value: false };
  public readonly exceptions: Error[] = [];
  public readonly events: Array<{ name: string; attributes?: Record<string, unknown> }> = [];
  public readonly statuses: Array<{ code: number; message?: string }> = [];
  public readonly attributes: Record<string, unknown>;
  private readonly traceId: string;
  private readonly spanId: string;

  constructor(
    public readonly name: string,
    attributes: Record<string, unknown>,
    traceId: string,
    spanId: string
  ) {
    this.attributes = { ...attributes };
    this.traceId = traceId;
    this.spanId = spanId;
  }

  spanContext() {
    return { traceId: this.traceId, spanId: this.spanId, traceFlags: 1 };
  }

  setAttribute(key: string, value: unknown) {
    this.attributes[key] = value;
    return this;
  }

  setStatus(status: { code: number; message?: string }) {
    this.statuses.push(status);
    return this;
  }

  recordException(error: Error) {
    this.exceptions.push(error);
  }

  addEvent(name: string, attributes?: Record<string, unknown>) {
    this.events.push({ name, attributes });
    return this;
  }

  end() {
    this.ended.value = true;
  }
}

class FakeTracer {
  public readonly startedSpans: Array<{ span: FakeSpan; parent?: string; parentTraceId?: string }> = [];
  private counter = 1;

  startSpan(
    name: string,
    options?: { attributes?: Record<string, unknown> },
    contextArg?: OtelContext
  ) {
    const parentSpan = contextArg ? trace.getSpan(contextArg) : undefined;
    const span = new FakeSpan(
      name,
      options?.attributes ?? {},
      parentSpan?.spanContext().traceId ?? `generated-trace-${this.counter}`,
      `span-${this.counter++}`
    );
    this.startedSpans.push({
      span,
      parent: parentSpan?.spanContext().spanId,
      parentTraceId: parentSpan?.spanContext().traceId,
    });
    return span as never;
  }
}

function createContextValue(): BuildContext {
  return {
    user: { id: 'user-1' },
    prisma: {} as BuildContext['prisma'],
    buildPartLoader: {} as BuildContext['buildPartLoader'],
    buildTestRunLoader: {} as BuildContext['buildTestRunLoader'],
    traceContext: {
      version: '00',
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      parentSpanId: '00f067aa0ba902b7',
      traceFlags: '01',
    },
  };
}

describe('tracingPlugin', () => {
  let tracer: FakeTracer;

  beforeEach(() => {
    tracer = new FakeTracer();
    setTracingPluginTracerForTests(tracer as never);
  });

  afterEach(() => {
    resetTracingPluginTracerForTests();
  });

  it('exposes Apollo request hooks', async () => {
    const hooks = await tracingPlugin.requestDidStart?.({} as never);
    expect(hooks?.didResolveOperation).toBeTypeOf('function');
    expect(hooks?.didEncounterErrors).toBeTypeOf('function');
    expect(hooks?.willSendResponse).toBeTypeOf('function');
  });

  it('creates an operation span and stores tracing state on contextValue', async () => {
    const contextValue = createContextValue();
    const hooks = await tracingPlugin.requestDidStart?.({ contextValue } as never);

    await hooks?.didResolveOperation?.({
      contextValue,
      operationName: 'BuildsQuery',
      operation: { operation: 'query' },
    } as never);

    expect(tracer.startedSpans).toHaveLength(1);
    expect(tracer.startedSpans[0]?.span.name).toBe('graphql.query');
    expect(tracer.startedSpans[0]?.parent).toBe('00f067aa0ba902b7');
    expect(contextValue.otelTracer).toBe(tracer);
    expect(contextValue.otelSpan).toBeDefined();
    expect(contextValue.otelContext).toBeDefined();
  });

  it('ends successful operation spans with OK status', async () => {
    const contextValue = createContextValue();
    const hooks = await tracingPlugin.requestDidStart?.({ contextValue } as never);
    await hooks?.didResolveOperation?.({
      contextValue,
      operationName: 'BuildsQuery',
      operation: { operation: 'query' },
    } as never);

    const span = tracer.startedSpans[0]?.span;
    await hooks?.willSendResponse?.({
      contextValue,
      response: { body: { kind: 'single', singleResult: { data: { ok: true } } } },
    } as never);

    expect(span?.ended.value).toBe(true);
    expect(span?.statuses.at(-1)).toEqual({ code: 1 });
  });

  it('records GraphQL errors on the active span', async () => {
    const contextValue = createContextValue();
    const hooks = await tracingPlugin.requestDidStart?.({ contextValue } as never);
    await hooks?.didResolveOperation?.({
      contextValue,
      operationName: 'BrokenQuery',
      operation: { operation: 'query' },
    } as never);

    const graphQLError = {
      message: 'boom',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
      name: 'GraphQLError',
    } as Error & { extensions: { code: string } };
    await hooks?.didEncounterErrors?.({
      contextValue,
      errors: [graphQLError],
    } as never);

    const span = tracer.startedSpans[0]?.span;
    expect(span?.exceptions).toHaveLength(1);
    expect(span?.events[0]?.name).toBe('graphql.error');
    expect(span?.statuses.at(-1)?.code).toBe(2);
  });

  it('marks responses with execution errors as failed', async () => {
    const contextValue = createContextValue();
    const hooks = await tracingPlugin.requestDidStart?.({ contextValue } as never);
    await hooks?.didResolveOperation?.({
      contextValue,
      operationName: 'BrokenQuery',
      operation: { operation: 'query' },
    } as never);

    const span = tracer.startedSpans[0]?.span;
    await hooks?.willSendResponse?.({
      contextValue,
      response: {
        body: {
          kind: 'single',
          singleResult: { errors: [{ message: 'bad' }] },
        },
      },
    } as never);

    expect(span?.attributes['graphql.response.errors.count']).toBe(1);
    expect(span?.statuses.at(-1)?.code).toBe(2);
    expect(span?.ended.value).toBe(true);
  });
});
