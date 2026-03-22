# Integration tests

## Prerequisites

- **MongoDB** running and reachable via `DATABASE_URI` (same cluster pattern as local dev).
- **Redis** running (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`).

Tests load **`.env.development`**: when Vitest runs, `process.env.VITEST` is set and `src/config/envConfig.ts` treats the mode as `development` (so we do not pass `--env` on the same argv as the Vitest CLI). The `npm test` script still uses `--import ./tests/setup/register-argv.mjs` as the project hook. Every key in `ENV_KEYS` must be **non-empty**.

## Recommended isolation

Use dedicated DB names and Redis DB index so tests do not collide with dev data:

- `DATABASE_NAME=nodejs_social_test`
- `DATABASE_CHAT_NAME=nodejs_social_chat_test`
- `REDIS_DB=15`

## Socket / CORS

`SocketService` uses `envConfig.FRONTEND_URL` for Socket.IO CORS. For socket integration tests, set `FRONTEND_URL` to an origin that matches how the client connects (see `tests/integration/socket.chat-subscribe.test.ts` and project research notes). Example: `FRONTEND_URL=http://127.0.0.1`.

## Rate limiting

Global Express rate limit is omitted in the integration harness. Under Vitest, `authLimiter` is a no-op (`VITEST=true`) so multi-step auth flows from one IP are not capped at five calls per window. Set `RATE_LIMIT_ENABLED=0` in `.env.development` if you also want to disable production-style global limits when running the full app outside tests.

## Command

```bash
npm test
```

**CI / GitHub Actions** is **out of scope** for Phase 7 DoD (D-07); this gate is **local** only (D-06).
