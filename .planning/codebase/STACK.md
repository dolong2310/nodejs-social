# Technology Stack

**Analysis Date:** 2026-05-02

## Languages and runtime

- **Language:** TypeScript (`typescript` ^5.9), strict mode enabled in `tsconfig.json`.
- **Runtime:** Node.js (ESM via `"type": "module"` in `package.json`).
- **Module system:** `module: ESNext`, `moduleResolution: Bundler`, path alias `@/*` → `src/*` with `tsc-alias` rewriting on build (`package.json` scripts `build`).
- **Target:** ES2023 emit target (`tsconfig.json`).

## Frameworks and HTTP

- **HTTP:** Express 5 (`express` ^5.2) — app factory and routes under `src/presentation/http/express/` (e.g. `app.ts`, `v1/routes/*.route.ts`).
- **Validation:** `express-validator`, `valibot` for schema-style validation in places.
- **Security / middleware:** `helmet`, `cors`, `compression`, `cookie-parser`, `express-rate-limit` with `rate-limit-redis` for distributed limits.
- **Real-time:** `socket.io` — socket app in `src/presentation/socket/` (chat, presence, etc.).
- **API docs:** `swagger-jsdoc`, `swagger-ui-express`; YAML specs under `swagger/` (watched by `nodemon.json`).

## Data and async processing

- **Primary database:** MongoDB driver `mongodb` ^7 — connection and validators under `src/infrastructure/persistence/mongodb/` (e.g. `database.ts`, `validators/*.validator.json`).
- **Cache / queues:** `ioredis` for Redis; `bullmq` for workers (notification trim, video stream, etc. under `src/infrastructure/queue/`).

## Auth, crypto, and media

- **JWT:** `jsonwebtoken`.
- **Passwords:** `bcrypt`.
- **2FA:** `otpauth` (TOTP).
- **OAuth:** `googleapis` for Google sign-in flows.
- **Images:** `sharp` for image processing.
- **Uploads / multipart:** `formidable`.

## Cloud and email

- **Object storage / email:** AWS SDK v3 — `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/client-ses` (see `src/infrastructure/` services wired from env in `src/bootstrap/config/env.config.ts`).

## Observability and utilities

- **Logging:** `pino`, `pino-http`, dev pretty printing via `pino-pretty`.
- **General:** `lodash-es`, `date-fns`, `uuidv4`, `axios`, `mitt`, `yaml`, `zx`, `mime` / `mime-types`, `reflect-metadata` (required at entry: `src/index.ts`).

## Build, dev, and quality tooling

- **Dev server:** `nodemon` runs `tsx src/index.ts` (`nodemon.json`); env selected via `--env=development|staging|production` (see `src/bootstrap/config/env.config.ts` with `minimist`).
- **Compile:** `rimraf`, `tsc`, `tsc-alias` for production build output in `dist/`.
- **Lint / format:** ESLint 10 + `typescript-eslint`, Prettier, `eslint-config-prettier` / `eslint-plugin-prettier`.
- **Tests:** Vitest 4 (`package.json` `test` script uses `tests/setup/register-argv.mjs`), `supertest`, `socket.io-client`.

## Configuration surface

- **Environment:** `dotenv` loads `.env.<mode>` based on CLI `--env` (`env.config.ts`). All keys in `ENV_KEYS` must be non-empty or startup throws.
- **Reference keys:** `.env.example` documents `PORT`, `LOG_LEVEL`, URLs, `DATABASE_*`, `REDIS_*`, JWT and OTP settings, Google OAuth, AWS S3/SES, and rate-limit / cache TTL variables.

## Scripts of note

- `npm run dev` — nodemon development.
- `npm run build` / `start:*` — compiled dist with `tsx` runner.
- `npm run seed:permissions` / `seed:fake-data` — TSX entrypoints under `src/infrastructure/persistence/seed/` (paths per `package.json`).
