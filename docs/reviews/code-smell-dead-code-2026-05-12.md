# Code Smell + Dead Code Review (2026-05-12)

## Scope

- Window used: last 7 days (`git log --since='7 days ago'`) because there were no commits after `2026-05-11T21:00:27Z` in this repo.
- Files examined: recently modified files from that window, with focus on `src/components/*`, `src/routes/*`, and `src/lib/*` touched by those commits.

## Findings

### Critical

- None with strong repo evidence in this window.

### Warning

1. Temporary debug detail leaked in 500 responses (production exposure risk)
- Evidence: commit `9977ce7` added `_debug` to user-visible 500 payload in [`src/routes/api/generate.ts`](../../src/routes/api/generate.ts).
- Fix: `_debug` now only included in development mode.
- Updated lines: [`src/routes/api/generate.ts:619`](../../src/routes/api/generate.ts#L619)

2. Admin UI flow partially wired (dead UI path + unused admin state result)
- Evidence: `AdminTools` existed but had zero references before this patch; `useIsAdmin()` result in header was fetched but unused.
- Fix: wired Dashboard link for admins and rendered `AdminTools` on dashboard; `AdminTools` now requires admin status.
- Updated lines:
  - [`src/components/header.tsx:37`](../../src/components/header.tsx#L37)
  - [`src/routes/dashboard.tsx:34`](../../src/routes/dashboard.tsx#L34)
  - [`src/components/admin-tools.tsx:15`](../../src/components/admin-tools.tsx#L15)

3. Admin tool result logic relied on ambiguous condition shape
- Evidence: `data.message || data.updated ? ...` could incorrectly force "Updated ..." when only `message` exists.
- Fix: explicit `hasMessage` and `hasCounts` branching.
- Updated lines: [`src/components/admin-tools.tsx:30`](../../src/components/admin-tools.tsx#L30)

4. API handler passed an unused request argument to a zero-arg function
- Evidence: `/api/admin/check` route wrapper called `GET(request)` while `GET` takes no parameters.
- Fix: handler now calls `GET()` directly.
- Updated lines: [`src/routes/api/admin/check.ts:16`](../../src/routes/api/admin/check.ts#L16)

### Info

- Lint output includes Biome schema info (`2.4.7` schema with `2.4.6` CLI), but checks pass.

## Dead Code Candidates (recently modified files)

1. `buildStampPrompt` in [`src/lib/stamp-prompts.ts:96`](../../src/lib/stamp-prompts.ts#L96)
- Confidence: `needs review`
- Evidence (non-test search):
  - `rg -n "\\bbuildStampPrompt\\b" src --glob '!**/__tests__/**'`
  - only definition found in `src/lib/stamp-prompts.ts`

2. `EXAMPLE_PROMPTS` in [`src/lib/stamp-prompts.ts:82`](../../src/lib/stamp-prompts.ts#L82)
- Confidence: `needs review`
- Evidence (non-test search):
  - `rg -n "\\bEXAMPLE_PROMPTS\\b" src --glob '!**/__tests__/**'`
  - only definition found in `src/lib/stamp-prompts.ts`

## Verification

- `bun run lint` ✅ (passes; one Biome schema-version info message)
- `bunx tsc --noEmit` ✅
- `bun run test` ✅ (25 files, 270 tests passed)
