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
- Run `bun run lint` + `bunx tsc --noEmit` + `bun run test` before committing
- No external API keys; use Cloudflare bindings from `getEnv()`
- Per-request DB via `getDb()` from `@/db` (never global)
- After spawning agents, run `git status --porcelain` before committing
- Project core memory: `docs/knowledge/core-memory.md` (listed in `docs/INDEX.md`)
- Do not create dated AI review docs in `docs/reviews/`; update core memory instead

## Commands

```bash
bun run dev                # Local dev server (loads .env*.development)
bun run dev:cf             # Dev with local CF bindings (D1, R2, AI)
bun run build              # Production build
bun run preview            # Preview production build locally
bun run deploy             # Sync worker secrets + build + wrangler deploy
bun run lint               # Biome check
bun run lint:fix           # Biome auto-fix
bun run fmt                # Biome format
bun run test               # Vitest run
bun run test:watch         # Vitest watch mode
bun run format             # Biome format (alias of fmt)
bun run setup              # Create D1 + R2 + local migration
bun run setup:remote       # Same for production
bun run setup:ci           # Sync CI secrets
bun run db:generate        # Generate Drizzle migrations
bun run db:migrate:local   # Apply migrations locally
bun run db:migrate:remote  # Apply migrations to production
bun run db:studio          # Open Drizzle studio
TMPDIR=/private/tmp/stamp-tmp BUN_INSTALL_CACHE_DIR=/private/tmp/stamp-bun-cache bun install
git pull --ff-only origin main
git switch -c chore/<topic> origin/main
git log --since='<last-run-iso>' --name-only --pretty=format: | sed '/^$/d' | sort -u
git log --since='<last-run-iso>' --name-only --pretty=format: -- src | sed '/^$/d' | sort -u
git log --since='<last-run-iso>' --pretty=format:'%H %ad %s' --date=iso
git log --since='<last-run-iso>' --pretty=format:'%H %ad %s' --date=iso -- src
git log --since='<last-run-iso>' --no-merges --pretty=format:'%H %ad %s' --date=iso -- src
git log --since='<last-run-iso>' --no-merges --name-only --pretty=format: -- src | sed '/^$/d' | sort -u
git log --since='24 hours ago' --name-only --pretty=format: | sed '/^$/d' | sort -u
git log --since='7 days ago' --name-only --pretty=format: | sed '/^$/d' | sort -u
rg -n "<symbol>" src --glob '!**/__tests__/**' --glob '!**/*.test.*' --glob '!**/*.spec.*'   # dead-code evidence in non-test files
gh run list --branch main --limit 5
```

## Autonomous Maintenance

Follow `PLAN.md`: benchmark -> assess -> act -> verify -> ship.
Track progress in `memory/benchmark.md` and `memory/maintenance-log.md`.
After shipping: update `memory/roadmap.md` with next iteration.
