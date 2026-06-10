# OneMore

Fitness training and coaching platform — web PWA (athlete + coach).

## Quick start (Phase 0)

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for Postgres, PgBouncer, Redis)

### 1. Infrastructure

```bash
docker compose -f docker/compose.dev.yml up -d
# Postgres: localhost:55432 · Redis: localhost:6380 · PgBouncer: localhost:6432
```

### 2. Environment

```bash
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 3. Install & database

```bash
pnpm install
pnpm --filter @onemore/api db:generate
pnpm --filter @onemore/api db:migrate
```

### 4. Development

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/health

## Monorepo layout

| Path                  | Description                |
| --------------------- | -------------------------- |
| `apps/web`            | Next.js 15 PWA             |
| `services/api`        | Express API + Prisma       |
| `packages/shared`     | Zod schemas, constants     |
| `packages/ui`         | shadcn-based UI components |
| `packages/api-client` | Typed REST client          |
| `docs/`               | PRD, ADRs, roadmap         |

## Documentation

| Start here                                                       | Description                  |
| ---------------------------------------------------------------- | ---------------------------- |
| [OneMore_PRD_Enterprise_v1.md](OneMore_PRD_Enterprise_v1.md)     | Product requirements outline |
| [docs/README.md](docs/README.md)                                 | Technical docs hub           |
| [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md) | Implementation phases        |

## Stack (V1)

Next.js 15 PWA · Node/Express · PostgreSQL · Redis · VPS Docker

See [Technical Spec v1](docs/Technical_Spec_v1.md).
