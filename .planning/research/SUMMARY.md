# Project Research Summary

**Project:** nodejs-social  
**Domain:** Brownfield TypeScript/Express social backend — friend graph, merged feed, dual-database chat, durable notifications + Socket.IO (single process)  
**Researched:** 2026-03-21  
**Confidence:** HIGH (stack boundaries, architecture, project-scoped pitfalls); MEDIUM (test tooling choice, long-horizon scale not load-tested here)

## Executive Summary

This product is a **unified social + messaging API**: users build a **mutual friend graph** (replacing followers), consume a **chronological merged feed** with strict visibility and block rules, and chat **only with friends** via **direct and group** conversations persisted in a **second MongoDB database** on the same cluster, while **notifications** live on the **social DB** with **REST as source of truth** and Socket.IO for realtime hints. Experts implement this as a **layered monolith** (route → controller → service → repository): one `MongoClient` with two `Db` handles, **chat services that read social via narrow interfaces** for eligibility, and **one command path** (validate → persist → emit) shared by HTTP and sockets.

The recommended approach from research: **establish persistence split and graph rules before socket work** — wire `DATABASE_CHAT_NAME` and chat repositories, implement **friends, block, unfriend, and rate limits**, then **post visibility + merged feed + engagement under one permission matrix**, then **HTTP-only chat** replacing the experimental `/api/conversations`, then **notification inbox + hooks**, and **last** replace Socket.IO chat so handlers call the **same services** as REST. **Do not** add Mongoose, a separate chat HTTP service, or Cloudinary; **defer** ranking, moderation, and legacy API compatibility.

Primary risks are **security and consistency**, not raw CRUD: **trusting client `senderId` or room IDs**, **emitting before DB commit**, **authorization drift** between social and chat DBs, and **visibility/block holes** on non-feed paths (get-by-id, comments). Mitigate with **JWT-derived identity everywhere**, **persist-then-emit**, **re-check friend/block on send/join**, a **central “can view / can comment” guard**, **~100 friend requests/day per user**, and **explicit CORS allowlists** with credentials. For scale later: **@socket.io/redis-adapter** with **sticky sessions**; accept that **connection state recovery** does not work with that adapter.

## Key Findings

### Recommended Stack

Keep the existing stack; **reinforce patterns** for the milestone. **One `MongoClient`, two `db()` handles** for social vs `DATABASE_CHAT_NAME` reduces pools and simplifies shutdown vs two clients (second client only if pool tuning demands it). **Socket.IO ^4.8** stays in-process until multi-node; then add **`@socket.io/redis-adapter`** with **`ioredis`** pub/sub — not the `redis` package per Socket.IO guidance. **Notifications on social `Db`**; **BullMQ** for non-latency-critical async work, not as sole path for user-visible realtime. **Testing**: add **Vitest + supertest** and **either** `mongodb-memory-server` **or** `@testcontainers/mongodb` — pick one CI strategy; avoid binding tests to production `DATABASE_URI`.

**Core technologies:**

- **MongoDB native driver (^7.x)** — social + chat DBs on one cluster; no Mongoose for chat — aligns with brownfield and PROJECT.md.
- **Socket.IO (^4.8.x)** — realtime; in-memory adapter for single instance; Redis adapter when horizontally scaling — official docs on sticky sessions and adapter limits.
- **Redis / ioredis / BullMQ (existing)** — rate limits, optional Socket adapter transport, background jobs — reuse for friend-request caps.
- **AWS S3 (existing)** — post and chat media — explicit rejection of Cloudinary.

### Expected Features

**Must have (table stakes):**

- **Two-way friendship** (request/accept/decline/revoke, list) + **unfriend** + **block** (mutual post hide including public, auto-unfriend) + **~100 outgoing requests/day** — trust and chat gate.
- **Post visibility** (`public` | `friends-only` | `only-me`), default public + **per-post stranger comment flag**; **merged chronological feed** (no ranking v1); **like, comment, bookmark** under the same permission matrix.
- **DM + group chat** (2-person groups allowed) on **chat DB**; **no DM without friendship**; **message history** and server-trusted identity.
- **Notification inbox** (DB + REST + mark read) + **socket emit on create**; types: `friend_request`, `friend_accepted`, `new_message`, `added_to_group`.
- **CONCERNS remediation** on chat/notification paths (no client `senderId`, persist before emit, participant checks).

**Should have (competitive):**

- **DB + REST + socket notifications** vs socket-only — durable inbox + realtime.
- **Separate chat database** without a second HTTP service — operational boundary, unified `/api/...` routes.
- **Strict friends-only chat** and **strong block semantics** — predictable privacy.

**Defer (v2+):**

- Moderation/reporting, **feed ranking**, legacy FE/API parity, **DM requests to strangers**, separate chat microservice, Mongoose/Cloudinary for chat.

### Architecture Approach

Single **HttpServer** serves Express and Socket.IO. **Four logical contexts** (social, chat, notifications, realtime transport) share one process: **social** owns graph, posts, feed, blocks, notification **documents**; **chat** owns conversations/messages/membership on **chat DB** and may **call social services** for ACL; **notifications** are created **after** successful social/chat writes; **socket layer** joins rooms and emits **only after** services succeed — **no business rules or repository access isolated in raw handlers**.

**Major components:**

1. **Social** — friends, posts, visibility, merged feed, blocks, notification persistence.
2. **Chat** — chat DB repositories; eligibility via **injected** friend/block interfaces; **not** imported by social persistence.
3. **Notifications** — `NotificationService` + repo on social DB; called from social and chat application services.
4. **Realtime** — thin adapter: auth handshake, rooms, emit from **shared** `ChatService` / notification flows.

**Build-order mantra:** Persist split → graph rules → durable chat → REST contract → notification store → realtime as thin edge.

### Critical Pitfalls

1. **Trusting client identity in socket (or REST) payloads** — derive actor only from verified JWT / handshake; reject mismatched `senderId`/`userId` in payloads.
2. **Emitting before durable write** — ghost messages and desync; single path: **validate → persist → emit**; idempotency keys on retried sends where needed.
3. **Authorization drift across two databases** — re-verify friend/block on send/join; consistent policy for block/unfriend on existing conversations; same rules for REST and socket.
4. **Block + visibility only on feed** — centralize **can viewer see post?** and **can stranger comment?** for feed, get-by-id, search, and comment create.
5. **Notification socket-only or emit-before-DB** — **DB row is truth**; stable ids / idempotency; list + mark-read drive UI; socket as push hint.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Persistence foundation (chat DB split)

**Rationale:** Chat code without a real `DATABASE_CHAT_NAME` boundary causes migration pain and couples experimental data to social DB (anti-pattern per PROJECT.md).  
**Delivers:** Second `Db` handle (or `ChatDatabaseService`), `DATABASE_CHAT_NAME` env, container registration, index/bootstrap discipline for chat collections (can start empty).  
**Addresses:** Architectural decision “chat DB riêng”; STACK dual-DB pattern.  
**Avoids:** Storing chat collections on social DB “for simplicity”; two `MongoClient`s by default.

### Phase 2: Friends, block, unfriend, rate limits

**Rationale:** Product rule **no DM without friendship** and PITFALLS cross-DB authz require **authoritative graph** before chat eligibility.  
**Delivers:** Replace followers with friends flow, block/unfriend semantics, **~100 requests/day** cap, indexes/idempotency for pending requests; **narrow interfaces** (`IFriendshipService`, `IBlocklistService`) for chat to consume later.  
**Addresses:** Table stakes graph + safety; notification types `friend_request`, `friend_accepted` (can land here or early Phase 5).  
**Avoids:** Friend-request spam; chat open to non-friends; inconsistent block+friend state.

### Phase 3: Posts, visibility, merged feed, engagement

**Rationale:** Feed is the **highest-integration** read surface; partial rules leak private content (PITFALLS 4).  
**Delivers:** Per-post visibility + stranger-comment flag; **central visibility/comment guards**; merged chronological feed; like/comment/bookmark under matrix.  
**Addresses:** Core feed and engagement table stakes.  
**Avoids:** Post detail or comments bypassing feed rules; naive unindexed feed queries (watch explain plans).

### Phase 4: Chat HTTP (replace experimental conversations)

**Rationale:** **HTTP-first** chat API proves persistence and contracts before socket replacement (ARCHITECTURE steps 3–4).  
**Delivers:** Chat repositories/schemas on chat DB; REST for conversations/messages/membership/read as required; **replace** `/api/conversations`; S3 for chat media per stack.  
**Addresses:** DM + group; `new_message` / `added_to_group` hooks preparation.  
**Avoids:** Socket-first duplication; trusting client sender; emit-before-persist (no socket yet or minimal).

### Phase 5: Notifications (DB + REST + friend/chat hooks)

**Rationale:** Inbox is **durable truth**; friend and chat events should create rows **then** optionally fan out.  
**Delivers:** Notification collection on social DB, service, REST list/mark-read; wire **friend** events; wire **chat** → `new_message`, `added_to_group`; **emit after** insert.  
**Addresses:** Notification table stakes and differentiator (DB + REST + socket).  
**Avoids:** Socket-only notifications; duplicate rows without idempotency.

### Phase 6: Socket.IO replacement (chat + notification delivery)

**Rationale:** **Last** so handlers delegate to **same services** as HTTP (ARCHITECTURE step 7).  
**Delivers:** Handshake auth aligned with HTTP; conversation/user rooms; events calling **ChatService** / notification paths; remove experimental relay; optional online/typing as designed.  
**Addresses:** Realtime parity; CONCERNS on socket trust and ordering.  
**Avoids:** Duplicate business logic; emit before persist; room join without membership check.

### Phase 7: Quality, testing, and hardening

**Rationale:** PROJECT.md calls out **no test runner yet**; PITFALLS map many checks to **integration tests**.  
**Delivers:** Vitest + supertest (+ Mongo test strategy); tests for forged sender, failed write ⇒ no emit, visibility matrix, notification create order; CORS/credentials verification; Express 5 middleware smoke.  
**Addresses:** v1.x trigger “test runner + CI”; regression prevention on graph + chat.  
**Avoids:** “Looks done” DM without history parity; wildcard CORS with credentials.

### Phase Ordering Rationale

- **Dependencies:** Auth/users exist → **graph** before **chat eligibility** → **visibility/feed** needs **friends + block** → **HTTP chat** before **socket** → **notifications** bridge social and chat → **tests** validate cross-cutting invariants.
- **Grouping:** Matches **bounded contexts** and **single persist-then-emit** pattern.
- **Pitfall avoidance:** Identity, ordering, cross-DB authz, and visibility centralized before realtime volume.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3 (feed):** Compound indexes and query shape for merged public + friends feed under block — may need `/gsd-research-phase` or spike if explain plans disappoint.
- **Phase 7 (testing):** Choose **mongodb-memory-server** vs **Testcontainers** per CI; Vitest/Node LTS matrix — short research if team has no precedent.

Phases with standard patterns (skip extra research-phase unless blocked):

- **Phase 1 (dual DB):** Driver `MongoClient#db` is documented; matches existing `DatabaseService` style.
- **Phase 6 (Socket.IO):** Official Redis adapter + sticky-session docs; defer sharded adapter until Redis 7 + measured need.
- **Phase 2 (graph):** Standard collection + index patterns; no graph DB for v1.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH / MEDIUM | HIGH for Mongo dual-DB + Socket.IO patterns (official docs); MEDIUM for Vitest/test DB choice not wired in repo. |
| Features | HIGH | Grounded in PROJECT.md; market norms MEDIUM. |
| Architecture | HIGH / MEDIUM | HIGH for boundaries and build order vs PROJECT + codebase map; MEDIUM for scale until profiled. |
| Pitfalls | HIGH / MEDIUM | HIGH for CONCERNS-aligned items; MEDIUM for generic OWASP-style phrasing. |

**Overall confidence:** **HIGH** for what to build and in what order; **MEDIUM** on test infrastructure and feed performance details until implementation.

### Gaps to Address

- **Cross-DB consistency:** No atomic transaction social ↔ chat — use **ordered operations**, sagas, or **idempotency** on message send (STACK/PITFALLS).
- **Group membership + sockets:** Define policy for **removed users** (leave rooms / reconnect) and **history for new members** — verify in Phase 4/6.
- **Block impact on notifications:** Product policy for existing notifications when users block — clarify during planning (PITFALLS UX note).
- **Scale-out runbook:** When adding Redis adapter, document **sticky sessions**, **Redis outage** (local-only broadcast), and **no connection state recovery** with adapter.

## Sources

### Primary (HIGH confidence)

- `.planning/PROJECT.md` — requirements, dual DB, notifications model, out of scope, key decisions.
- `.planning/research/STACK.md` — MongoDB Node driver, Socket.IO Redis adapter, ioredis, compatibility notes (with cited official URLs in STACK.md).
- `.planning/research/ARCHITECTURE.md` — components, patterns, suggested build order.
- `.planning/research/PITFALLS.md` — CONCERNS-aligned and phase-mapped pitfalls.
- `.planning/codebase/CONCERNS.md` (referenced throughout research) — P0/P1 remediation targets.

### Secondary (MEDIUM confidence)

- Industry norms for social/chat (FEATURES competitor table) — generic patterns, not a single competitor study.
- OWASP-style identity and authorization practice (PITFALLS) — phrasing MEDIUM confidence.

### Tertiary (LOW confidence)

- Optional Zod vs express-validator (STACK) — preference only; avoid dual validation frameworks without clear win.

---
*Research completed: 2026-03-21*  
*Ready for roadmap: yes*
