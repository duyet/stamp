# stamp.builder

AI-powered postage stamp generator. Users describe or upload images, AI generates vintage-style stamp illustrations.

- **Domain**: https://stamp.builder
- **Workers URL**: https://stamp.duyet.workers.dev
- **Repo**: git@github.com:duyet/stamp.git

## Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Cloudflare Workers via @opennextjs/cloudflare
- **Database**: Cloudflare D1 (SQLite at edge) with Drizzle ORM
- **Storage**: Cloudflare R2 (stamp images)
- **AI**: CF Workers AI (Flux Schnell for images, Llama 3.1 for prompt enhancement)
- **Package Manager**: Bun
- **Linting/Formatting**: Biome
- **Styling**: Tailwind CSS v4

## Commands

```bash
bun dev              # Local dev server (turbopack)
bun run preview      # Build + preview on Workers
bun run deploy       # Deploy to Cloudflare Workers
bun run lint         # Biome check
bun run lint:fix     # Biome auto-fix
bun run db:generate  # Generate Drizzle migrations
bun run db:migrate:local   # Apply migrations locally
bun run db:migrate:remote  # Apply migrations to production D1
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/             # API routes (generate, stamps)
│   ├── collections/     # Public stamp gallery
│   └── generate/        # Stamp creation page
├── components/          # React components
├── db/                  # Drizzle schema + database client
├── lib/                 # Utilities (env, rate-limit, prompts, generation)
└── types/               # TypeScript declarations (Cloudflare bindings)
```

## Git Conventions

- **Semantic commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- **Co-authors** (always include both):

```
Co-Authored-By: Duyet Le <me@duyet.net>
Co-Authored-By: duyetbot <bot@duyet.net>
```

## Key Patterns

- Cloudflare bindings accessed via `getEnv()` from `@/lib/env`
- Rate limiting: 5 free generations/day per IP, tracked in D1
- Stamps stored in R2, served via `/api/stamps/[id]/image`
- All stamps optionally public (shown in `/collections`)

## Bindings

All configured in `wrangler.jsonc` — no external API keys needed:
- `DB` — D1 database
- `STAMPS_BUCKET` — R2 bucket for stamp images
- `AI` — Workers AI (Flux Schnell + Llama 3.1 8B)

## Autonomous Maintenance

When running autonomously (via `/loop` or cron), spawn agents in parallel for max throughput.

### Phase 1: Assess (parallel agents)

Spawn these agents simultaneously:
- **Agent 1 (quality)**: `biome check .` + `tsc --noEmit` + `bun run build` — report issues
- **Agent 2 (deploy check)**: verify https://stamp.duyet.workers.dev is live, check git status for unpushed changes
- **Agent 3 (code review)**: pick one source file, review for bugs/security/quality

### Phase 2: Act (pick highest-priority issue from Phase 1)

P0 — Fix broken: build errors, type errors, runtime crashes
P1 — Deploy: if unpushed changes exist, build + deploy
P2 — Quality: fix lint warnings, improve error handling, types
P3 — Testing: add tests for untested paths (spawn junior-engineer agent)
P4 — UX/UI: improve design, responsiveness, accessibility (spawn senior-engineer agent)
P5 — Features: implement from memory/roadmap.md (spawn senior-engineer in worktree)
P6 — Refactor: simplify, extract utils (spawn code-simplifier agent)
P7 — Docs: sync CLAUDE.md + README with reality
P8 — Plan: update memory/roadmap.md with next features

### Phase 3: Verify + Ship (parallel)

- **Agent A**: `biome check .` + `tsc --noEmit` + `bun run build`
- **Agent B**: commit + push + deploy (if needed)
- Log what was done to memory/maintenance-log.md

Rules:
- Use `team-agents:leader` for complex multi-file tasks
- Use `team-agents:junior-engineer` for simple lint/format fixes
- Use `team-agents:senior-engineer` for features/refactors
- Use `feature-dev:code-reviewer` for code review
- Always spawn agents with `run_in_background: true` when independent
- One iteration = assess → act → verify → ship
