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

When running via `/loop` or cron, spawn parallel agents:

### Phase 1: Assess (parallel)
- Agent 1 (quality): `biome check .` + `tsc --noEmit` + `bun run build`
- Agent 2 (deploy): verify live site, check for unpushed changes
- Agent 3 (review): pick one source file, review for bugs/security

### Phase 2: Act (highest priority from Phase 1)
- P0: fix build/type/runtime errors
- P1: deploy if unpushed changes
- P2: fix lint warnings, improve types
- P3: add tests (spawn junior-engineer)
- P4: UI/UX polish (spawn senior-engineer)
- P5: features from memory/roadmap.md (spawn senior-engineer in worktree)
- P6: refactor (spawn code-simplifier)
- P7: sync docs with code
- P8: plan next features in memory/roadmap.md

### Phase 3: Verify + Ship (parallel)
- Agent A: `biome check .` + `tsc --noEmit` + `bun run build`
- Agent B: commit + push + deploy
- Log to memory/maintenance-log.md

### Agent types
- `team-agents:leader` — complex multi-file tasks
- `team-agents:junior-engineer` — simple fixes
- `team-agents:senior-engineer` — features/refactors
- `feature-dev:code-reviewer` — code review
- Spawn with `run_in_background: true` when independent
