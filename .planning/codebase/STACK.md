# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- TypeScript (strict mode) - API/server code in `src/` with build config in `tsconfig.json`.

**Secondary:**
- JavaScript (tooling/config runtime) - Node runtime entry and tool configs in `package.json`, `eslint.config.mts`, `nodemon.json`.
- YAML - OpenAPI source files in `swagger/` referenced by `src/app.ts`.

## Runtime

**Environment:**
- Node.js (ESM mode via `"type": "module"`) in `package.json`.

**Package Manager:**
- npm (script lifecycle + lockfile workflow).
- Lockfile: present (`package-lock.json`).

## Frameworks

**Core:**
- Express `^5.2.1` - HTTP API framework in `src/app.ts`.
- Socket.IO `^4.8.3` - realtime messaging server in `src/services/socket.service.ts`.

**Testing:**
- Not detected (no test runner dependency or `test` script in `package.json`).

**Build/Dev:**
- TypeScript compiler `^5.9.3` - transpilation to `dist/` (`build` script).
- `tsc-alias` `^1.8.16` - rewrites TS path aliases after build.
- `tsx` `^4.21.0` + `nodemon` `^3.1.14` - development runtime (`nodemon.json`, `dev` script).
- ESLint `^10.0.2` + typescript-eslint `^8.56.1` + Prettier `^3.8.1` - code quality formatting/linting.

## Key Dependencies

**Critical:**
- `mongodb` `^7.1.0` - primary persistent data store in `src/database/mongodb/database.service.ts`.
- `jsonwebtoken` `^9.0.3` + `bcrypt` `^6.0.0` - auth/token/password flow in `src/services/token.service.ts`, `src/services/auth.service.ts`.
- `bullmq` `^5.71.0` - background jobs/workers in `src/queue/`.

**Infrastructure:**
- `ioredis` `^5.10.1` - cache, rate-limit store, queue backend in `src/database/redis/` and `src/app.ts`.
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/client-ses`, `@aws-sdk/lib-storage`) - media storage + outbound email in `src/services/s3.service.ts` and `src/services/email.service.ts`.
- `swagger-jsdoc` + `swagger-ui-express` - API docs endpoint `/api/docs` in `src/app.ts`.
- `helmet`, `cors`, `express-rate-limit`, `rate-limit-redis` - transport/security middleware in `src/app.ts`.

## Configuration

**Environment:**
- Required env vars are validated at boot in `src/config/envConfig.ts`.
- Example keys are declared in `.env.example` (database, JWT, Google OAuth, AWS, Redis, rate limit, cache TTL).

**Build:**
- TS compiler + alias config in `tsconfig.json`.
- Lint + style rules in `eslint.config.mts`.
- Dev process/watch settings in `nodemon.json`.

## Platform Requirements

**Development:**
- Node.js + npm.
- MongoDB reachable via `DATABASE_URI`.
- Redis reachable via `REDIS_HOST`/`REDIS_PORT`.

**Production:**
- Node.js process running `node dist/main.js --env=production` (`package.json`).
- External infrastructure: MongoDB, Redis, AWS S3, AWS SES, Google OAuth endpoints.

## Build/Test Commands

```bash
npm run dev           # Run API with nodemon + tsx
npm run build         # Compile TS to dist + rewrite aliases
npm run start:prod    # Run compiled app in production env mode
npm run lint          # Lint codebase
npm run prettier      # Check formatting
```

---

*Stack analysis: 2026-03-21*
