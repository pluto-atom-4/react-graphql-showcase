# Orchestrator Analysis: Tech Stack Task Breakdown

**Source Documents**:
- `docs/version-conflict-free-stack.md` (version guidance)
- `.copilot/agents/orchestrator.md` (coordination framework)

**Analysis Approach**:
From the Orchestrator perspective, breaking down version-conflict-free-stack.md into:
1. **Dependency constraints** (Next.js 16, React 19, Apollo 4, TypeScript 7.x)
2. **Integration points** (App Router, DataLoader, SSE, event bus)
3. **Quality gates** (lint, format, tests, security)
4. **Deployment strategy** (staging, production, monitoring)

---

## Executive Summary

**10 GitHub Issues Created** spanning 6 phases:

### Phase 1: Foundation (Issue #2)
- Core monorepo setup with version-conflict-free stack

### Phase 2: Layer Setup (Issues #3-5)
- Frontend: Next.js 16 + React 19 + Apollo Client 4
- Backend GraphQL: Apollo Server 4 + DataLoader + PostgreSQL
- Backend Express: File uploads, webhooks, SSE

### Phase 3: Integration (Issues #6-7)
- Frontend ↔ GraphQL integration with real-time SSE
- Cross-layer event bus coordination

### Phase 4: Testing (Issue #8)
- E2E tests with Playwright

### Phase 5: DevOps (Issue #9)
- 6-phase CI/CD pipeline

### Phase 6: Documentation & Interview (Issues #10-11)
- API docs, deployment guides, troubleshooting
- Interview prep, talking points, system design

---

## Task Dependency Graph

```
Issue #2 (Setup)
    ↓
    ├─→ Issue #3 (Frontend)
    ├─→ Issue #4 (GraphQL)
    └─→ Issue #5 (Express)
            ↓
            ├─→ Issue #6 (Frontend-GraphQL Integration)
            ├─→ Issue #7 (Event Bus Coordination)
            |       ↓
            |   Issue #8 (E2E Tests)
            |       ↓
            └─→ Issue #9 (CI/CD Pipeline)
                    ↓
                    ├─→ Issue #10 (Documentation)
                    └─→ Issue #11 (Interview Prep)
```

---

## Issues Breakdown

### Issue #2: Setup - Core Tech Stack Initialization
**Orchestrator Role**: Foundation setting  
**Complexity**: Medium  
**Duration**: 2-3 days  
**Key Decision**: Version-conflict-free approach with:
- pnpm workspaces for monorepo
- Next.js 16 LTS (Turbopack)
- React 19 compatibility layer
- TypeScript 7.x with 'bundler' moduleResolution

**Exit Criteria**:
- All workspaces compile
- pnpm install succeeds
- No dependency conflicts

---

### Issue #3: Frontend - Next.js 16 + React 19 + Apollo Client 4
**Orchestrator Role**: Frontend layer coordination  
**Complexity**: High  
**Duration**: 4-5 days  
**Critical Decisions**:
- Use App Router (not Pages)
- Use @apollo/client-nextjs for Server Component support
- Apollo Client 4.x (post-legacy cleanup)

**Key Files**: 
- `frontend/app/layout.tsx` (Apollo provider)
- `frontend/lib/apollo.ts` (client setup)
- `frontend/lib/hooks/useBuild.ts` (custom hooks)

**Blockers**: Depends on #2 (Core Stack)

---

### Issue #4: Backend GraphQL - Apollo Server 4 + DataLoader + PostgreSQL
**Orchestrator Role**: GraphQL layer with N+1 prevention  
**Complexity**: High  
**Duration**: 4-5 days  
**Critical Decisions**:
- Apollo Server 4.x with @as-integrations/express4
- Prisma ORM for type-safe DB access
- DataLoader for all nested resolvers (builds, parts, testRuns)
- Event emission from mutations

**Key Files**:
- `backend-graphql/src/schema.graphql` (source of truth)
- `backend-graphql/src/resolvers/` (Query, Mutation, Build, TestRun)
- `backend-graphql/src/dataloaders/` (batch loaders)

**Critical for Interview**: DataLoader pattern—"Loading 50 builds with 1000+ parts: DataLoader batches into 2 queries instead of 1+50+50M"

**Blockers**: Depends on #2

---

### Issue #5: Backend Express - File Uploads, Webhooks, SSE
**Orchestrator Role**: Express layer with real-time coordination  
**Complexity**: High  
**Duration**: 4-5 days  
**Critical Decisions**:
- Express 4.21.1+ (latest stable)
- Multer for file uploads
- EventEmitter-based event bus
- Server-Sent Events (SSE) for real-time
- Connection lifecycle management (prevent memory leaks)

**Key Files**:
- `backend-express/src/routes/upload.ts` (file storage)
- `backend-express/src/routes/webhooks.ts` (event processing)
- `backend-express/src/routes/events.ts` (SSE streaming)
- `backend-express/src/services/eventBus.ts` (event coordination)

**Critical for Interview**: "Express handles auxiliary concerns (uploads, webhooks, real-time); GraphQL handles data. Each scales independently."

**Blockers**: Depends on #2

---

### Issue #6: Integration - Frontend ↔ GraphQL with Real-Time SSE
**Orchestrator Role**: Frontend-GraphQL integration  
**Complexity**: Very High  
**Duration**: 5-7 days  
**Integration Points**:
- Apollo queries in Server Components (fetch in server, pass to client)
- Apollo mutations in Client Components (optimistic updates)
- SSE listeners for real-time updates
- Apollo cache synchronization on SSE events

**Key Challenges**:
- Optimistic updates must work on poor WiFi
- Multiple clients must see synchronized updates
- No N+1 queries (verified via DevTools)

**Key Files**:
- `frontend/lib/graphql/queries.ts` (GET_BUILDS, GET_BUILD)
- `frontend/lib/graphql/mutations.ts` (UPDATE_BUILD_STATUS)
- `frontend/lib/hooks/useRealtimeEvents.ts` (SSE listener)
- `frontend/components/RealtimeEvents.tsx` (SSE integration)

**Critical for Interview**: "Optimistic updates show instant feedback before server confirms—critical for technicians on spotty shop-floor WiFi."

**Blockers**: Depends on #3, #4, #5  
**Blocks**: #8 (E2E tests)

---

### Issue #7: Integration - Cross-Layer Event Bus
**Orchestrator Role**: Multi-layer coordination  
**Complexity**: Very High  
**Duration**: 3-4 days  
**Coordination Flow**:
1. GraphQL mutation calls resolver
2. Resolver updates database
3. Resolver emits event (buildStatusChanged)
4. Express event bus broadcasts event
5. Frontend SSE listener receives event
6. Apollo cache updated with new data
7. UI re-renders

**Key Challenges**:
- Event delivery semantics (exactly-once? at-least-once?)
- Latency requirement (<100ms from mutation to SSE)
- Memory leak prevention (proper cleanup on disconnect)
- Race condition prevention (concurrent mutations)

**Key Files**:
- `backend-express/src/services/eventBus.ts` (EventEmitter)
- `backend-graphql/src/context/eventBus.ts` (emit in resolvers)
- `frontend/lib/hooks/useRealtimeEvents.ts` (SSE listener)

**Critical for Interview**: "Event-driven architecture: Apollo mutation → Express event bus → SSE stream to clients. All clients see synchronized updates in <100ms."

**Blockers**: Depends on #3, #4, #5  
**Blocks**: #8 (E2E tests)

---

### Issue #8: Testing - E2E Tests with Playwright
**Orchestrator Role**: Quality assurance across layers  
**Complexity**: Very High  
**Duration**: 5-7 days  
**Key Workflows to Test**:
1. Create build → view in list → edit status
2. Upload file → see in GraphQL query → view in frontend
3. Webhook event → real-time update → multiple clients see sync
4. Build creation → SSE event → Apollo cache → UI refresh

**Testing Strategy**:
- Headless browser automation (Playwright)
- Real database (test db)
- Real backends (frontend, GraphQL, Express all running)
- Performance benchmarking (<5s per workflow)
- Network requests verified (no N+1 queries)

**Key Files**:
- `frontend/e2e/build-workflow.spec.ts`
- `frontend/e2e/upload-workflow.spec.ts`
- `frontend/e2e/real-time-workflow.spec.ts`
- `frontend/e2e/webhook-workflow.spec.ts`
- `playwright.config.ts`

**Critical for Interview**: "My E2E tests verify complete workflows end-to-end. If a developer breaks N+1 query prevention, the tests catch it."

**Blockers**: Depends on #6, #7  
**Blocks**: #9 (CI/CD)

---

### Issue #9: DevOps - GitHub Actions CI/CD Pipeline
**Orchestrator Role**: Continuous integration automation  
**Complexity**: High  
**Duration**: 3-4 days  
**6-Phase Pipeline**:
1. **Code Quality** (lint, format) ~2 min
   - `pnpm lint` (ESLint across all packages)
   - `pnpm format:check` (Prettier)
   
2. **Security Audit** ~1 min
   - `pnpm audit` (dependency vulnerabilities)

3. **Build & Test** (parallel) ~5-10 min
   - Matrix: frontend, backend-graphql, backend-express
   - Each: build + test with coverage

4. **Integration Tests** ~3-5 min
   - PostgreSQL service container
   - Cross-layer integration verification
   - DataLoader batching verification

5. **E2E Tests** (conditional on main) ~10-15 min
   - Playwright tests
   - Full stack running

6. **Coverage & Reporting** ~2 min
   - Codecov integration
   - PR comments with coverage delta

**Total Feedback Time**: ~15 minutes from push

**Key Files**:
- `.github/workflows/ci.yml` (main CI pipeline)
- `.github/workflows/deploy.yml` (deployment to staging/prod)

**Critical for Interview**: "My CI pipeline gives developers feedback within 15 minutes. If they forgot DataLoader, N+1 query detection catches it in integration tests."

**Blockers**: Depends on #8 (E2E tests ready)  
**Blocks**: Production deployment

---

### Issue #10: Documentation - API Reference, Deployment, Troubleshooting
**Orchestrator Role**: Knowledge capture  
**Complexity**: Medium  
**Duration**: 2-3 days  
**Documentation Needed**:
1. **GraphQL API Reference**: Schema, queries, mutations, subscriptions
2. **Express REST API**: Endpoints (upload, webhooks, events)
3. **Local Development Setup**: Docker + pnpm (5-min quickstart)
4. **Production Deployment**: Kubernetes manifests, rollback procedures
5. **Troubleshooting**: Common issues (N+1 queries, SSE memory leaks, timeouts)
6. **ADRs**: Architecture Decision Records for major choices
7. **Performance Tuning**: Query optimization, caching, monitoring
8. **Security Hardening**: Auth, validation, secrets management

**Key Files**:
- `docs/API.md` (GraphQL + REST endpoints)
- `docs/DEPLOYMENT.md` (production procedures)
- `docs/TROUBLESHOOTING.md` (debugging guide)
- `docs/ADR-*.md` (decisions: why DataLoader, why dual-backend, etc.)

**Critical for Interview**: "My documentation lets new team members onboard in 1 day. All architectural decisions are recorded in ADRs."

---

### Issue #11: Interview Prep - Talking Points, Code Examples, System Design
**Orchestrator Role**: Interview preparation  
**Complexity**: Medium  
**Duration**: 2-3 days  
**Topics to Cover**:
1. **DataLoader Pattern**: Explain N+1 prevention (code example)
2. **Dual-Backend Architecture**: Separation of concerns, independent scaling
3. **Optimistic Updates**: Manufacturing WiFi scenario
4. **Real-Time SSE Coordination**: Event-driven architecture
5. **Resource Provisioning**: Scaling frontend/GraphQL/Express independently
6. **Observability & Monitoring**: Prometheus metrics, alerting, logging

**Interview Questions to Answer**:
- "How would you scale each layer independently?"
- "What happens when GraphQL is slow but Express is fast?"
- "How do you prevent N+1 queries?"
- "How do you handle real-time updates for poor WiFi?"
- "What metrics would you monitor in production?"

**Key Files**:
- `docs/INTERVIEW_PREP.md` (talking points)
- `examples/dataloader-explanation.ts` (code example)
- `examples/dual-backend-flow.md` (architecture diagram)

---

## Orchestrator Coordination Notes

### Critical Sequencing
```
Phase 1: Setup (#2)
    ↓
Phase 2: Parallel Layer Development (#3, #4, #5)
    - Can run in parallel
    - Each layer independent
    - Minor integration (shared .env, TypeScript config)
    ↓
Phase 3: Integration (#6, #7)
    - Frontend-GraphQL integration
    - Event bus coordination
    - These require all layers complete
    ↓
Phase 4: Quality (#8, #9)
    - E2E tests after integration
    - CI/CD pipeline setup
    ↓
Phase 5: Documentation & Interview (#10, #11)
    - Parallel with testing/CI
```

### Risk Mitigation
1. **#2 Setup**: Run `pnpm install` early; catch version conflicts immediately
2. **#4 GraphQL**: DataLoader is critical—verify with N+1 detection tests
3. **#5 Express**: SSE connections can leak memory—add cleanup and tests
4. **#7 Event Bus**: Race conditions possible—thorough testing required
5. **#9 CI/CD**: Test locally before committing; CI is not debugging environment

### Interview Talking Points by Issue
- **#2**: "I chose version-conflict-free stack (Next.js 16, React 19, Apollo 4) for stability"
- **#3-5**: "Three distinct layers, each optimizable for its concerns"
- **#6-7**: "Real-time coordination via event bus—clients see updates in <100ms"
- **#8**: "E2E tests verify complete workflows; if DataLoader breaks, tests catch it"
- **#9**: "15-min feedback loop: developers know if code quality passes in 2 min"
- **#10**: "Documentation through ADRs—future engineers understand decisions"
- **#11**: "This architecture mirrors production systems at Stoke Space"

---

## Metrics for Success

| Issue | Success Metric |
|-------|---|
| #2 | All packages compile, no conflicts |
| #3 | Frontend runs on :3000, Apollo works |
| #4 | GraphQL runs on :4000, no N+1 queries |
| #5 | Express runs on :5000, SSE works |
| #6 | Mutations sync to 2+ clients via SSE |
| #7 | Event latency <100ms, no memory leaks |
| #8 | All 4 workflows pass end-to-end |
| #9 | Full CI passes in <15 minutes |
| #10 | API docs cover all endpoints, troubleshooting helps |
| #11 | Can explain architecture in <5 min to interviewer |

---

**Next Steps**: Start with #2 (Setup), then parallelize #3-5, then proceed sequentially through #6-11.

