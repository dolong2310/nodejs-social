---
phase: 07-quality-hardening-tests
plan: "01"
requirements-completed: [QUAL-02]
completed: "2026-03-23"
---

# Phase 7 plan 01 — Vitest + HTTP smoke

**Outcome:** `npm test` runs Vitest 4 with serial integration workers; one smoke file covers register → DB verification token → verify-email → Bearer `GET /api/users/me`, friends request/accept, and direct chat text send/list.

## Key files

- `vitest.config.ts`, `package.json` `test` script with `--import ./tests/setup/register-argv.mjs`
- `tests/helpers/integration-app.ts`, `tests/integration/smoke.integration.test.ts`, `tests/README.md`

## Deviations from PLAN.md

- **Env mode:** Vitest CLI rejects extra `--env` flags. `src/config/envConfig.ts` maps `process.env.VITEST` → `development` so `.env.development` loads without polluting Vitest argv.
- **Rate limits:** Integration harness omits global `rateLimitOptions`; `authLimiter` is a no-op when `VITEST=true` so one IP can complete >5 auth steps in one run (`src/middlewares/limiter.middleware.ts`).
- **Teardown:** Harness closes HTTP server + `QueueService` only; Mongo/Redis singletons stay open for a second integration file in the same process.
