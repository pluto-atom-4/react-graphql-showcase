---
version: "2026-08"
scope: "repository-level"
tools: ["GitHub Copilot", "GitHub Copilot CLI", "Claude Code"]
updated: "2026-08-30"
effort_level: "medium"
---

# Copilot Instructions - WRAP Format

Stoke Full Stack React/GraphQL Playground multi-agent workflow guide (Aug 2026).

---

## WHAT - Context & Overview

### Project Summary
**Full-stack React/GraphQL playground** for Stoke Space interview prep. Monorepo with:
- **Frontend**: Next.js 16 + React 19 + Apollo Client (Server/Client Components)
- **Backend**: Apollo GraphQL (data) + Express.js (files, webhooks, SSE)
- **Database**: PostgreSQL shared by both backends
- **Real-time**: Event bus for async coordination between layers

### Key Resources
- **[CLAUDE.md](../../CLAUDE.md)** — Quick start, commands (58 lines)
- **[DESIGN.md](../../DESIGN.md)** — Architecture, dual-backend pattern
- **[AGENTS.md](../../AGENTS.md)** — Multi-agent orchestration, roles, handoff
- **[SKILLS.md](../../SKILLS.md)** — 74 indexed skills by domain
- **[.claude/patterns/](../../.claude/patterns/)** — Reusable pattern guides
- **[.github/instructions/](./instructions/)** — Path-scoped layer guidance
- **[.github/copilot/rules/](./copilot/rules/)** — Domain-specific rules

### Architecture Layers
1. **Frontend**: `frontend/` → Next.js app, components, hooks, tests
2. **GraphQL Backend**: `backend-graphql/` → Resolvers, DataLoader, schema, migrations
3. **Express Backend**: `backend-express/` → Routes (upload, webhooks, SSE), middleware
4. **Shared**: PostgreSQL, authentication, event bus

### DO / DON'T Quick Reference

| Category | DO ✅ | DON'T ❌ |
|----------|-------|---------|
| **TypeScript** | Strict mode, explicit types | `any` type, untyped JSON |
| **Testing** | Unit + integration per layer | Skip edge cases, no regression tests |
| **Error Handling** | Typed Error objects, specific codes | String errors, generic "error occurred" |
| **GraphQL** | DataLoader for nested queries, event emission from mutations | N+1 queries, missing event broadcasts |
| **Express** | Middleware chain (auth→validation→handler), signature verification | Unverified webhooks, hardcoded secrets |
| **React** | Server Components for data fetch, Client Components for interactivity | Mixed patterns, all Client Components |
| **Commits** | `feat(#N): description`, link to issue | Generic "fix", no issue linkage |
| **Branch** | One issue → one branch → one PR | Multiple branches per issue, pushing to main |
| **Review** | Layer-scoped `.instructions.md`, check patterns | Approve without testing, ignore escalation paths |

---

## RULES - Workflow, Quality Gates, Constraints

### Rule 1: One Issue → One Branch → One PR
```
GitHub Issue Created
  ↓
@orchestrator: Create execution plan (read issue, identify layers, estimate time)
  ↓
Plan saved to docs/implementation-planning/
  ↓
@coder: Create feature branch `feat/issue-#<N>-<description>`
  ↓
Implement on branch (do NOT create new branches for feedback fixes)
  ↓
Push to remote, create PR
  ↓
@reviewer: Examine diff, provide feedback
  ↓
Feedback? → YES → @coder: Fix on EXISTING branch
           ↓ NO
         Approved! → Merge to main
  ↓
@tester: Run consolidation tests, verify end-to-end
  ↓
All pass? → YES → Feature complete
          ↓ NO
          Issue → @coder: Hotfix → Re-test
```

### Rule 2: Quality Gate (Required Before Merge)
- ✅ All tests pass: `pnpm test --run`
- ✅ No lint violations: `pnpm lint`
- ✅ TypeScript strict mode: `pnpm type-check`
- ✅ Path-scoped patterns followed (see `.github/instructions/`)
- ✅ Commit messages link issue #N: `feat(#<N>): description`
- ✅ PR description explains changes
- ✅ No direct pushes to main

### Rule 3: Layer-Specific Patterns (Required)
- **Frontend**: Follow `.github/instructions/frontend.instructions.md`
  - Server/Client component split, Apollo mutations, form handling
- **GraphQL**: Follow `.github/instructions/backend-graphql.instructions.md`
  - Resolvers, DataLoader batching, N+1 prevention, event emission
- **Express**: Follow `.github/instructions/backend-express.instructions.md`
  - Route organization, middleware, webhook verification, SSE broadcasting
- **All Layers**: Follow `.github/instructions/shared.instructions.md`
  - TypeScript strict mode, testing conventions, documentation

### Rule 4: No Long-Running Tasks
- Each phase should be ≤60 minutes
- Break large features into multiple phases
- Document dependencies between phases
- Clear handoff criteria between agents

### Rule 5: Escalation Paths
| Situation | Escalate To | Action |
|-----------|-------------|--------|
| Issue unclear/ambiguous | @orchestrator | Re-plan with stakeholder input |
| Architecture question | @orchestrator | Redesign, check DESIGN.md patterns |
| Cross-layer blocker | @orchestrator | Coordinate handoff, break dependencies |
| Code pattern violation | @reviewer | Reference `.instructions.md`, suggest fix |
| N+1 query detected | @coder → @orchestrator | Redesign DataLoader strategy |
| Test failure post-merge | @tester → @coder | Hotfix on same branch |
| Performance regression | @qa → @coder | Profile and optimize |
| Merge conflict on main | @reviewer | Coordinate rebase strategy |

---

## ACTIONS - How to Invoke, What to Do

### @orchestrator - Planning & Coordination
**When to invoke**:
- New GitHub issue created (auto-trigger)
- User says: "plan this feature", "create execution plan", "analyze requirements"
- Cross-layer coordination needed, dependencies unclear

**Responsibilities**:
1. Read issue description and linked docs
2. Identify affected files and layers (frontend, backend-graphql, backend-express)
3. Create step-by-step execution plan with time estimates
4. Reference path-scoped `.instructions.md` for layer patterns
5. Save plan to `docs/implementation-planning/ISSUE-#<N>-PLAN.md`

**Output format**:
```markdown
## Issue #<N> Execution Plan

### Phase 1: Architecture Review (10 min)
- [ ] Check DESIGN.md for patterns
- [ ] Identify affected files per layer
- [ ] List dependencies

### Phase 2: [Layer] (X min)
- [ ] Implement changes
- [ ] Run layer tests
- [ ] Check coverage

### Phase N: Integration (X min)
- [ ] Test end-to-end
- [ ] Run full test suite
- [ ] Verify no regressions
```

### @coder - Implementation
**When to invoke**:
- Orchestrator finishes execution plan
- User says: "implement this", "code the feature", "fix the feedback"
- Working on feature branch

**Responsibilities**:
1. Read plan and linked issue
2. Create feature branch: `feat/issue-#<N>-<short-desc>`
3. Implement per layer instructions (frontend.instructions.md, etc.)
4. Write tests for each layer: `pnpm test:frontend --run`, etc.
5. Run quality checks: `pnpm lint`, `pnpm type-check`
6. Push and create PR (or fix feedback on SAME branch)

**Branch workflow**:
```bash
# Create once
git checkout -b feat/issue-#318-ai-tool-config
git push -u origin feat/issue-#318-ai-tool-config

# Implement
pnpm test --run && pnpm lint && pnpm type-check
git add . && git commit -m "feat(#318): ..."
git push origin feat/issue-#318-ai-tool-config  # No -u

# Fix feedback (SAME branch)
git add . && git commit -m "fix(#318): Address review feedback"
git push origin feat/issue-#318-ai-tool-config  # Reuse branch
```

### @reviewer - Quality Gate
**When to invoke**:
- Developer pushes PR
- User says: "review this PR", "code review", "check the diff"

**Responsibilities**:
1. Read issue and full PR diff (all commits)
2. Verify quality gates pass (tests, lint, type-check)
3. Check path-scoped patterns are followed
4. Examine code for bugs, performance, N+1 queries
5. Leave detailed line-by-line feedback
6. Approve when ready OR request changes

**Review checklist**:
- ✅ Requirements met (link to issue)
- ✅ All tests pass
- ✅ No linting/TypeScript violations
- ✅ Path-scoped patterns followed
- ✅ No N+1 if backend-graphql changes
- ✅ Event emission correct if mutations added
- ✅ Docs updated (CLAUDE.md, README, etc.)
- ✅ Commit messages clear and linked to #N

### @tester - Consolidation & Validation
**When to invoke**:
- PR merged to main
- User says: "test this", "verify the feature", "integration test"
- Phase completion validation needed

**Responsibilities**:
1. Verify feature works end-to-end (all layers integrated)
2. Run full test suite: `pnpm test --run`
3. Test real-world scenarios (UI interactions, real-time events, uploads)
4. Check performance (N+1 queries, event latency, file upload speed)
5. Verify no regression (existing features still work)
6. Document results in issue or PR

**Test scenarios**:
- Frontend: Render dashboard, interact with mutations, receive events
- GraphQL: Query resolvers, mutation event emission, DataLoader batching
- Express: File upload, webhook processing, SSE broadcasting
- End-to-end: Create build → Upload report → Receive notification

### @qa / @product - Release Readiness
**When to invoke**:
- Pre-release or final validation needed
- User says: "is this production-ready", "final sign-off"
- Performance or UX concerns exist

**Responsibilities**:
1. Verify feature matches issue requirements
2. Test on different browsers/devices
3. Verify performance meets SLOs
4. Check documentation clarity
5. User acceptance testing (UAT)
6. Sign off: "Ready to ship" or "Issues blocking"

---

## PATTERNS - Domain-Specific Best Practices

### Frontend Patterns (See: `.github/instructions/frontend.instructions.md`)
- **Server/Client Components**: Use Server Components for data fetching, Client Components for interactivity
- **Apollo Mutations**: Always include cache update logic
- **Form Handling**: Controlled components, validation on submit
- **Error Boundaries**: Wrap feature sections for graceful degradation
- **Performance**: Use React.memo, useMemo for expensive computations

### GraphQL Backend Patterns (See: `.github/instructions/backend-graphql.instructions.md`)
- **Resolvers**: Keep resolvers focused, delegate to service layer
- **DataLoader**: Always use for nested relationships (prevents N+1)
- **Event Emission**: Emit events from mutations for real-time updates
- **Error Handling**: Return formatted errors with specific codes
- **Testing**: Mock Prisma, test resolver logic independently

### Express Backend Patterns (See: `.github/instructions/backend-express.instructions.md`)
- **Route Organization**: Group related routes, use router.use() for nesting
- **Middleware Chain**: Auth → Validation → Handler → Error
- **File Upload**: Use Multer, validate MIME type and size
- **Webhook Verification**: Validate signature before processing
- **SSE Broadcasting**: Use Redis or in-memory event emitter for scalability

### Architecture Patterns (See: `DESIGN.md`)
- **Dual Backend**: GraphQL for data, Express for auxiliary (files, webhooks)
- **Event Bus**: Async coordination between backends
- **Shared Database**: Single PostgreSQL instance, Prisma ORM
- **Authentication**: JWT in both backends, shared secret

---

## PROCEDURES - Step-by-Step Workflows

### Procedure 1: Start New Feature
```
1. Create GitHub issue with clear requirements
2. Link issue to this project board
3. Wait for @orchestrator to create execution plan
4. Review plan in docs/implementation-planning/
5. Ask @orchestrator for clarification if needed
6. Proceed with @coder when plan approved
```

### Procedure 2: Implement Feature (Coder Workflow)
```
1. Read execution plan and linked issue
2. Create feature branch: git checkout -b feat/issue-#<N>-<desc>
3. Implement frontend/backend-graphql/backend-express changes
4. Write tests for each layer
5. Run: pnpm test --run && pnpm lint && pnpm type-check
6. Commit with message: feat(#<N>): <description>
7. Push: git push -u origin feat/issue-#<N>-<desc>
8. Create PR on GitHub (GitHub Actions runs checks)
9. Request @reviewer approval
10. On feedback: fix code, commit, push to SAME branch (no -u)
11. Re-request review
12. Merge when approved
```

### Procedure 3: Review Code (Reviewer Workflow)
```
1. Open PR, read issue description
2. Run: pnpm test --run (locally)
3. Examine each commit in order
4. Check path-scoped .instructions.md patterns
5. Review for bugs, N+1, performance issues
6. Leave detailed line-by-line feedback (if issues found)
7. Approve when all checks pass
8. Comment "Ready to merge" or "Approve" to trigger merge
```

### Procedure 4: Validate After Merge (Tester Workflow)
```
1. Checkout main: git checkout main && git pull
2. Run full test suite: pnpm test --run
3. Start all services: pnpm dev (in separate terminal)
4. Test happy path and error cases
5. Check for performance regressions
6. Document results in issue
7. If issues found: Create hotfix issue, link to original
8. Repeat until all tests pass
```

### Procedure 5: Deploy to Production (QA Workflow)
```
1. Verify all merged features tested
2. Run full test suite on main branch
3. Build and test in staging environment
4. Run performance benchmarks
5. Test on multiple browsers/devices
6. Verify documentation is up-to-date
7. Perform user acceptance testing
8. Sign off: "Approved for production" or list blockers
9. If approved: Deploy to production with rollback plan
```

---

## Skill-Based Invocation

See **[SKILLS.md](../../SKILLS.md)** for full indexed skill catalog (74 skills across 8 categories).

### Quick Skill Lookup by Domain
- **Frontend**: 14 skills (React, Apollo, Next.js, testing)
- **GraphQL**: 12 skills (Resolvers, DataLoader, Prisma, auth)
- **Express**: 10 skills (Routes, uploads, webhooks, SSE)
- **Testing**: 11 skills (Vitest, React Testing Library, mocking)
- **Documentation**: 8 skills (API docs, guides, troubleshooting)
- **Configuration**: 9 skills (Docker, Postgres, CI/CD, security)
- **AI Tools**: 6 skills (Claude Code, Copilot, permissions)
- **Integration**: 4 skills (Multi-backend, transactions, real-time)

### Skill Invocation Examples
- "Implement server component" → React Server Components skill
- "Add DataLoader for users" → DataLoader Pattern skill
- "Setup Docker" → Docker Configuration skill
- "Create GraphQL test" → GraphQL Testing skill

---

**Last Updated**: 2026-08-17  
**Format**: WRAP (What/Rules/Actions/Patterns/Procedures)  
**Related**: DESIGN.md, AGENTS.md, SKILLS.md, .github/instructions/
