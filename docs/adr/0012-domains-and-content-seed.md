# ADR 0012: Domains and content seed strategy

**Status:** Accepted (provisional domains)  
**Date:** 2026-06-10

## Decision

### Domains (provisional)

| Env | Web | API |
|-----|-----|-----|
| Production | `https://app.onemore.com` | `https://api.onemore.com` |
| Staging | `https://staging.onemore.com` | `https://api.staging.onemore.com` |
| Development | `http://localhost:3000` | `http://localhost:4000` |

- **onemore.com is not final** — all URLs driven by env vars (`WEB_URL`, `API_URL`)
- Update OAuth redirect URIs when domain changes

### Exercise seed

- Import from **wger.de** API (CC-BY-SA 3.0), curate ~150 exercises
- Attribution on Credits page
- See [OneMore_Seed_Content.md](../prd/OneMore_Seed_Content.md)

### Program templates

- Engineering-defined **4 templates** in seed script (not user-authored at launch)

### Design

- **shadcn/ui defaults**, mobile-first; custom brand deferred

## Consequences

- No Figma dependency for MVP-1 start
- Legal review wger attribution before public launch
