/**
 * Unit Tests for W3C Trace Context Parser
 * Tests trace header parsing, validation, and generation
 */

import { describe, it, expect } from 'vitest'
import {
  parseTraceparent,
  parseTracestate,
  generateTraceContext,
  generateTraceId,
  generateSpanId,
  formatTraceparent,
  isValidTraceparent,
} from '../../lib/trace-context'

describe('trace-context', () => {
  describe('parseTraceparent', () => {
    it('should parse valid traceparent header', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      const context = parseTraceparent(header)

      expect(context.version).toBe('00')
      expect(context.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
      expect(context.parentSpanId).toBe('00f067aa0ba902b7')
      expect(context.traceFlags).toBe('01')
    })

    it('should generate new trace ID if header is missing', () => {
      const context = parseTraceparent()

      expect(context.version).toBe('00')
      expect(context.traceId).toMatch(/^[0-9a-f]{32}$/)
      expect(context.parentSpanId).toMatch(/^[0-9a-f]{16}$/)
      expect(context.traceFlags).toBe('01')
    })

    it('should generate new trace ID if header is empty string', () => {
      const context = parseTraceparent('')

      expect(context.version).toBe('00')
      expect(context.traceId).toMatch(/^[0-9a-f]{32}$/)
    })

    it('should generate new trace ID if format is invalid (wrong parts)', () => {
      const header = 'invalid-format'
      const context = parseTraceparent(header)

      expect(context.traceId).toMatch(/^[0-9a-f]{32}$/)
    })

    it('should generate new trace ID if version is not 00', () => {
      const header = '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      const context = parseTraceparent(header)

      expect(context.traceId).not.toBe('4bf92f3577b34da6a3ce929d0e0e4736')
      expect(context.traceId).toMatch(/^[0-9a-f]{32}$/)
    })

    it('should generate new trace ID if traceId is invalid (wrong length)', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e473-00f067aa0ba902b7-01'
      const context = parseTraceparent(header)

      expect(context.traceId).not.toBe('4bf92f3577b34da6a3ce929d0e0e473')
    })

    it('should generate new trace ID if parentSpanId is invalid (wrong length)', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902-01'
      const context = parseTraceparent(header)

      expect(context.traceId).not.toBe('4bf92f3577b34da6a3ce929d0e0e4736')
    })

    it('should generate new trace ID if traceFlags is invalid (wrong length)', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-1'
      const context = parseTraceparent(header)

      expect(context.traceId).not.toBe('4bf92f3577b34da6a3ce929d0e0e4736')
    })

    it('should generate new trace ID if contains non-hex characters', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e473g-00f067aa0ba902b7-01'
      const context = parseTraceparent(header)

      expect(context.traceId).not.toBe('4bf92f3577b34da6a3ce929d0e0e473g')
    })
  })

  describe('parseTracestate', () => {
    it('should parse valid tracestate header', () => {
      const header = 'vendor1=value1,vendor2=value2'
      const result = parseTracestate(header)

      expect(result).toBe('vendor1=value1,vendor2=value2')
    })

    it('should return undefined if header is missing', () => {
      const result = parseTracestate()

      expect(result).toBeUndefined()
    })

    it('should return undefined if header is empty string', () => {
      const result = parseTracestate('')

      expect(result).toBeUndefined()
    })

    it('should return undefined if header is whitespace only', () => {
      const result = parseTracestate('   ')

      expect(result).toBeUndefined()
    })
  })

  describe('generateTraceContext', () => {
    it('should generate valid trace context', () => {
      const context = generateTraceContext()

      expect(context.version).toBe('00')
      expect(context.traceId).toMatch(/^[0-9a-f]{32}$/)
      expect(context.parentSpanId).toMatch(/^[0-9a-f]{16}$/)
      expect(context.traceFlags).toBe('01')
    })

    it('should generate unique trace IDs', () => {
      const ctx1 = generateTraceContext()
      const ctx2 = generateTraceContext()

      expect(ctx1.traceId).not.toBe(ctx2.traceId)
    })
  })

  describe('generateTraceId', () => {
    it('should generate 32-character hex string', () => {
      const traceId = generateTraceId()

      expect(traceId).toMatch(/^[0-9a-f]{32}$/)
      expect(traceId.length).toBe(32)
    })

    it('should generate unique trace IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateTraceId())
      }

      expect(ids.size).toBe(100)
    })
  })

  describe('generateSpanId', () => {
    it('should generate 16-character hex string', () => {
      const spanId = generateSpanId()

      expect(spanId).toMatch(/^[0-9a-f]{16}$/)
      expect(spanId.length).toBe(16)
    })

    it('should generate unique span IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateSpanId())
      }

      expect(ids.size).toBe(100)
    })
  })

  describe('formatTraceparent', () => {
    it('should format trace context back to header string', () => {
      const context = {
        version: '00',
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        parentSpanId: '00f067aa0ba902b7',
        traceFlags: '01',
      }

      const formatted = formatTraceparent(context)

      expect(formatted).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')
    })

    it('should handle round-trip parsing', () => {
      const original = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      const parsed = parseTraceparent(original)
      const formatted = formatTraceparent(parsed)

      expect(formatted).toBe(original)
    })
  })

  describe('isValidTraceparent', () => {
    it('should return true for valid traceparent header', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'

      expect(isValidTraceparent(header)).toBe(true)
    })

    it('should return false for invalid header (wrong version)', () => {
      const header = '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'

      expect(isValidTraceparent(header)).toBe(false)
    })

    it('should return false for invalid header (wrong traceId length)', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e473-00f067aa0ba902b7-01'

      expect(isValidTraceparent(header)).toBe(false)
    })

    it('should return false for invalid header (non-hex characters)', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e473g-00f067aa0ba902b7-01'

      expect(isValidTraceparent(header)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidTraceparent('')).toBe(false)
    })

    it('should return false for invalid format', () => {
      expect(isValidTraceparent('invalid')).toBe(false)
    })
  })
})
