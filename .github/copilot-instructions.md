# 🚀 GitHub Copilot - Project Workflow & Instructions

**Repository**: Stoke Full Stack React/GraphQL Showcase  
**Last Updated**: 2026-05-19  
**Pattern**: Official GitHub Hybrid (root + path-specific instructions)

---

## 📂 Quick Navigation

### Core Workflow
- **Main Instructions**: This file provides the high-level workflow overview
- **Agent Roles**: See `.github/copilot/agents/` for specialized agent configurations (orchestrator, developer, reviewer, tester)
- **Comprehensive Workflow**: See `.github/instructions/workflow-phases.instructions.md` for 30-phase workflow detail
- **Detailed Rules**: See `.copilot/rules.json` for legacy implementation steps

### Path-Specific Guidance
For detailed instructions matching your file location, see:

- **Frontend** (`frontend/**`): [frontend.instructions.md](instructions/frontend.instructions.md) — Next.js, React, Apollo Client, Tailwind
- **GraphQL Backend** (`backend-graphql/**`): [backend-graphql.instructions.md](instructions/backend-graphql.instructions.md) — Apollo Server, resolvers, DataLoader
- **Express Backend** (`backend-express/**`): [backend-express.instructions.md](instructions/backend-express.instructions.md) — File uploads, webhooks, SSE
- **Monorepo Shared** (`**/*.{json,yml,md}`): [shared.instructions.md](instructions/shared.instructions.md) — Build, test, lint, package management

---

## 🎯 Core Principles

### One Issue = One Branch = One PR
- Feature branch: `feat/issue-#<N>-<description>`
- Single PR per issue, auto-updates with feedback fixes
- All fixes go to EXISTING feature branch (NO new branches)
- Result: Clean merge history, no complex rebasing

### Multi-Agent Orchestration
- **Orchestrator**: Analyzes requirements, creates execution plans, delegates work
- **Developer**: Implements features and feedback fixes on feature branches
- **Reviewer**: Examines PRs, provides detailed feedback, approves when ready
- **Tester**: Runs consolidation tests, validates merged code

Agents work in sequence within phases but phases run in parallel across issues.

---

## 🔧 Quick Workflow

**Phase 1: Planning** → @orchestrator creates execution plan  
**Phase 3A: Implementation** → @developer implements on feature branch  
**Phase 3B: Review** → @reviewer examines PR  
**Phase 3C: Feedback Fixes** → @developer fixes using EXISTING branch  
**Phase 4: Consolidation** → @reviewer + @tester validate  
**Phase 5: Merge** → GitHub Actions merges to main

---

## 📚 Reference

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Root workflow instructions (official GitHub pattern) |
| `.github/copilot/agents/` | Orchestrator, Developer, Reviewer, Tester, Quality-Assurance, Product-Manager agent configurations |
| `.copilot/rules.json` | Detailed implementation steps (23+ phases) |
| `docs/implementation-planning/` | Execution plans and PR registry |

---

## 🆘 Getting Started

1. **Read the path-specific instruction** for your current work (frontend, backend-graphql, etc.)
2. **Invoke the appropriate agent**: `@orchestrator`, `@developer`, `@reviewer`, `@tester`
3. **Follow the workflow phases** in sequence
4. **Reference detailed rules** in `.copilot/rules.json` if needed

---

**For full workflow details, see the path-specific `.github/instructions/*.md` files or agent configurations in `.github/copilot/agents/`.**
