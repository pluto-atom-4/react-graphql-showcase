/**
 * Event Bus Service
 *
 * Provides a centralized event emitter for loosely coupled communication
 * between Express routes and real-time event listeners (SSE, etc.)
 *
 * Features:
 * - Metrics collection: track event throughput, latency, errors
 * - Event-type counting: count occurrences of each event type
 * - Per-client event tracking: count events sent to each client
 *
 * Events:
 * - fileUploaded: { fileId, buildId, fileName, timestamp }
 * - ciResults: { buildId, status, testsPassed, testsFailed, timestamp }
 * - sensorData: { buildId, sensorType, value, timestamp }
 */

import { EventEmitter } from 'events';
import type { EventType } from '../types/events.js';

/**
 * Metrics interface for monitoring event bus performance
 */
export interface EventBusMetrics {
  /** Total events received from GraphQL and Express endpoints */
  totalEmitted: number;
  /** Successfully broadcast to at least one client */
  totalBroadcasted: number;
  /** Duplicate events rejected by deduplicator */
  totalDuplicates: number;
  /** Errors during broadcast (client disconnects, write failures) */
  totalErrors: number;
  /** Failed broadcasts where client was no longer writable */
  failedBroadcasts: number;
  /** Average latency in milliseconds for broadcasts */
  averageLatencyMs: number;
  /** Peak latency in milliseconds */
  maxLatencyMs: number;
  /** Minimum latency in milliseconds */
  minLatencyMs: number;
  /** Current number of connected SSE clients */
  connectedClients: number;
  /** Count of events by event type */
  eventCounts: Record<string, number>;
}

/**
 * Metrics collector for the event bus
 *
 * Tracks event throughput, latency, errors, and per-event-type counts.
 * Used for observability and performance monitoring.
 */
export class EventBusMetricsCollector {
  private metrics: EventBusMetrics = {
    totalEmitted: 0,
    totalBroadcasted: 0,
    totalDuplicates: 0,
    totalErrors: 0,
    failedBroadcasts: 0,
    averageLatencyMs: 0,
    maxLatencyMs: 0,
    minLatencyMs: Infinity,
    connectedClients: 0,
    eventCounts: {},
  };

  /**
   * Record an event emission from GraphQL or Express
   *
   * @param eventType - Type of event (from EVENT_TYPES constant)
   */
  recordEmitted(eventType: EventType | string): void {
    this.metrics.totalEmitted++;
    this.metrics.eventCounts[eventType] = (this.metrics.eventCounts[eventType] ?? 0) + 1;
  }

  /**
   * Record successful broadcast of an event
   *
   * Updates latency statistics and total broadcast count.
   *
   * @param latencyMs - Time taken to broadcast event in milliseconds
   * @param _eventType - Type of event for counting
   */
  recordBroadcasted(latencyMs: number, _eventType: EventType | string): void {
    this.metrics.totalBroadcasted++;
    this.updateLatency(latencyMs);
  }

  /**
   * Record a duplicate event that was rejected
   */
  recordDuplicate(): void {
    this.metrics.totalDuplicates++;
  }

  /**
   * Record a broadcast error
   */
  recordBroadcastError(): void {
    this.metrics.totalErrors++;
  }

  /**
   * Record a failed broadcast (client no longer writable)
   */
  recordFailedBroadcast(): void {
    this.metrics.failedBroadcasts++;
  }

  /**
   * Update the number of connected SSE clients
   *
   * @param count - Current number of connected clients
   */
  setConnectedClients(count: number): void {
    this.metrics.connectedClients = count;
  }

  /**
   * Update latency statistics
   *
   * Maintains running average, min, and max latencies.
   *
   * @private
   */
  private updateLatency(latencyMs: number): void {
    const total = this.metrics.totalBroadcasted;
    // Calculate new average with previous total as weight
    this.metrics.averageLatencyMs =
      (this.metrics.averageLatencyMs * (total - 1) + latencyMs) / total;
    this.metrics.maxLatencyMs = Math.max(this.metrics.maxLatencyMs, latencyMs);
    this.metrics.minLatencyMs = Math.min(this.metrics.minLatencyMs, latencyMs);
  }

  /**
   * Get current metrics snapshot
   *
   * @returns Copy of current metrics object
   */
  getMetrics(): EventBusMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics to initial state
   *
   * Used for testing and performance baseline resets.
   */
  reset(): void {
    this.metrics = {
      totalEmitted: 0,
      totalBroadcasted: 0,
      totalDuplicates: 0,
      totalErrors: 0,
      failedBroadcasts: 0,
      averageLatencyMs: 0,
      maxLatencyMs: 0,
      minLatencyMs: Infinity,
      connectedClients: 0,
      eventCounts: {},
    };
  }
}

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Set max listeners to prevent memory leak warnings
    this.setMaxListeners(100);
  }

  // Emit typed events with timestamps
  emitFileUploaded(data: { fileId: string; buildId?: string; fileName: string }) {
    this.emit('fileUploaded', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitCIResults(data: {
    buildId: string;
    status: string;
    testsPassed?: number;
    testsFailed?: number;
  }) {
    this.emit('ciResults', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitSensorData(data: { buildId: string; sensorType: string; value: unknown }) {
    this.emit('sensorData', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

export const eventBus = new EventBus();
