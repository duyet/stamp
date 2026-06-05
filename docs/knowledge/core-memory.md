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
- Keep TanStack Router test files under `src/routes/**/__tests__` excluded via `router.routeFileIgnorePattern` so route-tree generation stays quiet in build and typecheck flows.

## Automation Workflow

Use this flow for code-smell/dead-code sweeps:

1. Scan recent touched files:
   - `git log --since='7 days ago' --name-only --pretty=format: | sed '/^$/d' | sort -u`
   - `git log --since='<last-run-iso>' --name-only --pretty=format: | sed '/^$/d' | sort -u`
   - `git log --since='<last-run-iso>' --name-only --pretty=format: -- src | sed '/^$/d' | sort -u` for source-only evidence windows.
   - `git log --since='<last-run-iso>' --pretty=format:'%H %ad %s' --date=iso` for repo-wide commit-SHA evidence (including docs-only windows).
   - `git log --since='<last-run-iso>' --pretty=format:'%H %ad %s' --date=iso -- src` for commit-SHA evidence tied to source changes.
   - `git log --since='<last-run-iso>' --no-merges --pretty=format:'%H %ad %s' --date=iso -- src` to isolate direct source commits when merge commits dominate the window.
   - `git log --since='<last-run-iso>' --no-merges --name-only --pretty=format: -- src | sed '/^$/d' | sort -u` to isolate direct source file paths when merge commits dominate the window.
   - If `<last-run-iso>` returns no commits, fallback to `git log --since='24 hours ago' --name-only --pretty=format: | sed '/^$/d' | sort -u`
   - If a detached worktree or docs-only window makes the local history look stale, confirm recent merged PRs with `gh pr list --base main --state merged --limit 10 --json number,title,mergedAt,mergeCommit,headRefName,baseRefName` before considering the scan complete.
   - When GitHub shows newer merges than local `git log`, inspect the merged PR directly with `gh pr view <number> --json number,title,files,mergeCommit,mergedAt` to recover the exact changed-file set before editing docs or code.
2. Prove dead code in non-test files before removal:
   - `rg -n "<symbol>" src --glob '!**/__tests__/**' --glob '!**/*.test.*' --glob '!**/*.spec.*'`
3. Keep only durable lessons in this file.
4. If a linked worktree cannot write git metadata (for example `FETCH_HEAD` permission errors), run commit/PR steps from the canonical checkout at `/Users/duet/project/stamp`; fast-forward `main` there with `git pull --ff-only origin main` before branching.
5. After merge, confirm main-branch CI with `gh run list --branch main --limit 5`.
6. In sandboxed runs where `bun install` fails with tempdir permission errors, run with external temp/cache paths (for example `TMPDIR=/private/tmp/stamp-tmp BUN_INSTALL_CACHE_DIR=/private/tmp/stamp-bun-cache bun install`) to avoid permission failures and accidental test discovery under repo-local cache folders.
7. In fresh worktrees, `bunx tsc --noEmit` can fail until TanStack Router regenerates ignored `src/routeTree.gen.ts`; run `bun run build` once, then rerun `bunx tsc --noEmit`.

## Current Candidates (Needs Review)

- None (last reviewed 2026-06-05; since the 2026-06-02T21:01:00Z automation run the only code-affecting merges were PR #86 / `fab2072` adding `router.routeFileIgnorePattern` to exclude route tests and PR #84 / `58c7ffc` bumping `react` and `react-dom` to `19.2.7`; `bun run lint`, `bunx tsc --noEmit`, and `bun run test` passed locally, and no zero-reference non-test symbols were found in the touched files.)

## Documentation Policy

- Do not create dated AI review docs like `docs/reviews/code-smell-dead-code-YYYY-MM-DD.md`.
- Update this file with small, durable knowledge instead.
