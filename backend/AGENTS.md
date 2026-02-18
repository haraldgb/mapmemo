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

## Cross-Project Dependencies (Frontend ↔ Backend)

The frontend has its own beads instance at `../frontend/.beads/`. Issues use the `frontend-` prefix.

**When a backend issue unblocks a frontend issue:**
1. The backend issue description will reference the frontend issue (e.g., `unblocks: frontend-qcw`)
2. After completing the backend work, update the frontend issue status:
   ```bash
   cd ../frontend && bd update <frontend-id> --status open
   ```
   This moves it from `blocked` to `open` so frontend agents pick it up via `bd ready`.

**When creating backend issues that have frontend dependencies:**
- Add `unblocks: frontend-<id>` in the description
- The frontend issue should be set to `blocked` status with a note like `blocked-by: backend-<id>`

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

