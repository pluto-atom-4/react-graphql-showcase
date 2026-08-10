# Reusable Pattern Guides

This directory contains focused, reusable patterns for AI tool configuration and development best practices.

---

## Available Patterns

### 1. DataLoader Pattern
**File**: [`dataloaders-pattern.md`](./dataloaders-pattern.md)  
**Scope**: Backend GraphQL  
**Problem**: N+1 query problem when resolving nested relationships  
**Solution**: Batch-load related entities in single database query per request

**Key Points**:
- Prevents N+1 queries (Build → Parts relationship)
- Plugged into Apollo context, used transparently
- One loader per relationship
- Return arrays in same order as input IDs

**Applies To**:
- `backend-graphql/src/resolvers/*.ts`
- Field resolvers with nested relationships

---

### 2. Server/Client Components Pattern
**File**: [`server-client-components-pattern.md`](./server-client-components-pattern.md)  
**Scope**: Frontend (Next.js 13+)  
**Problem**: Understanding when to use Server Components vs Client Components  
**Solution**: Default to Server Components, mark interactive features with `'use client'`

**Key Points**:
- Server Components: Fetch data, secure operations, no browser bundle
- Client Components: Interactivity, browser APIs, React hooks
- Pass serializable data across boundary
- Apollo Client in Client Components

**Applies To**:
- `frontend/app/**/*.tsx`
- All React components in Next.js 13+ App Router

---

### 3. Event Emission Pattern
**File**: [`event-emission-pattern.md`](./event-emission-pattern.md)  
**Scope**: Backend Coordination (GraphQL ↔ Express)  
**Problem**: Decoupling GraphQL from Express async operations  
**Solution**: Emit typed events from GraphQL mutations, broadcast via Express SSE

**Key Points**:
- GraphQL mutation → HTTP POST event to Express
- Express receives and broadcasts via SSE
- Frontend subscribes via EventSource listener
- Enables real-time updates without polling

**Applies To**:
- `backend-graphql/src/resolvers/*Mutation.ts`
- `backend-express/src/routes/events.ts`
- `frontend/components/*RealTime.tsx`

---

### 4. Authentication Patterns
**File**: [`auth-patterns.md`](./auth-patterns.md)  
**Scope**: Full Stack (frontend, GraphQL, Express)  
**Problem**: Secure user identification and permission checks  
**Solution**: JWT tokens, context-based authorization, field-level checks

**Key Points**:
- Extract user from JWT in GraphQL middleware
- Protect resolvers with permission checks
- Throw UNAUTHENTICATED vs FORBIDDEN
- Store token securely (httpOnly cookie in production)
- Refresh token before expiry

**Applies To**:
- `backend-graphql/src/middleware/auth.ts`
- `backend-graphql/src/resolvers/Query.ts` (protected resolvers)
- `frontend/lib/apollo.ts` (JWT header injection)
- `backend-express/src/middleware/auth.ts`

---

### 5. Backend Integration Pattern
**File**: [`backend-integration-pattern.md`](./backend-integration-pattern.md)  
**Scope**: Full Stack (GraphQL + Express coordination)  
**Problem**: Coordinating dual backends via shared database and events  
**Solution**: GraphQL owns data writes, Express handles async jobs, events coordinate

**Key Points**:
- GraphQL: Primary data operations (CRUD)
- Express: File I/O, webhooks, SSE broadcasting
- Both share PostgreSQL via Prisma
- Events flow: GraphQL → Express → Frontend (SSE)
- Database is single source of truth

**Applies To**:
- End-to-end feature implementation
- Cross-layer data flow design
- Architecture decisions

---

### 6. Security Patterns
**File**: [`security-patterns.md`](./security-patterns.md)  
**Scope**: Full Stack (all layers)  
**Problem**: Preventing common web vulnerabilities  
**Solution**: CSRF protection, input validation, rate limiting, SQL injection prevention

**Key Points**:
- Validate all user input with Zod
- Sanitize HTML output with DOMPurify
- CSRF tokens for mutations
- Rate limiting on endpoints
- Secrets in environment variables
- Never log sensitive data
- Parameterized queries only

**Applies To**:
- `backend-graphql/src/resolvers/*.ts`
- `backend-express/src/routes/*.ts`
- `frontend/components/*.tsx`
- All mutation/form handling

---

## How to Use These Patterns

### Step 1: Identify Your Problem
Map your task to one of the 6 patterns above based on:
- **What layer** (frontend, GraphQL, Express)?
- **What problem** (N+1 queries, real-time updates, auth)?
- **What component** (resolver, component, route)?

### Step 2: Read the Pattern
Open the pattern file:
```bash
cat .claude/patterns/dataloaders-pattern.md
```

### Step 3: Reference from Instructions
Path-specific instructions link to relevant patterns:
- `.github/instructions/frontend.instructions.md` → Server/Client Components, Event Emission
- `.github/instructions/backend-graphql.instructions.md` → DataLoader, Auth, Event Emission
- `.github/instructions/backend-express.instructions.md` → Backend Integration, Security

### Step 4: Implement with Pattern
Follow code examples and key rules from the pattern file. Test against the checklist.

---

## Pattern Quick Reference

| Pattern | Layer | Problem | Link |
|---------|-------|---------|------|
| DataLoader | GraphQL | N+1 queries | [View](./dataloaders-pattern.md) |
| Server/Client Components | Frontend | When to use each | [View](./server-client-components-pattern.md) |
| Event Emission | GraphQL ↔ Express | Async coordination | [View](./event-emission-pattern.md) |
| Authentication | Full Stack | Secure user auth | [View](./auth-patterns.md) |
| Backend Integration | GraphQL + Express | Dual-backend coordination | [View](./backend-integration-pattern.md) |
| Security | Full Stack | Prevent vulnerabilities | [View](./security-patterns.md) |

---

## Adding New Patterns

When a pattern emerges from multiple issues:

1. Create new file: `.claude/patterns/pattern-name.md`
2. Follow existing format (60-70 lines max)
3. Include: When to use, implementation, key rules, testing, links
4. Update this README with entry and quick reference row
5. Link from relevant `.instructions.md` files
6. Commit: `git add .claude/patterns/*.md` and reference the pattern in commit message

---

## Standards for Pattern Files

Each pattern file should:
- **Title**: Clear, one-line description
- **Scope**: Which layers/components
- **When to Use**: Problem statement
- **Pattern**: Code example (TypeScript, 20-30 lines)
- **Key Rules**: 3-5 critical points (checklist format)
- **Testing**: Unit test example
- **Common Mistakes**: 3-5 pitfalls
- **Links**: Cross-references to related patterns and instructions

---

## Related Documentation

- **[DESIGN.md](../DESIGN.md)** — Architecture overview, dual-backend rationale
- **[.github/instructions/](../.github/instructions/)** — Path-specific development guides
- **[CLAUDE.md](../CLAUDE.md)** — Quick start, common commands
- **[docs/start-from-here.md](../docs/start-from-here.md)** — 7-day practice plan

---

**Last Updated**: 2026-08-09  
**Pattern Language**: 6 core reusable patterns for full-stack development
