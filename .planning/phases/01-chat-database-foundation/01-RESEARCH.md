# Phase 1: Chat database foundation — Technical research

**Status:** Complete  
**Question answered:** What do we need to know to plan dual-DB wiring on this codebase?

---

## MongoDB driver pattern (same cluster, two databases)

- One `MongoClient` constructed with `DATABASE_URI`; call `client.db(DATABASE_NAME)` for social and `client.db(DATABASE_CHAT_NAME)` for chat.
- No second client is required for “same cluster, different database name” (official driver behavior).
- `Db` instances share the client’s connection pool; `close()` on the client tears down both.

## Integration with existing `DatabaseService`

- Current: `DatabaseService` holds `private client` + `private db` (social only); `connect()` pings `this.db` only.
- Minimal-change approach: extend constructor config with `chatDatabaseName: string`, add `private chatDb: Db` via `this.client.db(chatDatabaseName)`, ping both in `connect()` in sequence (social first, then chat — order matches “social bootstrap then chat boundary”).
- `IDatabaseService` today has no chat surface; Phase 1 can add `get chatDb(): Db` (or `getChatDb(): Db`) for future repositories without creating collections.
- **Do not** run `initializeIndexes()` on chat DB in Phase 1 (CONTEXT D-03).

## Fail-fast behavior (CONTEXT D-01)

- If chat `ping` throws, log with distinct context (`chatDatabase` name), `close()` client, rethrow — same pattern as existing social connect error path.

## Configuration wiring

- `envConfig.ts`: add `DATABASE_CHAT_NAME` to `ENV_KEYS` after `DATABASE_NAME` (group with Database).
- `AppConfig.database` / `index.ts` bootstrap: pass `chatDatabaseName: envConfig.DATABASE_CHAT_NAME` into `DatabaseInstance.init` (signature widens).
- `.env.example`: document `DATABASE_CHAT_NAME=""` with one-line comment (same cluster as `DATABASE_URI`).

## Logging / observability

- On successful connect, log both database names (not secrets): e.g. social `DATABASE_NAME` and `DATABASE_CHAT_NAME` for deploy verification.

## Risks / edge cases

- Wrong `DATABASE_CHAT_NAME` on cluster without create permissions: ping still succeeds if DB name is valid for the user; empty collections are fine.
- Typo in name: MongoDB creates namespace on first write — **ping** against empty DB still succeeds, so fail-fast is satisfied for connectivity.

## Validation Architecture

Phase 1 has **no test runner** yet (QUAL-02 is Phase 7). Validation for execution:

1. **Automated (grep / typecheck):** `DATABASE_CHAT_NAME` in `ENV_KEYS`, `.env.example`, and `DatabaseService` / bootstrap wiring.
2. **Runtime:** `npm run build` (or `tsc`) clean; start with valid env — logs show connection to both DBs; invalid chat name or unreachable cluster fails startup.
3. **Wave 0:** Not installing Vitest in Phase 1 unless a plan explicitly scopes a minimal smoke script — prefer manual startup check documented in plan acceptance criteria.

---

## RESEARCH COMPLETE
