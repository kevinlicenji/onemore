# ADR 0009: Media storage by MVP phase

**Status:** Accepted  
**Date:** 2026-06-10

## Decision

| Phase | Media | Storage | Admin controls |
|-------|-------|---------|----------------|
| MVP-1 | None | — | — |
| MVP-2 | Profile avatars, exercise images (static) | Cloudflare R2 EU | `max_profile_image_mb`, `max_exercise_image_mb`, allowed MIME types |
| MVP-3 | Exercise videos | R2 + CDN | `max_video_mb`, `max_video_duration_sec`, MIME whitelist |

### Upload flow

- Client → `POST /api/v1/media/upload-intent` → presigned R2 URL → direct upload → confirm
- Server validates size/MIME against `system_settings` table (admin UI MVP-2)

### Processing

- Images: optional sharp resize server-side on confirm
- Video MVP-3: store original; transcoding deferred (admin enforces max size/duration at upload)

## Rationale

- R2 EU-compatible, no egress fees to Cloudflare CDN, fits VPS offload model.
