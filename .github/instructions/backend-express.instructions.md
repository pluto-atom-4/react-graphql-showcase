---
name: backend-express-development-guide
description: Backend Express patterns for file uploads, webhooks, Server-Sent Events
applyTo: ["backend-express/**/*.{ts,tsx,js}"]
scope: backend-express
---

# Backend Express Instructions (`backend-express/**`)

**Tech Stack**: Express 4.21+, TypeScript, Multer, Server-Sent Events (SSE)

---

## 🎯 Key Patterns

### File Upload Endpoint
```typescript
import multer from 'multer'
const upload = multer({ dest: 'uploads/' })

router.post('/upload', upload.single('file'), async (req, res) => {
  const { filename, originalname, mimetype, size } = req.file
  
  // Validate and store
  if (size > 100 * 1024 * 1024) return res.status(413).json({ error: 'Too large' })
  
  const record = await db.files.create({ fileId: filename, originalName: originalname })
  
  // Notify frontend via SSE
  broadcastEvent('fileUploaded', record)
  
  res.json({ fileId: filename, downloadUrl: `/files/${filename}` })
})
```

### Webhook Handler
```typescript
router.post('/webhooks/ci-results', async (req, res) => {
  const { buildId, testsPassed, testsFailed, reportUrl } = req.body
  
  // Store results
  await db.ciResults.create({ buildId, testsPassed, testsFailed, reportUrl })
  
  // Emit event
  broadcastEvent('ciResults', { buildId, status: testsFailed > 0 ? 'FAILED' : 'PASSED' })
  
  res.json({ success: true })
})
```

### Server-Sent Events (SSE)
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
  
  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000)
  
  req.on('close', () => {
    clearInterval(heartbeat)
    subscribers.splice(subscribers.indexOf(subscriber), 1)
  })
})

// Broadcast to all connected clients
export function broadcastEvent(eventName, data) {
  subscribers.forEach(sub => {
    sub.res.write(`event: ${eventName}\n`)
    sub.res.write(`data: ${JSON.stringify(data)}\n\n`)
  })
}
```

### Event Flow
GraphQL Mutation → GraphQL emits via HTTP POST → Express receives → Broadcasts via SSE → Frontend receives

---

## 🔄 Commands

```bash
pnpm dev:express               # Start Express (port 5000)
pnpm test:express --run        # Tests in CI mode
pnpm lint && pnpm type-check   # Quality checks
```

---

## 📋 Implementation Checklist

When implementing an Express feature:

- [ ] **Endpoint**: Define route with HTTP method (POST, GET, PUT)
- [ ] **Validation**: Validate request body/params
- [ ] **Authentication**: Check auth headers if needed
- [ ] **Logic**: Implement business logic (file I/O, webhook processing)
- [ ] **Event Emission**: Broadcast events for real-time updates (if applicable)
- [ ] **Response**: Return appropriate HTTP status + JSON
- [ ] **Testing**:
  - Unit tests for route logic
  - Mock Multer for file uploads
  - Mock EventSource/SSE for real-time
- [ ] **Quality Checks**:
  - `pnpm test:express --run` — All tests pass
  - `pnpm lint` — No ESLint violations
  - `pnpm type-check` — TypeScript strict mode

---

## 🛠️ Common Tasks

### Adding a File Upload Endpoint
See patterns above. Key steps:
1. Define multer middleware
2. Validate file (size, type, etc.)
3. Store metadata in database
4. Broadcast event to SSE subscribers
5. Return download URL to client

### Adding a Webhook Handler
See patterns above. Key steps:
1. Parse request body
2. Validate signature (if from external service)
3. Store results in database
4. Broadcast event for real-time updates
5. Optionally call GraphQL to sync database

### Setting Up SSE Stream
See patterns above. Key steps:
1. Set proper HTTP headers
2. Store subscriber references
3. Send heartbeat every 30s to keep connection alive
4. Handle disconnection and cleanup

---

## 🐛 Debugging

### Testing File Uploads
```bash
curl -X POST http://localhost:5000/upload -F "file=@test-report.json"
# Expected: { "fileId": "abc123", "downloadUrl": "/files/abc123" }
```

### Testing Webhooks
```bash
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

# Terminal 2: Trigger GraphQL mutation
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBuild(input: {name: \"test\"}) { id } }"}'
```

### Enable Express Logging
```bash
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

---

## 🔗 Related Patterns

- `.claude/patterns/event-emission-pattern.md`
- `.claude/patterns/backend-integration-pattern.md`
- `.claude/patterns/security-patterns.md`

---

**Last Updated**: 2026-08-09
