# CLAUDE.md

Full-stack React/GraphQL playground for Stoke Space interview prep. Monorepo with Next.js frontend, Apollo GraphQL backend, and Express auxiliary services.

**See [DESIGN.md](./DESIGN.md) for architecture, [AGENTS.md](./AGENTS.md) for multi-agent orchestration.**

---

## Quick Start

### Prerequisites
- Docker & Docker Compose, Node.js 18+, pnpm

### Setup
```bash
pnpm install                    # Install dependencies
docker-compose up -d            # Start PostgreSQL
pnpm run migrate                # Run migrations
pnpm dev                        # Start all services
```

**Services**:
- Frontend: http://localhost:3000 (Next.js)
- GraphQL: http://localhost:4000 (Apollo + GraphiQL)
- Express: http://localhost:5000 (Files, webhooks, SSE)

---

## Commands

### Development
```bash
pnpm dev                        # All services
pnpm dev:frontend               # Next.js only
pnpm dev:graphql                # Apollo only
pnpm dev:express                # Express only
```

### Testing & Quality
```bash
pnpm test --run                 # All tests (CI mode)
pnpm test:frontend --run        # Frontend only
pnpm test:graphql --run         # GraphQL only
pnpm test:express --run         # Express only
pnpm lint && pnpm type-check    # Quality checks
```

### Database
```bash
pnpm migrate                    # Run pending migrations
pnpm migrate:reset              # Reset (dev only)
pnpm seed                       # Seed sample data
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| **DESIGN.md** | Architecture, dual-backend rationale, integration points |
| **AGENTS.md** | Multi-agent orchestration, roles, decision trees |
| **.claude/about-me.md** | Interview context, Boltline domain, themes |
| **.claude/patterns/** | Reusable pattern guides (DataLoader, auth, events, etc.) |
| **.github/instructions/** | Path-specific patterns (frontend, GraphQL, Express) |
| **docs/start-from-here.md** | 7-day interview prep roadmap |

---

## Debugging

**GraphiQL IDE**: http://localhost:4000/graphql
```graphql
query GetBuilds {
  builds(limit: 10, offset: 0) {
    id status parts { id name } testRuns { id result }
  }
}
```

**SSE Events**: `curl -N http://localhost:5000/events`

**Apollo DevTools**: Install [extension](https://www.apollographql.com/docs/react/development-testing/developer-tools/) to inspect cache.

**Express Logs**: `DEBUG=express:* pnpm dev:express`

**Database**: `psql postgres://user:pass@localhost:5432/boltline`

---

## Code Style

- **Language**: TypeScript (strict mode)
- **Formatting**: Prettier
- **Linting**: ESLint v9 (flat config)
- **Testing**: Vitest
- **Package Manager**: pnpm

---

## Path-Specific Instructions

When working on code, follow layer guides:
- **Frontend**: `.github/instructions/frontend.instructions.md`
- **GraphQL**: `.github/instructions/backend-graphql.instructions.md`
- **Express**: `.github/instructions/backend-express.instructions.md`

Each includes patterns, checklists, and debugging tips.

---

**Last Updated**: 2026-08-09
