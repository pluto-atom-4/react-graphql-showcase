# CLAUDE.md

Full-stack React/GraphQL playground for Stoke Space interview prep. Monorepo with Next.js frontend, Apollo GraphQL backend, and Express auxiliary services.

**See [DESIGN.md](./DESIGN.md) for architecture, [AGENTS.md](./AGENTS.md) for multi-agent orchestration, [.claude/about-me.md](./.claude/about-me.md) for interview context.**

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- pnpm

### Initial Setup
```bash
pnpm install                    # Install dependencies
docker-compose up -d            # Start PostgreSQL
pnpm run migrate                # Run migrations
pnpm dev                        # Start all services
```

**Services**:
- **Frontend**: http://localhost:3000 (Next.js)
- **GraphQL**: http://localhost:4000 (Apollo Server + GraphiQL)
- **Express**: http://localhost:5000 (File uploads, webhooks, SSE)

---

## Common Development Tasks

### Running
```bash
pnpm dev                        # Start all services
pnpm dev:frontend               # Next.js only (port 3000)
pnpm dev:graphql                # Apollo only (port 4000)
pnpm dev:express                # Express only (port 5000)
```

### Testing
```bash
pnpm test                       # Run all tests
pnpm test:frontend --run        # Frontend only (CI mode)
pnpm test:graphql --run         # GraphQL resolvers
pnpm test:express --run         # Express routes
pnpm test --watch               # Watch mode
```

### Quality Checks
```bash
pnpm lint                       # ESLint check (all packages)
pnpm lint:fix                   # Auto-fix issues
pnpm type-check                 # TypeScript strict mode
pnpm format:check               # Prettier compliance
```

### Database
```bash
pnpm migrate                    # Run pending migrations
pnpm migrate:reset              # Reset (dev only)
pnpm seed                       # Seed sample data
pnpm build && pnpm start        # Production build + start
```

**Test isolation**: Frontend uses global setup in `frontend/__tests__/setup/` for localStorage mocking and cleanup. See `frontend/__tests__/setup/README.md` for details.

---

## Key Files

| File | Purpose |
|------|---------|
| `DESIGN.md` | Architecture, three-layer pattern, integration points |
| `AGENTS.md` | Multi-agent orchestration, agent roles, handoff flows |
| `.claude/about-me.md` | Interview context, Boltline domain, talking points |
| `.github/instructions/frontend.instructions.md` | Frontend-specific patterns & workflows |
| `.github/instructions/backend-graphql.instructions.md` | GraphQL patterns, DataLoader, event emission |
| `.github/instructions/backend-express.instructions.md` | Express patterns, file upload, webhook handlers |
| `docs/start-from-here.md` | 7-day interview prep roadmap |
| `backend-graphql/src/schema.graphql` | GraphQL types (Build, Part, TestRun) |
| `frontend/app/page.tsx` | Root Server Component |
| `frontend/lib/apollo.ts` | Apollo Client configuration |

---

## Debugging Tips

**GraphiQL IDE**: Visit `http://localhost:4000/graphql` to test queries/mutations interactively.

```graphql
query GetBuild($id: ID!) {
  build(id: $id) {
    id status parts { id name } testRuns { id result completedAt }
  }
}
```

**Apollo DevTools**: Install [browser extension](https://www.apollographql.com/docs/react/development-testing/developer-tools/) to inspect cache and network.

**Real-Time Events**: 
```bash
curl -N http://localhost:5000/events              # Listen to SSE stream
curl -X POST http://localhost:4000/graphql ...    # Trigger mutation in another terminal
```

**Express Logging**:
```bash
DEBUG=express:* pnpm dev:express
```

**Database**: 
```bash
psql postgres://user:pass@localhost:5432/boltline
\dt                     # List tables
SELECT * FROM builds;   # Query data
```

---

## Code Style

- **Language**: TypeScript (strict mode)
- **Formatting**: Prettier (auto-format recommended)
- **Linting**: ESLint v9 (flat config in `eslint.config.js`)
- **Testing**: Vitest (unit/integration)
- **Package Manager**: pnpm

**ESLint**: See `docs/ESLINT-V9-SETUP-GUIDE.md` for detailed setup and troubleshooting.

```bash
pnpm lint               # Check all packages
pnpm -F frontend lint   # Lint only frontend
```

---

## Project-Specific Skills

### push-feature-branch
Automates complete workflow: git status → create branch → stage → commit → push.

```
@claude Create a feature branch for [task description]
```

See `.claude/skills/push-feature-branch/SKILL.md` for full details.

---

## Path-Specific Instructions

When working on code, follow layer-specific patterns:

- **Frontend work**: See `.github/instructions/frontend.instructions.md` for Next.js, React, Apollo Client patterns
- **GraphQL work**: See `.github/instructions/backend-graphql.instructions.md` for resolvers, DataLoader, event emission
- **Express work**: See `.github/instructions/backend-express.instructions.md` for file uploads, webhooks, SSE

Each file includes patterns, checklists, common tasks, and debugging tips.

---

**Last Updated**: August 2, 2026  
**Multi-Agent Pattern**: See AGENTS.md for orchestrator → developer → reviewer → tester workflows
