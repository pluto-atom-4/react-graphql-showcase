# SKILLS.md

Indexed skill catalog for Stoke Full Stack React/GraphQL Playground. Maps skills to domains, responsibilities, and AI tool invocation guidelines.

---

## Skill Categories

### Frontend Development (14 skills)

| Skill | Purpose | Paths | Invocation |
|-------|---------|-------|-----------|
| **React Server Components** | Build Server/Client components with RSC pattern | `frontend/app/**` | "Implement RSC pattern" |
| **Apollo Client Setup** | Configure Apollo Client, caching, subscriptions | `frontend/lib/apollo.ts` | "Setup Apollo Client" |
| **Next.js 16 Patterns** | App Router, route handlers, middleware | `frontend/app/**` | "Build Next.js feature" |
| **React 19 Hooks** | Use hooks, custom hooks, state management | `frontend/components/**` | "Add React hook" |
| **Apollo Mutations** | Implement mutations with cache updates | `frontend/components/**` | "Add Apollo mutation" |
| **Form Handling** | Form components with validation, submission | `frontend/components/**` | "Build form component" |
| **Type-Safe Props** | TypeScript interfaces, prop validation | `frontend/**` | "Add TypeScript types" |
| **Component Testing** | Vitest, React Testing Library, mocks | `frontend/__tests__/**` | "Write component tests" |
| **Styling & CSS** | Tailwind CSS, module styles, responsive design | `frontend/**` | "Style component" |
| **SSE Integration** | WebSocket alternatives, event streaming hooks | `frontend/lib/use-sse-events.ts` | "Add SSE hook" |
| **Error Boundaries** | Error handling, fallbacks, recovery | `frontend/components/**` | "Add error boundary" |
| **Performance Optimization** | React.memo, useMemo, lazy loading | `frontend/**` | "Optimize component" |
| **Accessibility** | ARIA labels, semantic HTML, screen readers | `frontend/components/**` | "Add accessibility" |
| **Storybook Stories** | Component documentation and visual testing | `frontend/**` | "Create story" |

### GraphQL Backend (12 skills)

| Skill | Purpose | Paths | Invocation |
|-------|---------|-------|-----------|
| **GraphQL Schema Design** | SDL, types, queries, mutations, subscriptions | `backend-graphql/src/schema.graphql` | "Design GraphQL schema" |
| **Apollo Resolvers** | Query/Mutation/Field resolvers, error handling | `backend-graphql/src/resolvers/**` | "Implement resolver" |
| **DataLoader Pattern** | Batch loading, N+1 prevention, caching | `backend-graphql/src/dataloaders/**` | "Add DataLoader" |
| **Prisma ORM** | Schema modeling, migrations, queries | `backend-graphql/prisma/**` | "Create Prisma model" |
| **Database Migrations** | Schema changes, rollback, versioning | `backend-graphql/prisma/migrations/**` | "Write migration" |
| **Authentication & JWT** | Token generation, verification, claims | `backend-graphql/src/middleware/**` | "Add auth resolver" |
| **Event Emission** | Publish to event bus, real-time updates | `backend-graphql/src/resolvers/**` | "Emit domain event" |
| **Error Handling** | Custom error types, formatted responses | `backend-graphql/src/resolvers/**` | "Add error handling" |
| **GraphQL Testing** | Apollo testing utilities, query/mutation tests | `backend-graphql/__tests__/**` | "Write GraphQL test" |
| **Performance Profiling** | Query analysis, resolver timing, metrics | `backend-graphql/src/**` | "Profile GraphQL query" |
| **Subscription Logic** | Real-time subscriptions, filtering | `backend-graphql/src/resolvers/**` | "Add subscription" |
| **Middleware & Context** | Context setup, logging, tracing | `backend-graphql/src/middleware/**` | "Add middleware" |

### Express Backend (10 skills)

| Skill | Purpose | Paths | Invocation |
|-------|---------|-------|-----------|
| **File Upload Routes** | Multer configuration, file handling | `backend-express/src/routes/upload.ts` | "Add upload route" |
| **Webhook Ingestion** | POST endpoints, signature verification | `backend-express/src/routes/webhooks.ts` | "Add webhook handler" |
| **SSE Streaming** | Event broadcast, client subscription | `backend-express/src/routes/events.ts` | "Setup SSE stream" |
| **Express Middleware** | Auth, error handling, logging | `backend-express/src/middleware/**` | "Add middleware" |
| **Route Organization** | Router setup, path grouping | `backend-express/src/routes/**` | "Create route group" |
| **Request Validation** | Input sanitization, schema validation | `backend-express/src/**` | "Validate request" |
| **Error Handling** | Express error middleware, status codes | `backend-express/src/**` | "Handle errors" |
| **Express Testing** | Supertest, route testing | `backend-express/__tests__/**` | "Write route test" |
| **Environment Configuration** | Config management, secrets | `backend-express/src/**` | "Add env config" |
| **Database Integration** | Shared PostgreSQL, query utilities | `backend-express/src/**` | "Query database" |

### Testing & Quality (11 skills)

| Skill | Purpose | Paths | Invocation |
|-------|---------|-------|-----------|
| **Vitest Framework** | Unit testing, mocking, test organization | `**/__tests__/**` | "Setup test file" |
| **React Testing Library** | Component testing, user interactions | `frontend/__tests__/**` | "Write component test" |
| **Mocking & Stubs** | Mock Apollo, Express, database | `**/__tests__/**` | "Add mock" |
| **Integration Testing** | Multi-layer end-to-end flows | `docs/integration-tests/**` | "Write integration test" |
| **Test Coverage** | Coverage reports, threshold enforcement | `**/__tests__/**` | "Check coverage" |
| **Snapshot Testing** | Component snapshots, UI regression | `**/__tests__/**` | "Create snapshot" |
| **Performance Testing** | Load testing, benchmark suites | `**/__tests__/**` | "Add performance test" |
| **ESLint Configuration** | Rule setup, plugin management, flat config | `.eslintrc.mjs` | "Configure linting" |
| **TypeScript Checking** | Type validation, strict mode enforcement | `tsconfig.json` | "Type-check project" |
| **Prettier Formatting** | Code style, formatting rules | `.prettierrc` | "Format code" |
| **Pre-commit Hooks** | Git hooks, validation automation | `.husky/**` | "Setup git hook" |

### Documentation & Knowledge (8 skills)

| Skill | Purpose | Paths | Invocation |
|-------|---------|-------|-----------|
| **API Documentation** | GraphQL docs, Swagger/OpenAPI | `docs/api/**` | "Document API" |
| **Architecture Documentation** | System design, decision records | `docs/architecture/**` | "Document architecture" |
| **Pattern Library** | Reusable patterns, best practices | `.claude/patterns/**` | "Create pattern guide" |
| **Path-Scoped Instructions** | Layer-specific guidance | `.github/instructions/**` | "Write instruction" |
| **Onboarding Guides** | New developer setup, quick start | `docs/**` | "Create onboarding guide" |
| **Troubleshooting Docs** | Common issues, solutions | `docs/**` | "Document issue & fix" |
| **Video/Screen Recording** | Complex workflows, demos | `docs/**` | "Record demo" |
| **Change Logs** | Release notes, breaking changes | `CHANGELOG.md` | "Update changelog" |

### Configuration & DevOps (9 skills)

| Skill | Purpose | Paths | Invocation |
|-------|---------|-------|-----------|
| **Docker Configuration** | Dockerfile, multi-stage builds | `docker/**` | "Setup Docker" |
| **Docker Compose** | Service orchestration, networking | `docker-compose.yml` | "Configure services" |
| **PostgreSQL Setup** | Database initialization, persistence | `backend-graphql/prisma/**` | "Setup database" |
| **Environment Management** | .env, secrets, configuration | `**/.env.example` | "Configure environment" |
| **CI/CD Pipelines** | GitHub Actions, build automation | `.github/workflows/**` | "Create workflow" |
| **Git Workflow** | Branching strategy, merge rules | `docs/**` | "Document git flow" |
| **Deployment Strategy** | Blue-green, rolling updates | `docs/**` | "Plan deployment" |
| **Performance Monitoring** | Metrics, logging, observability | `docs/**` | "Setup monitoring" |
| **Security Hardening** | Secrets scanning, vulnerability scanning | `.github/**` | "Add security check" |

### AI Tool Configuration (6 skills)

| Skill | Purpose | Paths | Invocation |
|-------|---------|-------|-----------|
| **Claude Code Settings** | Model config, permissions, hooks | `.claude/settings.json` | "Configure Claude Code" |
| **Path-Scoped Permissions** | Role-based access, layer permissions | `.claude/settings.local.json` | "Add permission layer" |
| **Copilot Instructions** | Workflow rules, agent roles | `.github/copilot-instructions.md` | "Update Copilot guide" |
| **Domain Rules** | Layer-specific rules, anti-patterns | `.github/copilot/rules/**` | "Create domain rules" |
| **Agent Orchestration** | Role definitions, handoff workflows | `AGENTS.md` | "Update agent config" |
| **Skill Catalog Maintenance** | Index management, coverage tracking | `SKILLS.md` | "Update skill index" |

### Full-Stack Integration (4 skills)

| Skill | Purpose | Paths | Invocation |
|-------|---------|-------|-----------|
| **Multi-Backend Coordination** | Event bus, async messaging | `docs/integration-patterns/**` | "Design integration" |
| **Database Transactions** | ACID compliance, rollback scenarios | `backend-graphql/src/resolvers/**` | "Add transaction" |
| **Real-Time Event Flow** | SSE broadcasting, subscriptions | `docs/real-time-patterns/**` | "Implement real-time" |
| **End-to-End Workflows** | API gateway, full feature implementation | `docs/workflows/**` | "Plan workflow" |

---

## Skill Invocation By AI Tool

### Claude Code (.claude/settings.json)
**Use for**: Local development, direct file editing, debugging
- Read operations (CLAUDE.md, DESIGN.md, patterns, instructions)
- Write operations (feature implementation, tests, docs)
- Bash execution (git, pnpm, local commands)

**Recommended Skills**:
- React development, Apollo resolvers, DataLoader, testing
- Database migrations, configuration, debugging

### GitHub Copilot (Copilot Agent Mode)
**Use for**: Cross-layer orchestration, planning, coordination
- Issue intake & planning (@orchestrator)
- Multi-layer handoff (@coder → @reviewer → @tester)
- Architecture decisions, escalation

**Recommended Skills**:
- Architecture documentation, pattern library, agent orchestration
- API documentation, full-stack integration, end-to-end workflows

### Copilot CLI (Command-Line Copilot)
**Use for**: Quick file exploration, code search, explanations
- Read-only operations (grep, find, schema exploration)
- Explain code, suggest improvements, find patterns

**Recommended Skills**:
- All query-based skills (architecture docs, pattern search, knowledge)

---

## Skill Coverage By Domain

### Frontend Domain
Skills: React Server Components, Apollo Client Setup, Next.js Patterns, React 19 Hooks, Apollo Mutations, Form Handling, Type-Safe Props, Component Testing, Styling & CSS, SSE Integration, Error Boundaries, Performance Optimization, Accessibility, Storybook Stories (14 skills)

### GraphQL Backend Domain
Skills: GraphQL Schema Design, Apollo Resolvers, DataLoader Pattern, Prisma ORM, Database Migrations, Authentication & JWT, Event Emission, Error Handling, GraphQL Testing, Performance Profiling, Subscription Logic, Middleware & Context (12 skills)

### Express Backend Domain
Skills: File Upload Routes, Webhook Ingestion, SSE Streaming, Express Middleware, Route Organization, Request Validation, Error Handling, Express Testing, Environment Configuration, Database Integration (10 skills)

### Cross-Cutting Concerns
Skills: Vitest Framework, React Testing Library, Mocking & Stubs, Integration Testing, Test Coverage, Snapshot Testing, Performance Testing, ESLint Configuration, TypeScript Checking, Prettier Formatting, Pre-commit Hooks (11 skills)

### Project-Level
Skills: All documentation, configuration, DevOps, AI tool configuration, and integration skills (27 skills)

---

## Total Skill Count

- **Frontend**: 14
- **GraphQL Backend**: 12
- **Express Backend**: 10
- **Testing & Quality**: 11
- **Documentation & Knowledge**: 8
- **Configuration & DevOps**: 9
- **AI Tool Configuration**: 6
- **Full-Stack Integration**: 4

**TOTAL: 74 skills indexed**

---

## Usage Guidelines

1. **Skill Selection**: Choose skills matching current task and available tools
2. **Path-Scoped Invocation**: Refer to path column for file locations
3. **Permission Alignment**: Ensure AI tool has permissions for skill paths
4. **Documentation Integration**: Cross-reference with DESIGN.md, AGENTS.md, instructions
5. **Escalation**: When skill needs cross-layer coordination, escalate to Orchestrator

---

**Last Updated**: 2026-08-17  
**Coverage**: 74 skills across 8 categories
