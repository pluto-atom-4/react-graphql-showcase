# Claude Code Project Agents (Issue #343)

Project-level subagents for Claude Code CLI. Each file is a Markdown doc with YAML frontmatter — Claude Code's native format. This supersedes the `.claude/agents/*.claude.yaml` structure originally proposed in #343; that format isn't read by Claude Code (Claude Code has no YAML-config agent loader).

| File | Role | Model | Tools |
|---|---|---|---|
| `architect.md` | Strategic design, ADRs, schema, tech selection | session default | Read, Grep, Glob, Bash, Write, Edit |
| `developer.md` | Feature implementation, tests, quality checks | haiku | Read, Edit, Write, Grep, Glob, Bash |
| `code-reviewer.md` | PR diff review, pattern compliance | haiku | Read, Grep, Glob (read-only) |

## Invoke

```
Agent(subagent_type: "architect")      # or "developer" / "code-reviewer"
```
or type `/agents` in an interactive session to list and pick.

**Not** the same as `copilot @architect` / `@developer` / `@reviewer` — those are GitHub Copilot CLI commands (see `AGENTS.md` § Copilot Integration, `.claude/settings.json` → `toolIsolation.githubCopilotCLI`). AGENTS.md remains the shared role-definition doc read by both tools; these files are the Claude-Code-specific execution config for three of its seven roles.

## Why only 3 of 7 AGENTS.md roles
Scoped to #343's ask (Architect/Developer/Code Reviewer). Orchestrator, Tester, QA, Product Manager can follow the same pattern later — copy an existing file, adjust `tools`/`model`/`description`.

## Verify after editing
New/changed project agents are picked up on the next Claude Code session start (not hot-reloaded mid-session). To confirm: start a new session in this repo, run `/agents`, expect `architect`, `developer`, `code-reviewer` listed with source "project".
