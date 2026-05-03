# Deities and Demigods

A dark fantasy AI-powered mythic RPG rebuilt from the uploaded specification bundle.

## Local Setup

```bash
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run prisma:push
npm.cmd run dev
```

Create `.env.local` from `.env.example` and set `OPENROUTER_API_KEY` for live AI DM turns. The SQLite URL is `file:../db/custom.db` because Prisma resolves it relative to `prisma/schema.prisma`. Without the key, the game UI still runs and falls back gracefully when the DM cannot be reached.

## Portraits

Portrait paths use:

```text
public/portraits/{category}/{id}.png
```

Run the manifest generator:

```bash
npm.cmd run portraits
```

It writes `public/portraits/manifest.json` with 1980s dark fantasy oil-painting prompts for the full roster and skips already cached PNGs.
