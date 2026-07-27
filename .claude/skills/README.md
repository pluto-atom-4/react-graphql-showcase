# Project-Specific Skills

This directory contains custom skills for the Stoke Full Stack React + GraphQL Showcase project.

## Available Skills

### push-feature-branch

Automates the complete feature branch workflow: checking git status, creating a feature branch, staging files, committing with proper messages, and pushing to remote.

**When to use:**
- Creating a new feature branch for your work
- Committing changes with proper formatting and co-author trailers
- Handling edge cases like unstaged changes, existing branches, or mixed file types

**How to invoke:**

```
@claude Create a feature branch for [your task description]
```

Or:

```
@claude Create a feature branch, commit, and push to remote
```

**Examples:**

```
"Create a feature branch for adding Apollo Client best practices documentation"
"Set up a branch for fixing the N+1 query issue"
"Create a feature branch for dashboard component tests"
```

## Skill Features

The `push-feature-branch` skill handles:

- ✅ **Auto-generated branch names** — Suggests descriptive names based on your task (e.g., `feat/apollo-client-best-practices`)
- ✅ **File review before staging** — Shows what will be committed, lets you confirm or modify
- ✅ **Unstaged change warnings** — Clear alerts about changes that won't be included
- ✅ **Selective staging** — Choose individual files if needed (option `s`)
- ✅ **Template-based commits** — Generates proper commit messages with Copilot co-author trailer
- ✅ **Pre-push verification** — Shows what will be pushed before the irreversible push
- ✅ **Existing branch handling** — Ask to use existing or create new with variant name
- ✅ **Error recovery** — Guidance for common failures (push errors, branch conflicts, etc.)

## Skill Workflow

The skill guides you through 8 steps:

1. **Check Repository Status** — Detect uncommitted changes, unstaged files
2. **Handle Edge Cases** — Warn about uncommitted changes, offer to stash
3. **Generate Branch Name** — Auto-suggest based on your task description
4. **Review Files** — Show which files will be staged, confirm before proceeding
5. **Commit with Template** — Generate message with proper type prefix and co-author trailer
6. **Verify Before Push** — Show `git log` of what will be pushed
7. **Push to Remote** — Push with `-u` flag for tracking
8. **Final Status Summary** — Show git branch, log, and committed/unstaged files

## Examples

### Happy Path: New Documentation

```
You: Create a feature branch for adding Apollo Client best practices documentation

Skill: ✓ Generates branch: docs/apollo-client-best-practices
       → Shows file: docs/apollo-client-best-practices.md
       → Suggests commit: docs: Add Apollo Client best practices guide
       → Pushes to remote with tracking
       → Shows final git state with file committed ✓
```

### Edge Case: Unstaged Changes

```
You: I have unstaged code and want to commit new docs

Skill: ⚠️ Warns about unstaged changes
       → Shows "will NOT be committed" section
       → Let's you choose: stage all, stage none, or pick individual (s)
       → Commits only what you selected
       → Shows post-commit summary of what was/wasn't included
```

### Edge Case: Existing Branch

```
You: Create a branch for dashboard tests (might already exist)

Skill: ⓘ Detects existing branch
       → Offers: use existing, create new with variant, or cancel
       → If new: auto-suggests -v2, or let's you type custom name
       → Continues workflow with your choice
       → Shows final branch state
```

## Configuration

The skill uses your git configuration (git config user.name, user.email) and your current repository state. No additional setup required.

## Requirements

- Git installed and available in PATH
- Within a git repository
- Write access to the repository

## Support

For issues or feedback on this skill, refer to `CLAUDE.md` in the project root for more context on the interview practice setup.
