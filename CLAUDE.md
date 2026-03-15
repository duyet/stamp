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
- **AI**: CF Workers AI Flux Schnell (free) / Imagen 4 Fast (premium)
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

## Environment Variables

- `GEMINI_API_KEY` — (optional) Imagen 4 Fast for premium generation
- D1, R2, and AI bindings configured in `wrangler.jsonc`

## Autonomous Maintenance

When running autonomously (via `/loop` or cron), pick ONE action per iteration:

1. **Lint** — `bunx @biomejs/biome check .` and auto-fix
2. **Typecheck** — `bunx tsc --noEmit`
3. **Build** — `bun run build` — fix any failures
4. **Deploy** — `bun run deploy` — if there are unpushed changes
5. **Deploy verify** — `curl -s https://stamp.duyet.workers.dev` — confirm live
6. **Code review** — read a source file, check for bugs/security/quality issues
7. **Test** — add tests for untested code paths (API routes, lib functions)
8. **UI polish** — improve landing page, responsive layout, loading states, animations, accessibility
9. **Refactor** — extract duplicated patterns, simplify complex functions
10. **Dependency update** — check for outdated/vulnerable deps
11. **Docs sync** — ensure CLAUDE.md, README match actual code
12. **Plan next** — create tasks for upcoming features in memory/roadmap.md

Rules:
- Always commit + push after making changes
- Run lint + typecheck before committing
- Never skip build verification
- One focused action per iteration, not everything at once
- Log what was done to memory/maintenance-log.md
