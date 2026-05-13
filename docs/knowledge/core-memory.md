# Core Memory

Durable repo knowledge for future maintenance and automation runs.

## Guardrails

- Use Cloudflare bindings via `getEnv()`.
- Use per-request DB access via `getDb()` from `@/db`.
- Keep auth/admin checks fail-closed.
- Never expose internal debug details in production API responses.

## Maintainability Patterns

- Keep shared events/constants in `src/lib/*`, not UI component files.
- Remove exports/components only after zero-reference proof in non-test code.
- Keep contributor docs aligned with `package.json` scripts and the current runtime stack.

## Automation Workflow

Use this flow for code-smell/dead-code sweeps:

1. Scan recent touched files:
   - `git log --since='7 days ago' --name-only --pretty=format: | sed '/^$/d' | sort -u`
   - `git log --since='<last-run-iso>' --name-only --pretty=format: | sed '/^$/d' | sort -u`
2. Prove dead code in non-test files before removal:
   - `rg -n "<symbol>" src --glob '!**/__tests__/**' --glob '!**/*.test.*' --glob '!**/*.spec.*'`
3. Keep only durable lessons in this file.
4. If a linked worktree cannot write git metadata (for example `FETCH_HEAD` permission errors), run commit/PR steps from the canonical checkout at `/Users/duet/project/stamp`.

## Current Candidates (Needs Review)

- None (last reviewed 2026-05-13).

## Documentation Policy

- Do not create dated AI review docs like `docs/reviews/code-smell-dead-code-YYYY-MM-DD.md`.
- Update this file with small, durable knowledge instead.
