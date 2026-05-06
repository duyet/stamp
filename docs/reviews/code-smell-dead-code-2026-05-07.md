# Code Smell & Dead Code Review — 2026-05-07

Window scanned: commits since last run `2026-05-05T21:01:49Z` (through `bc860351cfb523e9e0bc01fd615b6105ad0a2419`).

Commits reviewed:
`6380587c`, `665071d1`, `41468914`, `fd473880`, `98c7ba6e`, `9977ce7f`, `9b258de2`, `c631d199`, `7073a793`, `ce9deed2`, `f55372f1`, `85b75d3a`, `f82ba9b3`, `86a11557`, `269d7f7c`, `9dac3495`, `449b8c25`, `35c4fb22`, `233f6cfd`, `bc860351`.

## Findings

### Critical
- None with concrete repository evidence in this window.

### Warning
1. **Unwired admin feature path (recent regression in `bc860351`)**
   - Evidence:
     - `src/components/header.tsx` created `useIsAdmin()` result but did not use it (pre-fix behavior).
     - `src/components/admin-tools.tsx` exported `AdminTools` but had zero call sites.
     - Commit message for `bc860351` stated: "Show Dashboard link in header nav for admin users" and "expanded admin tools", but neither was actually wired in UI.
   - Impact:
     - Extra `/api/admin/check` fetch without UI effect.
     - Admin tools unreachable from any route.
   - Fix applied:
     - Added admin-only Dashboard nav link in `src/components/header.tsx`.
     - Mounted `AdminTools` in `src/routes/dashboard.tsx`.

### Info
1. **Biome schema drift info (non-blocking)**
   - Evidence: `bun run lint` reported schema mismatch (`2.4.7` in config vs CLI `2.4.6`).
   - Status: informational only; no functional impact observed in this pass.

## Dead Code Check (recently modified files only, tests excluded)

### Confident dead code (pre-fix)
- `AdminTools` in `src/components/admin-tools.tsx:9`
  - Search evidence before fix: `rg -n "AdminTools" src --glob '!**/*.test.*' --glob '!**/__tests__/**'`
  - Result before fix: only `src/components/admin-tools.tsx:9`.
  - Resolution: now referenced by `src/routes/dashboard.tsx:6` and `src/routes/dashboard.tsx:34`.

### Needs review
- None.

## Performance Regression Audit

Concrete measurement/traces were not available in this repository window.

Highest-leverage fix with concrete evidence:
- Removing an ineffective admin-status fetch path by wiring `useIsAdmin` output to UI avoids unproductive network work and restores intended feature behavior.

What to measure next (if needed):
- Browser Network panel: `/api/admin/check` request count before/after opening authenticated pages.
- Dashboard page TTI with `AdminTools` rendered.

## Verification

- `bun run lint`: passes with one existing info-level schema drift notice.
- `bunx tsc --noEmit`: blocked in this runner (`bun tempdir PermissionDenied`).
- `bun run test`: blocked in this runner (could not bootstrap bun tempdir; `vitest` unavailable here).
