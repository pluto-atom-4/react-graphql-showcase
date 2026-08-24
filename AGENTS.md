# AGENTS.md

Agent orchestration and multi-agent handoff strategy for Stoke Full Stack React/GraphQL Showcase.

---

## Agent Roles & Responsibilities

| Agent Type           | Role | Responsibilities | When to Use |
|----------------------|------|------------------|------------|
| **Architect**        | Strategic Design | Design system architecture, select technologies, set scalability patterns, review architecture decisions | Major features; technology choices; system redesign |
| **Orchestrator**     | Plan & Coordinate | Analyze issue requirements, create execution plan, delegate work, track progress | Issue intake; new feature planning; cross-layer coordination |
| **Developer**        | Implementation | Code features on feature branches, fix feedback, write tests, update docs | Feature implementation; bug fixes; refactoring |
| **Code Reviewer**    | Quality Gate | Examine PR diffs, provide detailed feedback, approve when ready, catch regressions | Before merge; code quality validation; architecture review |
| **Tester**          | Validation Strategy | Plan test approach, write integration tests, verify end-to-end flows, validate coverage | Feature testing; test planning; regression validation |
| **Quality Assurance** | Standards & Tooling | Enforce ESLint, Prettier, test frameworks, security audits | Code quality; tooling; security |
| **Product Manager**  | Requirements & Release | Define features, set acceptance criteria, verify requirements, sign off on release | Feature definition; acceptance criteria; release readiness |

---

## Agent Invocation Guide

### Architect (`@architect`)
**Triggers**:
- New feature requires architectural decisions
- Technology stack change needed
- Database schema redesign required
- Cross-layer integration pattern needed
- PR has architectural concerns

**Responsibilities**:
- Design system architecture and integration patterns
- Select and evaluate technologies
- Design database schemas and migrations
- Set performance targets and scalability requirements
- Review major PRs for architectural alignment
- Resolve architectural conflicts between layers
- Document architecture decisions (ADR format)

**Output Format**:
```markdown
## Architecture Decision Record: [Title]

### Context
Why this architectural decision is needed

### Options Considered
- Option A: (pros/cons)
- Option B: (pros/cons)
- Option C: (pros/cons)

### Decision
Chosen: [Option] because [key reason]

### Implementation
- Phase 1: [what to build]
- Phase 2: [what to build]

### Trade-offs
- Benefit: [what we gain]
- Cost: [what we sacrifice]
- Risk: [what could go wrong]
```

**Decision Authority**:
- ✅ Approves/rejects technology selections
- ✅ Designs database schemas and migrations
- ✅ Sets performance targets and scalability requirements
- ✅ Reviews and approves major architectural changes
- ✅ Can veto PRs that violate architectural patterns

---

### Orchestrator (`@orchestrator`)
**Triggers**:
- New GitHub issue created (auto-analyze)
- User says: "plan this feature", "create an execution plan", "analyze requirements"
- Cross-layer coordination needed

**Responsibilities**:
- Read issue description and linked docs
- Identify affected files and layers (frontend, backend-graphql, backend-express)
- Create step-by-step execution plan with time estimates
- Reference path-scoped `.instructions.md` files (frontend, backend-graphql, backend-express)
- Output: Implementation plan saved to `docs/implementation-planning/`

**Output Format**:
```
## Issue #[N] Execution Plan

### Phase 1: Architecture Review (10 min)
- [ ] Check DESIGN.md for patterns
- [ ] Review schema.graphql for domain entities
- [ ] List affected files per layer

### Phase 2: Frontend (30 min)
- [ ] Update components in frontend/**
- [ ] Add tests per frontend.instructions.md
- [ ] Run pnpm test:frontend

### Phase 3: GraphQL Backend (20 min)
- [ ] Update resolvers in backend-graphql/src/
- [ ] Add DataLoaders if needed
- [ ] Run pnpm test:graphql

### Phase 4: Express Backend (15 min)
- [ ] Add routes in backend-express/src/
- [ ] Emit events for real-time updates
- [ ] Run pnpm test:express

### Phase 5: Integration (10 min)
- [ ] Test end-to-end flow locally
- [ ] Verify event bus connection
- [ ] All quality checks pass
```

---

### Developer (`@developer`)
**Triggers**:
- Orchestrator hands off implementation
- User says: "implement this feature", "fix the feedback", "add this component"
- Working on feature branch (not main)

**Responsibilities**:
- Read orchestrator plan and linked issue
- Create feature branch: `feat/issue-#<N>-<description>`
- Implement per path-scoped `.instructions.md` files
- Write tests for each layer (frontend, backend-graphql, backend-express)
- Run quality checks: `pnpm test`, `pnpm lint`, `pnpm type-check`
- Push to remote and create PR (or hand off to Code Reviewer)
- Fix feedback on EXISTING branch (no new branches)

**Branch Workflow**:
```bash
# Create feature branch (once per issue)
git checkout -b feat/issue-#318-ai-tool-config

# Implement, test, commit
pnpm test:frontend --run
pnpm test:graphql --run
pnpm test:express --run
pnpm lint:fix
git add .
git commit -m "feat(#318): ..."

# Push once, then keep using for feedback fixes
git push -u origin feat/issue-#318-ai-tool-config

# On feedback: fix code, test, commit to SAME branch
git add .
git commit -m "fix(#318): Address review feedback"
git push origin feat/issue-#318-ai-tool-config  # No -u
```

**Output**: Feature branch with tests, docs, clean commit history.

---

### Code Reviewer (`@reviewer`)
**Triggers**:
- Developer pushes PR
- User says: "review this PR", "check the code"
- PR opened on GitHub

**Responsibilities**:
- Read issue and full PR diff (all commits)
- Check path-scoped `.instructions.md` for architectural requirements
- Verify quality gates pass (tests, lint, type-check)
- Examine code for bugs, patterns, performance issues
- Leave detailed feedback on specific lines (not just general comments)
- Approve when ready OR request changes
- Consolidate feedback: "Ready to merge" or "Address feedback then re-request review"
- Escalate architectural concerns to Architect if needed

**Review Checklist**:
```
- [ ] Issue requirements met (link to issue)
- [ ] All tests pass (pnpm test --run)
- [ ] No linting violations (pnpm lint)
- [ ] TypeScript strict mode OK (pnpm type-check)
- [ ] Path-scoped patterns followed (frontend.instructions.md, etc.)
- [ ] No N+1 queries if backend-graphql changes
- [ ] Event emission correct if mutations added
- [ ] Docs updated (CLAUDE.md, README, etc.)
- [ ] Commit messages clear and follow convention
```

**Output**: PR approved or detailed feedback for coder to fix.

---

### Tester (`@tester`)
**Triggers**:
- Feature implementation needs test strategy
- PR merged to main
- User says: "test this", "verify the feature", "what's the test plan?"
- Integration validation needed

**Responsibilities**:
- Design test strategy for features
- Verify feature works end-to-end: all layers integrated
- Run full test suite: `pnpm test:frontend --run && pnpm test:graphql --run && pnpm test:express --run`
- Test real-world scenarios (UI interactions, real-time events, file uploads)
- Check performance: N+1 query logs, event latency, file upload speed
- Verify no regression: existing features still work
- Validate test coverage meets 80% minimum requirement
- Document results in issue or PR

**Test Scenarios**:
- Frontend: Render dashboard, interact with mutations, receive real-time events
- GraphQL: Query resolvers, mutation event emission, DataLoader batching
- Express: File upload, webhook processing, SSE broadcasting
- End-to-End: Create build → Upload test report → Receive real-time notification

**Output**: Consolidation test report with pass/fail status.

---

### Quality Assurance (`@qa`)
**Triggers**:
- Setting up quality tools
- Security vulnerabilities detected
- Code quality standards need enforcement
- Pre-commit checks need configuration

**Responsibilities**:
- Configure and enforce ESLint, Prettier, TypeScript
- Set up Vitest test framework across layers
- Run security audits (pnpm audit)
- Monitor dependency vulnerabilities
- Enforce pre-commit quality gates
- Maintain CI/CD quality standards
- Document quality procedures

**Output**: Quality standards enforced; all checks passing.

---

### Product Manager (`@product-manager`)
**Triggers**:
- New feature needs requirements definition
- Acceptance criteria needs clarification
- Release readiness check
- Business priorities need setting
- Interview prep material needed

**Responsibilities**:
- Define feature requirements and scope
- Write clear acceptance criteria
- Verify features meet business goals
- Test features for user-facing quality
- Conduct user acceptance testing (UAT)
- Manage scope and prevent creep
- Sign off on release readiness
- Prepare business talking points for features

**Output**: Feature requirements, acceptance criteria, release approval.

---

## Multi-Agent Handoff Flow

```
Issue Created
    ↓
Architectural decision needed?
├─ YES: @architect → Design system approach (15-30 min)
│        ↓
│        → Return to Orchestrator with design
└─ NO → Continue
    ↓
@orchestrator → Create execution plan (10-30 min)
    ├─ Identify dependencies
    ├─ Sequence layers
    └─ Estimate time per phase
    ↓
Plan saved to docs/implementation-planning/
    ↓
@developer → Implement on feature branch (1-3 hours)
    ├─ Frontend layer
    ├─ GraphQL backend
    ├─ Express backend
    └─ Write tests
    ↓
Push PR to GitHub
    ↓
@code-reviewer → Examine diff (30-60 min)
    ├─ Check patterns
    ├─ Catch regressions
    ├─ Validate architecture
    └─ Approve or request changes
    ↓
Feedback? → YES → @developer → Fix on EXISTING branch → Loop back to @code-reviewer
    ↓ NO
Approved! → Merge to main
    ↓
@tester → Run consolidation tests (20-30 min)
    ├─ Integration tests
    ├─ End-to-end flows
    └─ Validate coverage ≥80%
    ↓
All pass? → YES → Feature complete
        ↓ NO
        Issue → @developer → Hotfix → Loop back to @tester
    ↓
@quality-assurance → Verify quality gates
    ├─ Linting clean
    ├─ Tests passing
    ├─ Security audit
    └─ Type-check OK
    ↓
Release candidate?
    ↓
@product-manager → Final acceptance & sign-off
    ├─ Feature meets requirements
    ├─ Acceptance criteria met
    ├─ UAT approved
    └─ Go/no-go decision
    ↓
Ship!
```

---

## Claude Code Best Practices for Agent Workflows

### Context Management for Large Decisions

**When Architect designs new feature**:
```
Load in parallel:
1. DESIGN.md (existing patterns)
2. AGENTS.md (role responsibilities)
3. 2-3 recent architecture PRs (current direction)
4. Layer-specific instructions (constraints)

Result: 15K context for complete picture
Timeline: 5 min to load context + 10-15 min to design
Outcome: High-quality design without rework
```

**Why**: Large-scale changes affect many files. Pre-reading prevents design rework.

### Parallel Agent Execution Strategy

**When Orchestrator coordinates developers**:
```
Setup parallel worktrees for independent tasks:
  Task 1: Frontend feature (worktree 1)
  Task 2: GraphQL backend (worktree 2)
  Task 3: Express backend (worktree 3)

Dispatch agents simultaneously (zero dependencies)
Monitor progress in parallel
Merge PRs in any order (independent changes)

Result: 60% efficiency gain vs sequential
Time: 3 hours parallel vs 5 hours sequential
```

**Key**: Verify dependencies FIRST before parallel dispatch

### Model Override Guidance

**Default**: Claude Haiku 4.5 (fast, cost-effective)

**Promote to Sonnet/Opus for**:
- ✅ Complex architectural redesigns
- ✅ Technology trade-off analysis requiring research
- ✅ Performance optimization from first principles
- ✅ Conflicting requirements resolution

**Stay with Haiku for**:
- Design decisions within established patterns
- Routine implementation guidance
- Code review feedback
- Documentation updates

### Decision Documentation Pattern

**Every architectural decision should document**:

```markdown
## ADR: [Decision Title]

### Context
Why needed (business/technical drivers)

### Options Considered
- Option A (pros/cons)
- Option B (pros/cons)

### Decision
Chosen: [Option X] because [key reason]

### Implementation
- Phase 1: [what to build]
- Phase 2: [what to build]

### Trade-offs
- Benefit: [what we gain]
- Cost: [what we sacrifice]
- Risk: [what could go wrong]
```

**Storage**: `docs/decisions/ADR-[number]-[title].md`

---

## Copilot Agent Mode vs Claude Code CLI

### Use Copilot Agent Mode When:
- **Issue intake & planning**: Orchestrator analyzing requirements
- **Cross-layer coordination**: Multiple layers need synchronized changes
- **Multi-person workflow**: Handing off between orchestrator → coder → reviewer → tester
- **Automated orchestration**: GitHub Actions triggering agent workflows

### Use Claude Code CLI When:
- **Quick fixes**: Single-file changes (typo, lint issue)
- **Local development**: Testing features locally before pushing
- **File exploration**: Reading code, understanding structure
- **Interactive debugging**: Step through errors, inspect state

### When to Escalate
If Developer encounters:
- **Architecture question**: Escalate to Orchestrator for re-planning
- **Cross-layer blocker**: Need Orchestrator to coordinate
- **Merge conflict**: Ask Reviewer for merge strategy

If Reviewer finds major issues:
- **Design flaw**: Return to Orchestrator for re-planning
- **Regression risk**: Escalate to QA for extended testing

---

## Escalation Rules

| Situation | Escalate To | Action |
|-----------|-------------|--------|
| Issue unclear / ambiguous | Orchestrator | Re-plan with stakeholder input |
| Code pattern violation | Reviewer | Check `.instructions.md`, reference DESIGN.md |
| N+1 query detected | Developer → Orchestrator | Redesign DataLoader strategy |
| Test failure post-merge | Tester → Developer | Hotfix on same branch |
| Performance regression | QA → Developer | Profile and optimize |
| Merge conflict on main | Reviewer | Coordinate rebase strategy |

---

## Agent Best Practices

### For All Agents:
- **Reference path-scoped instructions**: Always check `.github/instructions/frontend.instructions.md`, `backend-graphql.instructions.md`, `backend-express.instructions.md`
- **Link to issue**: Every action should reference the GitHub issue #N
- **No long-running tasks**: Break work into phases, each < 60 min
- **Document decisions**: Explain reasoning in commit messages and PR descriptions
- **Verify quality gates**: `pnpm test`, `pnpm lint`, `pnpm type-check` must pass

### For Orchestrator:
- Always reference DESIGN.md for architecture patterns
- Estimate time per phase realistically
- Identify dependencies between layers upfront

### For Coder:
- One feature branch per issue (reuse for feedback fixes)
- Commit frequently (one commit per logical change)
- Run tests after every commit

### For Reviewer:
- Provide actionable feedback (not "this looks wrong", but "this can cause N+1 because...")
- Reference path-scoped `.instructions.md` when providing guidance
- Approve only when all checks pass and no outstanding issues

### For Tester:
- Test both happy path and error cases
- Document steps to reproduce any issues found
- Run full suite, not just changed areas (regression testing)

---

## Skill Catalog Integration

See **[SKILLS.md](./SKILLS.md)** for 74 indexed skills across 8 domains.

### Skill-Based Task Routing

**Orchestrator** uses skills to break down feature complexity:
- **Frontend Skills**: React Server Components, Apollo Mutations, Form Handling (14 skills)
- **GraphQL Skills**: Schema Design, Resolvers, DataLoader Pattern (12 skills)
- **Express Skills**: File Uploads, Webhook Ingestion, SSE Streaming (10 skills)
- **Testing Skills**: Vitest, React Testing Library, Integration Testing (11 skills)
- **DevOps Skills**: Docker, Postgres, CI/CD Pipelines (9 skills)

**Coder** selects skills matching current phase:
- "Implement GraphQL Schema Design skill" → Update `backend-graphql/src/schema.graphql`
- "Add DataLoader Pattern skill" → Implement batch loading for nested queries
- "Build React Server Component skill" → Create Server/Client component split

**Reviewer** cross-references skills when providing feedback:
- "This N+1 pattern violates DataLoader Pattern skill (see SKILLS.md)"
- "Use React Server Components skill for server-side data fetching (see SKILLS.md)"

### Skill-to-Path Mapping

| Skill | Recommended Path | Tools | Time Est |
|-------|------------------|-------|----------|
| React Server Components | frontend/app/** | Claude Code | 30-45 min |
| Apollo Mutations | frontend/components/** | Claude Code | 20-30 min |
| GraphQL Schema Design | backend-graphql/src/schema.graphql | Claude Code | 15-20 min |
| DataLoader Pattern | backend-graphql/src/dataloaders/** | Claude Code | 25-35 min |
| File Upload Routes | backend-express/src/routes/upload.ts | Claude Code | 20-25 min |
| Vitest Framework | **/__tests__/** | Claude Code | 15-20 min |

---

## Decision Trees

### Orchestrator Decision Tree: Issue Type Analysis

```
Issue Received
├─ Is it a bug fix?
│  ├─ YES → Single-layer fix (localize to affected layer)
│  │  ├─ Frontend? → Phase 1: Identify component, Phase 2: Fix bug, Phase 3: Test
│  │  ├─ GraphQL? → Phase 1: Identify resolver, Phase 2: Fix logic, Phase 3: Test
│  │  └─ Express? → Phase 1: Identify route, Phase 2: Fix handler, Phase 3: Test
│  └─ NO → Continue
│
├─ Is it a new feature?
│  ├─ YES → Multi-phase feature implementation
│  │  ├─ Frontend-only? → Phase 1: Design, Phase 2: Implement, Phase 3: Test
│  │  ├─ Backend-only? → Phase 1: Design, Phase 2: Implement, Phase 3: Test
│  │  └─ Multi-layer? → Phase 1: Design all layers, Phase 2-4: Implement per layer, Phase 5: Integration test
│  └─ NO → Continue
│
├─ Is it documentation?
│  ├─ YES → Simple documentation task
│  │  ├─ Update CLAUDE.md? → Single commit, no code changes
│  │  ├─ Update DESIGN.md? → Reference patterns, single commit
│  │  └─ Create pattern guide? → Deep analysis, 1-2 hour task
│  └─ NO → Continue
│
└─ Is it refactoring?
   ├─ YES → Code cleanup with no behavior change
   │  ├─ Single file? → Phase 1: Analyze, Phase 2: Refactor, Phase 3: Test
   │  ├─ Multiple files? → Phase 1: Design refactoring strategy, Phase 2-N: Refactor per file, Phase N+1: Full regression test
   │  └─ Cross-layer? → Phase 1: Design new architecture, Phase 2-4: Refactor per layer, Phase 5: Integration test
   └─ Unknown → Escalate to @orchestrator with clarification request
```

### Coder Decision Tree: Implementation Approach

```
Feature Assigned
├─ Is it frontend-related?
│  ├─ YES → Use frontend skills
│  │  ├─ Need server-side data? → React Server Components skill
│  │  ├─ Need mutations? → Apollo Mutations skill
│  │  ├─ Building form? → Form Handling skill
│  │  └─ Building component? → Component Testing skill
│  └─ NO → Continue
│
├─ Is it GraphQL-related?
│  ├─ YES → Use GraphQL skills
│  │  ├─ Schema change? → GraphQL Schema Design skill
│  │  ├─ New resolver? → Apollo Resolvers skill
│  │  ├─ Nested queries? → DataLoader Pattern skill
│  │  └─ New mutation? → Event Emission skill
│  └─ NO → Continue
│
├─ Is it Express-related?
│  ├─ YES → Use Express skills
│  │  ├─ File handling? → File Upload Routes skill
│  │  ├─ Webhooks? → Webhook Ingestion skill
│  │  ├─ Real-time events? → SSE Streaming skill
│  │  └─ New route? → Route Organization skill
│  └─ NO → Continue
│
└─ Cross-cutting concern?
   ├─ Testing? → Vitest Framework skill
   ├─ Type safety? → TypeScript Checking skill
   ├─ Documentation? → Pattern Library skill
   └─ DevOps? → Docker Configuration skill
```

### Reviewer Decision Tree: Feedback Priority

```
PR Reviewed
├─ Functionality broken?
│  ├─ YES → BLOCK: Request changes
│  │  └─ Provide specific example and fix suggestion
│  └─ NO → Continue
│
├─ Tests missing/failing?
│  ├─ YES → BLOCK: Request changes
│  │  └─ Coverage target not met or tests fail
│  └─ NO → Continue
│
├─ Quality gate failed?
│  ├─ Lint violations? → Request changes (auto-fixable)
│  ├─ Type errors? → Request changes (must resolve)
│  └─ NO → Continue
│
├─ Pattern violation detected?
│  ├─ YES → SUGGEST: Reference pattern and provide fix
│  │  ├─ N+1 query? → Reference DataLoader Pattern, frontend.rules.md
│  │  ├─ Wrong component type? → Reference React Server Components, frontend.rules.md
│  │  ├─ Missing cache update? → Reference Apollo Mutations, frontend.rules.md
│  │  └─ Event not emitted? → Reference Event Emission, backend-graphql.rules.md
│  └─ NO → Continue
│
├─ Performance issue?
│  ├─ YES → SUGGEST or BLOCK depending on severity
│  │  ├─ Critical regression? → BLOCK
│  │  └─ Minor optimization? → COMMENT (can merge, suggest improvement)
│  └─ NO → Continue
│
└─ Documentation needs update?
   ├─ YES → SUGGEST (can merge if minor)
   │  └─ Reference CLAUDE.md, DESIGN.md, or layer instructions
   └─ NO → APPROVE
```

### Tester Decision Tree: Issue Classification

```
Test Failure Found
├─ Does it break existing functionality?
│  ├─ YES → REGRESSION: Create hotfix issue, high priority
│  │  └─ Link to original feature issue
│  └─ NO → Continue
│
├─ Is it a new bug in current feature?
│  ├─ YES → BUG IN FEATURE: Create issue, reference phase/layer
│  │  └─ "Hotfix: #<original>-<number> - <description>"
│  └─ NO → Continue
│
├─ Is it a performance issue?
│  ├─ YES → PERFORMANCE: Create optimization issue
│  │  ├─ Critical (> 50% slower)? → High priority
│  │  └─ Minor (< 20% slower)? → Low priority, can defer
│  └─ NO → Continue
│
└─ Documentation/test gap?
   ├─ YES → IMPROVEMENT: Create enhancement issue
   │  └─ Low priority (doesn't block release)
   └─ NO → Test passes, document result
```

---

## Domain Rule Cross-References

See `.github/copilot/rules/` for detailed domain-specific guidance:

- **[agent-authority.md](./.github/copilot/rules/agent-authority.md)** — Decision authority matrix, escalation paths, conflict resolution
- **[frontend.rules.md](./.github/copilot/rules/frontend.rules.md)** — Server/Client components, Apollo, performance, accessibility
- **[backend-graphql.rules.md](./.github/copilot/rules/backend-graphql.rules.md)** — Resolvers, DataLoader, Prisma, auth, events
- **[backend-express.rules.md](./.github/copilot/rules/backend-express.rules.md)** — Routes, uploads, webhooks, SSE
- **[permissions.rules.md](./.github/copilot/rules/permissions.rules.md)** — Permission layers, access control
- **[workflow.rules.md](./.github/copilot/rules/workflow.rules.md)** — Feature branching, PR workflow, testing

> **Note (Issue #336)**: Agent roles previously duplicated in `agents.rules.md` have been consolidated into this file (AGENTS.md). AGENTS.md is now the single source of truth for agent orchestration.

---

## Copilot Integration

See **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** (WRAP format) for:
- **What**: Project overview, key resources
- **Rules**: Workflow, quality gates, escalation
- **Actions**: Agent invocation, step-by-step procedures
- **Patterns**: Domain-specific best practices
- **Procedures**: Multi-agent handoff workflows

---

## Enhanced Agent Documentation

See `.github/copilot/agents/` for complete agent guides:

- **[architect.md](./.github/copilot/agents/architect.md)** — Strategic design authority with architecture review checklist (NEW, 1,200+ lines)
- **[orchestrator.md](./.github/copilot/agents/orchestrator.md)** — Tactical planning and cross-layer coordination
- **[developer.md](./.github/copilot/agents/developer.md)** — Implementation guidance for coding tasks
- **[reviewer.md](./.github/copilot/agents/reviewer.md)** — Code Reviewer guide (Reviewer renamed to Code Reviewer)
- **[tester.md](./.github/copilot/agents/tester.md)** — Test strategy and validation guidance
- **[quality-assurance.md](./.github/copilot/agents/quality-assurance.md)** — Code quality standards and tooling
- **[product-manager.md](./.github/copilot/agents/product-manager.md)** — Feature definition and requirements

See `.github/instructions/agent-roles.md` for quick reference table and agent collaboration patterns.

---

## Verify First: Verification Checklist by Agent Role

### Architect Verification
- [ ] Architecture decision documented in ADR format
- [ ] Schema design reviewed for scalability
- [ ] Performance targets set and quantified
- [ ] Technology choices validated with rationale
- [ ] Major PRs reviewed for architectural alignment
- [ ] No pattern violations identified

**Check**: `DESIGN.md` reflects latest architecture decisions

### Orchestrator Verification
- [ ] Issue requirements fully analyzed
- [ ] Execution plan created and saved to `docs/implementation-planning/`
- [ ] Affected layers identified (frontend, backend-graphql, backend-express)
- [ ] Phase estimates provided and realistic
- [ ] Dependencies documented
- [ ] Escalation criteria evaluated

**Check**: `docs/implementation-planning/ISSUE-#<N>-PLAN.md` exists and complete

### Developer Verification
- [ ] Code follows layer-specific patterns (.github/instructions/)
- [ ] Tests written and passing (`pnpm test --run`)
- [ ] Linting passes (`pnpm lint --max-warnings=0`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Documentation updated (CLAUDE.md, README)
- [ ] No N+1 queries in GraphQL resolvers
- [ ] Pre-commit hook ran successfully (`.claude/hooks/pre-commit.sh`)

**Check**: `git status` shows clean working tree before push

### Code Reviewer Verification
- [ ] Code quality gates pass (lint, type, tests)
- [ ] Pattern violations flagged with references (.github/copilot/rules/)
- [ ] Performance regression detected? → Block or comment based on severity
- [ ] Documentation updated? → Suggest if needed
- [ ] Commit message follows format: `feat(#N): description`
- [ ] Branch name follows pattern: `feat/issue-#N-kebab-case`

**Check**: PR checklist in `PR_FEEDBACK_QUICK_REFERENCE.md` complete

### Tester Verification
- [ ] Test coverage measured and within targets
- [ ] End-to-end flows tested manually
- [ ] Regressions detected? → Link to original feature issue
- [ ] Performance regression? → Create optimization issue
- [ ] All layers tested (frontend, backend-graphql, backend-express)
- [ ] Integration tests passing (`pnpm test --run`)

**Check**: `pnpm test --run` shows all passing

### Quality Assurance Verification
- [ ] ESLint rules enforced (v9 flat config)
- [ ] Prettier formatting applied
- [ ] TypeScript strict mode enabled
- [ ] No security vulnerabilities in dependencies
- [ ] Code coverage maintained/improved
- [ ] Vitest framework used consistently

**Check**: `pnpm lint && pnpm type-check` passes with 0 warnings

### Product Manager Verification
- [ ] Acceptance criteria met and tested
- [ ] Requirements aligned with business goals
- [ ] Release readiness confirmed
- [ ] Stakeholder sign-off obtained
- [ ] Feature documentation complete
- [ ] No blocking issues remain

**Check**: Feature branch ready for merge (all other agents' checks passed)

---

**Last Updated**: 2026-08-23  
**Pattern**: 7-agent orchestration with clear role separation and decision boundaries  
**Integration**: Linked to SKILLS.md, domain rules, agent guides, and copilot instructions
**Notable Changes**: 
- Added Architect role (strategic design authority)
- Renamed Reviewer → Code Reviewer (clearer naming)
- Renamed Coder → Developer (industry standard)
- Split QA/Product into separate roles
- Added decision authority matrix
- Added Claude Code best practices section
