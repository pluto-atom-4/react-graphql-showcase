# Design & Architecture Guide

This document outlines the dual-backend architecture for building a production-ready React/GraphQL application and
interview preparation patterns.

## Project Structure

```
react-grapql-playground/
├── frontend/                           # Next.js 16 + React 19 + Apollo Client
│   ├── app/
│   │   ├── page.tsx                   # Root Server Component (dashboard)
│   │   ├── builds/
│   │   │   ├── page.tsx               # Builds list (paginated, queries Apollo)
│   │   │   └── [id]/page.tsx          # Build detail (real-time, mutations Apollo)
│   │   ├── uploads/
│   │   │   └── page.tsx               # File upload (posts to Express backend)
│   │   ├── layout.tsx                 # Root layout with Apollo provider
│   │   └── api/
│   │       └── webhooks/              # Incoming webhook handlers
│   ├── components/
│   │   ├── BuildDashboard.tsx         # Main dashboard (Apollo queries)
│   │   ├── BuildCard.tsx              # Single build card
│   │   ├── TestRunLog.tsx             # Test run results viewer
│   │   ├── StatusMutation.tsx         # Optimistic update (Apollo)
│   │   ├── FileUploader.tsx           # Upload to Express (FormData)
│   │   └── RealtimeEvents.tsx         # Listen to Express SSE/WebSocket
│   ├── lib/
│   │   ├── apollo.ts                  # Apollo Client setup
│   │   ├── graphql/
│   │   │   ├── queries.ts             # GraphQL query documents
│   │   │   └── mutations.ts           # GraphQL mutation documents
│   │   ├── hooks/
│   │   │   ├── useBuild.ts            # Custom Apollo query hook
│   │   │   └── useUpdateBuildStatus.ts # Custom Apollo mutation hook
│   │   └── api.ts                     # Fetch utilities for Express backend
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── backend-graphql/                   # Apollo Server 4 + PostgreSQL
│   ├── src/
│   │   ├── index.ts                   # Apollo Server setup
│   │   ├── schema.graphql             # GraphQL schema (SDL)
│   │   ├── resolvers/
│   │   │   ├── Query.ts               # Query field resolvers
│   │   │   ├── Mutation.ts            # Mutation field resolvers
│   │   │   ├── Build.ts               # Build type resolvers
│   │   │   └── TestRun.ts             # TestRun type resolvers
│   │   ├── dataloaders/
│   │   │   ├── buildLoader.ts         # Batch load builds (N+1 fix)
│   │   │   └── partLoader.ts          # Batch load parts
│   │   ├── db/
│   │   │   ├── schema.sql             # PostgreSQL schema
│   │   │   └── client.ts              # Database connection (Prisma/Drizzle)
│   │   └── middleware/
│   │       ├── auth.ts                # JWT validation
│   │       └── logging.ts             # Request logging
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── backend-express/                   # Express.js (file uploads, webhooks, real-time)
│   ├── src/
│   │   ├── index.ts                   # Express app setup
│   │   ├── routes/
│   │   │   ├── upload.ts              # POST /upload (file storage)
│   │   │   ├── webhooks.ts            # POST /webhooks/* (external events)
│   │   │   └── events.ts              # GET /events (SSE stream for real-time)
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT validation
│   │   │   ├── multer.ts              # File upload config
│   │   │   └── errorHandler.ts        # Error handling
│   │   ├── services/
│   │   │   ├── storage.ts             # File storage logic (S3, local, etc)
│   │   │   ├── eventBus.ts            # In-memory event bus for SSE/WebSocket
│   │   │   └── webhooks.ts            # Webhook processing (e.g., CI results)
│   │   └── db/
│   │       └── client.ts              # Optional: shared DB connection
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── docker-compose.yml                 # PostgreSQL container
├── package.json                       # Root workspace config (pnpm)
├── pnpm-workspace.yaml                # Monorepo setup
├── CLAUDE.md                          # Development guidance
├── DESIGN.md                          # Architecture (this file)
├── about-me.md                        # Interview context
└── docs/
    ├── start-from-here.md             # 7-day practice plan
    ├── version-conflict-free-stack.md # Tech stack versions
    └── boilerplate-evaluation.md      # Boilerplate choices
```

## Core Architecture: Dual-Backend Approach

### Why Two Backends?

In production systems (like Boltline), **separation of concerns** improves scalability and flexibility:

- **Apollo GraphQL**: Handles structured data (Build, Part, TestRun CRUD operations)
    - Normalized queries and mutations
    - Real-time subscriptions (if needed)
    - Type-safe API contract
    - Cached responses reduce database load

- **Express.js**: Handles auxiliary functionality
    - File uploads (test reports, CAD files)
    - Incoming webhooks (CI/CD results, sensor data)
    - Real-time event streams (Server-Sent Events or WebSocket)
    - Legacy or custom endpoints

Both backends can share the same PostgreSQL database and authentication, but operate independently.

---

## Backend 1: Apollo GraphQL Server + PostgreSQL

**Purpose**: Provide a GraphQL API for Build, Part, TestRun CRUD operations.

**Responsibilities**:

- Query/mutation operations on manufacturing domain
- DataLoader for efficient N+1 prevention ✅
- Error handling and validation
- Authorization checks (planned)
- Emit events to Express event bus for real-time updates
- Propagate request traces into operation, resolver, and Prisma spans

**Current Status**: ✅ **FUNCTIONAL** (Resolvers implemented and tested)

- Queries: `builds(limit, offset)`, `build(id)`, `testRuns(buildId)` ✅
- Mutations: `createBuild`, `updateBuildStatus`, `addPart`, `submitTestRun` ✅
- DataLoader: ✅ **Implemented** - Prevents N+1 queries when resolving nested parts and test runs
- Real-time Events: ✅ **Implemented** - GraphQL mutations emit typed events to Express
- Tracing: ✅ **Implemented** - `traceparent`/`tracestate` request headers flow through shared middleware, Apollo plugin, wrapped resolvers, and Prisma spans

### Trace Propagation

```text
Incoming traceparent header
  → packages/shared-tracing tracing middleware
  → Apollo request plugin (`graphql.query` / `graphql.mutation` span)
  → wrapped resolver spans (`graphql.field.*`)
  → Prisma and DataLoader spans (`db.prisma.*`)
```

Resolver args are serialized with circular-safe truncation and always-on redaction for sensitive keys (`password`, `token`, `authorization`, `cookie`, `secret`, `apiKey`, `passwordHash`).

### GraphQL Schema (Domain Model)

```graphql
type Query {
  builds(limit: Int!, offset: Int!): [Build!]!
  build(id: ID!): Build
  testRuns(buildId: ID!): [TestRun!]!
}

type Mutation {
  createBuild(name: String!, description: String): Build!
  updateBuildStatus(id: ID!, status: BuildStatus!): Build!
  addPart(buildId: ID!, name: String!, sku: String!, quantity: Int!): Part!
  submitTestRun(buildId: ID!, result: TestResult!): TestRun!
}

type Subscription {
  buildStatusChanged(buildId: ID!): Build!
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

type Part {
  id: ID!
  buildId: ID!
  name: String!
  sku: String!
  quantity: Int!
}

type TestRun {
  id: ID!
  buildId: ID!
  status: TestStatus!
  result: String
  fileUrl: String  # Points to Express backend file upload
  completedAt: DateTime
}

enum BuildStatus {
  PENDING
  RUNNING
  COMPLETE
  FAILED
}

enum TestStatus {
  PENDING
  RUNNING
  PASSED
  FAILED
}
```

### Resolver Implementation

```typescript
// backend-graphql/src/resolvers/Query.ts
export const queryResolvers = {
  builds: async (_, {limit, offset}, {db, dataloaders}) => {
    return db.builds.findMany({
      skip: offset,
      take: limit,
      orderBy: {createdAt: "desc"},
    });
  },

  build: async (_, {id}, {db}) => {
    return db.builds.findUnique({where: {id}});
  },
};

// backend-graphql/src/resolvers/Mutation.ts
export const mutationResolver = {
  Mutation: {
    async updateBuildStatus(_parent, args: { id: string; status: string }, context) {
      const updated = await context.prisma.build.update({
        where: {id: args.id},
        data: {status: args.status as BuildStatus},
      })

      // CURRENTLY: Emits to console.log (TODO: Wire to Express event bus)
      emitEvent('buildStatusChanged', {buildId: updated.id, build: updated})

      return updated
    },
  },
}

/**
 * emitEvent: Stub function (currently logs to console)
 * TODO: Implement with Redis pub/sub or HTTP POST to Express
 *
 * Production options:
 * 1. Redis Pub/Sub: await redis.publish('buildStatusChanged', JSON.stringify(event))
 * 2. HTTP Webhook: await fetch('http://localhost:5000/webhook/events', { method: 'POST', body })
 * 3. Shared EventEmitter: import { eventBus } from '../services/event-bus'
 */
function emitEvent(eventName: string, payload: any) {
  console.log(`[EVENT] ${eventName}:`, JSON.stringify(payload))
  // TODO: Send to Express event bus
}

// backend-graphql/src/resolvers/Build.ts
export const buildResolvers = {
  Build: {
    parts: (parent, _, {loaders}) =>
      loaders.partLoader.load(parent.id),

    testRuns: (parent, _, {loaders}) =>
      loaders.testRunLoader.load(parent.id),
  },
};
```

### DataLoader for N+1 Prevention

**Status**: ✅ **IMPLEMENTED**

DataLoader prevents N+1 queries by batching database requests within a single GraphQL request.

#### Backend Setup: Creating Loaders

```typescript
// backend-graphql/src/dataloaders/index.ts (ACTUAL IMPLEMENTATION)
import DataLoader from 'dataloader';
import { PrismaClient, Part, TestRun } from '@prisma/client';

/**
 * BuildPartLoader prevents N+1 queries when resolving parts for multiple builds.
 *
 * Example without DataLoader (N+1 problem):
 *   - Query: builds(limit: 100)          → 1 query for 100 builds
 *   - Resolver: build.parts              → 100 queries (one per build!)
 *   - Total: 101 queries
 *
 * Example with DataLoader (batch query):
 *   - Query: builds(limit: 100)          → 1 query for 100 builds
 *   - Resolver: buildLoader.load(id)     → batches into 1 query for all parts
 *   - Total: 2 queries
 */
export function createBuildPartLoader(prisma: PrismaClient) {
  return new DataLoader(async (buildIds: readonly string[]) => {
    const parts = await prisma.part.findMany({
      where: { buildId: { in: buildIds as string[] } },
    });

    // Group parts by buildId and return in same order as buildIds
    const partsByBuildId: Record<string, typeof parts> = {};
    parts.forEach((part) => {
      if (!partsByBuildId[part.buildId]) {
        partsByBuildId[part.buildId] = [];
      }
      partsByBuildId[part.buildId].push(part);
    });

    return buildIds.map((buildId) => partsByBuildId[buildId] || []);
  });
}

/**
 * TestRunLoader prevents N+1 queries when resolving test runs for multiple builds.
 */
export function createBuildTestRunLoader(prisma: PrismaClient) {
  return new DataLoader(async (buildIds: readonly string[]) => {
    const testRuns = await prisma.testRun.findMany({
      where: { buildId: { in: buildIds as string[] } },
      orderBy: { createdAt: 'desc' },
    });

    const testRunsByBuildId: Record<string, typeof testRuns> = {};
    testRuns.forEach((testRun) => {
      if (!testRunsByBuildId[testRun.buildId]) {
        testRunsByBuildId[testRun.buildId] = [];
      }
      testRunsByBuildId[testRun.buildId].push(testRun);
    });

    return buildIds.map((buildId) => testRunsByBuildId[buildId] || []);
  });
}

export interface DataLoaders {
  buildPartLoader: DataLoader<string, Part[]>;
  buildTestRunLoader: DataLoader<string, TestRun[]>;
}

export function createLoaders(prisma: PrismaClient): DataLoaders {
  return {
    buildPartLoader: createBuildPartLoader(prisma),
    buildTestRunLoader: createBuildTestRunLoader(prisma),
  };
}
```

#### Server Context: Providing Loaders Per Request

```typescript
// backend-graphql/src/index.ts
const server = new ApolloServer<BuildContext>({
  typeDefs,
  resolvers,
});

// In the context function, create fresh loaders for each request
app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => {
      const loaders = createLoaders(prisma);
      return {
        user: extractUserFromToken(req.headers.authorization as string),
        prisma,
        buildPartLoader: loaders.buildPartLoader,
        buildTestRunLoader: loaders.buildTestRunLoader,
      };
    },
  })
);
```

#### Resolver Usage: Calling Loaders

```typescript
// backend-graphql/src/resolvers/Build.ts
export const buildResolver = {
  Build: {
    async parts(parent: BuildParent, _args: unknown, context: GraphQLContext) {
      // DataLoader batches all .load() calls in this request into a single query
      return context.buildPartLoader.load(parent.id);
    },

    async testRuns(parent: BuildParent, _args: unknown, context: GraphQLContext) {
      return context.buildTestRunLoader.load(parent.id);
    },
  },
};
```

**How It Works**:

1. **Per-Request Loaders**: Fresh DataLoader instances are created for each GraphQL request
2. **Batching Within Request**: All `loader.load(id)` calls within a single request are collected
3. **Single DB Query**: Before resolving, DataLoader executes ONE query with all collected IDs
4. **Automatic Cleanup**: After the request completes, loaders are discarded (prevents stale cache)

**Interview Talking Point**:
> "DataLoader prevents N+1 queries by batching related queries together. If a dashboard loads 50 builds with nested parts and test runs, DataLoader combines 50 individual queries into a single database query using `IN` clauses—reducing database round trips from 1+50M to 1+1."

---

## Backend 2: Express.js Server (Files, Webhooks, Real-time)

**Purpose**: Handle file uploads, incoming webhooks, and real-time event streaming.

**Responsibilities**:

- ✅ File upload endpoint with storage (S3, local, etc.)
- ✅ Webhook handlers for external events (CI/CD, sensors)
- ✅ Server-Sent Events (SSE) for real-time notifications
- 🔴 Connect to GraphQL mutations (BLOCKED - Issue #7: emitEvent() is stub only)

**Current Status**: ✅ **PRODUCTION READY** (54/54 tests passing)

- File uploads with MIME type whitelist ✅
- Webhook handlers for CI results and sensor data ✅
- SSE streaming to frontend with heartbeat and cleanup ✅
- Event bus with typed methods (emitFileUploaded, emitCIResults, emitSensorData) ✅
- Error handling with AppError wrapper ✅
- Auth middleware prepared for JWT validation ✅

### Endpoints

```
POST   /upload               # Upload test report, design file, etc.
POST   /webhooks/ci-results  # Receive test results from CI system
POST   /webhooks/sensor-data # Receive manufacturing sensor data
GET    /events               # Server-Sent Events stream (real-time)
GET    /health               # Health check
```

### File Upload Handler

**Status**: ✅ **COMPLETE & TESTED**

```typescript
// backend-express/src/routes/upload.ts (ACTUAL IMPLEMENTATION)
import multer from "multer";
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_MIME_TYPES = [
  "text/plain", "text/csv", "application/json", "application/xml",
  "application/pdf", "image/png", "image/jpeg",
  "application/zip", "application/gzip"
];

// Multer configuration with disk storage
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      const fileId = uuidv4();
      const ext = path.extname(file.originalname);
      cb(null, `${fileId}${ext}`);
    },
  }),
  limits: {fileSize: 50 * 1024 * 1024}, // 50MB
  fileFilter: (_req, file, cb) => {
    // ✅ MIME type validation (Issue #19 resolved)
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

router.post("/", upload.single("file"), async (req, res) => {
  const fileId = path.parse(req.file.filename).name;

  // ✅ Emit event to event bus for SSE broadcast
  eventBus.emitFileUploaded({
    fileId,
    buildId: req.body.buildId,
    fileName: req.file.originalname,
  });

  res.json({
    fileId,
    fileName: req.file.originalname,
    url: `/files/${req.file.filename}`,
  });
});
```

**Key Features**:

- ✅ UUID filenames prevent collisions
- ✅ MIME type whitelist (PDF, XLSX, images, archives)
- ✅ File size limit (50MB)
- ✅ Extension validation
- ✅ Events emitted to SSE subscribers
- ✅ Error handling with proper HTTP status codes

### Webhook Handler

**Status**: ✅ **COMPLETE & TESTED**

```typescript
// backend-express/src/routes/webhooks.ts (ACTUAL IMPLEMENTATION)
import { Router } from "express";
import { eventBus } from "../services/event-bus";

router.post("/ci-results", async (req, res) => {
  const {buildId, status, testsPassed, testsFailed} = req.body;

  try {
    // Validate input
    if (!buildId || !status) {
      return res.status(400).json({error: "buildId and status required"});
    }

    // Emit to event bus for real-time subscribers
    eventBus.emitCIResults({
      buildId,
      status,
      testsPassed,
      testsFailed,
    });

    res.json({success: true});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

router.post("/sensor-data", async (req, res) => {
  const {buildId, sensorType, value} = req.body;

  try {
    eventBus.emitSensorData({
      buildId,
      sensorType,
      value,
    });

    res.json({success: true});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});
```

**Current Limitations**:

- ✅ Emits to local SSE subscribers only
- 🔴 Does NOT call Apollo mutations (blocked by Issue #7)
- 🔴 No verification of webhook signatures (security enhancement)

### Real-time Events (Server-Sent Events)

**Status**: ✅ **COMPLETE & PRODUCTION READY**

```typescript
// backend-express/src/routes/events.ts (ACTUAL IMPLEMENTATION)
import { Router, Request, Response } from "express";
import { eventBus } from "../services/event-bus";

const connectedClients: Set<Response> = new Set();

router.get("/", (_req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Track client and send connection message
  connectedClients.add(res);
  res.write(`data: ${JSON.stringify({
    type: "connected",
    clientId: uuidv4(),
    timestamp: new Date().toISOString(),
  })}\n\n`);

  // ✅ Send keep-alive heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (res.writable) {
      res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
    } else {
      clearInterval(heartbeat);
      connectedClients.delete(res);
    }
  }, 30000);

  // Clean up on disconnect
  res.on("close", () => {
    clearInterval(heartbeat);
    connectedClients.delete(res);
  });
});

// ✅ Broadcast events to all connected clients
eventBus.on("fileUploaded", (data) => {
  broadcastEvent("fileUploaded", data);
});

eventBus.on("ciResults", (data) => {
  broadcastEvent("ciResults", data);
});

eventBus.on("sensorData", (data) => {
  broadcastEvent("sensorData", data);
});

function broadcastEvent(eventType: string, data: unknown) {
  const message = {type: eventType, data, timestamp: new Date().toISOString()};

  connectedClients.forEach((client) => {
    if (client.writable) {
      client.write(`event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`);
    } else {
      connectedClients.delete(client);
    }
  });
}
```

**Key Features**:

- ✅ SSE connection established with unique clientId
- ✅ Heartbeat every 30s to prevent connection timeout
- ✅ Proper cleanup on client disconnect
- ✅ Broadcasts to all connected clients
- ✅ CORS headers set for cross-origin clients
- ✅ Three event types supported: fileUploaded, ciResults, sensorData

---

## Frontend Integration

**Current Status**: 🔴 **INCOMPLETE - 18 ISSUES IDENTIFIED** (See Implementation Roadmap below)

**Blockers**:

- Apollo Client singleton pattern broken (recreated on each render) - Issue #23
- TypeScript compilation broken (missing GraphQL code generation) - Issue #24
- Server Components not implemented - Issue #26
- Real-time event listener connected but GraphQL mutations can't emit events - Issue #7
- JWT authentication not wired across layers - Issue #27
- ⚠️ **CRITICAL**: Backend JWT validation has security issues - Issue #123 (follow-up to #118)
  - Context factory crashes on invalid JWT (DoS vulnerability)
  - Missing JWT id field type validation
  - Type inconsistencies in DataLoaders interface

### Frontend Data Fetching Patterns & Apollo Client Strategy

Next.js 13+ with React 19 combines **Server Components** and **Client Components** to optimize initial load time and user interactivity. Apollo Client configuration differs significantly between these contexts:

#### Architecture Overview: Three Data Fetching Layers

```
┌──────────────────────────────────────────────────────────┐
│ Server Request (Node.js Runtime)                         │
├──────────────────────────────────────────────────────────┤
│ 1. Server Component (async)                              │
│    ├─ getClient() [apollo-client-server-registered]      │
│    ├─ Fresh cache per request                            │
│    └─ Fetches initial data → passes to Client Component  │
│                                                           │
│ 2. Streaming HTML Response to Browser                    │
│    └─ Includes initial props (hydration data)            │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ Client Runtime (Browser)                                 │
├──────────────────────────────────────────────────────────┤
│ 3. Client Component (interactive)                        │
│    ├─ makeClient() [apollo-client] with useMemo          │
│    ├─ Singleton cache persists across renders            │
│    ├─ Mutations update cache immediately                 │
│    └─ Real-time events refresh via SSE listener          │
└──────────────────────────────────────────────────────────┘
```

#### Why Two Apollo Configurations?

**Server-Side: `apollo-client-server-registered.ts`**

Uses `registerApolloClient()` from `@apollo/client-integration-nextjs`:
- **Fresh cache per request**: Prevents data leaking between different users
- **Automatic per-request isolation**: Built-in by Apollo's official integration
- **Security**: No singleton cache means no accidental cross-request contamination
- **Example use case**: Server Component needs to fetch initial Builds list for dashboard

**Client-Side: `apollo-client.ts` (with `useMemo` wrapper)**

Simple singleton factory wrapped in `useMemo`:
- **Persistent cache across renders**: Critical for state management and UX
- **Optimistic updates**: Mutations show instant feedback before server confirms
- **Real-time subscriptions**: SSE listeners and WebSocket connections stay active
- **Example use case**: Client Component mutates build status, cache updates immediately, UI shows "✓ Complete" instantly

#### Decision Tree: Which Configuration to Use?

```
┌─ Is this a Server Component (async, top-level)?
│  YES → Use registerApolloClient (apollo-client-server-registered.ts)
│        const client = getClient()
│        const { data } = await client.query({ query: GET_BUILDS })
│        return <BuildsList builds={data.builds} />  // Pass data as props
│
└─ Is this a Client Component ('use client')?
   YES → Use makeClient with useMemo (apollo-client.ts)
         const client = useMemo(() => makeClient(), [])
         // Use hooks: useQuery, useMutation, useSubscription
```

#### Best Practices by Context

**Server Components (per-request Apollo client)**
```typescript
// ✅ DO: Fetch in async Server Component
import { getClient } from '@/lib/apollo-client-server-registered'
import { BUILDS_QUERY } from '@/lib/graphql-queries'

export default async function BuildsPage() {
  const client = getClient()
  const { data } = await client.query({ query: BUILDS_QUERY })
  
  // Pass to Client Component (no double-fetch on hydration)
  return <BuildList initialBuilds={data.builds} />
}

// ❌ DON'T: Use client-side hooks in Server Component
// ❌ DON'T: Create multiple getClient() instances (reuse single client per render)
```

**Client Components (singleton Apollo client)**
```typescript
'use client'
import { useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { makeClient } from '@/lib/apollo-client'

export function BuildList({ initialBuilds }: { initialBuilds: Build[] }) {
  // ✅ DO: Create singleton client once with useMemo
  const client = useMemo(() => makeClient(), [])
  
  // ✅ DO: Use hooks inside Client Component
  const { data, refetch } = useQuery(BUILDS_QUERY)
  
  // ✅ DO: Use mutations with optimistic updates
  const [updateStatus] = useMutation(UPDATE_STATUS, {
    optimisticResponse: { updateBuild: { id, status: 'COMPLETE' } }
  })
  
  return (
    // Component JSX
  )
}

// ❌ DON'T: Call makeClient() on every render (do it in useMemo)
// ❌ DON'T: Try to use server-side getClient() in Client Component
```

#### Data Flow & Hydration Strategy

**Goal**: Avoid double-fetching (server + client) on page load

```typescript
// 1. SERVER COMPONENT - Fetch initial data
export default async function Page() {
  const client = getClient()
  const { data } = await client.query({ query: GET_BUILDS })
  
  // 2. PASS AS PROPS to Client Component
  return <BuildsClient initialBuilds={data.builds} />
}

// 3. CLIENT COMPONENT - Use passed data, handle mutations
'use client'
export function BuildsClient({ initialBuilds }: { initialBuilds: Build[] }) {
  const client = useMemo(() => makeClient(), [])
  const [builds, setBuilds] = useState(initialBuilds)
  
  // 4. Mutations update local state immediately (optimistic)
  const [updateStatus] = useMutation(UPDATE_STATUS, {
    onCompleted: (data) => {
      setBuilds(builds.map(b => b.id === data.updateBuild.id ? data.updateBuild : b))
    }
  })
  
  return <BuildList builds={builds} onStatusChange={updateStatus} />
}
```

**Why not query in Client Component on mount?**
- ❌ Double-fetch: Server renders with data, then client fetches again
- ❌ Slower perceived performance (loading spinner after SSR)
- ❌ Wastes bandwidth (fetches same data twice)

**Why pass data as props?**
- ✅ Single fetch (server only)
- ✅ Instant rendering (no loading state on first paint)
- ✅ Bandwidth efficient
- ✅ Better SEO (server renders full HTML content)

#### Apollo Client Configuration Details

**Client-Side Configuration (`apollo-client.ts`)**:
```typescript
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    // Detects if server or client automatically
    ssrMode: typeof window === 'undefined',
    
    // Fresh cache, but wrapped in useMemo so it's shared across renders
    cache: new InMemoryCache(),
    
    // HTTP link to GraphQL endpoint
    link: new HttpLink({
      uri: graphqlUrl,
      // Include cookies/auth headers
      credentials: 'include',
    }),
  })
}
```

**Server-Side Configuration (`apollo-client-server-registered.ts`)**:
```typescript
import { registerApolloClient } from '@apollo/client-integration-nextjs'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

// registerApolloClient ensures fresh client per request
export const { getClient } = registerApolloClient(() => {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    // Always true for server rendering
    ssrMode: true,

    // Fresh cache per request (prevents cross-request pollution)
    // Apollo's registerApolloClient handles this automatically
    cache: new InMemoryCache(),

    link: new HttpLink({
      uri: graphqlUrl,
      // Server context includes cookies/auth headers
      credentials: 'include',
    }),
  })
})
```

#### Cache Management Strategy

| Aspect | Server Cache | Client Cache |
|--------|--------------|--------------|
| **Lifecycle** | Per HTTP request | Per browser session |
| **Shared?** | Isolated (fresh each request) | Singleton (shared across renders) |
| **Data persistence** | Garbage collected after response | Lives until page reload |
| **Mutations** | Fetch fresh data, send response | Update cache, mutations update immediately |
| **Risk** | None (fresh cache) | Cache pollution if not careful |
| **Usage** | Initial page load | User interactions, mutations, subscriptions |

#### Real-Time Event Handling with Apollo Cache

When Express emits real-time events (SSE), update Apollo cache:

```typescript
'use client'
import { useEffect } from 'react'
import { useApolloClient } from '@apollo/client'

export function RealtimeListener() {
  const client = useApolloClient()  // Get singleton client

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/events')

    eventSource.addEventListener('buildStatusChanged', (event) => {
      const { buildId, status } = JSON.parse(event.data)

      // Update Apollo cache (invalidates related queries)
      client.cache.evict({ fieldName: 'builds' })
      client.cache.evict({ fieldName: `build:${buildId}` })
      client.cache.gc()

      // Or: Update specific query cache
      client.cache.writeQuery({
        query: BUILD_DETAIL_QUERY,
        variables: { id: buildId },
        data: { build: { id: buildId, status, __typename: 'Build' } }
      })
    })

    return () => eventSource.close()
  }, [client])

  return null
}
```

#### Frontend Impact of Backend DataLoaders

The frontend doesn't explicitly call DataLoaders, but **benefits significantly from them when querying nested data**.

**How it works**:

When the frontend executes a query with nested relationships, the backend uses DataLoaders to prevent N+1 queries:

```typescript
// frontend/lib/graphql-queries.ts
export const BUILD_DETAIL_QUERY = gql`
  query GetBuildDetail($id: ID!) {
    build(id: $id) {
      id
      name
      status
      parts {                  # These trigger DataLoader on backend
        id
        name
        sku
      }
      testRuns {               # These also trigger DataLoader on backend
        id
        status
        result
      }
    }
  }
`;
```

**Frontend usage** (transparent to the developer):

```typescript
// frontend/lib/apollo-hooks.ts
export function useBuildDetail(buildId: string) {
  const { data, loading, error, refetch } = useQuery<{ build: BuildDetail }>(
    BUILD_DETAIL_QUERY,
    { variables: { id: buildId } }
  );
  
  // Apollo caches the full nested result (build + parts + testRuns)
  return {
    build: data?.build,
    loading,
    error,
    refetch,
  };
}
```

**Performance benefit on frontend**:

When loading a dashboard with multiple builds and their nested data:

```typescript
// Server-side: Fetch initial builds with parts and test runs
export default async function Dashboard() {
  const client = getClient();
  const { data } = await client.query({
    query: gql`
      query GetDashboard {
        builds(limit: 50, offset: 0) {
          id
          name
          status
          parts { id name }         # DataLoader prevents 50 part queries
          testRuns { id status }    # DataLoader prevents 50 test run queries
        }
      }
    `
  });
  
  // Backend executes:
  // 1. SELECT * FROM builds LIMIT 50           (1 query)
  // 2. SELECT * FROM parts WHERE buildId IN(...) (batched by DataLoader, 1 query)
  // 3. SELECT * FROM testRuns WHERE buildId IN(...) (batched by DataLoader, 1 query)
  // Total: 3 queries instead of 101!
  
  return <BuildsDashboard initialBuilds={data.builds} />;
}
```

**Cache behavior**:

- Apollo Client caches the entire nested query result
- If the dashboard loads 50 builds with parts and testRuns, **the whole tree is cached**
- Subsequent queries for the same data use cache (no network request)
- Mutations that update a build invalidate its cache entry, forcing a re-fetch

**When DataLoader matters most**:

1. ✅ **Dashboard with many builds**: 50 builds × (parts + testRuns) requires DataLoader
2. ✅ **List pages with nested data**: Loading multiple items with relationships
3. ✅ **Batch operations**: When a single query returns many root-level items

**When it doesn't matter**:

- ❌ Single item queries (e.g., get one build by ID): Only 1-3 queries anyway
- ❌ Flat queries without nesting: No N+1 risk
- ❌ Pagination without nesting: Each page is independent

#### Performance Implications

| Metric | Server Components | Client Components |
|--------|-------------------|-------------------|
| **First Paint** | ✅ Faster (HTML from server) | ⚠️ Slower (JS downloads first) |
| **Interactive** | ⚠️ Slower (wait for JS) | ✅ Faster (already rendering) |
| **Bundle Size** | ✅ Smaller (no Apollo Client) | ⚠️ Larger (full Apollo Client) |
| **API Calls** | ⚠️ Server calls (user sees load time) | ✅ Background fetch (don't block render) |
| **Caching** | ✅ Browser cache works | ✅ Apollo cache works |
| **SEO** | ✅ Content in HTML | ❌ Content is JavaScript |
| **Ideal For** | Initial page load, SEO | Mutations, interactive features, real-time |

**Recommendation**: Use **Server Components for data fetching, Client Components for interactivity**.

#### Common Pitfalls to Avoid

1. **Using client-side hooks in Server Components**
   ```typescript
   // ❌ WON'T WORK - Server Components can't use hooks
   export default function Page() {
     const { data } = useQuery(BUILDS_QUERY)  // Error!
   }
   
   // ✅ DO THIS - Use async/await
   export default async function Page() {
     const client = getClient()
     const { data } = await client.query({ query: BUILDS_QUERY })
   }
   ```

2. **Calling makeClient() outside useMemo in Client Components**
   ```typescript
   // ❌ WRONG - Creates new client on every render
   export function MyComponent() {
     const client = makeClient()  // New instance every render!
   }
   
   // ✅ CORRECT - Singleton via useMemo
   export function MyComponent() {
     const client = useMemo(() => makeClient(), [])
   }
   ```

3. **Double-fetching data**
   ```typescript
   // ❌ WRONG - Server fetches, then Client fetches again
   export default async function Page() {
     const client = getClient()
     const { data } = await client.query({ query: GET_BUILDS })
     
     return <BuildsClient />  // This will fetch again on mount!
   }
   
   // ✅ CORRECT - Server fetches, pass to Client
   export default async function Page() {
     const client = getClient()
     const { data } = await client.query({ query: GET_BUILDS })
     
     return <BuildsClient initialBuilds={data.builds} />  // No re-fetch
   }
   ```

4. **Forgetting SSR hydration**
   ```typescript
   // ❌ WRONG - Client cache starts empty
   const client = useMemo(() => makeClient(), [])
   
   // ✅ CORRECT - Hydrate cache with server data
   const client = useMemo(() => makeClient(), [])
   useEffect(() => {
     client.cache.writeQuery({
       query: BUILDS_QUERY,
       data: { builds: initialBuilds }
     })
   }, [])
   ```

### Apollo Client Setup

**Status**: ✅ **WORKING** (Implements singleton pattern with useMemo)

The project uses two separate Apollo Client configurations:

#### 1. Server-Side: `apollo-client-server-registered.ts`

For Server Components requiring per-request isolation:

```typescript
// frontend/lib/apollo-client-server-registered.ts
import { registerApolloClient } from '@apollo/client-integration-nextjs'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

export const { getClient } = registerApolloClient(() => {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    ssrMode: true,
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: graphqlUrl,
      credentials: 'include',
    }),
  })
})
```

**Usage in Server Component**:
```typescript
import { getClient } from '@/lib/apollo-client-server-registered'
import { BUILDS_QUERY } from '@/lib/graphql-queries'

export default async function BuildsPage() {
  const client = getClient()
  const { data } = await client.query({ query: BUILDS_QUERY })
  
  return <BuildsList initialBuilds={data.builds} />
}
```

#### 2. Client-Side: `apollo-client.ts` (with useMemo wrapper)

For Client Components with persistent singleton cache:

```typescript
// frontend/lib/apollo-client.ts
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: graphqlUrl,
      credentials: 'include',
    }),
  })
}
```

**Usage in Client Component via ApolloWrapper**:
```typescript
// frontend/app/apollo-wrapper.tsx
'use client'

import { useMemo } from 'react'
import type { ReactNode, ReactElement } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import { makeClient } from '@/lib/apollo-client'
import { useSSEEvents } from '@/lib/use-sse-events'

function SSEInitializer(): ReactElement | null {
  useSSEEvents()
  return null
}

export function ApolloWrapper({ children }: { children: ReactNode }): ReactElement {
  // ✅ Singleton client via useMemo (not recreated on render)
  const client = useMemo(() => makeClient(), [])

  return (
    <ApolloProvider client={client}>
      <SSEInitializer />
      {children}
    </ApolloProvider>
  )
}
```

**Key Fix (Issue #23 - RESOLVED)**:
- ✅ `useMemo` ensures `makeClient()` is only called once
- ✅ Apollo cache persists across renders
- ✅ SSE listeners remain connected
- ✅ Performance optimized

### Uploading Files to Express

```typescript
// frontend/components/FileUploader.tsx
import { useState } from "react";

export function FileUploader({buildId}) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("buildId", buildId);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const {fileId, url} = await res.json();
      console.log("File uploaded:", url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <input
      type = "file"
  onChange = {handleUpload}
  disabled = {loading}
  />
)
  ;
}
```

### Listening to Real-time Events

**Status**: ✅ **WORKING** (But event names incomplete)

```typescript
// frontend/lib/use-sse-events.ts (CURRENT - WORKING)
'use client'

import { useApolloClient } from "@apollo/client/react";
import { useEffect, useRef } from "react";

export function useSSEEvents() {
  const client = useApolloClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || "http://localhost:5000";
    const eventSource = new EventSource(`${expressUrl}/events`);

    // ✅ Listen to Express event bus events
    eventSource.addEventListener("fileUploaded", () => {
      client.cache.evict({fieldName: "uploads"});
      client.cache.gc();
    });

    eventSource.addEventListener("ciResults", () => {
      client.cache.evict({fieldName: "builds"});
      client.cache.gc();
    });

    eventSource.addEventListener("sensorData", () => {
      client.cache.evict({fieldName: "telemetry"});
      client.cache.gc();
    });

    eventSourceRef.current = eventSource;

    return () => {
      eventSourceRef.current?.close();
    };
  }, [client]);
}
```

**Current Behavior**:

- ✅ Connects to Express SSE endpoint
- ✅ Listens for events: fileUploaded, ciResults, sensorData
- ✅ Evicts Apollo cache on events (forces refetch)
- 🔴 Issue: No buildStatusChanged event (blocked by Issue #7)

**Missing Event Flow**:

```
GraphQL Mutation (updateBuildStatus)
  ↓
  ✅ Resolver executes
  ↓
  🔴 emitEvent() is stub (console.log only)
  ↓
  ❌ Event never reaches Express event bus
  ↓
  ❌ SSE subscribers never receive buildStatusChanged event
```

---

## Implementation Roadmap & Current Status

### Project Status Summary

| Component                       | Status     | Tests   | Issues              | Notes                                          |
|---------------------------------|------------|---------|---------------------|------------------------------------------------|
| **Express Backend**             | ✅ READY    | 54/54 ✅ | #5, #16, #18, #19   | File uploads, webhooks, SSE (PROD)             |
| **GraphQL Backend**             | ✅ READY    | TBD     | #7                  | Resolvers work, DataLoaders ready, event emission TODO |
| **Frontend**                    | 🔴 BLOCKED | TBD     | #23-#40 (18 issues) | Apollo singleton broken, TS compilation broken |
| **GraphQL ↔ Express Event Bus** | 🔴 TODO    | N/A     | #7                  | Stub implementation only                       |
| **GraphQL DataLoader**          | ✅ READY    | N/A     | N/A                 | Batch loading for parts & test runs implemented |

### Critical Path to Interview-Ready (5-7 hours)

**Blocking Issues** (must fix first):

1. **Issue #23** ⚠️ HIGH: Apollo Client singleton pattern - 30 mins
2. **Issue #24** ⚠️ HIGH: TypeScript compilation - 45 mins
3. **Issue #26** ⚠️ HIGH: Server Components pattern - 1 hour
4. **Issue #27** ⚠️ MEDIUM: JWT auth wiring - 30 mins
5. **Issue #7** 🔴 CRITICAL: GraphQL → Express event bus - 1 hour

**Secondary Issues** (polish):

6. **Issue #25**: Optimistic updates for mutations - 1 hour
7. **Issue #28**: Error handling across layers - 45 mins
8. **Issue #29**: Loading states - 30 mins

**Estimated Total**: 5-7 hours to production-ready frontend

---

## Architecture Decision Log

### Design Decisions & Rationale

#### 1. Why GraphQL for Data, Express for Auxiliary?

**Decision**: Separate Apollo GraphQL and Express.js into two independent backends.

**Rationale**:

- **Scalability**: File uploads don't block GraphQL queries. Both can scale independently.
- **Clarity**: GraphQL handles structured data (CRUD), Express handles events/webhooks.
- **Pattern Match**: Production systems (Shopify, GitHub, Boltline) use this separation.
- **Interview Value**: Demonstrates understanding of separation of concerns.

**Trade-off**: Additional complexity (two processes, event wiring) vs. focused responsibility.

#### 2. Why Server-Sent Events (SSE) Instead of WebSocket?

**Decision**: Use SSE for one-directional real-time updates.

**Rationale**:

- **Simplicity**: SSE is simpler protocol than WebSocket (HTTP-based, no handshake).
- **One-directional**: Frontend only receives updates; Express doesn't need client messages.
- **Upgrade Path**: Easy to upgrade to WebSocket later if bidirectional needed.
- **Fit**: Perfect for manufacturing domain (test results, sensor data are one-way).

**Trade-off**: SSE is HTTP (browser reconnect on network change) vs. WebSocket (persistent).

#### 3. Why DataLoader for N+1 Prevention?

**Decision**: Use DataLoader to batch related queries.

**Rationale**:

- **Performance**: Reduces N+1 queries (1 + N queries becomes 1 + 1 query).
- **Example**: 50 builds with nested parts → 2 queries instead of 1 + 50 + 50×M.
- **Standard**: Apollo/GraphQL best practice, used by GitHub, Twitter, Shopify.

**Current State**: Not yet implemented (resolvers fetch directly).

#### 4. Why JWT for Authentication?

**Decision**: Stateless JWT tokens shared across Apollo and Express.

**Rationale**:

- **Stateless**: No session storage; each service validates independently.
- **Scalability**: Works with distributed microservices (each service has JWT_SECRET).
- **Standard**: Industry standard (Auth0, Firebase, GitHub use JWT).

**Current State**: Backend implementation in progress (Issue #118); **3 security issues identified** (Issue #123).

**Backend JWT Status** ⚠️:
- ✅ JWT extraction and validation middleware implemented
- ✅ All resolvers require authentication
- ❌ Context factory crashes on invalid JWT (DoS vulnerability) - Issue #123
- ❌ Missing JWT id field type validation - Issue #123
- ❌ Type inconsistencies in DataLoaders - Issue #123

**Frontend Status**: Not yet wired - blocked by Issue #123 fixes, then Issue #27.

**Proceeding Order**:
1. Fix Issue #123 (backend JWT security fixes) - 65 min total
   - Phase 1: Context factory error handling (30 min, CRITICAL)
   - Phase 2: JWT payload type validation (20 min, HIGH)
   - Phase 3: DataLoaders type consolidation (15 min, MEDIUM)
2. Implement Issue #27 (frontend auth) - depends on #123 fixes

#### 5. Why Next.js Server Components?

**Decision**: Use Server Components for data fetching, Client Components for interactivity.

**Rationale**:

- **Performance**: Server Components reduce JavaScript bundle size.
- **Security**: Secrets hidden from client (API keys, tokens).
- **Caching**: Built-in server-side caching of queries.
- **DX**: Simpler than traditional SPA patterns.

**Current State**: Not yet implemented (Issue #26).

---

## Event Flow Architecture

### Current State: Partial Event Flow

```
┌─────────────────┐
│   Frontend      │
│  (Next.js)      │
└────────┬────────┘
         │
         │ useSSEEvents()
         │ listens to
         ↓
┌─────────────────────────────────────┐
│  Express Backend                    │
│  (Port 5000)                        │
├─────────────────────────────────────┤
│  POST /upload                       │ ✅ WORKING
│  POST /webhooks/ci-results          │ ✅ WORKING
│  POST /webhooks/sensor-data         │ ✅ WORKING
│  GET  /events (SSE)                 │ ✅ WORKING
│                                     │
│  Event Bus (in-memory EventEmitter) │ ✅ WORKING
│  - emitFileUploaded()               │ ✅
│  - emitCIResults()                  │ ✅
│  - emitSensorData()                 │ ✅
└─────────────────────────────────────┘
         ↑
         │ broadcasts to
         │
    connectedClients (Set<Response>)

┌──────────────────────────────────┐
│  GraphQL Backend                 │
│  (Port 4000)                     │
├──────────────────────────────────┤
│  Query.builds()      ✅ WORKING  │
│  Mutation.createBuild()  ✅      │
│  Mutation.updateBuildStatus()    │
│         │                        │
│         └→ emitEvent()           │
│            (STUB - console.log)  │
│            🔴 BLOCKED: Issue #7  │
│                                  │
│   Should emit to Express event   │
│   bus, but doesn't (TODO)        │
└──────────────────────────────────┘
```

### Desired State: Complete Event Flow (After Issue #7)

```
GraphQL Mutation (updateBuildStatus)
    ↓
    ✅ Update database
    ↓
    📤 Emit to Express event bus
        (Option 1: Redis pub/sub)
        (Option 2: HTTP POST to Express)
        (Option 3: Shared EventEmitter via monorepo)
    ↓
    Broadcast to SSE clients via event bus
    ↓
    Frontend receives SSE event
    ↓
    Apollo cache evicted → refetch
    ↓
    UI updates with latest status
```

### Event Names (Express Event Bus)

| Event                | Emitter                    | Payload                                       | Subscribers                 |
|----------------------|----------------------------|-----------------------------------------------|-----------------------------|
| `fileUploaded`       | POST /upload               | { fileId, buildId, fileName }                 | SSE clients                 |
| `ciResults`          | POST /webhooks/ci-results  | { buildId, status, testsPassed, testsFailed } | SSE clients                 |
| `sensorData`         | POST /webhooks/sensor-data | { buildId, sensorType, value }                | SSE clients                 |
| `buildStatusChanged` | GraphQL mutation           | { buildId, status }                           | **TODO: Wire from GraphQL** |
| `buildCreated`       | GraphQL mutation           | { buildId, build }                            | **TODO: Wire from GraphQL** |
| `testRunSubmitted`   | GraphQL mutation           | { buildId, testRun }                          | **TODO: Wire from GraphQL** |

---

## Interview Talking Points (Updated)

### Point 1: Dual-Backend Architecture

> "I separate concerns into two backends: Apollo GraphQL handles structured data operations (CRUD, queries), while
> Express handles auxiliary concerns (file uploads, webhooks, real-time events). This isn't just for organization—it
> directly impacts scalability. If file uploads are slow, GraphQL queries still respond instantly. In production, each
> backend can scale independently: we might run 5 Apollo instances and 2 Express instances depending on load. This mirrors
> real systems at Shopify, GitHub, and Boltline."

### Point 2: Real-time with Server-Sent Events

> "We use Server-Sent Events for one-directional streaming because it's simpler than WebSocket—it's just HTTP with a
> persistent connection. When a CI webhook arrives with test results, we emit an event through the event bus that Express
> broadcasts to all connected frontend clients via SSE. Result: technicians see test results in <100ms without polling.
> The pattern is: webhook → event bus → SSE → Apollo cache eviction → UI refresh."

### Point 3: DataLoader for N+1 Prevention (When Implemented)

> "DataLoader batches related queries to prevent N+1 problems. If a dashboard loads 50 builds with nested parts and test
> runs, DataLoader combines 50 individual queries into a single database query using `IN` clauses. From the resolver's
> perspective: `loaders.partLoader.load(buildId)` returns a promise, but underneath, DataLoader batches all calls in that
> GraphQL request into one efficient query. Result: reducing queries from 1 + 50 + 50×M to 1 + 1."

### Point 4: TypeScript End-to-End

> "TypeScript runs end-to-end from database schema to React components. Our GraphQL schema defines the types. We
> generate TypeScript types from that schema. Frontend components use those types. This prevents entire classes of bugs—if
> the backend returns a new field, TypeScript catches it immediately in the component. No runtime surprises in
> production."

### Point 5: Event-Driven Architecture

> "GraphQL mutations don't directly call Express; instead, they emit events to a shared event bus. Express listens to
> those events and broadcasts to clients. This loose coupling means mutations don't fail if Express is slow or down—they
> still succeed in the database. The UI eventually updates when the event arrives. It's more resilient than tight
> coupling."

---

## Interview Preparation Checkpoints

### Checkpoint 1: Apollo GraphQL Mastery

- [x] Design a GraphQL schema for the Boltline domain ✅
- [x] Implement resolvers with Query and Mutation ✅
- [x] Implement resolvers with DataLoader to prevent N+1 queries ✅
- [x] Write mutations that update the database ✅
- [ ] Wire mutations to emit events to Express (TODO - Issue #7)
- [x] Test resolvers with Vitest ✅

**Current Achievement**: Schema, resolvers, and mutations are working. Event emission is stubbed.

**Interview Talking Point**:
> "I separate concerns into two backends: Apollo handles data operations with type-safe GraphQL, while Express handles
> auxiliary functions like file uploads and webhooks. This lets both scale independently and keeps each layer focused."

---

### Checkpoint 2: Express + Real-time Events

- [x] Create a file upload endpoint with MIME validation ✅
- [x] Implement webhook handlers for CI results and sensor data ✅
- [x] Build a Server-Sent Events stream for real-time notifications ✅
- [ ] Wire Express events to Apollo backend (Issue #7)

**Current Achievement**: Express backend is PRODUCTION READY with 54/54 tests passing.

**Interview Talking Point**:
> "Using Server-Sent Events for real-time updates is simpler than WebSocket for one-directional streaming. When a CI
> webhook arrives, I emit an event that subscribers receive instantly—technicians see test results without polling."

---

### Checkpoint 3: Full-Stack Integration

- [ ] Build a complete flow: create build → upload test report → listen for real-time updates (Blocked)
- [ ] Fix Apollo Client singleton pattern (Issue #23)
- [ ] Fix TypeScript compilation (Issue #24)
- [ ] Implement Server Components pattern (Issue #26)
- [ ] Fix backend JWT security issues (Issue #123) ⚠️ **CRITICAL** - must complete before #27
  - [ ] Fix context factory crash on invalid JWT
  - [ ] Add JWT payload type validation
  - [ ] Consolidate DataLoaders types
- [ ] Wire JWT authentication across layers (Issue #27) - depends on #123
- [ ] Wire GraphQL mutations to Express event bus (Issue #7)
- [ ] Write integration tests connecting frontend, Apollo, and Express

**Current Achievement**: Backend layers work independently. Frontend blocked waiting for above fixes.

**Interview Talking Point**:
> "Both backends share authentication (JWT) and a common database, but operate independently. If the file upload is
> slow, GraphQL queries still respond quickly. This architecture mirrors production systems where different concerns scale
> at different rates."

---

## Communication Between Backends

### Option A: Event Bus (In-Memory, Single Process)

```typescript
// shared/eventBus.ts
import EventEmitter from "events";

const eventBus = new EventEmitter();

// Apollo emits when data changes
eventBus.emit("build:status-changed", {buildId, status});

// Express listens and streams to clients
eventBus.on("build:status-changed", (event) => {
  broadcast
  to
  SSE
  clients
});
```

**Pros**: Simple, no network overhead
**Cons**: Only works in single process; not suitable for distributed systems

### Option B: Redis Pub/Sub (For Distributed Systems)

```typescript
// backend-graphql resolver
import redis from "redis";

const pubsub = redis.createClient();

await pubsub.publish("build:status-changed", JSON.stringify({
  buildId,
  status,
}));

// backend-express listens
const subscriber = redis.createClient();
await subscriber.subscribe("build:status-changed", (message) => {
  broadcast
  to
  SSE
  clients
});
```

**Pros**: Works across distributed services
**Cons**: Additional infrastructure (Redis)

### Option C: Direct HTTP Calls (Webhook-style)

```typescript
// Apollo resolver calls Express
await fetch("http://localhost:5000/api/build-status-changed", {
  method: "POST",
  body: JSON.stringify({buildId, status}),
});
```

**Pros**: No shared infrastructure
**Cons**: Tight coupling, requires retry logic

---

## Security Architecture: Inter-Service Communication

### Principle: All Inter-Service Communication Must Be Authenticated

**Rationale**: In a dual-backend architecture, even "internal" service-to-service communication must be authenticated to
prevent:

1. **Event Injection Attacks**: Malicious actors on the network sending fake events (e.g., false build status)
2. **Data Corruption**: Unauthorized clients modifying manufacturing state
3. **Manufacturing Incidents**: In Boltline domain, fake build status can trigger real operational decisions (rework,
   safety issues)

**Example Threat**:

```
Attacker on factory WiFi:
  POST http://localhost:5000/events/emit
  { event: "buildStatusChanged", payload: { buildId: "B123", status: "FAILED" } }

Result:
  - All technician UIs show "Build B123: FAILED"
  - Technician stops production line, initiates rework
  - Reality: Build is actually RUNNING
  - Cost: Production delay, wasted materials, safety investigation
```

### GraphQL → Express Event Bus: Shared Secret Authentication

**Pattern**: Use shared secret in Authorization header for HTTP POST from GraphQL to Express.

#### GraphQL Event Bus Service (Emitter)

```typescript
// backend-graphql/src/services/event-bus.ts
const EXPRESS_EVENT_URL =
  process.env.EXPRESS_EVENT_URL || 'http://localhost:5000/events/emit';
const EXPRESS_EVENT_SECRET =
  process.env.EXPRESS_EVENT_SECRET || 'dev-event-secret-change-in-production';

/**
 * Emit event to Express event bus with authentication
 *
 * Implementation: HTTP POST with Authorization header
 * Authentication: Bearer token (shared secret)
 * Error handling: Graceful degradation (log but don't throw)
 */
export async function emitEvent(eventName: string, payload: any): Promise<void> {
  try {
    await fetch(EXPRESS_EVENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXPRESS_EVENT_SECRET}`  // ✅ AUTH HEADER
      },
      body: JSON.stringify({
        event: eventName,
        payload,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error(`Failed to emit event '${eventName}':`, error);
    // Don't throw — event bus failures shouldn't break mutations
    // Log metrics for monitoring in production
  }
}
```

#### Express Event Endpoint (Receiver)

```typescript
// backend-express/src/routes/events.ts
import { validateEventSecret } from '../middleware/validateEventSecret';

// ✅ Protected endpoint validates shared secret
router.post(
  '/emit',
  express.json(),
  validateEventSecret,  // Middleware validates Authorization header
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {event, payload} = req.body;

    // At this point, we know the request is authenticated
    eventBus.emit(event, payload);
    res.json({ok: true, event});
  })
);
```

#### Middleware: Validate Event Secret

```typescript
// backend-express/src/middleware/validateEventSecret.ts
import { Request, Response, NextFunction } from 'express';

export function validateEventSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.EXPRESS_EVENT_SECRET}`;

  if (!authHeader || authHeader !== expectedSecret) {
    res.status(403).json({
      error: 'Forbidden: Invalid event secret',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // ✅ Request is authenticated, proceed
  next();
}
```

#### Environment Configuration

```bash
# .env (shared across services)
EXPRESS_EVENT_SECRET=prod-secret-change-in-production

# docker-compose.yml (development)
backend-express:
  environment:
    EXPRESS_EVENT_SECRET: dev-event-secret-12345

# Production deployment (e.g., Kubernetes)
backend-graphql:
  env:
    - name: EXPRESS_EVENT_SECRET
      valueFrom:
        secretKeyRef:
          name: event-bus-secret
          key: token

backend-express:
  env:
    - name: EXPRESS_EVENT_SECRET
      valueFrom:
        secretKeyRef:
          name: event-bus-secret
          key: token
```

### Standardized Event Names (Secure Contract)

To prevent injection of unrecognized events, maintain a whitelist of valid event types:

```typescript
// backend-express/src/services/eventBus.ts
export enum EventType {
  // From GraphQL mutations
  BUILD_CREATED = 'buildCreated',
  BUILD_STATUS_CHANGED = 'buildStatusChanged',
  PART_ADDED = 'partAdded',
  TEST_RUN_SUBMITTED = 'testRunSubmitted',

  // From Express webhooks
  FILE_UPLOADED = 'fileUploaded',
  CI_RESULTS = 'ciResults',
  SENSOR_DATA = 'sensorData',
}

// Validate event types in receiver
if (!Object.values(EventType).includes(req.body.event)) {
  return res.status(400).json({error: 'Invalid event type'});
}
```

### Event Payload Validation

Validate event payloads to prevent injection of arbitrary data:

```typescript
// backend-express/src/validation/eventPayloads.ts
import { z } from 'zod';

const EventSchemas = {
  buildCreated: z.object({
    buildId: z.string().uuid(),
    build: z.object({
      id: z.string().uuid(),
      status: z.enum(['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'])
    })
  }),

  buildStatusChanged: z.object({
    buildId: z.string().uuid(),
    status: z.enum(['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'])
  }),

  // ... more schemas
};

// In event receiver
function validateEventPayload(eventType: string, payload: any) {
  const schema = EventSchemas[eventType];
  if (!schema) {
    throw new Error(`Unknown event type: ${eventType}`);
  }

  return schema.parse(payload);
}
```

### Production Upgrades

**Development**: Shared secret authentication (as shown above)

**Production**: Upgrade to mutual TLS (mTLS) or API Gateway

```typescript
// Future: Kubernetes with Istio service mesh
// Both services authenticate with client certificates
// Istio enforces communication policies and encryption

// Or: API Gateway (Kong, AWS API Gateway)
// All inter-service traffic routed through gateway
// Gateway enforces authentication and rate limits
```

### Monitoring & Logging

Log all authentication events for security monitoring:

```typescript
// backend-express/src/middleware/validateEventSecret.ts
export function validateEventSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.EXPRESS_EVENT_SECRET}`;

  if (!authHeader || authHeader !== expectedSecret) {
    // ✅ Log failed authentication attempt
    console.warn('[SECURITY] Event auth failed', {
      timestamp: new Date().toISOString(),
      event: req.body?.event,
      ip: req.ip,
      authHeader: authHeader ? 'present' : 'missing'
    });

    res.status(403).json({error: 'Forbidden: Invalid event secret'});
    return;
  }

  // ✅ Log successful authentication
  console.info('[SECURITY] Event authenticated', {
    timestamp: new Date().toISOString(),
    event: req.body?.event,
    ip: req.ip
  });

  next();
}
```

### Interview Talking Point

> "In a dual-backend architecture, inter-service communication must be authenticated. When GraphQL mutations emit events
> to Express, I use a shared-secret Authorization header. This prevents event injection attacks where malicious actors
> could send fake build status updates.
>
> In development, we use a simple shared secret. In production, we'd upgrade to mutual TLS (mTLS) with a service mesh
> like Istio, or enforce authentication through an API Gateway. The pattern is the same: **verify the sender before
processing the message**.
>
> This is critical in manufacturing—fake status updates could trigger real operational decisions (rework, safety
> issues). Security shouldn't be an afterthought; it should be part of the architecture from day one."

---

## Code Quality & Linting

### ESLint v9 Setup

The project uses **ESLint v9** with a flat config format (`eslint.config.js` at repository root). This replaces the legacy `.eslintrc.js` configuration.

**Key Features**:
- **Flat Config Format**: Direct imports of plugins, explicit file patterns
- **TypeScript Support**: Full TypeScript project analysis via `projectService: true`
- **Monorepo Support**: Single config with file-based rules for each package
- **Plugin Ecosystem**: TypeScript ESLint, React, React Hooks rules

**Running ESLint**:

```bash
pnpm lint                           # Lint all packages
pnpm -F frontend lint               # Lint specific package
eslint . --ext .ts,.tsx --format json > report.json  # JSON report
```

**Adding New Rules**:

1. Identify the rule from [ESLint Docs](https://eslint.org/docs/latest/rules/), [TypeScript ESLint](https://typescript-eslint.io/rules/), or plugin docs
2. Test in `eslint.config.js` at `warn` level first
3. Review violations: `pnpm lint`
4. Fix code or adjust severity
5. Document in `CONTRIBUTING.md` and commit

**Common Issues & Solutions**:

| Issue | Cause | Solution |
|-------|-------|----------|
| "Could not find configuration files" | Missing `eslint.config.js` | Verify file exists at repo root |
| "Could not load parser" | Dependencies not installed | Run `pnpm install` |
| TypeScript compilation errors | `projectService: true` strict mode | Add explicit return types or disable projectService |
| ESLint too slow (>30s) | Full TypeScript analysis | Lint single files, or disable projectService (trades accuracy for speed) |

**IDE Integration**:

- **VS Code**: Install ESLint extension, set `editor.codeActionsOnSave.source.fixAll.eslint: true` in `.vscode/settings.json`
- **JetBrains**: Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint, enable auto-fix on save

**Full Guide**: See `docs/ESLINT-V9-SETUP-GUIDE.md` for migration details, configuration anatomy, performance tips, and troubleshooting.

---

## Testing Strategy

### Apollo Resolver Tests

```typescript
// backend-graphql/src/resolvers/__tests__/Query.test.ts
describe("Query.builds", () => {
  it("should return paginated builds", async () => {
    const resolvers = createResolvers({db: mockDb});
    const result = await resolvers.Query.builds(null, {limit: 10, offset: 0}, {
      db: mockDb,
      dataloaders: mockDataloaders,
    });
    expect(result).toHaveLength(10);
  });
});
```

### Express Route Tests

```typescript
// backend-express/src/routes/__tests__/upload.test.ts
describe("POST /upload", () => {
  it("should save file and return fileId", async () => {
    const response = await request(app)
      .post("/upload")
      .field("buildId", "123")
      .attach("file", "test.txt");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("fileId");
  });
});
```

### Frontend Integration Tests

```typescript
// frontend/__tests__/end-to-end.test.tsx
describe("Full Build Workflow", () => {
  it("should create build, upload file, and see real-time update", async () => {
    // Create build via Apollo
    // Upload file via Express
    // Listen to SSE and verify event
    const {getByText} = render(<BuildWorkflow / >);
    // assertions...
  });
});
```

---

## Frontend & Backend Authentication: JWT Implementation

JWT authentication is a critical security layer that protects the GraphQL API and ensures each user's data remains isolated. This section documents the comprehensive JWT authentication system, from frontend login form through backend token validation, with end-to-end type safety.

### Overview: JWT Authentication Flow

Authentication follows a **Fresh Per-Request Pattern** for both frontend and backend:

```
Frontend (React)                       Backend (Apollo GraphQL)
    ↓                                         ↓
1. User enters email + password    1. GraphQL context factory
2. LoginForm validates locally     2. Extracts JWT from Authorization header
3. Sends mutation to GraphQL       3. Validates JWT signature using JWT_SECRET
4. Backend generates JWT (24h)     4. Extracts userId from JWT payload
5. Frontend stores token           5. Injects fresh AuthUser object into context
6. Apollo auth link injects        6. Fresh context per request (prevents token mixing)
   Bearer header per-request
7. Subsequent requests sent        7. Resolvers check context.user for auth
   with token
```

**Key Principles**:
- **Fresh Per-Request**: Token extraction happens per GraphQL request, never globally
- **Generic Error Messages**: Login fails with "Invalid email or password" (prevents user enumeration)
- **Password Validation**: 8+ characters with letters AND numbers
- **Token Expiration**: 24-hour JWT expiration (refresh token future enhancement)
- **Type Safety**: End-to-end TypeScript from database to UI

### Frontend Authentication Architecture

#### 1. LoginForm Component: Validation & Error Handling

**File**: `frontend/components/login-form.tsx`

The LoginForm component implements comprehensive client-side validation with real-time error messages:

```typescript
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LOGIN_MUTATION } from '@/lib/graphql-queries';

interface ValidationErrors {
  email?: string;
  password?: string;
}

interface FormState {
  email: string;
  password: string;
}

export default function LoginForm() {
  const [formState, setFormState] = useState<FormState>({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const router = useRouter();
  const { login } = useAuth();

  const [loginMutation, { loading }] = useMutation<{
    login: { token: string; user: { id: string; email: string } };
  }>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const token = data?.login?.token;
      if (token) {
        login(token);
        router.push('/');
      }
    },
    onError: (error) => {
      if (error.message === 'Invalid email or password') {
        setGeneralError('Invalid email or password');
        setFormState((prev) => ({ ...prev, password: '' }));
      } else {
        setGeneralError(error.message || 'Login failed. Please try again.');
      }
    },
  });

  // Email validation: required + contains @
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!email.includes('@')) {
      return 'Enter a valid email address';
    }
    return undefined;
  };

  // Password validation: 8+ chars with letters AND numbers
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return 'Password must contain letters and numbers';
    }

    return undefined;
  };

  // Validate entire form before submission
  const validateForm = (): boolean => {
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);

    const errors: ValidationErrors = {};
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setGeneralError(null);

    // Real-time validation on-change if field was touched
    if (touched[name as keyof typeof touched]) {
      const error =
        name === 'email'
          ? validateEmail(value)
          : name === 'password'
            ? validatePassword(value)
            : undefined;

      setValidationErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    // Mark field as touched for real-time validation
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error =
      name === 'email'
        ? validateEmail(value)
        : name === 'password'
          ? validatePassword(value)
          : undefined;

    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    // Execute login mutation with email/password
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = globalThis.setTimeout(() => {
          controller.abort();
        }, 30000);

        try {
          await loginMutation({
            variables: {
              email: formState.email.toLowerCase(),
              password: formState.password,
            },
          });
        } finally {
          globalThis.clearTimeout(timeoutId);
        }
      } catch (error) {
        if (error instanceof Error) {
          setGeneralError(error.message);
        } else {
          setGeneralError('Login failed. Please try again.');
        }
      }
    })();
  };

  const isFormValid =
    !validationErrors.email && !validationErrors.password && formState.email && formState.password;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Sign In</h1>

      {/* General error message */}
      {generalError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{generalError}</p>
        </div>
      )}

      {/* Email input with inline validation */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formState.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            validationErrors.email
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="you@example.com"
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      {/* Password input with inline validation */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            validationErrors.password
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="••••••••"
        />
        {validationErrors.password && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
        )}
      </div>

      {/* Submit button with loading state */}
      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin">🔄</span>
            <span>Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
```

**Key Features**:
- **Email Validation**: Required, must contain @ symbol
- **Password Validation**: 8+ characters with both letters AND numbers
- **Real-time Validation**: On-blur first validation, then on-change after field touched
- **Inline Error Messages**: Show validation errors next to fields (not modals)
- **Loading State**: Disable inputs and show spinner during submission
- **Generic Error Messages**: "Invalid email or password" for security (no user enumeration)
- **Token Storage**: On success, receives JWT token and calls `login(token)`
- **Redirect**: After login, router redirects to home page

#### 2. AuthContext: Token Management & Session Persistence

**File**: `frontend/lib/auth-context.tsx`

The AuthContext provides token management and session persistence across page reloads:

```typescript
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  ReactElement,
  useRef,
} from 'react';

export interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // Session persistence: recover token from localStorage on app startup
  useEffect(() => {
    if (!isInitialized.current && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      setToken(storedToken);
      isInitialized.current = true;
    }
  }, []);

  const login = (newToken: string): void => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    }
  };

  const logout = (): void => {
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  };

  const value: AuthContextType = {
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Key Responsibilities**:
- **Token Storage**: Stores JWT token in React state (localStorage persisted in dev)
- **Session Persistence**: Recovers token from localStorage on app startup (prevents login loop)
- **Login Method**: Accepts token from GraphQL mutation, saves to localStorage, updates state
- **Logout Method**: Clears token from state and localStorage
- **useAuth Hook**: Exposes token, login, logout to components
- **Type Safety**: Full TypeScript types for context and hook

**Pattern**: `useAuth()` must be called within AuthProvider scope (checked with error if not)

#### 3. Apollo Auth Link: Token Injection Per-Request

**File**: `frontend/lib/apollo.ts`

The Apollo auth link injects the JWT token into every GraphQL request's Authorization header:

```typescript
import { setContext } from '@apollo/client/link/context'
import { HttpLink, ApolloClient, InMemoryCache } from '@apollo/client'

// Fresh token retrieved per GraphQL request (not globally)
// This ensures if user logs in/out between operations, new token is used
const authLink = setContext((_, { headers }) => {
  // Retrieve token fresh from localStorage per operation
  const token = localStorage.getItem('auth_token')
  
  return {
    headers: {
      ...headers,
      // Inject Bearer token if present
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  credentials: 'include',  // Send cookies with cross-origin requests
})

export const client = new ApolloClient({
  // authLink runs FIRST, then httpLink
  // This ensures every request has fresh token
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})
```

**How It Works**:
1. Before each GraphQL request, `setContext` callback is invoked
2. Retrieves token fresh from localStorage (per-operation basis)
3. Injects `Authorization: Bearer {token}` header into request
4. If no token exists, header is omitted (unauthenticated request)
5. HTTP transport layer sends request with header to Apollo server

**Why Per-Request**:
- Token might change between GraphQL operations (user logged in/out)
- Multiple concurrent operations should use same token (no race conditions)
- `setContext` is called per operation, providing fresh token injection
- Prevents stale token usage if token expired mid-operation

#### 4. App Layout: Provider Wrapping Order

**File**: `frontend/app/layout.tsx`

```typescript
import { AuthProvider } from '@/lib/auth-context'
import { ApolloWrapper } from '@/lib/apollo-wrapper'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* AuthProvider MUST wrap ApolloWrapper */}
        {/* so Apollo auth link can access useAuth context */}
        <AuthProvider>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Provider Order Matters**:
```
AuthProvider (provides useAuth + token state)
  └─ ApolloWrapper (apolloClient with auth link)
     └─ Components (can call useAuth + useQuery)
```

If reversed, Apollo auth link cannot access token from AuthContext (context not in scope).

#### 5. Protected Routes: Client-Side Auth Checks

**File**: `frontend/lib/protected-route.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  if (!token) {
    // Redirect unauthenticated users to login
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

**Pattern**:
- Wrap components that require authentication with `<ProtectedRoute>`
- If token missing, redirect to /login page
- Prevents flash of unauth content (check before render)
- Loading state optional (skeleton UI while checking token)

### Backend Authentication: GraphQL & JWT Middleware

#### 1. JWT Middleware: Token Extraction & Validation

**File**: `backend-graphql/src/middleware/auth.ts`

The JWT middleware extracts and validates JWT tokens from Authorization headers, with type-safe payload validation:

```typescript
/**
 * JWT Authentication Middleware for GraphQL
 *
 * Extracts and validates JWT tokens from Authorization headers.
 * Returns user object if valid, or null if no token provided.
 * Throws error if token is invalid or expired.
 *
 * Pattern: Authorization: Bearer <token>
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * User object extracted from JWT token
 */
export interface AuthUser {
  id: string;
  [key: string]: unknown;
}

/**
 * Type guard to validate JWT payload structure.
 * Ensures decoded token has id field that is a non-empty string.
 *
 * This prevents DoS attacks where malformed JWT payloads could crash
 * the context factory. Type validation happens before context injection.
 */
export function isValidJWTPayload(decoded: unknown): decoded is { id: string } {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'id' in decoded &&
    typeof (decoded as Record<string, unknown>).id === 'string' &&
    (decoded as Record<string, unknown>).id !== ''
  );
}

/**
 * Extract and validate JWT token from Authorization header.
 * Returns user object if token is valid, null if no token provided.
 * Throws error if token is invalid or expired.
 *
 * Handles IncomingHttpHeaders where Authorization can be string | string[] | undefined
 * (Node.js HTTP sometimes returns arrays for duplicate headers)
 */
export function extractUserFromToken(authHeader: string | string[] | undefined): AuthUser | null {
  // Handle IncomingHttpHeaders array case (multiple Authorization headers)
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  // Return null if no header or doesn't start with "Bearer "
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  // Extract token (everything after "Bearer ")
  const token = header.substring(7);

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate payload shape: must have id field that is a non-empty string
    if (!isValidJWTPayload(decoded)) {
      throw new Error('Invalid token payload: id must be a non-empty string');
    }

    return {
      id: decoded.id,
      // Include other JWT claims (but exclude iat/exp)
      ...Object.fromEntries(
        Object.entries(decoded).filter(([key]) => key !== 'iat' && key !== 'exp')
      ),
    };
  } catch (error) {
    // Provide specific error messages for different JWT failures
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Generate a JWT token for user authentication.
 * Tokens expire in 24 hours.
 *
 * Usage: const token = generateToken(user.id)
 */
export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
}
```

**Key Features**:
- **Extracts Bearer Token**: Handles `Authorization: Bearer {token}` header format
- **Type Safety**: `isValidJWTPayload()` type guard validates payload structure before use
- **Error Handling**: Specific error messages for expired vs invalid tokens (helpful for debugging)
- **Header Array Handling**: Handles Node.js edge case where headers can be arrays
- **24-Hour Expiration**: Tokens valid for 24 hours, then require re-login
- **Generic Validation**: Doesn't expose internal validation details to client

#### 2. Login Mutation Resolver

**File**: `backend-graphql/src/resolvers/Mutation.ts`

The login mutation handles password verification and JWT generation:

```typescript
async login(
  _parent: unknown,
  args: { email: string; password: string },
  context: BuildContext,
  _info: GraphQLResolveInfo
) {
  // Validate input
  if (!args.email || args.email.trim().length === 0) {
    throw new Error('email is required');
  }
  if (!args.password || args.password.length === 0) {
    throw new Error('password is required');
  }

  // Find user by email (case-insensitive)
  const user = await context.prisma.user.findUnique({
    where: { email: args.email.toLowerCase() },
  });

  if (!user) {
    // Generic error message: prevents user enumeration
    throw new Error('Invalid email or password');
  }

  // Compare plaintext password with bcrypt hash
  const passwordMatch = await bcrypt.compare(args.password, user.passwordHash);
  if (!passwordMatch) {
    // Generic error message: prevents user enumeration
    throw new Error('Invalid email or password');
  }

  // Generate JWT token (valid for 24 hours)
  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}
```

**Security Patterns**:
- **Generic Error Messages**: Returns "Invalid email or password" regardless of failure reason (prevents user enumeration)
- **Bcrypt Comparison**: Compares plaintext password against bcrypt hash (not plaintext storage)
- **Email Normalization**: Converts email to lowercase for case-insensitive lookup
- **Token Generation**: Uses `generateToken()` which signs JWT with 24-hour expiration

**Interview Talking Point**: "I use generic error messages to prevent user enumeration. If I said 'user not found' vs 'password incorrect', an attacker could probe for valid emails. Both failures return 'Invalid email or password'."

#### 3. Apollo Server Context: User Binding

**File**: `backend-graphql/src/index.ts`

The Apollo server context factory extracts JWT and injects user into resolvers:

```typescript
import { ApolloServer } from '@apollo/server'
import { extractUserFromToken } from './middleware/auth'
import { initializeDataLoaders } from './dataloaders'

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: async ({ req }) => {
    // ← Fresh context factory, called per GraphQL request
    // Extract user from JWT (or null if missing/invalid)
    let user = null;
    try {
      user = extractUserFromToken(req.headers.authorization);
    } catch (error) {
      // Token present but invalid (expired, malformed, etc)
      console.error('JWT validation error:', error);
      // Continue with user = null (resolver will check context.user)
    }

    return {
      prisma: new PrismaClient(),
      user,  // ← Fresh user per request (null if unauthenticated)
      dataloaders: initializeDataLoaders(),
    };
  },
})
```

**What This Provides to Resolvers**:
```typescript
// Inside resolver, context has user object or null
async function buildResolver(
  parent,
  args,
  context: GraphQLContext  // ← Has fresh user per-request
) {
  // Check if user authenticated
  if (!context.user) {
    throw new Error('Unauthorized');
  }

  // Fetch builds for this user only (data isolation)
  const builds = await context.prisma.build.findMany({
    where: { userId: context.user.id },
  });

  return builds;
}
```

#### 4. Protected Resolvers: Authorization Checks

**File**: `backend-graphql/src/resolvers/Query.ts`

Protected resolvers verify user authentication and ownership:

```typescript
export const queryResolvers = {
  async builds(
    _parent: unknown,
    args: { limit: number; offset: number },
    context: BuildContext,
    _info: GraphQLResolveInfo
  ) {
    // Require authentication
    if (!context.user) {
      throw new Error('Unauthorized');
    }

    // Return only this user's builds (data isolation)
    return context.prisma.build.findMany({
      where: { userId: context.user.id },
      skip: args.offset,
      take: args.limit,
      orderBy: { createdAt: 'desc' },
    });
  },

  async build(
    _parent: unknown,
    args: { id: string },
    context: BuildContext,
    _info: GraphQLResolveInfo
  ) {
    if (!context.user) {
      throw new Error('Unauthorized');
    }

    const build = await context.prisma.build.findUnique({
      where: { id: args.id },
    });

    if (!build) {
      throw new Error('Build not found');
    }

    // Verify user owns this build
    if (build.userId !== context.user.id) {
      throw new Error('Unauthorized');
    }

    return build;
  },
};
```

**Authorization Pattern**:
1. Check `context.user` exists (unauthenticated users get null)
2. Throw error if user not authenticated
3. Filter queries by `userId: context.user.id` (user only sees their data)
4. For direct lookups, verify ownership after fetch

**Interview Talking Point**: "Authorization happens at the resolver level. Even if an attacker guesses a build ID and sends a query, the resolver checks that the user owns that build. Ownership verification prevents horizontal privilege escalation."

### Password Validation Specification

**Requirement** (Issue #120, Acceptance Criterion 4):

Password must meet ALL of the following criteria:
- Minimum 8 characters
- Must contain at least one letter (A-Z, a-z)
- Must contain at least one number (0-9)

**Validation Function**:

```typescript
const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return 'Password must contain letters and numbers';
  }

  return undefined;
};
```

**Examples**:

| Password | Valid? | Reason |
|----------|--------|--------|
| `Password123` | ✅ Yes | 11 chars, has letters & numbers |
| `Password1` | ✅ Yes | 9 chars, has letters & numbers |
| `abcdefgh` | ❌ No | No numbers |
| `12345678` | ❌ No | No letters |
| `Pass1` | ❌ No | Only 5 characters |
| `P@ss123!` | ✅ Yes | 8 chars, has letters & numbers (special chars allowed) |

**Backend Validation** (redundant security):

While frontend validates password format, backend should also validate during login to prevent API misuse:

```typescript
// Backend could validate during signup (if implemented)
if (password.length < 8) throw new Error('Password too short');
const hasLetter = /[a-zA-Z]/.test(password);
const hasNumber = /[0-9]/.test(password);
if (!hasLetter || !hasNumber) {
  throw new Error('Password must contain letters and numbers');
}
```

### Security Considerations

#### Token Storage (Dev vs. Production)

**Development** (Current):
- Token stored in `localStorage`
- ⚠️ Vulnerable to XSS (JavaScript can steal it if DOM is compromised)
- Acceptable for development only
- Visible in browser DevTools Application tab

**Production** (Recommended):
- Token stored in `httpOnly` cookie
- ✅ Immune to XSS (JavaScript cannot access)
- Cookie sent automatically with requests (requires `credentials: 'include'`)
- Requires HTTPS (cannot send over HTTP)

**Migration Path**:
```typescript
// Dev: localStorage
localStorage.setItem('auth_token', token)

// Prod: httpOnly cookie
// Set-Cookie: auth_token=JWT_VALUE; HttpOnly; Secure; SameSite=Strict
```

#### Token Expiration & Refresh

**Current** (Simple):
- Token expires after 24 hours (JWT `exp` claim)
- User must login again after 24 hours
- Acceptable for short sessions

**Future** (Recommended Enhancement):
- Access token: 15 minutes (short window for compromise)
- Refresh token: 7 days (enables long sessions without password)
- Automatic refresh: If access token expires, use refresh token to get new access token
- More secure: Compromised access token has limited impact window

**Implementation** (future enhancement):
```typescript
// Current
const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });

// Future
const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign({ id: userId, isRefresh: true }, JWT_SECRET, { expiresIn: '7d' });
```

#### Generic Error Messages Prevent User Enumeration

**Bad** (Leaks user information):
```typescript
const user = await db.user.findUnique({ where: { email } });
if (!user) throw new Error('User not found');  // ❌ Attacker knows email doesn't exist

const match = await bcrypt.compare(password, user.passwordHash);
if (!match) throw new Error('Password incorrect');  // ❌ Attacker knows email is valid
```

**Good** (Generic message):
```typescript
const user = await db.user.findUnique({ where: { email } });
if (!user) throw new Error('Invalid email or password');  // ✅ Same message

const match = await bcrypt.compare(password, user.passwordHash);
if (!match) throw new Error('Invalid email or password');  // ✅ Same message
```

An attacker cannot determine whether an email is registered or if the password is wrong—both return the same generic error.

#### Bcrypt Password Hashing

**Current Implementation**:
```typescript
const passwordMatch = await bcrypt.compare(args.password, user.passwordHash);
```

**Why Not Plaintext**:
- ❌ Never store plaintext passwords
- ❌ Database breach exposes all passwords
- ❌ Violates user trust and regulations (GDPR, etc)

**Why Bcrypt**:
- ✅ Intentionally slow (1 second per comparison)
- ✅ Makes brute-force attacks impractical (1M password attempts = ~11 days)
- ✅ Industry standard (used by GitHub, Twitter, most major services)
- ✅ Built-in salt (randomizes hash, prevents rainbow tables)

**Future Consideration**:
- Upgrade to Argon2 if bcrypt becomes deprecated (better than bcrypt)

#### JWT Token Validation Per-Request

**Fresh Extraction Pattern**:
```typescript
// Per-request extraction (NOT globally cached)
context: async ({ req }) => {
  let user = null;
  try {
    user = extractUserFromToken(req.headers.authorization);
  } catch (error) {
    console.error('JWT validation error:', error);
  }
  return { user, ...otherContext };
}
```

**Why Fresh Per-Request**:
- Token might be revoked (e.g., user logged out in another tab)
- No global cache means no stale tokens
- Validation happens for every request
- Prevents token reuse after expiration

#### Type Guard Prevents DoS Attacks

**Bad** (Can crash on malformed JWT):
```typescript
const decoded = jwt.verify(token, JWT_SECRET) as any;
// If payload missing 'id' field, decoder.id is undefined
// Passing undefined to database crashes resolver
```

**Good** (Type guard validates structure):
```typescript
export function isValidJWTPayload(decoded: unknown): decoded is { id: string } {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'id' in decoded &&
    typeof (decoded as Record<string, unknown>).id === 'string' &&
    (decoded as Record<string, unknown>).id !== ''
  );
}

if (!isValidJWTPayload(decoded)) {
  throw new Error('Invalid token payload');
}
```

An attacker cannot crash the server by sending a JWT with missing/malformed payload fields.

### Testing Patterns for Authentication

#### Unit Tests: Validation Functions

**File**: `frontend/components/__tests__/login-form.test.tsx`

```typescript
describe('LoginForm Validation', () => {
  it('should reject email without @', () => {
    const error = validateEmail('notanemail');
    expect(error).toBe('Enter a valid email address');
  });

  it('should accept valid email', () => {
    const error = validateEmail('user@example.com');
    expect(error).toBeUndefined();
  });

  it('should reject password < 8 chars', () => {
    const error = validatePassword('Pass1');
    expect(error).toBe('Password must be at least 8 characters');
  });

  it('should reject password without letters', () => {
    const error = validatePassword('12345678');
    expect(error).toBe('Password must contain letters and numbers');
  });

  it('should reject password without numbers', () => {
    const error = validatePassword('abcdefgh');
    expect(error).toBe('Password must contain letters and numbers');
  });

  it('should accept password with letters and numbers', () => {
    const error = validatePassword('Password123');
    expect(error).toBeUndefined();
  });
});
```

#### Unit Tests: JWT Middleware

**File**: `backend-graphql/src/__tests__/auth.test.ts`

```typescript
describe('JWT Middleware', () => {
  it('should extract valid token', () => {
    const token = generateToken('user-123');
    const user = extractUserFromToken(`Bearer ${token}`);
    expect(user?.id).toBe('user-123');
  });

  it('should return null for missing header', () => {
    const user = extractUserFromToken(undefined);
    expect(user).toBeNull();
  });

  it('should return null for non-Bearer header', () => {
    const user = extractUserFromToken('Basic dXNlcjpwYXNz');
    expect(user).toBeNull();
  });

  it('should throw error for expired token', () => {
    const token = jwt.sign({ id: 'user-123' }, JWT_SECRET, { expiresIn: '-1h' });
    expect(() => extractUserFromToken(`Bearer ${token}`)).toThrow('Token expired');
  });

  it('should throw error for malformed token', () => {
    expect(() => extractUserFromToken('Bearer malformed.token')).toThrow('Invalid token');
  });

  it('should throw error for token missing id field', () => {
    const token = jwt.sign({ userId: 'user-123' }, JWT_SECRET);
    expect(() => extractUserFromToken(`Bearer ${token}`)).toThrow('Invalid token payload');
  });
});
```

#### Mocking Strategies: useAuth Hook

**File**: `frontend/components/__tests__/protected-component.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth-context';

// Mock component that uses useAuth
function ProtectedComponent() {
  const { token } = useAuth();
  return <div>{token ? 'Authenticated' : 'Not authenticated'}</div>;
}

describe('AuthProvider', () => {
  it('should provide token from context', () => {
    // AuthProvider initializes token from localStorage
    localStorage.setItem('auth_token', 'test-token');
    
    render(
      <AuthProvider>
        <ProtectedComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Authenticated')).toBeInTheDocument();
    
    // Cleanup
    localStorage.removeItem('auth_token');
  });

  it('should handle missing token', () => {
    localStorage.clear();
    
    render(
      <AuthProvider>
        <ProtectedComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Not authenticated')).toBeInTheDocument();
  });
});
```

#### Mocking Strategies: Apollo Client

**File**: `frontend/components/__tests__/dashboard.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { AuthProvider } from '@/lib/auth-context';
import Dashboard from '@/app/page';
import { GET_BUILDS } from '@/lib/graphql-queries';

describe('Dashboard with Authentication', () => {
  it('should display builds when authenticated', async () => {
    const mocks = [
      {
        request: {
          query: GET_BUILDS,
          context: {
            headers: {
              authorization: 'Bearer test-token',
            },
          },
        },
        result: {
          data: {
            builds: [
              { id: '1', name: 'Build 1', status: 'PENDING' },
            ],
          },
        },
      },
    ];

    // Set token in localStorage
    localStorage.setItem('auth_token', 'test-token');

    render(
      <AuthProvider>
        <MockedProvider mocks={mocks}>
          <Dashboard />
        </MockedProvider>
      </AuthProvider>
    );

    // Wait for Apollo query to resolve
    expect(await screen.findByText('Build 1')).toBeInTheDocument();

    // Cleanup
    localStorage.removeItem('auth_token');
  });

  it('should show error when unauthorized', async () => {
    const mocks = [
      {
        request: {
          query: GET_BUILDS,
        },
        result: {
          errors: [{ message: 'Unauthorized' }],
        },
      },
    ];

    localStorage.clear();

    render(
      <AuthProvider>
        <MockedProvider mocks={mocks}>
          <Dashboard />
        </MockedProvider>
      </AuthProvider>
    );

    expect(await screen.findByText('Unauthorized')).toBeInTheDocument();
  });
});
```

#### Test Data Patterns

**File**: `backend-graphql/src/__tests__/fixtures.ts`

```typescript
export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'TestPassword123',
    passwordHash: '$2b$10$...', // bcrypt hash of TestPassword123
  },
  invalidPassword: {
    email: 'test@example.com',
    password: 'WrongPassword123',
  },
  notFound: {
    email: 'nonexistent@example.com',
    password: 'AnyPassword123',
  },
};

export const testTokens = {
  valid: generateToken('user-123'),
  expired: jwt.sign({ id: 'user-123' }, JWT_SECRET, { expiresIn: '-1h' }),
  malformed: 'not.a.jwt.token',
  missing_id: jwt.sign({ userId: 'user-123' }, JWT_SECRET),
};
```

---

## Interview Talking Points: Authentication

### Question: "How do you prevent token leaks between users in concurrent requests?"

**Answer**: "I apply a **Fresh Per-Request Pattern** for both frontend and backend. 

**Frontend**:
- Apollo auth link (`setContext`) runs **per GraphQL operation**, not globally
- Retrieves token fresh from localStorage each time
- If user logs in/out between operations, the new token is used immediately
- No global token cache = no stale tokens shared between requests

**Backend**:
- Context factory in Apollo Server runs **per HTTP request**
- Extracts JWT from Authorization header fresh each time
- Validates signature and payload type
- Injects fresh user object into context
- Each request gets isolated auth context

Result: Even with concurrent requests from same user, tokens never leak. Multiple simultaneous GraphQL operations each get their own validated token."

### Question: "How does authentication integrate with Apollo without tangling concerns?"

**Answer**: "Apollo auth link is middleware between cache and HTTP transport. It doesn't know about authentication logic—it just intercepts operations and injects headers.

**The flow**:
1. Component calls `useQuery(GET_BUILDS)`
2. Apollo checks cache—miss
3. authLink intercepts the operation
4. authLink calls `setContext` callback
5. Callback retrieves token and injects `Authorization: Bearer {token}`
6. httpLink sends request with header
7. Apollo Server receives request
8. Context factory extracts JWT and validates it
9. Resolver has fresh `context.user` object
10. Resolver returns data
11. Apollo caches and returns to component

The separation: authLink doesn't validate tokens (that's backend's job). Apollo Server doesn't know about localStorage (that's client concern). Each layer does one thing well."

### Question: "How do you ensure users only see their own data?"

**Answer**: "Authorization happens at the **resolver level**, not the transport layer.

**For queries**:
```typescript
async builds(_, args, context) {
  if (!context.user) throw new Error('Unauthorized');
  return db.build.findMany({
    where: { userId: context.user.id },  // ← Data isolation
  });
}
```

**For mutations**:
```typescript
async updateBuild(_, { id, status }, context) {
  if (!context.user) throw new Error('Unauthorized');
  const build = await db.build.findUnique({ where: { id } });
  if (build.userId !== context.user.id) throw new Error('Unauthorized');
  // ← Verify ownership before allowing mutation
  return db.build.update({ where: { id }, data: { status } });
}
```

Even if an attacker guesses a build ID and sends a query, the resolver checks ownership. **Horizontal privilege escalation prevented at the resolver level.**"

### Question: "Why generic error messages for login failures?"

**Answer**: "**User enumeration prevention**. If I return different errors for 'user not found' vs 'password incorrect', an attacker can probe:

```
POST /graphql { login(email: 'attacker@gmail.com', password: 'test') }
Response: 'User not found' → email not registered

POST /graphql { login(email: 'realuser@gmail.com', password: 'test') }
Response: 'Password incorrect' → email is valid
```

Now the attacker knows which emails are real users and can focus brute-force attacks. By returning 'Invalid email or password' for both failures, both errors look identical:

```
POST /graphql { login(email: 'attacker@gmail.com', password: 'test') }
Response: 'Invalid email or password' ← Could be either reason

POST /graphql { login(email: 'realuser@gmail.com', password: 'test') }
Response: 'Invalid email or password' ← Could be either reason
```

Attacker can't distinguish between account enumeration and password guessing. Combined with bcrypt's 1-second hash time (1M attempts ≈ 11 days), this makes brute-force impractical."

### Question: "Why type-safe JWT payload validation?"

**Answer**: "Prevents DoS attacks on the context factory. If someone sends a JWT with missing 'id' field:

**Bad** (crashes):
```typescript
const decoded = jwt.verify(token, SECRET) as any;
const user = { id: decoded.id };  // ← decoded.id is undefined
await context.prisma.build.findMany({
  where: { userId: user.id }  // ← Query with undefined crashes DB
});
```

**Good** (type guard):
```typescript
export function isValidJWTPayload(decoded): decoded is { id: string } {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'id' in decoded &&
    typeof decoded.id === 'string' &&
    decoded.id !== ''
  );
}

if (!isValidJWTPayload(decoded)) throw new Error('Invalid payload');
```

Type guard validates structure **before** passing to database. An attacker cannot crash the server by sending malformed JWTs. Prevents **denial of service**."

### Question: "Why 24-hour token expiration instead of no expiration?"

**Answer**: "Balances security and user experience.

**No expiration (bad for security)**:
- Leaked token is valid forever
- Can't revoke access (e.g., when user changes password or device is stolen)
- No way to force re-authentication

**Very short expiration (bad for UX)**:
- Users forced to re-login every 15 minutes
- Annoying on mobile with spotty WiFi
- High load on login server

**24 hours (balanced approach)**:
- Short enough that leaked tokens have limited window
- Long enough for reasonable usage sessions
- If token leaked, attacker has ~24 hours before it expires
- User can also manually logout (clears localStorage)

**Future improvement** (refresh tokens):
- Access token: 15 minutes (short-lived, used for requests)
- Refresh token: 7 days (long-lived, only used to get new access token)
- Best of both: short exposure window + long session duration
- Requires refresh mechanism (not yet implemented)

For this project, 24-hour token is appropriate given manufacturing use case (8-hour shifts)."

### Question: "How does password validation prevent weak passwords?"

**Answer**: "Client-side validation for immediate feedback, server-side for security.

**Client-side** (LoginForm):
- Email: required, must contain @
- Password: 8+ chars, must have letters AND numbers
- Real-time validation on blur/change
- Shows errors inline (not modal—faster feedback)
- Disables submit if validation fails

**Examples**:
- ✅ `Password123` - 11 chars, letters + numbers
- ❌ `abcdefgh` - 8 chars but no numbers
- ❌ `12345678` - 8 chars but no letters
- ❌ `Pass1` - Only 5 characters

**Why letters AND numbers**:
- Numbers only: Easy to crack (0-9 is ~10x smaller keyspace)
- Letters only: Missing entropy source
- Both together: Quadratically harder to crack

**Server-side validation** (backend):
- Even though frontend validates, backend should too
- Never trust client—user could disable JavaScript or craft HTTP request
- Redundant validation is defense-in-depth

**Bcrypt hashing**:
- Passwords never stored plaintext
- Bcrypt is intentionally slow (1 second per check)
- Makes brute-force infeasible (1M attempts = ~11 days per account)
- Includes salt (prevents rainbow table attacks)"

---

## Dashboard Metrics & Statistics (Phase 2 - Issue #258)

### Overview

Dashboard metrics provide at-a-glance visibility into build status and health. The metrics system calculates aggregated statistics from builds and displays them in an interactive dashboard.

### Architecture

**Client-Side Metrics Calculation**:
- Metrics are derived from existing `BUILDS_QUERY` response
- No backend changes needed (uses existing GraphQL API)
- Frontend calculates: Total Builds, In Progress, Completed, Failed, Completion Rate
- Real-time updates via Apollo cache invalidation on mutations

```typescript
// frontend/lib/hooks/useDashboardMetrics.ts
export function useDashboardMetrics(limit: number = 1000): UseDashboardMetricsReturn {
  const { data, loading, error, refetch } = useQuery(DASHBOARD_METRICS_QUERY);
  
  // Memoize calculations to prevent unnecessary recalculations
  const metrics = useMemo(() => calculateMetrics(builds), [builds]);
  const statusDistribution = useMemo(() => calculateStatusDistribution(builds), [builds]);
  const recentActivity = useMemo(() => getRecentActivity(builds, 10), [builds]);
  
  return { metrics, statusDistribution, recentActivity, isLoading: loading, error, refetch };
}
```

### Components

**DashboardMetrics** (Container):
- Fetches metrics via `useDashboardMetrics` hook
- Renders 4 metric cards (Total, In Progress, Completed, Failed)
- Displays completion rate percentage
- Shows recent activity timeline
- Responsive grid: 1 col mobile, 2 cols tablet, 4 cols desktop
- Error handling with retry capability

**MetricCard** (Reusable):
- Icon + label + value layout
- Optional subtext and trend indicators (↑ ↓)
- Clickable variant with keyboard navigation
- Memoized for performance
- Accessibility: ARIA labels, semantic HTML

**ActivityTimeline** (Reusable):
- Vertical timeline of recent builds
- Status badges with semantic color coding
- Relative timestamps ("2 hours ago")
- Truncates long build names
- Loading skeleton state
- Empty state message

### Metrics Calculation

```typescript
// frontend/lib/dashboard-utils.ts
export function calculateMetrics(builds: BuildData[]): DashboardMetrics {
  // Count builds by status
  const total = builds.length;
  const completed = builds.filter(b => b.status === 'COMPLETE').length;
  const inProgress = builds.filter(b => b.status === 'RUNNING').length;
  const failed = builds.filter(b => b.status === 'FAILED').length;
  
  // Calculate completion rate
  const finishedBuilds = completed + failed;
  const completionRate = total > 0 ? Math.round((finishedBuilds / total) * 100) : 0;
  
  return { totalBuilds: total, completed, inProgress, failed, completionRate };
}
```

### Real-Time Updates

Metrics automatically update when builds are created or mutated:

1. **User creates build** → Apollo cache updates optimistically
2. **Apollo cache changes** → `useDashboardMetrics` hook detects change
3. **Metrics recalculated** → `useMemo` dependencies trigger new calculation
4. **UI updates** → MetricCard and ActivityTimeline re-render with new values

**No manual refetch needed** — Apollo handles cache invalidation automatically.

### Performance Optimizations

- **Memoized calculations**: `useMemo` prevents recalculation on parent re-renders
- **Memoized components**: `React.memo` on MetricCard and ActivityTimeline
- **Limited query size**: Default limit 1000 builds (configurable)
- **Recent activity truncated**: Only shows 10 most recent builds
- **Target load time**: <500ms for typical dataset (10-50 builds)

### Testing Strategy

**Unit Tests** (61 tests):
- MetricCard: rendering, click handlers, accessibility (15 tests)
- ActivityTimeline: status display, truncation, loading state (15 tests)
- Responsive design: grid layout, touch targets, font sizes (18 tests)
- Utils: metric calculations, date formatting (13 tests)

**Integration Tests** (11 tests):
- Full data fetch and display
- Metrics calculation correctness
- Apollo cache updates on mutations
- Error handling and recovery
- Performance with large datasets
- Loading and empty state transitions

**Coverage Target**: >80% line coverage, >75% branch coverage

### Usage

```tsx
// In your dashboard component
import { DashboardMetrics } from '@/components/DashboardMetrics';

export default function Dashboard() {
  return (
    <div>
      <DashboardMetrics onMetricsRefresh={() => console.log('Metrics updated')} />
      {/* Other dashboard content */}
    </div>
  );
}
```

### Styling

- Tailwind CSS utility classes (no new CSS files)
- Responsive breakpoints: `md:` (tablet), `lg:` (desktop)
- Color-coded status badges: green (complete), blue (running), red (failed), yellow (pending)
- Dark mode support via CSS variables (prepared for Issue #264)

### Known Limitations & Future Improvements

1. **Metrics recalculated client-side**: For very large datasets (1000+ builds), consider backend aggregation endpoint
2. **Pie chart not implemented**: CSS-based visualization used instead of heavyweight chart library
3. **No caching layer**: Each component mount fetches fresh data (Apollo cache mitigates this)
4. **Manual refresh only**: No auto-refresh polling (can be added in future)

### Related Issues

- **#259**: Status Visualization (uses MetricCard component pattern)
- **#260**: Tab Organization (may reuse metric components)
- **#264**: Dark Mode (CSS variables already in place)

---

## Environment & Startup

### .env (shared across backends)

```env
POSTGRES_URL=postgresql://user:pass@localhost:5432/boltline
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Startup Commands

```bash
# All at once
pnpm dev

# Separately
pnpm dev:graphql   # Apollo on :4000
pnpm dev:express   # Express on :5000
pnpm dev:frontend  # Next.js on :3000
```

---

## Technology Rationale

| Component              | Why                                                                |
|------------------------|--------------------------------------------------------------------|
| **Apollo GraphQL**     | Type-safe data API, prevents N+1 with DataLoader, scales easily    |
| **Express**            | Lightweight for auxiliary endpoints, familiar to most developers   |
| **PostgreSQL**         | ACID guarantees for manufacturing data, proven at enterprise scale |
| **Server-Sent Events** | Real-time notifications with simpler infrastructure than WebSocket |
| **JWT Auth**           | Stateless, works across multiple backends                          |
| **TypeScript**         | End-to-end type safety from database to UI                         |
| **Vitest**             | Lightning-fast tests, better DX than Jest                          |

---

## Resources

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Express.js Guide](https://expressjs.com/)
- [DataLoader](https://github.com/graphql/dataloader)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
