---
name: backend-graphql-development-guide
description: Backend GraphQL patterns for Apollo Server, resolvers, DataLoader, event emission
applyTo: ["backend-graphql/**/*.{ts,tsx,js,graphql}"]
scope: backend-graphql
---

# Backend GraphQL Instructions (`backend-graphql/**`)

**Tech Stack**: Apollo Server 4, TypeScript, PostgreSQL, Prisma, DataLoader

---

## 🎯 Key Patterns

### GraphQL Schema Design
- Define types in `src/schema.graphql` (SDL format)
- Core types: Build, Part, TestRun (manufacturing domain)
- Use enums for status (PENDING, RUNNING, COMPLETE, FAILED)
- Relationships: Build → many Parts, Build → many TestRuns

### Resolver Implementation
```typescript
// Query resolver
export const Query = {
  build: async (_, { id }, { prisma }) =>
    prisma.build.findUnique({ where: { id } })
}

// Field resolver with DataLoader
export const Build = {
  parts: (build, _, { loaders }) => loaders.partsByBuild.load(build.id)
}
```

### DataLoader for N+1 Prevention
Use DataLoader to batch-load nested relationships. See: `.claude/patterns/dataloaders-pattern.md`

### Mutations with Event Emission
After persisting, emit events to Express for real-time updates and webhooks.
See: `.claude/patterns/event-emission-pattern.md`

### Error Handling & Validation
- Validate input before mutation (use Zod)
- Return meaningful GraphQL errors
- Use error extensions for type safety

### Testing
- Resolver tests with Prisma test database
- Mock DataLoader batches
- Verify event emission to Express

---

## 🔄 Commands

```bash
pnpm dev:graphql               # Start Apollo (port 4000)
pnpm test:graphql --run        # Tests in CI mode
pnpm migrate                   # Run pending migrations
pnpm migrate:reset             # Reset database (dev only)
pnpm lint && pnpm type-check   # Quality checks
```

---

## 📋 Implementation Checklist

When implementing a GraphQL feature:

- [ ] **Schema**: Update `src/schema.graphql` with new types
- [ ] **Resolvers**: Implement Query/Mutation/Field resolvers
- [ ] **DataLoader**: Use batch loading for nested relationships
- [ ] **Event Emission**: Emit after mutations (optional, for Express)
- [ ] **Validation**: Validate input with Zod before mutation
- [ ] **Testing**:
  - Unit tests for resolvers
  - DataLoader batch tests
  - Event emission verification
- [ ] **Quality Checks**:
  - `pnpm test:graphql --run` — All tests pass
  - `pnpm lint` — No ESLint violations
  - `pnpm type-check` — TypeScript strict mode

---

## 🛠️ Common Tasks

### Adding a New Resolver
```typescript
// Step 1: Update schema.graphql
type Query {
  builds: [Build!]!
}

// Step 2: Implement in resolvers/Query.ts
export const Query = {
  builds: (_, __, { prisma }) => prisma.build.findMany()
}

// Step 3: Test in GraphiQL at http://localhost:4000/graphql
```

### Adding DataLoader
See: `.claude/patterns/dataloaders-pattern.md`

### Emitting Events
See: `.claude/patterns/event-emission-pattern.md`

---

## 🐛 Debugging

### GraphiQL IDE
Visit `http://localhost:4000/graphql` to test queries/mutations interactively.

```graphql
query GetBuilds {
  builds {
    id
    status
    parts { id name }
    testRuns { id result completedAt }
  }
}
```

### Enable DataLoader Logging
```typescript
const loader = new DataLoader(
  async (buildIds) => {
    console.log(`[DataLoader] Batching ${buildIds.length} IDs`)
    // ...
  }
)
```

### Test Event Emission
```bash
# Terminal 1: Listen to Express events
curl -N http://localhost:5000/events

# Terminal 2: Trigger mutation
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBuild(input: {name: \"Test\"}) { id } }"}'
```

---

## 📖 Key Files

| File | Purpose |
|------|---------|
| `backend-graphql/src/schema.graphql` | GraphQL SDL type definitions |
| `backend-graphql/src/resolvers/` | Query, Mutation, Field resolvers |
| `backend-graphql/src/dataloaders/index.ts` | DataLoader instances |
| `backend-graphql/src/__tests__/` | Resolver unit tests |

---

## 🔗 Related Patterns

- `.claude/patterns/dataloaders-pattern.md`
- `.claude/patterns/event-emission-pattern.md`
- `.claude/patterns/auth-patterns.md`
- `.claude/patterns/backend-integration-pattern.md`

---

**Last Updated**: 2026-08-09
