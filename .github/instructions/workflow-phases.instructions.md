# 🚀 GitHub Copilot CLI - Project Workflow Instructions

⚠️ **DEPRECATED**: This file has been migrated to follow the official GitHub Copilot instructions pattern.

**Please use the new location instead:**
- **Root Instructions**: `.github/copilot-instructions.md`
- **Agent Configurations**: `.github/copilot/agents/`
- **Layer-Specific Guidance**: `.github/instructions/`

For backwards compatibility, the detailed content below is preserved. New files and updates should use the official GitHub pattern files above.

---

# 🚀 GitHub Copilot CLI - Project Workflow Instructions

**Last Updated**: 2026-05-10  
**Scope**: Multi-agent orchestration, PR feedback cycles, feature implementation  
**Repository**: Stoke Full Stack React/GraphQL Showcase

---

## 🎯 Core Principles

### One Issue = One Branch = One PR

- **Feature Branch**: `feat/issue-#<N>-<description>` (created at project start)
- **PR Number**: Single PR per issue, auto-updates with feedback fixes
- **Feedback Handling**: All fixes go to the EXISTING feature branch (NO new branches)
- **Result**: Clean merge history, no complex rebasing

### Multi-Agent Orchestration

The orchestrator agent coordinates specialized agents:
- **Orchestrator**: Analyzes requirements, creates execution plans, delegates work
- **Developer**: Implements features and feedback fixes on feature branches
- **Reviewer**: Examines PRs, provides detailed feedback, approves when ready
- **Tester**: Runs consolidation tests, validates merged code
- **Product Manager**: Validates alignment with business requirements (optional)

Agents work in sequence within phases but phases run in parallel across issues.

---

## 📋 Workflow Phases

### Phase 1: Planning
**Who**: Orchestrator  
**Input**: GitHub issues, execution plan requirements  
**Output**: Execution plan with PR registry, multi-agent delegation strategy  
**Key Task**: Identify which issues can be parallelized

### Phase 2: Delegation
**Who**: Orchestrator  
**Input**: Execution plan with multi-agent delegation  
**Output**: Feature branches created, developers assigned  
**Key Commands**:
```bash
git branch feat/issue-#<N>-<description> origin/main
git push -u origin feat/issue-#<N>-<description>
```

### Phase 3A: Initial Implementation
**Who**: Developer agents  
**Input**: Issue requirements, execution plan  
**Output**: Feature implemented on feature branch, PR created  
**Steps**:
1. Switch to feature branch: `git switch feat/issue-#<N>-...`
2. Implement based on execution plan
3. Track files: `git status`, `git diff`
4. Commit atomically: `git commit -m "feat(#N): ..."`
5. Push: `git push origin feat/issue-#<N>-...`
6. Create PR: `gh pr create --title "..." --body "..."`

### Phase 3B: Reviewer Examines PR
**Who**: Reviewer agent  
**Input**: PR #<N> with implementation  
**Output**: Detailed findings document with issues and severity levels  
**Key Actions**:
- Review code against project standards
- Test functionality
- Document findings with specific file/line references
- Comment on PR with feedback

### Phase 3C: Developer Handles Feedback
**Who**: Developer agent  
**Input**: Reviewer feedback on PR #<N>  
**Output**: Fixes applied to EXISTING feature branch, pushed  
**Critical Rule**: 🔴 **REUSE EXISTING feature branch - DO NOT create new branch**

**Steps (from rules.json steps 11-23)**:

**Step 1: Identify Feature Branch**
```bash
gh pr view <PR-NUMBER> --json headRefName
# Output: feat/issue-#35-add-skeleton-loading (example)
```

**Step 2: Switch to Existing Branch**
```bash
git switch feat/issue-#35-add-skeleton-loading
# ✅ CORRECT: Use existing branch
# ❌ WRONG: Create new branch like fix/pull-request-245-skeleton
```

**Step 3: Implement Fixes**
- Edit only files mentioned in reviewer feedback
- Don't refactor unrelated code
- Don't introduce new features

**Step 4: Stage Feedback Fixes**
```bash
git add [file1.tsx] [file2.ts]
git diff --cached  # Verify before committing
```

**Step 5: Commit**
```bash
git commit -m "fix(#<N>): Address review feedback

- Fixed [specific item 1]
- Fixed [specific item 2]

Co-Authored-By: @reviewer-name"
```
**Type**: Use `fix` (not `feat`, not `refactor`)

**Step 6: Push to Same Branch**
```bash
git push origin feat/issue-#<N>-add-skeleton-loading
# ✅ Push to SAME branch - PR auto-updates
# ❌ DO NOT create new PR
```

### Phase 3D: PR Auto-Updates
**Who**: GitHub (automatic)  
**Input**: New commits on feature branch  
**Output**: PR #<N> shows updated commits, reviewer notified  
**Note**: No manual action needed - GitHub handles this automatically

### Phase 3E: Reviewer Re-Reviews
**Who**: Reviewer agent  
**Input**: Updated PR #<N> with feedback fixes  
**Output**: Either approved or more feedback  
**Loop Condition**:
- If all feedback addressed → Approve (move to Phase 3F)
- If more fixes needed → Provide feedback, loop back to Phase 3C

### Phase 3F: Approval & Ready for Consolidation
**Who**: Orchestrator + Reviewer  
**Input**: PR approved  
**Output**: PR marked as consolidation-ready  
**Preconditions**: All feedback cycles complete, all code reviewed and approved

### Phase 4: Consolidation
**Who**: Reviewer agent + Tester  
**Input**: All approved PRs (from phases 3A-3F)  
**Output**: work/phase-<N>-consolidation branch with all features merged, tests passing  
**Key Steps**:
1. Create consolidation branch: `git branch work/phase-<N>-consolidation origin/main`
2. Merge all approved feature branches into consolidation branch
3. Run full test suite: `pnpm test`
4. Fix any consolidation issues (dependency conflicts, test failures)
5. Update execution plan with consolidation status
6. Clean up: `git branch -d work/phase-<N>-consolidation` (after merge to main)

### Phase 5: Merge
**Who**: GitHub Actions (automated)  
**Input**: Consolidated feature branches ready to merge  
**Output**: Features merged to main, GitHub Actions runs final tests  
**Command** (automatic):
```bash
gh pr merge --squash --delete-branch
```

---

## 🔧 Developer Workflow: Handling PR Feedback

When you receive feedback on PR #<N>:

### Quick Reference (13 Steps)

1. **Get PR number** from reviewer's feedback comment
2. **Identify feature branch**: `gh pr view <PR> --json headRefName`
3. **Check current branch**: `git branch`
4. **Switch to existing branch**: `git switch feat/issue-#<N>-...`
5. **Implement fixes** based on reviewer feedback
6. **List changed files**: `git status`
7. **Stage fix files**: `git add [file1] [file2]`
8. **Verify staging**: `git diff --cached`
9. **Commit with issue reference**: `git commit -m "fix(#<N>): ..."`
10. **Push to same branch**: `git push origin feat/issue-#<N>-...`
11. **Verify push**: `git branch -v`
12. **Wait**: Reviewer re-reviews
13. **Loop or Approve**: Feedback resolved or more fixes needed?

### Critical Reminders

❌ **DO NOT**:
- Create new branch for fixes: `git branch fix/pull-request-245-...`
- Create new PR for feedback fixes
- Use `git add .` or `git add -A` (must track specific files)
- Refactor unrelated code during feedback cycle

✅ **DO**:
- Reuse feature branch from step 2
- Identify exact branch with `gh pr view`
- Stage only feedback-related files
- Verify with `git diff --cached` before commit
- Push to same branch (PR auto-updates)
- Document fixes in execution plan

---

## ✅ Automated Code Quality Workflows (Issue #306)

### Commands Run Without User Confirmation

All agents are **explicitly authorized** to run these commands automatically during all phases:

**Root-Level Commands (entire monorepo):**
```bash
pnpm test --run              # All tests (no watch mode, exit after completion)
pnpm lint                    # ESLint check across all packages
pnpm format:check            # Prettier format validation
pnpm type-check              # TypeScript strict mode check
```

**Layer-Specific Commands (when optimizing for speed):**
```bash
pnpm test:frontend --run     # Frontend unit/integration tests
pnpm test:graphql --run      # GraphQL resolver tests
pnpm test:express --run      # Express route/handler tests
pnpm test:integration        # Frontend + GraphQL integration tests
pnpm test:e2e                # End-to-end tests (full stack)
```

### When Agents Run Quality Checks

**Phase 3A (Initial Implementation)**:
- ✅ Developer runs layer-specific tests AFTER implementing features
- ✅ Developer runs full suite `pnpm test --run` BEFORE creating PR
- ✅ If checks pass: Proceed to create PR
- ✅ If checks fail: Fix issues and re-run (don't push)

**Phase 3C (Feedback Fixes)**:
- ✅ Developer runs checks AFTER implementing feedback
- ✅ If checks pass: Push to existing feature branch
- ✅ If checks fail: Fix and re-run (don't push)

**Phase 4 (Consolidation)**:
- ✅ Tester runs `pnpm test --run` on consolidation branch
- ✅ Tester runs `pnpm lint` and `pnpm type-check` to verify no regressions
- ✅ If all pass: Consolidation ready for merge
- ✅ If any fail: Tester documents failures, orchestrator escalates

### Output Capture & Log Storage

**Log Naming Convention:**
```
docs/dev-note/issue-#[ISSUE-NUMBER]-pnpm-[SCRIPT-NAME].txt
```

**Examples:**
```
docs/dev-note/issue-#306-pnpm-test.txt           # Full test suite
docs/dev-note/issue-#306-pnpm-test-frontend.txt  # Frontend layer tests
docs/dev-note/issue-#306-pnpm-test-graphql.txt   # GraphQL layer tests
docs/dev-note/issue-#306-pnpm-test-express.txt   # Express layer tests
docs/dev-note/issue-#306-pnpm-lint.txt           # Linting output
docs/dev-note/issue-#306-pnpm-format-check.txt   # Format validation
docs/dev-note/issue-#306-pnpm-type-check.txt     # TypeScript check
```

**Key Benefit**: One log file per (issue, script) pair. Each new run replaces the previous log, maintaining a single current record per combination.

### Error Handling & Failure Escalation

**If Checks Fail:**

1. **For Developer (Phase 3A/3C)**:
   - ❌ Do NOT create/push PR if tests fail
   - Fix issues locally and re-run layer-specific tests
   - Run full suite `pnpm test --run` before final push
   - Only push after all checks pass

2. **For Tester (Phase 4)**:
   - ❌ Do NOT merge consolidation if tests fail
   - Document failures in log with specific errors
   - Escalate to orchestrator with log reference
   - Orchestrator decides: fix issues or open blocker issue

3. **For Reviewer**:
   - Reference quality check logs in PR comments
   - Use log as evidence for code quality approval

### Agent-Specific Quality Workflows

**Developer Agent (Phase 3A)**:
```bash
# During implementation (layer-specific):
pnpm test:frontend --run > docs/dev-note/issue-#306-pnpm-test-frontend.txt 2>&1
pnpm test:graphql --run > docs/dev-note/issue-#306-pnpm-test-graphql.txt 2>&1
pnpm test:express --run > docs/dev-note/issue-#306-pnpm-test-express.txt 2>&1

# Before PR (full suite):
pnpm test --run > docs/dev-note/issue-#306-pnpm-test.txt 2>&1
pnpm lint > docs/dev-note/issue-#306-pnpm-lint.txt 2>&1
pnpm format:check > docs/dev-note/issue-#306-pnpm-format-check.txt 2>&1
pnpm type-check > docs/dev-note/issue-#306-pnpm-type-check.txt 2>&1

# If all pass: Create PR
# If fail: Fix and re-run (new output replaces old log)
```

**Tester Agent (Phase 4)**:
```bash
# During consolidation:
pnpm test --run > docs/dev-note/issue-#306-pnpm-test.txt 2>&1
pnpm lint > docs/dev-note/issue-#306-pnpm-lint.txt 2>&1
pnpm type-check > docs/dev-note/issue-#306-pnpm-type-check.txt 2>&1

# Check logs, escalate if failed
```

**Reviewer Agent**:
```bash
# Reference logs in PR reviews:
# "See quality check logs: docs/dev-note/issue-#306-pnpm-test.txt"
# "All checks passed: ✅"
```

**Orchestrator Agent**:
```bash
# Reference logs in execution plans and PR comments
# Use logs to track quality metrics across phases
# Escalate failures to developer for resolution
```

### How to Reference Logs in PRs

When creating/updating PRs, include:

```markdown
## Quality Checks ✅

Quality checks executed automatically:
- Tests: PASS
- Lint: PASS
- Format: PASS
- Type Check: PASS

See logs: `docs/dev-note/issue-#306-pnpm-*.txt`
```

If any check fails:

```markdown
## Quality Checks ⚠️

Failed checks (see logs for details):
- Tests: FAIL — [see `issue-#306-pnpm-test.txt`]
- Lint: PASS
- Format: PASS
- Type Check: PASS

Logs: `docs/dev-note/issue-#306-pnpm-*.txt`
```

### Log Management Policy

**How Logs Are Stored:**
- Each (issue, script) combination has one current log file
- When a quality check runs for the same issue/script pair, the new output replaces the old file
- This maintains a single, current record for each check type per issue
- No manual cleanup required—the filename scheme naturally maintains one log per combination

**Log Lifecycle:**
- Created: First time a quality check runs for an issue/script
- Updated: Every subsequent run for that issue/script overwrites the file
- Referenced: In PR descriptions and code review comments
- Maintained: Single current log per (issue, script) combination

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `.github/copilot/agents/` | Agent definitions (orchestrator, developer, reviewer, tester, product-manager) |
| `.github/copilot/settings.json` | GitHub Copilot CLI settings and configuration |
| `.github/copilot/quick-references/PR_FEEDBACK_QUICK_REFERENCE.md` | 13-step quick guide for PR feedback handling |
| `.github/instructions/shared.instructions.md` | Monorepo commands and Issue #306 log naming |
| `docs/dev-note/README.md` | Code quality logs documentation and examples |
| `docs/dev-note/issue-#306-pnpm-*.txt` | Example log files (test, lint, format, type-check) |
| `docs/implementation-planning/` | Execution plans with PR registry and feedback tracking |

---

## 🚀 Multi-Agent System & Invocation

### Agent Configuration Files

This project uses **custom agent definitions** for specialized roles. Agent configurations are stored in:

```
.copilot/
├── copilot-instructions.md           ← You are here (main workflow)
├── agents/
│   ├── developer.md                  ← Developer agent (implementation)
│   ├── orchestrator.md               ← Orchestrator agent (coordination)
│   ├── reviewer.md                   ← Reviewer agent (code review)
│   ├── tester.md                     ← Tester agent (testing)
│   └── product-manager.md            ← Product Manager agent (requirements)
└── settings.json                     ← GitHub Copilot CLI configuration
```

### Agent Loading & Invocation

Agent configuration files are **automatically loaded into context when you invoke an agent** using the `@agent-name` syntax. This happens through the agent definitions in `.github/copilot/settings.json`:

```json
"agents": {
  "orchestrator": {
    "config-file": ".copilot/agents/orchestrator.md",
    "auto-load": true
  },
  "developer": {
    "config-file": ".copilot/agents/developer.md",
    "auto-load": true
  },
  // ... other agents
}
```

**Invocation Syntax:**

When you type `@agent-name`, GitHub Copilot CLI:
1. Recognizes the agent trigger (`@orchestrator`, `@developer`, etc.)
2. Looks up the agent config file in settings.json
3. **Automatically loads the agent config file** (e.g., `.copilot/agents/orchestrator.md`)
4. Injects agent-specific knowledge, responsibilities, and patterns
5. Agent responds with full context awareness

**Available Agents:**

```bash
@orchestrator [your request]       # Coordinate work across layers
@developer [your request]          # Implement features and fixes
@reviewer [your request]           # Review PRs and code quality
@tester [your request]             # Test strategies and debugging
@product-manager [your request]    # Requirements and validation
```

**Examples:**

```bash
# Direct invocation (config file auto-loads)
@orchestrator Analyze Phase 3 issues and create execution plan

# Delegation syntax (orchestrator loads + coordinates)
let @orchestrator delegate @developer to implement Issue #119

# Agent-specific tasks (config file injected with context)
@reviewer Review PR #245 for N+1 queries and DataLoader usage
@tester Write integration tests for real-time event flow
```

**Key Point**: Each agent receives only its role-specific context from its configuration file, ensuring focused, specialized knowledge without context pollution.

### Agent Selection Decision Tree

**Choose the right agent for your task:**

```
Is this work about PLANNING, COORDINATION, or DEPENDENCIES?
├─ YES → Use @orchestrator
│   Example: "Break down Phase 3 into independent tasks"
│   Responsibilities: Plan features, manage blockers, coordinate agents
│
Is this work about IMPLEMENTATION or BUG FIXES?
├─ YES → Use @developer
│   Example: "Implement Issue #119 authentication context"
│   Responsibilities: Write code, tests, follow patterns, commit changes
│
Is this work about CODE REVIEW or QUALITY?
├─ YES → Use @reviewer
│   Example: "Review PR #245 for N+1 queries and Apollo best practices"
│   Responsibilities: Review code, validate architecture, provide feedback
│
Is this work about TESTING or VALIDATION?
├─ YES → Use @tester
│   Example: "Write integration tests for real-time event flow"
│   Responsibilities: Test strategies, debug failures, coverage reports
│
Is this work about REQUIREMENTS or PRIORITIZATION?
├─ YES → Use @product-manager
│   Example: "Define acceptance criteria for Issue #140"
│   Responsibilities: Requirements, acceptance criteria, business alignment
```

### Running the Workflow

#### **Phase 1: Planning** (Orchestrator)

```bash
# Terminal 1: Start GitHub Copilot CLI
copilot

# In copilot CLI:
@orchestrator Create execution plan for Phase 3 Block 2 issues
# Orchestrator will analyze issues, identify dependencies, create task breakdown
```

#### **Phase 3A: Initial Implementation** (Developer)

```bash
@developer Let me /plan the implementation for Issue #119
# Developer will:
# - Analyze issue and codebase
# - Break into 5-8 todos
# - Create comprehensive plan
# - Post to GitHub issue as comment

@developer Implement Issue #119 following the plan
# Developer will:
# - Create/checkout feature branch
# - Implement todos in order
# - Run QA checks
# - Push and create PR
```

#### **Phase 3B: PR Review** (Reviewer)

```bash
@reviewer Review PR #245 for architecture and best practices
# Reviewer will:
# - Examine code changes
# - Check N+1 queries, DataLoader usage
# - Verify optimistic updates
# - Check test coverage
# - Provide detailed feedback
```

#### **Phase 3C: Handle Feedback** (Developer)

```bash
@developer I received feedback on PR #245: missing DataLoader for parts resolver
# Developer will:
# - Identify feature branch using gh pr view
# - Switch to existing branch
# - Implement fixes
# - Push to same branch
# - PR auto-updates with fixes
```

#### **Phase 4: Consolidation** (Reviewer + Tester)

```bash
@reviewer Create consolidation branch for Phase 3 and merge approved PRs
# Reviewer will merge feature branches into consolidation branch

@tester Run full test suite on consolidation branch
# Tester will verify no regressions and all tests pass
```

---

## ⚙️ How Agent Configuration Loading Works

### The Agent Loading Flow

When you invoke an agent in GitHub Copilot CLI:

```
┌─────────────────────────────────────────────────────────────┐
│ USER INVOKES: @orchestrator Break down Phase 3              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GITHUB COPILOT CLI: Detects @orchestrator trigger           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LOOKUP: Check .github/copilot/settings.json                 │
│                                                              │
│ agents:                                                      │
│   orchestrator:                                              │
│     config-file: ".copilot/agents/orchestrator.md"  ← FILE  │
│     auto-load: true                                ← ENABLED│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LOAD: Reads .copilot/agents/orchestrator.md into context    │
│                                                              │
│ File includes:                                               │
│  - Orchestrator responsibilities                             │
│  - Coordination patterns                                     │
│  - Parallel execution guidance                               │
│  - Decision frameworks                                       │
│  - Escalation criteria                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ INJECT: Agent-specific knowledge added to context            │
│                                                              │
│ Agent now understands:                                       │
│  - What it's responsible for                                 │
│  - How to coordinate with other agents                       │
│  - Project-specific patterns and rules                       │
│  - When to escalate or delegate                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ RESPOND: Agent answers with full context awareness           │
│                                                              │
│ Orchestrator will:                                           │
│  - Analyze Phase 3 requirements                              │
│  - Break into independent tasks                              │
│  - Create execution plan                                     │
│  - Know when to delegate to developer/reviewer/tester        │
└─────────────────────────────────────────────────────────────┘
```

### Agent Context Priority

When an agent is invoked, context is injected in this order (top = highest priority):

```
1. AGENT CONFIG (.copilot/agents/agent-name.md)
   ↓ Agent-specific responsibilities, patterns, commands
   └─ Examples: Developer knows DataLoader patterns, 
              Reviewer knows code quality criteria

2. MAIN INSTRUCTIONS (.copilot/copilot-instructions.md)
   ↓ Project workflow, phases, rules, conventions
   └─ Examples: One issue = One branch, PR feedback cycle

3. PROJECT CONTEXT (CLAUDE.md, DESIGN.md, CLAUDE.md)
   ↓ Technology stack, architecture, integration points
   └─ Examples: GraphQL patterns, Express structure, testing setup
```

This ensures:
- ✅ Agent has **focused, role-specific knowledge** from its config
- ✅ Agent understands **project-wide workflow** from main instructions
- ✅ Agent can reference **architecture and tech stack** from CLAUDE.md
- ✅ **No context pollution** — agent only loads what it needs

### Configuration Verification

To verify agent files will load correctly:

**Check settings.json has agent definitions:**
```bash
cat .github/copilot/settings.json | grep -A5 '"agents"'
```

Expected output:
```json
"agents": {
  "orchestrator": {
    "config-file": ".copilot/agents/orchestrator.md",
    "auto-load": true
  },
  // ... other agents
}
```

**Verify all agent files exist:**
```bash
ls -la .copilot/agents/
# Should show:
# - orchestrator.md    ✓
# - developer.md       ✓
# - reviewer.md        ✓
# - tester.md          ✓
# - product-manager.md ✓
```

**Test agent invocation in Copilot CLI:**
```bash
copilot

# Type and press Enter:
@orchestrator List your responsibilities as Orchestrator Agent

# Agent should respond with content from .copilot/agents/orchestrator.md
```

### When Agent Files Are NOT Loaded

Agent config files are **only loaded** when you:

```
✅ Invoke agent directly:        @orchestrator [task]
✅ Delegate to agent:             let @developer implement Issue #119
✅ Ask agent to delegate:         @orchestrator Delegate @tester to ...

❌ Type agent name without @:    orchestrator [task]    ← Won't load
❌ In comments:                  # use orchestrator     ← Won't load
❌ In regular text:              "The orchestrator..."   ← Won't load
```

**Rule**: Always use `@agent-name` syntax to trigger agent loading.

---

## 💡 Tips & Best Practices

### Agent Usage Best Practices

1. **Always Use @agent-name Syntax**: Agent config files only load when invoked with `@` prefix
   - ✅ `@developer Implement Issue #119`
   - ❌ `developer Implement Issue #119` (won't load agent config)

2. **Let Agents Delegate**: Use delegation syntax to leverage multi-agent coordination
   - `let @orchestrator delegate @developer to implement Issue #119`
   - Agent-specific context is automatically loaded when delegated

3. **Provide Clear Context**: Include issue numbers, PRs, and specific requirements
   - ✅ `@developer Let me /plan Issue #119 frontend auth context`
   - ❌ `@developer implement something`

4. **Use Agent-Appropriate Commands**: Reference agent-specific tools from their config
   - Developer: `/plan`, `/diff`, `/review`, `/ask`
   - Reviewer: `/review`, `/diff`, `/ask`, `/share`
   - Tester: `/test`, `/debug`, `/diff`, `/ask`

5. **Chain Agent Work Logically**: Follow the workflow phases
   - Phase 1: @orchestrator plans
   - Phase 3A: @developer implements
   - Phase 3B: @reviewer reviews
   - Phase 3C: @developer fixes feedback
   - Phase 4: @tester consolidates

### Development Best Practices

1. **Keep Feedback Focused**: Only fix what reviewer asked for
2. **Verify Before Push**: Use `git diff --cached` to review staging
3. **One Cycle at a Time**: Complete all feedback fixes before pushing again
4. **Update Execution Plan**: Log feedback cycles and fixes (helps orchestrator track progress)
5. **Use co-author flag**: Credit the reviewer with `Co-Authored-By` trailer
6. **Document in PR**: Add detailed comments explaining fixes
7. **Run Quality Checks Automatically**: All agents automatically run code quality checks (pnpm test, pnpm lint, pnpm format:check, pnpm type-check) without user confirmation per Issue #306 automation guidelines in `.copilot/agents/quality-assurance.md` and `docs/dev-note/README.md`

---

## 🔗 Integration Points

### GitHub Copilot CLI ↔ This Project

- **Settings**: `.github/copilot/settings.json` (GitHub Copilot CLI configuration with agent definitions)
- **Instructions**: `.copilot/copilot-instructions.md` (this file - main workflow reference)
- **Agents**: `.copilot/agents/*.md` (custom agent definitions - **auto-loaded on invocation**)
- **Rules**: `.copilot/rules.json` (detailed implementation rules - reference only)
- **Execution Plans**: `docs/implementation-planning/` (orchestrator's playbook)

### Agent Configuration Loading Mechanism

**How Agent Files Are Loaded:**

When you invoke an agent using the `@agent-name` syntax, GitHub Copilot CLI **automatically loads** the corresponding agent configuration file into the session context:

```
User invokes: @orchestrator Break down Issue #119
        ↓
GitHub Copilot CLI detects @orchestrator trigger
        ↓
Looks up orchestrator config in settings.json:
  "orchestrator": {
    "config-file": ".copilot/agents/orchestrator.md",
    "auto-load": true
  }
        ↓
Loads .copilot/agents/orchestrator.md into context
        ↓
Agent-specific knowledge injected (responsibilities, patterns, commands)
        ↓
Orchestrator responds with full context awareness
```

**Agent Invocation Syntax:**

```bash
# Direct invocation
@orchestrator [task description]
@developer [task description]
@reviewer [task description]
@tester [task description]
@product-manager [task description]

# Delegation syntax (orchestrator delegates to other agents)
let @orchestrator delegate an appropriate agent to implement Issue #119
let @developer implement the plan for Issue #120
let @reviewer review PR #245 and provide feedback
```

**Agent Configuration Priority:**

When an agent is invoked, context is loaded in this order:
1. **Agent config file** (`.copilot/agents/agent-name.md`) — Agent-specific responsibilities and patterns
2. **Main instructions** (`.copilot/copilot-instructions.md`) — Project workflow and rules
3. **Project CLAUDE.md** — Technology stack and architecture

This ensures the agent has focused, role-specific knowledge while maintaining project context.

### Execution Plan Registry

Every execution plan includes:
```markdown
### PR Registry
| PR # | Feature Branch | Issue | Cycle Status | Next Action |
|------|---|---|---|---|
| 245 | feat/issue-#35-add-skeleton-loading | #35 | Cycle 2 | Re-review Phase 3C |
| 246 | feat/issue-#36-keyboard-navigation | #36 | Cycle 1 | Initial implementation |
```

This registry is the single source of truth for:
- Which PR maps to which feature branch
- Current feedback cycle status
- What action is needed next

---

## 🆘 Troubleshooting

### Agent Configuration Loading Issues

#### "Agent didn't respond with specialized knowledge"

**Symptom**: Agent responds generically without referencing agent config

**Diagnosis**: Check if agent config file is being loaded

```bash
# 1. Verify agent config file exists
ls .copilot/agents/orchestrator.md
# Should exist ✓

# 2. Verify settings.json has agent definition
grep -A3 '"orchestrator"' .github/copilot/settings.json
# Should show:
# "orchestrator": {
#   "config-file": ".copilot/agents/orchestrator.md",
#   "auto-load": true

# 3. Restart Copilot CLI and retry with explicit @agent-name syntax
copilot
@orchestrator List your responsibilities
```

**Solution**: 
- Ensure `.github/copilot/settings.json` has agent definitions (see sample above)
- Use exact `@agent-name` syntax (case-sensitive)
- Restart GitHub Copilot CLI if recently edited settings.json
- Verify `.copilot/agents/` files exist and are readable

#### "Settings.json changes aren't taking effect"

**Solution**:
```bash
# 1. Save your changes to .github/copilot/settings.json
# 2. Exit current Copilot CLI session
#    Type: exit
#    Or press Ctrl+C

# 3. Restart Copilot CLI
copilot

# 4. Test agent invocation
@orchestrator test
```

#### "Agent config file not found"

**Error message**: "Cannot load .copilot/agents/developer.md"

**Solution**:
```bash
# 1. Verify file exists and path is correct
ls -la .copilot/agents/developer.md

# 2. Check for typos in settings.json
cat .github/copilot/settings.json | grep config-file

# 3. Ensure path is relative to project root (not absolute)
# ✅ CORRECT: "config-file": ".copilot/agents/developer.md"
# ❌ WRONG:   "config-file": "/home/user/project/.copilot/agents/developer.md"
```

### Git & Branch Issues

#### "I don't know which branch to fix"

Use the `gh pr view` command:
```bash
gh pr view 245 --json headRefName
# Returns: feat/issue-#35-add-skeleton-loading
```

#### "I accidentally created a new branch"

Delete it and switch to the correct one:
```bash
git branch -d fix/pull-request-245-wrong-branch
git switch feat/issue-#35-add-skeleton-loading
```

#### "My changes aren't showing in the PR"

Verify you pushed to the correct branch:
```bash
git branch -v
# Should show: feat/issue-#35-... origin/feat/issue-#35-... [ahead 1]
```

#### "I staged too many files"

Reset staging and redo it:
```bash
git reset HEAD
git add [correct-files-only]
git diff --cached  # Verify
```

---

## 🔐 Golden Rules

```
