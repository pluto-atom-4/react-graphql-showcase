import express from 'express';
import cors from 'cors';
import path from 'path';
import uploadRoutes from './routes/upload';
import webhookRoutes from './routes/webhooks';
import eventsRoutes from './routes/events';
import { errorHandler } from './middleware/error';
import { tracingMiddleware } from './middleware/tracing-middleware';
import { initializeTracing } from './lib/tracing';

const app = express();
const PORT = process.env.EXPRESS_PORT || 5000;

// Initialize tracing
initializeTracing();

// Middleware
// Register tracing middleware FIRST (before all other middleware)
// This captures traceparent headers from every request
app.use(tracingMiddleware);

// Configure CORS to allow credentials from localhost
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Static files for uploads
app.use('/files', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'express', port: PORT });
});

// Routes
app.use('/upload', uploadRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/events', eventsRoutes);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.warn(`Express server running on port ${PORT}`);
});
