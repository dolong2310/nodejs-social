# External Integrations

**Analysis Date:** 2026-05-02

## Databases and cache

- **MongoDB** — Primary persistence. URI and database name from `DATABASE_URI`, `DATABASE_NAME` (`src/bootstrap/config/env.config.ts`). Application code uses the native driver via infrastructure repositories (e.g. `src/infrastructure/persistence/mongodb/database.ts`, module `*.impl.repository.ts` files under `src/modules/*/infrastructure/mongo/`).
- **Redis** — `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` for `ioredis` clients: rate limiting (`rate-limit-redis`), BullMQ queues, optional caching (see TODOs in `auth.guard.ts` / user validators for role and user cache).

## Authentication and identity

- **JWT** — Access and refresh tokens; secrets and expiry from `JWT_ALGO`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`. Wired through bootstrap container into auth and guards (`src/presentation/http/express/middlewares/auth.guard.ts`).
- **Google OAuth** — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` consumed by Google login use cases (`src/modules/auth/application/use-cases/login-google/`, URL helpers in auth module).
- **Email OTP** — OTP lifetime `OTP_EXPIRES_AT`; SES sending via AWS (`SES_FROM_ADDRESS`, SES client in infrastructure). Interactors such as `src/modules/auth/application/use-cases/send-otp/send-otp.interactor.ts` orchestrate generation and delivery.

## AWS

- **S3** — Media and static assets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`. SDK usage in infrastructure (uploads, presigned URLs where applicable).
- **SES** — Transactional email (OTP, notifications) using `SES_FROM_ADDRESS`.

## HTTP / CORS / clients

- **Browser clients** — `CORS_ORIGINS` comma-separated list; `FRONTEND_URL`, `PRODUCTION_URL`, `DEVELOPMENT_URL` for links and redirects in auth and email flows.
- **Outbound HTTP** — `axios` for third-party HTTP where used (integrate with modules as needed).

## Background jobs

- **BullMQ** — Workers under `src/infrastructure/queue/` (e.g. `notification-trim/notification-trim.worker.ts`, `video-stream/video-stream.worker.ts`) use Redis as the broker; started from bootstrap (`setup-workers.ts` pattern).

## Real-time

- **Socket.IO** — Same origin / CORS policy as HTTP app; JWT or session-derived identity for socket connections (`src/presentation/socket/`). Not a separate SaaS — self-hosted alongside Express.

## Rate limiting

- **express-rate-limit** — Optional toggles `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`; store backed by Redis when enabled.

## Search / cache TTL

- **SEARCH_CACHE_TTL_SECONDS** — Used for search-related caching behavior in application layer (exact consumers in post/search modules).

## Local / dev tooling (non-production)

- **Faker** — `@faker-js/faker` for seed scripts (`seed:fake-data` in `package.json`).
- **Swagger UI** — Served in-process for API exploration in development (not an external hosted docs product).

## What is not integrated (by stack alone)

- No first-party mobile SDKs in this repo; clients are assumed to be web or external apps calling the HTTP/WebSocket API.
- No managed auth provider (Auth0, Cognito User Pools) in dependencies — auth is custom JWT + Google OAuth + email OTP unless extended elsewhere.
