# Claude Code Configuration Guide

This directory contains Claude Code CLI configuration and patterns for the React/GraphQL playground project.

---

## Directory Structure

```
.claude/
├── settings.json               # Workspace configuration (primary)
├── README.md                   # This file
├── hooks/
│   └── pre-commit.sh          # Pre-commit verification hook
├── patterns/                   # Reusable implementation patterns
│   ├── dataloaders-pattern.md
│   ├── auth-patterns.md
│   ├── event-emission-pattern.md
│   ├── server-client-components-pattern.md
│   ├── backend-integration-pattern.md
│   ├── security-patterns.md
│   ├── search-filter-patterns.md
│   └── README.md
└── about-me.md                # Optional: Personal context (user-specific)
```

---

## Configuration Files

### settings.json (Primary)

**Location**: `.claude/settings.json`  
**Purpose**: Claude Code CLI workspace configuration  
**Scope**: Local development only (not shared across machines)

**Key Sections**:

1. **Model Configuration**:
   - Base model: `claude-haiku-4-5-20251001` (fast, cost-effective)
   - Path scopes for context-aware model selection:
     - Frontend, backend-graphql, backend-express: Opus 5 (complex reasoning)
     - Tests: Opus 5 (verification)
     - Docs: Haiku (simple)

2. **Path Scopes**:
   ```json
   "pathScopes": {
     "frontend": {
       "pattern": "frontend/**",
       "model": "claude-opus-5",
       "reasoning": "enabled"
     },
     ...
   }
   ```
   Automatically selects model and reasoning based on file being edited.

3. **Dev Hooks**:
   ```json
   "devHooks": {
     "preCommit": {
       "script": ".claude/hooks/pre-commit.sh",
       "checks": ["pnpm lint", "pnpm type-check", "pnpm test --run"],
       "failBehavior": "block"
     }
   }
   ```
   Runs verification before commit (blocks if checks fail).

4. **Skills Configuration**:
   ```json
   "skills": {
     "autoLoad": ["caveman:cavecrew-builder", "code-review", "simplify"],
     "contextual": {
       "frontend/**": ["example-skills:frontend-design"],
       "docs/**": ["artifact-design"]
     }
   }
   ```
   Conditionally loads skills based on context.

5. **Permissions**:
   - Allows: `pnpm`, `git`, `docker`, `curl`, `grep`, `find`, etc.
   - Denies: Unsafe operations (`rm -rf`, `sudo`, `passwd`, `chmod 000`)

### .github/copilot/settings.json (Companion)

**Location**: `.github/copilot/settings.json`  
**Purpose**: GitHub Copilot CLI and IDE configuration  
**Scope**: GitHub authenticated (can be shared)

**Key Differences from .claude/settings.json**:
- Separate IDE vs CLI model configuration
- Role-based path scopes (developer, reviewer, orchestrator, tester)
- Authoritative for GitHub Copilot interactions
- Agent configuration (orchestrator, developer, reviewer, tester, etc.)

**Tool Isolation**:
| Tool | Config | Scope | Use Case |
|------|--------|-------|----------|
| Claude Code CLI | `.claude/settings.json` | Local | Deep reasoning, test-driven development |
| GitHub Copilot IDE | `.github/copilot/settings.json` | IDE authenticated | Real-time completions, inline suggestions |
| GitHub Copilot CLI | `.github/copilot/settings.json` | CLI authenticated | Planning, orchestration, PR feedback |

---

## Development Workflow

### 1. Start Claude Code CLI

```bash
# In terminal, within project root
claude code
# (or use VS Code extension / IDE integration)
```

### 2. Verify Workspace Configuration

Claude Code automatically loads `.claude/settings.json`:
- ✅ Path scopes active (different models for frontend vs backend)
- ✅ Dev hooks ready (pre-commit verification)
- ✅ Skills loaded (caveman, code-review, simplify)
- ✅ Permissions configured (pnpm, git, docker allowed)

### 3. Work on Code

When you edit files:
- **Frontend files**: Opus 5 + reasoning enabled (complex UI logic)
- **GraphQL resolvers**: Opus 5 + reasoning (query optimization)
- **Documentation**: Haiku (simple, cost-effective)

### 4. Before Commit

Pre-commit hook runs automatically (or manually):

```bash
# Automatic (if configured as pre-commit hook)
git commit -m "feat(#123): add feature"
# .claude/hooks/pre-commit.sh runs → lint, type-check, tests

# Manual verification
./.claude/hooks/pre-commit.sh
```

---

## Pattern Usage

All reusable patterns are in `.claude/patterns/`:

**When implementing a feature**:
1. Read relevant pattern guide: `dataloaders-pattern.md`, `auth-patterns.md`, etc.
2. Follow the pattern exactly (copy-paste template)
3. Run verification checks from the pattern (bash commands, tests)
4. Reference the pattern in your PR description

**Example**:
> "Implemented DataLoader batch loading for Build → Parts relationship per `.claude/patterns/dataloaders-pattern.md`. Verified with batch tests (single query vs N queries)."

---

## Model Selection Strategy

**How path scopes work**:
1. You edit `frontend/components/BuildList.tsx`
2. `.claude/settings.json` pathScopes matches `frontend/**`
3. Claude Code switches to `claude-opus-5` model
4. Reasoning enabled for complex component logic
5. Timeout increased to 180s (complex reasoning takes longer)

**Cost implications**:
- Opus 5 (complex tasks): More expensive, better reasoning
- Haiku (simple tasks): Cheaper, fast responses
- Auto-switching reduces overall cost while maintaining quality

---

## Verification First

**Pre-commit checks** (automatic via `.claude/hooks/pre-commit.sh`):

```bash
# 1. Linting
pnpm lint --max-warnings=0
# Enforces code style, catches common errors

# 2. Type checking
pnpm type-check
# Ensures TypeScript strict mode compliance

# 3. Unit & integration tests
pnpm test --run
# Verifies functionality and no regressions
```

**See**: `CLAUDE.md` → "Verify First: Quick Health Check" for service verification  
**See**: `DESIGN.md` → "Verify First: Architectural Compliance" for pattern verification

---

## Troubleshooting

### Settings not loading
- Verify `.claude/settings.json` syntax (JSON validation)
- Reload Claude Code: `/clear` or restart IDE

### Path scopes not switching models
- Check pattern matches file path
- Path must match exactly (e.g., `frontend/**` for files in `frontend/` dir)
- Reload workspace configuration

### Pre-commit hook failing
- Run manually: `./.claude/hooks/pre-commit.sh`
- Check output for which check failed (lint, type-check, or tests)
- Fix errors and retry

### Permissions denied
- Check `.claude/settings.json` → `permissions.allow` list
- Add new command to allowlist if needed
- Reload Claude Code

---

## Key Files to Understand

| File | Purpose | When to Update |
|------|---------|-----------------|
| **settings.json** | Model, hooks, skills, permissions | When adding tools/models |
| **.github/copilot/settings.json** | Copilot config (companion) | When agent roles change |
| **hooks/pre-commit.sh** | Pre-commit verification | When quality gates change |
| **patterns/*.md** | Reusable guides | When implementing new patterns |
| **about-me.md** | Personal context (optional) | When joining project |

---

## Integration with Other Tools

### Claude Code CLI ↔ GitHub Copilot IDE

- **Claude Code**: Deep reasoning, refactoring, multi-file changes
- **GitHub Copilot IDE**: Quick completions, inline suggestions, documentation

**Best Practice**:
- Use Claude Code for planning and architecture decisions
- Use Copilot IDE for real-time assistance while coding
- Use Copilot CLI for PR feedback and orchestration

### With AGENTS.md

See [AGENTS.md](../AGENTS.md) for when to invoke each agent (Architect, Orchestrator, Developer, etc.).

Claude Code configuration aligns with agent responsibilities:
- **Architect** uses deep reasoning (Opus 5, enabled)
- **Developer** uses path scopes for context
- **Reviewer** uses code-review skill

---

## Updating Configuration

**When to update `.claude/settings.json`**:
- Adding new development tool (bash command)
- Changing model preferences
- Adding new path scope (new layer or pattern)
- Modifying verification hooks

**Review process**:
1. Edit `.claude/settings.json`
2. Validate JSON syntax
3. Reload Claude Code: `/clear` or restart
4. Test with sample file from each path scope
5. Commit: `feat(#N): update Claude Code config for X`

---

**Last Updated**: 2026-08-23  
**Configuration Version**: 1.0+ (Issue #336 Phase 5)  
**Related**: [DESIGN.md](../DESIGN.md), [AGENTS.md](../AGENTS.md), [.github/copilot-instructions.md](../.github/copilot-instructions.md)
