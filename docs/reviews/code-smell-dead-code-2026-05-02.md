# Code smell and dead-code review - 2026-05-02

Scope: production files changed in the last seven days. No commits landed after the last automation run timestamp, so this pass used the seven-day fallback window.

## Findings verified fixed on current base

### Warning: shared credit event exported from a UI component

`src/components/generate-form.tsx` imported `CREDITS_CHANGED_EVENT` from `src/components/credit-balance.tsx`, even though it only needs the event name. That coupled the generation form to the credit balance UI module.

Current base status: fixed in `src/lib/credit-events.ts`; both components import the event name from the shared lib module.

Evidence before fix:

```text
src/components/credit-balance.tsx:10:export const CREDITS_CHANGED_EVENT = "credits:changed";
src/components/generate-form.tsx:4:import { CREDITS_CHANGED_EVENT } from "@/components/credit-balance";
src/components/header.tsx:8:import { CreditBalance } from "@/components/credit-balance";
```

### Info: unused `StatCard` component

`src/components/stat-card.tsx` was modified in the recent dashboard work, but there were zero non-test imports or JSX uses outside its own declaration. The dashboard now uses local `MetricBlock` rendering instead.

Current base status: `src/components/stat-card.tsx` has been removed.

Search evidence before removal:

```text
rg -n "StatCard|@/components/stat-card" -g '!src/**/*.test.*' -g '!src/**/__tests__/**' -g '!docs/**'
src/components/stat-card.tsx:2: * StatCard component
src/components/stat-card.tsx:7:interface StatCardProps {
src/components/stat-card.tsx:16:export function StatCard({ label, value, detail }: StatCardProps) {
```

## Findings not fixed

No critical findings were found. Other recently modified exports had non-test references or route-framework entry points.

## Verification follow-up

The analytics `daily_stats` test fixture expected 2026-04-29 to be "today". The test now pins its clock to that date so the suite does not fail as wall-clock time advances.
