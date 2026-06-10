# ADR 0004: Database and persistence

**Status:** Accepted  
**Date:** 2026-06-10

## Context

10k MAU target, EU hosting, workout time-series, full exercise catalog offline, 10-person team, VPS Docker.

## Decision

### Primary database

- **PostgreSQL 16** self-hosted in Docker on VPS (same host MVP-1, dedicated DB container)
- **Prisma** ORM + Prisma Migrate
- **PgBouncer** sidecar for connection pooling

### Caching and queues

- **Redis 7** (Docker): refresh token index, rate limits, BullMQ, Socket.io adapter, optional session cache

### Multi-tenancy

- **Single database**, row-level isolation via `user_id` / relationship checks
- No `organization_id` until Enterprise tier

### Read replicas

- **Not in V1** — add when sustained >20k MAU or read p95 >300ms

### Search

- **PostgreSQL `tsvector`** on `exercise_library` (name, description, muscles) MVP-1
- Full catalog ~150–500 rows — sufficient without Elasticsearch

### Analytics snapshots

- **`analytics_snapshot` table** in Postgres (weekly Progress Score, volume) MVP-1–3
- External warehouse (ClickHouse/BigQuery) only if analytics queries impact OLTP

### Time-series

- **Plain Postgres** for workout data at 10k MAU — no TimescaleDB V1

### Soft delete

- `deleted_at` on: `user`, `program`, `message`, `lead`, `exercise_library` (custom), `coach_client_relationship`

### Migrations

- Prisma migrate on deploy (staging → prod)
- Risky changes: expand-contract pattern documented in runbook

### Backups

- **Daily** `pg_dump` to S3-compatible storage (Cloudflare R2)
- RPO: 24h, RTO: 4h
- Retention: 90 days rolling

### Data residency

- **Primary region: EU** — Hetzner Frankfurt (or equivalent EU VPS provider)

## Rationale

- Self-hosted Postgres matches VPS Docker workflow and cost control at 10k MAU.
- Prisma accelerates TS team and aligns with Zod validation layer.
