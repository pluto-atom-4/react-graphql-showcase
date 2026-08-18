# Workflow Rules

Rules for feature branch workflow, pull requests, testing, and merge procedures.

---

## Golden Rule: One Issue → One Branch → One PR

This is the foundation of all other rules.

```
GitHub Issue #N Created
    ↓
Create feature branch: git checkout -b feat/issue-#N-description
    ↓
Implement on THIS branch (never create new branches for feedback)
    ↓
All feedback fixes go to THIS branch via new commits
    ↓
Force push if rebasing: git push -f origin feat/issue-#N-description
    ↓
Merge when approved (GitHub deletes branch)
```

**Why?**:
- Keeps history clean (one feature = one branch)
- Reviewers see progression (all commits on one branch)
- Feedback loop is fast (no branch switching)
- CI/CD runs once per branch (cheaper, faster)

---

## Feature Branch Naming Convention

### Format
```
feat/issue-#<N>-<short-description>
```

### Examples
✅ **Good**:
- `feat/issue-#123-add-build-status`
- `feat/issue-#456-implement-dataloader`
- `feat/issue-#789-file-upload-validation`

❌ **Bad**:
- `feature/my-feature` (missing issue number)
- `issue-123-add-status` (missing `feat/` prefix)
- `feat/issue-#123-this-is-a-very-long-description-that-exceeds-50-chars-and-is-hard-to-read` (too long)
- `fix/issue-#123-bug-fix` (use `feat/` for features, `fix/` for bugfixes on main)

### Branch Lifecycle
```
1. CREATE: git checkout -b feat/issue-#123-description
2. PUSH: git push -u origin feat/issue-#123-description
3. CREATE PR: Open on GitHub
4. FEEDBACK LOOP: git push origin feat/issue-#123-description (reuse -u)
5. APPROVE: GitHub marks as approved
6. MERGE: Squash/rebase merge to main
7. DELETE: GitHub auto-deletes branch
```

---

## Commit Message Format

### Pattern
```
<type>(<issue-number>): <subject>

<body (optional)>

<footer (optional)>
```

### Type Options
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code refactoring (no feature/bug change)
- `test`: Test-only changes
- `chore`: Dependency updates, config changes

### Subject Line Rules
- ✅ **DO**: Start with lowercase letter
- ✅ **DO**: Keep < 50 characters (fit in GitHub log)
- ✅ **DO**: Use imperative mood ("add feature", not "added feature")
- ✅ **DO**: Include issue number
- ❌ **DON'T**: End with period
- ❌ **DON'T**: Capitalize first letter

### Examples

✅ **Good**:
```bash
git commit -m "feat(#123): add build status field to schema"
git commit -m "fix(#456): prevent N+1 queries with dataloader"
git commit -m "docs(#789): update frontend pattern guide"
```

❌ **Bad**:
```bash
git commit -m "Added build status"            # No issue number
git commit -m "feat(#123): Add build status." # Capitalized, ends with period
git commit -m "feat(#123): This is a very long commit message that exceeds the recommended 50 character limit and will be hard to read in the log" # Too long
```

### Multi-Commit Workflow
Each logical change gets its own commit (one commit per 200-300 lines of code):

```bash
# Commit 1: Add schema change
git add backend-graphql/src/schema.graphql
git commit -m "feat(#123): add status field to build schema"

# Commit 2: Add resolver
git add backend-graphql/src/resolvers/Build.ts
git commit -m "feat(#123): implement updateStatus mutation"

# Commit 3: Add tests
git add backend-graphql/__tests__/
git commit -m "test(#123): add resolver tests for status update"
```

**Reviewer sees progression**: Schema → Implementation → Tests (easy to review)

---

## Pull Request Workflow

### Creating a PR

**1. Ensure code is ready**:
```bash
pnpm test --run        # All tests pass
pnpm lint              # No linting violations
pnpm type-check        # TypeScript OK
git log --oneline -5   # Review commits
```

**2. Push to remote**:
```bash
git push origin feat/issue-#<N>-description
```

**3. Create PR on GitHub**:
- Title: `feat(#<N>): Add feature description` (same as commit message)
- Description: Use template below
- Reviewers: Request @reviewer
- Labels: Add relevant labels

### PR Description Template

```markdown
## Issue
Fixes #<N>

## Description
One-sentence summary of what this PR does.

Longer explanation if needed:
- What was changed
- Why it was changed
- How it works

## Changes
- [ ] Frontend changes (list specific files/components)
- [ ] GraphQL changes (list resolvers/schema changes)
- [ ] Express changes (list routes/middleware changes)
- [ ] Database changes (new migrations)
- [ ] Documentation changes

## Testing
- Manual: Tested [specific scenarios] locally
- Automated: All tests pass (45 frontend, 32 graphql, 18 express)
- Coverage: [coverage metrics if applicable]

## Checklist
- [x] All tests pass: `pnpm test --run`
- [x] No lint violations: `pnpm lint`
- [x] TypeScript OK: `pnpm type-check`
- [x] Branch named correctly: `feat/issue-#<N>-description`
- [x] Commit messages clear and link to #N
- [x] Documentation updated (CLAUDE.md, README, etc.)
- [x] No breaking changes (or documented breaking changes)
```

### During Review

**If feedback requested**:
```bash
# Fix issues in code
vim frontend/components/BuildList.tsx

# Test again
pnpm test --run && pnpm lint && pnpm type-check

# Commit to SAME branch (new commit, not amend)
git add .
git commit -m "fix(#<N>): Address review feedback on component"

# Push to SAME branch (simple push, no -u)
git push origin feat/issue-#<N>-description
```

**Don't**:
- ❌ Create new branch for feedback (`feat/issue-#<N>-v2`)
- ❌ Amend commits (modifies history, confuses review flow)
- ❌ Merge main into branch (use rebase instead)

**If rebasing needed**:
```bash
# Rebase on latest main
git fetch origin main
git rebase origin/main

# Resolve conflicts
vim [conflicted files]
git add .
git rebase --continue

# Force push to same branch (only if rebasing)
git push -f origin feat/issue-#<N>-description
```

### Approval & Merge

**When approved**:
1. Reviewer comments "Ready to merge" or approves
2. All automated checks pass (GitHub Actions)
3. No merge conflicts
4. At least one approval (typically @reviewer)

**Merge strategy**:
- Use "Squash and merge" (keep main history clean)
- Or "Rebase and merge" (preserve commits if logical story)
- Avoid "Create a merge commit" (creates noise in main history)

**After merge**:
- GitHub auto-deletes branch
- Feature is now on main
- Notify @tester for consolidation testing

---

## Testing Requirements

### Pre-Commit Testing (Before Every Commit)
```bash
pnpm test --run    # 95 tests total (all layers)
pnpm lint          # ESLint, Prettier
pnpm type-check    # TypeScript strict mode
```

**Requirement**: All must pass before committing

### Pre-Push Testing (Before git push)
```bash
pnpm test --run              # Re-run to be sure
pnpm test --coverage         # Check coverage
pnpm lint && pnpm type-check # Final quality check
```

**Coverage Targets**:
- Frontend: 80% (components, hooks)
- GraphQL: 85% (resolvers, services)
- Express: 85% (routes, middleware)
- Utils/Lib: 95% (utility functions)

### Pre-PR Testing (Before creating PR)
```bash
# Fresh pull and test
git pull origin main
pnpm install
pnpm test --run
pnpm lint
pnpm type-check

# Test locally with all services
pnpm dev  # In one terminal
# Test manual workflows (open browser, create build, etc.)
```

### Test Layer-Specifically
```bash
pnpm test:frontend --run     # Frontend only
pnpm test:graphql --run      # GraphQL only
pnpm test:express --run      # Express only
```

### Coverage Report
```bash
pnpm test --run --coverage   # Generate HTML report
# Open coverage/index.html in browser
```

---

## Quality Gate Checklist

**All items must pass before PR is approved**:

- [ ] **Functionality**
  - [ ] Feature works as intended
  - [ ] Happy path tested
  - [ ] Error cases handled

- [ ] **Tests**
  - [ ] All tests pass: `pnpm test --run`
  - [ ] Coverage meets target (80%+ frontend, 85%+ backend)
  - [ ] No skipped tests (`it.skip`, `describe.skip`)
  - [ ] Snapshot tests only where appropriate

- [ ] **Code Quality**
  - [ ] No lint violations: `pnpm lint`
  - [ ] No TypeScript errors: `pnpm type-check`
  - [ ] No unused variables/imports
  - [ ] Clear function/variable names

- [ ] **Architecture Patterns**
  - [ ] Frontend: Server/Client component separation, Apollo caching
  - [ ] GraphQL: DataLoaders for nested queries, event emission from mutations
  - [ ] Express: Proper middleware chain, error handling
  - [ ] Database: Transactions for multi-step operations

- [ ] **Performance**
  - [ ] No N+1 queries (if backend-graphql changes)
  - [ ] No unnecessary re-renders (if frontend changes)
  - [ ] No memory leaks
  - [ ] Reasonable load time (< 3 seconds page load)

- [ ] **Documentation**
  - [ ] Code comments for complex logic
  - [ ] CLAUDE.md updated if commands/setup changed
  - [ ] README.md updated if architecture changed
  - [ ] Layer instructions updated if patterns changed

- [ ] **Commits & History**
  - [ ] Branch named correctly: `feat/issue-#<N>-description`
  - [ ] Commit messages clear and link to #N
  - [ ] Commit history logical (one commit per logical change)
  - [ ] No merge commits (use rebase)

- [ ] **PR Metadata**
  - [ ] PR title links to issue: `feat(#<N>): description`
  - [ ] PR description explains changes
  - [ ] Reviewers requested
  - [ ] Labels added (bug, feature, documentation, etc.)

- [ ] **Cross-Cutting Concerns**
  - [ ] Security: No credentials in code
  - [ ] Accessibility: Semantic HTML, ARIA labels (if frontend)
  - [ ] Backwards compatibility: Breaking changes documented
  - [ ] Internationalization: Use i18n if text (if applicable)

---

## Failed Check Resolution

### Test Failure

**If `pnpm test --run` fails**:
```bash
# 1. Review error message
# 2. Fix test or code
# 3. Run specific test file
pnpm test --run path/to/test.test.ts
# 4. Re-run full suite
pnpm test --run
# 5. Commit fix
git commit -m "fix(#<N>): Fix test failure in [component]"
```

### Lint Failure

**If `pnpm lint` fails**:
```bash
# 1. Auto-fix what you can
pnpm lint:fix
# 2. Manually fix remaining issues
vim [files with lint errors]
# 3. Verify fixed
pnpm lint
# 4. Commit
git commit -m "fix(#<N>): Address lint violations"
```

### Type Check Failure

**If `pnpm type-check` fails**:
```bash
# 1. Review type error
# 2. Fix type annotation or implementation
vim [file with type error]
# 3. Verify fixed
pnpm type-check
# 4. Commit
git commit -m "fix(#<N>): Resolve TypeScript error in [file]"
```

### Performance Regression

**If performance degrades**:
```bash
# 1. Identify bottleneck
DEBUG=apollo:* pnpm dev:graphql  # For GraphQL
# 2. Profile queries/renders
pnpm test --run --coverage       # Check coverage
# 3. Optimize (cache, DataLoader, memoization, etc.)
# 4. Verify improvement
# 5. Commit optimization
git commit -m "perf(#<N>): Optimize [component/resolver]"
```

---

## Merge Conflict Resolution

### If Main Has Changed
```bash
# 1. Fetch latest main
git fetch origin main

# 2. Rebase on main (preferred over merge)
git rebase origin/main

# 3. Resolve conflicts
#    Git will show conflicts in files
vim [conflicted files]

# 4. Mark as resolved
git add [resolved files]

# 5. Continue rebase
git rebase --continue

# 6. Force push to branch
git push -f origin feat/issue-#<N>-description

# 7. Verify CI passes on GitHub
```

**Don't merge main into branch** (adds unnecessary merge commit)

---

## Deployment & Release

### Pre-Release Checklist
- [ ] All features merged to main
- [ ] All consolidation tests pass
- [ ] Performance benchmarks OK
- [ ] Documentation complete
- [ ] Changelog updated
- [ ] Version number bumped
- [ ] Rollback plan documented

### Release Process
```bash
# 1. Tag version
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3

# 2. Build for production
pnpm build
pnpm build:express
pnpm build:graphql

# 3. Deploy with monitoring
# (Follow deployment playbook)

# 4. Monitor for issues
# (Watch error logs, performance metrics)

# 5. If critical issue found: Create hotfix, deploy, release patch
```

---

## Related Documentation

- **See**: `AGENTS.md` (agent roles and responsibilities)
- **See**: `.github/copilot/rules/agents.rules.md` (agent handoff protocol)
- **See**: `SKILLS.md` (skill-based task allocation)

---

**Last Updated**: 2026-08-17  
**Key Principle**: One issue → one branch → one PR (keeps history clean and review simple)  
**Quick Check**: `pnpm test --run && pnpm lint && pnpm type-check` before every commit
