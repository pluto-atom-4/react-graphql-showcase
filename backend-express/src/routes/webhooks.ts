/**
 * Webhooks Route
 *
 * POST /webhooks/ci-results - Receive CI/CD test results
 * POST /webhooks/sensor-data - Receive manufacturing sensor data
 *
 * Both endpoints emit events for real-time subscribers and GraphQL mutations.
 */

import { Router, type Router as ExpressRouter } from 'express';
import { eventBus } from '../services/event-bus.js';
import { asyncHandler, AppError } from '../middleware/error.js';

const router: ExpressRouter = Router();

/**
 * POST /webhooks/ci-results
 * Receive CI/CD test results and emit event
 *
 * Payload:
 * {
 *   buildId: string (required)
 *   status: string (required, e.g., "PASSED", "FAILED")
 *   testsPassed?: number
 *   testsFailed?: number
 *   details?: string
 * }
 */
router.post(
  '/ci-results',
  asyncHandler(async (req, res) => {
    const { buildId, status, testsPassed, testsFailed } = req.body;

    // Validate required fields
    if (!buildId) {
      throw new AppError(400, 'buildId is required');
    }
    if (!status) {
      throw new AppError(400, 'status is required');
    }

    // Emit event for real-time subscribers and GraphQL mutations
    eventBus.emitCIResults({
      buildId,
      status,
      testsPassed: testsPassed || 0,
      testsFailed: testsFailed || 0,
    });

    res.json({
      status: 'received',
      eventType: 'ciResultsReceived',
      buildId,
    });
  })
);

/**
 * POST /webhooks/sensor-data
 * Receive manufacturing sensor data and emit event
 *
 * Payload:
 * {
 *   buildId: string (required)
 *   sensorType: string (required, e.g., "temperature", "pressure")
 *   value: number | string (required)
 *   unit?: string
 * }
 */
router.post(
  '/sensor-data',
  asyncHandler(async (req, res) => {
    const { buildId, sensorType, value } = req.body;

    // Validate required fields
    if (!buildId) {
      throw new AppError(400, 'buildId is required');
    }
    if (!sensorType) {
      throw new AppError(400, 'sensorType is required');
    }
    if (value === undefined) {
      throw new AppError(400, 'value is required');
    }

    // Emit event for real-time subscribers
    eventBus.emitSensorData({
      buildId,
      sensorType,
      value,
    });

    res.json({
      status: 'received',
      eventType: 'sensorDataReceived',
      buildId,
      sensorType,
    });
  })
);

/**
 * POST /webhooks/test - Echo webhook for testing
 */
router.post(
  '/test',
  asyncHandler(async (req, res) => {
    res.json({
      status: 'ok',
      received: req.body,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
