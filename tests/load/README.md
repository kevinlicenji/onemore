# k6 load tests (P8-02)

Load tests validate API behaviour under **200–500 concurrent virtual users** before public launch.

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed locally
- API running and reachable (staging recommended)
- Optional: pre-created test user credentials for authenticated scenarios

## Run

```bash
# Smoke load — health + API root (no auth)
k6 run tests/load/health.js

# Authenticated read load — set env vars first
export LOAD_BASE_URL=https://api.staging.onemore.com
export LOAD_TEST_EMAIL=load-test@example.com
export LOAD_TEST_PASSWORD='your-test-password'
k6 run tests/load/authenticated-read.js
```

## Targets (MVP-1 beta)

| Scenario                      | VUs | Duration | p95 threshold |
| ----------------------------- | --- | -------- | ------------- |
| Health                        | 200 | 2m       | &lt; 200ms    |
| Authenticated dashboard reads | 100 | 3m       | &lt; 500ms    |

Archive HTML/JSON reports in CI artifacts or `tests/load/reports/` before go-live.

## CI

Nightly workflow `.github/workflows/load-nightly.yml` runs the health scenario against staging when `LOAD_BASE_URL` is configured.
