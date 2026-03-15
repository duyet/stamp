# stamp.builder

AI-powered postage stamp generator. Users describe or upload images, AI generates vintage-style stamp illustrations.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Cloudflare Workers via @opennextjs/cloudflare
- **Database**: Cloudflare D1 (SQLite at edge) with Drizzle ORM
- **Storage**: Cloudflare R2 (stamp images)
- **AI**: Google Gemini 2.0 Flash (image generation)
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

- `GEMINI_API_KEY` — Google Gemini API key for image generation
- D1 and R2 bindings configured in `wrangler.jsonc`
