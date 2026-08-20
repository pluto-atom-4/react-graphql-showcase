# Agent Decision Authority & Escalation Rules

Defines which agent has authority over specific decision types, escalation paths for conflicts, and documentation requirements.

---

## Decision Authority Matrix

### Strategic Decisions (Long-Term Impact)

| Decision | Authority | Scope | Approval Needed | Override |
|---|---|---|---|---|
| **System Architecture** | Architect | Affects multiple layers | None | Product Manager (business impact) |
| **Technology Stack** | Architect | New framework, library, or tool | Product Manager (cost/timeline) | Product Manager |
| **Database Schema** | Architect | Schema design, migrations | Orchestrator (execution plan) | Engineering Lead (scale impact) |
| **API Contracts** | Architect | GraphQL schema, Express routes | Developer (implementation) | Product Manager (breaking changes) |
| **Performance Targets** | Architect + Tester | Latency, throughput goals | Product Manager (user-visible) | Engineering Lead (technical feasibility) |
| **Scalability Design** | Architect | 10x+ growth planning | Product Manager (business horizon) | Engineering Lead (infrastructure) |

### Tactical Decisions (Execution-Level)

| Decision | Authority | Scope | Approval Needed | Override |
|---|---|---|---|---|
| **Feature Requirements** | Product Manager | What to build | Architect (feasibility) | Executive (priority change) |
| **Acceptance Criteria** | Product Manager | Definition of done | Tester (testability) | Product Manager (sole authority) |
| **Execution Plan** | Orchestrator | How to break down work | Architect (dependencies) | Orchestrator (sole authority) |
| **Implementation Approach** | Developer | Code organization, patterns | Architect (follows design) | Code Reviewer (patterns) |
| **Test Strategy** | Tester | Test types and coverage | Architect (test architecture) | Code Reviewer (coverage) |
| **Code Quality Standards** | QA | Linting, formatting, security | Code Reviewer (PR application) | Project Lead |

### Release Decisions (Go/No-Go)

| Decision | Authority | Scope | Approval Needed | Override |
|---|---|---|---|---|
| **Release Readiness** | Product Manager | "Go or no-go" | All agents (verify gates) | Executive (business decision) |
| **Quality Gate Pass** | Code Reviewer | PR can merge | Orchestrator (timing) | Architect (exception) |
| **Bug Fix Priority** | Product Manager | Hotfix or defer | Orchestrator (scope) | Product Manager |
| **Feature Complete** | Orchestrator | Feature ready | Code Reviewer (quality) | Product Manager (scope) |

---

## Escalation Paths

### Escalation 1: Developer Blocked by Architecture

```
SITUATION: Developer can't implement feature within current architecture

DEVELOPER: "This DataLoader pattern is too complex for this resolver"

ESCALATION PATH:
  Developer → Architect (ask for guidance/redesign)
  ├─ Architect: "Redesign resolver to use simpler pattern" OR
  ├─ Architect: "Current pattern is correct, here's how" OR
  └─ Architect: "Need to change architecture for this feature"

RESOLUTION:
  ✓ If redesign needed: Architect creates new design
  ✓ If pattern needed: Architect provides specific guidance
  ✓ If architecture change: Escalate to Product Manager
```

### Escalation 2: Code Reviewer Finds Major Issue

```
SITUATION: PR has architectural flaw that blocks merge

REVIEWER: "This PR violates our N+1 prevention pattern"

ESCALATION PATH:
  Code Reviewer → Developer (explain issue + fix)
  ├─ Developer: Fixes issue OR
  └─ Developer: "Can't fix without architecture change"
      ├─ Developer → Architect (needs redesign)
      ├─ Architect: Redesigns OR escalates to Product Manager
      └─ Result: Design approved, developer implements

RESOLUTION:
  ✓ If fixable: Developer fixes, re-requests review
  ✓ If not fixable: Architect intervenes, determines path
```

### Escalation 3: Conflicting Requirements

```
SITUATION: Frontend and GraphQL teams disagree on data model

FRONTEND TEAM: "We need nested user data in one query"
GRAPHQL TEAM: "Causes N+1, violates DataLoader pattern"

ESCALATION PATH:
  Code Reviewer (notices conflict) → Architect (mediates)
  ├─ Architect: Proposes solution (separate queries with DataLoader)
  ├─ Both teams: Accept OR escalate
  └─ If escalate: Architect → Product Manager (business priority)

RESOLUTION:
  ✓ Architect provides technical solution
  ✓ Product Manager resolves if business/priority conflict
  ✓ All agree on approach before work proceeds
```

### Escalation 4: Test Coverage Gap

```
SITUATION: PR passed code review but test coverage is low

TESTER: "Coverage is 45%, but requirement is 80%"

ESCALATION PATH:
  Tester → Developer (needs more tests)
  ├─ Developer: Adds tests OR
  └─ Developer: "Can't test this without architecture change"
      ├─ Developer → Architect (testability issue)
      ├─ Architect: "Redesign for testability" OR
      ├─ Architect: "This is acceptable, lower target"
      └─ Tester: Approves with rationale

RESOLUTION:
  ✓ If fixable: Developer adds tests
  ✓ If architectural: Architect decides
  ✓ Coverage requirement met or explicitly waived
```

### Escalation 5: Performance Issue

```
SITUATION: Query latency exceeds target after merge

TESTER: "P95 latency is 500ms, target is 100ms"

ESCALATION PATH:
  Tester → Architect (design issue OR implementation issue)
  ├─ If implementation: Architect → Developer (optimize)
  ├─ If design: Architect → Product Manager (trade-off decision)
  │   ├─ Product Manager: "Reduce data OR accept latency"
  │   └─ Architect: "Redesign based on decision"
  └─ Result: Performance target met or explicitly waived

RESOLUTION:
  ✓ Performance target achieved OR
  ✓ Trade-off documented and approved by Product Manager
```

### Escalation 6: Urgent Bug Fix

```
SITUATION: Critical production bug needs immediate hotfix

TESTER: "Payment endpoint is broken in production"

ESCALATION PATH:
  Tester → Orchestrator (urgent coordination)
  ├─ Orchestrator: Coordinates hotfix
  │   ├─ Architect: Quick review of proposed fix
  │   ├─ Developer: Implements hotfix
  │   ├─ Code Reviewer: Expedited review
  │   └─ Orchestrator: Coordinates merge
  └─ Post-incident: Root cause analysis by Architect

RESOLUTION:
  ✓ Hotfix deployed (may skip some normal gates)
  ✓ Root cause identified
  ✓ Permanent fix planned
```

---

## Conflict Resolution Framework

### When Agents Disagree: Step-by-Step

**Step 1: Identify the Disagreement**
```
Agent A: "We should use option X"
Agent B: "We should use option Y"
→ ROOT CAUSE: Different authority levels or missing information
```

**Step 2: Determine Whose Authority**
```
Table: Decision Authority Matrix (above)
→ RESULT: Agent X has authority (per matrix)
```

**Step 3: Resolve According to Authority**
```
If Authority Agent Agrees with Agent A:
  → Agent A's position wins
  
If Authority Agent Agrees with Agent B:
  → Agent B's position wins
  
If Authority Agent is Neutral:
  → Authority Agent decides (new decision)
```

**Step 4: Document Decision**
```
Outcome: [Who won and why]
Trade-offs: [What Agent A gains/loses]
Implementation: [How to proceed]
Review: [When to revisit]
```

### Example Conflict: Database Schema

```
CONFLICT:
  Developer: "Add new column for caching (quick fix)"
  Architect: "Needs database redesign (proper solution)"

AUTHORITY: Architect (per matrix: database schema)

RESOLUTION:
  Architect decides: "Proper redesign" (preferred)
  OR Architect decides: "Quick fix acceptable if plan for redesign"
  
OUTCOME: All implement based on Architect's decision

LEARNING: Developer knows next time that schema changes need Architect review
```

### Example Conflict: Release Timing

```
CONFLICT:
  Product Manager: "Release in 2 weeks"
  Orchestrator: "Need 4 weeks for proper implementation"

AUTHORITY: Product Manager (per matrix: feature requirements)

RESOLUTION:
  Product Manager decides: "2 weeks" (priority)
  OR Product Manager decides: "Reduce scope to fit 2 weeks"
  OR Product Manager decides: "Wait 4 weeks" (quality priority)

OUTCOME: Timeline set by Product Manager, others plan accordingly

LEARNING: Orchestrator knows business priorities when planning
```

---

## Decision Documentation Requirements

### Every Decision Should Document

For any decision made by authority agent:

```markdown
## Decision: [Title]

### Context
Why this decision is needed (business/technical drivers)

### Options Considered
- Option A: pros/cons
- Option B: pros/cons  
- Option C: pros/cons

### Decision
Chosen: [Option X]
Authority: [Agent name]
Date: [Date made]

### Rationale
Why Option X was chosen (key reasons)

### Implementation
- Phase 1: What to do
- Phase 2: What to do
- Validation: How to verify

### Trade-offs
- Benefit: What we gain
- Cost: What we sacrifice
- Risk: What could go wrong

### Escalation
- If [condition], escalate to [agent]
- If [condition], involves [agent]

### Review
- Review date: [when to revisit]
- Trigger: [what triggers review]
```

### Where to Store Decisions

**Strategic Decisions** → `docs/decisions/ADR-[number]-[title].md`
- System architecture choices
- Technology selections
- Database redesigns
- API contract changes

**Tactical Decisions** → GitHub Issue or PR comments
- Execution plan decisions
- Implementation approach
- Test strategy choices
- Code review feedback

**Release Decisions** → Release notes or issue closure comment
- Go/no-go decisions
- Known limitations
- Future work items

---

## Authority Levels & Veto Power

### Level 5: Veto Authority
- ✅ **Can unilaterally decide** without consensus
- ✅ **Can override lower authority agents** with justification
- ✅ **Must document decision** with rationale
- **Agents**: Architect, Code Reviewer, Product Manager

**Example**: 
```
Architect: "This PR violates the DataLoader pattern"
Architect: "Must be redesigned before merge"
Result: Code Reviewer can't approve (Architect veto)
```

### Level 4: Decision Authority
- ✅ **Can decide within scope** with stakeholder input
- ⚠️ **Should consult higher authority** on conflicts
- ✅ **Must document decision** in execution plan
- **Agents**: Orchestrator, Tester

**Example**:
```
Orchestrator: "This feature needs 3 phases"
Orchestrator: "Phase 2 depends on Phase 1"
Result: Developers must follow sequencing
```

### Level 3: Recommendation Authority
- ✅ **Can recommend approach** based on expertise
- ⚠️ **Decision made by higher authority** (usually)
- ✅ **Can escalate if concerns** exist
- **Agents**: Developer, QA

**Example**:
```
Developer: "I'd recommend this implementation"
Code Reviewer: "Validates if pattern-compliant"
Architect: "Makes final decision if complex"
```

---

## Common Authority Scenarios

### Scenario 1: New Feature Release

```
SEQUENCE:
  Product Manager (defines requirements)
    ↓ Authority: Set acceptance criteria
  Architect (reviews feasibility)
    ↓ Authority: Approve design
  Orchestrator (creates execution plan)
    ↓ Authority: Sequence phases
  Developer (implements)
    ↓ Authority: Code organization
  Tester (validates coverage)
    ↓ Authority: Test completeness
  Code Reviewer (approves code)
    ↓ Authority: Quality gate
  Product Manager (approves release)
    ↓ Authority: Go/no-go
```

### Scenario 2: Performance Issue

```
SEQUENCE:
  Tester (identifies issue)
    ↓ Authority: Measure and report
  Architect (analyzes cause)
    ↓ Authority: Propose solution
  Developer (implements fix)
    ↓ Authority: Code implementation
  Code Reviewer (validates)
    ↓ Authority: Quality gate
  Tester (verifies target met)
    ↓ Authority: Approve performance
```

### Scenario 3: Technology Upgrade

```
SEQUENCE:
  Architect (evaluates new version)
    ↓ Authority: Feasibility + migration plan
  Product Manager (approves timeline)
    ↓ Authority: Business decision
  Orchestrator (coordinates phases)
    ↓ Authority: Execution sequencing
  Developer (implements upgrade)
    ↓ Authority: Code changes
  QA (validates quality)
    ↓ Authority: Quality gates
  Code Reviewer (approves)
    ↓ Authority: Merge gate
```

---

## When to Escalate Immediately

### Red Flags 🚩

**Escalate immediately if**:

1. **Two agents strongly disagree**
   - → Escalate to higher authority per matrix
   - → Do NOT proceed without resolution

2. **Timeline pressure**
   - Developer wants to skip quality checks
   - Tester wants to skip test coverage
   - → Escalate to Orchestrator → Product Manager

3. **Architectural issue emerges**
   - Can't implement without changing architecture
   - Performance target can't be met
   - → Escalate to Architect immediately

4. **Blockers affecting multiple teams**
   - Frontend blocked by GraphQL
   - GraphQL blocked by database schema
   - → Escalate to Orchestrator → Architect

5. **Breaking changes planned**
   - GraphQL schema change affecting frontend
   - Database migration risky
   - → Escalate to Architect → Product Manager

---

## Authority Scope Boundaries

### Architect Authority Boundaries

✅ **CAN**:
- Design system architecture
- Select technologies
- Design database schemas
- Set performance targets
- Reject PRs for architectural reasons

❌ **CANNOT**:
- Override Product Manager on features
- Make business decisions
- Set release timelines (Product Manager does)
- Decide priorities between features
- Override security/compliance policies

### Orchestrator Authority Boundaries

✅ **CAN**:
- Break down issues into phases
- Sequence work across layers
- Identify dependencies
- Track progress
- Escalate blockers

❌ **CANNOT**:
- Change approved architecture
- Make technology decisions
- Override Architect on design
- Set business priorities
- Approve releases

### Developer Authority Boundaries

✅ **CAN**:
- Choose implementation approach (within patterns)
- Refactor code (within patterns)
- Fix bugs
- Write tests
- Organize code files

❌ **CANNOT**:
- Change approved architecture
- Select new technologies
- Modify database schema alone
- Override test requirements
- Skip code review

### Code Reviewer Authority Boundaries

✅ **CAN**:
- Block PRs for quality reasons
- Request changes
- Ask for more tests
- Catch regressions
- Validate patterns

❌ **CANNOT**:
- Approve PRs that violate architecture
- Override test coverage requirements
- Change acceptance criteria
- Set performance targets
- Make technology choices

### Product Manager Authority Boundaries

✅ **CAN**:
- Define features
- Set acceptance criteria
- Set business priorities
- Approve releases
- Make go/no-go decisions

❌ **CANNOT**:
- Override Architect on technical feasibility
- Change implementation approach
- Set code quality standards
- Decide on technology selections
- Override quality gates for shipping

---

## Model Guidance for Decision-Making

### When to Use Haiku (Default)

✅ Decisions within established patterns
✅ Routine escalations
✅ Documentation updates
✅ Clarifications using existing examples

### When to Use Sonnet/Opus (Premium)

🔍 Novel architectural patterns
🔍 Complex technology trade-offs
🔍 Conflicting requirements resolution
🔍 Scalability planning from first principles

---

## Related Documentation

- **`.github/instructions/agent-roles.md`** — Agent definitions and capabilities
- **`.github/copilot/agents/architect.md`** — Architect decision-making guide
- **`.github/copilot/agents/orchestrator.md`** — Orchestrator execution planning
- **`AGENTS.md`** — Workflow and role definitions
- **`DESIGN.md`** — Established patterns and decisions

---

**Last Updated**: 2026-08-19  
**Pattern**: Clear authority matrix with escalation paths  
**Integration**: All agents reference this for decision boundaries
