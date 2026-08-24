# Design & Architecture Guide

Full-stack React/GraphQL application with dual-backend architecture: Apollo GraphQL for data, Express for files/webhooks.

---

## Project Structure

```
react-graphql-playground/
├── frontend/                    # Next.js 16 + React 19 + Apollo Client
│   ├── app/                     # Server/Client Components with RSC pattern
│   ├── components/              # UI components with Apollo mutations
│   ├── lib/
│   │   ├── apollo.ts            # Apollo Client setup
│   │   └── use-sse-events.ts    # SSE hook with backoff
│   └── __tests__/setup/         # Global test setup
│
├── backend-graphql/             # Apollo Server 4 + PostgreSQL
│   ├── src/
│   │   ├── schema.graphql       # GraphQL SDL
│   │   ├── resolvers/           # Query, Mutation, Field resolvers
│   │   ├── dataloaders/         # DataLoader instances
│   │   └── middleware/          # Auth, logging, tracing
│
├── backend-express/             # Express.js (files, webhooks, SSE)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── upload.ts        # POST /upload (Multer)
│   │   │   ├── webhooks.ts      # POST /webhooks/* (CI/CD, sensors)
│   │   │   └── events.ts        # GET /events (SSE broadcast)
│   │   └── middleware/          # Auth, error handling
│
├── .claude/patterns/            # Reusable pattern guides
│   ├── dataloaders-pattern.md
│   ├── server-client-components-pattern.md
│   ├── event-emission-pattern.md
│   ├── auth-patterns.md
│   ├── backend-integration-pattern.md
│   └── security-patterns.md
│
├── .github/instructions/        # Path-specific development guides
│   ├── frontend.instructions.md
│   ├── backend-graphql.instructions.md
│   ├── backend-express.instructions.md
│   └── shared.instructions.md
│
├── DESIGN.md                    # Architecture (this file)
├── CLAUDE.md                    # Getting started guide
├── AGENTS.md                    # Multi-agent orchestration
└── docs/
    ├── start-from-here.md       # 7-day practice plan
    └── ESLINT-V9-SETUP-GUIDE.md # Tooling setup
```

---

## Core Architecture: Dual-Backend Approach

### Why Two Backends?

**Separation of concerns** enables independent scaling and flexibility:

| Backend | Responsibility | Tech Stack |
|---------|-----------------|-----------|
| **Apollo GraphQL** | Structured data (Build, Part, TestRun) CRUD with type safety | Node.js + PostgreSQL + Prisma + DataLoader |
| **Express.js** | Auxiliary: file uploads, webhooks, real-time SSE streams | Node.js + Multer + PostgreSQL (shared) |

Both share PostgreSQL and authentication, operate independently.

**Rationale**:
- GraphQL: normalized schema, type safety, caching, subscriptions
- Express: simpler endpoints for async I/O, webhook ingestion, event streaming
- PostgreSQL: single source of truth for all layers
- Event bus: async coordination between backends

---

## Backend 1: Apollo GraphQL Server

**Responsibilities**:
- Query/Mutation operations on manufacturing domain (Build, Part, TestRun)
- DataLoader for N+1 prevention on nested relationships
- Event emission to Express for real-time updates
- JWT authentication and authorization
- W3C Distributed Tracing (traceparent/tracestate propagation)

**Schema** (Core Types):
```graphql
type Query {
  builds(limit: Int!, offset: Int!): [Build!]!
  build(id: ID!): Build
  testRuns(buildId: ID!): [TestRun!]!
}

type Mutation {
  createBuild(name: String!, description: String): Build!
  updateBuildStatus(id: ID!, status: BuildStatus!): Build!
  addPart(buildId: ID!, ...): Part!
  submitTestRun(buildId: ID!, ...): TestRun!
}

type Build {
  id: ID!
  name: String!
  status: BuildStatus!
  parts: [Part!]!
  testRuns: [TestRun!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum BuildStatus {
  PENDING, RUNNING, COMPLETE, FAILED
}
```

**Implementation Patterns**:
- See `.claude/patterns/dataloaders-pattern.md` for N+1 prevention
- See `.claude/patterns/auth-patterns.md` for JWT and authorization
- See `.claude/patterns/event-emission-pattern.md` for real-time coordination
- See `.github/instructions/backend-graphql.instructions.md` for resolver patterns

**Tracing Flow**:
```
Incoming traceparent header → Shared tracing middleware → Apollo plugin
→ Wrapped resolvers → Prisma spans
```

---

## Backend 2: Express.js Server

**Responsibilities**:
- File uploads (test reports, CAD files) via Multer
- Incoming webhooks (CI/CD results, sensor data)
- Real-time event broadcasting via Server-Sent Events (SSE)
- Optional: legacy or custom endpoints

**Endpoints**:
- `POST /upload` — File storage, returns downloadUrl
- `POST /webhooks/ci-results` — Receive CI test results
- `GET /events` — SSE stream with heartbeat

**Implementation Patterns**:
- See `.claude/patterns/event-emission-pattern.md` for SSE architecture
- See `.claude/patterns/backend-integration-pattern.md` for GraphQL coordination
- See `.claude/patterns/security-patterns.md` for CSRF/validation
- See `.github/instructions/backend-express.instructions.md` for routes

**Event Flow**:
```
GraphQL Mutation → Emit event to Express → Express broadcasts via SSE → Frontend receives
```

---

## Frontend: Next.js with React Server Components

**Data Fetching Strategy**:
- **Server Components**: Fetch at build/request time, pass data as props
- **Client Components**: Interactive features, Apollo mutations, SSE subscription
- **Apollo Client**: In-memory cache, optimistic updates, error handling

**Real-Time Updates**:
1. GraphQL mutation → Express broadcasts event via SSE
2. Frontend EventSource listener updates Apollo cache
3. UI reflects new data instantly (optimistic + server confirmation)

**Implementation Patterns**:
- See `.claude/patterns/server-client-components-pattern.md`
- See `.github/instructions/frontend.instructions.md` for React/Apollo patterns

**Apollo Setup**:
```typescript
// apollo.ts
export const client = new ApolloClient({
  link: authLink.concat(httpLink),  // Add JWT token
  cache: new InMemoryCache()         // Normalized cache
})
```

---

## Integration Points

### Frontend ↔ GraphQL
- Apollo Client queries/mutations to Apollo Server (port 4000)
- Authorization: JWT token in `Authorization: Bearer <token>` header
- Caching: Apollo cache for normalized data

### GraphQL ↔ Express (Event Emission)
- GraphQL mutation emits event via HTTP POST to Express
- Event: `{ type, payload, timestamp }`
- Express receives and broadcasts via SSE to frontend

### Express ↔ Frontend (Real-Time Events)
- Frontend: `new EventSource("http://localhost:5000/events")`
- Express: Broadcast via Server-Sent Events
- Automatic reconnect with exponential backoff (frontend)

### All Layers ↔ PostgreSQL
- Single shared database (Prisma ORM)
- DataLoader batch-loads to prevent N+1
- Transactions for data consistency

---

## Authentication & Authorization

**Flow**:
1. User logs in → Backend returns JWT token
2. Frontend stores JWT (localStorage for dev, httpOnly cookie for production)
3. Frontend includes JWT in `Authorization` header for all GraphQL requests
4. GraphQL middleware extracts user from JWT and adds to context
5. Resolvers check `context.currentUser` to authorize operations

**Patterns**:
- See `.claude/patterns/auth-patterns.md` for JWT validation, permission checks, resolver protection
- See `.claude/patterns/security-patterns.md` for input validation, CSRF protection, rate limiting

**Key Rules**:
- Throw UNAUTHENTICATED for missing token
- Throw FORBIDDEN for insufficient permissions
- Validate all user input before mutation
- Never log sensitive data (passwords, tokens)

---

## Testing Strategy

### Frontend (Vitest + React Testing Library)
- Mock Apollo Provider for component tests
- Mock EventSource for SSE subscription tests
- Global setup for localStorage cleanup

### GraphQL (Vitest + Prisma test database)
- Unit tests for resolvers
- DataLoader batch tests
- Event emission verification

### Express (Vitest + http mocks)
- Route handler tests
- Multer file upload tests
- SSE broadcaster tests

### Integration Tests
- Frontend → GraphQL: Apollo queries work end-to-end
- GraphQL → Express: Event emission works
- Express → Frontend: SSE broadcast works

---

## Quality Gates & Verification

All quality checks automated (no manual confirmation):
```bash
pnpm test --run && pnpm lint && pnpm type-check
```

**See**: `CLAUDE.md` → "Verify First: Quick Health Check" for detailed commands  
**See**: `DESIGN.md` → "Verify First: Architectural Compliance" for pattern verification

---

## Key Decisions & Rationale

### 1. Why Dual Backends?
- **GraphQL**: Type-safe, efficient queries, built-in caching and subscriptions
- **Express**: Simpler async I/O, webhook ingestion, event streaming
- **Together**: Separation of concerns, independent scaling, clear responsibilities

### 2. Why DataLoader?
- Prevents N+1 queries when resolving nested relationships (Build → Parts)
- Batch-loads in single database query per request
- Plugged into Apollo context, used transparently in field resolvers

### 3. Why Event Emission?
- Decouples GraphQL from Express event processing
- Enables async operations (webhooks, logging, notifications)
- Real-time frontend updates via SSE without polling

### 4. Why Next.js Server Components?
- Fetch data at request time (no client-side loading states)
- Reduce JavaScript sent to browser
- Secure: keep secrets on server
- Simple: imperative, no hooks needed for data fetching

### 5. Why Apollo Cache?
- Normalized cache prevents redundant network requests
- Optimistic mutations update cache immediately for UX
- `cache.modify()` for granular updates on SSE events

### 6. Why Single PostgreSQL?
- Single source of truth across all layers
- Transactional consistency for data integrity
- Shared authentication tables
- DataLoader and Express both read from same schema

---

## Key Implementation Patterns

### Frontend Patterns
- **Server/Client Components**: See `.claude/patterns/server-client-components-pattern.md`
- **Apollo Cache Updates**: See `.claude/patterns/apollo-mutations-pattern.md`

### Backend Patterns
- **DataLoader (N+1 Prevention)**: See `.claude/patterns/dataloaders-pattern.md`
- **Event Emission**: See `.claude/patterns/event-emission-pattern.md`
- **Authentication**: See `.claude/patterns/auth-patterns.md`
- **Security**: See `.claude/patterns/security-patterns.md`

**All patterns**: `.claude/patterns/README.md`

---

## Technology Stack

| Layer | Tech | Version | Rationale |
|-------|------|---------|-----------|
| Frontend | Next.js | 16 | RSC, App Router, built-in optimizations |
| | React | 19 | Latest features, better performance |
| | Apollo Client | 4.x | Normalized cache, optimistic updates |
| | Tailwind CSS | 4 | Utility-first, responsive, maintainable |
| GraphQL | Apollo Server | 4 | Type-safe resolvers, plugin system |
| | Prisma | 5+ | Type-safe ORM, migrations, introspection |
| | DataLoader | 2.x | N+1 prevention, batching |
| Express | Express | 4.21+ | Lightweight, async/await friendly |
| | Multer | Latest | File upload middleware |
| Database | PostgreSQL | 15+ | Relational, JSONB, indexing, ACID |
| Testing | Vitest | Latest | Fast, ESM-first, Vue/React integration |
| Linting | ESLint | v9 | Flat config, modern rules |
| Formatting | Prettier | Latest | Automatic code formatting |
| TypeScript | 5+ | Strict mode enabled |

---

## Resources & References

- [CLAUDE.md](./CLAUDE.md) — Getting started and common commands
- [AGENTS.md](./AGENTS.md) — Multi-agent orchestration patterns
- [.github/instructions/](./github/instructions/) — Path-specific development guides
- [.claude/patterns/](./claude/patterns/) — Reusable pattern documentation
- [docs/start-from-here.md](./docs/start-from-here.md) — 7-day interview prep plan

---

## Verify First: Architectural Compliance

Verify design patterns are correctly implemented:

```bash
# ✓ GraphQL resolvers use DataLoader (N+1 prevention)
grep -r "dataloader" backend-graphql/src/resolvers/ || echo "⚠ No DataLoader found"

# ✓ Apollo caching strategy in place
grep -r "cache.writeQuery\|cache.modify" frontend/src/ || echo "⚠ No Apollo mutations"

# ✓ Event system properly wired
test -f backend-express/src/routes/events.ts && echo "✓ SSE events handler exists"

# ✓ Authentication middleware in place
grep -r "requireAuth\|authMiddleware" backend-graphql/src/middleware/ || echo "⚠ No auth found"

# ✓ No performance regressions
pnpm test --run 2>&1 | grep -E "failing|passing" || echo "⚠ Check test output"

# ✓ Schema is type-safe
test -f backend-graphql/src/schema.graphql && echo "✓ Schema defined"
```

**Pattern References**:
- DataLoader batching: `.claude/patterns/dataloader-pattern.md`
- Apollo cache updates: `.claude/patterns/apollo-mutations-pattern.md`
- Event emission: `.claude/patterns/event-emission-pattern.md`
- Authentication: `.claude/patterns/auth-pattern.md`

---

**Last Updated**: 2026-08-23  
**Architecture Pattern**: Dual-backend with event coordination and shared PostgreSQL
