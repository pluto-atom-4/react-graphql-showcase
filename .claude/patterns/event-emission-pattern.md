# Event Emission Pattern

Publish state changes from GraphQL resolvers to Express webhook handlers and SSE subscribers.

## Pattern Flow
```
GraphQL Mutation → Emit Event → Event Bus → Express Handler + SSE Subscribers
```

## Implementation

### 1. Define Event Type
```typescript
// shared/types/events.ts
export type BuildStatusChanged = {
  type: 'BUILD_STATUS_CHANGED';
  buildId: string;
  status: BuildStatus;
  timestamp: Date;
};
```

### 2. Emit from GraphQL
```typescript
// backend-graphql/resolvers/Build.ts
const updateBuildStatus = async (_, { id, status }, { eventBus }) => {
  const build = await db.build.update({ where: { id }, data: { status } });
  eventBus.emit('BUILD_STATUS_CHANGED', {
    buildId: id,
    status,
    timestamp: new Date()
  });
  return build;
};
```

### 3. Subscribe in Express
```typescript
// backend-express/handlers/buildStatusHandler.ts
eventBus.on('BUILD_STATUS_CHANGED', async (event) => {
  // Handle webhook posting, logging, etc.
  await webhook.notify(event);
});
```

### 4. Broadcast to Clients
```typescript
// Subscriptions route emits SSE events
router.get('/events', (req, res) => {
  eventBus.on('BUILD_STATUS_CHANGED', (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });
});
```

## Key Rules
1. Emit only after persistence (inside transaction)
2. Include identifiers and timestamps
3. Handle subscriber reconnects gracefully
4. Log all emitted events
5. Use EventEmitter or custom bus pattern

## Testing
```typescript
it('emits BUILD_STATUS_CHANGED', async () => {
  const spy = jest.spyOn(eventBus, 'emit');
  await updateBuildStatus(_, { id: '1', status: 'COMPLETED' }, ctx);
  expect(spy).toHaveBeenCalledWith('BUILD_STATUS_CHANGED', expect.any(Object));
});
```

## Links
- Backend Express Instructions: `.github/instructions/backend-express.instructions.md`
- Backend GraphQL Instructions: `.github/instructions/backend-graphql.instructions.md`
