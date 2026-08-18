# GraphQL Backend Domain Rules

Rules and best practices for Apollo Server, Prisma ORM, and resolvers in `backend-graphql/`.

---

## Schema & Resolver Rules

### GraphQL Schema Design
- ✅ **DO**: Define all types in `schema.graphql` using SDL
- ✅ **DO**: Use clear, descriptive type and field names
- ✅ **DO**: Add descriptions with `"""` for documentation
- ✅ **DO**: Use Input types for mutation arguments
- ✅ **DO**: Define custom scalars (Date, DateTime, JSON)
- ❌ **DON'T**: Use String when specific type exists (e.g., Date)
- ❌ **DON'T**: Omit descriptions (breaks GraphiQL docs)
- ❌ **DON'T**: Return nullable fields without good reason

**Pattern**:
```graphql
"""
A software build artifact with metadata and test results
"""
type Build {
  id: ID!
  name: String!
  description: String
  status: BuildStatus!
  createdAt: DateTime!
  parts: [Part!]!              # Never null, empty array if none
  testRuns: [TestRun!]!
}

type Mutation {
  """Create a new build and emit event"""
  createBuild(input: CreateBuildInput!): Build!
}

input CreateBuildInput {
  name: String!
  description: String
}
```

### Resolver Implementation
- ✅ **DO**: Keep resolvers focused (delegation pattern)
- ✅ **DO**: Return typed objects matching schema
- ✅ **DO**: Emit events from mutations
- ✅ **DO**: Handle errors with formatted response
- ✅ **DO**: Validate inputs at resolver level
- ❌ **DON'T**: Put business logic in resolvers (use services)
- ❌ **DON'T**: Query database directly (use Prisma)
- ❌ **DON'T**: Mutate resolver parameters

**Pattern**:
```typescript
// ✅ Resolver delegates to service
export const Mutation = {
  async createBuild(parent, { input }, { prisma, eventBus }) {
    // Validate
    if (!input.name?.trim()) throw new Error("Name required");
    
    // Create
    const build = await BuildService.create(prisma, input);
    
    // Emit event
    await eventBus.emit("build:created", { buildId: build.id });
    
    return build;
  },
};
```

### Field Resolvers
- ✅ **DO**: Use field resolvers for computed/nested fields
- ✅ **DO**: Use DataLoader for nested queries (prevents N+1)
- ✅ **DO**: Return null for optional fields if not found
- ❌ **DON'T**: Load nested data in parent resolver
- ❌ **DON'T**: Query database per field (that's N+1)

**Pattern**:
```typescript
export const Build = {
  // ✅ Nested field uses DataLoader
  async parts(parent, args, { loaders }) {
    return loaders.partsByBuildId.load(parent.id);
  },
};
```

---

## DataLoader & Performance Rules

### N+1 Prevention
- ✅ **DO**: Use DataLoader for any nested relationship
- ✅ **DO**: Create one DataLoader per relationship
- ✅ **DO**: Name DataLoaders clearly: `{entityName}By{FilterField}Id`
- ✅ **DO**: Cache DataLoaders in context per request
- ❌ **DON'T**: Query database in loop (N+1)
- ❌ **DON'T**: Skip DataLoader for "small" datasets

**N+1 Anti-pattern**:
```typescript
// ❌ WRONG: Queries database per build
builds.forEach(build => {
  const parts = await prisma.part.findMany({ where: { buildId: build.id } });
});
```

**N+1 Fix (DataLoader)**:
```typescript
// ✅ CORRECT: Batch load all parts
const loaders = {
  partsByBuildId: new DataLoader(async (buildIds) => {
    const partsByBuild = await prisma.part.groupBy({
      by: ["buildId"],
      where: { buildId: { in: buildIds } },
    });
    return buildIds.map(id => partsByBuild[id] || []);
  }),
};
```

### Resolver Performance
- ✅ **DO**: Profile queries with `DEBUG=apollo:*`
- ✅ **DO**: Check resolver timing in logs
- ✅ **DO**: Batch queries when possible
- ✅ **DO**: Cache computed values in DataLoader
- ❌ **DON'T**: Load all related data by default (only on request)

**Quick Check**: `DEBUG=apollo:* pnpm dev:graphql` then run query

---

## Database & Prisma Rules

### ORM Patterns
- ✅ **DO**: Define all models in `prisma/schema.prisma`
- ✅ **DO**: Use relationships to connect models
- ✅ **DO**: Add indexes for frequently queried fields
- ✅ **DO**: Use transactions for multi-step mutations
- ❌ **DON'T**: Raw SQL (use Prisma for type safety)
- ❌ **DON'T**: Assume database query performance

**Pattern**:
```prisma
model Build {
  id    Int     @id @default(autoincrement())
  name  String
  parts Part[]  @relation("BuildParts")
  
  @@index([name])
}

model Part {
  id      Int   @id @default(autoincrement())
  buildId Int
  build   Build @relation("BuildParts", fields: [buildId], references: [id], onDelete: Cascade)
}
```

### Transactions
- ✅ **DO**: Use transactions for multi-step operations
- ✅ **DO**: Rollback on error
- ✅ **DO**: Keep transactions short (< 5 seconds)
- ❌ **DON'T**: Omit transaction for "fast" operations
- ❌ **DON'T**: Hold transaction locks during external calls

**Pattern**:
```typescript
await prisma.$transaction(async (tx) => {
  const build = await tx.build.create({ data: input });
  await tx.part.createMany({ data: parts.map(p => ({ ...p, buildId: build.id })) });
  return build;
});
```

### Migrations
- ✅ **DO**: Create migration for every schema change: `pnpm migrate:create`
- ✅ **DO**: Review migration SQL before applying
- ✅ **DO**: Version migrations in git
- ✅ **DO**: Never edit applied migrations
- ❌ **DON'T**: Use `prisma db push` in production
- ❌ **DON'T**: Share database schema without migrations

**Workflow**:
```bash
# 1. Modify schema.prisma
# 2. Create migration
pnpm prisma migrate dev --name add_user_table
# 3. Review migration in prisma/migrations/
# 4. Commit to git
```

---

## Authentication & Authorization Rules

### JWT & Tokens
- ✅ **DO**: Verify JWT signature before trusting claims
- ✅ **DO**: Check token expiration
- ✅ **DO**: Include user ID in claims
- ✅ **DO**: Use RS256 for signing (public/private key)
- ❌ **DON'T**: Store passwords in database (hash them)
- ❌ **DON'T**: Use HS256 in production (shared secret risk)

**Pattern**:
```typescript
export const verifyToken = (token: string) => {
  return jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
};

// Use in middleware
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
```

### Authorization
- ✅ **DO**: Check permissions before resolver execution
- ✅ **DO**: Use context.user for authorization checks
- ✅ **DO**: Throw AuthenticationError for permission denied
- ❌ **DON'T**: Skip auth checks
- ❌ **DON'T**: Return null for forbidden resources (expose timing)

**Pattern**:
```typescript
export const Query = {
  async build(parent, { id }, { user, prisma }) {
    if (!user) throw new AuthenticationError("Not authenticated");
    
    const build = await prisma.build.findUnique({ where: { id } });
    if (!build) throw new UserInputError("Build not found");
    
    return build;
  },
};
```

---

## Event Emission Rules

### Real-Time Updates
- ✅ **DO**: Emit event after every mutation
- ✅ **DO**: Include only relevant data in event payload
- ✅ **DO**: Use descriptive event names: `{entity}:{action}` (e.g., `build:created`)
- ✅ **DO**: Emit to all clients (filter on frontend if needed)
- ❌ **DON'T**: Emit event before data is persisted
- ❌ **DON'T**: Emit from query resolvers

**Pattern**:
```typescript
export const Mutation = {
  async updateBuildStatus(parent, { id, status }, { prisma, eventBus }) {
    const build = await prisma.build.update({
      where: { id },
      data: { status },
    });
    
    // Emit AFTER persistence
    await eventBus.emit("build:status_changed", {
      buildId: build.id,
      newStatus: status,
    });
    
    return build;
  },
};
```

### Event Bus Integration
- ✅ **DO**: Use message queue for reliability (Redis, RabbitMQ)
- ✅ **DO**: Log event emissions
- ✅ **DO**: Handle event processing errors
- ❌ **DON'T**: Use in-memory events in production (single instance)

---

## Error Handling Rules

### Error Types
- ✅ **DO**: Use Apollo error types: `AuthenticationError`, `UserInputError`, `ForbiddenError`
- ✅ **DO**: Return clear error messages (no sensitive data)
- ✅ **DO**: Include error code for frontend handling
- ✅ **DO**: Log full error details server-side
- ❌ **DON'T**: Return stack traces to client
- ❌ **DON'T**: Use generic "Error" message

**Pattern**:
```typescript
import { UserInputError, ForbiddenError } from "apollo-server";

export const Mutation = {
  async createBuild(parent, { input }, context) {
    // Input validation
    if (!input.name) {
      throw new UserInputError("Name is required", {
        code: "INVALID_INPUT",
        field: "name",
      });
    }
    
    // Permission check
    if (!context.user?.isAdmin) {
      throw new ForbiddenError("Only admins can create builds");
    }
    
    // ... create build
  },
};
```

---

## Testing Rules

### GraphQL Testing
- ✅ **DO**: Test all Query, Mutation, and Subscription operations
- ✅ **DO**: Mock Prisma ORM
- ✅ **DO**: Test error cases (validation, auth, not found)
- ✅ **DO**: Test DataLoader batching
- ✅ **DO**: Test event emission
- ❌ **DON'T**: Test against real database (use mocks)
- ❌ **DON'T**: Omit error case testing

**Coverage Target**: 85% for resolvers, 100% for services

**Pattern**:
```typescript
import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";

describe("createBuild mutation", () => {
  it("creates build and emits event", async () => {
    const prismaMock = mock(prisma);
    const eventBusMock = mock(eventBus);
    
    prismaMock.build.create.mockResolvedValue({ id: 1, name: "Test" });
    
    await executeResolver(Mutation.createBuild, { input: { name: "Test" } });
    
    expect(prismaMock.build.create).toHaveBeenCalled();
    expect(eventBusMock.emit).toHaveBeenCalledWith("build:created", expect.any(Object));
  });
});
```

**Quick Check**: `pnpm test:graphql --run --coverage`

---

## Code Quality Rules

### TypeScript
- ✅ **DO**: Use strict mode: `"strict": true` in tsconfig.json
- ✅ **DO**: Type all resolver arguments and returns
- ✅ **DO**: Generate types from schema: `@graphql-codegen`
- ✅ **DO**: Use enums for status values
- ❌ **DON'T**: Use `any` type
- ❌ **DON'T**: Omit return types on functions

**Quick Check**: `pnpm type-check`

### Performance Monitoring
- ✅ **DO**: Profile slow queries
- ✅ **DO**: Monitor N+1 query patterns
- ✅ **DO**: Check DataLoader batch sizes
- ✅ **DO**: Monitor mutation latency

**Debug Command**: `DEBUG=apollo:* pnpm dev:graphql`

---

## File Organization

```
backend-graphql/
├── src/
│   ├── schema.graphql          # GraphQL SDL
│   ├── resolvers/
│   │   ├── Query.ts
│   │   ├── Mutation.ts
│   │   ├── Build.ts            # Field resolvers
│   │   └── index.ts
│   ├── dataloaders/            # DataLoader instances
│   │   ├── index.ts
│   │   └── partsByBuildId.ts
│   ├── services/               # Business logic
│   │   ├── BuildService.ts
│   │   └── index.ts
│   ├── middleware/             # Auth, logging, tracing
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── server.ts               # Apollo Server setup
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/             # Auto-generated by Prisma
├── __tests__/
│   ├── resolvers/
│   └── services/
└── package.json
```

---

## Related Documentation

- **See**: `.github/instructions/backend-graphql.instructions.md` (detailed layer guide)
- **See**: `DESIGN.md` (architecture overview)
- **See**: `SKILLS.md` (12 GraphQL skills indexed)

---

**Last Updated**: 2026-08-17  
**Scope**: `backend-graphql/` directory  
**Quick Check**: `pnpm test:graphql --run && pnpm lint && pnpm type-check`
