# Shared Instructions (Monorepo)

**Applies to**: Monorepo configuration, build, test, lint, package management

---

## 🎯 Key Patterns

### pnpm Workspace Commands
```bash
# Development (all layers)
pnpm dev                           # Start all services
pnpm dev:frontend                  # Next.js only
pnpm dev:graphql                   # Apollo only
pnpm dev:express                   # Express only

# Testing & Quality
pnpm test --run                    # All tests (CI mode)
pnpm lint                          # ESLint all layers
pnpm type-check                    # TypeScript strict mode

# Building
pnpm build                         # Build all
pnpm start                         # Production servers

# Layer-specific
pnpm -F frontend test --run        # Frontend only
pnpm -F backend-graphql lint       # GraphQL only
pnpm -F backend-express type-check # Express only
```

---

## 📋 Monorepo Checklist

When adding cross-layer feature:

- [ ] Frontend: Server/Client Components + Apollo queries/mutations
- [ ] GraphQL: Schema + Resolvers + DataLoader + Event emission
- [ ] Express: Routes (uploads/webhooks) + SSE if needed
- [ ] Quality Checks:
  - [ ] `pnpm test --run` — All tests pass
  - [ ] `pnpm lint` — No violations
  - [ ] `pnpm type-check` — TypeScript OK
- [ ] Integration Tests:
  - [ ] Frontend → GraphQL works
  - [ ] GraphQL → Express events work
  - [ ] Express → Frontend SSE works
- [ ] PR: Reference all layers + logs

---

## 🔧 Common Tasks

### Add Dependency
```bash
pnpm -F frontend add package          # Layer-specific
pnpm add -W -D eslint prettier        # Root (shared tools)
```

### Layer-Specific Linting
```bash
pnpm lint                # All layers
pnpm -F frontend lint    # Frontend only
pnpm lint:fix            # Auto-fix all
```

### TypeScript Checking
```bash
pnpm type-check          # All layers
pnpm -F frontend type-check
```

---

## 🐛 Troubleshooting

### "Module not found" in tests
```bash
pnpm install             # Reinstall all
pnpm list                # Check versions
```

### "Conflicting dependency versions"
```bash
pnpm list package-name   # Check all layers
pnpm -F frontend add package@version  # Align versions
```

### "TypeScript errors in IDE but tests pass"
Ensure IDE points to root `tsconfig.json`

---

## 📖 Key Files

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Workspace config |
| `package.json` (root) | Root scripts |
| `tsconfig.json` (root) | Shared TypeScript config |
| `eslint.config.js` | ESLint v9 flat config |

---

## 🔗 Integration Points

- Frontend → GraphQL: Apollo Client queries/mutations
- GraphQL → Express: HTTP POST events
- Express → Frontend: Server-Sent Events
- All → PostgreSQL: Shared database

---

**Last Updated**: 2026-08-09
