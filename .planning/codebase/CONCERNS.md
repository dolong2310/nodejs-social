# Technical Concerns and Debt

**Analysis Date:** 2026-05-02

## Configuration and operability

- **Strict env at startup:** `src/bootstrap/config/env.config.ts` requires every key in `ENV_KEYS` to be a non-empty string; missing `.env.<mode>` or any blank variable aborts the process. This is safe for production discipline but increases friction for new contributors who must mirror `.env.example` completely.
- **Secrets in environment:** JWT secrets, AWS keys, and Google client secret are conventional env vars — rotation and least-privilege IAM for S3/SES remain operational concerns outside the codebase.

## Layering and coupling

- **Application vs infrastructure:** `src/modules/common/utils/video.util.ts` notes application should not depend on infrastructure (`path` usage) — boundary leaks risk harder testing and circular imports.
- **Presentation constants in workers:** `video-stream.worker.ts` imports `UPLOAD_DIR_VIDEO` from presentation-layer constants — layering violation and harder reuse if workers move to separate processes.

## Security and privacy

- **OTP logging:** `send-otp.interactor.ts` contains a `console.log` of generated OTP with an explicit TODO to remove after testing — must not ship to production; risk of credential leakage in logs.
- **Auth guard DB hits:** `auth.guard.ts` loads role per request with a TODO to cache via Redis — under load, Mongo read amplification on every authenticated request.
- **User validator N+1:** `user.validator.ts` fetches user by ID with TODO for Redis cache — similar latency and database pressure patterns.

## Error handling and invariants

- **Friend repository:** `friend-request.impl.repository.ts` rethrows `error.message` string in one path — callers may lose structured error types and complicate consistent API error mapping.
- **Refresh token path:** `refresh-token.interactor.ts` has a TODO around JWT error typing after `invariant` — edge cases could surface as generic failures if not fully covered by tests.

## Consistency and product polish

- **2FA issuer string:** Hardcoded `'Social App'` in `src/infrastructure/services/2fa.service.ts` with TODO to use configurable app name — minor branding/config inconsistency.
- **OTP expiry in code:** `send-otp.interactor.ts` uses fixed `ms('5m')` with TODO to align with `OTP_EXPIRES_AT` env — risk of mismatch between documented env and actual behavior.

## Performance and maintenance

- **Large query modules:** `post-query.impl.repository.ts` carries a TODO to move logic to utils — file complexity may slow changes and increase regression risk.
- **Notification trim worker:** TODO to reuse logic from notifications service — duplicated business rules could diverge.

## Message / i18n debt

- **HTTP message constants:** `src/presentation/http/express/constants/message.constant.ts` has multiple inline TODOs about removing or tightening messages — possible dead copy or unfinished API error cleanup.

## Repository health (process)

- **Large refactors in flight:** If the working tree contains widespread deletes or moves under `src/application/` vs `src/modules/`, documentation in `.planning/codebase/` can drift quickly; re-run `/gsd-map-codebase` after major merges.
- **Index / graph tools:** Project rules reference GitNexus for impact analysis; after large structural changes, `npx gitnexus analyze` may be needed so tooling matches the tree.

## Testing gaps (see TESTING.md)

- Vitest is configured project-wide; critical paths (auth, payments of tokens, workers) warrant explicit integration coverage — absence is a delivery risk rather than a lint failure.
