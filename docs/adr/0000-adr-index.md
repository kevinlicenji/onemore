# Architecture Decision Records — Index

OneMore ADRs document significant technical and architectural decisions. Status: **Accepted** unless marked otherwise.

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-web-first-pwa-platform.md) | Web-first responsive SPA + PWA (defer native mobile) | Accepted |
| [0002](./0002-monorepo-and-frontend-stack.md) | Turborepo, Next.js, Tailwind, shadcn, state management | Accepted |
| [0003](./0003-backend-api-architecture.md) | Node/Express modular monolith, REST v1, jobs | Accepted |
| [0004](./0004-database-and-persistence.md) | PostgreSQL, Prisma, Redis, search, retention | Accepted |
| [0005](./0005-offline-sync-protocol.md) | IndexedDB, custom REST sync, conflict rules | Accepted |
| [0006](./0006-authentication-and-identity.md) | Custom auth, OAuth, JWT cookies, username policy | Accepted |
| [0007](./0007-infrastructure-and-deployment.md) | VPS Docker, CI/CD, Cloudflare, backups | Accepted |
| [0008](./0008-security-observability-testing.md) | WAF, audit, E2E msgs, Sentry, Playwright | Accepted |
| [0009](./0009-media-storage-mvp-phases.md) | Images MVP-2, video MVP-3, admin limits | Accepted |
| [0010](./0010-enterprise-sso-deferred.md) | Enterprise SSO/OIDC deferred; stub only | Accepted |
| [0011](./0011-monetization-and-legal-model.md) | Coach freemium (3 clients), Stripe Connect, GDPR roles | Accepted |
| [0012](./0012-domains-and-content-seed.md) | onemore.com provisional, wger seed, 4 templates | Accepted |

**Companion:** [Technical Spec v1](../Technical_Spec_v1.md)

### Launch-time parameters (placeholders — revise before launch)

| Parameter | Placeholder value |
|-----------|-------------------|
| Coach Pro monthly price | **€29/month** EUR |
| Marketplace platform fee | **15%** |
| Upgrade UX | Block 4th client only → [Coach Billing UX](../prd/OneMore_Coach_Billing_UX.md) |
