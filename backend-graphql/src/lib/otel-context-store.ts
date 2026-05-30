import { AsyncLocalStorage } from 'async_hooks';
import { context as otelContext, type Context as OtelContext } from '@opentelemetry/api';

const otelContextStorage = new AsyncLocalStorage<OtelContext>();

export function getActiveOtelContext(): OtelContext {
  return otelContextStorage.getStore() ?? otelContext.active();
}

export function withActiveOtelContext<T>(context: OtelContext, callback: () => T): T {
  return otelContextStorage.run(context, callback);
}
