# stamp.builder

AI-powered postage stamp generator. Create unique vintage-style stamp illustrations from text prompts or photos.

**Live**: [stamp.builder](https://stamp.builder)

## Features

- Generate stamps from text prompts
- Multiple styles: Vintage, Modern, Botanical, Pop Art, Japanese Woodblock
- Public collection gallery
- Download and share stamps
- 5 free generations per day (no login required)

## Tech Stack

- Next.js 16 + Cloudflare Workers
- D1 (SQLite) + Drizzle ORM
- R2 for image storage
- Gemini 2.0 Flash for image generation
- Tailwind CSS v4 + Biome

## Getting Started

```bash
# Install
bun install

# Set up environment
cp .env.example .env.local
# Add your GEMINI_API_KEY

# Create D1 database
wrangler d1 create stamp-db
# Update wrangler.jsonc with database_id

# Run migrations
bun run db:migrate:local

# Start dev server
bun dev
```

## Deploy

```bash
bun run deploy
```

## License

MIT
