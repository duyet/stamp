# Code Smell and Dead Code Review - 2026-04-30

## Scope

- Window: changes since `2026-04-28T21:00:40Z`
- Focus: maintainability-only findings in recently modified non-test files
- Excluded: test files and behavior-changing cleanups

## Findings

### Warning: unused dashboard stat card component

- File: `src/components/stat-card.tsx`
- Confidence: confident
- Evidence: `rg -n "\\bStatCard\\b" . -g '!**/*.test.*' -g '!**/__tests__/**'` returned only the component declaration before removal.
- Fix: removed the unused component file. No production imports referenced it.

## Reviewed but kept

- `CreditBalance`, `CREDITS_CHANGED_EVENT`, `DashboardContentMemo`, `RecentStampsSection`, `HorizontalBarChart`, `MetricTable`, `MetricTrendChart`, `isAdmin`, `canModifyStamp`, `getAuthUserId`, `getAuthUserIdentity`, analytics types, and shared constants all have non-test references.
- `getWorkersAiCredits` and `faviconRedirect` are file-local helpers with live call sites in their route modules.
