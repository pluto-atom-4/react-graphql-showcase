# AGENTS.md

Agent orchestration and multi-agent handoff strategy for Stoke Full Stack React/GraphQL Showcase.

---

## Agent Roles & Responsibilities

| Agent Type | Role | Responsibilities | When to Use |
|------------|------|------------------|------------|
| **Orchestrator** | Plan & Coordinate | Analyze issue requirements, create execution plan, delegate work, track progress | Issue intake; new feature planning; cross-layer coordination |
| **Developer** | Implementation | Code features on feature branches, fix feedback, write tests, update docs | Feature implementation; bug fixes; refactoring |
| **Reviewer** | Quality Gate | Examine PR diffs, provide detailed feedback, approve when ready, catch regressions | Before merge; code quality validation; architecture review |
| **Tester** | Consolidation Validation | Run integration tests post-merge, verify end-to-end flows, document results | After merge; phase consolidation; regression testing |
| **QA / Product** | Release Readiness | Verify against requirements, check performance, validate UX, sign off on release | Pre-release; feature completeness; user-facing validation |

---

## Agent Invocation Guide

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
- Push to remote and create PR (or hand off to Reviewer)
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

### Reviewer (`@reviewer`)
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

**Output**: PR approved or detailed feedback for developer to fix.

---

### Tester (`@tester`)
**Triggers**:
- PR merged to main
- User says: "test this", "run consolidation tests", "verify the feature"
- Integration validation needed

**Responsibilities**:
- Verify feature works end-to-end: all layers integrated
- Run full test suite: `pnpm test:frontend --run && pnpm test:graphql --run && pnpm test:express --run`
- Test real-world scenarios (UI interactions, real-time events, file uploads)
- Check performance: N+1 query logs, event latency, file upload speed
- Verify no regression: existing features still work
- Document results in issue or PR

**Test Scenarios**:
- Frontend: Render dashboard, interact with mutations, receive real-time events
- GraphQL: Query resolvers, mutation event emission, DataLoader batching
- Express: File upload, webhook processing, SSE broadcasting
- End-to-End: Create build → Upload test report → Receive real-time notification

**Output**: Consolidation test report with pass/fail status.

---

### QA / Product (`@qa`, `@product`)
**Triggers**:
- Near release / final validation
- User says: "is this production-ready", "final sign-off"
- Performance or UX concerns

**Responsibilities**:
- Verify feature matches requirements from issue
- Test on different browsers/devices if applicable
- Verify performance meets SLOs (load time, real-time latency)
- Check documentation is clear and complete
- User acceptance testing (UAT)
- Sign off: "Ready to ship" or "Issues blocking release"

---

## Multi-Agent Handoff Flow

```
Issue Created
    ↓
@orchestrator → Create execution plan (10-30 min)
    ↓
Plan saved to docs/implementation-planning/
    ↓
@developer → Implement on feature branch (1-3 hours)
    ↓
Push PR to GitHub
    ↓
@reviewer → Examine diff, provide feedback (30-60 min)
    ↓
Feedback? → YES → @developer → Fix on EXISTING branch → Loop back to @reviewer
    ↓ NO
Approved! → Merge to main
    ↓
@tester → Run consolidation tests (20-30 min)
    ↓
All pass? → YES → Feature complete
        ↓ NO
        Issue → @developer → Hotfix → Loop back to @tester

Release candidate?
    ↓
@qa → Final UAT & performance validation
    ↓
Ship!
```

---

## Copilot Agent Mode vs Claude Code CLI

### Use Copilot Agent Mode When:
- **Issue intake & planning**: Orchestrator analyzing requirements
- **Cross-layer coordination**: Multiple layers need synchronized changes
- **Multi-person workflow**: Handing off between orchestrator → developer → reviewer → tester
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

### For Developer:
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

**Last Updated**: August 2, 2026  
**Pattern**: Multi-agent orchestration with clear role separation and handoff boundaries
