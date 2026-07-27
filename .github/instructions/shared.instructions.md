# Shared Instructions (`**/*.{json,yml,md}`)

**Applies to**: Monorepo configuration, build, test, lint, package management  
**Tech Stack**: pnpm workspaces, Vitest, ESLint v9, Prettier, TypeScript  
**Pattern Type**: Cross-layer coordination, build pipeline, quality gates

---

## 🎯 Key Patterns

### Monorepo Structure
```
react-graphql-showcase/          ← Root
├── pnpm-workspace.yaml            ← pnpm workspaces config
├── package.json                   ← Root scripts (dev, test, lint, build)
├── frontend/                      ← Layer 1 (Next.js)
│   └── package.json               ← Frontend-specific deps
├── backend-graphql/               ← Layer 2 (Apollo GraphQL)
│   └── package.json               ← GraphQL-specific deps
├── backend-express/               ← Layer 3 (Express)
│   └── package.json               ← Express-specific deps
└── .github/
    └── copilot-instructions.md    ← This file points here
```

### pnpm Workspace Scripts
```bash
# Development (all layers)
pnpm dev                           # Start all 3 services (frontend 3000, Apollo 4000, Express 5000)
pnpm dev:frontend                  # Start only frontend
pnpm dev:graphql                   # Start only Apollo GraphQL
pnpm dev:express                   # Start only Express

# Testing (all layers)
pnpm test                          # Run all tests
pnpm test --run                    # CI mode (no watch)
pnpm test:frontend                 # Test only frontend
pnpm test:graphql                  # Test only GraphQL
pnpm test:express                  # Test only Express

# Quality checks (all layers)
pnpm lint                          # ESLint across all packages
pnpm format:check                  # Prettier check
pnpm type-check                    # TypeScript strict mode check

# Building
pnpm build                         # Build all packages
pnpm start                         # Start production build
```

### Layer-Specific Commands
```bash
# Run commands in specific layer
pnpm -F frontend test --run
pnpm -F backend-graphql lint
pnpm -F backend-express type-check
```

### Building for Production
```bash
pnpm build                         # Build frontend + backends
pnpm start                         # Start production servers
```

---

## 📋 Implementation Checklist

When adding a new cross-layer feature:

- [ ] **Frontend Implementation**
  - [ ] Server/Client Components in `frontend/`
  - [ ] Apollo queries/mutations
  - [ ] Real-time event subscription
- [ ] **GraphQL Implementation**
  - [ ] Schema update in `backend-graphql/src/schema.graphql`
  - [ ] Resolvers in `backend-graphql/src/resolvers/`
  - [ ] DataLoader for nested relationships
  - [ ] Event emission after mutations
- [ ] **Express Implementation** (if applicable)
  - [ ] Routes for file uploads/webhooks in `backend-express/src/routes/`
  - [ ] SSE integration in `backend-express/src/routes/events.ts`
- [ ] **Quality Checks** (automated per Issue #306):
  - [ ] `pnpm test --run` — All tests pass (all layers)
  - [ ] `pnpm lint` — No ESLint violations
  - [ ] `pnpm format:check` — All files formatted
  - [ ] `pnpm type-check` — TypeScript strict compliance
  - [ ] Capture logs to `docs/dev-note/issue-#[N]-pnpm-*.txt`
- [ ] **Integration Test**
  - [ ] Frontend → GraphQL communication works
  - [ ] GraphQL → Express event emission works
  - [ ] Express → Frontend SSE broadcast works
- [ ] **PR**: Reference all layers modified + log captures

---

## 🔧 Common Monorepo Tasks

### Adding a New Dependency
```bash
# Add to specific layer
pnpm -F frontend add axios
pnpm -F backend-graphql add apollo-server
pnpm -F backend-express add multer

# Add to root (dev dependency shared by all)
pnpm add -D eslint prettier -W
```

### Running Tests for Specific Layer
```bash
pnpm -F frontend test --run
pnpm -F backend-graphql test --run
pnpm -F backend-express test --run

# Or run all with single run
pnpm test --run
```

### Linting Specific Layer
```bash
# Entire monorepo
pnpm lint

# Specific layer
pnpm -F frontend lint
pnpm -F backend-graphql lint

# Auto-fix
pnpm lint:fix
pnpm -F frontend lint:fix
```

### Type-Checking
```bash
# All layers
pnpm type-check

# Specific layer
pnpm -F frontend type-check
pnpm -F backend-graphql type-check
```

### Building
```bash
# Build all
pnpm build

# Build specific layer
pnpm -F frontend build
```

---

## 🐛 Debugging Monorepo Issues

### "Module not found" in tests
- **Problem**: Monorepo dependency not installed or wrong version
- **Solution**: 
  ```bash
  pnpm install    # Reinstall all dependencies
  pnpm list       # List all installed packages
  ```

### "ESLint rule not working"
- **Problem**: ESLint config not updated or restarted
- **Solution**:
  ```bash
  # Exit current session
  exit
  
  # Restart and retry
  pnpm lint
  ```

### "TypeScript errors in IDE but tests pass"
- **Problem**: IDE using different tsconfig.json
- **Solution**: Ensure IDE points to root `tsconfig.json`

### "Conflicting versions between layers"
- **Problem**: Frontend and GraphQL use different Apollo Client versions
- **Solution**: 
  ```bash
  # Check versions
  pnpm list apollo-client
  
  # Update to consistent version
  pnpm -F frontend add apollo-client@4.10.0
  pnpm -F backend-graphql add apollo-client@4.10.0
  ```

---

## 📖 Key Files

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Workspace configuration (defines packages) |
| `package.json` (root) | Root scripts for dev, test, lint, build |
| `pnpm-lock.yaml` | Dependency lock file (committed to git) |
| `tsconfig.json` (root) | Shared TypeScript configuration |
| `eslint.config.js` (root) | ESLint v9 configuration (flat config) |
| `.prettierrc.json` (root) | Prettier formatting rules |
| `docs/dev-note/README.md` | Log management guide + Issue #306 automation |

---

## 🔗 Integration Points

### Frontend → GraphQL
- Apollo Client queries/mutations to Apollo Server on port 4000
- Apollo Client caches results locally

### GraphQL → Express
- GraphQL mutations emit events via HTTP POST to Express
- `EXPRESS_EVENT_URL=http://localhost:5000/events/emit` (configurable)

### Express → Frontend
- Frontend subscribes to SSE: `new EventSource("http://localhost:5000/events")`
- Express broadcasts real-time events to all connected clients

### All Layers → Quality Checks
- `pnpm test --run` runs all layer tests
- `pnpm lint` lints all layers
- `pnpm format:check` checks formatting in all layers
- Logs captured to `docs/dev-note/` for Issue #306 automation

---

## ✅ Quality Gate (Issue #306 Automation)

All quality checks run **without user confirmation** across all layers:

```bash
# Single command runs all checks on all layers
pnpm test --run                    # Frontend + GraphQL + Express tests
pnpm lint                          # All ESLint violations across layers
pnpm format:check                  # All Prettier format checks
pnpm type-check                    # All TypeScript strict mode

# Capture logs to docs/dev-note/ with naming convention:
# Format: issue-#[ISSUE-NUMBER]-pnpm-[SCRIPT-NAME].txt

# Examples (following Issue #306 convention):
issue-#306-pnpm-test.txt           # Full test suite output
issue-#306-pnpm-test-frontend.txt  # Frontend layer tests only
issue-#306-pnpm-test-graphql.txt   # GraphQL layer tests only
issue-#306-pnpm-test-express.txt   # Express layer tests only
issue-#306-pnpm-lint.txt           # Linting output
issue-#306-pnpm-format-check.txt   # Format validation output
issue-#306-pnpm-type-check.txt     # TypeScript check output

# If any check fails:
- Fix issues in appropriate layer
- Re-run quality checks
- Save output with Issue number + script name
- Orchestrator validates before merge
```

---

## 🚀 CI/CD Integration

### Pre-Push Validation
Developers must run quality checks before pushing:

```bash
pnpm test --run     # All tests must pass
pnpm lint           # No ESLint errors
pnpm format:check   # No formatting issues
pnpm type-check     # No TypeScript errors
```

### GitHub Actions (if configured)
Automatically runs same checks on PR and merge:
- Runs `pnpm test --run` on all layers
- Runs `pnpm lint` on all code
- Runs `pnpm type-check` for strict TypeScript
- Fails if any check fails

---

## 📚 Documentation

### For New Features
1. Update README.md with feature overview
2. Add examples in DESIGN.md if architectural impact
3. Document in CLAUDE.md if technology stack change
4. Log any quality check outputs to `docs/dev-note/`

### For Bugs/Issues
1. Create GitHub issue with reproduction steps
2. Reference in PR description
3. Add comment linking PR to issue: "Fixes #123"

---

## 🆘 Emergency Procedures

### "I broke the entire monorepo"
```bash
# 1. Reset to last known good state
git reset --hard origin/main

# 2. Reinstall all dependencies
pnpm install

# 3. Run tests to verify
pnpm test --run
```

### "Dependencies are corrupted"
```bash
# 1. Delete lock file and cache
rm pnpm-lock.yaml
pnpm store prune

# 2. Reinstall
pnpm install

# 3. Verify
pnpm test --run
```

### "I need to update all dependencies"
```bash
# 1. Check for updates
pnpm up --interactive --latest

# 2. Run tests after updates
pnpm test --run

# 3. Fix any incompatibilities
pnpm lint:fix
pnpm type-check

# 4. Commit
git commit -m "chore: update dependencies"
```

---

## 🔐 Best Practices

1. **Always run quality checks before pushing**: `pnpm test --run && pnpm lint && pnpm format:check && pnpm type-check`
2. **Use layer-specific commands**: `pnpm -F <layer> <command>` for targeted work
3. **Keep root dependencies minimal**: Only shared dev tools (ESLint, Prettier, TypeScript)
4. **Commit lock file**: `pnpm-lock.yaml` ensures reproducible installs
5. **Test cross-layer integration**: Frontend → GraphQL → Express flow must work end-to-end

---

**Last Updated**: 2026-05-19  
**Pattern**: GitHub Official (path-specific instruction file with `applyTo` glob)
