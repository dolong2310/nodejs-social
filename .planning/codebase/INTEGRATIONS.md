# External Integrations

**Analysis Date:** 2026-03-21

## APIs & External Services

**Cloud Storage (AWS):**
- Amazon S3 - stores uploaded images/videos and HLS assets.
  - SDK/Client: `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner` in `src/services/s3.service.ts`.
  - Auth: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME` from `src/config/envConfig.ts`.
  - Boundary: app service layer -> AWS S3 API.
  - Protocol: HTTPS (AWS SDK over HTTP).
  - Risk notes: synchronous file reads (`readFileSync`) in `src/services/s3.service.ts` can increase memory/latency under large uploads.

**Email Delivery (AWS):**
- Amazon SES - sends transactional emails (verify/forgot-password).
  - SDK/Client: `@aws-sdk/client-ses` in `src/services/email.service.ts`.
  - Auth: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SES_FROM_ADDRESS`.
  - Boundary: queue worker -> email service -> SES.
  - Protocol: HTTPS (AWS SDK API calls).
  - Risk notes: service/API quota failures propagate from worker retries in `src/queue/workers/email.worker.ts`.

**Identity Provider (Google):**
- Google OAuth2 + UserInfo API - social login token exchange/profile fetch.
  - SDK/Client: `axios` in `src/services/oauth.service.ts`.
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
  - Boundary: `/api/oauth` route/controller -> OAuth service -> Google APIs.
  - Protocol: HTTPS REST (`POST /token`, `GET /userinfo`).
  - Risk notes: external call availability and token/header handling can fail login path if upstream response contracts change.

## Data Storage

**Databases:**
- MongoDB (application primary data store).
  - Connection: `DATABASE_URI`, `DATABASE_NAME` from `src/config/envConfig.ts`.
  - Client: official `mongodb` driver in `src/database/mongodb/database.service.ts`.
  - Boundary: repositories/services -> Mongo collections.
  - Protocol: Mongo wire protocol over configured URI.

**File Storage:**
- AWS S3 (remote object storage), plus local temporary folder `uploads/` for preprocessing (`src/utils/file.util.ts`, `src/queue/workers/video-hls.worker.ts`).

**Caching:**
- Redis cache-aside API via `RedisService.getOrSet` in `src/database/redis/redis.service.ts`.
- Search cache TTL controlled by `SEARCH_CACHE_TTL_SECONDS` in `src/config/generalConfig.ts`.

## Authentication & Identity

**Auth Provider:**
- Custom JWT auth + Google OAuth bridge.
  - Implementation: JWT verification/signing in `src/services/token.service.ts`; OAuth exchange in `src/services/oauth.service.ts`.
  - Transport boundary: HTTP Authorization headers and Socket.IO handshake auth in `src/services/socket.service.ts`.
  - Protocols: HTTP Bearer JWT + WebSocket (Socket.IO) auth payload.

## Monitoring & Observability

**Error Tracking:**
- No external APM/error tracker detected.

**Logs:**
- Pino + pino-http structured logs in `src/logger/index.ts` and middleware wiring in `src/app.ts`.

## CI/CD & Deployment

**Hosting:**
- Not explicitly declared in repository files.

**CI Pipeline:**
- Not detected (no pipeline config files in root).

## Environment Configuration

**Required env vars:**
- App/runtime: `PORT`, `LOG_LEVEL`, `FRONTEND_URL`, `PRODUCTION_URL`, `DEVELOPMENT_URL`.
- Data: `DATABASE_URI`, `DATABASE_NAME`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`.
- Auth: `JWT_ALGO`, token secret/expiry keys, Google OAuth keys.
- Infra controls: `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `SEARCH_CACHE_TTL_SECONDS`.
- Cloud: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `SES_FROM_ADDRESS`.

**Secrets location:**
- Runtime env files loaded by mode (`.env`, `.env.development`, `.env.staging`, `.env.production`) in `src/config/envConfig.ts`.
- Template/example vars documented in `.env.example`.

## Webhooks & Callbacks

**Incoming:**
- OAuth callback-style flow via request query `code` into Google token exchange in `src/controllers/oauth.controller.ts` + `src/services/oauth.service.ts`.
- Explicit external webhook endpoints: None detected.

**Outgoing:**
- HTTPS API calls to Google OAuth endpoints in `src/services/oauth.service.ts`.
- AWS SDK outbound calls to S3/SES in `src/services/s3.service.ts` and `src/services/email.service.ts`.

## Integration Boundaries & Protocol Summary

- Client <-> API: HTTP/JSON via Express routes under `/api` in `src/app.ts`.
- Client <-> Realtime: Socket.IO (WebSocket fallback transport) in `src/services/socket.service.ts`.
- API <-> MongoDB: native MongoDB driver in `src/database/mongodb/database.service.ts`.
- API/Workers <-> Redis: ioredis TCP connection in `src/database/redis/index.ts`.
- Workers <-> AWS S3/SES: HTTPS SDK calls from queue workers/services.

---

*Integration audit: 2026-03-21*
