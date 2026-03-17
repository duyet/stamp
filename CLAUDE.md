# stamp.duyet.net

- **Domain**: https://stamp.duyet.net
- **Workers**: https://stamp.duyet.workers.dev
- **Repo**: git@github.com:duyet/stamp.git

## Rules

- Semantic commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Always include both co-authors:
  ```
  Co-Authored-By: Duyet Le <me@duyet.net>
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```
- Run `biome check .` + `tsc --noEmit` + `vitest run` before committing
- No external API keys — all AI via CF Workers AI bindings
- Cloudflare bindings via `getEnv()` from `@/lib/env`
- Per-request DB via `getDb()` from `@/db` (never global)
- No `export const runtime = "edge"` — OpenNext uses nodejs_compat
- After spawning agents, always `git status --porcelain` to catch unstaged work
- Images use `next/image` with `unoptimized: true` (CF Workers has no optimizer)

## Commands

```
bun dev                    # Dev server (turbopack)
bun run dev:cf             # Dev with local CF bindings (D1, R2, AI)
bun run build              # Next.js build
bun run deploy             # OpenNext build + wrangler deploy
bun run lint               # Biome check
bun run lint:fix           # Biome auto-fix
bun run test               # Vitest run
bun run test:watch         # Vitest watch mode
bun run setup              # Create D1 + R2 + local migration
bun run setup:remote       # Same for production
bun run db:generate        # Generate Drizzle migrations
bun run db:migrate:local   # Apply migrations locally
bun run db:migrate:remote  # Apply migrations to production
```

## Autonomous Maintenance

Follow @PLAN.md — benchmark → assess → act → verify → ship.
Track progress in memory/benchmark.md and memory/maintenance-log.md.
After shipping: brainstorm, update memory/roadmap.md, plan next iteration.
