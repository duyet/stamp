# stamp.builder

- **Domain**: https://stamp.builder
- **Workers**: https://stamp.duyet.workers.dev
- **Repo**: git@github.com:duyet/stamp.git

## Rules

- Semantic commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Always include both co-authors:
  ```
  Co-Authored-By: Duyet Le <me@duyet.net>
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```
- Run `biome check .` + `tsc --noEmit` before committing
- No external API keys — all AI via CF Workers AI bindings
- Cloudflare bindings via `getEnv()` from `@/lib/env`
- Per-request DB via `getDb()` from `@/db` (never global)
- No `export const runtime = "edge"` — OpenNext uses nodejs_compat

## Commands

```
bun dev                    # Dev server
bun run build              # Next.js build
bun run deploy             # Build + deploy to CF Workers
bun run lint               # Biome check
bun run lint:fix           # Biome auto-fix
bun run setup              # Create D1 + R2 + local migration
bun run setup:remote       # Same for production
```

## Autonomous Maintenance

When running via `/loop` or cron, spawn parallel agents. Each iteration: assess → act → verify → ship.

### Phase 1: Assess (spawn 3 agents in parallel)

- **Agent 1 (quality)**: `biome check .` + `tsc --noEmit` + `bun run build`
- **Agent 2 (deploy)**: `curl -s https://stamp.duyet.workers.dev`, `git status`, check for unpushed commits
- **Agent 3 (review)**: pick one source file, scan for bugs/security/quality issues

### Phase 2: Act (pick highest-priority scenario)

**P0 — Build/Type Errors**
Fix any build failures, TS errors, or runtime crashes found in Phase 1.

**P1 — Deploy**
If unpushed commits exist: `bun run deploy`. Verify site loads after deploy.

**P2 — Lint & Code Quality**
Auto-fix biome warnings. Add missing return types, stricter null checks, remove unused imports/vars.

**P3 — Testing**
Add unit tests for: `src/lib/rate-limit.ts`, `src/lib/generate-stamp.ts`, `src/lib/stamp-prompts.ts`.
Add integration tests for API routes: `/api/generate`, `/api/stamps`, `/api/stamps/[id]/image`.
Use vitest. Aim for edge cases: empty prompt, max length, rate limit exceeded, AI failure.

**P4 — Security Hardening**
Input sanitization on prompts. CORS headers on API routes. Rate limit bypass protection.
Check for XSS in user-submitted prompts displayed in collections. Validate content types from R2.

**P5 — UX/UI Polish**
Landing page: stamp fan animation, hover effects, responsive breakpoints, dark mode support.
Generate page: loading skeleton, progress indicator, error states with retry button.
Collections page: infinite scroll, masonry grid, stamp detail modal, share buttons.
Global: page transitions, favicon, OG images, meta tags per page.

**P6 — Performance**
Optimize images: use Next.js `<Image>` instead of `<img>`, add blur placeholders.
Add `Cache-Control` headers. Lazy load collections grid. Prefetch generate page.
Measure and log generation latency. Add request timing headers.

**P7 — Accessibility**
Run accessibility audit on all pages. Fix contrast ratios, aria labels, keyboard navigation.
Screen reader support for stamp cards. Focus management on generate form.
Alt text for all generated stamps (use prompt as alt).

**P8 — Error Handling & Resilience**
Add error boundaries for React components. Graceful fallback when AI binding unavailable.
Retry logic for transient R2/D1 failures. Structured error logging with context.
User-friendly error messages for all failure modes.

**P9 — New Features** (from memory/roadmap.md)
Photo upload → stamp conversion. Stamp sharing with OG image preview.
User favorites (localStorage). Stamp download in multiple formats (PNG, SVG, PDF).
Style mixing (combine two presets). Prompt history (localStorage).
Collections filtering by style. Stamp detail page with metadata.

**P10 — Database & Schema**
Add indexes if queries are slow. Schema migrations for new features.
Data cleanup: remove orphaned R2 objects, expired rate limits.
Add `enhanced_prompt` column to stamps table for debugging.

**P11 — Monitoring & Observability**
Check CF dashboard for error rates, latency spikes, worker exceptions.
Add structured logging: generation time, prompt length, style distribution.
Track rate limit hits and generation success/failure ratio.

**P12 — Dependency Management**
Run `bun outdated`. Update safe minor/patch versions.
Check for security advisories. Pin major versions that might break.

**P13 — Refactor & Code Organization**
Extract shared API response helpers. Consolidate type definitions.
Simplify complex functions (>30 lines). Remove dead code paths.
Ensure consistent error handling patterns across all routes.

**P14 — SEO & Marketing**
Add structured data (JSON-LD) for stamps. Sitemap generation.
OG image generation for shared stamps. robots.txt.
Landing page copy improvements. Social share meta tags.

**P15 — Documentation**
Sync README with current features. Update CLAUDE.md if patterns changed.
Add inline code comments for non-obvious logic. Update .env.example.

**P16 — Plan Next**
Review what's been done in memory/maintenance-log.md.
Update memory/roadmap.md with prioritized next features.
Identify tech debt and create plan to address it.

### Phase 3: Verify + Ship (parallel agents)

- **Agent A**: `biome check .` + `tsc --noEmit` + `bun run build` — must all pass
- **Agent B**: commit (semantic format + co-authors) + push + deploy if needed
- Append summary to memory/maintenance-log.md

### Agent dispatch

| Task | Agent type | Isolation |
|------|-----------|-----------|
| Simple lint/format fix | `team-agents:junior-engineer` | — |
| Bug fix, error handling | `team-agents:senior-engineer` | — |
| New feature | `team-agents:senior-engineer` | `worktree` |
| Multi-file refactor | `team-agents:leader` | `worktree` |
| Code review | `feature-dev:code-reviewer` | — |
| Code cleanup | `code-simplifier` | — |
| Research/investigation | `team-agents:deep-research-agent` | — |
| All independent agents | `run_in_background: true` | — |
