# stamp.duyet.net

![stamp.duyet.net](public/stamp.png)

AI-powered postage stamp generator. Create unique vintage folk art stamp illustrations from text prompts.

**Live**: [stamp.duyet.net](https://stamp.duyet.net) | [stamp.duyet.workers.dev](https://stamp.duyet.workers.dev)

## Features

- Generate stamps from text prompts with AI
- 10 style presets: Vintage, Folk Art, Modern, Botanical, Portrait, Watercolor, Woodcut, Engraved, Pixel, Risograph
- Auto prompt enhancement via Llama 3.1 8B
- LLM-generated stamp descriptions
- Standard generation via Flux 1 Schnell (free)
- HD generation via Flux 2 Klein 9B (1024x1024)
- Public collection gallery with stamp overlay modal
- Download and share stamps
- Clerk authentication with free tier (20/day guest, 100/day signed in)
- Analytics dashboard (/dashboard)

## AI Models

All models run on Cloudflare Workers AI (free tier, no API keys needed).

| Model | Purpose |
|-------|---------|
| `@cf/meta/llama-3.1-8b-instruct` | Prompt enhancement + description generation |
| `@cf/black-forest-labs/flux-1-schnell` | Standard image generation (512x512, 8 steps) |
| `@cf/black-forest-labs/flux-2-klein-9b` | HD image generation (1024x1024, 4 steps) |

## Tech Stack

- **Framework**: Next.js 16 (App Router) on Cloudflare Workers
- **Adapter**: @opennextjs/cloudflare
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Storage**: Cloudflare R2 (stamp images)
- **Auth**: Clerk
- **Conversation History**: [AgentState](https://agentstate.app) — persistent AI conversation storage
- **Styling**: Tailwind CSS v4 + Geist font
- **Linting**: Biome
- **Testing**: Vitest (415 tests)
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
