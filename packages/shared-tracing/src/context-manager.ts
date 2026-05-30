import { AsyncLocalStorage } from 'async_hooks';
import type { TraceContext } from './trace-context';

const traceContextStorage = new AsyncLocalStorage<TraceContext>();

export function getTraceContext(): TraceContext | undefined {
  return traceContextStorage.getStore();
}

export function setTraceContext(context: TraceContext): void {
  traceContextStorage.enterWith(context);
}

export function runWithTraceContext<T>(context: TraceContext, callback: () => T): T {
  return traceContextStorage.run(context, callback);
}

export function clearTraceContext(): void {}

export function getOrCreateTraceContext(fallback?: TraceContext): TraceContext {
  const existing = getTraceContext();
  if (existing) {
    return existing;
  }

  if (fallback) {
    setTraceContext(fallback);
    return fallback;
  }

  throw new Error('No trace context available');
}

export function hasTraceContext(): boolean {
  return getTraceContext() !== undefined;
}
