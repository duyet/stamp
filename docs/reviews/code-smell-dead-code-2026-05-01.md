# Code Smell and Dead Code Review - 2026-05-01

## Scope

- Recent-change window: changes after the previous automation run at 2026-04-29T21:00:53Z.
- Reviewed commit: `f7962f1` (`feat: show account credit balance`).
- Reviewed files: `src/components/credit-balance.tsx`, `src/components/generate-form.tsx`, `src/components/header.tsx`.

## Findings

### Warning: UI component exported a cross-component event constant

- Location: `src/components/credit-balance.tsx:10`, `src/components/generate-form.tsx:4`
- Issue: `GenerateForm` imported the credit refresh event name from the visual `CreditBalance` component. That coupled form submission logic to a header display component just to share an event string.
- Fix: moved `CREDITS_CHANGED_EVENT` to `src/lib/credit-events.ts` and updated both consumers.
- Functional impact: none. The event name is unchanged.

### Warning: analytics test depended on the real calendar date

- Location: `src/routes/api/__tests__/analytics.test.ts:329`
- Issue: the `daily_stats` test fixture used fixed 2026-04-29 and 2026-04-28 rows, while the handler computes "today" from the current clock. The test started returning `stampsToday = 0` once the real date moved past the fixture date.
- Fix: pinned the analytics test clock to 2026-04-29.
- Functional impact: none. This changes only test determinism.

## Dead Code Checks

No confident dead-code removals were found.

- `rg -n "CREDITS_CHANGED_EVENT|CreditBalance|CreditInfo|isCreditInfo|dailyRemaining|purchasedCredits|totalRemaining|/api/credits|credits:changed" . -g '!**/*.test.*' -g '!**/__tests__/**'`
- `CreditBalance` is used by `src/components/header.tsx`.
- `CREDITS_CHANGED_EVENT` is used by the balance component and generation form.
- `dailyRemaining`, `purchasedCredits`, and `totalRemaining` are part of the `/api/credits` response consumed by the balance component.
