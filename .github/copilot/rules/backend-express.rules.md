# Express Backend Domain Rules

Rules and best practices for Express.js routes, middleware, and event streaming in `backend-express/`.

---

## Route Organization Rules

### Route Structure
- ✅ **DO**: Group related routes using router.use() nesting
- ✅ **DO**: One file per feature (e.g., upload.ts, webhooks.ts, events.ts)
- ✅ **DO**: Use descriptive path names
- ✅ **DO**: Define all routes in src/routes/, imported in server.ts
- ❌ **DON'T**: Mix unrelated routes in same file
- ❌ **DON'T**: Define routes directly in server.ts

**Pattern**:
```typescript
// src/routes/upload.ts
import express from "express";
const router = express.Router();

router.post("/", authenticate, validateFile, uploadHandler);
export default router;

// src/server.ts
import uploadRoutes from "./routes/upload";
app.use("/upload", uploadRoutes);
```

### Route Handlers
- ✅ **DO**: Use async/await for handlers
- ✅ **DO**: Always include error handling (try/catch)
- ✅ **DO**: Return consistent response format
- ✅ **DO**: Use appropriate HTTP status codes
- ✅ **DO**: Validate all inputs
- ❌ **DON'T**: Omit error handling
- ❌ **DON'T**: Return raw exceptions to client
- ❌ **DON'T**: Mix sync and async handlers

**Pattern**:
```typescript
router.post("/", async (req, res, next) => {
  try {
    // Validate
    if (!req.file) return res.status(400).json({ error: "File required" });
    
    // Process
    const result = await uploadFile(req.file);
    
    // Respond
    res.status(200).json({ success: true, fileId: result.id });
  } catch (err) {
    next(err);  // Pass to error middleware
  }
});
```

---

## File Upload Rules (Multer)

### Configuration
- ✅ **DO**: Use Multer for file uploads
- ✅ **DO**: Validate file size: set `limits.fileSize`
- ✅ **DO**: Validate MIME types: whitelist allowed types
- ✅ **DO**: Store files in temp directory first, then move to final location
- ✅ **DO**: Scan for malware (virus scanner integration)
- ❌ **DON'T**: Accept all file types
- ❌ **DON'T**: Trust MIME type from client (verify content)
- ❌ **DON'T**: Store files in memory (use disk)

**Pattern**:
```typescript
import multer from "multer";

const upload = multer({
  dest: "/tmp/uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

router.post("/", upload.single("file"), async (req, res) => {
  // req.file contains: fieldname, originalname, encoding, mimetype, size, destination, filename, path
  const { buffer, mimetype, originalname } = req.file;
  
  // Scan for malware
  await scanFile(buffer);
  
  // Move to final location
  const finalPath = `/uploads/${Date.now()}_${originalname}`;
  fs.renameSync(req.file.path, finalPath);
  
  res.json({ fileId: finalPath });
});
```

### Security Checks
- ✅ **DO**: Authenticate before upload
- ✅ **DO**: Validate file content (not just extension/MIME)
- ✅ **DO**: Limit upload rate (prevent DoS)
- ✅ **DO**: Store original filename separately from file path
- ❌ **DON'T**: Trust client-provided filename
- ❌ **DON'T**: Serve uploaded files as executable

---

## Webhook Rules

### Webhook Ingestion
- ✅ **DO**: Verify webhook signature before processing
- ✅ **DO**: Check request timestamp (replay attack prevention)
- ✅ **DO**: Respond with 202 Accepted immediately (async processing)
- ✅ **DO**: Queue webhook for async processing (don't block handler)
- ✅ **DO**: Log all webhook events
- ❌ **DON'T**: Process webhook synchronously (blocks HTTP response)
- ❌ **DON'T**: Trust webhook payload without verification
- ❌ **DON'T**: Ignore timestamp validation

**Pattern**:
```typescript
const webhookSecret = process.env.WEBHOOK_SECRET;

router.post("/github", (req, res) => {
  // 1. Verify signature
  const signature = req.headers["x-hub-signature-256"];
  const payload = JSON.stringify(req.body);
  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");
  
  if (`sha256=${hash}` !== signature) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  
  // 2. Check timestamp (within 5 minutes)
  const deliveredAt = new Date(req.headers["x-github-delivery"]);
  if (Date.now() - deliveredAt.getTime() > 5 * 60 * 1000) {
    return res.status(401).json({ error: "Request too old" });
  }
  
  // 3. Queue for async processing
  webhookQueue.push(req.body);
  
  // 4. Respond immediately
  res.status(202).json({ received: true });
});

// Process async
webhookQueue.on("webhook", async (payload) => {
  try {
    await processWebhook(payload);
  } catch (err) {
    console.error("Webhook processing error:", err);
  }
});
```

### Idempotency
- ✅ **DO**: Track webhook delivery ID (prevent duplicates)
- ✅ **DO**: Use database unique constraint on delivery ID
- ✅ **DO**: Return 200 OK for duplicate deliveries
- ❌ **DON'T**: Process same webhook twice

**Pattern**:
```typescript
// Track deliveries in database
const webhookLog = await prisma.webhookLog.upsert({
  where: { deliveryId: req.headers["x-delivery-id"] },
  create: { deliveryId: req.headers["x-delivery-id"], payload: req.body },
  update: { processedAt: new Date() },
});

if (webhookLog.processedAt) {
  // Already processed
  return res.status(200).json({ received: true });
}
```

---

## Server-Sent Events (SSE) Rules

### Event Broadcasting
- ✅ **DO**: Stream events to connected clients in real-time
- ✅ **DO**: Use SSE format: `data: <JSON>\n\n`
- ✅ **DO**: Include event ID for client reconnection
- ✅ **DO**: Handle client disconnect gracefully
- ✅ **DO**: Use Redis for multi-instance broadcasting
- ❌ **DON'T**: Use in-memory client list (single instance only)
- ❌ **DON'T**: Block HTTP event handler
- ❌ **DON'T**: Send large payloads (stream them)

**Pattern**:
```typescript
// In-memory client list (single instance only)
const clients = new Set();

router.get("/events", (req, res) => {
  // Setup SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  // Register client
  clients.add(res);
  
  // Send initial connection message
  res.write(`data: {"type":"connected","timestamp":"${new Date().toISOString()}"}\n\n`);
  
  // Handle disconnect
  req.on("close", () => {
    clients.delete(res);
    res.end();
  });
});

// Broadcast to all connected clients
export function broadcastEvent(eventType, data) {
  const message = `data: ${JSON.stringify({ type: eventType, data })}\n\n`;
  clients.forEach(client => client.write(message));
}
```

### Production Scaling (Redis)
- ✅ **DO**: Use Redis pub/sub for multi-instance
- ✅ **DO**: Subscribe to Redis channels
- ✅ **DO**: Publish from other services
- ✅ **DO**: Handle Redis disconnection gracefully

**Pattern**:
```typescript
import redis from "redis";

const publisher = redis.createClient();
const subscriber = redis.createClient();

// Subscribe to event channels
subscriber.subscribe("build:created", "build:status_changed");

subscriber.on("message", (channel, data) => {
  broadcastEvent(channel, JSON.parse(data));
});

// Publish from other services
export async function broadcastEvent(channel, data) {
  await publisher.publish(channel, JSON.stringify(data));
}
```

---

## Middleware Rules

### Middleware Chain
- ✅ **DO**: Order middleware: Auth → Validation → Handler → Error
- ✅ **DO**: Pass errors to error middleware with `next(err)`
- ✅ **DO**: Use middleware for cross-cutting concerns
- ✅ **DO**: Keep middleware focused (single responsibility)
- ❌ **DON'T**: Mix middleware and route handlers
- ❌ **DON'T**: Swallow errors (always pass to error handler)

**Pattern**:
```typescript
// src/middleware/index.ts
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);  // Pass to error middleware
  }
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  
  console.error(`[${status}] ${message}`, err);
  res.status(status).json({ error: message });
};

// src/server.ts
import { authenticate, errorHandler } from "./middleware";

app.use(express.json());
app.use(authenticate);  // Auth before routes
app.use("/upload", uploadRoutes);
app.use(errorHandler);  // Error handler last
```

### Request Validation
- ✅ **DO**: Validate all inputs: query, params, body
- ✅ **DO**: Use schema validation library (e.g., Zod, Joi)
- ✅ **DO**: Return 400 Bad Request for validation errors
- ❌ **DON'T**: Trust client input
- ❌ **DON'T**: Omit validation for "trusted" clients

**Pattern**:
```typescript
import { z } from "zod";

const uploadSchema = z.object({
  buildId: z.string().uuid(),
  reportType: z.enum(["test", "coverage", "performance"]),
});

router.post("/", authenticate, (req, res, next) => {
  try {
    const validated = uploadSchema.parse(req.body);
    // Process validated data
    next();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

---

## Database Integration Rules

### Prisma Integration
- ✅ **DO**: Use Prisma for all database operations
- ✅ **DO**: Create Prisma client singleton
- ✅ **DO**: Use transactions for multi-step operations
- ✅ **DO**: Handle connection pooling
- ❌ **DON'T**: Use raw SQL (use Prisma)
- ❌ **DON'T**: Create multiple Prisma clients

**Pattern**:
```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Testing Rules

### Integration Tests
- ✅ **DO**: Test route handlers with Supertest
- ✅ **DO**: Test error cases (validation, auth, not found)
- ✅ **DO**: Test file uploads with mock files
- ✅ **DO**: Test webhook verification
- ✅ **DO**: Test SSE client connection
- ❌ **DON'T**: Test against real database (use test DB or mocks)
- ❌ **DON'T**: Leave test files in upload directory

**Coverage Target**: 85% for routes, 100% for middleware

**Pattern**:
```typescript
import request from "supertest";
import app from "../src/server";

describe("POST /upload", () => {
  it("uploads file successfully", async () => {
    const response = await request(app)
      .post("/upload")
      .set("Authorization", `Bearer ${testToken}`)
      .attach("file", "test-file.pdf")
      .expect(200);
    
    expect(response.body.fileId).toBeDefined();
  });
  
  it("rejects invalid file type", async () => {
    await request(app)
      .post("/upload")
      .set("Authorization", `Bearer ${testToken}`)
      .attach("file", "test-file.exe")
      .expect(400);
  });
});
```

**Quick Check**: `pnpm test:express --run --coverage`

---

## Code Quality Rules

### TypeScript
- ✅ **DO**: Use strict mode: `"strict": true` in tsconfig.json
- ✅ **DO**: Type all route handlers and middleware
- ✅ **DO**: Use interfaces for request/response types
- ❌ **DON'T**: Use `any` type
- ❌ **DON'T**: Omit return types

**Quick Check**: `pnpm type-check`

### Performance
- ✅ **DO**: Use compression middleware: `compression()`
- ✅ **DO**: Set appropriate timeout for long operations
- ✅ **DO**: Monitor memory usage (file uploads)
- ✅ **DO**: Use rate limiting for public endpoints
- ❌ **DON'T**: Block event loop with sync operations
- ❌ **DON'T**: Load entire file into memory

**Pattern**:
```typescript
import compression from "compression";
import rateLimit from "express-rate-limit";

app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/upload", limiter);
```

---

## File Organization

```
backend-express/
├── src/
│   ├── routes/
│   │   ├── upload.ts           # POST /upload
│   │   ├── webhooks.ts         # POST /webhooks/*
│   │   ├── events.ts           # GET /events (SSE)
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── validation.ts       # Input validation
│   │   └── index.ts
│   ├── lib/
│   │   ├── prisma.ts           # Prisma singleton
│   │   ├── eventBus.ts         # Event emitter
│   │   └── webhookProcessor.ts
│   ├── server.ts               # Express app setup
│   └── index.ts
├── __tests__/
│   ├── routes/
│   ├── middleware/
│   └── integration/
└── package.json
```

---

## Related Documentation

- **See**: `.github/instructions/backend-express.instructions.md` (detailed layer guide)
- **See**: `DESIGN.md` (architecture overview)
- **See**: `SKILLS.md` (10 Express skills indexed)

---

**Last Updated**: 2026-08-17  
**Scope**: `backend-express/` directory  
**Quick Check**: `pnpm test:express --run && pnpm lint && pnpm type-check`
