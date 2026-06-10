# ADR 0010: Enterprise SSO deferred

**Status:** Accepted  
**Date:** 2026-06-10

## Context

Enterprise tier (gyms, SSO, SCIM) is post-MVP per [OneMore_Enterprise_Positioning.md](../prd/OneMore_Enterprise_Positioning.md). Auth architecture must not block future OIDC.

## Decision

1. **No SSO login in V1–V3 (Coach Pro).**
2. **Stub in V1:** `oidc_provider_config` table (inactive) + auth module interface `EnterpriseIdentityProvider`.
3. **Enterprise tier targets (when started):** Microsoft Entra, Google Workspace, Okta — priority order by design partner demand.
4. **Provisioning:** invite-only org onboarding initially; SCIM phase 2 of Enterprise.
5. **Org hierarchy:** flat org (single gym) first; multi-branch in Enterprise phase 2.

## Rationale

Avoids shipping Keycloak on VPS prematurely; stub keeps refactor bounded.

## Consequences

- Coach Pro coaches use email/OAuth only until Enterprise.
- No architectural blocker when Enterprise starts — add OIDC callback routes + org middleware.
