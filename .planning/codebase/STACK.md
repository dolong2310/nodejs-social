# Technology Stack

**Analysis Date:** 2026-05-02

## Languages

**Primary:**
- TypeScript (see `package.json` `typescript` ^5.9) — entire application under `src/`, `tests/`, config files
- YAML — OpenAPI/Swagger sources in `swagger/` (`paths.yaml`, `components.yaml`, `tags.yaml`, `security.yaml`)

**Secondary:**
- JSON — MongoDB JSON Schema validators under `src/infrastructure/persistence/mongodb/validators/`
- Markdown — project docs only; not part of runtime

## Runtime

**Environment:**
- Node.js — ESM project (`package.json` `"type": "module"`). No `engines` field in `package.json`; align Node with `@types/node` ^25 used in dev types.

**Package Manager:**
- npm — lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Express ^5 — HTTP API; app factory in `src/presentation/http/express/app.ts`, bootstrap in `src/index.ts`
- Socket.IO ^4 — WebSocket/realtime; `src/bootstrap/create-socket-server.ts`, `src/presentation/socket/`

**Testing:**
- Vitest ^4 — `vitest.config.ts`; integration tests only (`include: ['tests/integration/**/*.test.ts']`)

**Build/Dev:**
- TypeScript compiler — `tsconfig.json` (`target` ES2023, `module` ESNext, `paths` `@/*` → `./src/*`)
- `tsc-alias` — rewrites path aliases after `tsc` (`package.json` `build` script)
- `tsx` — runs TypeScript in dev and production start scripts (`package.json` `start:*`)
- `nodemon` — dev reload; config `nodemon.json` (`exec`: `tsx src/index.ts`)
- `rimraf` — clean `dist` before build

## Key Dependencies

**Critical:**
- `mongodb` ^7 — primary database via `MongoClient` in `src/infrastructure/persistence/mongodb/database.ts`
- `ioredis` ^5 — Redis client; `src/infrastructure/persistence/redis/redis.ts`
- `bullmq` ^5 — job queues/workers; `src/infrastructure/queue/` (email, video-stream, post-views, notification-trim)
- `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner` — object storage; `src/infrastructure/services/s3.service.ts`
- `@aws-sdk/client-ses` — transactional email; `src/infrastructure/services/email.service.ts`
- `googleapis` — Google APIs; OAuth flow in `src/infrastructure/services/google-oauth.service.ts` (uses `OAuth2Client` from transitive `google-auth-library`)
- `socket.io` — realtime layer (paired with `socket.io-client` in devDependencies for tests)
- `jsonwebtoken` — JWT access/refresh; wired via `src/bootstrap/config/app.config.ts`
- `bcrypt` — password hashing
- `otpauth` — TOTP/2FA
- `express-validator` + `valibot` — request validation patterns in presentation layer
- `pino`, `pino-http` — structured logging; `src/infrastructure/logger/create-logger.ts`
- `sharp` — image processing (media pipeline)
- `zx` — spawns **ffmpeg** for video encoding in `src/modules/common/utils/video.util.ts` (external binary, not an npm package)

**Infrastructure:**
- `express-rate-limit` + `rate-limit-redis` — rate limiting with Redis store (see `src/bootstrap/config/app.config.ts` `rateLimit`)
- `helmet`, `cors`, `compression`, `cookie-parser` — HTTP middleware in `src/presentation/http/express/app.ts`
- `formidable` — multipart uploads
- `mitt` — event emitter patterns where used
- `swagger-jsdoc`, `swagger-ui-express` — API docs at `/api/docs` (see `createExpressApp` in `src/presentation/http/express/app.ts`)
- `yaml` — loading swagger definition helpers
- `date-fns`, `lodash-es`, `uuidv4`, `mime` / `mime-types` — utilities

**Declared but unused in `src/` (as of analysis):**
- `axios` — listed in `package.json` dependencies; no `import` from `axios` under application sources

## Configuration

**Environment:**
- Load order: `dotenv` reads `.env.${envMode}` or `.env` based on `--env` CLI flag — `src/bootstrap/config/env.config.ts`
- Required keys are enumerated in `ENV_KEYS` in `src/bootstrap/config/env.config.ts` (throws if missing or empty)
- Template without secrets: `.env.example` (document existence of per-environment files only; do not commit real `.env.*`)

**Build:**
- `tsconfig.json` — compilation to `dist/`
- `eslint.config.mts` — ESLint flat config with `typescript-eslint`, Prettier integration
- `.prettierrc` — formatting rules (referenced by ESLint)

## Platform Requirements

**Development:**
- Node.js + npm
- MongoDB instance (`DATABASE_URI`, `DATABASE_NAME`)
- Redis (`REDIS_*` in `env.config.ts`)
- **ffmpeg** on `PATH` for video transcoding workers (`video.util.ts`); without it, video encoding jobs fail at runtime

**Production:**
- Same service dependencies (MongoDB, Redis, AWS credentials for S3/SES, Google OAuth credentials)
- Process serves HTTP + Socket.IO; optional separate worker processes via `src/bootstrap/setup-workers.ts` pattern for BullMQ consumers

---

*Stack analysis: 2026-05-02*
