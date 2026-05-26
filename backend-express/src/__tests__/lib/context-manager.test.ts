/**
 * Unit Tests for AsyncLocalStorage Context Manager
 * Tests context isolation, storage, and retrieval
 */

import { describe, it, expect } from 'vitest'
import {
  getTraceContext,
  setTraceContext,
  runWithTraceContext,
  clearTraceContext,
  getOrCreateTraceContext,
  hasTraceContext,
} from '../../lib/context-manager'
import type { TraceContext } from '../../lib/trace-context'

describe('context-manager', () => {
  const mockContext: TraceContext = {
    version: '00',
    traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
    parentSpanId: '00f067aa0ba902b7',
    traceFlags: '01',
  }

  const mockContext2: TraceContext = {
    version: '00',
    traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1',
    parentSpanId: 'bbbbbbbbbbbbbbbb',
    traceFlags: '01',
  }

  describe('getTraceContext', () => {
    it('should return undefined if no context is set', () => {
      const context = getTraceContext()

      expect(context).toBeUndefined()
    })

    it('should return context if set', () => {
      setTraceContext(mockContext)
      const context = getTraceContext()

      expect(context).toEqual(mockContext)
    })
  })

  describe('setTraceContext', () => {
    it('should set trace context', () => {
      setTraceContext(mockContext)
      const context = getTraceContext()

      expect(context).toEqual(mockContext)
    })

    it('should replace existing context', () => {
      setTraceContext(mockContext)
      setTraceContext(mockContext2)
      const context = getTraceContext()

      expect(context).toEqual(mockContext2)
      expect(context?.traceId).toBe(mockContext2.traceId)
    })
  })

  describe('runWithTraceContext', () => {
    it('should run callback within trace context', () => {
      let capturedContext: TraceContext | undefined

      runWithTraceContext(mockContext, () => {
        capturedContext = getTraceContext()
      })

      expect(capturedContext).toEqual(mockContext)
    })

    it('should return callback result', () => {
      const result = runWithTraceContext(mockContext, () => {
        return 'test-result'
      })

      expect(result).toBe('test-result')
    })

    it('should support nested contexts', () => {
      const results: TraceContext[] = []

      runWithTraceContext(mockContext, () => {
        results.push(getTraceContext()!)

        runWithTraceContext(mockContext2, () => {
          results.push(getTraceContext()!)
        })

        results.push(getTraceContext()!)
      })

      expect(results).toHaveLength(3)
      expect(results[0].traceId).toBe(mockContext.traceId)
      expect(results[1].traceId).toBe(mockContext2.traceId)
      expect(results[2].traceId).toBe(mockContext.traceId)
    })

    it('should isolate contexts between concurrent calls', async () => {
      const results: (TraceContext | undefined)[] = []

      await Promise.all([
        Promise.resolve().then(() => {
          runWithTraceContext(mockContext, () => {
            results.push(getTraceContext())
          })
        }),
        Promise.resolve().then(() => {
          runWithTraceContext(mockContext2, () => {
            results.push(getTraceContext())
          })
        }),
      ])

      expect(results).toHaveLength(2)
      expect(results).toContainEqual(
        expect.objectContaining({ traceId: mockContext.traceId })
      )
      expect(results).toContainEqual(
        expect.objectContaining({ traceId: mockContext2.traceId })
      )
    })

    it('should propagate context to async operations', async () => {
      let capturedContext: TraceContext | undefined

      await runWithTraceContext(mockContext, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        capturedContext = getTraceContext()
      })

      expect(capturedContext).toEqual(mockContext)
    })

    it('should handle errors and preserve context', () => {
      let capturedContext: TraceContext | undefined
      let errorCaught = false

      try {
        runWithTraceContext(mockContext, () => {
          capturedContext = getTraceContext()
          throw new Error('test error')
        })
      } catch (error) {
        errorCaught = !!error
      }

      expect(errorCaught).toBe(true)
      expect(capturedContext).toEqual(mockContext)
    })
  })

  describe('clearTraceContext', () => {
    it('should be callable without errors', () => {
      setTraceContext(mockContext)
      expect(() => clearTraceContext()).not.toThrow()
    })
  })

  describe('getOrCreateTraceContext', () => {
    it('should return existing context', () => {
      setTraceContext(mockContext)
      const context = getOrCreateTraceContext()

      expect(context).toEqual(mockContext)
    })

    it('should use fallback if no existing context', () => {
      const context = getOrCreateTraceContext(mockContext2)

      expect(context).toEqual(mockContext2)
    })

    it('should throw if no existing context and no fallback', () => {
      expect(() => getOrCreateTraceContext()).toThrow(
        'No trace context available'
      )
    })
  })

  describe('hasTraceContext', () => {
    it('should return false if no context set', () => {
      expect(hasTraceContext()).toBe(false)
    })

    it('should return true if context is set', () => {
      setTraceContext(mockContext)
      expect(hasTraceContext()).toBe(true)
    })

    it('should work within runWithTraceContext', () => {
      runWithTraceContext(mockContext, () => {
        expect(hasTraceContext()).toBe(true)
      })
    })
  })
})
