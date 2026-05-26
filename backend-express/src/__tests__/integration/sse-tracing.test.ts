/**
 * Integration Tests for SSE Tracing
 * Tests full request→SSE flow with trace context propagation
 */

import { describe, it, expect } from 'vitest'
import {
  getTraceContext,
  runWithTraceContext,
} from '../../lib/context-manager'
import type { TraceContext } from '../../lib/trace-context'

describe('SSE Tracing Integration', () => {
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

  describe('Full Request→SSE Flow', () => {
    it('should preserve trace context through SSE connection lifetime', async () => {
      const contextSnapshots: (TraceContext | undefined)[] = []

      // Simulate SSE connection with trace context
      await new Promise((resolve) => {
        runWithTraceContext(mockContext, () => {
          // Capture context at connection start
          contextSnapshots.push(getTraceContext())

          // Simulate async operations (event broadcasts)
          setTimeout(() => {
            contextSnapshots.push(getTraceContext())
          }, 10)

          setTimeout(() => {
            contextSnapshots.push(getTraceContext())
            resolve(undefined)
          }, 20)
        })
      })

      expect(contextSnapshots).toHaveLength(3)
      expect(contextSnapshots[0]).toEqual(mockContext)
      expect(contextSnapshots[1]).toEqual(mockContext)
      expect(contextSnapshots[2]).toEqual(mockContext)
    })

    it('should isolate trace contexts for concurrent SSE connections', async () => {
      const client1Contexts: (TraceContext | undefined)[] = []
      const client2Contexts: (TraceContext | undefined)[] = []

      await Promise.all([
        new Promise((resolve) => {
          runWithTraceContext(mockContext, () => {
            client1Contexts.push(getTraceContext())
            setTimeout(() => {
              client1Contexts.push(getTraceContext())
              resolve(undefined)
            }, 15)
          })
        }),
        new Promise((resolve) => {
          runWithTraceContext(mockContext2, () => {
            client2Contexts.push(getTraceContext())
            setTimeout(() => {
              client2Contexts.push(getTraceContext())
              resolve(undefined)
            }, 15)
          })
        }),
      ])

      // Client 1 should always have context1
      expect(client1Contexts[0]?.traceId).toBe(mockContext.traceId)
      expect(client1Contexts[1]?.traceId).toBe(mockContext.traceId)

      // Client 2 should always have context2
      expect(client2Contexts[0]?.traceId).toBe(mockContext2.traceId)
      expect(client2Contexts[1]?.traceId).toBe(mockContext2.traceId)
    })

    it('should handle rapid event broadcasts within trace context', async () => {
      const eventCount = 100
      let capturedEvents = 0

      await runWithTraceContext(mockContext, async () => {
        // Simulate rapid event broadcasts
        const promises = []
        for (let i = 0; i < eventCount; i++) {
          promises.push(
            new Promise((resolve) => {
              globalThis.setImmediate(() => {
                if (getTraceContext()?.traceId === mockContext.traceId) {
                  capturedEvents++
                }
                resolve(undefined)
              })
            })
          )
        }
        await Promise.all(promises)
      })

      expect(capturedEvents).toBe(eventCount)
    })
  })

  describe('Trace Context Cleanup', () => {
    it('should not leak trace context between requests', async () => {
      const contextBefore = getTraceContext()

      await runWithTraceContext(mockContext, async () => {
        // Inside trace context
        expect(getTraceContext()).toEqual(mockContext)
      })

      const contextAfter = getTraceContext()

      expect(contextBefore).toEqual(contextAfter)
    })

    it('should handle nested contexts correctly', async () => {
      const contexts: (TraceContext | undefined)[] = []

      await runWithTraceContext(mockContext, async () => {
        contexts.push(getTraceContext())

        await runWithTraceContext(mockContext2, async () => {
          contexts.push(getTraceContext())
        })

        contexts.push(getTraceContext())
      })

      expect(contexts[0]?.traceId).toBe(mockContext.traceId)
      expect(contexts[1]?.traceId).toBe(mockContext2.traceId)
      expect(contexts[2]?.traceId).toBe(mockContext.traceId)
    })
  })

  describe('Error Handling in Trace Context', () => {
    it('should preserve context even when error occurs', async () => {
      let contextOnError: TraceContext | undefined
      let errorCaught = false

      try {
        await runWithTraceContext(mockContext, () => {
          throw new Error('test error')
        })
      } catch (error) {
        errorCaught = !!error
        contextOnError = getTraceContext()
      }

      expect(errorCaught).toBe(true)
      expect(contextOnError).toBeUndefined()
    })

    it('should handle async errors within trace context', async () => {
      let contextOnError: TraceContext | undefined
      let contextAfter: TraceContext | undefined
      let errorCaught = false

      try {
        await runWithTraceContext(mockContext, async () => {
          await new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('async error')), 10)
          })
        })
      } catch (error) {
        errorCaught = !!error
        contextOnError = getTraceContext()
      }

      contextAfter = getTraceContext()

      expect(errorCaught).toBe(true)
      expect(contextOnError).toBeUndefined()
      expect(contextAfter).toBeUndefined()
    })
  })

  describe('Event Broadcast with Trace Metadata', () => {
    it('should include trace ID in broadcasted events', () => {
      const events: Array<{ event: string; traceId?: string }> = []

      runWithTraceContext(mockContext, () => {
        const ctx = getTraceContext()
        if (ctx) {
          events.push({
            event: 'testEvent',
            traceId: ctx.traceId,
          })
        }
      })

      expect(events[0]?.traceId).toBe(mockContext.traceId)
    })

    it('should handle events without trace context', () => {
      const events: Array<{ event: string; traceId?: string }> = []

      const ctx = getTraceContext()
      events.push({
        event: 'testEvent',
        traceId: ctx?.traceId,
      })

      expect(events[0]?.traceId).toBeUndefined()
    })
  })

  describe('Performance with Trace Context', () => {
    it('should not significantly impact performance', async () => {
      const iterations = 1000
      const startTime = Date.now()

      for (let i = 0; i < iterations; i++) {
        await runWithTraceContext(mockContext, async () => {
          getTraceContext()
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete 1000 iterations in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000)
    })
  })
})
