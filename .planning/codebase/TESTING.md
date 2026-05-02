# Testing Patterns

**Analysis Date:** 2026-05-02

## Test Framework

**Runner:**

- **Vitest** `^4.1.0` — listed in `package.json` `devDependencies`.
- **Config:** `vitest.config.ts` at repository root.

**Assertion library:**

- Vitest’s built-in **`expect`** API (Vitest is Jest-compatible).

**Environment:**

- **`environment: 'node'`** in `vitest.config.ts` — appropriate for this Express/Mongo/Redis backend.

**Run commands:**

```bash
npm test
```

Resolves to:

```text
node --import ./tests/setup/register-argv.mjs ./node_modules/vitest/vitest.mjs run
```

**Important:** The bootstrap file **`tests/setup/register-argv.mjs`** is referenced by `package.json` but is **not present** in the workspace at analysis time. **`npm test` will fail** until that path exists or the script is updated.

## Test File Organization

**Location:**

- Vitest **`include`** glob: **`tests/integration/**/*.test.ts`** only (`vitest.config.ts`). No unit-test glob is configured; **`tests/unit/`** or co-located `*.test.ts` next to `src/` are **not** picked up unless `include` is extended.

**Naming:**

- Use **`*.test.ts`** under `tests/integration/` to match the config.

**Current state:**

- **No `*.test.ts` files** were found under the repository root at analysis time. The **`tests/`** directory tree is empty or absent — integration tests are **planned by config** but **not implemented** in-tree.

**Structure (recommended when adding tests):**

```text
tests/
├── setup/
│   └── register-argv.mjs    # required by npm test script — create if missing
└── integration/
    └── <feature>.test.ts
```

## Test Structure

**Suite organization:**

- Use Vitest’s **`describe` / `it` / `expect`** (or **`test`**) once files exist. No project-specific wrapper utilities were found.

**Concurrency:**

- **`fileParallelism: false`** and **`maxWorkers: 1`** in `vitest.config.ts` — tests run **sequentially**, typical for integration tests that share DB/Redis or global state.

**Timeouts:**

- **`testTimeout`** and **`hookTimeout`:** **60_000** ms each — long-running HTTP or DB setup is expected.

## Mocking

**Framework:**

- Vitest provides **`vi`** for mocks/spies when needed (`vi.mock`, `vi.fn`).

**Patterns:**

- Not applicable until tests exist. For HTTP handlers, prefer **`supertest`** (already in `devDependencies`) against the Express app created from the composition root rather than mocking Express internals unless isolating a unit.

**HTTP testing dependency:**

- **`supertest`** `^7.2.2` and **`@types/supertest`** — use for end-to-end HTTP assertions once an app instance is obtainable from `src/bootstrap/` wiring (e.g. after `setupContainer` / `createExpressApp` patterns in `src/presentation/http/express/app` and `src/bootstrap/create-http-server.ts`).

**What to mock:**

- **External SaaS** (email, OAuth, S3) in integration tests when credentials are unavailable.
- **Clock/time** for OTP or token expiry scenarios.

**What NOT to mock:**

- **MongoDB / Redis** in **true** integration tests if the goal is pipeline realism — use test containers or dedicated test databases (not defined in-repo at analysis time).

## Fixtures and Factories

**Test data:**

- **`@faker-js/faker`** is a **runtime dependency** in `package.json` — usable in seeds (`src/infrastructure/persistence/seed/`) and **can** seed integration tests; no dedicated `tests/fixtures/` pattern exists yet.

**Location:**

- Prefer **`tests/fixtures/`** or factory helpers under **`tests/helpers/`** when introducing tests; document shared builders next to integration specs.

## Coverage

**Requirements:**

- **None enforced** — no `coverage` script or threshold in `package.json` or `vitest.config.ts` at analysis time.

**View coverage (when enabled):**

Add Vitest coverage config (e.g. `provider: 'v8'`) and run:

```bash
npx vitest run --coverage
```

## Test Types

**Unit tests:**

- **Not configured** in `vitest.config.ts` `include`. To add unit tests, extend **`include`** with e.g. `src/**/*.test.ts` or a dedicated `tests/unit/**/*.test.ts` tree.

**Integration tests:**

- **Target layout:** `tests/integration/**/*.test.ts` — aligns with sequential workers and 60s timeouts for DB/API flows.

**E2E tests:**

- **Not detected** (no Playwright/Cypress). Socket-heavy behavior would need **`socket.io-client`** (already `devDependencies`) if tested outside HTTP-only paths.

## Common Patterns

**Async testing:**

```typescript
import { describe, it, expect } from 'vitest';

describe('feature', () => {
  it('does something', async () => {
    const result = await someAsyncFn();
    expect(result).toBeDefined();
  });
});
```

**Alias resolution in tests:**

- **`vitest.config.ts`** defines **`resolve.alias`** `@` → `./src` — imports like `@/bootstrap/...` work in test files the same as application code.

**Error testing:**

- Assert HTTP status and JSON body when using Supertest; assert **`ErrorResponse`** subclasses or mapped validation errors when invoking handlers or use cases directly.

---

*Testing analysis: 2026-05-02*
