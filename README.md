# Utpost

Plattform för friluftsdestinationer. Redaktionella guider, användarnas egna turer och bilder.

## Kom igång

```bash
pnpm install
pnpm db:up
pnpm seed
pnpm dev
```

Appen ligger sen på http://localhost:3000 och API:et pa http://localhost:4000.

## Struktur

Pnpm-monorepo:

- `apps/api` – Express + Postgres (Drizzle)
- `apps/web` – React + Vite
- `packages/` – delade paket (tomt idag, se `packages/README.md`)

## Deploy

Fråga Marcus.
