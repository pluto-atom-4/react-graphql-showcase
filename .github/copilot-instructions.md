# Copilot - Project Workflow & Instructions

**Repository**: Stoke Full Stack React/GraphQL Showcase

---

## Quick Navigation

- **[CLAUDE.md](../../CLAUDE.md)** — Quick start, commands, debugging
- **[DESIGN.md](../../DESIGN.md)** — Architecture, dual-backend pattern
- **[AGENTS.md](../../AGENTS.md)** — Multi-agent roles and workflows

### Path-Specific Instructions
- **[frontend.instructions.md](./instructions/frontend.instructions.md)** — React, Apollo, Next.js
- **[backend-graphql.instructions.md](./instructions/backend-graphql.instructions.md)** — Resolvers, DataLoader, events
- **[backend-express.instructions.md](./instructions/backend-express.instructions.md)** — Uploads, webhooks, SSE

---

## Workflow Rules

### Rule 1: One Issue → One Branch → One PR
- Create: `git checkout -b feat/issue-#<N>-<description>`
- All fixes on SAME branch (no new branches)
- One commit per logical change
- Clean merge history

### Rule 2: Feature Branch Process
- [ ] Create branch from main
- [ ] Implement and test locally
- [ ] Run: `pnpm test --run && pnpm lint && pnpm type-check`
- [ ] Push: `git push -u origin feat/issue-#<N>-<desc>`
- [ ] Create PR, get approval, merge to main

### Rule 3: Quality Gate (Required)
- [ ] All tests pass (all layers)
- [ ] No lint violations
- [ ] TypeScript strict mode OK
- [ ] Path-scoped `.instructions.md` patterns followed
- [ ] Clear commit messages linking issue #N
- [ ] PR description explains changes

### Rule 4: Layer-Specific Patterns
- **Frontend**: Follow `frontend.instructions.md` (Server/Client components, Apollo)
- **GraphQL**: Follow `backend-graphql.instructions.md` (Resolvers, DataLoader, events)
- **Express**: Follow `backend-express.instructions.md` (Uploads, webhooks, SSE)

### Rule 5: No Direct Merges
- Always create PR (never push to main)
- Requires reviewer approval
- GitHub Actions verifies checks

---

## Agent Roles

| Agent | Invoke for | Output |
|-------|-----------|--------|
| **@orchestrator** | New issue, unclear requirements | Execution plan |
| **@developer** | Implement feature | Feature branch, tests, PR-ready |
| **@reviewer** | PR opened | Approved or detailed feedback |
| **@tester** | Post-merge validation | Consolidation test report |

See [AGENTS.md](../../AGENTS.md) for full documentation.

---

## Before Pushing PR

- [ ] Read path-scoped `.instructions.md` for my layer
- [ ] `pnpm test --run` — All tests pass
- [ ] `pnpm lint` — No violations
- [ ] `pnpm type-check` — TypeScript OK
- [ ] Commit messages link issue #N
- [ ] Branch named `feat/issue-#<N>-<description>`
- [ ] PR description explains changes

---

**Last Updated**: 2026-08-09
