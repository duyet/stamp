# stamp.builder

AI-powered postage stamp generator. Create unique vintage-style stamp illustrations from text prompts or photos.

**Live**: [stamp.builder](https://stamp.builder)

## Features

- Generate stamps from text prompts
- Multiple styles: Vintage, Modern, Botanical, Pop Art, Japanese Woodblock
- Auto prompt enhancement via LLM
- Public collection gallery
- Download and share stamps
- 5 free generations per day (no login required)

## Tech Stack

- Next.js 16 + Cloudflare Workers
- D1 (SQLite) + Drizzle ORM
- R2 for image storage
- CF Workers AI (Flux Schnell + Llama 3.1 8B)
- Tailwind CSS v4 + Biome

## Getting Started

```bash
# Install
bun install

# Setup D1 + R2 + migrations
bun run setup

# Start dev server
bun dev
```

## Deploy

```bash
# Setup remote resources (first time)
bun run setup:remote

# Build + deploy
bun run deploy
```

## License

MIT
