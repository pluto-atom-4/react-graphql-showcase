import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { trace, type Context as OtelContext } from '@opentelemetry/api';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseTraceparent, tracingMiddleware } from '@repo/shared-tracing';
import { createLoaders } from '../../dataloaders';
import {
  resetPrismaTracerForTests,
  setPrismaTracerForTests,
} from '../../lib/prisma-span-bridge';
import {
  resetTracingPluginTracerForTests,
  setTracingPluginTracerForTests,
  tracingPlugin,
} from '../../plugins/tracing-plugin';
import { buildResolver } from '../../resolvers/Build';
import { mutationResolver } from '../../resolvers/Mutation';
import { queryResolver } from '../../resolvers/Query';
import type { BuildContext } from '../../types';

vi.mock('../../services/event-bus', () => ({
  emitEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
  },
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const typeDefs = fs.readFileSync(path.join(__dirname, '../../schema.graphql'), 'utf-8');

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

function createFakePrisma() {
  const builds = [
    {
      id: 'build-1',
      name: 'Build One',
      description: 'First build',
      status: 'PENDING',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      id: 'build-2',
      name: 'Build Two',
      description: 'Second build',
      status: 'RUNNING',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
  ];
  const parts = [
    {
      id: 'part-1',
      buildId: 'build-1',
      name: 'Panel',
      sku: 'P-1',
      quantity: 2,
      createdAt: new Date('2026-01-03T00:00:00.000Z'),
    },
    {
      id: 'part-2',
      buildId: 'build-2',
      name: 'Bolt',
      sku: 'B-2',
      quantity: 4,
      createdAt: new Date('2026-01-04T00:00:00.000Z'),
    },
  ];
  const testRuns = [
    {
      id: 'test-1',
      buildId: 'build-1',
      status: 'PASSED',
      result: 'OK',
      fileUrl: null,
      completedAt: new Date('2026-01-05T00:00:00.000Z'),
      createdAt: new Date('2026-01-05T00:00:00.000Z'),
      updatedAt: new Date('2026-01-05T00:00:00.000Z'),
    },
  ];
  const user = {
    id: 'user-1',
    email: 'engineer@example.com',
    passwordHash: 'hashed',
  };

  return {
    build: {
      count: vi.fn(async () => builds.length),
      findMany: vi.fn(async ({ take, skip }) => builds.slice(skip, skip + take)),
      findUnique: vi.fn(async ({ where: { id } }) => builds.find((build) => build.id === id) ?? null),
      create: vi.fn(async ({ data }) => ({
        id: 'build-3',
        name: data.name,
        description: data.description ?? null,
        status: 'PENDING',
        createdAt: new Date('2026-01-06T00:00:00.000Z'),
        updatedAt: new Date('2026-01-06T00:00:00.000Z'),
      })),
      update: vi.fn(async ({ where: { id }, data }) => ({
        ...(builds.find((build) => build.id === id) ?? builds[0]),
        status: data.status,
        updatedAt: new Date('2026-01-07T00:00:00.000Z'),
      })),
    },
    part: {
      findMany: vi.fn(async ({ where: { buildId } }) =>
        parts.filter((part) => buildId.in.includes(part.buildId))
      ),
      create: vi.fn(async ({ data }) => ({
        id: 'part-3',
        ...data,
        createdAt: new Date('2026-01-06T00:00:00.000Z'),
      })),
    },
    testRun: {
      findMany: vi.fn(async ({ where: { buildId } }) =>
        testRuns.filter((testRun) => buildId.in.includes(testRun.buildId))
      ),
      create: vi.fn(async ({ data }) => ({
        id: 'test-2',
        ...data,
        createdAt: new Date('2026-01-06T00:00:00.000Z'),
        updatedAt: new Date('2026-01-06T00:00:00.000Z'),
      })),
    },
    user: {
      findUnique: vi.fn(async ({ where: { email } }) => (email === user.email ? user : null)),
    },
  };
}

async function createTestHttpServer(tracer: FakeTracer) {
  const prisma = createFakePrisma();
  const server = new ApolloServer<BuildContext>({
    typeDefs,
    resolvers: [queryResolver, mutationResolver, buildResolver],
    plugins: [tracingPlugin],
  });
  await server.start();

  const app = express();
  app.use(
    '/graphql',
    tracingMiddleware,
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const loaders = createLoaders(prisma as never);
        return {
          user: { id: 'user-1' },
          prisma: prisma as never,
          buildPartLoader: loaders.buildPartLoader,
          buildTestRunLoader: loaders.buildTestRunLoader,
          traceContext: req.traceContext ?? parseTraceparent(req.get('traceparent')),
          otelTracer: tracer as never,
        };
      },
    })
  );

  const listener = await new Promise<import('http').Server>((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started));
  });

  return { server, listener };
}

async function postGraphQL(
  port: number,
  query: string,
  traceparent?: string,
  variables?: Record<string, unknown>
) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (traceparent) {
    headers.traceparent = traceparent;
  }

  const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  return response.json() as Promise<Record<string, unknown>>;
}

describe('graphql tracing integration', () => {
  let tracer: FakeTracer;
  const listeners: import('http').Server[] = [];
  const servers: ApolloServer<BuildContext>[] = [];

  beforeEach(() => {
    tracer = new FakeTracer();
    setTracingPluginTracerForTests(tracer as never);
    setPrismaTracerForTests(tracer as never);
  });

  afterEach(async () => {
    resetTracingPluginTracerForTests();
    resetPrismaTracerForTests();
    await Promise.all(
      listeners.map(
        (listener) =>
          new Promise<void>((resolve, reject) => {
            listener.close((error) => (error ? reject(error) : resolve()));
          })
      )
    );
    listeners.length = 0;
    await Promise.all(servers.map((server) => server.stop()));
    servers.length = 0;
  });

  it('propagates traceparent into the GraphQL operation span', async () => {
    const { server, listener } = await createTestHttpServer(tracer);
    servers.push(server);
    listeners.push(listener);
    const port = (listener.address() as import('net').AddressInfo).port;
    const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

    const response = await postGraphQL(port, 'query { builds(limit: 2, offset: 0) { totalCount } }', traceparent);

    expect(response.errors).toBeUndefined();
    const operationSpan = tracer.startedSpans.find(({ span }) => span.name === 'graphql.query')?.span;
    expect(operationSpan?.spanContext().traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(operationSpan?.attributes['trace.id']).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
  });

  it('creates hierarchical operation, field, and Prisma spans for nested queries', async () => {
    const { server, listener } = await createTestHttpServer(tracer);
    servers.push(server);
    listeners.push(listener);
    const port = (listener.address() as import('net').AddressInfo).port;

    const response = await postGraphQL(
      port,
      'query { builds(limit: 2, offset: 0) { items { id parts { id } testRuns { id } } totalCount } }',
      '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01'
    );

    expect(response.errors).toBeUndefined();
    const operation = tracer.startedSpans.find(({ span }) => span.name === 'graphql.query');
    const queryField = tracer.startedSpans.find(({ span }) => span.name === 'graphql.field.Query.builds');
    const partsField = tracer.startedSpans.find(({ span }) => span.name === 'graphql.field.Build.parts');
    const partQuery = tracer.startedSpans.find(({ span }) => span.attributes['db.query.name'] === 'DataLoader.Part.findMany');

    expect(queryField?.parent).toBe(operation?.span.spanContext().spanId);
    expect(partsField?.parentTraceId).toBe(operation?.span.spanContext().traceId);
    expect(partQuery?.parent).toBe(partsField?.span.spanContext().spanId);
  });

  it('redacts sensitive resolver args for login mutations', async () => {
    const { server, listener } = await createTestHttpServer(tracer);
    servers.push(server);
    listeners.push(listener);
    const port = (listener.address() as import('net').AddressInfo).port;

    const response = await postGraphQL(
      port,
      'mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id } } }',
      '00-cccccccccccccccccccccccccccccccc-dddddddddddddddd-01',
      { email: 'engineer@example.com', password: 'super-secret' }
    );

    expect(response.errors).toBeUndefined();
    const loginField = tracer.startedSpans.find(({ span }) => span.name === 'graphql.field.Mutation.login')?.span;
    expect(String(loginField?.attributes['graphql.args'])).toContain('[REDACTED]');
    expect(String(loginField?.attributes['graphql.args'])).not.toContain('super-secret');
    expect(loginField?.attributes['graphql.args.redacted']).toBe(true);
  });

  it('keeps concurrent requests isolated by trace id', async () => {
    const { server, listener } = await createTestHttpServer(tracer);
    servers.push(server);
    listeners.push(listener);
    const port = (listener.address() as import('net').AddressInfo).port;

    await Promise.all([
      postGraphQL(port, 'query { builds(limit: 1, offset: 0) { totalCount } }', '00-11111111111111111111111111111111-aaaaaaaaaaaaaaaa-01'),
      postGraphQL(port, 'query { builds(limit: 1, offset: 0) { totalCount } }', '00-22222222222222222222222222222222-bbbbbbbbbbbbbbbb-01'),
    ]);

    const operationTraceIds = tracer.startedSpans
      .filter(({ span }) => span.name === 'graphql.query')
      .map(({ span }) => span.spanContext().traceId);

    expect(operationTraceIds).toEqual(
      expect.arrayContaining([
        '11111111111111111111111111111111',
        '22222222222222222222222222222222',
      ])
    );
  });

  it('gracefully handles requests without traceparent headers', async () => {
    const { server, listener } = await createTestHttpServer(tracer);
    servers.push(server);
    listeners.push(listener);
    const port = (listener.address() as import('net').AddressInfo).port;

    const response = await postGraphQL(port, 'query { builds(limit: 1, offset: 0) { totalCount } }');

    expect(response.errors).toBeUndefined();
    const operationSpan = tracer.startedSpans.find(({ span }) => span.name === 'graphql.query')?.span;
    expect(operationSpan?.spanContext().traceId).toBeTruthy();
  });
});
