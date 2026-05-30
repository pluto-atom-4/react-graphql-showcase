import type DataLoader from 'dataloader';
import type { Part, PrismaClient, TestRun } from '@prisma/client';
import type { Context as OtelContext, Span, Tracer } from '@opentelemetry/api';
import type { TraceContext } from '@repo/shared-tracing';
import type { AuthUser } from './middleware/auth';

export interface BuildContext {
  user: AuthUser | null;
  prisma: PrismaClient;
  buildPartLoader: DataLoader<string, Part[]>;
  buildTestRunLoader: DataLoader<string, TestRun[]>;
  traceContext?: TraceContext;
  otelSpan?: Span;
  otelTracer?: Tracer;
  otelContext?: OtelContext;
}

export type GraphQLContext = BuildContext;

export interface BuildParent {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationArgs {
  limit: number;
  offset: number;
}
