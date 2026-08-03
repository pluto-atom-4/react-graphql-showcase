# GitHub Copilot - Project Workflow & Instructions

**Repository**: Stoke Full Stack React/GraphQL Showcase  
**Pattern**: GitHub Official Hybrid (root + path-specific instructions with YAML frontmatter)

---

## Quick Navigation

### Foundational Docs
- **[CLAUDE.md](../../CLAUDE.md)** — Quick start, common commands, debugging tips
- **[DESIGN.md](../../DESIGN.md)** — Architecture, three-layer pattern, integration points
- **[AGENTS.md](../../AGENTS.md)** — Multi-agent orchestration, roles, handoff flows

### Path-Specific Instructions
Read these when working in each layer:

- **[.github/instructions/frontend.instructions.md](./instructions/frontend.instructions.md)** — Next.js, React, Apollo Client, Tailwind patterns
- **[.github/instructions/backend-graphql.instructions.md](./instructions/backend-graphql.instructions.md)** — Apollo Server, resolvers, DataLoader, event emission
- **[.github/instructions/backend-express.instructions.md](./instructions/backend-express.instructions.md)** — Express, file uploads, webhooks, SSE

---

## Workflow Rules

### Rule 1: One Issue → One Branch → One PR
- Create feature branch: `git checkout -b feat/issue-#<N>-<description>`
- Use SAME branch for all feedback fixes (no new branches)
- One commit per logical change; meaningful messages
- Result: Clean merge history, no rebasing confusion

### Rule 2: Feature Branch Workflow
- [ ] Create branch from main: `git checkout -b feat/issue-#<N>-<desc>`
- [ ] Implement and test locally
- [ ] Run all quality checks: `pnpm test`, `pnpm lint`, `pnpm type-check`
- [ ] Push once: `git push -u origin feat/issue-#<N>-<desc>`
- [ ] Create PR on GitHub
- [ ] On feedback: Fix code, commit, push to SAME branch (no -u flag)

### Rule 3: Multi-Agent Handoff
```
Issue Created → @orchestrator (plan) → @developer (implement)
    → PR created → @reviewer (examine) → Feedback? 
    → @developer (fix on SAME branch) → @reviewer (re-examine)
    → Merge to main → @tester (consolidation tests)
```

### Rule 4: Quality Gate (All Checks Required)
- [ ] `pnpm test:frontend --run` — 0 failures
- [ ] `pnpm test:graphql --run` — 0 failures
- [ ] `pnpm test:express --run` — 0 failures
- [ ] `pnpm lint` — 0 violations
- [ ] `pnpm type-check` — 0 errors
- [ ] Path-scoped `.instructions.md` patterns followed
- [ ] Commit messages follow convention
- [ ] PR description links to issue #N

### Rule 5: Layer-Specific Patterns
- **Frontend**: Follow `frontend.instructions.md` (Server/Client components, Apollo patterns)
- **GraphQL**: Follow `backend-graphql.instructions.md` (Resolvers, DataLoader, event emission)
- **Express**: Follow `backend-express.instructions.md` (File uploads, webhooks, SSE broadcast)

### Rule 6: No Direct Merges to main
- Always create PR; never push directly to main
- PR must pass all quality checks
- Requires reviewer approval before merge
- GitHub Actions verifies checks before auto-merge

### Rule 7: Escalation Paths
- **Architecture question**: Ask @orchestrator for re-planning
- **Cross-layer blocker**: Escalate to orchestrator for coordination
- **Design flaw found in review**: Return to orchestrator, do NOT implement
- **Test failure post-merge**: @tester escalates to @developer for hotfix

---

## Agent Roles Quick Reference

| Agent | When to Invoke | Outputs |
|-------|---|---------|
| **@orchestrator** | New issue, unclear requirements | Execution plan (saved to `docs/implementation-planning/`) |
| **@developer** | Implement feature on branch | Feature branch with tests, clean commits, PR ready |
| **@reviewer** | PR opened | Approved OR detailed feedback for fixes |
| **@tester** | Post-merge validation | Consolidation test report, pass/fail status |

See [AGENTS.md](../../AGENTS.md) for full agent documentation, responsibilities, and decision trees.

---

## Copilot Agent Mode vs Claude Code CLI

- **Use Agent Mode**: Issue planning, orchestration, cross-layer coordination, multi-person handoff
- **Use CLI**: Quick fixes, local testing, file exploration, interactive debugging

---

## Verification Checklist

Before pushing a PR:
- [ ] Reviewed path-scoped `.instructions.md` for my layer
- [ ] All tests pass (`pnpm test --run`)
- [ ] No lint violations (`pnpm lint`)
- [ ] TypeScript strict mode OK (`pnpm type-check`)
- [ ] Commit messages clear and link issue #N
- [ ] Branch is `feat/issue-#<N>-<description>`
- [ ] PR description explains changes and links issue

---

**Last Updated**: August 2, 2026  
**Full Reference**: See CLAUDE.md, DESIGN.md, AGENTS.md, and path-scoped `.instructions.md` files
