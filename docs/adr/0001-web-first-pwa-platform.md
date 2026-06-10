# ADR 0001: Web-first responsive SPA + PWA

**Status:** Accepted  
**Date:** 2026-06-10  
**Deciders:** Product + Engineering

## Context

OneMore needs a super-responsive, fluid experience for athletes and coaches on phone and desktop. Native mobile apps are deferred until after V1 web validation.

## Decision

1. **V1 platform:** Single responsive web application (SPA) usable on mobile browsers and desktop.
2. **PWA:** Enable installable PWA with Service Worker for offline workout data entry and local consultation.
3. **Native apps:** Evaluate after V1 (React Native vs continued PWA vs native) based on offline reliability on iOS and engagement metrics.
4. **Coach access:** Same web app with role-based routes — no separate coach-only codebase in V1/V2.

## Rationale

- One codebase for athlete + coach aligns with 2 frontend developers and phased MVP.
- PWA + IndexedDB satisfies offline workout requirements without App Store delay.
- Team has React/Next expertise per project standards.
- iOS PWA limitations (background sync, storage quotas) are acceptable for V1 beta; native remains an escape hatch.

## Consequences

### Positive

- Faster MVP-1 delivery; unified deploy pipeline.
- Coach on phone + desktop without separate mobile coach app.

### Negative / risks

- **iOS PWA offline:** Background sync and push are less reliable than native; document in QA matrix.
- **Gym UX:** Add-to-home-screen onboarding flow required for best mobile experience.
- **E2E encrypted messaging (MVP-2):** Key exchange requires online session; offline message compose queues until online.

### Mitigations

- Mobile-first CSS, 44px touch targets, workout route optimized for one-hand use.
- Monitor iOS offline sync failure rate; gate native app decision on metric >5% failure.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| React Native V1 | Doubles platform work before product validation |
| Separate coach web app | Duplicate auth, sync, and UI maintenance |
| Vite SPA without PWA | Offline requirement not met |
