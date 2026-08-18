# Agent Orchestration Rules

Rules for multi-agent workflow, role definitions, and handoff protocols.

---

## Agent Roles & Responsibilities

### @orchestrator - Planning & Coordination

**Role**: Analyze requirements, create execution plans, coordinate multi-layer efforts

**When to Invoke**:
- New GitHub issue created
- User says: "plan this feature", "create execution plan", "analyze requirements"
- Cross-layer coordination needed, dependencies unclear

**Responsibilities**:
1. Read issue description thoroughly
2. Identify affected layers: Frontend, GraphQL, Express
3. Estimate time per phase (keep phases ≤60 min)
4. Create detailed execution plan with checkpoints
5. Reference path-scoped `.instructions.md` files
6. Save plan to `docs/implementation-planning/ISSUE-#<N>-PLAN.md`
7. Escalate if architecture changes needed

**Output Format**:
```markdown
## Issue #<N> Execution Plan

### Summary
<1-2 sentence description>

### Affected Layers
- [ ] Frontend (frontend/)
- [ ] GraphQL (backend-graphql/)
- [ ] Express (backend-express/)
- [ ] Database (prisma/schema.prisma)

### Phase 1: Review & Design (10 min)
- [ ] Check DESIGN.md for related patterns
- [ ] Review schema.graphql for domain model
- [ ] Identify files to modify
- [ ] Check for dependencies

### Phase 2: [Layer] Implementation (X min)
- [ ] Implement [specific task]
- [ ] Run layer tests
- [ ] Verify coverage

### Phase N: Integration & Testing (X min)
- [ ] Test end-to-end flow
- [ ] Run full test suite: pnpm test --run
- [ ] Verify no regressions
- [ ] Update documentation

### Deliverables
- Feature branch: feat/issue-#<N>-<description>
- Passing tests (all layers)
- Updated docs (CLAUDE.md, README, etc.)
- PR ready for review
```

**Decision Trees**:
- **New feature**: Create full plan with all phases
- **Bug fix**: Identify layer(s) affected, minimal phases
- **Refactoring**: Estimate risk level, plan regression testing
- **Documentation**: Simple plan, reference existing patterns
- **Cross-layer**: Plan in strict order (Frontend → GraphQL → Express → Integration)

**Escalation Criteria**:
- Architecture change needed → Ask stakeholder for approval
- Major refactoring → Plan in phases with clear rollback
- Database schema change → Verify migration strategy
- API contract change → Notify frontend/backend teams

---

### @coder - Implementation

**Role**: Implement features, write tests, fix feedback on same branch

**When to Invoke**:
- Orchestrator finishes execution plan
- User says: "implement this", "code the feature", "fix the feedback"
- Ready to start feature branch

**Responsibilities**:
1. Read execution plan and linked issue
2. Create feature branch once: `feat/issue-#<N>-<description>`
3. Implement per layer instructions (frontend.instructions.md, etc.)
4. Write tests as you code (TDD approach)
5. Run quality checks before each commit
6. Push and create PR (GitHub Actions validates)
7. Fix feedback on SAME branch (no new branches)
8. Rebase if merge conflicts exist

**Branch Workflow Rules**:
- ✅ **DO**: Create branch once per issue
- ✅ **DO**: Use branch for all feedback fixes
- ✅ **DO**: Rebase on main if conflicts
- ✅ **DO**: Force push if rebasing: `git push -f origin feat/issue-#<N>-<desc>`
- ✅ **DO**: Keep commit history clean (one commit per logical change)
- ❌ **DON'T**: Create new branches for feedback (reuse same branch)
- ❌ **DON'T**: Merge main into branch (use rebase)

**Commit Message Format**:
```bash
feat(#<N>): Add feature description       # New feature
fix(#<N>): Fix bug description           # Bug fix
docs(#<N>): Update documentation         # Documentation
refactor(#<N>): Refactor code            # Code cleanup

# Each commit should reference issue #N
```

**Quality Gate Before Commit**:
```bash
pnpm test --run          # All tests pass
pnpm lint                # No linting violations
pnpm type-check          # TypeScript strict mode OK
git commit -m "feat(#<N>): ..."
```

**Code Review Preparation**:
- Test locally: `pnpm dev` (all services running)
- Run full test suite: `pnpm test --run`
- Self-review code for obvious issues
- Write clear PR description
- Link to issue #N

---

### @reviewer - Quality Gate

**Role**: Examine diffs, provide detailed feedback, approve when ready

**When to Invoke**:
- Developer pushes PR to GitHub
- User says: "review this PR", "code review", "check the diff"
- After developer requests review

**Responsibilities**:
1. Read issue and full PR description
2. Checkout branch locally (optional but recommended)
3. Run full test suite: `pnpm test --run`
4. Review each commit in order (understand progression)
5. Check path-scoped `.instructions.md` patterns
6. Examine code for bugs, N+1 queries, performance issues
7. Leave detailed line-by-line feedback (if issues found)
8. Approve when all criteria met
9. Comment "Ready to merge" or approve to trigger merge

**Review Checklist** (Required for Approval):
- ✅ Issue requirements met (reference issue #N)
- ✅ All tests pass locally: `pnpm test --run`
- ✅ No lint violations: `pnpm lint`
- ✅ TypeScript strict mode: `pnpm type-check`
- ✅ Path-scoped patterns followed (check `.instructions.md`)
- ✅ No N+1 queries (if backend-graphql changes)
- ✅ Event emission correct (if mutations added)
- ✅ Documentation updated (CLAUDE.md, README, guides)
- ✅ Commit messages clear and link to #N
- ✅ Branch clean (no merge commits, rebased on main)

**Feedback Guidelines**:
- ✅ **DO**: Explain WHY (not just WHAT to fix)
- ✅ **DO**: Reference `.instructions.md` patterns
- ✅ **DO**: Suggest alternatives if appropriate
- ✅ **DO**: Praise good code/patterns used
- ✅ **DO**: Be constructive and educational
- ❌ **DON'T**: Nitpick formatting (Prettier handles that)
- ❌ **DON'T**: Request changes on subjective preferences
- ❌ **DON'T**: Leave vague feedback ("this looks wrong")

**Decision Criteria**:
- **Approve**: All checks pass, no outstanding issues
- **Request Changes**: Issues found that need fixing before merge
- **Comment**: Questions or suggestions (doesn't block approval)

**Issue Found Example**:
```
❌ N+1 Query Detected (Line 45, GraphQL resolver)

This query loads test runs for each build without DataLoader:
```typescript
builds.map(b => b.testRuns)  // N+1: queries database per build
```

FIX: Use DataLoader to batch load:
```typescript
const loaders = {
  testRunsByBuildId: new DataLoader(async (buildIds) => {
    // Batch load all test runs
  }),
};
builds.map(b => loaders.testRunsByBuildId.load(b.id))
```

See: backend-graphql.instructions.md#N+1-Prevention
```

---

### @tester - Consolidation & Validation

**Role**: Run integration tests, verify end-to-end flows, document results

**When to Invoke**:
- PR merged to main branch
- User says: "test this", "verify the feature", "integration test"
- Phase completion validation needed

**Responsibilities**:
1. Verify feature merged to main
2. Pull latest main: `git checkout main && git pull`
3. Start all services: `pnpm dev` (in separate terminal)
4. Run full test suite: `pnpm test --run`
5. Test real-world scenarios (not just automated tests)
6. Check for performance regressions
7. Verify no regression in existing features
8. Document results in issue (pass/fail with evidence)
9. Create hotfix issue if problems found

**Test Scenarios** (Per Layer):
**Frontend**:
- [ ] Dashboard renders (no errors)
- [ ] Navigate between pages (routing works)
- [ ] Create/Edit forms submit successfully
- [ ] Real-time events appear in UI (SSE working)
- [ ] Error states display (network error, validation error)

**GraphQL**:
- [ ] Query resolvers return expected data
- [ ] Mutation submits and updates cache
- [ ] DataLoader batches queries (check logs)
- [ ] Events emitted after mutations
- [ ] No N+1 queries in logs

**Express**:
- [ ] File upload works (multipart/form-data)
- [ ] Webhook ingestion succeeds (verify signature)
- [ ] SSE events broadcast to clients
- [ ] Appropriate error responses (400, 401, 500)

**End-to-End**:
- [ ] Create build via UI (frontend)
- [ ] Query builds via GraphQL
- [ ] Upload test report via Express
- [ ] Receive real-time notification (SSE)
- [ ] All data persists in database

**Performance Checks**:
- [ ] Page load time < 3 seconds
- [ ] GraphQL query time < 500ms
- [ ] File upload time reasonable (no hanging)
- [ ] No memory leaks (check browser DevTools)
- [ ] No excessive database queries

**Test Result Template**:
```markdown
## Issue #<N> Consolidation Test Report

**Date**: 2026-08-17
**Tester**: @tester
**Branch**: main (commit abc123)

### Test Summary
- ✅ All automated tests pass
- ✅ Manual testing complete
- ❌ Performance regression detected

### Test Results

#### Frontend (pnpm test:frontend --run)
- ✅ Passed: 45 tests
- ❌ Failed: 0
- Coverage: 85%

#### GraphQL (pnpm test:graphql --run)
- ✅ Passed: 32 tests
- ❌ Failed: 0
- Coverage: 88%

#### Express (pnpm test:express --run)
- ✅ Passed: 18 tests
- ❌ Failed: 0
- Coverage: 82%

#### Manual Testing
- ✅ Dashboard renders correctly
- ✅ Create build flow works end-to-end
- ✅ Real-time events stream to UI
- ❌ File upload slower than before (500ms → 1.2s)

### Issues Found
1. File upload performance regression
   - Root cause: Multer validation taking 700ms
   - Action: Create hotfix issue #<N+1>

### Regression Testing
- ✅ Existing features still work
- ✅ Previous issues not re-opened
- ✅ Database migrations applied cleanly

### Conclusion
✅ READY FOR RELEASE (pending hotfix #<N+1>)
```

---

### @qa / @product - Release Readiness

**Role**: Final validation, performance verification, sign-off

**When to Invoke**:
- Pre-release or final validation needed
- User says: "is this production-ready", "final sign-off"
- Performance or UX concerns exist

**Responsibilities**:
1. Verify feature matches issue requirements
2. Test on different browsers (Chrome, Firefox, Safari)
3. Test on different devices (desktop, tablet, mobile)
4. Verify performance SLOs met
5. Check documentation clarity and completeness
6. Perform user acceptance testing (UAT)
7. Sign off: "Ready to ship" or list blockers
8. Plan rollback strategy

**Sign-Off Criteria** (All Must Pass):
- ✅ Feature requirements met (verify against issue)
- ✅ Performance SLOs met (< 3s page load, < 500ms API)
- ✅ Documentation complete and accurate
- ✅ No known bugs or regressions
- ✅ Monitoring/logging in place
- ✅ Rollback plan documented
- ✅ User acceptance testing passed
- ✅ Security review passed (if applicable)

**Sign-Off Template**:
```markdown
## Release Sign-Off: Issue #<N>

**Feature**: [Description]
**Version**: 1.0.0
**Release Date**: 2026-08-20

### Requirements Verification
- ✅ Requirement 1: [Description]
- ✅ Requirement 2: [Description]
- ❌ Requirement 3: [Description] → Blocker

### Performance Verification
- ✅ Page load: 2.1s (SLO: < 3s)
- ✅ API latency: 320ms (SLO: < 500ms)
- ✅ No memory leaks
- ✅ Database queries optimized

### User Acceptance Testing
- ✅ End users tested feature
- ✅ No critical UX issues
- ✅ Documentation clear to users

### Rollback Plan
- Database migration rollback: `pnpm migrate:rollback`
- Revert commit: `git revert <commit>`
- Timeline: 5 minutes to rollback

### Sign-Off
✅ **APPROVED FOR PRODUCTION** (hotfix #<N+1> required post-release)

Signed: @qa
Date: 2026-08-17
```

---

## Handoff Protocol

### Orchestrator → Coder
**Trigger**: Execution plan complete  
**Handoff**: Save plan to `docs/implementation-planning/`, reference in issue  
**Validation**: Plan has clear phases, time estimates, layer breakdown

### Coder → Reviewer
**Trigger**: PR pushed to GitHub  
**Handoff**: GitHub Actions runs automated checks, Reviewer invited  
**Validation**: Tests pass, lint clean, TypeScript OK

### Reviewer → Coder (Feedback Loop)
**Trigger**: Issues found in review  
**Handoff**: Detailed line-by-line feedback in PR comments  
**Validation**: Feedback is actionable, references patterns/docs

### Reviewer → Tester
**Trigger**: PR approved and merged to main  
**Handoff**: Issue linked to PR, Tester invited to consolidation phase  
**Validation**: All quality gates passed

### Tester → QA
**Trigger**: Integration tests all pass  
**Handoff**: Consolidation test report saved to issue  
**Validation**: Manual testing complete, no regressions

### QA → Release
**Trigger**: Sign-off complete  
**Handoff**: Release tag created, deployment plan activated  
**Validation**: All SLOs met, rollback plan documented

---

## Decision Trees

### When to Escalate Back to Orchestrator
- Architecture change needed (e.g., add new database table)
- Cross-layer blocker (e.g., can't implement frontend without GraphQL change)
- Requirement ambiguity (e.g., unclear what "status" field means)
- Major refactoring (e.g., change from DataLoader to something else)

**How to Escalate**:
1. Comment on issue: "@orchestrator This needs re-planning because..."
2. Link to specific blockers
3. Wait for re-planning before proceeding

### When to Create Hotfix Issue
- Test failure post-merge (performance, regression, new bug)
- Security issue discovered
- Data corruption issue
- Critical user-facing bug

**How to Create Hotfix**:
1. Create new issue: "Hotfix #<N>-1: <description>"
2. Link original issue
3. Escalate to @coder immediately
4. Mark as "urgent" priority

---

## Related Documentation

- **See**: `AGENTS.md` (detailed agent orchestration)
- **See**: `.github/copilot-instructions.md` (WRAP format guide)
- **See**: `SKILLS.md` (skill-based invocation)

---

**Last Updated**: 2026-08-17  
**Key Concept**: Clear role separation with defined handoff boundaries  
**Escalation**: Always escalate early rather than block progress
