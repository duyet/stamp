# Autonomous Maintenance Plan

Each `/loop` iteration: benchmark → assess → act → verify → ship.

## Phase 0: Benchmark

Run ALL and record to memory/benchmark.md:

```bash
LINT_WARNINGS=$(bunx @biomejs/biome check . 2>&1 | grep -c "warning" || echo 0)
LINT_ERRORS=$(bunx @biomejs/biome check . 2>&1 | grep -c "error" || echo 0)
TS_ERRORS=$(bunx tsc --noEmit 2>&1 | grep -c "error TS" || echo 0)
BUILD_OK=$(bun run build 2>&1 && echo "pass" || echo "fail")
BUNDLE_SIZE=$(du -sh .open-next/worker.js 2>/dev/null | cut -f1 || echo "n/a")
TEST_PASS=$(bunx vitest run 2>&1 | grep -oP '\d+ passed' || echo "0 passed")
TEST_FAIL=$(bunx vitest run 2>&1 | grep -oP '\d+ failed' || echo "0 failed")
FILE_COUNT=$(find src -name '*.ts' -o -name '*.tsx' | wc -l)
LINE_COUNT=$(find src -name '*.ts' -o -name '*.tsx' -exec cat {} + | wc -l)
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK\|XXX" src/ | wc -l || echo 0)
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://stamp.duyet.workers.dev)
SITE_LATENCY=$(curl -s -o /dev/null -w "%{time_total}" https://stamp.duyet.workers.dev)
UNPUSHED=$(git log origin/main..HEAD --oneline | wc -l)
UNCOMMITTED=$(git status --porcelain | wc -l)
```

"Better software" means ALL trending right:
- Lint warnings/errors → 0
- TS errors → 0
- Build → always pass
- Tests passing ↑, failing → 0
- TODOs ↓
- Site → 200, latency ↓
- Bundle size → stable or ↓
- Uncommitted/unpushed → 0

## Phase 1: Assess (spawn 3 agents in parallel)

- **Agent 1 (quality)**: `biome check .` + `tsc --noEmit` + `bun run build`
- **Agent 2 (deploy)**: verify live site, `git status`, unpushed commits
- **Agent 3 (review)**: pick one source file, scan for bugs/security/quality

Compare scores against previous iteration. Identify regressions or biggest gap.

## Phase 2: Act (highest-priority scenario based on benchmark)

### P0 — Build/Type Errors
Fix build failures, TS errors, runtime crashes.

### P1 — Deploy
If unpushed commits: `bun run deploy`. Verify site loads.

### P2 — Lint & Code Quality
Auto-fix biome warnings. Stricter types, remove unused imports/vars.

### P3 — Testing
Unit tests: `src/lib/rate-limit.ts`, `src/lib/generate-stamp.ts`, `src/lib/stamp-prompts.ts`.
Integration tests: `/api/generate`, `/api/stamps`, `/api/stamps/[id]/image`.
Use vitest. Edge cases: empty prompt, max length, rate limit, AI failure.

### P4 — Security Hardening
Input sanitization. CORS headers. Rate limit bypass protection.
XSS in collections. Validate R2 content types.

### P5 — UX/UI Polish
Landing: stamp fan animation, hover effects, responsive, dark mode.
Generate: loading skeleton, progress, error states, retry button.
Collections: infinite scroll, masonry grid, detail modal, share buttons.
Global: page transitions, favicon, OG images, meta tags.

### P6 — Performance
Next.js `<Image>` over `<img>`. Blur placeholders. `Cache-Control` headers.
Lazy load collections. Prefetch generate page. Measure generation latency.

### P7 — Accessibility
Contrast ratios, aria labels, keyboard navigation, screen reader support.
Focus management on forms. Prompt as alt text for stamps.

### P8 — Error Handling & Resilience
React error boundaries. Graceful AI fallback. Retry for R2/D1 transients.
Structured error logging. User-friendly error messages.

### P9 — New Features (from memory/roadmap.md)
Photo upload → stamp. Sharing with OG preview. Favorites (localStorage).
Download formats (PNG, SVG, PDF). Style mixing. Prompt history.
Collections filter by style. Stamp detail page.

### P10 — Database & Schema
Add indexes for slow queries. Schema migrations for features.
Cleanup orphaned R2 objects, expired rate limits.
Add `enhanced_prompt` column to stamps table.

### P11 — Monitoring & Observability
Structured logging: generation time, prompt length, style distribution.
Track rate limit hits, generation success/failure ratio.

### P12 — Dependency Management
`bun outdated`. Update safe minor/patch. Check security advisories.

### P13 — Refactor & Code Organization
Extract shared helpers. Consolidate types. Simplify >30-line functions.
Remove dead code. Consistent error handling across routes.

### P14 — SEO & Marketing
JSON-LD structured data. Sitemap. OG images for stamps. robots.txt.
Landing page copy. Social share meta tags.

### P15 — Documentation
Sync README with features. Update CLAUDE.md if patterns changed.
Inline comments for non-obvious logic.

### P16 — Plan Next
Review memory/maintenance-log.md. Update memory/roadmap.md.
Identify tech debt and plan to address it.

## Phase 3: Verify + Ship

1. `biome check .` + `tsc --noEmit` + `bun run build` — ALL must pass
2. If pass AND changes exist:
   - `git add` specific files (never `-A`)
   - Commit: semantic format + both co-authors
   - `git push`
   - `bun run deploy`
   - Verify: `curl -s -o /dev/null -w "%{http_code}" https://stamp.duyet.workers.dev` → 200
3. If verify fails: revert, log failure, do NOT push broken code
4. Re-run benchmark, append new row to memory/benchmark.md
5. Append to memory/maintenance-log.md:
   - What was done, which priority, what changed
   - Before/after benchmark scores
   - Whether deployed

## Agent Dispatch

| Task | Agent type | Isolation |
|------|-----------|-----------|
| Simple lint/format | `team-agents:junior-engineer` | — |
| Bug fix, error handling | `team-agents:senior-engineer` | — |
| New feature | `team-agents:senior-engineer` | `worktree` |
| Multi-file refactor | `team-agents:leader` | `worktree` |
| Code review | `feature-dev:code-reviewer` | — |
| Code cleanup | `code-simplifier` | — |
| Research | `team-agents:deep-research-agent` | — |
| Independent work | `run_in_background: true` | — |
