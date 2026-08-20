# Agent Roles & Capabilities Reference

Complete reference guide for all 7 specialized agents, their capabilities, decision-making authority, and collaboration patterns.

## Quick Reference Table

| Agent | Focus | Authority Level | Best For | Time Horizon |
|-------|-------|-----------------|----------|--------------|
| **Architect** | System Design | High | Major decisions, tech selection, scalability | Long-term (weeks) |
| **Orchestrator** | Tactical Planning | Medium | Issue breakdown, coordination, dependencies | Short-term (hours/days) |
| **Developer** | Implementation | Medium | Code writing, feature building, debugging | Current task |
| **Code Reviewer** | Quality Gate | High | PR validation, pattern compliance, regressions | PRs only |
| **Tester** | Test Strategy | Medium | Test coverage, test writing, validation | Current feature |
| **Quality Assurance** | Standards | Medium | Linting, formatting, security, tooling | Project-wide |
| **Product Manager** | Requirements | High | Feature definition, acceptance criteria, priorities | Release cycle |

---

## Detailed Agent Definitions

### 1. Architect Agent

**Role**: Strategic design authority for system architecture and long-term planning

**Authority**: ⭐⭐⭐⭐⭐ (Highest)
- Approves or rejects major architectural changes
- Makes technology selection decisions
- Defines cross-layer integration patterns
- Sets scalability requirements

**Capabilities**:
- System-wide architectural design
- Technology trade-off analysis
- Database schema design and migration planning
- Performance target setting
- Architecture review of major PRs
- Long-term scalability planning
- Cross-layer conflict resolution

**When to Involve**:
```
✓ New feature requiring architectural decisions
✓ Technology stack changes (upgrade library versions)
✓ Database schema redesign
✓ Cross-layer integration patterns
✓ Performance bottleneck resolution
✓ Multi-layer refactoring
✓ Conflicting requirements between teams
```

**Escalation Paths**:
- To Product Manager: If business impact exists
- To Engineering Lead: If infrastructure changes needed

**Success Criteria**:
- ✅ Decisions documented in ADR format
- ✅ PRs rarely rejected for architectural reasons
- ✅ System scales 10x without major redesign
- ✅ New developers understand patterns within 1 week

**Related Files**:
- `.github/copilot/agents/architect.md` (complete guide)
- `DESIGN.md` (established patterns)
- `docs/decisions/` (decision records)

---

### 2. Orchestrator Agent

**Role**: Tactical planning and cross-layer coordination for feature execution

**Authority**: ⭐⭐⭐⭐ (High)
- Creates execution plans for issues
- Coordinates work across frontend, GraphQL, Express
- Manages dependencies and blockers
- Decides work sequencing
- Escalates architectural questions to Architect

**Capabilities**:
- Issue analysis and decomposition
- Execution plan creation with time estimates
- Dependency tracking and visualization
- Multi-layer coordination
- Work priority sequencing
- Parallel execution planning
- Progress tracking and status updates
- Blocker escalation

**When to Involve**:
```
✓ New GitHub issue needs execution plan
✓ Feature spans multiple layers
✓ Dependencies unclear between tasks
✓ Cross-layer coordination needed
✓ Parallel work planning required
✓ Blocker needs resolution
✓ Progress needs tracking
```

**Escalation Paths**:
- To Architect: Architectural decisions needed
- To Developer: Implementation blocked
- To Code Reviewer: Quality gate issues
- To Product Manager: Scope changes

**Success Criteria**:
- ✅ Execution plans delivered before development starts
- ✅ Estimated timelines within 20% of actual
- ✅ No blocking issues during development
- ✅ All dependencies identified upfront

**Related Files**:
- `.github/copilot/agents/orchestrator.md` (complete guide)
- `AGENTS.md` (workflow section)
- `docs/implementation-planning/` (execution plans)

---

### 3. Developer Agent

**Role**: Implementation across frontend, GraphQL, and Express layers

**Authority**: ⭐⭐⭐ (Medium)
- Full control over implementation within approved architecture
- Cannot change architecture or technology decisions
- Sets own implementation approach (within patterns)
- Manages feature branch

**Capabilities**:
- Frontend development (React, Next.js, Apollo Client)
- GraphQL backend development (Apollo Server, resolvers, DataLoader)
- Express backend development (routes, file uploads, SSE)
- Test writing and test debugging
- Code refactoring (within patterns)
- Bug fixes
- Documentation updates

**When to Involve**:
```
✓ Feature implementation on approved design
✓ Bug fix within single layer
✓ Refactoring to improve code quality
✓ Test writing for features
✓ Debugging production issues
✓ Code review feedback fixes
```

**Constraints**:
- ❌ Cannot change approved architecture
- ❌ Cannot select new technologies
- ❌ Cannot modify database schema alone
- ❌ Must follow patterns in DESIGN.md

**Escalation Paths**:
- To Orchestrator: Blocked by another layer
- To Architect: Architecture question emerged
- To Code Reviewer: Quality feedback

**Success Criteria**:
- ✅ All unit/integration tests passing
- ✅ Code follows project patterns
- ✅ TypeScript strict mode passes
- ✅ No regressions in existing features

**Related Files**:
- `.github/copilot/agents/developer.md` (complete guide)
- `.github/instructions/` (layer-specific guidance)
- `DESIGN.md` (patterns to follow)

---

### 4. Code Reviewer Agent

**Role**: Quality gate and architectural pattern validation for PRs

**Authority**: ⭐⭐⭐⭐⭐ (Highest)
- Can block PR merge if quality/pattern issues
- Approves PR or requests changes
- Catches regressions and edge cases
- Ensures architectural compliance
- May escalate to Architect for design validation

**Capabilities**:
- Thorough PR diff review
- Pattern compliance validation
- Cross-layer integration checking
- Performance analysis (N+1 detection, caching validation)
- Regression detection
- Edge case identification
- Security vulnerability detection
- Test coverage validation

**When to Involve**:
```
✓ PR ready for code review
✓ Complex changes need pattern validation
✓ Cross-layer changes need integration check
✓ Performance concerns exist
✓ Architectural pattern unclear
✓ Test coverage questionable
```

**Review Criteria**:
```
✅ Functionality works as intended
✅ No breaking changes
✅ Tests pass and cover changes
✅ Follows project patterns (DESIGN.md)
✅ No N+1 queries in GraphQL
✅ Optimistic updates in mutations
✅ Error handling comprehensive
✅ Documentation updated
✅ Performance acceptable
✅ No security vulnerabilities
```

**Escalation Paths**:
- To Architect: Major architectural issues
- To Developer: Implementation needs fixing
- To Product Manager: Scope conflicts

**Success Criteria**:
- ✅ 100% of merged PRs meet quality standards
- ✅ Zero post-merge bug reports from pattern violations
- ✅ Regressions caught before merge
- ✅ Developers learn from feedback

**Related Files**:
- `.github/copilot/agents/reviewer.md` (as "Code Reviewer")
- `DESIGN.md` (patterns to validate)
- `.github/instructions/` (layer-specific patterns)

---

### 5. Tester Agent

**Role**: Test strategy, coverage validation, and test writing guidance

**Authority**: ⭐⭐⭐ (Medium)
- Sets coverage requirements (80% minimum)
- Approves or requests test improvements
- Validates integration tests
- Defines E2E test scenarios

**Capabilities**:
- Test strategy design
- Unit test writing guidance
- Integration test creation
- E2E test planning
- Test coverage analysis
- Test isolation and cleanup
- Test performance optimization
- Flaky test debugging

**When to Involve**:
```
✓ Feature implementation needs test strategy
✓ Test coverage gaps identified
✓ Test failures need debugging
✓ Cross-layer integration tests needed
✓ Performance tests required
✓ Test isolation issues exist
```

**Coverage Requirements**:
- ✅ **Minimum**: 80% across all layers
- ✅ **Critical paths**: 100% (authentication, payments, core flows)
- ✅ **Resolvers**: 100% (all query/mutation paths)
- ✅ **Components**: 80% (UI logic)
- ✅ **Routes**: 100% (all express endpoints)

**Escalation Paths**:
- To Developer: Implementation needs fixing for tests to pass
- To Architect: Architectural change needed to enable testing
- To Orchestrator: Cross-layer test coordination

**Success Criteria**:
- ✅ 80%+ coverage across project
- ✅ No flaky tests (tests pass 100% reliably)
- ✅ Tests run in <5 minutes
- ✅ All critical paths have E2E coverage

**Related Files**:
- `.github/copilot/agents/tester.md` (complete guide)
- `.github/instructions/` (test patterns per layer)
- `DESIGN.md` (patterns that need tests)

---

### 6. Quality Assurance Agent

**Role**: Code quality standards, tooling, and security

**Authority**: ⭐⭐ (Medium-Low)
- Enforces linting and formatting rules
- Manages security audits
- Oversees testing tooling (Vitest, Playwright)
- Sets quality standards

**Capabilities**:
- ESLint configuration and rule enforcement
- Prettier code formatting
- Vitest test framework configuration
- pnpm audit security scanning
- Dependency vulnerability tracking
- Pre-commit hook configuration
- CI/CD quality gates
- Security policy enforcement

**When to Involve**:
```
✓ Setting up linting or formatting
✓ Security vulnerabilities detected
✓ Test framework configuration needed
✓ Pre-commit checks not working
✓ CI/CD quality gates need adjustment
✓ Dependency audit needed
```

**Standards**:
- ✅ ESLint: Zero violations in main
- ✅ Prettier: All code formatted
- ✅ TypeScript: Strict mode on all files
- ✅ Tests: pnpm test --run passes
- ✅ Audit: Zero known vulnerabilities
- ✅ Format: pnpm format:check passes

**Escalation Paths**:
- To Developer: Code needs to pass checks
- To Orchestrator: Project-wide standard changes

**Success Criteria**:
- ✅ All quality gates pass in CI
- ✅ No violations reach main branch
- ✅ Security audits run weekly
- ✅ Dependency updates applied promptly

**Related Files**:
- `.github/copilot/agents/quality-assurance.md` (complete guide)
- `.github/copilot-instructions.md` (quality gate commands)
- `package.json` (ESLint, Prettier config)

---

### 7. Product Manager Agent

**Role**: Feature definition, acceptance criteria, and release readiness

**Authority**: ⭐⭐⭐⭐⭐ (Highest - Business Decisions)
- Defines features and requirements
- Sets acceptance criteria
- Approves or rejects features
- Makes priority decisions
- Communicates with stakeholders

**Capabilities**:
- Feature requirement definition
- Acceptance criteria writing
- Use case documentation
- Interview material preparation
- Release readiness validation
- User acceptance testing (UAT)
- Competitive analysis
- Business value assessment
- Scope management (prevent creep)

**When to Involve**:
```
✓ New feature needs requirements
✓ Acceptance criteria needs clarity
✓ Release readiness check
✓ Scope creep concerns
✓ Business priority decisions
✓ Interview preparation
✓ Feature prioritization
```

**Success Criteria**:
- ✅ Clear requirements before development
- ✅ Acceptance criteria measurable
- ✅ Features aligned with business goals
- ✅ No scope creep on issues

**Escalation Paths**:
- To Architect: Technical feasibility questions
- To Orchestrator: Implementation timeline estimates

**Related Files**:
- `.github/copilot/agents/product-manager.md` (complete guide)
- `AGENTS.md` (feature requirements section)
- `docs/` (business documentation)

---

## Agent Collaboration Patterns

### Pattern 1: New Feature Development

```
SEQUENCE: Product Manager → Architect → Orchestrator → Developer → Tester → Code Reviewer

Step 1: PRODUCT MANAGER
  ├─ Define feature requirements
  ├─ Write acceptance criteria
  └─ Set priority/timeline

Step 2: ARCHITECT
  ├─ Review feasibility
  ├─ Propose design
  ├─ Identify tech changes (if any)
  └─ Document in ADR

Step 3: ORCHESTRATOR
  ├─ Create execution plan
  ├─ Identify dependencies
  ├─ Estimate time per phase
  └─ Coordinate layers

Step 4: DEVELOPER
  ├─ Implement feature
  ├─ Write tests
  ├─ Follow patterns
  └─ Create PR

Step 5: TESTER
  ├─ Review test coverage
  ├─ Validate test strategy
  ├─ Approve or request improvements
  └─ Plan E2E tests

Step 6: CODE REVIEWER
  ├─ Check code quality
  ├─ Validate patterns
  ├─ Catch regressions
  └─ Approve or request fixes

Step 7: ORCHESTRATOR (final)
  ├─ Verify all gates pass
  ├─ Coordinate merge
  └─ Mark complete
```

### Pattern 2: Bug Fix Process

```
SEQUENCE: Tester → Orchestrator → Developer → Code Reviewer

Step 1: TESTER
  ├─ Find bug in testing
  ├─ Document steps to reproduce
  └─ Assess severity

Step 2: ORCHESTRATOR
  ├─ Triage (is it in scope?)
  ├─ Create hotfix plan
  └─ Coordinate priority

Step 3: DEVELOPER
  ├─ Implement fix
  ├─ Add test case
  ├─ Verify regression test passes
  └─ Create PR

Step 4: CODE REVIEWER
  ├─ Review fix
  ├─ Check test case
  ├─ Validate no regressions
  └─ Approve merge
```

### Pattern 3: Architectural Conflict Resolution

```
SEQUENCE: Developer/Reviewer → Architect → Product Manager (if business impact)

Step 1: DEVELOPER or CODE REVIEWER
  ├─ Identify architectural conflict
  ├─ Escalate to Architect
  └─ Provide context

Step 2: ARCHITECT
  ├─ Analyze both perspectives
  ├─ Propose solution
  ├─ Document trade-offs
  └─ Recommend path forward

Step 3: PRODUCT MANAGER (if needed)
  ├─ Assess business impact
  ├─ Approve or override
  └─ Communicate decision

Result: All parties aligned, work proceeds
```

### Pattern 4: Performance Issue Investigation

```
SEQUENCE: Tester → Architect → Developer → Code Reviewer

Step 1: TESTER
  ├─ Identify performance issue
  ├─ Measure current vs target
  └─ Escalate to Architect

Step 2: ARCHITECT
  ├─ Analyze bottleneck
  ├─ Propose optimization strategy
  ├─ Set performance target
  └─ Create optimization plan

Step 3: DEVELOPER
  ├─ Implement optimizations
  ├─ Verify performance target met
  ├─ Test for regressions
  └─ Create PR

Step 4: CODE REVIEWER
  ├─ Review optimization approach
  ├─ Verify no regressions
  ├─ Validate performance gains
  └─ Approve
```

---

## Decision Authority Matrix

| Decision Type | Who Decides | Approval Needed | Timeline |
|---|---|---|---|
| **Feature Requirements** | Product Manager | None | Before development |
| **Feature Design** | Architect | Product Manager (scope) | Before development |
| **Implementation Approach** | Developer | Architect (follows design) | During implementation |
| **Test Strategy** | Tester | Architect (patterns) | During development |
| **Code Quality** | Code Reviewer | None (gates PR) | Before merge |
| **Release Readiness** | Product Manager | All agents (checks) | Before release |
| **Technology Selection** | Architect | Product Manager (business) | Before work |
| **Database Changes** | Architect | Orchestrator (plan) | Before work |
| **Priority Changes** | Product Manager | Orchestrator (replan) | Anytime |
| **Urgent Escalation** | Orchestrator | Architect (validate) | Immediately |

---

## Communication Protocols

### When Developer Needs Architect Input

```
Developer: "Need help with N+1 queries in resolver"

Architect Response: 
1. Identify pattern violation
2. Reference DESIGN.md (DataLoader pattern)
3. Provide specific code suggestion
4. Explain why it prevents N+1
5. Point to tester.md for testing approach
```

### When Code Reviewer Needs Architect Input

```
Reviewer: "This PR changes GraphQL schema unexpectedly"

Architect Response:
1. Review schema change against design
2. Check if it aligns with database model
3. Request migration plan (if needed)
4. Either approve or request redesign
```

### When Orchestrator Needs Architect Input

```
Orchestrator: "Can we implement real-time updates?"

Architect Response:
1. Propose design option(s)
2. Estimate implementation time
3. Identify layer impacts
4. Create decision document
5. Return to Orchestrator for planning
```

---

## Claude Code Best Practices Per Agent

### Architect's Context Strategy
- Load: DESIGN.md + 3-5 recent PRs + layer instruction files
- Estimate: Design takes 15-30 min with full context
- Avoid: Designing without reading current patterns

### Orchestrator's Context Strategy
- Load: AGENTS.md + affected layer instructions
- Estimate: Planning takes 10-20 min
- Avoid: Missing dependencies (read 2 recent PRs)

### Developer's Context Strategy
- Load: Layer instruction file + relevant patterns from DESIGN.md
- Estimate: Development takes bulk of time
- Avoid: Switching layers without reading both instruction files

### Code Reviewer's Context Strategy
- Load: DESIGN.md + layer rules + recent patterns
- Estimate: Review takes 30-60 min for complex PRs
- Avoid: Reviewing without pattern reference

### Tester's Context Strategy
- Load: Test patterns from tester.md + layer testing section
- Estimate: Test planning takes 15-20 min
- Avoid: Designing tests without understanding layers

### QA's Context Strategy
- Load: ESLint/Prettier configs + pre-commit checklist
- Estimate: QA setup takes 30 min initially
- Avoid: Manual checking (automate everything)

### Product Manager's Context Strategy
- Load: CLAUDE.md + recent issue summaries
- Estimate: Feature definition takes 30-45 min
- Avoid: Technical jargon (focus on user value)

---

## Related Documentation

- **`.github/copilot/agents/architect.md`** — Architect complete guide
- **`.github/copilot/agents/orchestrator.md`** — Orchestrator complete guide
- **`.github/copilot/agents/developer.md`** — Developer complete guide
- **`.github/copilot/agents/reviewer.md`** — Code Reviewer complete guide (as "Reviewer")
- **`.github/copilot/agents/tester.md`** — Tester complete guide
- **`.github/copilot/agents/quality-assurance.md`** — QA complete guide
- **`.github/copilot/agents/product-manager.md`** — Product Manager complete guide
- **`.github/copilot/rules/agent-authority.md`** — Decision authority rules
- **`AGENTS.md`** — Workflows and handoff patterns
- **`DESIGN.md`** — Architectural patterns
- **`CLAUDE.md`** — Tech stack details

---

**Last Updated**: 2026-08-19  
**Pattern**: 7-agent orchestration with clear roles and decision authorities  
**Integration**: All agents reference this guide for collaboration
