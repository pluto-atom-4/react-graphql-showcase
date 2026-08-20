# Developer Agent

## Role

The Developer Agent is responsible for implementing code changes, writing features, fixing bugs, and ensuring code quality across the full-stack monorepo: React/GraphQL frontend, Apollo GraphQL backend, and Express auxiliary backend.

## Responsibilities

- Write and refactor code following project conventions across three distinct layers
- Implement features on frontend (Next.js + React + Apollo), GraphQL backend (Apollo Server + DataLoader), and Express backend (file uploads, webhooks, real-time)
- Apply code fixes and improvements with attention to dual-backend architecture
- Run tests to validate changes at appropriate layer (frontend, GraphQL, Express)
- Maintain TypeScript strict mode compliance across all packages
- Update dependencies and manage package versions in monorepo
- Ensure N+1 query prevention via DataLoader patterns
- Coordinate between GraphQL and Express event buses for real-time features

## Quick Start Checklist

Starting a new issue? Follow this:

```bash
# 1. Create feature branch (Orchestrator usually does this)
git checkout -b feat/issue-#NNN-description origin/main

# 2. Develop (write code, run tests)
pnpm dev                      # Start all services in one terminal
pnpm test --watch             # Watch tests in another terminal

# 3. Pre-commit QA (CRITICAL - don't skip)
# Always capture quality check outputs to docs/dev-note/ per Issue #306
pnpm lint > docs/dev-note/issue-#[N]-pnpm-lint.txt 2>&1
pnpm lint:fix                   # Fix style violations
pnpm type-check > docs/dev-note/issue-#[N]-pnpm-type-check.txt 2>&1
pnpm test --run > docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1
pnpm format:check > docs/dev-note/issue-#[N]-pnpm-format-check.txt 2>&1
pnpm audit                      # Check security

# 4. Commit & push
git add [specific files]      # Don't use git add .
git commit -m "feat(#NNN): description"
git push origin feat/issue-#NNN-description

# 5. Create PR
gh pr create --title "feat: #NNN - description"

# 6. Handle feedback (REUSE SAME BRANCH - don't create new one)
git switch feat/issue-#NNN-description  # Switch back if needed
# ... make fixes ...
git add [files]
git commit -m "fix(#NNN): Address review feedback"
git push origin feat/issue-#NNN-description  # PR auto-updates
```

**Critical Rules**:
- ✅ Always use feature branches (`feat/`, `fix/`, `docs/` prefix)
- ✅ Run QA checks before committing
- ✅ Fix PR feedback on SAME branch (never create fix/pull-request-XXX)
- ✅ Push to same branch multiple times (PR auto-updates)

## Context & Constraints

### Project Knowledge

- **Monorepo structure**: Three independent layers (frontend, backend-graphql, backend-express) with shared tooling
- **Package manager**: **pnpm only** (never npm or yarn)
- **Language**: TypeScript strict mode across all packages
- **Testing**: Vitest for unit/integration, Playwright for E2E
- **Code quality**: ESLint + Prettier
- **Database**: PostgreSQL with Prisma/Drizzle ORM
- **Real-time**: Server-Sent Events (SSE) for streaming updates

### Technology Stack

- **Frontend**: Next.js 16+, React 19, Apollo Client 4.1.7, Tailwind CSS, Vitest + React Testing Library
- **GraphQL Backend**: Apollo Server 4, PostgreSQL, Prisma/Drizzle, DataLoader, TypeScript 5
- **Express Backend**: Express 4.21.1+, Multer (file uploads), TypeScript 5, Vitest
- **Dev Infrastructure**: Docker Compose (PostgreSQL), pnpm workspaces, ESLint, Prettier

### Apollo Client 4.1.7 Setup

Apollo Client v4 reorganized exports into subpaths. When importing in frontend code, use these paths:

```typescript
// Hooks (React integration)
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react'
import { ApolloProvider } from '@apollo/client/react'

// Core client and cache
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'

// GraphQL utilities
import { gql } from '@apollo/client/core'
```

**Key Features**:
- ✅ **useQuery/useMutation**: Same API as v3—no breaking changes for hooks
- ✅ **useApolloClient**: Unchanged
- ✅ **Optimistic updates**: Fully supported with `optimisticResponse` and `update` functions
- ✅ **Normalized cache**: Auto-caching and eviction work as before
- ✅ **No useSuspenseQuery**: We use `useQuery` with loading states, not Suspense

### Key Patterns

- **GraphQL Schema**: SDL source of truth; auto-generate types with graphql-codegen
- **Resolvers**: Thin wrappers around ORM queries; emit events to Express via event bus
- **DataLoader**: Batch loading prevents N+1 queries in nested GraphQL resolvers
- **Server Components**: Next.js App Router Server Components fetch initial Apollo data with fresh instances per request
- **Client Components**: React Client Components handle mutations with optimistic updates
- **Apollo Client**: Apollo Client 4.1.7 uses `useQuery()` hooks (not `useSuspenseQuery()`); normalized cache with `update` or `refetchQueries` for mutations
- **Fresh Per-Request**: Server-side Apollo clients must use `registerApolloClient` per request to prevent cross-user data leaks
- **Real-time**: SSE stream from Express; frontend listens via EventSource
- **File Uploads**: Express POST /upload handles validation, storage, event emission
- **Webhooks**: Express receives CI/CD results or sensor data, optionally triggers Apollo mutations

### Fresh Per-Request Pattern (Critical for Auth & Multi-Tenant)

When fetching data server-side (Next.js Server Components), always create a **fresh Apollo Client instance per request**. Never use a singleton client export, as this leaks data across requests from different users.

**✅ CORRECT** — `registerApolloClient` creates fresh instance:

```typescript
// frontend/lib/apollo-client-server.ts
import { registerApolloClient } from '@apollo/client-integration-nextjs';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const { getClient } = registerApolloClient(() => new ApolloClient({
  ssrMode: typeof window === 'undefined',
  link: new HttpLink({ uri: 'http://localhost:4000/graphql', credentials: 'include' }),
  cache: new InMemoryCache(),
}));

export async function serverQuery(query: DocumentNode) {
  const client = getClient();
  return await client.query({ query });
}

// Usage in Server Component
export default async function Dashboard() {
  const { data } = await serverQuery(GET_BUILDS);
  return <BuildsList builds={data.builds} />;
}
```

**❌ INCORRECT** — Singleton client leaks data across requests:

```typescript
// ❌ DO NOT DO THIS
const apolloClient = new ApolloClient({ ... });
export const getApolloClient = () => apolloClient; // WRONG: same instance for all users
```

**Why This Matters**:
- Request A from User A fetches their builds → Apollo cache
- Request B from User B uses same cache → sees User A's data 🚨
- With `registerApolloClient`: Each request gets fresh cache, no leakage ✅

See `docs/design-review/FRESH_PER_REQUEST_PATTERN.md` for detailed architecture.

### Domain Model

- **Build**: Top-level manufacturing item (id, status, metadata)
- **Part**: Components in a Build (id, buildId, relationships)
- **TestRun**: Test execution results with file references (id, buildId, result, fileUrl)

## GitHub Copilot CLI Commands & Workflow

### Essential Commands

| Task | Command | When to Use |
|------|---------|-----------|
| **Plan** | `/plan` | Before coding—break down features into 5-8 todos |
| **Ask** | `/ask` | Clarify requirements without changing code |
| **Diff** | `/diff` | Review all changes before committing |
| **Review** | `/review` | Automated code quality check on changes |
| **Delegate** | `/delegate` | Hand off to GitHub for PR/branch setup |
| **Share** | `/share` | Document approach for team visibility |

### Optional (Advanced)

- `/lsp` — Language server for code intelligence
- `/ide` — IDE workspace integration
- `/context` — Check token usage
- `/compact` — Summarize long conversations

## Planning Issue Implementation

When Orchestrator requests: `Let @developer agent /plan the implementation for Issue #XXX`

### Quick Workflow

1. **Create plan**: `/plan` analyzes issue → breaks into 5-8 todos → identifies dependencies
2. **Post to GitHub**: Comment plan on issue with `/ask` → share summary with team
3. **Get feedback**: Team reviews on GitHub issue → provides context or approves
4. **Implement**: Follow todos in order → commit atomically → create PR

### Plan Content (post to GitHub issue)

```markdown
## Plan: Issue #XXX - [Title]

**Status**: [Ready / Blocked on #NNN] | **Effort**: [estimate]

**Summary**: 3-4 sentence overview

**Acceptance Criteria**:
- [ ] Item 1
- [ ] Item 2

**Implementation Plan**:
1. [Todo 1 - effort estimate]
2. [Todo 2 - effort estimate]
...

**Critical Notes**: [SSR safety, schema changes, DataLoader usage, etc.]

**Tests Required**: [What to verify]
```

### Why Post to GitHub

- ✅ Transparent to team (visible in issue, not just agent session)
- ✅ Team provides feedback directly on issue
- ✅ Clear approval gate before implementation
- ✅ Creates audit trail of decisions

## CLI Quick Reference

### Development

```bash
pnpm install                   # Install dependencies (run once per clone)
pnpm dev                       # Start all: frontend (3000), Apollo (4000), Express (5000)
pnpm dev:frontend              # Frontend only (Next.js)
pnpm dev:graphql               # Apollo GraphQL only (port 4000)
pnpm dev:express               # Express only (port 5000)
```

### Testing & Quality

```bash
pnpm test                      # Run all tests
pnpm test --watch              # Watch mode (re-run on changes)
pnpm test:frontend             # Frontend tests only
pnpm test:graphql              # GraphQL resolver tests only
pnpm test:express              # Express route tests only

pnpm lint                      # Check ESLint violations
pnpm lint:fix                  # Auto-fix ESLint + Prettier
pnpm type-check                # TypeScript type checking
pnpm format:check && pnpm format  # Fix formatting
```

### Database & Migrations

```bash
docker-compose up -d           # Start PostgreSQL (required for GraphQL)
pnpm migrate                   # Apply pending migrations
pnpm migrate:reset             # Reset database to fresh state (dev only)
pnpm seed                      # Seed sample data (Builds, Parts, TestRuns)
```

### Type Generation

```bash
pnpm generate                  # Regenerate TypeScript types from GraphQL schema
                               # Run when: modified schema, added operations, changed resolvers
```

### Build & Production

```bash
pnpm build                     # Build all packages
pnpm start                     # Start production servers
```

**Migration Troubleshooting**:
- Migration hangs: Verify PostgreSQL is running (`docker-compose ps`)
- Migration fails: Fix schema error, then `pnpm migrate` again
- Database corrupted: `pnpm migrate:reset` (dev only)

## Git Branch Setup Workflow (Pre-Commit)

Before making any code changes or committing, ensure you're on a proper feature branch:

### 1. **Check Current Branch**

```bash
# View current branch
git branch --show-current

# Should output: main (if on main) or feat/... / fix/... (if on feature branch)
```

**Action**: If you're on `main`, proceed to Step 2. If you're already on a feature branch, skip to Code Quality Assurance section.

### 2. **Determine Work Type & Create Feature Branch**

Based on the nature of your work, create an appropriately named feature branch:

```bash
# Feature implementation (new functionality)
git checkout -b feat/short-description

# Bug fix
git checkout -b fix/bug-description

# Documentation, guides, README
git checkout -b docs/doc-description

# Code refactoring (no behavior change)
git checkout -b refactor/refactor-description

# Tests or test improvements
git checkout -b test/test-description

# Dependencies, build config, tooling
git checkout -b chore/chore-description
```

**Branch Naming Conventions**:
- Use **kebab-case** (lowercase with hyphens)
- Keep descriptive but concise (30 characters max after prefix)
- Include issue number if applicable: `feat/issue-118-jwt-auth`
- Examples:
  - `feat/apollo-client-best-practices` ✅
  - `feat/user-auth-implementation` ✅
  - `fix/n-plus-one-resolver-query` ✅
  - `docs/graphql-schema-guide` ✅
  - `test/dashboard-integration-tests` ✅
  - `refactor/extract-event-bus-logic` ✅

### 3. **Verify Branch Creation**

```bash
# Confirm you're on the new branch
git branch --show-current

# View the branch (should show your new feature branch as current)
git branch -vv
```

**Expected output**: You should see your feature branch marked with `*` indicating it's the current branch.

### 4. **Proceed to Code Quality Assurance**

Once on your feature branch, proceed to the Code Quality Assurance Workflow section below.

---

## Code Quality Assurance Workflow (Pre-Commit)

Before committing code changes, execute this **QA checklist** to ensure quality standards:

### 1. **Run Linting Checks**

```bash
# Check for ESLint violations across all packages
pnpm lint

# If failures exist, auto-fix where possible
pnpm lint:fix

# Verify all issues are resolved
pnpm lint
```

**What it catches**: TypeScript type issues, unused imports, naming conventions, suspicious code patterns.

### 2. **Type-Check with TypeScript**

```bash
# Run TypeScript type checking across all packages
pnpm type-check

# If type errors exist, review and fix them
# (Type errors cannot be auto-fixed and require manual correction)

# Verify all type checks pass
pnpm type-check
```

**What it catches**: TypeScript type mismatches, missing types, type compatibility issues across all packages in the monorepo.

### 3. **Format Code with Prettier**

```bash
# Check current formatting status
pnpm format:check

# If formatting issues exist, apply fixes
pnpm format

# Verify formatting passes
pnpm format:check
```

**What it catches**: Inconsistent spacing, quote styles, line lengths, indentation across TypeScript, TSX, JSON, and Markdown files.

### 4. **Run Tests**

```bash
# Execute full test suite to verify no regressions
pnpm test

# If any test fails, debug and fix before committing
pnpm test --watch  # For iterative development

# Test specific layer if needed
pnpm test:frontend   # Frontend only
pnpm test:graphql    # GraphQL resolvers only
pnpm test:express    # Express routes only
```

**What it catches**: Broken functionality, test coverage gaps, integration issues, N+1 query problems.

### 5. **Audit Dependencies (Root Level)**

```bash
# From monorepo root
cd /home/pluto-atom-4/Documents/stoke-full-stack/react-grapql-playground

# Audit all dependencies for security vulnerabilities
pnpm audit

# If vulnerabilities found, review and plan fixes
pnpm audit --fix  # Only if safe; prefer manual review for security fixes
```

**What it catches**: Known security vulnerabilities in dependencies, outdated packages requiring attention.

### QA Pre-Commit Workflow

```
Start Implementation
  ↓
1. git branch --show-current   (Check current branch)
  ├─ On main? → Create feature branch (feat/, fix/, docs/, etc.)
  └─ On feature branch? → Continue
  ↓
2. Make code changes
  ↓
3. pnpm generate               (Regenerate GraphQL types - if modified GraphQL schema/operations)
  ├─ Changes in backend-graphql/ or frontend graphql ops? → Run pnpm generate
  ├─ Fails? → Fix schema/operations → Re-run
  └─ Passes? → Continue
  ↓
4. pnpm lint                   (Check style/type errors across all packages)
  ├─ Fails? → pnpm lint:fix → Re-check
  └─ Passes? → Continue
  ↓
5. pnpm type-check             (Check TypeScript type safety across all packages)
  ├─ Fails? → Fix type issues → Re-check
  └─ Passes? → Continue
  ↓
6. pnpm format:check           (Check formatting across all packages)
  ├─ Fails? → pnpm format → Re-check
  └─ Passes? → Continue
  ↓
7. pnpm test                   (Run test suite for affected layers)
  ├─ Fails? → Fix code → Re-run
  └─ Passes? → Continue
  ↓
8. pnpm audit (from root)      (Check vulnerabilities)
  ├─ Issues? → Review & plan fixes
  └─ Passes? → Ready to commit
  ↓
Ready for git add + commit + push
```

**Step 3 Clarification (GraphQL Code Generation)**:

When to run `pnpm generate`:

**Run pnpm generate when**:
- ✅ **Modified GraphQL schema** (`backend-graphql/src/schema.graphql`)
  - Example: Added new field to `Build` type
  - Effect: Frontend types regenerate automatically
  
- ✅ **Added/modified GraphQL operations** (queries/mutations in `frontend/lib/graphql/`)
  - Example: New query `GET_BUILDS_SUMMARY`
  - Effect: TypeScript types for that query are generated
  
- ✅ **Changed resolver return types** (to sync frontend types)
  - Example: `build.parts` now returns `[Part!]!` instead of `[Part]`
  - Effect: Frontend types update to require all parts (non-nullable)

**Skip pnpm generate when**:
- ❌ Only modifying non-schema backend code (middleware, utils, tests)
  - Example: Added logging to a resolver
  - No regeneration needed
  
- ❌ Modifying test files or configuration
  - No regeneration needed

**Decision Tree**:

```
Did I modify backend-graphql/src/schema.graphql?
  → YES: Run pnpm generate ✅
  
Did I add/modify queries or mutations in frontend/lib/graphql/?
  → YES: Run pnpm generate ✅
  
Did I change a resolver's return type or shape?
  → YES: Run pnpm generate ✅
  
Otherwise:
  → Skip pnpm generate ❌
```

**If pnpm generate Fails**:

1. Check for GraphQL schema syntax errors
   ```bash
   pnpm generate --verbose  # Show detailed error
   ```

2. Common errors:
   - Missing required fields in type definition
   - Query operation name doesn't match variable names
   - Enum values don't match between schema and operations

3. Fix the schema, then retry
   ```bash
   pnpm generate
   ```

**After pnpm generate Succeeds**:

- New types appear in `frontend/lib/generated/graphql.ts`
- Check for type mismatches: `pnpm lint`
- Update components using new types if needed
- Run `pnpm test` to verify no regressions

### Command Shortcuts for Development

Create a local script to run all QA checks at once (optional):

```bash
# From monorepo root (standard QA pipeline):
pnpm lint && \
pnpm type-check && \
pnpm format && \
pnpm test && \
echo "✅ All QA checks passed!"

# With GraphQL codegen (if modified schema/operations):
pnpm generate && \
pnpm lint && \
pnpm type-check && \
pnpm format && \
pnpm test && \
echo "✅ All checks passed including GraphQL codegen!"
```

**Developer Responsibility**: Always run these checks before pushing commits. This ensures:

- ✅ Code passes automated QA gates (lint, format, test)
- ✅ No security vulnerabilities introduced
- ✅ Consistent code style across all layers
- ✅ Tests validate functionality
- ✅ No N+1 queries introduced in GraphQL layer
- ✅ Smooth PR review process

### Quality Check Automation (Issue #306)

**Automatic Log Capture**: All quality checks automatically capture output to `docs/dev-note/` for traceability:

```bash
# Recommended: Run with log capture
pnpm lint > docs/dev-note/issue-#[N]-pnpm-lint.txt 2>&1
pnpm type-check > docs/dev-note/issue-#[N]-pnpm-type-check.txt 2>&1
pnpm format:check > docs/dev-note/issue-#[N]-pnpm-format-check.txt 2>&1
pnpm test --run > docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1
```

**Key Design**:
- ✅ Single current log per issue/script pair (reruns overwrite the same file)
- ✅ Latest results remain available at predictable Issue #306 paths
- ✅ Reference logs in PR descriptions: `See logs: docs/dev-note/issue-#[N]-pnpm-*.txt`
- ✅ Orchestrator and reviewers reference these logs for merge decisions

**Reference in PRs**:
```markdown
## Quality Checks ✅

All automated checks passed:
- Tests: ✅ PASS (853 tests)
- Lint: ✅ PASS (0 issues)
- Format: ✅ PASS (0 issues)
- Type Check: ✅ PASS (0 errors)

See logs: docs/dev-note/issue-#[N]-pnpm-*.txt
```

See `.copilot/agents/quality-assurance.md` for full automation guidelines.

## Dual-Backend Development Workflows

### Adding a GraphQL Resolver

1. **Update schema** (`backend-graphql/src/schema.graphql`)
   ```graphql
   type Query {
     builds: [Build!]!
     build(id: ID!): Build
   }
   ```

2. **Implement resolver** (`backend-graphql/src/resolvers/Query.ts`)
   ```typescript
   export const queryResolvers = {
     builds: async (_, __, { dataloaders }) => {
       return dataloaders.buildLoader.loadMany(buildIds);
     },
   };
   ```

3. **Add DataLoader if fetching nested data** (`backend-graphql/src/dataloaders/buildLoader.ts`)
   ```typescript
   export const buildLoader = new DataLoader(async (ids) => {
     const builds = await prisma.build.findMany({ where: { id: { in: ids } } });
     return ids.map(id => builds.find(b => b.id === id));
   });
   ```

   **⚠️ DataLoader Best Practices**:
   - ✅ Create fresh DataLoader instances **per GraphQL request** (don't reuse across requests)
   - ✅ Result array **order must match input ID order** — DataLoader checks `ids[i]` → `results[i]`
   - ✅ Batching only happens **within a single GraphQL request** (not across multiple requests)
   - ❌ Never export a singleton DataLoader: `export const buildLoader = new DataLoader(...)` 
   - ❌ Don't forget to add loader to context factory in `backend-graphql/src/index.ts`
   
   **Common DataLoader Mistakes**:
   
   ```typescript
   // ❌ WRONG: Singleton leaks data across requests
   export const buildLoader = new DataLoader(async (ids) => { ... });
   
   // ✅ CORRECT: Fresh instance per request
   const context = {
     dataloaders: {
       buildLoader: new DataLoader(async (ids) => { ... }),
     }
   };
   ```
   
   **Why Order Matters**:
   ```typescript
   // Input: [id1, id2, id3]
   // Output MUST be: [record1, record2, record3] (same order!)
   // NOT:           [record3, record1, record2] (wrong order causes bugs)
   
   // Correct implementation:
   return ids.map(id => results.find(r => r.id === id)); // Maintains order
   ```

4. **Test resolver** (`backend-graphql/src/resolvers/__tests__/Query.test.ts`)
   ```typescript
   import { MockedProvider } from '@apollo/client/testing';
   // Write test with sample data
   ```

5. **Generate types** (if using GraphQL Code Generator)
   ```bash
   pnpm generate  # Auto-generates TypeScript types from schema
   ```

### Adding a File Upload Feature (Express)

1. **Create route** (`backend-express/src/routes/upload.ts`)
   ```typescript
   router.post('/upload', upload.single('file'), async (req, res) => {
     const fileId = generateId();
     await storage.save(fileId, req.file);
     eventBus.emit('fileUploaded', { fileId, buildId: req.body.buildId });
     res.json({ fileId, url: `/files/${fileId}` });
   });
   ```

2. **Emit event to event bus** for real-time subscribers
   ```typescript
   eventBus.emit('fileUploaded', { fileId, buildId, timestamp });
   ```

   **Event Bus Configuration**:
   
   Set environment variable in `.env.local`:
   ```bash
   EXPRESS_EVENT_URL=http://localhost:5000/events/emit
   # For Docker: EXPRESS_EVENT_URL=http://backend-express:5000/events/emit
   ```
   
   GraphQL emits events to Express:
   ```typescript
   // backend-graphql/src/resolvers/Mutation.ts
   export const Mutation = {
     createBuild: async (_, { input }, context) => {
       const build = await context.prisma.build.create({ data: input });
       
       // Emit event to Express event bus
       await fetch(process.env.EXPRESS_EVENT_URL, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           event: 'buildCreated',
           payload: { buildId: build.id, status: build.status, timestamp: new Date() }
         })
       }).catch(err => console.error('Event emit failed:', err));
       
       return build;
     }
   };
   ```
   
   Express receives and broadcasts:
   ```typescript
   // backend-express/src/routes/events.ts
   app.post('/events/emit', (req, res) => {
     const { event, payload } = req.body;
     
     // Broadcast to all connected SSE clients
     clients.forEach(client => {
       client.write(`event: ${event}\n`);
       client.write(`data: ${JSON.stringify(payload)}\n\n`);
     });
     
     res.json({ received: true });
   });
   ```
   
   **Failure Handling**:
   - If Express is down: Fetch fails but doesn't crash GraphQL (error caught)
   - Retry is optional (current implementation doesn't retry)
   - For critical events, consider adding retry logic with exponential backoff

3. **Test endpoint** (`backend-express/src/routes/__tests__/upload.test.ts`)
   ```typescript
   test('POST /upload saves file and emits event', async () => {
     const res = await supertest(app).post('/upload').attach('file', ...);
     expect(res.body.fileId).toBeDefined();
   });
   ```

### Adding Real-Time Updates (SSE)

1. **Add mutation in Apollo GraphQL** to trigger real-time event
   ```graphql
   type Mutation {
     updateBuildStatus(id: ID!, status: BuildStatus!): Build
   }
   ```

2. **Emit event from GraphQL resolver**
   ```typescript
   eventBus.emit('buildStatusChanged', { id, status });
   ```

3. **Express broadcasts via SSE** (`backend-express/src/routes/events.ts`)
   ```typescript
   eventBus.on('buildStatusChanged', (data) => {
     clients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
   });
   ```

4. **Frontend subscribes to SSE** (`frontend/hooks/useRealtimeEvents.ts`)
   ```typescript
   useEffect(() => {
     const eventSource = new EventSource('http://localhost:5000/events');
     eventSource.addEventListener('buildStatusChanged', (e) => {
       const data = JSON.parse(e.data);
       // Update Apollo cache or state
     });
     return () => eventSource.close();
   }, []);
   ```

### Creating a Frontend Component with Apollo

1. **Write GraphQL query** (`frontend/lib/graphql/queries.ts`)
   ```typescript
   export const GET_BUILDS = gql`
     query GetBuilds {
       builds { id status parts { id } testRuns { id result } }
     }
   `;
   ```

2. **Create custom hook** (`frontend/lib/hooks/useBuilds.ts`)
   ```typescript
   export function useBuilds() {
     return useQuery(GET_BUILDS);
   }
   ```

3. **Use in Server Component** (`frontend/app/page.tsx`)
   ```typescript
   export default async function Dashboard() {
     const { data } = await client.query({ query: GET_BUILDS });
     return <BuildsList builds={data.builds} />;
   }
   ```

4. **Handle mutations in Client Component** (`frontend/components/BuildCard.tsx`)
   ```typescript
   'use client';
   const [updateStatus] = useMutation(UPDATE_BUILD_STATUS, {
     optimisticResponse: { updateBuild: { id, status: 'COMPLETE' } }
   });
   ```

5. **Test component** (`frontend/components/__tests__/BuildCard.test.tsx`)
   ```typescript
   import { MockedProvider } from '@apollo/client/testing';
   // Wrap with MockedProvider and test mutations
   ```

## Error Handling Patterns

### GraphQL Resolver Error Handling

**✅ Throw GraphQL Errors for User Input Issues**:

```typescript
// backend-graphql/src/resolvers/Mutation.ts
export const Mutation = {
  updateBuildStatus: async (_, { id, status }, { user, prisma }) => {
    // Require authentication
    if (!user) throw new Error('Unauthorized');
    
    // Validate build exists
    const build = await prisma.build.findUnique({ where: { id } });
    if (!build) throw new Error('Build not found');
    
    // Validate status is valid
    const validStatuses = ['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Perform update
    return await prisma.build.update({
      where: { id },
      data: { status }
    });
  }
};
```

Apollo Client automatically converts these to GraphQL errors with `errors` array in response.

### Frontend Error Handling with Mutations

**✅ Handle onError Callback**:

```typescript
// frontend/components/BuildCard.tsx
'use client';

import { useMutation } from '@apollo/client/react';
import { UPDATE_BUILD_STATUS } from '@/lib/graphql/mutations';

export function BuildCard({ build }) {
  const [updateStatus, { loading, error }] = useMutation(UPDATE_BUILD_STATUS, {
    optimisticResponse: {
      updateBuildStatus: { ...build, status: 'COMPLETE', __typename: 'Build' }
    },
    onError: (err) => {
      console.error('Update failed:', err.message);
      setError(err.message); // Show in UI
    }
  });
  
  return (
    <div>
      {error && <p className="text-red-600">{error.message}</p>}
      <button 
        onClick={() => updateStatus({ variables: { id: build.id, status: 'COMPLETE' } })}
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Complete Build'}
      </button>
    </div>
  );
}
```

**Common Error Scenarios**:
- `"Unauthorized"` → User not authenticated (redirect to login)
- `"Build not found"` → Resource deleted or access denied
- `"Invalid status"` → User provided invalid enum value (show options)
- Network error → Retry or notify user

### React Error Boundaries

**Wrap Components to Catch Render Errors**:

```typescript
// frontend/components/error-boundary.tsx
'use client';

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div className="p-4 bg-red-100">Something went wrong. Please refresh.</div>;
    }
    
    return this.props.children;
  }
}
```

### Testing Error Scenarios

**Vitest + React Testing Library**:

```typescript
// frontend/components/__tests__/BuildCard.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import BuildCard from '@/components/BuildCard';
import { UPDATE_BUILD_STATUS } from '@/lib/graphql/mutations';

test('displays error when mutation fails', async () => {
  const errorMocks = [
    {
      request: { query: UPDATE_BUILD_STATUS, variables: { id: '1', status: 'COMPLETE' } },
      result: {
        errors: [{ message: 'Unauthorized' }]
      }
    }
  ];
  
  render(
    <MockedProvider mocks={errorMocks}>
      <BuildCard build={{ id: '1', status: 'PENDING' }} />
    </MockedProvider>
  );
  
  fireEvent.click(screen.getByText('Complete Build'));
  
  await waitFor(() => {
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});
```


## Model Override Guidance

**Default Model**: Claude Haiku 4.5 (configured in `.copilot/config.json`)

**Developer Agent Model Lock**:

- ✅ **Approved**: Claude Haiku 4.5 (default, fast)
- 🔒 **Locked**: `gpt-5.4`, `claude-sonnet-4.6`, `claude-opus-4.6` (premium models)

### When to Request Premium Models

**✅ Justified Use Cases** (Orchestrator approval may be required):

1. **Complex Architectural Redesigns** (> 20 min Haiku time)
   - Example: "Design fresh-per-request auth system for multi-tenant support"
   - Reasoning: Requires deep analysis of security implications

2. **Performance Deep-Dives** (data-driven optimization)
   - Example: "Analyze N+1 query patterns in resolver graph"
   - Reasoning: Requires comprehensive understanding of multiple resolvers

3. **Multi-Layer Coordination** (5+ decisions)
   - Example: "Coordinate real-time event flow across GraphQL→Express→Frontend"
   - Reasoning: Requires balancing concerns across 3 layers

4. **Interview Prep Synthesis** (synthesizing patterns for talking points)
   - Example: "Summarize error handling strategy across full stack"
   - Reasoning: Requires unified reasoning across components

**❌ Not Justified** (stick with Haiku):

- Adding a new resolver (Haiku can do this)
- Fixing a linting issue (Haiku can do this)
- Writing a test (Haiku can do this)
- Debugging a failing component (Haiku can do this)

### How to Request Premium Model

**Step 1: Use /model command in Copilot CLI**:

```bash
@developer /model claude-sonnet-4.6 [detailed justification]
```

**Step 2: Provide Justification** (2-3 sentences):

```bash
@developer /model claude-sonnet-4.6 Design the fresh-per-request auth system. 
This requires analyzing security implications across server-side Apollo client, 
JWT middleware, and data isolation guarantees.
```

**Step 3: Orchestrator May Request Approval** (for cost-intensive tasks):

- Wait for approval before proceeding
- Escalate to Orchestrator if uncertain: `@orchestrator Should we use premium model for this?`

**Cost Consideration**: 

Haiku is optimized for routine implementation and costs ~90% less than Sonnet. Use it for all standard tasks. Escalate to Orchestrator if truly premium reasoning is needed and the task justifies the cost.



## Best Practices

1. **TypeScript**: Always use strict mode; avoid `any` types
2. **GraphQL Resolvers**: Keep simple, delegate to ORM queries; always use DataLoader for batch operations
3. **Apollo Client**: Use optimistic updates for mutations; normalize cache with `__typename`
4. **React Components**: Use Server Components for data fetching, Client Components for interactivity
5. **N+1 Prevention**: Every nested resolver must use DataLoader to batch queries
6. **Testing**: Write tests before or alongside implementation (TDD preferred)
7. **Commits**: Include descriptive messages; reference related issues
8. **Use `/diff` Before Committing**: Always review changes before pushing
9. **Use `/review` for New Code**: Automated review catches edge cases
10. **QA Checklist Before Committing**:
    - ✅ `pnpm lint && pnpm lint:fix` (fix ESLint violations)
    - ✅ `pnpm type-check` (verify TypeScript type safety)
    - ✅ `pnpm format:check && pnpm format` (enforce Prettier formatting)
    - ✅ `pnpm test` (all tests pass)
    - ✅ `pnpm audit` from root (no security vulnerabilities)

## Docker Services

Start services before development:

```bash
docker-compose up -d
```

Includes:
- **PostgreSQL**: Database for GraphQL layer (port 5432)

## Multi-Service Debugging

Start each service in separate terminal for independent debugging:

```bash
# Terminal 1: Frontend (http://localhost:3000)
pnpm dev:frontend

# Terminal 2: Apollo GraphQL (http://localhost:4000/graphql)
pnpm dev:graphql

# Terminal 3: Express (http://localhost:5000)
pnpm dev:express

# Terminal 4: Run tests in watch mode
pnpm test --watch
```

### Debugging Tools

- **GraphiQL IDE**: `http://localhost:4000/graphql` (test queries/mutations)
- **Apollo DevTools**: Browser extension for cache inspection
- **Next.js Dev**: `http://localhost:3000` (fast reload, error overlay)
- **Express Logging**: `DEBUG=express:* pnpm dev:express`
- **PostgreSQL**: `psql postgresql://user:pass@localhost:5432/boltline`

### N+1 Query Detection

Enable SQL query logging to catch N+1 problems:

```bash
# Prisma query logging
DATABASE_DEBUG=* pnpm dev:graphql

# Or add timing logs in resolvers
console.time('Query: builds');
const builds = await prisma.build.findMany();
console.timeEnd('Query: builds');
```

## Interview Context

When implementing features, keep real-world constraints in mind:

- **DataLoader efficiency**: Batch loading prevents cascading queries on nested data (e.g., 50 builds with 1000+ parts requires single query with DataLoader)
- **Optimistic updates**: Mutations show instant feedback before server confirms—critical for technicians on spotty shop-floor WiFi
- **Event-driven real-time**: SSE streaming enables live updates without polling
- **Separation of concerns**: GraphQL handles structured data operations; Express handles auxiliary concerns (files, webhooks, events)

## Parallel Execution Mode

When multiple independent issues run in parallel via git worktree:

**Key Points**:
- ✓ Each worktree is completely isolated (no conflicts with other agents)
- ✓ Execute your task independently (don't wait for others)
- ✓ Push to feature branch when ready: `git push origin [branch-name]`
- ✓ Create PR: `gh pr create`
- ✓ Include co-author: `Co-authored-by: Copilot <...>`

**Verify Context**:
```bash
pwd                    # Confirm correct worktree directory
git branch             # Verify correct branch
git status             # Check clean state
```

**See orchestrator.md** for complete parallel execution coordination patterns and git worktree setup.

## Workflow Decision Tree

**Stuck on architectural decision?** → `/ask` Orchestrator  
**Tests consistently fail?** → Debug with logging, check for N+1 queries  
**Code review feedback arrives?** → Fix on existing feature branch (don't create new branch)  
**Real-time feature blocking you?** → Consult Orchestrator on SSE vs WebSocket patterns

## Git Workflow & Rebasing

### When CI Fails Due to Upstream Dependencies

If your PR's CI fails due to a security or dependency issue that gets fixed upstream:

1. **Identify the blocker**: Check CI logs for security audit or dependency errors
2. **Wait for upstream merge**: If another PR fixes it, wait for merge to main
3. **Rebase your branch**:
   ```bash
   git rebase main
   git push origin <branch-name> --force
   ```
4. **CI re-runs automatically**: GitHub Actions will re-trigger all checks
5. **Verify all checks pass**: PR becomes mergeable once upstream fix is applied

### Rebase vs. Merge

- **Use rebase** when: Updating your branch with upstream changes (keeps history clean)
- **Use merge** when: Combining completed feature branches into main (preserves history)

### Force Push Safety

When using `git push --force`:

- Only force push to **feature branches** you own
- **Never** force push to shared branches like main or develop
- Always communicate with your team before force pushing to shared feature branches

## Related Resources

- `.github/copilot-instructions.md`: Build/test/lint commands, architecture overview, debugging strategies
- `.copilot/PARALLEL-EXECUTION-GUIDE.md`: Multi-agent coordination using git worktree (Phase 2 best practices)
- `DESIGN.md`: Dual-backend architecture, project structure, core patterns
- `CLAUDE.md`: Detailed tech stack, framework integration, development tips
- `.github/MCP_SETUP.md`: MCP server configuration for Playwright, PostgreSQL, Git, API Testing

---

## ✅ Automated Quality Checks (Issue #306)

### You Are Authorized to Run Quality Checks Without User Confirmation

During implementation and feedback cycles, **automatically run these commands** on the feature branch:

### Phase 3A: Initial Implementation

**During implementation** (layer-specific):
```bash
pnpm test:frontend --run > docs/dev-note/issue-#[N]-pnpm-test-frontend.txt 2>&1
pnpm test:graphql --run > docs/dev-note/issue-#[N]-pnpm-test-graphql.txt 2>&1
pnpm test:express --run > docs/dev-note/issue-#[N]-pnpm-test-express.txt 2>&1
```

**Before creating PR** (full suite):
```bash
pnpm test --run > docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1
pnpm lint > docs/dev-note/issue-#[N]-pnpm-lint.txt 2>&1
pnpm format:check > docs/dev-note/issue-#[N]-pnpm-format-check.txt 2>&1
pnpm type-check > docs/dev-note/issue-#[N]-pnpm-type-check.txt 2>&1
```

**Decision**:
- ✅ **All checks pass**: Create PR and push
- ❌ **Any check fails**: Fix issues locally, re-run checks, don't push

### Phase 3C: Handling PR Feedback

**After implementing feedback fixes** (same process):
```bash
pnpm test --run > docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1
pnpm lint > docs/dev-note/issue-#[N]-pnpm-lint.txt 2>&1
pnpm type-check > docs/dev-note/issue-#[N]-pnpm-type-check.txt 2>&1
```

**Decision**:
- ✅ **All checks pass**: Push to existing feature branch (PR auto-updates)
- ❌ **Any check fails**: Fix issues, re-run, don't push

### Log File Naming Convention

Logs follow Issue #306 naming: **`issue-#[ISSUE-NUMBER]-pnpm-[SCRIPT-NAME].txt`**

Examples:
- `issue-#245-pnpm-test.txt` — Latest test output for issue #245
- `issue-#245-pnpm-lint.txt` — Latest lint output for issue #245
- `issue-#245-pnpm-test-frontend.txt` — Latest frontend tests for issue #245

**Design**: One file per (issue, script) pair. Each new run replaces the previous log.

### What to Do If Quality Checks Fail

1. **Read the error message** in the log file
2. **Identify the issue** (usually in specific files)
3. **Fix the problem** in your code
4. **Re-run the check** (new output replaces old log)
5. **Repeat until all pass**
6. **Only then** commit and push

### Common Quality Check Failures

**ESLint failures** (pnpm lint):
- Fix with: `pnpm lint:fix` (auto-fixes many issues)
- Run full lint again to verify

**Format failures** (pnpm format:check):
- Fix with: `pnpm format` (auto-formats all files)
- Run format:check again to verify

**Type errors** (pnpm type-check):
- Fix TypeScript errors in your code (no auto-fix available)
- Run type-check again to verify

**Test failures** (pnpm test --run):
- Read error message in log file
- Fix the failing test or the code it tests
- Re-run specific test or full suite

### Reference in PR Description

When creating PR, include quality check status:

```markdown
## Quality Checks ✅

All automated quality checks passed:
- Tests: PASS (see `issue-#[N]-pnpm-test.txt`)
- Lint: PASS (see `issue-#[N]-pnpm-lint.txt`)
- Format: PASS (see `issue-#[N]-pnpm-format-check.txt`)
- Type Check: PASS (see `issue-#[N]-pnpm-type-check.txt`)
```

---

## Claude Code Best Practices for Developers

### Context Loading Before Implementation

**Before starting implementation**:
```
Load in order (sequential):
1. Read layer-specific instruction file
   (frontend.instructions.md OR backend-graphql.instructions.md OR backend-express.instructions.md)
2. Read relevant DESIGN.md patterns (2-3 min read)
3. Review 1-2 recent PRs in same layer (understand current patterns)

Timeline: 10-15 min upfront for complete context
Result: Avoid false starts and rework
```

### Multi-Layer Context Strategy

**When feature spans multiple layers**:
```
Load context for EACH layer (parallel):
- Frontend: frontend.instructions.md
- GraphQL: backend-graphql.instructions.md  
- Express: backend-express.instructions.md
- Shared: shared.instructions.md
- Patterns: DESIGN.md (relevant sections)

Result: Complete picture before touching any code
Avoids: Cross-layer integration issues discovered late
```

### Model Override Recommendations

**Use Haiku (default) for**:
- ✅ Single-layer implementation
- ✅ Bug fixes within known patterns
- ✅ Tests and documentation
- ✅ Code refactoring

**Use Sonnet/Opus for**:
- 🔍 Complex multi-layer features
- 🔍 Performance optimization from first principles
- 🔍 Architectural questions (escalate to Architect)
- 🔍 Debugging subtle cross-layer bugs

### Implementation Workflow in Claude Code

**Optimal workflow**:
```
1. Load context (layer instructions + DESIGN.md)
2. Ask clarifying questions about approach
3. Get detailed implementation guidance
4. Begin coding
5. Ask for debugging help if stuck
6. Get test strategy from Tester guidance section
7. Run quality checks (Issue #306 pattern)
```

### Handling Blocked Work

**If blocked by architecture or another layer**:
```
STEP 1: Document blocker clearly
  - What are you trying to do?
  - What's blocking you?
  - What needs to change to unblock?

STEP 2: Escalate to Orchestrator
  - Provide context from Step 1
  - Orchestrator coordinates with other layer/Architect

STEP 3: Continue other work
  - Move to different phase/layer if possible
  - Don't block waiting for resolution

RESULT: Orchestrator coordinates, you continue productive work
```

---
