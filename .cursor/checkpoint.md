# OneMore — Project Checkpoint

**Updated:** 2026-06-10  
**Repository:** https://github.com/kevinlicenji/onemore  
**Branch:** `main`

---

## Latest commit

| Hash | Message |
|------|---------|
| `eca7275` | `docs(db): revise data model to v1.2 after schema audit` |

**Previous:** `96d70bc` — initial planning docs (PRD supplements, ADRs, technical spec, roadmap)

---

## Current phase

**Pre-implementation — planning complete, code not started.**

Next engineering step: **Phase 0** — monorepo bootstrap (`feat/mvp1-monorepo-bootstrap`).

See [docs/IMPLEMENTATION_ROADMAP.md](../docs/IMPLEMENTATION_ROADMAP.md) § Phase 0.

---

## What exists in the repo

| Area | Status |
|------|--------|
| Application code | None |
| PRD outline | [OneMore_PRD_Enterprise_v1.md](../OneMore_PRD_Enterprise_v1.md) |
| Technical spec | [docs/Technical_Spec_v1.md](../docs/Technical_Spec_v1.md) |
| Data model | [docs/prd/OneMore_Data_Model.md](../docs/prd/OneMore_Data_Model.md) **v1.2** |
| ADRs | 0001–0012 in [docs/adr/](../docs/adr/) |
| Implementation roadmap | MVP-1 → MVP-2 → MVP-3 → V2 billing |
| Legal templates | TODO — [docs/legal/README.md](../docs/legal/README.md) |
| Runbooks | TODO — [docs/runbooks/README.md](../docs/runbooks/README.md) |

---

## Locked decisions (summary)

| Topic | Decision |
|-------|----------|
| Platform V1 | Next.js 15 PWA (web-first; native deferred) |
| Backend | Node 22 + Express modular monolith, REST `/api/v1` |
| Database | PostgreSQL 16 + Prisma + Redis on VPS Docker |
| Offline | Dexie/IndexedDB + custom sync batch |
| Auth | Custom + Apple/Google OAuth; refresh tokens in DB |
| i18n | IT + EN from MVP-1 (`next-intl`) |
| Domain (provisional) | `app.onemore.com`, `api.onemore.com` |
| Exercise seed | wger.de (CC-BY-SA), ~150 curated |
| Coach billing V2 | Freemium 3 clients; Pro €29/mo (placeholder) |
| Marketplace V4 | Stripe Connect, 15% fee (placeholder) |

---

## Data model v1.2 highlights

- Auth tables: `user_credential`, `oauth_account`, `refresh_token`, `password_reset_token`
- Program rotation: `program_assignment.next_workout_day_id`
- Workout snapshots: `exercise_execution.prescription_snapshot`
- Progress: `body_weight_log`, `user_achievement`; fixed `personal_record` uniqueness
- Messaging: E2E only (`body_encrypted`); no server `sync_status`
- Removed redundancies: `role_flags`, assignment `program_id`, `day_index`, subscription `price_eur_cents`

---

## Open before public launch (not blocking dev)

- [ ] Legal: Terms, Privacy Policy, fitness consent text, coach DPA
- [ ] Confirm domain + OAuth redirect URIs for production
- [ ] wger attribution page in app
- [ ] Pentest / security review
- [ ] Coach Pro price and marketplace fee final values

---

## Suggested next actions

1. `git checkout -b feat/mvp1-monorepo-bootstrap`
2. P0-01 → P0-10 per roadmap
3. Prisma schema from Data Model v1.2 MVP-1 table list (§17)
