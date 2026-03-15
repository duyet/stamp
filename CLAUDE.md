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

Follow @PLAN.md — benchmark → assess → act → verify → ship.
Track progress in memory/benchmark.md and memory/maintenance-log.md.
