# ADR 0002: Monorepo and frontend stack

**Status:** Accepted  
**Date:** 2026-06-10

## Context

Need one manageable codebase for web SPA, shared types, API contracts, and future service splits. Team: 2 frontend, shared design system.

## Decision

### Repository layout (Turborepo)

```
onemore/
├── apps/
│   └── web/                 # Next.js 15 App Router — athlete + coach UI
├── packages/
│   ├── api-client/          # Typed REST client, sync SDK
│   ├── shared/              # Types, validators (Zod), constants, i18n keys
│   ├── ui/                  # shadcn-based design system
│   └── eslint-config/
├── services/
│   └── api/                 # Express modular monolith
└── docs/
```

### Frontend stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 15** (App Router, `output: 'standalone'` for Docker) |
| Styling | **Tailwind CSS 4** + **shadcn/ui** |
| Server state | **TanStack Query v5** |
| Client / offline state | **Zustand** (active workout session) + **Dexie.js** (IndexedDB persistence) |
| Forms | **React Hook Form** + **Zod** |
| i18n | **next-intl** — locales `it`, `en` from MVP-1; additional EU languages MVP-2+ |
| PWA | **Serwist** (Service Worker for Next.js) |
| E2E | **Playwright** |

### UI language

- Code and comments: **English**
- User-facing strings: **Italian + English** from MVP-1 via next-intl
- Additional locales: MVP-2+

## Rationale

- Monorepo shares Zod schemas between API and web — critical for sync payload validation.
- shadcn + Tailwind matches fast iteration and WCAG-friendly components.
- Zustand + Dexie separates hot workout path from React render cycle (performance).

## Consequences

- Next.js chosen over Vite for mature PWA ecosystem, standalone Docker output, and team familiarity.
- `packages/ui` prevents coach/athlete visual drift.
