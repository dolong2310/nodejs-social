# Roadmap: nodejs-social (brownfield v1 evolution)

## Overview

Evolve the existing TypeScript/Express social backend by splitting chat persistence (`DATABASE_CHAT_NAME`), replacing followers with a mutual friend graph (block/unfriend/rate limits), enforcing post visibility and a merged chronological feed with consistent engagement rules, shipping HTTP-first chat to replace experimental conversations, adding a durable notification inbox with REST + socket fan-out, then replacing Socket.IO chat on top of the same services—finishing with CONCERNS remediation verification and an automated test baseline.

## Phases

**Phase numbering:** Integer phases are planned milestone work; decimal phases (e.g. 2.1) are urgent insertions between integers.

- [x] **Phase 1: Chat database foundation** — Second Mongo `Db`, env wiring, and documented configuration for `DATABASE_CHAT_NAME`
- [x] **Phase 2: Friends graph & privacy** — Remove legacy followers; mutual friends, requests, unfriend, block/unblock, daily request cap (completed 2026-03-21)
- [ ] **Phase 3: Posts, feed & engagement** — Per-post visibility, merged feed, likes/comments/bookmarks under one permission matrix
- [ ] **Phase 4: Chat HTTP API** — Friend-gated direct and group conversations, messages, read state, S3 media; replace `/api/conversations`
- [ ] **Phase 5: Notifications inbox** — DB + REST list/mark-read, v1 types, hooks from graph and chat, emit-after-persist
- [ ] **Phase 6: Realtime (Socket.IO)** — Replace chat socket flow; JWT identity, rooms, online presence, persist-then-emit via shared services
- [ ] **Phase 7: Quality hardening & tests** — Close CONCERNS gaps on implemented paths; test runner + smoke/integration coverage

## Phase Details

### Phase 1: Chat database foundation
**Goal:** Chat persistence is isolated on a second database on the same cluster, with configuration discoverable for deploys and local dev.
**Depends on:** Nothing (first phase)
**Requirements:** INFR-01, INFR-03
**Success Criteria** (what must be TRUE):
  1. Running app opens both social and chat databases from documented env (`DATABASE_CHAT_NAME` + same cluster URI pattern as PROJECT.md).
  2. A client of the codebase can configure chat DB name from `.env` / example env without reading source to guess variable names.
  3. Chat collections can be bootstrapped or left empty without breaking social DB startup (chat boundary is real, not deferred).
**Plans:** 1/1 plans complete

### Phase 2: Friends graph & privacy
**Goal:** Users manage mutual friendships and blocks with spam limits; legacy follower data and APIs are gone.
**Depends on:** Phase 1 (chat DB available for downstream phases; can run parallel infra work but graph is social-DB–centric)
**Requirements:** INFR-02, FRND-01, FRND-02, FRND-03, FRND-04, FRND-05, FRND-06, BLCK-01, BLCK-02, BLCK-03
**Success Criteria** (what must be TRUE):
  1. User can send, accept, decline, and revoke friend requests; pending states stay consistent (no duplicate valid requests to self).
  2. User can list friends and see sent/received requests with enough fields for a typical client UI.
  3. Outgoing friend requests are capped at approximately 100 per user per day (rolling or calendar day—documented in behavior).
  4. User can unfriend; user can block another user (auto-unfriends if needed); either party can unblock without dead-end UX.
  5. If either user blocks the other, neither sees the other’s posts in any read path, including `public` posts.
  6. Legacy follower APIs and follower persistence are removed (drop/no migration), per product decision.
**Plans:** 4/4 plans complete

Plans:
- [x] 02-01-PLAN.md — Graph schemas, `DatabaseService` indexes + getters for `friendships` / `friendRequests` / `blocks`; friendship + request + block repositories (BLCK-02)
- [x] 02-02-PLAN.md — INFR-02: remove followers stack + DB follower wiring; `FriendsService` read/cache; rewire Container, `app.ts`, posts + search
- [x] 02-03-PLAN.md — `/api/friends` REST (FRND-01…06), UTC daily cap, D-12 block guard on requests
- [x] 02-04-PLAN.md — `/api/blocks` (BLCK-01, BLCK-03, D-14), Swagger + fake-data + messages, INFR-02 grep completion

### Phase 3: Posts, feed & engagement
**Goal:** Posts respect visibility and stranger-comment rules; the home feed merges public and friends-only content chronologically; engagement matches the same rules everywhere.
**Depends on:** Phase 2 (friends + block semantics)
**Requirements:** POST-01, POST-02, POST-03, FEED-01, FEED-02, ENGA-01, ENGA-02, ENGA-03
**Success Criteria** (what must be TRUE):
  1. Each post supports `public` | `friends-only` | `only-me`; new posts default to `public` with stranger comments allowed by default.
  2. Author can set or change visibility and the stranger-comment flag on create/update according to API rules.
  3. Authenticated user’s feed includes eligible public posts system-wide (policy-aligned) plus friends’ posts they’re allowed to see, sorted by `createdAt` descending (no ranking in v1).
  4. Strangers who can see a `public` post may like and bookmark; they may comment only when the stranger-comment flag allows it.
  5. For `friends-only` and `only-me`, only the intended audience can view or interact (consistent with block rules).
**Plans:** TBD

### Phase 4: Chat HTTP API
**Goal:** Users message only friends via REST-backed conversations (direct and groups), with history and read semantics; experimental conversations are replaced.
**Depends on:** Phase 1, Phase 2
**Requirements:** CHAT-01, CHAT-02, CHAT-03, CHAT-04
**Success Criteria** (what must be TRUE):
  1. Two friends can open a direct conversation; non-friends cannot open a DM/inbox with each other through the API.
  2. User can create a group chat with multiple friends (groups of two members allowed); membership rules match agreed product constraints.
  3. API replaces the experimental `/api/conversations` flow: list/create conversations, send messages, paginated/cursor history, mark read when appropriate (e.g. last message from others).
  4. Chat attachments use S3 and existing auth patterns (no Cloudinary).
**Plans:** TBD

### Phase 5: Notifications inbox
**Goal:** Users have a durable in-app notification inbox with REST; creating a row optionally pushes in realtime after persist.
**Depends on:** Phase 2, Phase 4 (friend lifecycle + chat events for message/group types)
**Requirements:** NOTF-01, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. User can list notifications with pagination and mark items read (single or batch—minimum viable for v1).
  2. System supports extensible schema with v1 types: `friend_request`, `friend_accepted`, `new_message`, `added_to_group`.
  3. When a notification is created, the server emits a Socket.IO event to the recipient’s user channel after the DB write succeeds (inbox remains source of truth).
**Plans:** TBD

### Phase 6: Realtime (Socket.IO)
**Goal:** Realtime chat and personal channels align with HTTP: authenticated identity from JWT, correct rooms, no emit-before-persist for durable events.
**Depends on:** Phase 4, Phase 5
**Requirements:** SOCK-01, SOCK-02, SOCK-03
**Success Criteria** (what must be TRUE):
  1. Socket connection authenticates like HTTP; message sender identity is never taken from untrusted client fields.
  2. Client joins conversation rooms and per-user rooms for personal events; online presence (or equivalent) behaves consistently with product expectations.
  3. For messages and read state, data is persisted before broadcast to rooms (no ghost messages from socket path).
**Plans:** TBD

### Phase 7: Quality hardening & tests
**Goal:** Documented security/consistency issues on chat and socket paths are verified fixed; automated tests guard regressions.
**Depends on:** Phase 6
**Requirements:** QUAL-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. CONCERNS.md items scoped to socket identity and persist/emit ordering are addressed or explicitly verified closed on implemented chat/notification paths.
  2. Repository has a runnable test runner (e.g. Vitest) with smoke coverage for auth plus at least one minimal friend or chat flow (per research STACK guidance).
**Plans:** TBD

## Ordering notes

- **Phase 2 before 3:** Feed and engagement need authoritative friends + block lists.
- **Phase 2 before 4:** Chat eligibility is “friends only.”
- **Phase 4 before 6:** Socket handlers should delegate to the same services as HTTP (research: HTTP-first chat).
- **Phase 5 after 4 for full type set:** `new_message` / `added_to_group` need chat writes; friend types need Phase 2.
- **Phase 5 before 6:** Socket emit on notification create should match REST inbox (persist-then-emit).
- **Phase 7 last:** Tests and CONCERNS verification close the loop after realtime is in place.

## Progress

**Execution order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 (decimal insert phases, if any, sort between surrounding integers).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Chat database foundation | 01-01 | Complete    | 2026-03-21 |
| 2. Friends graph & privacy | 02-01 … 02-04 | Complete    | 2026-03-21 |
| 3. Posts, feed & engagement | TBD | Not started | - |
| 4. Chat HTTP API | TBD | Not started | - |
| 5. Notifications inbox | TBD | Not started | - |
| 6. Realtime (Socket.IO) | TBD | Not started | - |
| 7. Quality hardening & tests | TBD | Not started | - |

---

*Roadmap created: 2026-03-21 — brownfield evolution, standard granularity (7 phases)*
