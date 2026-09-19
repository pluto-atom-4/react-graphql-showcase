# CLAUDE.md

Full-stack React/GraphQL playground for Stoke Space interview prep.

**Quick Links**: [DESIGN.md](./DESIGN.md) (architecture) | [AGENTS.md](./AGENTS.md) (orchestration) | [.claude/settings.json](./.claude/settings.json) (config) | [docs/start-from-here.md](./docs/start-from-here.md) (roadmap)

## Tech Stack & Build System

**Language**: TypeScript 7.x (strict mode; native `tsc`)  
**Frontend**: React 18, Apollo Client  
**Backend**: GraphQL (Apollo Server 4), Express.js  
**Database**: PostgreSQL (via Prisma ORM)  
**Package Manager**: pnpm  
**Quality**: ESLint v9, Prettier, Vitest (unit + integration)  
**Containers**: Docker + Docker Compose

**TypeScript 7 Toolchain Note**: typescript-eslint runs on a JS-API-compatible TS 6.0 shim (`.pnpmfile.cjs` redirects it to `@typescript/typescript6@6.0.2`; remove when typescript-eslint supports TS 7). After upgrading TypeScript, re-run `pnpm --filter backend-graphql exec prisma generate` (Prisma client is keyed by TS version). TS 7 incremental cache can serve stale errors; use `--incremental false` when measuring baseline performance.

## Quick Start

```bash
pnpm install && docker-compose up -d && pnpm migrate && pnpm dev
```

**Services**: Frontend (3000) | GraphQL (4000) | Express (5000)

**Graph tooling init** (issue #360, once per clone): `code-review-graph build && graphify update .` — populates `.code-review-graph/graph.db` (AST/blast-radius) and `graphify-out/graph.json` + `GRAPH_REPORT.md` (macro architecture map). Both are gitignored and rebuild automatically on branch switch (`.husky/post-checkout`) and after edits (`PostToolUse` hook), but run this once yourself before the first session on a fresh clone.

## Commands

| Task | Command |
|------|---------|
| Dev | `pnpm dev` or `pnpm dev:{frontend,graphql,express}` |
| Test | `pnpm test --run` or `pnpm test:{frontend,graphql,express} --run` |
| Quality | `pnpm lint && pnpm type-check` |
| Database | `pnpm migrate` / `pnpm migrate:reset` / `pnpm seed` |

## Execution Modes

**Auto-Safe** (no prompt needed):
- `pnpm lint`, `pnpm type-check`, `pnpm test --run`
- `.claude/settings.json` allowlist applies

**Interactive** (always prompt):
- Destructive: `pnpm migrate:reset`, `git reset`, file deletes
- Multi-file refactors across packages
- Breaking API changes

**Claude Code**: Deep refactoring, complex reasoning, test-driven dev (local)  
**GitHub Copilot**: Real-time completions, single-file edits, inline suggestions

## Debugging

- **GraphQL**: http://localhost:4000/graphql (GraphiQL)
- **Events**: `curl -N http://localhost:5000/events` (SSE)
- **Database**: `psql postgres://user:pass@localhost:5432/boltline`
- **Express**: `DEBUG=express:* pnpm dev:express`
- **Apollo DevTools**: Browser extension

## Pre-Commit Verification

```bash
# Services running?
docker ps | grep -E "postgres|redis"

# Quality gates pass?
pnpm lint && pnpm type-check && pnpm test --run
```

**Hook** (automatic, advisory): `.claude/hooks/claude-pre-bash.sh` runs as a Claude Code `PreToolUse` hook on the Bash tool. When it detects a `git commit`, it type-checks *only the staged* `.ts`/`.tsx` files and prints any errors. It **never blocks the commit** — it exits 1 (warn) at worst, never 2 (deny), and fails open on any infrastructure problem. Every invocation is logged to `.claude/hooks/.gate.log` (gitignored) as `timestamp | command | decision | reason`.

It only gates commits made *through Claude Code's Bash tool*; a commit from a terminal or IDE bypasses it entirely. Real enforcement belongs in CI (#9). Config: `.claude/settings.json` → `hooks.PreToolUse`. Tests: `bash .claude/hooks/__tests__/claude-pre-bash.test.sh`.

## AI Tool Configuration

| Tool | Type | Purpose | Config | Test |
|------|------|---------|--------|------|
| `code-review-graph` (PyPI `code-review-graph`, v2.3.8) | Global + project MCP server | Low-level AST / blast-radius graph; `query`/`impact`/`detect-changes` for structural dependency analysis (issue #360) | Registered in `~/.claude/settings.json` (global) and `.mcp.json` (project, `cwd`-pinned); database at `.code-review-graph/graph.db` | `.code-review-graph/.gitignore` handles self-exclusion; init with `code-review-graph build` |
| `graphify` / `graphify-mcp` (PyPI `graphifyy`) | Global + project MCP server | High-level architecture map + multi-modal docs context; macro assessment before deep dives (issue #360) | Registered in `~/.claude/settings.json` (global) and `.mcp.json` (project); output at `graphify-out/graph.json` + `GRAPH_REPORT.md` | Gitignored (`graphify-out/`); init with `graphify update .` |
| `.husky/post-checkout` | Git hook | Auto-rebuild both graphs on branch changes (non-fatal) | Runs via Husky (`core.hooksPath=.husky/_`); guarded by tool availability checks | Excluded from quality gates (infra/tooling) |
| `.husky/pre-commit` | Git hook | `code-review-graph update` + `detect-changes --brief` before commit (non-fatal, never blocks) | Runs via Husky | Excluded from quality gates (infra/tooling) |
| `.claude/hooks/graph-review-advisory.sh` | PreToolUse advisory | Suggests checking `graphify-out/GRAPH_REPORT.md` / `graphify query` before wide Grep/Glob scans (issue #357, retargeted to graphify in #360) | Wired to `.claude/settings.json` → `hooks.PreToolUse` with matcher `Grep\|Glob` | `bash .claude/hooks/__tests__/graph-review-advisory.test.sh` |
| `.claude/hooks/code-review-graph-update.sh` | PostToolUse advisory | Incremental `code-review-graph update --skip-flows` after every Edit/Write, so structural queries stay fresh mid-session (issue #360) | Wired to `.claude/settings.json` → `hooks.PostToolUse` with matcher `Edit\|Write` | `bash .claude/hooks/__tests__/code-review-graph-update.test.sh` |
| `.claude/hooks/code-review-graph-status.sh` | SessionStart advisory | Prints `code-review-graph status` (node/edge counts, last build, branch) when a session opens (issue #360) | Wired to `.claude/settings.json` → `hooks.SessionStart` | `bash .claude/hooks/__tests__/code-review-graph-status.test.sh` |

### Graph Intelligence Routing

Two-phase workflow for the architect agent, replacing expensive Grep/Glob fan-out with structured graph navigation:

1. **Macro (graphify)** — "where is X?", "explain the design", architecture overview. Check `graphify-out/GRAPH_REPORT.md` first, or `graphify query`/`graphify explain`, or the `graphify-mcp` MCP tools (`query_graph`, `get_node`, `get_neighbors`, `get_community`, `shortest_path`, `god_nodes`, `graph_stats`).
2. **Micro (code-review-graph)** — "what breaks if I change X?", "find all callers of Y", blast-radius before implementing. Use `code-review-graph query {callers_of|callees_of|imports_of|tests_for}`, `code-review-graph impact --files <paths>`, `code-review-graph detect-changes --brief`, or the MCP server (`code-review-graph serve`).

Fallback if a graph tool errors or returns empty: narrow, targeted `Grep`/`Glob` on the specific file and its immediate imports — never both engines at once, and never a repo-wide scan without checking the graph first.

## Considered and Declined for Issue #357 (superseded by #360)

The following were evaluated for #357 but intentionally not added at the time to keep scope tight; issue #360 later added graphify and reversed the code-review-graph decision (see rows above):

- **Graphify** (PyPI `graphify-cli`): declined for #357 as an unrelated package with no real install path; the real package is `graphifyy` (PyPI), added in #360.
- **Base `code-review-graph` tool**: declined for #357 in favor of the `better-code-review-graph` fork; #360 reversed this — the original `code-review-graph` (tirth8205, v2.3.8) has a larger, actively-maintained CLI (29 subcommands) with its own `install`/git-hook flow, and `better-code-review-graph` is no longer used in this repo.
- **`cc-start` alias**: still no alias convention established in this repo; can be added per-user if desired (`alias cc-start="code-review-graph update && graphify update . && claude"`).
- **`CRG_DATABASE_PATH` env var**: does not exist in `code-review-graph`'s source; the real override is `--data-dir` / `CRG_DATA_DIR`, not needed for standard workflows.

## Session Persistence Pattern

**On session close**: Append non-obvious insights to this file to preserve context for the next session. This is a manual convention, not an automated script.

Example: if debugging revealed a subtle TypeScript pattern, document it here so next Claude Code session inherits the discovery.

---

**Last Updated**: 2026-09-19 (Issue #362: TypeScript 7.0.2 + .pnpmfile.cjs compat shim for typescript-eslint)
