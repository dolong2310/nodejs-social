# External Integrations

**Analysis Date:** 2026-05-02

## APIs & External Services

**Google OAuth 2.0 (login):**
- Userinfo and OAuth token exchange via `googleapis` / `OAuth2Client` — `src/infrastructure/services/google-oauth.service.ts`
- Scopes referenced in `src/modules/auth/application/use-cases/get-google-auth-url/get-google-auth-url.interactor.ts` (`userinfo.email`, `userinfo.profile`)
- Environment: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (must match the backend route Google redirects to)

**HTTP API surface (this service):**
- REST under `{API_PREFIX}/{version}/{resource}` with `API_PREFIX` = `/api` from `src/bootstrap/config/app.config.ts`
- OAuth routes: `src/presentation/http/express/v1/routes/oauth.route.ts` — `GET /api/v1/oauth/google/url`, `GET /api/v1/oauth/google` (Google redirects here with `code` and `state`; controller `src/presentation/http/express/v1/controllers/oauth.controller.ts` then redirects browser to `FRONTEND_URL`)

**AWS:**
- **S3** — uploads and presigned patterns — `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner` in `src/infrastructure/services/s3.service.ts`
- **SES** — outbound email — `SESClient` in `src/infrastructure/services/email.service.ts`; queue consumer `src/infrastructure/queue/email/email.worker.ts`

## Data Storage

**Databases:**
- MongoDB — native driver `mongodb`
  - Connection: `DATABASE_URI`, `DATABASE_NAME` (`src/bootstrap/config/env.config.ts`, `src/infrastructure/persistence/mongodb/database.ts`)
  - Collections and indexes created in `database.ts` (users, posts, conversations, etc.)

**File Storage:**
- AWS S3 — primary durable storage for uploads/stream segments (`s3.service.ts`)
- Local filesystem — upload/scratch dirs used before S3 (e.g. `UPLOAD_DIR_VIDEO` in `src/presentation/http/express/constants/file.constant.ts`, referenced from workers such as `src/infrastructure/queue/video-stream/video-stream.worker.ts`)

**Caching:**
- Redis (`ioredis`) — `src/infrastructure/persistence/redis/redis.ts`
  - Connection: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`
  - Used for app cache abstraction, rate-limit store (`rate-limit-redis`), and BullMQ connection (`src/infrastructure/queue/bullmq/bullmq-connection.ts`)

## Authentication & Identity

**Auth Provider:**
- **Custom JWT session model** — access + refresh tokens, cookies for refresh — modules under `src/modules/auth/`, config `src/bootstrap/config/app.config.ts` (`jwt`)
- **Google** as external IdP for OAuth login only — not the primary user directory; links/creates user after Google token exchange (`google-oauth.service.ts`)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/Rollbar/etc. in `package.json` dependencies)

**Logs:**
- **Pino** — JSON logs, HTTP logging via `pino-http`, request context in `src/infrastructure/logger/request-context-logger.ts`
- Level from `LOG_LEVEL` or defaults in `src/bootstrap/config/app.config.ts`

## CI/CD & Deployment

**Hosting:**
- Not defined in repo (no `Dockerfile`, no `fly.toml`, etc. in workspace)

**CI Pipeline:**
- No `.github/workflows` or similar detected in repository

## Environment Configuration

**Required env vars:**
- Full set enforced at startup via `src/bootstrap/config/env.config.ts`, including: `PORT`, `LOG_LEVEL`, `FRONTEND_URL`, `CORS_ORIGINS`, `PRODUCTION_URL`, `DEVELOPMENT_URL`, `DATABASE_URI`, `DATABASE_NAME`, `REDIS_*`, JWT and OTP keys, Google OAuth, AWS S3/SES, rate limit toggles (`RATE_LIMIT_*`), `SEARCH_CACHE_TTL_SECONDS`

**Secrets location:**
- Per-environment files `.env.development`, `.env.staging`, `.env.production` (loaded by name); never commit secrets — use `.env.example` as a non-secret template

## Webhooks & Callbacks

**Incoming:**
- **Google OAuth redirect** — browser hits `GET /api/v1/oauth/google` with query params after user consents at Google (not a signed webhook payload; standard OAuth redirect)
- No Stripe/GitHub-style signed webhooks identified in routes

**Outgoing:**
- **AWS SES** — send email jobs from BullMQ worker (`email.worker.ts`)
- **AWS S3** — put/upload from application and workers (`s3.service.ts`, video worker uploads segments)
- **Google OAuth token / userinfo** — token exchange and `oauth2.userinfo.get()` in `google-oauth.service.ts`

## Background processing

**BullMQ (Redis-backed):**
- Queues/workers under `src/infrastructure/queue/` — email delivery, video stream encoding (uses ffmpeg + S3), post views, notification trim

**Realtime:**
- **Socket.IO** — chat/presence features under `src/presentation/socket/`; CORS aligned with `appConfig.cors` in HTTP bootstrap

---

*Integration audit: 2026-05-02*
