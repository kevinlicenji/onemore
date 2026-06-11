# OneMore — Test strategy (Phase 0)

## Test types in this repo

| Type | Tool | Location | CI step |
|------|------|----------|---------|
| **Unit** | Vitest | `packages/*/src/**/*.test.ts`, `services/api/src/**/*.test.ts` | `pnpm test` |
| **Integration / endpoint** | Vitest + Supertest | `services/api/src/app.test.ts` | `pnpm test` |
| **Smoke** | Vitest + Supertest | `services/api/src/test/smoke.api.test.ts` | `pnpm test` |
| **Security smoke** | Vitest + Supertest | `services/api/src/test/security.api.test.ts` | `pnpm test` |
| **E2E (web)** | Playwright | `apps/web/e2e/*.spec.ts` | `pnpm test:e2e` |
| **E2E endpoint** | Playwright `request` | `apps/web/e2e/api-endpoint.spec.ts` | `pnpm test:e2e` |
| **Lint / static analysis** | ESLint | all packages | `pnpm lint` |
| **Typecheck** | TypeScript | all packages | `pnpm typecheck` |
| **Format** | Prettier | repo | `pnpm format:check` |
| **Dependency audit** | `pnpm audit` | lockfile | CI audit step |
| **Build verification** | Turbo build | all apps/packages | `pnpm build` |

## Not in Phase 0 (planned later)

| Type | When | Reference |
|------|------|-----------|
| **Full pentest** | Before public launch | ADR 0008, roadmap Phase 8 |
| **E2E athlete journey** | CI + nightly | `apps/web/e2e/athlete-journey.spec.ts` |
| **k6 load** | Weekly / pre-launch | `tests/load/` |
| **WCAG workout spot-check** | Pre-beta | `docs/tests/wcag-workout-spot-check.md` |
| **Load test (k6)** | Before public launch | ADR 0008 |
| **OpenAPI contract lint** | Phase 1+ when OpenAPI spec ships | Technical Spec §5.3 |

## Commands

```bash
# Unit + integration + smoke + security (Vitest)
pnpm test

# Playwright E2E (build required first)
pnpm build
pnpm test:e2e

# Static analysis suite
pnpm lint && pnpm typecheck && pnpm format:check
```
