---
name: backend-graphql-development-guide
description: Backend GraphQL-specific patterns, best practices, constraints for Apollo Server, resolvers, DataLoader development
applyTo: ["backend-graphql/**/*.{ts,tsx,js,graphql}"]
scope: backend-graphql
---

# Backend GraphQL Instructions (`backend-graphql/**`)

**Applies to**: `backend-graphql/**/*.{ts,tsx,js,graphql}`  
**Tech Stack**: Apollo Server 4, TypeScript, PostgreSQL, Prisma/Drizzle, DataLoader  
**Pattern Type**: GraphQL resolvers with N+1 prevention, real-time event emission

---

## 🎯 Key Patterns

### GraphQL Schema Design
- Define types in `src/schema.graphql` (SDL format)
- Core types: `Build`, `Part`, `TestRun` (manufacturing domain)
- Use GraphQL enums for status fields (PENDING, RUNNING, COMPLETE, FAILED)
- Relationships: Build → many Parts, Build → many TestRuns
- Scalars: DateTime, JSON, UUID

### Resolver Implementation
```typescript
// backend-graphql/src/resolvers/Query.ts
export const Query = {
  build: async (_, { id }, context) => {
    const build = await context.prisma.build.findUnique({ where: { id } })
    return build
  }
}

// backend-graphql/src/resolvers/Build.ts
export const Build = {
  parts: async (build, _, context) => {
    // Use DataLoader to batch-load parts for all builds in this request
    return context.buildPartLoader.load(build.id)
  },
  testRuns: async (build, _, context) => {
    return context.buildTestRunLoader.load(build.id)
  }
}
```

### DataLoader for N+1 Prevention
- **Problem**: Loading 50 builds with nested parts = 1 query for builds + 50 queries for parts = 51 total (N+1 issue)
- **Solution**: Use DataLoader to batch the 50 part queries into 1 query
```typescript
// backend-graphql/src/dataloaders/index.ts
const buildPartLoader = new DataLoader(async (buildIds) => {
  const parts = await context.prisma.part.findMany({
    where: { buildId: { in: buildIds } }
  })
  return buildIds.map(id => parts.filter(p => p.buildId === id))
})
```

### Mutations with Event Emission
- After mutations, emit events to Express backend for real-time updates
```typescript
export const Mutation = {
  createBuild: async (_, args, context) => {
    const build = await context.prisma.build.create({ data: args.input })
    
    // Emit event to Express for real-time notification
    await context.eventBus.emit('buildCreated', {
      buildId: build.id,
      build: build
    })
    
    return build
  }
}
```

### Error Handling
- Validate input before mutation
- Return meaningful error messages
- Use GraphQL error extensions for type safety

### Testing
- Use Apollo `@apollo/client/testing` for MockedProvider in frontend tests
- Write resolver tests with Prisma test database
- Mock DataLoader batches
- Test event emission to Express

---

## 🔄 Workflow Commands

```bash
# Development
pnpm dev:graphql               # Start Apollo Server (port 4000)
pnpm dev                       # Start all services

# GraphQL IDE (manual testing)
# Visit: http://localhost:4000/graphql
# Try queries/mutations interactively with auto-complete

# Testing
pnpm test:graphql              # Run GraphQL resolver tests
pnpm test:graphql --watch      # Watch mode
pnpm test:graphql --run        # Single run (CI mode)

# Database
pnpm migrate                    # Run pending Prisma migrations
pnpm migrate:reset              # Reset database (dev only)
pnpm seed                       # Seed sample data

# Quality
pnpm lint                       # ESLint check
pnpm type-check                 # TypeScript strict mode
```

---

## 📋 Implementation Checklist

When implementing a GraphQL feature:

- [ ] **Schema**: Update `src/schema.graphql` with new types/fields
- [ ] **Resolvers**: Implement Query/Mutation/Field resolvers
- [ ] **DataLoader**: Use batch loading for nested relationships
- [ ] **Event Emission**: Emit events after mutations (to Express)
- [ ] **Validation**: Validate input args before mutation
- [ ] **Testing**:
  - Unit tests for resolvers
  - DataLoader batch tests
  - Event emission verification
- [ ] **Quality Checks** (automated per Issue #306):
  - `pnpm test:graphql --run` — All tests pass
  - `pnpm lint` — No ESLint violations
  - `pnpm type-check` — TypeScript strict mode
- [ ] **Logs**: Capture output to `docs/dev-note/issue-#[N]-pnpm-*.txt`
- [ ] **PR**: Reference GraphQL schema changes and resolver logic

---

## 🛠️ Common Tasks

### Adding a New Resolver
```typescript
// Step 1: Add to schema.graphql
type Query {
  builds: [Build!]!
}

// Step 2: Implement in resolvers/Query.ts
export const Query = {
  builds: async (_, __, context) => {
    return context.prisma.build.findMany()
  }
}

// Step 3: Test with GraphiQL
query {
  builds { id status parts { id } testRuns { id result } }
}
```

### Adding DataLoader
```typescript
// backend-graphql/src/dataloaders/index.ts
import DataLoader from 'dataloader'

export function createDataLoaders(prisma) {
  return {
    buildPartLoader: new DataLoader(async (buildIds) => {
      const parts = await prisma.part.findMany({
        where: { buildId: { in: buildIds } }
      })
      return buildIds.map(id => parts.filter(p => p.buildId === id))
    })
  }
}

// Then in context:
context.buildPartLoader = buildPartLoader
```

### Emitting Real-Time Events
```typescript
// After creating a build in mutation
await context.eventBus.emit('buildCreated', {
  buildId: build.id,
  build: build,
  timestamp: new Date().toISOString()
})
```

---

## 🐛 Debugging

### GraphiQL IDE (Interactive Testing)
Visit `http://localhost:4000/graphql` and test:

```graphql
query GetBuilds {
  builds {
    id
    status
    parts { id name }
    testRuns { id result completedAt }
  }
}

mutation CreateBuild($input: BuildInput!) {
  createBuild(input: $input) {
    id
    status
  }
}
```

### DataLoader Debugging
```typescript
// Enable batch logging
const buildPartLoader = new DataLoader(
  async (buildIds) => {
    console.log(`[DataLoader] Batching ${buildIds.length} build IDs`)
    // ...
  }
)
```

### Event Emission Testing
```bash
# Listen to events on Express
curl -N http://localhost:5000/events

# In another terminal, trigger mutation
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBuild(input: {name: \"Test\"}) { id } }"}'
```

---

## 📖 Key Files

| File | Purpose |
|------|---------|
| `backend-graphql/src/schema.graphql` | GraphQL SDL type definitions (Build, Part, TestRun) |
| `backend-graphql/src/resolvers/` | Query, Mutation, Field resolvers |
| `backend-graphql/src/dataloaders/index.ts` | DataLoader instances for batch loading |
| `backend-graphql/src/server.ts` | Apollo Server setup with DataLoaders in context |
| `backend-graphql/src/__tests__/` | Resolver unit tests |

---

## 🔗 Integration Points

### Frontend ← GraphQL
- Apollo Client caches results
- Subscriptions for real-time updates (optional)
- Optimistic mutations update cache locally

### GraphQL → Express (Events)
- Mutations emit events to Express via HTTP POST
- Events streamed to frontend via Server-Sent Events (SSE)
- Real-time notification flow: GraphQL → Express → Frontend

### Database
- Prisma ORM for type-safe queries
- PostgreSQL for persistence
- DataLoader prevents N+1 queries

---

## ✅ Quality Gate (Issue #306 Automation)

All quality checks run **without user confirmation**:

```bash
pnpm test:graphql --run        # ✓ Tests pass
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

### "N+1 query detected" (in tests/console)
- **Problem**: Loading 50 builds, then querying parts for each = 51 queries
- **Solution**: Use DataLoader to batch-load all parts in 1 query

### "Event not received on frontend"
- **Problem**: GraphQL mutation emitted event, but Express didn't receive it
- **Check**: Verify `EXPRESS_EVENT_URL` in `.env` points to correct Express endpoint
- **Default**: `EXPRESS_EVENT_URL=http://localhost:5000/events/emit`

### "GraphiQL not loading"
- **Problem**: Apollo Server not running or port not accessible
- **Solution**: Run `pnpm dev:graphql` and check port 4000

---

**Last Updated**: 2026-05-19  
**Pattern**: GitHub Official (path-specific instruction file with `applyTo` glob)
