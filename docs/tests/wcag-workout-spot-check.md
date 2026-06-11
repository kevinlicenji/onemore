# WCAG spot-check — workout screen (P8-03)

Manual + automated checks for the active workout view (`/workouts/[sessionId]`).

## Automated (CI)

`apps/web/e2e/a11y-workout.spec.ts` verifies primary buttons meet **44×44px** minimum touch targets (WCAG 2.5.5 AAA target size guidance).

## Manual checklist

| Check | Pass criteria | Status |
|-------|---------------|--------|
| Touch targets | Complete set, skip, finish workout ≥ 44px | ☐ |
| Contrast | Text on background ≥ 4.5:1 (body), 3:1 (large) | ☐ |
| Focus visible | Keyboard tab order logical; focus ring visible | ☐ |
| Labels | Weight/reps inputs have visible labels | ☐ |
| Error text | Errors not color-only (includes message) | ☐ |
| Motion | Rest timer can be skipped | ☐ |
| Screen reader | Exercise name announced as heading | ☐ |

## Tools

- Chrome DevTools → Accessibility tree
- axe DevTools browser extension (optional)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Sign-off

Design + FE sign before beta cohort (P8-08).
