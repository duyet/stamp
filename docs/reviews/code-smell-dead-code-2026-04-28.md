# Code smell and dead-code review - 2026-04-28

Scope: recent changes from the last seven days, with emphasis on files changed since the previous automation run.

## Findings fixed

### Warning: unused exported constants in `src/lib/constants.ts`

`src/lib/constants.ts` was modified in the recent upstream-limit handling work, and several exported constants or object members had no non-test code references outside their declarations. Keeping them in the shared constants module makes the public surface look larger than it is and invites future code to depend on stale values.

Removed:

- `IMAGE_CONSTANTS.FLUX_MAX_DIMENSION`
- `IMAGE_CONSTANTS.HD_DIMENSION`
- `IMAGE_CONSTANTS.STANDARD_DIMENSION`
- `TEXT_COLORS`

Review follow-up:

- `DASHBOARD.DAILY_TREND_DAYS` and `DASHBOARD.STATS_PER_ROW` were retained and wired into the dashboard where their literal values were still being used.

Search evidence before removal:

```text
rg -n "\bTEXT_COLORS\b" . --glob '!**/__tests__/**' --glob '!**/*.test.*'
src/lib/constants.ts:55:export const TEXT_COLORS = {

rg -n "\bFLUX_MAX_DIMENSION\b" . --glob '!**/__tests__/**' --glob '!**/*.test.*'
src/lib/constants.ts:13:	FLUX_MAX_DIMENSION: 512,

rg -n "\bHD_DIMENSION\b" . --glob '!**/__tests__/**' --glob '!**/*.test.*'
src/lib/constants.ts:17:	HD_DIMENSION: 1024,

rg -n "\bSTANDARD_DIMENSION\b" . --glob '!**/__tests__/**' --glob '!**/*.test.*'
src/lib/constants.ts:19:	STANDARD_DIMENSION: 512,

```

## Findings not fixed

No critical findings were found. No other confident dead-code candidates were found in the recently modified production files.
