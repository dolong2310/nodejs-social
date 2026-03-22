# Codebase Concerns

**Analysis Date:** 2026-03-21

## Prioritized Risk Matrix

| Priority | Concern | Severity | Likelihood | Primary Evidence |
|---|---|---|---|---|
| P0 | Missing automated test suite | Critical | High | `package.json`, `src/` (no `*.test.*` / `*.spec.*` files detected) |
| P1 | Socket message flow bypasses persistence and ownership checks | High | High | `src/services/socket.service.ts`, `src/routes/conversations.route.ts`, `src/services/conversations.service.ts` |
| P1 | Boot sequence is single-point startup failure | High | Medium | `src/app.ts`, `src/config/envConfig.ts`, `src/database/mongodb/database.service.ts`, `src/database/redis/redis.service.ts` |
| P2 | Large in-memory file handling in S3 upload path | Medium | High | `src/services/s3.service.ts`, `src/services/media.service.ts`, `src/queue/workers/video-hls.worker.ts` |
| P2 | Weak type-safety boundaries (`any`) in core paths | Medium | Medium | `src/middlewares/pagination.middleware.ts`, `src/services/s3.service.ts`, `src/responses/error.response.ts` |
| P3 | Tight infrastructure coupling increases migration cost | Medium | Medium | `src/config/generalConfig.ts`, `src/services/s3.service.ts`, `src/queue/index.ts`, `src/database/mongodb/database.service.ts` |

## Tech Debt

**Realtime messaging and conversation consistency:**
- Issue: `sendMessage` in `src/services/socket.service.ts` emits directly over socket and leaves database persistence as TODOs.
- Files: `src/services/socket.service.ts`, `src/services/conversations.service.ts`, `src/repositories/conversation.repository.ts`
- Impact: Message history can diverge from realtime events; reconnect/replay behavior can lose messages.
- Fix approach: Route send-message writes through `ConversationsService` first, then emit only after durable write succeeds.

**Validation caching explicitly deferred:**
- Issue: User lookup caching is marked TODO in validation logic.
- Files: `src/validations/users.validation.ts`, `src/services/search.service.ts`, `src/database/redis/redis.service.ts`
- Impact: Repeated identity checks increase database load on hot endpoints.
- Fix approach: Add bounded Redis cache for stable lookups with explicit TTL and cache invalidation on user updates.

## Known Bugs

**Socket payload sender trust:**
- Symptoms: `sendMessage` handler accepts `{ senderId, receiverId, content }` from client payload.
- Files: `src/services/socket.service.ts`
- Trigger: Malicious client sends another user’s `senderId`.
- Workaround: None in current code path.

**Startup env file mismatch error message:**
- Symptoms: startup always throws message format `Couldn't find .env.${envMode} file`, including when `envMode` is undefined.
- Files: `src/config/envConfig.ts`
- Trigger: running process without `--env` and missing `.env`.
- Workaround: Manually provide `--env` and matching `.env.<mode>`.

## Security Considerations

**Socket authorization hardening gap:**
- Risk: Socket middleware verifies token, but event-level logic still trusts client-provided identity fields.
- Files: `src/services/socket.service.ts`, `src/middlewares/auth.middleware.ts`, `src/services/token.service.ts`
- Current mitigation: JWT verification at connection and packet middleware exists.
- Recommendations: Derive sender identity exclusively from decoded token (`socket.handshake.auth.decoded`), never from payload; reject mismatches and audit-log attempts.

**Broad CORS in non-production:**
- Risk: Non-production config allows `origin: '*'` with credentials setting also enabled in app config flow.
- Files: `src/index.ts`, `src/app.ts`
- Current mitigation: Production path uses `FRONTEND_URL`.
- Recommendations: Use explicit allowlist per environment and disallow wildcard origins whenever credentials are enabled.

## Performance Bottlenecks

**S3 upload reads whole file into memory:**
- Problem: Upload path uses `readFileSync(filepath)` before S3 multipart upload.
- Files: `src/services/s3.service.ts`, `src/services/media.service.ts`
- Cause: Buffering entire payload in process memory rather than streaming.
- Improvement path: Stream with `createReadStream` and enforce upload size limits before processing.

**Write amplification on feed/search view counters:**
- Problem: View updates issue `updateMany` for result sets and execute on each search/feed response.
- Files: `src/repositories/post.repository.ts`, `src/services/search.service.ts`, `src/services/posts.service.ts`
- Cause: Immediate per-request DB writes on read-heavy endpoints.
- Improvement path: Batch/defer counter updates via queue or periodic aggregation jobs.

## Fragile Areas

**Bootstrap dependency chain:**
- Files: `src/app.ts`, `src/queue/index.ts`, `src/container/index.ts`
- Why fragile: App startup depends on successful DB/Redis connects and queue initialization in strict sequence.
- Safe modification: Preserve initialization order (`QueueService.init` before container queue access), add startup health probes and explicit fallback behavior.
- Test coverage: No automated startup integration tests detected.

**Worker failure handling:**
- Files: `src/queue/workers/video-hls.worker.ts`, `src/services/s3.service.ts`
- Why fragile: Worker updates failure status only after max attempts; intermediate failures can leave partial artifacts.
- Safe modification: Add idempotent cleanup and dead-letter workflow metadata for failed jobs.
- Test coverage: No worker lifecycle tests detected.

## Scaling Limits

**Single-node process memory pressure during media handling:**
- Current capacity: Bound by Node.js heap and concurrent upload/transcode workload.
- Limit: Large file bursts can increase memory usage due to full-file buffering and parallel processing.
- Scaling path: Move to streaming ingestion, strict queue concurrency tuning, and horizontal worker autoscaling.

**High-churn read endpoints with synchronous counters:**
- Current capacity: Throughput tied to MongoDB write latency on feed/search requests.
- Limit: Read-heavy traffic degrades as write contention grows.
- Scaling path: Event-based counter aggregation with periodic compaction.

## Dependencies at Risk

**Express 5.x adoption risk in middleware ecosystem:**
- Risk: Some middleware/plugin assumptions differ between Express 4 and 5 behavior.
- Impact: Runtime regressions can appear around error propagation and middleware compatibility.
- Migration plan: Pin compatibility matrix in CI and add smoke tests around auth/error/rate-limit middleware chains.

**Infrastructure lock-in (MongoDB + Redis + BullMQ + AWS S3/SES):**
- Risk: Core services are tightly coupled to specific providers and SDK shapes.
- Impact: Provider migration requires broad cross-layer changes.
- Migration plan: Introduce explicit ports/adapters interfaces per external system, then migrate implementation behind contracts.

## Missing Critical Features

**End-to-end automated verification:**
- Problem: No test command or test framework scripts are defined in `package.json`, and no test files are detected in `src/`.
- Blocks: Safe refactors, dependency upgrades, and migration validation.

**Realtime message durability contract:**
- Problem: Socket message send path does not enforce persisted write before emit.
- Blocks: Strong delivery guarantees and reliable conversation replay.

## Test Coverage Gaps

**Authentication and token edge cases:**
- What's not tested: Token expiration, malformed token handling, optional auth behavior.
- Files: `src/middlewares/auth.middleware.ts`, `src/services/token.service.ts`, `src/validations/auth.validation.ts`
- Risk: Auth regressions can silently ship.
- Priority: High

**Media upload + worker lifecycle:**
- What's not tested: Upload failure branches, partial S3 failures, worker retries/final failure status updates.
- Files: `src/services/media.service.ts`, `src/services/s3.service.ts`, `src/queue/workers/video-hls.worker.ts`
- Risk: Silent data loss and stuck processing states.
- Priority: High

**Bootstrap and graceful shutdown behavior:**
- What's not tested: DB/Redis connect failure handling and shutdown sequencing.
- Files: `src/app.ts`, `src/database/mongodb/database.service.ts`, `src/database/redis/redis.service.ts`, `src/queue/index.ts`
- Risk: Runtime instability during deploy/restart.
- Priority: Medium

---

*Concerns audit: 2026-03-21*
