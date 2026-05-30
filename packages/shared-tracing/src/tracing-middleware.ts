import type { NextFunction, Request, Response } from 'express';
import { parseTraceparent, parseTracestate, type TraceContext } from './trace-context';
import { runWithTraceContext } from './context-manager';

declare global {
  namespace Express {
    interface Request {
      traceContext?: TraceContext;
      traceId?: string;
    }
  }
}

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceparentHeader = req.get('traceparent');
  const tracestateHeader = req.get('tracestate');
  const traceContext = parseTraceparent(traceparentHeader);
  const tracestate = parseTracestate(tracestateHeader);

  if (tracestate) {
    traceContext.tracestate = tracestate;
  }

  runWithTraceContext(traceContext, () => {
    req.traceContext = traceContext;
    req.traceId = traceContext.traceId;
    res.set('X-Trace-ID', traceContext.traceId);
    next();
  });
}

export function getRequestTraceContext(req: Request): TraceContext | undefined {
  return req.traceContext;
}

export function getRequestTraceId(req: Request): string | undefined {
  return req.traceId;
}
