# Phase 1: Chat database foundation - Context

**Gathered:** 2026-03-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

Chat persistence lives on a **second MongoDB database** on the **same cluster** as the social app, selected by **`DATABASE_CHAT_NAME`**. Phase 1 delivers: env + config wiring, a real second `Db` handle (same `MongoClient` as social), successful connectivity check for both databases, and documentation so deploy/local dev do not guess variable names. **No chat collections or indexes** are created in this phase (deferred to Phase 4). Chat DB may be empty without breaking startup.

</domain>

<decisions>
## Implementation Decisions

### Chat DB failure / availability

- **D-01:** If the chat database cannot be reached or `ping` fails (wrong name, permissions, network), the process **fails fast** — do **not** run social-only with chat silently disabled.

### Environment variable `DATABASE_CHAT_NAME`

- **D-02:** **`DATABASE_CHAT_NAME` is required in all environments** (development, staging, production). No implicit dev default in application code.

### Phase 1 scope (beyond opening `Db`)

- **D-03:** Phase 1 is **connect + ping** the chat `Db` and expose it for later phases. **Do not** create chat collections or indexes here; Phase 4 owns schema and indexes.

### MongoDB URI strategy

- **D-04:** Use the **existing `DATABASE_URI`** (same cluster). Second database is selected only via **`DATABASE_CHAT_NAME`**. A **separate chat URI** is **out of scope** for Phase 1; note as backlog if ever needed for DR / separate cluster.

### Claude's Discretion

- Exact placement of `getChatDb()` / service API surface on `DatabaseService` or companion type, logging shape for dual-db ping, and ordering of `connect()` steps — as long as D-01–D-04 hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & scope

- `.planning/PROJECT.md` — Dual DB decision, `DATABASE_CHAT_NAME`, constraints (no Mongoose for chat in scope doc).
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, requirements INFR-01 / INFR-03.
- `.planning/REQUIREMENTS.md` — INFR-01, INFR-03 acceptance intent.

### Research

- `.planning/research/SUMMARY.md` — Build order, dual `Db` on one client.
- `.planning/research/STACK.md` — Mongo client / two `Db` handles pattern.

### Code integration points

- `src/database/mongodb/database.service.ts` — Current single-`Db` `DatabaseService`; integration point for second `Db`.
- `src/config/envConfig.ts` — `ENV_KEYS` strict validation; add `DATABASE_CHAT_NAME` here and mirror in `.env.example` / env docs.
- `src/database/mongodb/index.ts` (or equivalent export) — If present, export pattern for consumers.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `DatabaseService` already wraps `MongoClient` and `Db` with `connect()`, `close()`, and collection getters for the social DB.

### Established patterns

- Env vars are **fail-fast** at load time via `envConfig` (`ENV_KEYS` all required).
- App bootstrap connects Mongo and initializes indexes in `createApp` flow.

### Integration points

- `src/app.ts` / bootstrap: where `DatabaseInstance.init` runs — second `Db` must participate in connect lifecycle and `close()` on shutdown without a second client.
- Future `Container` / repositories (Phase 4+) will need typed access to chat `Db`; Phase 1 should expose a clear, minimal API.

</code_context>

<specifics>
## Specific Ideas

User chose **`recommend`** in discuss-phase: align with roadmap success criteria and stack research (one URI, two database names, mandatory `DATABASE_CHAT_NAME`, fail-fast on chat DB errors, no indexes in Phase 1).

</specifics>

<deferred>
## Deferred Ideas

- **Separate `MONGODB_URI` (or equivalent) for chat** — only if product later requires another cluster or DR split; not Phase 1.

### Reviewed Todos (not folded)

- None.

</deferred>

---

*Phase: 01-chat-database-foundation*  
*Context gathered: 2026-03-21*
