import { ROOT_CONTEXT, trace, type Context as OtelContext } from '@opentelemetry/api';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createPrismaSpan,
  getPrismaTraceContext,
  resetPrismaTracerForTests,
  setPrismaTracerForTests,
  withPrismaSpan,
  withPrismaTransaction,
} from '../../lib/prisma-span-bridge';
import { withActiveOtelContext } from '../../lib/otel-context-store';

class FakeSpan {
  public readonly ended = { value: false };
  public readonly exceptions: Error[] = [];
  public readonly events: Array<{ name: string; attributes?: Record<string, unknown> }> = [];
  public readonly statuses: Array<{ code: number; message?: string }> = [];
  public readonly attributes: Record<string, unknown>;

  constructor(
    public readonly name: string,
    attributes: Record<string, unknown>,
    private readonly traceId: string,
    private readonly spanId: string
  ) {
    this.attributes = { ...attributes };
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
      parentSpan?.spanContext().traceId ?? `trace-${this.counter}`,
      `db-span-${this.counter++}`
    );
    this.startedSpans.push({
      span,
      parent: parentSpan?.spanContext().spanId,
      parentTraceId: parentSpan?.spanContext().traceId,
    });
    return span as never;
  }
}

describe('prisma-span-bridge', () => {
  let tracer: FakeTracer;

  beforeEach(() => {
    tracer = new FakeTracer();
    setPrismaTracerForTests(tracer as never);
  });

  afterEach(() => {
    resetPrismaTracerForTests();
  });

  it('wraps Prisma queries and returns results', async () => {
    const result = await withPrismaSpan('Build.findMany', async () => ['build-1']);

    expect(result).toEqual(['build-1']);
    expect(tracer.startedSpans[0]?.span.name).toBe('db.prisma.query');
    expect(tracer.startedSpans[0]?.span.attributes['db.query.name']).toBe('Build.findMany');
    expect(tracer.startedSpans[0]?.span.events[0]?.name).toBe('db.query.complete');
  });

  it('records errors on failed Prisma queries', async () => {
    await expect(
      withPrismaSpan('Build.findMany', async () => {
        throw new Error('db broke');
      })
    ).rejects.toThrow('db broke');

    const span = tracer.startedSpans[0]?.span;
    expect(span?.exceptions).toHaveLength(1);
    expect(span?.events[0]?.name).toBe('db.error');
    expect(span?.statuses.at(-1)?.code).toBe(2);
  });

  it('records commit events for successful transactions', async () => {
    await withPrismaTransaction('Mutation.createBuild', async () => 'ok');

    const span = tracer.startedSpans[0]?.span;
    expect(span?.events.map((event) => event.name)).toContain('db.transaction.commit');
    expect(span?.ended.value).toBe(true);
  });

  it('records rollback events for failed transactions', async () => {
    await expect(
      withPrismaTransaction('Mutation.createBuild', async () => {
        throw new Error('rollback');
      })
    ).rejects.toThrow('rollback');

    const span = tracer.startedSpans[0]?.span;
    expect(span?.events.map((event) => event.name)).toContain('db.transaction.rollback');
    expect(span?.statuses.at(-1)?.code).toBe(2);
  });

  it('inherits the active parent span from OpenTelemetry context', async () => {
    const parentSpan = new FakeSpan('parent', {}, 'trace-parent', 'parent-span');
    await withActiveOtelContext(trace.setSpan(ROOT_CONTEXT, parentSpan as never), async () => {
      const contextValue = getPrismaTraceContext();
      expect(contextValue.span?.spanContext().spanId).toBe('parent-span');
      await withPrismaSpan('Build.findUnique', async () => 'ok');
    });

    expect(tracer.startedSpans[0]?.parent).toBe('parent-span');
    expect(createPrismaSpan('query', { test: true })?.spanContext().traceId).toBeDefined();
  });
});
