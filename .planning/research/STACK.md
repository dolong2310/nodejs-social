# Stack Research — Brownfield Social + Chat Milestone

**Domain:** TypeScript Express 5 monolith extending **friend graph**, **dual-database chat** (`DATABASE_CHAT_NAME`), **persisted notification inbox + Socket.IO**, and **post visibility/feed rules** — MongoDB **native driver** (no Mongoose), Redis, BullMQ, AWS S3, existing Socket.IO.

**Researched:** 2026-03-21

**Overall confidence:** **HIGH** for Mongo dual-DB + Socket.IO scaling patterns (verified against official driver behavior and Socket.IO v4 docs); **MEDIUM** for test-tooling specifics (ecosystem consensus; not yet wired in this repo).

---

## Recommended Stack — New or Reinforced Pieces Only

### Persistence: second MongoDB database (native driver)

| Pattern / choice | Version | Purpose | Why (brownfield) | Confidence |
|------------------|---------|---------|------------------|------------|
| **Single `MongoClient`, two `Db` handles** | `mongodb` ^7.x (existing) | Social DB + chat DB on same cluster | One connection pool to the deployment reduces sockets and simplifies **graceful shutdown** (`client.close()` once). `MongoClient#db(dbName)` is the supported API for multiple logical databases on one cluster. | **HIGH** — [MongoDB Node driver `MongoClient`](https://mongodb.github.io/node-mongodb-native/7.1/classes/MongoClient.html#db) |
| **`appName` / logging tags per logical DB** | driver options | Ops: distinguish chat vs social in server logs | Optional `MongoClientOptions.appName` (e.g. `nodejs-social-chat`) on the shared client or document in code comments if one client: helps Atlas/slow-query attribution without a second client. | **HIGH** — [connection options](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/) |
| **Separate service module + repositories for chat DB** | — | Boundaries | Mirrors existing `DatabaseService` + collection getters; **inject** `Db` or a thin `ChatDatabaseService` that only exposes chat collections. Keeps route/service rules (“no DM until friends”) next to social `Db` while chat collections stay isolated. | **HIGH** — aligns with PROJECT.md bounded context |

**Second `MongoClient` to the same URI** — defer unless you need **independent** `maxPoolSize` / timeout tuning for chat vs social (operational edge case). Cost: duplicate pools and shutdown wiring.

### Realtime: Socket.IO (existing) + optional Redis adapter

| Pattern / choice | Version | Purpose | Why | Confidence |
|------------------|---------|---------|-----|------------|
| **Default in-memory adapter** | `socket.io` ^4.8.x (existing) | Single Node process | Zero new deps; correct for **one** HTTP server instance (current architecture). | **HIGH** |
| **`@socket.io/redis-adapter`** | ^8.x (install when scaling) | Multi-process / multi-node broadcast | Official adapter: uses Redis **Pub/Sub** so `io.to(userRoom).emit()` reaches sockets on **other** nodes. Compatible table: adapter **7.x+** with Socket.IO **4.3.1+**. | **HIGH** — [Redis adapter docs](https://socket.io/docs/v4/redis-adapter/) |
| **`ioredis` pub + sub clients** | ^5.x (existing) | Adapter transport | Socket.IO docs recommend **ioredis** over `redis` for subscription recovery; matches repo’s existing Redis client choice. | **HIGH** — [Redis adapter — ioredis](https://socket.io/docs/v4/redis-adapter/) |
| **`createShardedAdapter` (optional)** | same package | Redis Cluster + heavy pub/sub | If production uses **Redis 7+** cluster and pub/sub becomes hot; reduces channel fan-out. Requires Redis 7 + compatible client versions per docs. | **MEDIUM** — only after profiling |

**Caveats (official):**

- **Sticky sessions** remain **required** when load-balancing multiple Socket.IO nodes — Redis adapter does **not** remove that; otherwise clients can hit a node without their session → HTTP 400 class failures. **Confidence: HIGH** — [Socket.IO multiple nodes](https://socket.io/docs/v4/using-multiple-nodes/).
- **Connection state recovery** is **not** supported with the Redis adapter. **Confidence: HIGH** — [Redis adapter supported features](https://socket.io/docs/v4/redis-adapter/).
- If Redis is down, broadcasts are **local node only** — design idempotent reads (REST/chat fetch) so clients recover. **Confidence: HIGH** — same docs.

**Optional later:** `@socket.io/redis-emitter` if a **BullMQ worker** (separate process) must emit without importing the full `Server` — keeps workers decoupled from HTTP. **Confidence: MEDIUM** (pattern valid; only if needed).

### App logic: notifications + graph (no new ORM)

| Pattern / choice | Purpose | Why | Confidence |
|------------------|---------|-----|------------|
| **Notifications in primary (social) `Db`** | Inbox + REST + socket fan-out | Friend graph and post visibility live on social DB; notification documents reference `userId`, `type`, `payload`, `readAt`. Single source for **list/mark-read** APIs. | **HIGH** — product shape in PROJECT.md |
| **BullMQ (existing)** | Async side effects | Use for **non-latency-critical** work (e.g. email digests, future fan-out). **Do not** defer **user-visible** socket delivery solely to a queue unless you accept delay; v1 expectation is **persist then emit** in request/worker path. | **HIGH** |
| **Redis (existing)** | Rate limits, cache, adapter | Friend-request **~100/day** cap fits `rate-limit-redis` / custom counters in Redis; reuse existing stack. | **HIGH** |
| **Zod (optional)** | Runtime validation | Only if team wants shared schemas for socket payloads + REST; repo already has **express-validator** — avoid duplicating validation frameworks without a clear win. | **LOW** — preference, not required |

### Testing (greenfield for this repo)

| Tool | Version (typical) | Purpose | Why | Confidence |
|------|-------------------|---------|-----|------------|
| **Vitest** | ^3.x | Unit + integration runner | Native **ESM** and TypeScript alignment with `"type": "module"`; fast watch; familiar Jest-like API. | **MEDIUM** — ecosystem standard 2024–2026; verify lockstep with Node LTS in CI |
| **supertest** | ^7.x | HTTP black-box tests | De-facto Express integration testing (`app` as listener). | **HIGH** |
| **MongoDB in tests** | **Either** `mongodb-memory-server` **or** `@testcontainers/mongodb` | Isolated Mongo for CI | Memory server: simple local/CI; Testcontainers: closer to prod driver behavior when Docker available. Pick one strategy per CI capability. | **MEDIUM** |
| **`@types/supertest`** | — | Types | Dev-only typings for supertest. | **HIGH** |

**Avoid** coupling production `DATABASE_URI` in tests; use env override in Vitest `setup` and `afterAll` cleanup.

---

## What NOT to Add (Project Decisions)

| Avoid | Why | Use instead |
|-------|-----|-------------|
| **Mongoose** | Explicit constraint; splits mental model from native repositories; chat must stay native. | `mongodb` driver + TS interfaces + indexes in init (as today). |
| **Cloudinary** | Explicit constraint; media policy is S3. | Existing S3 upload + presign patterns. |
| **Separate chat HTTP service / port** | Out of scope; one process, one port. | Chat module in `src/` + second `Db` only. |
| **Graph DB / Neo4j for v1 friends** | Overkill for bidirectional friends + block lists at expected scale. | Collections + compound indexes on social `Db` (`userId`, `targetUserId`, status, etc.). Revisit only if graph queries become the bottleneck. |
| **Second ORM “just for chat”** | Duplicated migration story and types. | One driver, two databases, clear repository boundaries. |
| **`redis` npm package** for Socket.IO adapter (if you add adapter) | Socket.IO docs cite subscription reconnection issues vs **ioredis**. | `ioredis` duplicate pub/sub clients per official examples. **Confidence: HIGH** |

---

## Anti-Patterns for This Milestone

| Anti-pattern | Consequence | Instead |
|--------------|-------------|---------|
| **Trusting `senderId` / room id from client** | Spoofing, cross-user leaks | Derive identity from **verified JWT** (existing handshake); server authorizes **membership** in conversation before join/emit. |
| **Emit before DB commit** | Ghost messages / lost truth | **Persist message + notification first**, then `io.to(room).emit`; clients reconcile via REST/cursor. |
| **Two Mongo clients by default** | Double pools, double shutdown bugs | Prefer **one client, two `db()`** unless pool isolation is measured need. |
| **Skipping sticky sessions** when horizontally scaling Socket.IO | Intermittent connection failures | Load balancer sticky cookie or IP hash **plus** Redis adapter. |
| **Storing full post bodies inside notification docs** | Unbounded document growth | Store `postId` / `conversationId` + denormalized snippet only if needed. |

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cross-DB **no atomic transaction** (social vs chat) | Medium | Saga-style or **order operations** (e.g. create conversation only after friendship invariant enforced in app code); use **idempotency keys** on message send if retried. |
| Socket.IO scale-out complexity | Medium | Stay single-node until needed; when scaling: Redis adapter + **sticky sessions** + runbook for Redis outage (degrade to REST polling optional). |
| Test flakiness (Mongo/Redis in CI) | Low–Medium | Single container image for CI; explicit `connect`/`close` in test lifecycle; avoid shared global state across workers. |
| Adapter + connection state recovery | Low | Do not rely on recovery feature if you adopt Redis adapter. |

---

## Version Compatibility Notes

| Component | Notes |
|-----------|--------|
| `socket.io` ^4.8.3 | Use `@socket.io/redis-adapter` **7.x+** per [compatibility table](https://socket.io/docs/v4/redis-adapter/). |
| `ioredis` ^5.10.x | Meets examples for non-sharded adapter; for sharded adapter, docs require **ioredis@5.9.0+** and Redis **7.0+**. |
| `mongodb` ^7.1.0 | Keep chat and social on same major driver; use `Db` separation, not mixed Mongoose. |

---

## Installation Sketch (when you implement)

```bash
# Scaling Socket.IO (only when running multiple Node instances behind LB)
npm install @socket.io/redis-adapter

# Testing (suggested baseline)
npm install -D vitest supertest mongodb-memory-server @types/supertest
# or: npm install -D @testcontainers/mongodb
```

---

## Sources

- [Socket.IO v4 — Redis adapter](https://socket.io/docs/v4/redis-adapter/) — adapter behavior, ioredis recommendation, sticky sessions, connection state recovery limitation, compatibility table.
- [Socket.IO v4 — Using multiple nodes](https://socket.io/docs/v4/using-multiple-nodes/) — sticky session requirement.
- [MongoDB Node.js driver — Connection options](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/) — `appName`, pooling semantics.
- [MongoDB Node.js driver — MongoClient#db](https://mongodb.github.io/node-mongodb-native/7.1/classes/MongoClient.html#db) — multiple databases, one client.
- Project evidence: `.planning/PROJECT.md`, `.planning/codebase/STACK.md`, `src/database/mongodb/database.service.ts`.

---
*Stack research: brownfield realtime + graph + notifications for nodejs-social.*
