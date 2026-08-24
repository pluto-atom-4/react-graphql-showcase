# CLAUDE.md

Full-stack React/GraphQL playground for Stoke Space interview prep. **See [DESIGN.md](./DESIGN.md) for architecture, [AGENTS.md](./AGENTS.md) for orchestration.**

---

## Quick Start

**Prerequisites**: Docker, Docker Compose, Node.js 18+, pnpm

```bash
pnpm install && docker-compose up -d && pnpm migrate && pnpm dev
```

**Services**: Frontend (3000), GraphQL (4000), Express (5000)

---

## Commands

| Task | Command |
|------|---------|
| **Develop** | `pnpm dev` / `pnpm dev:frontend` / `pnpm dev:graphql` / `pnpm dev:express` |
| **Test** | `pnpm test --run` / `pnpm test:{frontend,graphql,express} --run` |
| **Quality** | `pnpm lint && pnpm type-check` |
| **Database** | `pnpm migrate` / `pnpm migrate:reset` / `pnpm seed` |

---

## Documentation

| Doc | Purpose |
|-----|---------|
| **DESIGN.md** | Dual-backend architecture, integration patterns |
| **AGENTS.md** | Multi-agent roles, handoff workflows |
| **.claude/patterns/** | Reusable guides (DataLoader, auth, events) |
| **.github/instructions/** | Frontend, GraphQL, Express-specific patterns |
| **docs/start-from-here.md** | 7-day interview prep roadmap |

---

## Code Style

**Stack**: TypeScript (strict), Prettier, ESLint v9, Vitest, pnpm

---

## Debugging

- **GraphQL**: http://localhost:4000/graphql (GraphiQL)
- **Events**: `curl -N http://localhost:5000/events` (SSE)
- **Database**: `psql postgres://user:pass@localhost:5432/boltline`
- **Express Logs**: `DEBUG=express:* pnpm dev:express`
- **Apollo DevTools**: Browser extension to inspect cache

---

## Verify First: Quick Health Check

Before committing or pushing, run these verification checks:

```bash
# ✓ Services running
docker ps | grep -E "postgres|redis"

# ✓ Frontend responding
curl -s http://localhost:3000/health

# ✓ GraphQL responding
curl -s http://localhost:4000/graphql

# ✓ Express responding
curl -s http://localhost:5000/events

# ✓ Quality gates
pnpm lint && pnpm type-check && pnpm test --run
```

**Pre-commit hook** (automatic): `.claude/hooks/pre-commit.sh` runs linting, type-check, tests before commit. See `.claude/settings.json` → `devHooks.preCommit`.

---

**Last Updated**: 2026-08-23
