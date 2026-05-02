# Codebase Concerns

**Analysis Date:** 2026-05-02

## Tech Debt

**Presentation-layer validation deferred in auth in-ports:**

- Issue: `login-email.in-port.ts` and `disable-2fa.in-port.ts` throw generic `Error` for mutually exclusive fields; comments point to middleware validation that is not implemented there.
- Files: `src/modules/auth/application/use-cases/login-email/login-email.in-port.ts`, `src/modules/auth/application/use-cases/disable-2fa/disable-2fa.in-port.ts`
- Impact: Inconsistent validation boundaries; harder to return stable API error shapes from the use case layer alone.
- Fix approach: Move mutual-exclusion checks to Express validators (or shared Valibot schemas) and keep in-ports thin.

**Layer coupling (infrastructure ↔ presentation):**

- Issue: `VideoStreamWorker` imports `UPLOAD_DIR_VIDEO` from presentation HTTP constants; worker is infrastructure but depends on presentation paths.
- Files: `src/infrastructure/queue/video-stream/video-stream.worker.ts`, `src/presentation/http/express/constants/file.constant.ts`
- Impact: Refactors to HTTP layout or constants can break workers; violates intended dependency direction.
- Fix approach: Move upload path constants to `bootstrap/config`, `infrastructure`, or a shared `modules/media` config module consumed by both layers.

**Application module importing Node `path` with acknowledged smell:**

- Issue: `video.util.ts` comment states application should not depend on infrastructure; file lives under `modules/common` and uses `path`, `zx`, `ffprobe` orchestration (~366 lines).
- Files: `src/modules/common/utils/video.util.ts`
- Impact: Large, process-heavy surface in “common”; harder to test and to swap probing/encoding strategies.
- Fix approach: Extract a `VideoProbePort` / `VideoTranscodePort` behind infrastructure implementations; keep pure helpers in application.

**Post query repository size:**

- Issue: `post-query.impl.repository.ts` is ~649 lines with aggregation pipelines; inline TODO to move logic to utils.
- Files: `src/modules/post/infrastructure/mongo/post-query.impl.repository.ts`
- Impact: High cognitive load, regression risk when changing feed/search behavior.
- Fix approach: Extract pipeline builders or query objects into dedicated files under the same module; add characterization tests when test suite exists.

**Notification trim worker duplication:**

- Issue: Comment notes need to reuse logic from notifications service.
- Files: `src/infrastructure/queue/notification-trim/notification-trim.worker.ts`, `src/modules/notification/application/services/notification.service.ts`
- Impact: Divergent trim rules between HTTP path and worker path.
- Fix approach: Share a small domain/application helper invoked by both.

**HTTP route / DI registration monolith:**

- Issue: `http-routes.ts` is ~553 lines of imports and wiring.
- Files: `src/bootstrap/di/http-routes.ts`
- Impact: Merge conflicts and onboarding friction; easy to mis-wire a single interactor.
- Fix approach: Split by bounded context (auth, social graph, media, …) into separate factory modules imported by a thin aggregator.

**Sample / scaffold tree in production source:**

- Issue: `modules-sample/` contains parallel DDD-style samples (`modules-sample/user/...`, `modules-sample/core/...`) alongside real `modules/`.
- Files: `src/modules-sample/` (multiple files)
- Impact: Noise for search and navigation; risk of copying patterns from sample instead of canonical modules.
- Fix approach: Move samples to docs repo, or gate behind a non-published path, or delete if obsolete.

**Constants cleanup backlog:**

- Issue: Multiple `TODO: remove if needed` on message strings in `message.constant.ts`.
- Files: `src/presentation/http/express/constants/message.constant.ts`
- Impact: Unclear which messages are authoritative vs dead.
- Fix approach: Audit callers; delete or consolidate with `http-message.constant.ts`.

**OTP expiry hardcoded in use case:**

- Issue: `send-otp.interactor.ts` uses `ms('5m')` with TODO to use env; `OTP_EXPIRES_AT` exists in env but not wired here consistently.
- Files: `src/modules/auth/application/use-cases/send-otp/send-otp.interactor.ts`, `src/bootstrap/config/env.config.ts`
- Impact: Behavior drift between documented env and runtime.
- Fix approach: Read TTL from `envConfig` / `appConfig` in one place shared with persistence.

**2FA issuer string:**

- Issue: Hardcoded `'Social App'` with TODO for `envConfig.APP_NAME` (no such key today).
- Files: `src/infrastructure/services/2fa.service.ts`
- Impact: Branding mismatch across environments.
- Fix approach: Add optional `APP_NAME` to env or reuse an existing display name field.

**Redis caching TODOs:**

- Issue: Role lookup in auth guard and user lookup in user validator marked for Redis cache; not implemented.
- Files: `src/presentation/http/express/middlewares/auth.guard.ts`, `src/presentation/http/express/v1/validators/user.validator.ts`
- Impact: Extra Mongo round-trips on hot paths.
- Fix approach: Cache role-by-id and user-by-id with TTL and invalidation on updates.

**Rate limiting configuration split:**

- Issue: Global limiter in `create-http-server.ts` uses `appConfig.rateLimit` (env-driven, Redis store). Route-specific limiters in `limiter.middleware.ts` use hardcoded windows/limits; `authLimiter` is entirely disabled when `isDevelopment` is true (not only under Vitest).
- Files: `src/bootstrap/create-http-server.ts`, `src/presentation/http/express/middlewares/limiter.middleware.ts`, `src/bootstrap/config/app.config.ts`
- Impact: Staging/development stacks may run without strict auth throttling; operators may assume `RATE_LIMIT_*` controls all limits.
- Fix approach: Align per-route limiters with `appConfig.rateLimit` or document the two-tier model; narrow `skipRateLimitForTests` to `process.env.VITEST` (or similar) instead of all development.

**`.env.example` vs required keys:**

- Issue: `env.config.ts` requires `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `SEARCH_CACHE_TTL_SECONDS` among others; checked `.env.example` does not list rate-limit or search-cache keys (onboarding drift).
- Files: `src/bootstrap/config/env.config.ts`, `.env.example`
- Impact: New setups fail at boot until variables are discovered from code.
- Fix approach: Extend `.env.example` with all `ENV_KEYS` placeholders and short comments (no secrets).

## Known Bugs

**Friend request duplicate key surfaces raw Mongo message:**

- Symptoms: On unique-index violation, repository throws `error.message` (string) instead of a typed domain exception.
- Files: `src/modules/friend/infrastructure/mongo/friend-request.impl.repository.ts`
- Trigger: Create a second pending request for the same ordered pair while index enforces uniqueness.
- Workaround: None documented; clients may see unstable error text.
- Fix approach: Map code `11000` to a dedicated exception (e.g. “request already pending”) consumed by presentation layer.

**Refresh token error typing:**

- Issue: Comment after `invariant` questions JWT error typing robustness.
- Files: `src/modules/auth/application/use-cases/refresh-token/refresh-token.interactor.ts`
- Impact: Possible mishandling if `jsonwebtoken` throws non-`TokenExpiredError` types in edge cases.
- Fix approach: Narrow with `instanceof` checks and map to domain errors explicitly.

## Security Considerations

**OTP logged to stdout:**

- Risk: Generated OTP printed via `console.log` in `SendOtpInteractor` (marked TODO to remove after testing).
- Files: `src/modules/auth/application/use-cases/send-otp/send-otp.interactor.ts`
- Current mitigation: None in code; only a TODO comment.
- Recommendations: Remove logging immediately; use structured logger at `debug` gated by env if ever needed, never log secrets.

**Friend controller debug logging:**

- Risk: `sendFriendRequest` logs `req.body`, `userId`, and DTO contents to stdout.
- Files: `src/presentation/http/express/v1/controllers/friend.controller.ts`
- Current mitigation: None.
- Recommendations: Delete `console.log` calls or replace with redacted `req.log.debug` behind development flag.

**Queue worker operational logging:**

- Risk: `queue.service.ts` logs every item and errors with `console.log` (may include job payloads depending on caller).
- Files: `src/infrastructure/services/queue.service.ts`
- Current mitigation: None.
- Recommendations: Inject `LoggerPort` and log structured metadata without sensitive fields.

**Environment validation:**

- Risk: Strict `envConfig` throws at import time if any key missing — good for production, but misconfiguration stops the process immediately (operational clarity vs availability tradeoff).
- Files: `src/bootstrap/config/env.config.ts`
- Current mitigation: Fail-fast on missing vars.
- Recommendations: Keep fail-fast; pair with complete `.env.example` and deployment checklists.

## Performance Bottlenecks

**Post feed / search aggregations:**

- Problem: Heavy Mongo aggregations in a single large repository file.
- Files: `src/modules/post/infrastructure/mongo/post-query.impl.repository.ts`
- Cause: Multiple `$lookup` / facet stages without documented indexing contract in-repo.
- Improvement path: Document required indexes next to validators or in ops docs; add explain-plan smoke tests; consider caching for guest feeds if traffic grows.

**Socket.IO presence fan-out:**

- Problem: `ChatFeature.checkAnyOnline` calls `fetchSockets` per user in a conversation.
- Files: `src/presentation/socket/features/chat.feature.ts`
- Cause: O(n) Redis/socket queries per presence check.
- Improvement path: Batch or cache presence; debounce updates on typing/subscribe.

**Video pipeline:**

- Problem: CPU-bound ffmpeg/ffprobe work in workers and large util module.
- Files: `src/modules/common/utils/video.util.ts`, `src/infrastructure/queue/video-stream/video-stream.worker.ts`
- Cause: Synchronous shell invocations per operation.
- Improvement path: Dedicated worker pool sizing, timeouts, and file size limits enforced before accept.

## Fragile Areas

**Dependency on transitive `uuid`:**

- Files: `src/modules/auth/application/use-cases/login-google/login-google.interactor.ts`, `src/modules/auth/application/services/token.service.ts`, `package.json`
- Why fragile: `package.json` declares `uuidv4` but application imports `from 'uuid'`; resolution relies on transitive `uuid` (e.g. via `bullmq` / `uuidv4`), with multiple semver majors possible under the tree.
- Safe modification: Add `uuid` as a direct dependency with a single pinned major; remove unused `uuidv4` if redundant.
- Test coverage: No automated tests directory present (see below).

**Entity detection workaround:**

- Files: `src/modules/core/domain/helpers/object.ts`
- Why fragile: `isEntity` avoids `instanceof Entity` due to circular dependency risk; uses structural checks instead.
- Safe modification: When changing `Entity` or `ValueObject` shapes, update structural guard or break the cycle properly.
- Test coverage: Gaps likely around serialization helpers.

**Injectable decorator typing:**

- Files: `src/presentation/http/express/decorators/injectable.decorator.ts`
- Why fragile: `eslint-disable` for `no-explicit-any` on constructor tuple type.
- Safe modification: Replace with typed tuple or generic factory pattern.

## Scaling Limits

**Global rate limit vs horizontal growth:**

- Current capacity: Global limiter uses Redis store when `appConfig.rateLimit.enabled` — suitable for multi-instance.
- Limit: Per-route limiters still in-memory in `limiter.middleware.ts` unless changed.
- Scaling path: Use Redis-backed store for route-specific limiters or rely solely on global + application-level quotas.

**MongoDB as single primary datastore:**

- Current capacity: All domain persistence through `Database` and collection modules.
- Limit: Hot collections (notifications, messages, post views) grow unbounded without archival/TTL discipline.
- Scaling path: Already uses queues for some async work (`post-views`, `notification-trim`, `video-stream`); extend TTL indexes and trim jobs as documented in notification service.

## Dependencies at Risk

**`uuid` / `uuidv4` overlap:**

- Risk: Two packages and multiple `uuid` majors; import path `uuid` not declared at root.
- Impact: Broken installs if npm deduping changes.
- Migration plan: `"uuid": "^11"` (or aligned with `bullmq`) as direct dependency; remove `uuidv4` if unused.

**`swagger-jsdoc` / `swagger-ui-express`:**

- Risk: Older stack; watch for Express 5 compatibility and security advisories.
- Files: `package.json`, Swagger wiring under `swagger/` and presentation bootstrap.
- Migration plan: Pin versions, run `npm audit`, consider OpenAPI-first generation from Zod/Valibot if maintaining JSDoc becomes costly.

## Missing Critical Features

**Automated test suite absent on disk:**

- Problem: `vitest.config.ts` expects `tests/integration/**/*.test.ts`, but repository has no `tests/` directory and no `*.test.ts` files under the workspace root.
- Files: `vitest.config.ts`, `package.json` (`test` script)
- Blocks: Safe refactors of interactors, aggregations, and socket flows without manual QA only.

**CI pipeline:**

- Problem: No `.github/workflows` (or other CI config) detected in workspace.
- Blocks: Guaranteed lint/test on merge.

## Test Coverage Gaps

**Entire application surface:**

- What's not tested: HTTP routes, use cases, repositories, socket features, workers — no Vitest files found.
- Files: N/A (missing `tests/` tree); config only at `vitest.config.ts`
- Risk: Regressions in auth, payments-of-attention paths (feeds, notifications), and media pipelines go unnoticed.
- Priority: High

**Rate limiter integration comment:**

- What's not tested: Comment in `limiter.middleware.ts` references Vitest integration smoke for auth endpoints, but no matching tests in repo.
- Files: `src/presentation/http/express/middlewares/limiter.middleware.ts`
- Risk: Auth rate-limit skip logic in development may diverge from intended test behavior.
- Priority: Medium

---

*Concerns audit: 2026-05-02*
