# OneMore — Project Checkpoint

**Updated:** 2026-06-10  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `feat/mvp1-offline-sync` (PR pending)

---

## Latest state

**Phase 5 — Offline sync** on `feat/mvp1-offline-sync`:

- API: `POST /sync/batch` (idempotent, LWW merges), `GET /sync/delta`
- Dexie IndexedDB: exercises, sessions, next workout snapshot, sync queue
- Web: local-first workout client, hydrate on login, flush on reconnect
- Sync status badge on dashboard with manual retry

**Phase 4** merged in `main` (PR #5).

**Phase 3** merged in `main` (PR #4).

---

## Next step

Merge Phase 5 PR, then **Phase 6 — History, PR detection, analytics** per roadmap.

---

## Quick start

```bash
docker compose -f docker/compose.dev.yml up -d
pnpm install
pnpm --filter @onemore/api db:migrate
pnpm --filter @onemore/api seed
pnpm dev
```

---

## Tests

```bash
pnpm test && pnpm build && pnpm test:e2e
```
