# stamp.builders

![stamp.builders](public/stamp.png)

AI-powered postage stamp generator. Create unique vintage folk art stamp illustrations from text prompts.

**Live**: [stamp.builders](https://stamp.builders)

## Features

- Generate stamps from text prompts with AI
- 5 style presets: Vintage, Folk Art, Modern, Botanical, Portrait
- Auto prompt enhancement via Llama 3.1 8B
- Image generation via Flux Schnell (free, on Cloudflare Workers AI)
- Public collection gallery with stamp overlay modal
- Download and share stamps
- Analytics dashboard (/dashboard)
- 5 free generations per day, no account needed

## Tech Stack

- **Framework**: Next.js 16 (App Router) on Cloudflare Workers
- **Adapter**: @opennextjs/cloudflare
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Storage**: Cloudflare R2 (stamp images)
- **AI**: CF Workers AI (Flux Schnell + Llama 3.1 8B)
- **Styling**: Tailwind CSS v4 + Geist font
- **Linting**: Biome
- **Testing**: Vitest (101 tests)
- **CI**: GitHub Actions

## Getting Started

```bash
bun install
bun run setup          # Create D1 + R2 + local migration
bun dev                # Dev server (turbopack)
bun run dev:cf         # Dev with local CF bindings
```

## Deploy

```bash
bun run setup:remote   # First time: create remote D1 + R2
bun run deploy         # Build + deploy to CF Workers
```

## License

MIT
