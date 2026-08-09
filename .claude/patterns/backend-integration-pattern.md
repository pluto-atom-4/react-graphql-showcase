# Backend Integration Pattern

Coordinate GraphQL + Express services via shared database and event bus.

## Architecture
```
Frontend ↔ GraphQL (Apollo) ↔ PostgreSQL
              ↓ Events
           Express Service
```

## 1. GraphQL Primary Operations

```typescript
// backend-graphql/resolvers/Mutation.ts
export const resolvers = {
  Mutation: {
    createBuild: async (_, { input }, { loaders, eventBus }) => {
      const build = await db.build.create({
        data: {
          userId: currentUser.id,
          ...input
        }
      });
      
      // Emit for Express subscribers
      eventBus.emit('BUILD_CREATED', {
        buildId: build.id,
        timestamp: new Date()
      });
      
      return build;
    }
  }
};
```

## 2. Express Async Jobs

```typescript
// backend-express/routes/webhooks.ts
app.post('/webhooks/build/:buildId', async (req, res) => {
  const build = await db.build.findUnique({
    where: { id: req.params.buildId }
  });
  
  // Process file uploads, external APIs, etc.
  await processFiles(build);
  
  // Update via GraphQL mutation or direct DB
  await db.build.update({
    where: { id: build.id },
    data: { status: 'PROCESSING' }
  });
  
  res.json({ success: true });
});
```

## 3. SSE Real-Time Updates

```typescript
// backend-express/routes/events.ts
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  
  const handler = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  
  eventBus.on('BUILD_STATUS_CHANGED', handler);
  req.on('close', () => eventBus.off('BUILD_STATUS_CHANGED', handler));
});
```

## 4. Frontend Subscription

```typescript
// frontend/hooks/useRealtimeUpdates.ts
'use client';
export function useRealtimeUpdates(callback) {
  useEffect(() => {
    const sse = new EventSource('http://localhost:5000/events');
    sse.onmessage = (e) => callback(JSON.parse(e.data));
    return () => sse.close();
  }, []);
}
```

## Key Rules
1. GraphQL owns data write operations
2. Express handles file I/O and webhooks
3. Both read from shared PostgreSQL
4. Events coordinate async work
5. Frontend subscribes to SSE for updates

## Links
- DESIGN.md: `DESIGN.md`
- Express Instructions: `.github/instructions/backend-express.instructions.md`
