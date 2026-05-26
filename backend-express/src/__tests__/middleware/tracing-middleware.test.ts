/**
 * Unit Tests for Express Tracing Middleware
 * Tests W3C header extraction and context propagation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Request, Response } from 'express'
import { tracingMiddleware, getRequestTraceContext, getRequestTraceId } from '../../middleware/tracing-middleware'

interface MockRequest extends Partial<Request> {
  traceparentHeader?: string
  tracestateHeader?: string
}

interface MockResponse extends Partial<Response> {
  headerSet?: Record<string, string>
}

describe('tracing-middleware', () => {
  let mockReq: MockRequest
  let mockRes: MockResponse
  let nextCalled: boolean
  let nextFn: () => void

  beforeEach(() => {
    nextCalled = false
    nextFn = () => {
      nextCalled = true
    }

    mockReq = {
      get: (header: string) => {
        const lowerHeader = header.toLowerCase()
        if (lowerHeader === 'traceparent') return mockReq.traceparentHeader
        if (lowerHeader === 'tracestate') return mockReq.tracestateHeader
        return undefined
      },
      on: ((_event: string, _callback?: () => void) => {
        // Do nothing in tests
        return mockReq
      }) as unknown as Request['on'],
      traceparentHeader: undefined,
      tracestateHeader: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    mockRes = {
      setHeader: (header: string, value: string) => {
        if (!mockRes.headerSet) {
          mockRes.headerSet = {}
        }
        mockRes.headerSet[header] = value
        return mockRes
      },
      set: (header: string, value: string) => {
        if (!mockRes.headerSet) {
          mockRes.headerSet = {}
        }
        mockRes.headerSet[header] = value
        return mockRes
      },
      headerSet: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  })

  describe('tracingMiddleware', () => {
    it('should extract valid traceparent header', () => {
      const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      mockReq.traceparentHeader = traceparent

      tracingMiddleware(mockReq as Request, mockRes as Response, nextFn)

      expect(nextCalled).toBe(true)
      expect(mockReq.traceContext).toBeDefined()
      expect(mockReq.traceContext?.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
      expect(mockReq.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
    })

    it('should generate new trace ID if header is missing', () => {
      tracingMiddleware(mockReq as Request, mockRes as Response, nextFn)

      expect(nextCalled).toBe(true)
      expect(mockReq.traceContext).toBeDefined()
      expect(mockReq.traceContext?.traceId).toMatch(/^[0-9a-f]{32}$/)
      expect(mockReq.traceId).toMatch(/^[0-9a-f]{32}$/)
    })

    it('should generate new trace ID if header is invalid format', () => {
      mockReq.traceparentHeader = 'invalid-format'

      tracingMiddleware(mockReq as Request, mockRes as Response, nextFn)

      expect(nextCalled).toBe(true)
      expect(mockReq.traceContext?.traceId).toMatch(/^[0-9a-f]{32}$/)
    })

    it('should extract tracestate header', () => {
      const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      const tracestate = 'vendor1=value1,vendor2=value2'
      mockReq.traceparentHeader = traceparent
      mockReq.tracestateHeader = tracestate

      tracingMiddleware(mockReq as Request, mockRes as Response, nextFn)

      expect(mockReq.traceContext?.tracestate).toBe(tracestate)
    })

    it('should not include tracestate if missing', () => {
      const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      mockReq.traceparentHeader = traceparent

      tracingMiddleware(mockReq as Request, mockRes as Response, nextFn)

      expect(mockReq.traceContext?.tracestate).toBeUndefined()
    })

    it('should call next middleware', () => {
      tracingMiddleware(mockReq as Request, mockRes as Response, nextFn)

      expect(nextCalled).toBe(true)
    })

    it('should set X-Trace-ID response header', () => {
      tracingMiddleware(mockReq as Request, mockRes as Response, nextFn)

      const traceIdHeader = mockRes.headerSet?.['X-Trace-ID']
      expect(traceIdHeader).toBeDefined()
      expect(traceIdHeader).toMatch(/^[0-9a-f]{32}$/)
    })

    it('should handle multiple calls with different trace IDs', () => {
      const traceIds = new Set()

      for (let i = 0; i < 5; i++) {
        const req = { ...mockReq }
        tracingMiddleware(req as Request, mockRes as Response, nextFn)
        traceIds.add(req.traceId)
      }

      expect(traceIds.size).toBe(5)
    })
  })

  describe('getRequestTraceContext', () => {
    it('should return trace context from request', () => {
      mockReq.traceContext = {
        version: '00',
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        parentSpanId: '00f067aa0ba902b7',
        traceFlags: '01',
      }

      const context = getRequestTraceContext(mockReq as Request)

      expect(context).toEqual(mockReq.traceContext)
    })

    it('should return undefined if no trace context', () => {
      const context = getRequestTraceContext(mockReq as Request)

      expect(context).toBeUndefined()
    })
  })

  describe('getRequestTraceId', () => {
    it('should return trace ID from request', () => {
      mockReq.traceId = '4bf92f3577b34da6a3ce929d0e0e4736'

      const traceId = getRequestTraceId(mockReq as Request)

      expect(traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
    })

    it('should return undefined if no trace ID', () => {
      const traceId = getRequestTraceId(mockReq as Request)

      expect(traceId).toBeUndefined()
    })
  })
})
