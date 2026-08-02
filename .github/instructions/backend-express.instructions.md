---
name: backend-express-development-guide
description: Backend Express-specific patterns, best practices, constraints for Express, file uploads, webhooks, SSE development
applyTo: ["backend-express/**/*.{ts,tsx,js}"]
scope: backend-express
---

# Backend Express Instructions (`backend-express/**`)

**Applies to**: `backend-express/**/*.{ts,tsx,js}`  
**Tech Stack**: Express 4.21+, TypeScript, Multer, Server-Sent Events (SSE)  
**Pattern Type**: HTTP endpoints for file uploads, webhooks, and real-time event broadcasting

---

## 🎯 Key Patterns

### File Upload Endpoint
```typescript
// backend-express/src/routes/upload.ts
import multer from 'multer'

const upload = multer({ dest: 'uploads/' })

router.post('/upload', upload.single('file'), async (req, res) => {
  const fileId = req.file.filename
  const fileName = req.file.originalname
  
  // Store file metadata
  await db.files.create({ fileId, fileName, mimetype: req.file.mimetype })
  
  // Emit event for frontend real-time notification
  await emitEvent('fileUploaded', { fileId, fileName })
  
  res.json({ fileId, downloadUrl: `/files/${fileId}` })
})
```

### Webhook Handler
```typescript
// backend-express/src/routes/webhooks.ts
router.post('/webhooks/ci-results', async (req, res) => {
  const { buildId, status, logs } = req.body
  
  // Validate webhook signature (if from external service)
  if (!validateSignature(req)) return res.status(401).send('Unauthorized')
  
  // Store results
  await db.ciResults.create({ buildId, status, logs })
  
  // Emit event for real-time updates
  await emitEvent('ciResults', { buildId, status })
  
  // Optionally call back to GraphQL to update database
  await callGraphQL('mutation { updateBuildStatus(...) }')
  
  res.json({ success: true })
})
```

### Server-Sent Events (SSE)
```typescript
// backend-express/src/routes/events.ts
const eventSubscribers = []

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  
  const subscriber = { res, id: Date.now() }
  eventSubscribers.push(subscriber)
  
  // Send heartbeat to keep connection alive
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000)
  
  req.on('close', () => {
    clearInterval(heartbeat)
    eventSubscribers = eventSubscribers.filter(s => s.id !== subscriber.id)
  })
})

// Broadcast event to all connected clients
function broadcastEvent(eventName, data) {
  eventSubscribers.forEach(subscriber => {
    subscriber.res.write(`event: ${eventName}\n`)
    subscriber.res.write(`data: ${JSON.stringify(data)}\n\n`)
  })
}
```

### Event Emission from GraphQL
- GraphQL mutations HTTP POST to Express: `http://localhost:5000/events/emit`
- Express broadcasts to all SSE subscribers
- Frontend receives via EventSource listener

---

## 🔄 Workflow Commands

```bash
# Development
pnpm dev:express               # Start Express server (port 5000)
pnpm dev                       # Start all services

# Testing
pnpm test:express              # Run Express route tests
pnpm test:express --watch      # Watch mode
pnpm test:express --run        # Single run (CI mode)

# Quality
pnpm lint                       # ESLint check
pnpm type-check                 # TypeScript strict mode
```

---

## 📋 Implementation Checklist

When implementing an Express feature:

- [ ] **Endpoint**: Define route with proper HTTP method (POST, GET, PUT)
- [ ] **Validation**: Validate request body/params
- [ ] **Authentication**: Check auth headers if needed
- [ ] **Logic**: Implement business logic (store file, process webhook, etc.)
- [ ] **Event Emission**: Emit events for real-time updates if applicable
- [ ] **Response**: Return appropriate HTTP status + JSON
- [ ] **Testing**:
  - Unit tests for route logic
  - Multer file upload mocking
  - EventSource/SSE mock for real-time tests
- [ ] **Quality Checks** (automated per Issue #306):
  - `pnpm test:express --run` — All tests pass
  - `pnpm lint` — No ESLint violations
  - `pnpm type-check` — TypeScript strict mode
- [ ] **Logs**: Capture output to `docs/dev-note/issue-#[N]-pnpm-*.txt`
- [ ] **PR**: Reference endpoint behavior and event types

---

## 🛠️ Common Tasks

### Adding a File Upload Endpoint
```typescript
import express from 'express'
import multer from 'multer'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { filename, originalname, mimetype, size } = req.file
    
    // Validate file
    if (size > 100 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large' })
    }
    
    // Store metadata
    const fileRecord = await db.files.create({
      fileId: filename,
      originalName: originalname,
      mimetype,
      size,
      uploadedAt: new Date()
    })
    
    // Notify frontend
    await broadcastEvent('fileUploaded', fileRecord)
    
    res.json({
      fileId: filename,
      downloadUrl: `/files/${filename}`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
```

### Adding a Webhook Handler
```typescript
router.post('/webhooks/ci-results', async (req, res) => {
  try {
    const { buildId, testsPassed, testsFailed, reportUrl } = req.body
    
    // Store results
    await db.ciResults.create({
      buildId,
      testsPassed,
      testsFailed,
      reportUrl,
      receivedAt: new Date()
    })
    
    // Emit event
    await broadcastEvent('ciResults', {
      buildId,
      status: testsFailed > 0 ? 'FAILED' : 'PASSED'
    })
    
    res.json({ success: true, message: 'CI results received' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

### Setting Up SSE Stream
```typescript
const subscribers = []

router.get('/events', (req, res) => {
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  
  // Store subscriber
  const subscriber = { res, id: Date.now() }
  subscribers.push(subscriber)
  
  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)
  
  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat)
    subscribers.splice(subscribers.indexOf(subscriber), 1)
  })
})

// Broadcast event
export function broadcastEvent(eventName, data) {
  subscribers.forEach(sub => {
    sub.res.write(`event: ${eventName}\n`)
    sub.res.write(`data: ${JSON.stringify(data)}\n\n`)
  })
}
```

---

## 🐛 Debugging

### Testing File Uploads
```bash
# Upload a file
curl -X POST http://localhost:5000/upload \
  -F "file=@test-report.json"

# Expected response:
# { "fileId": "abc123", "downloadUrl": "/files/abc123" }
```

### Testing Webhooks
```bash
# Send webhook payload
curl -X POST http://localhost:5000/webhooks/ci-results \
  -H "Content-Type: application/json" \
  -d '{
    "buildId": "build-123",
    "testsPassed": 45,
    "testsFailed": 0,
    "reportUrl": "https://ci.example.com/reports/123"
  }'
```

### Testing SSE Stream
```bash
# Terminal 1: Listen to events
curl -N http://localhost:5000/events

# Terminal 2: Send GraphQL mutation to trigger event
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBuild(input: {name: \"test\"}) { id } }"}'

# Terminal 1: Should show:
# event: buildCreated
# data: {"buildId":"...","build":{...}}
```

### Express Server Logging
```bash
# Enable debug logging
DEBUG=express:* pnpm dev:express
```

---

## 📖 Key Files

| File | Purpose |
|------|---------|
| `backend-express/src/server.ts` | Express app setup with middleware |
| `backend-express/src/routes/upload.ts` | File upload endpoint (Multer) |
| `backend-express/src/routes/webhooks.ts` | Webhook handlers (CI/CD, sensors) |
| `backend-express/src/routes/events.ts` | Server-Sent Events stream |
| `backend-express/src/__tests__/` | Route integration tests |
| `backend-express/src/types/events.ts` | Event type definitions |

---

## 🔗 Integration Points

### Express ← GraphQL (Event Emission)
- GraphQL mutations HTTP POST to: `http://localhost:5000/events/emit`
- Express receives and validates event payload
- Broadcasts to all connected SSE subscribers

### Express → Frontend (Real-Time Events)
- Frontend: `new EventSource("http://localhost:5000/events")`
- Express: Broadcasts events via Server-Sent Events
- Automatic reconnect with exponential backoff (frontend-side)

### Express ← External Services (Webhooks)
- CI/CD systems POST to: `/webhooks/ci-results`
- Sensor systems POST to: `/webhooks/sensor-data`
- Express validates, stores, and broadcasts events

---

## ✅ Quality Gate (Issue #306 Automation)

All quality checks run **without user confirmation**:

```bash
pnpm test:express --run        # ✓ Tests pass
pnpm lint                      # ✓ 0 violations
pnpm type-check                # ✓ TypeScript strict

# Logs:
docs/dev-note/issue-#[N]-pnpm-test.txt
docs/dev-note/issue-#[N]-pnpm-lint.txt
docs/dev-note/issue-#[N]-pnpm-type-check.txt
```

If any check fails, fix and re-run. Orchestrator validates pre-merge.

---

## 🆘 Common Issues

### "SSE Connection Drops Randomly"
- **Problem**: Express doesn't send heartbeat, client times out
- **Solution**: Ensure heartbeat interval < client timeout (use 30s intervals)

### "Webhook Not Received"
- **Problem**: External service can't reach Express endpoint
- **Solution**: Check firewall, routing, Docker networking (if applicable)

### "Events Not Broadcast to Frontend"
- **Problem**: GraphQL mutation emitted event, but frontend didn't receive
- **Check**: 
  1. Express `/events/emit` endpoint received POST from GraphQL
  2. Frontend SSE connection active (check browser console)
  3. Event name matches listener on frontend

### "File Upload Fails"
- **Problem**: Multer validation rejected file
- **Solution**: Check file size, format, permissions on upload directory

---

**Last Updated**: 2026-05-19  
**Pattern**: GitHub Official (path-specific instruction file with `applyTo` glob)
