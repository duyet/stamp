# Code smell and dead-code review - 2026-05-06

Scope: commits in the last seven days (no new commit found since last run at 2026-05-04T21:01:16.982Z).

## Findings fixed

### Warning: stale contributor workflow docs in `CLAUDE.md`

`CLAUDE.md` contained commands and runtime notes from an old Next/OpenNext setup that conflict with current repo scripts (`package.json` uses Vite/TanStack Start + Wrangler deploy).

Fixed by syncing `CLAUDE.md` and adding `AGENTS.md` with the current command set and checks.

Evidence:

```text
git log --since='2026-05-04T21:01:16Z' --oneline --no-merges
# (no output)

git log --since='7 days ago' --oneline --no-merges
f7962f1 feat: show account credit balance
0abef39 feat(dashboard): redesign analytics console
1f3a57d fix: allow admin email whitelist
...

# package.json scripts include:
"dev": "... vite dev ..."
"build": "vite build"
"deploy": "... ./scripts/sync-worker-secrets.sh && vite build && wrangler deploy ..."
```

## Dead code candidates

No confident dead-code candidates found in recently modified non-test files.

Search evidence (sample):

```text
rg -n "\\bCREDITS_CHANGED_EVENT\\b" src
src/components/credit-balance.tsx:10:export const CREDITS_CHANGED_EVENT = "credits:changed";
src/components/generate-form.tsx:4:import { CREDITS_CHANGED_EVENT } from "@/components/credit-balance";
src/components/generate-form.tsx:198:      window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT));
```

## Bugs / CI / perf

- No new post-last-run commits, so no fresh bug-introducing diff to patch.
- CI-like local checks were partially blocked by environment, not code:
  - `bun run lint`: passes with one schema-version info notice.
  - `bun run test`: failed because `vitest` binary is unavailable in this sandbox.
  - `bunx tsc --noEmit`: failed because Bun temp-dir write was denied in this sandbox.
- No measurable performance regression signal was found in the recent commit window.
  Suggested next measurement: capture dashboard API latency p50/p95 before/after next analytics-related commit.
