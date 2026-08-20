# Copilot Agents Guide

This directory contains seven specialized Copilot agents designed to coordinate development across the react-grapql-playground monorepo (frontend, backend-graphql, backend-express). Agents provide structured guidance for different roles in the development workflow, from strategic architecture decisions to tactical implementation and release management.

## Agent Roles & Responsibilities

### 🏛️ Architect (`architect.md`)

**Purpose**: Strategic system architecture and technology decisions  
**Focus**: Long-term design, scalability planning, technology selection  
**Key Sections**:
- Architecture Authority Matrix (decision-making power)
- Common Architecture Patterns (real-time, DataLoader, file uploads)
- Architecture Review Checklist (PR review criteria)
- Decision Trees (technology selection, database schema, cross-layer integration)
- Integration Points with other agents

**When to use**: Major features need architectural design, technology selection, database changes, or cross-layer integration patterns

---

### 🛠️ Developer (`developer.md`)

**Purpose**: Implementation guidance for coding tasks  
**Focus**: Building features across all three layers  
**Key Sections**:
- Context & Constraints (22 items specific to dual-backend)
- CLI Commands (20+ for development)
- Dual-Backend Workflows (4 implementation scenarios)
- Multi-Service Debugging (cross-layer troubleshooting)

**When to use**: You're writing code and need guidance on patterns, commands, or debugging

---

### 🎯 Orchestrator (`orchestrator.md`)

**Purpose**: Coordinate work across frontend, GraphQL, and Express layers  
**Focus**: Managing dependencies, unblocking teams, escalation  
**Key Sections**:
- Three-Layer Communication (visual coordination patterns)
- Coordination Patterns (sequential/parallel/real-time data flows)
- Escalation Criteria (when to involve Orchestrator)
- Dependency Tracking (managing blockers)

**When to use**: Work spans multiple layers, features are blocked, or coordination needed

---

### 📦 Product Manager (`product-manager.md`)

**Purpose**: Define features aligned with manufacturing domain  
**Focus**: Requirements, acceptance criteria, interview talking points  
**Key Sections**:
- Manufacturing Constraints (WiFi, device crashes, multi-day operations)
- Feature Definition Template (structured requirements)
- Acceptance Criteria Checklist (what "done" means)
- Interview Validation (talking points about architecture decisions)

**When to use**: Defining features, writing requirements, or preparing interview material

---

### 👀 Reviewer (`reviewer.md`)

**Purpose**: Thorough code review across all layers  
**Focus**: Quality gates, architectural decisions, bug prevention  
**Key Sections**:
- Layer-Specific Review Criteria (frontend/GraphQL/Express patterns)
- Cross-Layer Integration Checklist (data flow validation)
- Performance Review (N+1 detection, caching validation)
- Common Issues & Suggestions (DataLoader, optimistic updates, events)

**When to use**: Reviewing pull requests or ensuring code meets quality standards

---

### ✅ Quality Assurance (`quality-assurance.md`)

**Purpose**: Define and enforce code quality standards  
**Focus**: ESLint, Prettier, testing, security audits  
**Key Sections**:
- ESLint Configuration (static analysis across layers)
- Prettier Configuration (code formatting)
- Vitest Configuration (unit/integration testing)
- pnpm audit (security vulnerability scanning)
- Pre-Commit Checklist (4-step QA workflow)

**When to use**: Setting up QA tools, running checks, enforcing standards

---

### 🧪 Tester (`tester.md`)

**Purpose**: Test strategy and test writing  
**Focus**: Unit/integration/E2E tests, coverage, test patterns  
**Key Sections**:
- Test Organization (directory structure by layer)
- Test Types & Strategies (unit/integration/E2E examples)
- Coverage Requirements (80% minimum, 100% for critical paths)
- Test Patterns (optimistic updates, N+1 prevention, real-time)
- Debugging Strategies (fixing failing tests)

**When to use**: Writing tests, improving coverage, or debugging test failures

---

## Agent Collaboration Patterns

### Typical Development Workflow

```
Product Manager (Define Feature)
  ↓
Orchestrator (Coordinate across layers)
  ↓
Developer (Implement)
  ├─ Frontend implementation
  ├─ GraphQL implementation
  └─ Express implementation
  ↓
Tester (Write tests)
  ├─ Unit tests
  ├─ Integration tests
  └─ E2E tests
  ↓
QA (Run checks)
  ├─ pnpm lint
  ├─ pnpm format
  ├─ pnpm test
  └─ pnpm audit
  ↓
Reviewer (Code review)
  ├─ Pattern validation
  ├─ Cross-layer review
  └─ Performance check
  ↓
Orchestrator (Merge & coordinate)
```

### When Agents Communicate

1. **Developer → Orchestrator**
   - Blocked on another layer's work
   - Need to coordinate timing across layers
   - Architectural decision needed

2. **Developer → Tester**
   - Need help writing tests
   - Debugging test failures

3. **Developer → QA**
   - Running pre-commit checks
   - Fixing linting errors

4. **Tester → Reviewer**
   - Questions about test coverage requirements
   - Test patterns review

5. **Reviewer → Orchestrator**
   - Found architectural issue affecting multiple layers
   - Performance concern requiring trade-off discussion

### Cross-Layer Scenarios

#### Scenario: Real-Time Update Feature

```
Product Manager
→ "Update should show in real-time for connected users"

Orchestrator
→ "Requires coordination:
  1. GraphQL mutation emits event
  2. Express broadcasts via SSE
  3. Frontend listens and updates cache"

Developer
→ Implements resolvers, events, listeners

Tester
→ Tests DataLoader batching, SSE event flow, cache updates

QA
→ Runs linting & security checks

Reviewer
→ Validates event coordination, N+1 prevention, cache patterns

Orchestrator
→ Merges when all layers aligned
```

#### Scenario: File Upload Feature

```
Product Manager
→ "Users upload sensor data files, must validate before processing"

Orchestrator
→ "Coordination:
  1. Frontend accepts file upload
  2. Express validates & stores
  3. GraphQL query fetches stored files
  4. SSE notifies when processing complete"

Developer
→ Implements upload endpoint, GraphQL query, file handler

Tester
→ Tests file validation, storage, GraphQL resolution, E2E upload flow

QA
→ Runs security audit (file handling) & linting

Reviewer
→ Checks for vulnerabilities, proper error handling, event emission

Orchestrator
→ Merges when all layers ready
```

## Using Agents with GitHub Copilot CLI

### Activate an Agent

```bash
# Mention agent in conversation
@developer How do I implement DataLoader?

@tester What's the coverage requirement for resolvers?

@reviewer Should this use optimistic updates?

@orchestrator How do I coordinate this across frontend and backend?

@product-manager What are the acceptance criteria for this feature?

@quality-assurance How do I run the full QA check?
```

### Get Context from Multiple Agents

```bash
# Get different perspectives on a task
@product-manager Define the feature requirements
@orchestrator How should this be coordinated?
@developer What patterns should I follow?
@tester How do I test this?
@reviewer What should I watch for?
```

### Escalate Issues

```bash
# When blocked
@developer I need help debugging this N+1 query
@reviewer How should I structure this test?

# When architecture is unclear
@orchestrator This spans multiple layers, help coordinate

# When building interview prep material
@product-manager Help me prepare talking points about this architecture
```

## Model Configuration

All agents use **Claude Haiku 4.5** by default (fast, cost-effective).

To use a premium model for complex analysis:

```bash
/model gpt-5.4
@developer Help design this complex data flow

# Or in Copilot CLI
@developer /model claude-sonnet-4.6 Explain the DataLoader architecture
```

**Why Haiku by default?**
- Sufficient for most development tasks
- Cost-efficient for long conversations
- Faster response times
- Prevents model creep (encourages focused prompts)

**Premium models justified for:**
- Complex architectural redesigns
- Performance optimization deep-dives
- Multi-layer coordination challenges
- Interview preparation synthesis

## Agent Enhancements (April 2026)

### Developer Agent (`developer.md`)
**Enhancements**: +414 lines (756 → 1,170 lines, +55%)

New sections:
- ✅ **Fresh Per-Request Pattern** — Server-side Apollo cache isolation to prevent cross-request data leaks
- ✅ **Event Bus Configuration** — 3-layer coordination (GraphQL → Express → Frontend SSE)
- ✅ **Database Migrations Workflow** — Migration decision tree and Prisma integration
- ✅ **pnpm generate** — When/how to run GraphQL code generation
- ✅ **DataLoader Best Practices** — Batch loading for N+1 prevention
- ✅ **Error Handling Patterns** — Comprehensive error handling across all layers
- ✅ **Model Override Guidance** — Clear criteria for Haiku vs premium models

**Impact**: Production-ready guidance for authentication, real-time features, and complex multi-layer patterns.

### Tester Agent (`tester.md`)
**Enhancements**: +855 lines (731 → 1,586 lines, +117%)

New sections:
- ✅ **Fresh Per-Request Apollo in Tests** — Server Component testing with cache isolation
- ✅ **Resolver Error Testing** — 5-step error testing pattern for all error types
- ✅ **Complete Event Bus Testing** — Full 3-layer real-time cycle testing (GraphQL → Express → Frontend)
- ✅ **DataLoader Anti-Patterns** — 4 dangerous patterns with corrections
- ✅ **Test Isolation & Cleanup** — beforeEach/afterEach setup with common leak scenarios
- ✅ **Async Testing Pitfalls** — 6 async bugs and how to prevent them
- ✅ **Model Lock Policy** — Clear guidance for Haiku vs premium models

**Impact**: Comprehensive testing guidance preventing flaky tests, data leaks, and production bugs. 35+ code examples provided.

### Configuration Status
All agents configured with:
- ✅ Proper `@agent-name` triggers (`.copilot/rules.json`)
- ✅ Agent-exclusive enforcement (`config.json`)
- ✅ Usage documentation (`ENFORCEMENT.md`)
- ✅ Detailed agent guide (this file)

## Related Documentation

- **`.github/copilot-instructions.md`** — Global development commands and conventions
- **`.github/mcp-config.json`** — MCP servers for Playwright, PostgreSQL, Git, API testing
- **`DESIGN.md`** — Architecture patterns and design decisions
- **`CLAUDE.md`** — Tech stack details and integration points

## File Sizes

| Agent | Lines | Size | Focus | Parallel Ready |
|-------|-------|------|-------|--------|
| architect.md | 1,250+ | 45K | Strategic Design | ✅ Yes (decision docs) |
| developer.md | 1,255 | 43K | Implementation | ✅ Yes (worktree mode) |
| orchestrator.md | 655+ | 23K | Coordination | ✅ Yes (all agents) |
| product-manager.md | 314 | 16K | Requirements | — |
| reviewer.md (Code Reviewer) | 377 | 12K | Code Quality | ✅ Yes |
| quality-assurance.md | 531 | 12K | Standards | — |
| tester.md | 1,780 | 62K | Testing | ✅ Yes (worktree mode) |

**Total**: ~6,160+ lines of specialized guidance across 213K+

**Parallel Execution Status**:
- ✅ **Developers**: Git worktree support documented (Phase 2 proven: 3 agents, 61% efficiency)
- ✅ **Testers**: Git worktree support documented (3 layers: frontend + graphql + express)
- ✅ **Orchestrator**: Coordination patterns for both developer and tester parallelization
- 📄 **Guide**: `.copilot/PARALLEL-EXECUTION-GUIDE.md` (862 lines, comprehensive)

**Enhancement Note**: 
- Developer and Tester agents expanded (Feb-April 2026) with comprehensive guidance for authentication, real-time features, error handling, async testing, and production-ready patterns
- Parallel execution patterns added (April 22, 2026) enabling 2-3 concurrent agents per task (60%+ efficiency gain)

## Key Architectural Concepts Referenced by All Agents

✅ **Dual-Backend Architecture**: Frontend (Next.js) ↔ GraphQL (Apollo Server) ↔ Express  
✅ **DataLoader Pattern**: Batch loading to prevent N+1 queries  
✅ **Optimistic Updates**: Show changes immediately, confirm from server  
✅ **Real-Time SSE**: Express broadcasts events → Frontend listens and updates Apollo cache  
✅ **Event Bus**: Coordinates between GraphQL mutations and Express event handlers  
✅ **File Uploads**: Validate, store in Express, query via GraphQL  
✅ **Server Components**: Next.js Server Components for data fetching  
✅ **Manufacturing Domain**: Build, Part, TestRun domain model with WiFi/crash resilience

---

**Last Updated**: August 19, 2026  
**Status**: Complete with all 7 agents (Added Architect for strategic design, enhanced with decision authority matrix)
