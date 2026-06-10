# ADR 0005: Offline sync protocol

**Status:** Accepted  
**Date:** 2026-06-10

## Context

Offline data entry and consultation required without network. Sync needed for coach ↔ athlete when online. Web PWA platform.

## Decision

### Local storage (client)

- **IndexedDB via Dexie.js**
- Tables mirror: `programs`, `program_versions`, `workout_days`, `program_exercises`, `exercise_library` (full catalog), `workout_sessions`, `exercise_executions`, `set_logs`, `sync_queue`, `sync_metadata`

### Offline scope

| Action | Offline |
|--------|---------|
| Start/complete workout, log sets | Yes |
| Browse history (cached) | Yes |
| Browse full exercise catalog | Yes (synced on login / weekly refresh) |
| Create/edit own program | Yes (sync on reconnect) |
| Coach view client data | No — requires network |
| Coach ↔ client messaging | Compose offline optional; send requires network |
| GDPR export | No |

### Sync protocol

1. Client pushes `POST /api/v1/sync/batch` with ordered mutations + `Idempotency-Key`
2. Payload: sessions, executions, sets with **client-generated UUIDs**
3. Server ACK per entity; returns server-side PR reconciliation + conflicts
4. Client pulls `GET /api/v1/sync/delta?since=timestamp` for coach assignments, messages, program updates

### Conflict resolution

- **Per `set_id`:** last-write-wins using `client_timestamp` (server wins on exact tie)
- **Program edits:** if client has unpublished local program edits and server version newer → server wins; client notified to merge manually (MVP-2 coach assignment overrides local copy with confirm dialog)

### Retention caps (local)

- Pending sync: max **200 sessions** or **90 days** — oldest synced sessions pruned from IndexedDB
- Full catalog always retained (~&lt;5MB)

### Identifiers

- **UUID v4** client-generated for `workout_session`, `set_log`, `exercise_execution`

### Encryption (local)

- MVP-1: HTTPS in transit; IndexedDB not encrypted (browser sandbox)
- MVP-2 messaging keys: **Web Crypto API** — keys in IndexedDB encrypted with user-derived key from online login session

## Critique (product requirement #14)

**Coach-athlete sync only online is correct** for MVP-1 (no coach). For MVP-2:

- Athlete offline workouts sync when online — coach sees data after sync (acceptable delay).
- Coach cannot assign program offline — must be online (acceptable).
- **Risk:** athlete completes week offline, coach sees stale dashboard — mitigated by "last synced at" indicator on coach client view.
- **iOS PWA risk:** periodic background sync unreliable — athlete must open app online to sync; show persistent "sync pending" badge.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| PowerSync / ElectricSQL | Vendor cost + VPS self-host complexity |
| LocalStorage | Size limits for full catalog + history |
