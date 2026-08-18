# Permission Layers Rules

Rules for permission management, access control, and tool-specific configuration.

---

## Global Permission Layer (.claude/settings.json)

**Scope**: Applies to Claude Code globally on this project

### Global Allowlist
- ✅ **DO**: Whitelist specific patterns (not wildcard everything)
- ✅ **DO**: Add permissions incrementally (test before enabling)
- ✅ **DO**: Review permissions quarterly
- ✅ **DO**: Document WHY each permission is needed
- ❌ **DON'T**: Use `*` wildcard (too permissive)
- ❌ **DON'T**: Grant permissions you don't need

**Current Global Permissions** (Claude Code):
```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm *)",           // Package management
      "Bash(git *)",            // Version control
      "Bash(grep *)",           // Code search
      "Bash(find *)",           // File search
      "Bash(wc *)",             // Line counting
      "Read(CLAUDE.md)",        // Documentation
      "Read(DESIGN.md)",        // Architecture
      "Read(AGENTS.md)",        // Agent orchestration
      "Read(.github/instructions/**)",
      "Read(.claude/patterns/**)",
      "Read(backend-graphql/src/schema.graphql)",
      "Read(.claude/about-me.md)",
      "Read(.claude/settings.json)",
      "Edit(**/.instructions.md)",
      "Edit(DESIGN.md)",        // Architecture docs
      "Edit(CLAUDE.md)"         // Quick start
    ]
  }
}
```

---

## Path-Scoped Permission Layer (.claude/settings.local.json)

**Scope**: Applies per directory path, overrides global

### Frontend Scope
```json
{
  "pathScopes": {
    "frontend/**": {
      "permissions": {
        "allow": [
          "Read(frontend/**)",
          "Edit(frontend/**/*.{ts,tsx,css})",
          "Bash(pnpm -F frontend *)"
        ]
      },
      "model": "claude-haiku-4-5-20251001"
    }
  }
}
```

**Includes**:
- Read: All frontend files
- Edit: TypeScript, TSX, CSS files
- Bash: Frontend-scoped pnpm commands
- Model: Haiku (fast, sufficient for frontend)

### GraphQL Backend Scope
```json
{
  "pathScopes": {
    "backend-graphql/**": {
      "permissions": {
        "allow": [
          "Read(backend-graphql/**)",
          "Edit(backend-graphql/**/*.{ts,graphql})",
          "Bash(pnpm -F backend-graphql *)"
        ]
      },
      "model": "claude-haiku-4-5-20251001"
    }
  }
}
```

**Includes**:
- Read: All GraphQL backend files
- Edit: TypeScript and GraphQL files
- Bash: GraphQL-scoped pnpm commands
- Model: Haiku

### Express Backend Scope
```json
{
  "pathScopes": {
    "backend-express/**": {
      "permissions": {
        "allow": [
          "Read(backend-express/**)",
          "Edit(backend-express/**/*.ts)",
          "Bash(pnpm -F backend-express *)"
        ]
      },
      "model": "claude-haiku-4-5-20251001"
    }
  }
}
```

**Includes**:
- Read: All Express backend files
- Edit: TypeScript files
- Bash: Express-scoped pnpm commands
- Model: Haiku

### Pattern & Instruction Scopes
```json
{
  "pathScopes": {
    ".claude/patterns/**": {
      "permissions": {
        "allow": [
          "Read(.claude/patterns/**)",
          "Edit(.claude/patterns/**/*.md)"
        ]
      }
    },
    ".github/instructions/**": {
      "permissions": {
        "allow": [
          "Read(.github/instructions/**)",
          "Edit(.github/instructions/**/*.md)"
        ]
      }
    }
  }
}
```

---

## Role-Based Permission Tiers (Planned)

### Tier 1: Read-Only (Viewer)
**Can**: Read all documentation, patterns, instructions

```json
{
  "permissions": {
    "allow": [
      "Read(CLAUDE.md)",
      "Read(DESIGN.md)",
      "Read(AGENTS.md)",
      "Read(.claude/patterns/**)",
      "Read(.github/instructions/**)"
    ]
  }
}
```

**Use Case**: New team members, external reviewers, stakeholders

### Tier 2: Developer (Coder)
**Can**: Read all docs + Edit layer code + Run tests

```json
{
  "permissions": {
    "allow": [
      "Read(**)",                    // Read everything
      "Edit(frontend/**)",
      "Edit(backend-graphql/**)",
      "Edit(backend-express/**)",
      "Bash(pnpm *)",
      "Bash(git *)"
    ]
  }
}
```

**Use Case**: Feature implementation, bug fixes

### Tier 3: Architect (Orchestrator)
**Can**: Everything + Edit architecture docs

```json
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Edit(**)",                    // Edit anything
      "Bash(*)"
    ]
  }
}
```

**Use Case**: Planning, cross-layer coordination, docs updates

---

## Skill-Based Permissions (Future)

Each skill requires specific permissions:

```json
{
  "skills": {
    "React Server Components": {
      "requiredPermissions": [
        "Read(frontend/**)",
        "Edit(frontend/app/**/*.tsx)"
      ],
      "recommendedPath": "frontend/"
    },
    "GraphQL Schema Design": {
      "requiredPermissions": [
        "Read(backend-graphql/src/schema.graphql)",
        "Edit(backend-graphql/src/schema.graphql)",
        "Bash(pnpm -F backend-graphql *)"
      ],
      "recommendedPath": "backend-graphql/"
    },
    "DataLoader Pattern": {
      "requiredPermissions": [
        "Read(backend-graphql/src/dataloaders/**)",
        "Edit(backend-graphql/src/dataloaders/**)"
      ],
      "recommendedPath": "backend-graphql/src/dataloaders/"
    }
  }
}
```

---

## AI Tool-Specific Permissions

### Claude Code Permissions
**Local Development**:
- Full read/write on assigned layer
- Full bash access for testing
- Can create branches, commit, push
- Interactive debugging

**Recommended Configuration**:
```json
{
  "model": "claude-haiku-4-5-20251001",
  "permissions": {
    "allow": [
      "Bash(pnpm *)",
      "Bash(git *)",
      "Read(frontend/**)",
      "Edit(frontend/**)"
    ]
  }
}
```

### GitHub Copilot Permissions
**AI-Assisted Coding** (IDE):
- Read code in current file
- Suggest completions
- Generate tests
- Explain code

**Recommended Configuration**:
```json
{
  "model": "claude-opus",  // Better reasoning
  "permissions": {
    "allow": [
      "Read(DESIGN.md)",
      "Read(.claude/patterns/**)",
      "Read(frontend/**)"
    ]
  }
}
```

### Copilot Agent Mode Permissions
**Planning & Orchestration**:
- Read all documentation
- Analyze issues
- Create plans
- Coordinate multi-layer changes

**Recommended Configuration**:
```json
{
  "model": "claude-opus",  // Better for planning
  "permissions": {
    "allow": [
      "Read(**)",
      "Edit(docs/implementation-planning/**)"
    ]
  }
}
```

---

## Permission Inheritance Rules

### Resolution Order (First Match Wins)
1. **Path-Scoped** (highest priority): `frontend/**`, `backend-graphql/**`, etc.
2. **Global** (fallback): Default permissions in `.claude/settings.json`
3. **Denied** (implicit): Anything not in allowlist

### Example: Access `/frontend/components/BuildList.tsx`
```
Is path in "frontend/**"? YES → Use path-scoped permissions
Can edit "frontend/**/*.{ts,tsx,css}"? YES → Allow
Result: ✅ Allowed
```

### Example: Access `/backend-graphql/schema.graphql`
```
Is path in "backend-graphql/**"? YES → Use path-scoped permissions
Can edit "backend-graphql/**/*.{ts,graphql}"? YES → Allow
Result: ✅ Allowed
```

### Example: Access `/DESIGN.md`
```
Is path in path-scoped? NO → Use global permissions
Can edit "DESIGN.md"? YES (global allowlist)
Result: ✅ Allowed
```

### Example: Access `/backend-express/src/server.ts` from frontend scope
```
Is path in "frontend/**"? NO → Use global permissions
Can edit "backend-express/**"? NO (not in global or frontend)
Result: ❌ Denied (requires backend-express scope or global permission)
```

---

## Adding New Permissions

### Process
1. **Identify Need**: What tool/path needs permission?
2. **Assess Scope**: Is it temporary or permanent?
3. **Choose Layer**: Global or path-scoped?
4. **Add Minimally**: Only what's needed (not overly broad)
5. **Test**: Verify permission works
6. **Document**: Add comment explaining WHY
7. **Review**: Include in PR for team review

### Example: Add Permission for Database Admin

```json
{
  "permissions": {
    "allow": [
      "Bash(docker exec boltline_postgres *)",
      "Bash(psql postgres://user:pass@localhost:5432/boltline)"
    ]
  }
}
```

**Rationale**: Need to inspect database for debugging

---

## Permission Audit

### Quarterly Review Checklist
- ✅ Are all permissions still necessary?
- ✅ Are there overly broad patterns?
- ✅ Do path-scoped permissions match actual team structure?
- ✅ Are there unused permissions?
- ✅ Does documentation explain WHY each exists?

### Removing Permissions
1. **Verify**: Confirm it's no longer needed
2. **Notify**: Tell team before removing
3. **Remove**: Delete from allowlist
4. **Test**: Confirm tool denies access
5. **Document**: Note removal reason and date

---

## Security Best Practices

### Do's
- ✅ **DO**: Use allowlist (whitelist, not blacklist)
- ✅ **DO**: Keep permissions minimal
- ✅ **DO**: Review permissions regularly
- ✅ **DO**: Document reasoning for each permission
- ✅ **DO**: Use path-scoping to limit access
- ✅ **DO**: Require re-authentication for sensitive operations

### Don'ts
- ❌ **DON'T**: Use wildcard permissions (`*`)
- ❌ **DON'T**: Grant more permission than needed
- ❌ **DON'T**: Share API keys in settings (use environment variables)
- ❌ **DON'T**: Store secrets in JSON (use `.env.local`)
- ❌ **DON'T**: Commit personal access tokens to git

### Secrets Management
- Store in `.env.local` (gitignored)
- Reference from `.env.example` (template only)
- Use environment variables, not hardcoded values
- Rotate credentials quarterly

---

## Related Documentation

- **See**: `.claude/settings.json` (global configuration)
- **See**: `.claude/settings.local.json` (path-scoped configuration)
- **See**: `SKILLS.md` (skill-based permission mapping)

---

**Last Updated**: 2026-08-17  
**Key Concept**: Minimal allowlist, path-scoped inheritance, regular audit  
**Principle**: Grant only what's needed, review quarterly, document reasoning
