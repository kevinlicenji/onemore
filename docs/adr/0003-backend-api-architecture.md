# ADR 0003: Backend API architecture

**Status:** Accepted  
**Date:** 2026-06-10

## Context

3 backend developers, VPS Docker deploy, offline sync with idempotency, coach features in MVP-2+. User requested split per best practices without premature microservice ops burden.

## Decision

### Runtime and style

- **Node.js 22 + Express + TypeScript (strict)**
- **REST API** at `/api/v1/*` with explicit deprecation policy (ADR implied in spec)
- **OpenAPI 3.1** spec generated from Zod schemas (`@asteasolutions/zod-to-openapi`)

### Deployment model: modular monolith

Single `services/api` Docker image with **bounded modules** (not separate deployables in V1):

| Module | Responsibility | MVP phase |
|--------|----------------|-----------|
| `auth` | Registration, OAuth, JWT, sessions | MVP-1 |
| `users` | Profile, username, consent, GDPR export/delete | MVP-1 |
| `programs` | Programs, versions, templates, assignments | MVP-1 |
| `workouts` | Sessions, sets, sync, PR hooks | MVP-1 |
| `exercises` | Library, custom exercises, search | MVP-1 |
| `analytics` | Volume, streak, snapshots | MVP-1 basic |
| `notifications` | Push, email triggers, in-app | MVP-1 basic |
| `coach` | Relationships, client views | MVP-2 |
| `messaging` | WebSocket + E2E message store | MVP-2 |
| `crm` | Leads, pipeline, activity log | MVP-3 |

Modules communicate in-process only. **Extract to separate services** when a module needs independent scaling (target: MVP-3+ if WebSocket/coach load warrants).

### API versioning

- Prefix: `/api/v1`
- Deprecation: `Sunset` header + 6-month minimum notice in changelog
- Breaking changes only in `/api/v2`

### Idempotency

- Header `Idempotency-Key` on `POST` sync and mutation endpoints
- Server stores key + response 24h

### Background jobs

- **Redis 7** + **BullMQ** from MVP-1
- Jobs MVP-1: email (Resend), GDPR export generation, analytics weekly batch (MVP-3)
- Cron: backup verification, session cleanup

### Real-time (MVP-2)

- **Socket.io** on same API process with **Redis adapter** for horizontal scale
- Fallback: HTTP polling every 30s if WebSocket fails

## Rationale

- REST + batch sync simpler for offline than GraphQL.
- Modular monolith = one VPS deploy, clear boundaries for 3 backend devs.
- BullMQ + Redis already needed for rate limiting and sessions.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| GraphQL | Offline sync and mobile-first caching harder |
| Microservices V1 | Ops overhead on single VPS |
| FastAPI | Split stack from frontend TS ecosystem |
