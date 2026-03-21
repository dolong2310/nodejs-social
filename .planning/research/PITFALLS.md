# Pitfalls Research

**Domain:** Social graph + feed visibility + realtime chat + notification inbox (brownfield Express/Mongo/Socket.IO)
**Researched:** 2026-03-21
**Confidence:** HIGH for project-specific items (grounded in `.planning/codebase/CONCERNS.md`); MEDIUM for general industry patterns (OWASP/community wisdom, not single official spec)

## Critical Pitfalls

### Pitfall 1: Trusting client identity in socket (or REST) payloads

**What goes wrong:**
Users impersonate others: send messages “as” another user, join rooms they should not, or trigger notifications for victims. Incidents look like “random DMs” or data corruption in message history.

**Why it happens:**
Developers mirror REST body fields (`senderId`, `userId`) in socket events for convenience, or reuse DTOs without re-binding identity server-side after JWT verification.

**How to avoid:**
Derive actor identity only from verified session: decoded JWT / `socket.data` set in handshake middleware. Reject events where any payload identity ≠ authenticated user. Log structured security events on mismatch. Apply the same rule to notification “actor” fields.

**Warning signs:**
- Handler reads `payload.senderId` or `payload.userId` without comparing to token subject.
- “Works in Postman” when manually setting IDs.
- No tests for forged sender payloads.

**Phase to address:**
**Chat & socket replacement** (core fix); **Notifications** (emit paths must use server-derived user id); **Friends/block** (any socket presence or graph events).

---

### Pitfall 2: Emitting realtime events before durable write

**What goes wrong:**
Recipients see messages or notifications that never appear after refresh; or duplicates after retry; ordering and “read” state diverge between clients and DB.

**Why it happens:**
Socket emit is fast; DB write is slower. Teams optimize for “snappy UX” and skip transactional ordering, or fail open on write errors after emit.

**How to avoid:**
Define a single command path: **validate → persist → then emit** (same process, same request idempotency key where applicable). On write failure, **do not** emit success. Return error to sender; optionally emit a failure ack. Document delivery semantics (at-most-once vs at-least-once) and align client retry behavior.

**Warning signs:**
- TODO comments around persistence next to `socket.emit`.
- Clients show messages that `GET` history does not return.
- No correlation id between DB document and socket payload.

**Phase to address:**
**Chat** (messages, read receipts, typing if any); **Notifications** (create row then emit to user room).

---

### Pitfall 3: Authorization drift across two databases (social vs chat)

**What goes wrong:**
Users message or read conversations after friendship ended, or while blocked; feed shows posts that visibility rules should hide; “ghost” access after graph changes.

**Why it happens:**
Chat DB is separate (`DATABASE_CHAT_NAME`). Teams cache membership in memory or assume room membership is enough, without re-checking friend/block at send time.

**How to avoid:**
Treat **friendship + block** as authoritative for DM eligibility; on every send (or on join), verify against social DB (or synced projection with explicit invalidation). For groups, verify membership document in chat DB. After block/unfriend, define whether existing conversations are hidden, read-only, or deleted — and enforce consistently in REST **and** socket.

**Warning signs:**
- “Join room by conversationId” with no server-side membership check.
- Different rules in REST vs socket for the same action.
- Stale friend list in chat service with no TTL or event invalidation.

**Phase to address:**
**Friends & block** (define invariants); **Chat** (enforce on join/send); **Feed & visibility** (block hides posts both ways).

---

### Pitfall 4: Block + visibility + “public” edge cases

**What goes wrong:**
Blocked users still see each other’s content via direct object fetch, search, or cached feed; comments allowed when product intent was deny; inconsistent “public” vs “friends-only” on share links.

**Why it happens:**
Visibility applied only on feed aggregation, not on **get-by-id**, search, or comment endpoints. Block list omitted from one code path.

**How to avoid:**
Centralize **“can viewer see this post?”** (and **“can viewer comment?”**) in one service/helper used by feed, single post, search snippets, and comment create. Include block symmetry and friendship flags in that check. Add integration tests for: public + stranger comment flag; friends-only; block both directions.

**Warning signs:**
- Post detail endpoint returns 200 when feed correctly hid the post.
- Comment API checks only “post exists,” not author–viewer relationship.

**Phase to address:**
**Feed & post visibility** (primary); **Friends & block** (data model); regression tests in **Quality / testing** phase.

---

### Pitfall 5: Friend-request spam and graph abuse

**What goes wrong:**
Harassment via request floods, notification noise, and DB bloat; rate limits bypassed by rotating IPs if only IP-based.

**Why it happens:**
Product adds requests without per-user quotas, idempotency, or compound indexes for “pending request uniqueness.”

**How to avoid:**
Enforce **~100 outgoing requests / user / day** (per PROJECT.md). Use unique partial index or idempotent “upsert” for pending (sender, target). Rate limit by authenticated user id. Consider captcha or cooldown only if metrics show need (defer unless abuse appears).

**Warning signs:**
- Single user creates thousands of `pending` rows.
- Duplicate pending requests from double-clicks.

**Phase to address:**
**Friends & block** (implementation + indexes).

---

### Pitfall 6: Notification duplication, missing inbox, or socket-only truth

**What goes wrong:**
Users lose notification history on new device; duplicate rows on retries; “unread count” wrong; socket fires but DB insert failed (or inverse).

**Why it happens:**
Emitting without persisting, or persisting without defining idempotency keys; client dedupes only in memory.

**How to avoid:**
**DB row is source of truth**; socket is a push hint. Use stable ids; optional idempotency key per (type, actor, target, entity). Mark-read and list APIs drive UI state; socket updates invalidate cache. Align event names and payloads with REST models.

**Warning signs:**
- No `GET /notifications` contract tests.
- Unread count computed only client-side.

**Phase to address:**
**Notifications**; reinforced in **Quality / testing**.

---

### Pitfall 7: CORS and credentials misconfiguration (especially dev)

**What goes wrong:**
Wildcard origins with credentials weaken CSRF/session assumptions; production-like bugs hidden until deploy; mobile or multi-origin clients break unpredictably.

**Why it happens:**
`origin: '*'` is convenient for local dev; combined with cookies or auth headers it is unsafe and sometimes invalid per spec.

**How to avoid:**
Use **explicit allowlist** per environment; mirror production policy in staging. Document required origins for FE. Keep production on `FRONTEND_URL` (or list) as already intended in CONCERNS.

**Warning signs:**
- `credentials: true` with `*`.
- Different CORS behavior only discovered in production.

**Phase to address:**
**Early / foundation** or first phase that touches `app.ts` / env; verify before **Chat** load testing from real FE origins.

---

## Moderate Pitfalls

### Pitfall 8: Feed query performance (naive merge of public + friends)

**What goes wrong:**
Full collection scans, slow feed, timeouts under moderate load.

**Why it happens:**
`$or` heavy pipelines without compound indexes; fetching all friend ids into huge `$in`.

**How to avoid:**
Index `createdAt`, `authorId`, `visibility` appropriately; cap page size; consider two-query merge or precomputed fanout later (out of v1 scope per PROJECT — but still index for current design).

**Warning signs:**
- Feed latency grows linearly with total posts.
- Explain plans show COLLSCAN.

**Phase to address:**
**Feed & post visibility**; tune in **Performance hardening** if split.

---

### Pitfall 9: Group chat membership races

**What goes wrong:**
Removed users still receive events; or new members miss history policy you intended.

**Why it happens:**
Room lists updated client-side; server does not version membership or disconnect stale sockets.

**How to avoid:**
On membership change, server-side **leave socket rooms** for removed users (or force reconnect). Document whether new members see full history or from-join only.

**Warning signs:**
- User removed from group still in room after refresh-less session.

**Phase to address:**
**Chat** (groups).

---

## Minor Pitfalls

### Pitfall 10: Express 5 + middleware ordering regressions

**What goes wrong:**
Subtle breakage in error handling or auth when upgrading or reordering middleware.

**Why it happens:**
Ecosystem still catching up to Express 5 (per CONCERNS).

**How to avoid:**
Smoke tests for auth → validation → controller chains; pin compatibility notes in CI.

**Warning signs:**
- Errors swallowed or wrong status after middleware change.

**Phase to address:**
**Quality / testing** (first test harness).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Socket emit before DB write | Feels instant | Split brain, support burden | **Never** for messages/notifications |
| Client-supplied `senderId` | Faster prototype | Account takeover / spoofing | **Never** |
| Skip tests until “after MVP” | Ships faster | Regressions on graph + chat | **Never** for auth, send message, visibility |
| Wildcard CORS in dev | Less config friction | Wrong security assumptions | Short-lived local only if **no** credentials; prefer allowlist |
| Duplicate logic for “can comment” in each route | Copy-paste speed | Inconsistent enforcement | **Never** — extract shared guard |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| MongoDB (two DBs) | Transactions assumed across DBs | Design sagas or per-DB consistency; avoid cross-DB atomic claims |
| Socket.IO | Trusting room name from client | Server assigns rooms from verified membership only |
| Redis / BullMQ | Using queue for realtime without persistence contract | Jobs for async work; user-visible events still need DB truth |
| S3 chat media | Reusing upload path without size/stream limits | Stream uploads; caps aligned with chat product limits |
| JWT | Long-lived tokens + stolen socket | Short access TTL, refresh flow, revoke list if required later |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unindexed feed / friend lookups | Slow feed, high CPU | Compound indexes, explain plans | Low thousands of active users if posts grow |
| N+1 user loads for author cards | Latency spikes | Batch load authors by id | Popular feeds |
| Per-request counter writes (existing pattern) | Write contention on read paths | Defer/batch (existing CONCERNS note) | Traffic above modest concurrent readers |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting socket payload identity | Spoofing, harassment | Server-derived user id only |
| Room join by guessing UUID | Data leak | Authz check + rate limit |
| Leaking blocked user existence | Privacy / stalking | Generic 404 or uniform errors where product requires |
| Notification payload leaks PII | Oversharing in push payload | Minimize socket body; fetch details via REST if needed |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Optimistic UI without server ack | Message “sent” then vanishes | Persist-then-emit + client reconcile |
| Inconsistent unread counts | Distrust of app | Server unread totals + socket increments |
| Block still shows old notifications | Feels like block failed | Define policy: hide related notifs or mark inactive |

## "Looks Done But Isn't" Checklist

- [ ] **DM:** “Socket works” but history API missing or divergent — verify same service owns write + read
- [ ] **Block:** Feed hidden but post by id still visible — verify all read paths
- [ ] **Friends:** Accept flow works but chat open to non-friends — verify send-time check
- [ ] **Notifications:** Socket received but refresh empty — verify DB insert before emit
- [ ] **Group chat:** Create works but membership change ignored in realtime — verify room lifecycle
- [ ] **CORS:** Works on localhost with curl — verify browser credentials + real FE origin

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Spoofed sender exploited | HIGH | Invalidate sessions if needed, audit logs, patch handler, backfill audit |
| Emit-before-persist in prod | MEDIUM–HIGH | Add gate, reconcile job to mark orphaned client events, communicate to users |
| Wrong visibility shipped | MEDIUM | Hotfix central guard, cache purge, optional data fix for violations |
| Notification duplicates | LOW–MEDIUM | Idempotency migration, dedupe by key, client dedupe temporary |

## Pitfall-to-Phase Mapping

Approximate phase alignment for **this** milestone (order follows dependency: graph → feed → chat → notifications → quality).

| Pitfall | Prevention phase | Verification |
|---------|------------------|--------------|
| Client identity in socket/payload | **Chat & socket replacement** (+ **Notifications** emit) | Unit/integration: forged `senderId` rejected; only token user can send |
| Emit before persist | **Chat**, **Notifications** | Tests: failed write ⇒ no emit; success ⇒ row exists before event |
| Cross-DB authz (friend/block vs chat) | **Friends & block** (rules) + **Chat** (enforce) | Matrix tests: unfriend/block ⇒ send/join denied |
| Visibility + block holes | **Feed & post visibility** | API tests: get-by-id, comment, search respect same rules |
| Friend-request spam | **Friends & block** | Rate limit + DB uniqueness tests |
| Notification truth vs socket | **Notifications** | Contract tests: create ⇒ row + optional emit order asserted |
| CORS/credentials | **Foundation / first shipping phase** | Config test or manual matrix with credentials |
| No automated tests | **Quality & test harness** (early enough to cover new work) | CI runs auth, message send, visibility, notification create |
| Feed/index performance | **Feed & post visibility** | Explain plans, load smoke |
| Group membership races | **Chat** (groups) | E2E or integration: remove user ⇒ no further events |

## Sources

- `.planning/PROJECT.md` — requirements, chat DB split, notification model, explicit “fix CONCERNS” items
- `.planning/codebase/CONCERNS.md` — P0/P1 socket trust, persistence, CORS, test gaps, bootstrap fragility
- OWASP-style practice: never trust client for identity; validate authorization per action (general web security, **MEDIUM** confidence for phrasing)
- Common distributed/realtime patterns: outbox / persist-then-publish mental model (industry pattern, **MEDIUM** confidence)

---
*Pitfalls research for: nodejs-social (social + chat backend)*  
*Researched: 2026-03-21*
