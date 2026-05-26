/**
 * Express Middleware for W3C Trace Context
 * Extracts traceparent and tracestate headers from incoming requests
 * Propagates trace context through request lifecycle
 */

import { Request, Response, NextFunction } from 'express'
import {
  parseTraceparent,
  parseTracestate,
  type TraceContext,
} from '../lib/trace-context'
import { runWithTraceContext } from '../lib/context-manager'

/**
 * Extend Express Request with trace context
 */
declare global {
  namespace Express {
    interface Request {
      traceContext?: TraceContext
      traceId?: string
    }
  }
}

/**
 * Express middleware for W3C trace context extraction
 * Must be registered early in middleware chain to capture all requests
 *
 * Flow:
 * 1. Extract traceparent header (or generate new trace ID if missing)
 * 2. Parse traceparent into TraceContext
 * 3. Extract tracestate header (vendor-specific data)
 * 4. Store context in AsyncLocalStorage for request lifetime
 * 5. Attach context to Express Request object
 * 6. Pass control to next middleware
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
export function tracingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract W3C headers from request
  const traceparentHeader = req.get('traceparent')
  const tracestateHeader = req.get('tracestate')

  // Parse traceparent (generates new if missing/invalid)
  const traceContext = parseTraceparent(traceparentHeader)

  // Parse tracestate (optional vendor-specific data)
  const tracestate = parseTracestate(tracestateHeader)
  if (tracestate) {
    traceContext.tracestate = tracestate
  }

  // Store trace context in AsyncLocalStorage for request lifetime
  // All async operations in this request will have access to context
  runWithTraceContext(traceContext, () => {
    // Attach trace context to request object for direct access
    req.traceContext = traceContext
    req.traceId = traceContext.traceId

    // Add trace ID to response headers for client reference
    res.set('X-Trace-ID', traceContext.traceId)

    // Call next middleware
    // Context remains available throughout request lifecycle
    next()
  })
}

/**
 * Helper to extract trace context from request
 * Useful in route handlers to access trace context
 *
 * @param req - Express request object
 * @returns TraceContext from request or undefined
 */
export function getRequestTraceContext(req: Request): TraceContext | undefined {
  return req.traceContext
}

/**
 * Helper to get trace ID from request
 * Useful for logging and error reporting
 *
 * @param req - Express request object
 * @returns Trace ID string or undefined
 */
export function getRequestTraceId(req: Request): string | undefined {
  return req.traceId
}
