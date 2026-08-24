# .copilot/ LEGACY REFERENCE

> ⚠️ **ARCHIVED CONFIGURATION** — These files document the pre-CLI v1.0+ architecture and are kept for historical reference only.
> 
> **Active Configuration**: `.github/copilot/settings.json` (GitHub Copilot CLI standard)
> **Active Instructions**: `.copilot/copilot-instructions.md` (GitHub Copilot CLI standard)
> **Active Agents**: `.copilot/agents/` (6 agent role definitions)

---

## Migration Timeline

| Date | Event | Reference |
|------|-------|-----------|
| 2026-04-17 | Original rules.json created | `rules.json` line 12 |
| 2026-05-08 | rules.json last updated | `rules.json` line 13 |
| 2026-05-10 | Migration to GitHub Copilot CLI v1.0+ standard | Both files `_migration_date` |

---

## Files in This Directory

### ✅ LEGACY (Reference Only)

| File | Size | Purpose | Status |
|------|------|---------|--------|
| **config.json** | 29K | Project-specific orchestration configuration (pre-CLI v1.0+) | Archived 2026-05-10 |
| **rules.json** | 47K | Implementation rules & agent routing (pre-CLI v1.0+) | Archived 2026-05-10 |

**Why Archived**: GitHub Copilot CLI v1.0+ uses standard configuration structures (`.github/copilot/settings.json`, custom instructions, agent definitions). These JSON files contain valuable historical context about how the multi-agent system was originally designed and evolved.

**How to Use These Files**:
- Reference for understanding agent design decisions (see `rules.json` → `approved_agents`)
- Historical documentation of orchestration patterns (see `config.json` → `execution_planning`)
- Feedback tracking patterns (see `rules.json` → `feedback_tracking_format`)

### ✅ ACTIVE (Current Use)

| File | Purpose |
|------|---------|
| **copilot-instructions.md** | Custom instructions for GitHub Copilot CLI (active) |
| **agents/** | 6 agent role definitions (.md files) |
| **PR_FEEDBACK_QUICK_REFERENCE.md** | Quick reference for PR review feedback patterns |

---

## Key Insights from Legacy Files

### From config.json

**Orchestration Concept**:
- Agents route through execution planning documents
- Location: `docs/implementation-planning/`
- Pattern: `EXECUTION-PLAN-*.md` or `PHASE-*-PLAN.md`

**Execution Plan Required Sections**:
1. Overview
2. Issues to Address
3. Dependencies & Parallelization Strategy
4. Multi-Agent Delegation Plan
5. Implementation Steps per Issue
6. Consolidation & PR Review Strategy
7. GitHub Actions Merge Configuration

**Feedback Tracking** (Optional):
- PR Review Feedback Cycles
- Feature Branch Registry
- Feedback Resolution Log

### From rules.json

**Approved Agents** (6 total):
1. **Orchestrator** - Multi-agent delegation per execution plan
2. **Developer** - Code implementation on feature branches
3. **Reviewer** - PR review & feedback
4. **Tester** - Test automation & CI/CD
5. **Documentor** - Documentation generation & updates
6. **Architect** - Architecture design & system planning

**Agent Routing**:
- Agent-exclusive enforcement (all Copilot CLI interactions route through agents)
- GitHub Copilot CLI v1.0+ compatible

**Git Workflow** (per Developer agent):
1. Create feature branch: `git branch feat/issue-#<N>-<kebab-case> origin/main`
2. Switch to branch: `git switch feat/issue-#<N>-<kebab-case>`
3. Add tracked files only: `git add [tracked files only]`
4. Commit with format: `<type>(#<N>): <description>\n\nCloses #<N>`

---

## Migration Path (Issue #336)

See [issue #336](https://github.com/pluto-atom-4/react-graphql-showcase/issues/336) for active configuration optimization:

**Phase 1** ✅ (COMPLETE): Archive .copilot/ legacy files
- [x] Mark config.json as LEGACY in file headers (already done)
- [x] Mark rules.json as LEGACY in file headers (already done)
- [x] Create this LEGACY_REFERENCE.md (done)

**Phase 2** (IN PROGRESS): Consolidation
- [ ] Merge agent definitions (AGENTS.md as single source)
- [ ] Consolidate workflow rules (remove duplication)
- [ ] Consolidate permissions into .claude/settings.json
- [ ] Remove redundant rule files

**Phase 3+**: See issue #336 for full roadmap

---

## Questions or Issues?

If you need to understand the original design decisions, refer to:
1. **rules.json** → `approved_agents` (agent definitions)
2. **config.json** → `execution_planning` (orchestration patterns)
3. **docs/copilot/ENHANCEMENT-SUMMARY.md** (context on evolution)
4. **docs/copilot/RESEARCH-ENHANCEMENTS.md** (research notes)

---

**Last Updated**: 2026-08-23 (Issue #336 Phase 1)
