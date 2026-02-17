# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Session Completion

**When ending a work session**, run these two skills in order:

1. **`/land`** — verify, review, clean up, and commit
2. **`/park`** — push, create PR, update issue tracking, and hand off

Work is NOT complete until both have run successfully.

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds and a PR is created
- NEVER stop before pushing — that leaves work stranded locally
- NEVER say "ready to push when you are" — YOU must push
- NEVER commit or push to protected, default, `main`, or `develop` branches — create a `claude/<short-description>` branch and work from there

