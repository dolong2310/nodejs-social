# Phase 2: Friends graph & privacy — Research

**Researched:** 2026-03-21  
**Domain:** Mutual friendship graph, friend requests (capped), block list — MongoDB native driver + Express 5  
**Confidence:** HIGH (codebase + locked CONTEXT); MEDIUM (test infrastructure — none today)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked decisions (Phase boundary & D-01…D-16)

- Replace **all** legacy followers (API + persistence + related Mongo indexes) with **bidirectional friends** (send / accept / decline / revoke), **friend lists** and **sent–received requests**, **unfriend**, **block / unblock** with auto-unfriend, and **~100 outbound friend requests per user per calendar UTC day** (mechanism is planner’s discretion; must satisfy D-07/D-08). **No** post feed/visibility changes in this phase except exposing **block + friend** data for later phases. **No** full inbox notifications (Phase 5) — optional hooks/TODO only.
- **D-01:** Remove mount `/api/followers` and all follower route/controller/service/repository/schema/index Mongo per INFR-02. Do **not** keep old path with new semantics.
- **D-02:** New namespace **`/api/friends`** for lists, requests, send/accept/decline/revoke, unfriend. Sub-paths are for the planner; **never** reuse `/followers`.
- **D-03:** **`/api/blocks`** (or equivalent singular resource name) for block, unblock, and blocked list if UI needs it.
- **D-04:** Accepted friendship = **one undirected edge** on social DB: `userIdLow`, `userIdHigh` (ObjectIds, **always** `userIdLow < userIdHigh`), `createdAt`. **Unique** `(userIdLow, userIdHigh)`.
- **D-05:** Requests are **directed**: `fromUserId`, `toUserId`, `createdAt`. Only **pending** in DB; accept → create friendship + **delete** request; decline/revoke → **delete** request (no long-lived declined rows in v1).
- **D-06:** At most **one** pending request per directed pair `(fromUserId, toUserId)` — **unique index** (or equivalent).
- **D-07 / D-08:** Count cap on **calendar UTC day** (00:00–23:59:59.999 UTC), max **100** **new** sends (POST) per `fromUserId` per UTC day. Document in code comments + OpenAPI/behavior notes. “~100” acceptable; no rolling window unless product changes.
- **D-09:** After decline or revoke, sender **may** send again (subject to cap + duplicate-pending rules).
- **D-10:** If already friends: **reject** further same-direction request (409 or 400 with clear message).
- **D-11:** No self-requests (400).
- **D-12:** If a **block** exists (per D-16) between the pair: **no** sending and **no** processing of requests between them (403 vs 404 — pick one convention project-wide; planner/implementation discretion).
- **D-13:** **`blocks`** collection on **social** DB: `blockerId`, `blockedId`, `createdAt`. Unique `(blockerId, blockedId)`.
- **D-14:** On **block**: if friends, **delete** normalized friendship + **delete all pending friend requests** involving **both** users (both directions).
- **D-15:** **Unblock** deletes block doc only; does **not** recreate friendship.
- **D-16:** Phase 2 delivers **API + repository** so Phase 3 can filter “if **either direction** block, neither sees the other’s posts”; **post read-path filtering** is Phase 3, not required in Phase 2 except what’s needed to **test** block APIs.

### Claude's Discretion

- Sub-paths under `/api/friends`, specific HTTP status codes per endpoint, DTO field names, pagination (cursor vs offset), and daily-cap implementation (query `countDocuments` vs counter document) — must still satisfy D-07 and uniqueness/pending rules.
- Whether to use soft **404** vs **403** when block applies — choose **one** consistent convention across friends/blocks APIs.

### Deferred ideas (OUT OF SCOPE)

- Rename post audience enum `followers` → `friends-only` and all feed/read paths — **Phase 3** (POST-*, FEED-*, ENGA-*).
- Persisted notifications `friend_request` / `friend_accepted` + REST + socket — **Phase 5**; Phase 2 may only prepare idempotency hooks if desired.
- Extra rate limits beyond the 100/day cap (per-IP abuse) — not v1 unless a later phase adds them.
</user_constraints>

<phase_requirements>
## Phase requirements

| ID | Description | Research support |
|----|-------------|------------------|
| INFR-02 | Remove follower data/API/indexes; no follow→friend migration | Current follower surface area mapped below; drop `followers` collection + Redis `followers:*` keys pattern; swagger `/followers` |
| FRND-01 | Send friend request; no self; valid state | Directed `friendRequests` + unique pending + block checks (D-11, D-12, D-06) |
| FRND-02 | Accept → mutual friendship | Insert `friendships` normalized pair + delete request (D-04, D-05) |
| FRND-03 | Decline / revoke pending | Delete request (D-05, D-09) |
| FRND-04 | List friends + sent/received requests | Query by `userIdLow`/`userIdHigh` and `from`/`to` with indexes |
| FRND-05 | ~100 sends/user/UTC day | `countDocuments` on `friendRequests` with `fromUserId` + `createdAt` in UTC bounds, or counter doc (discretion) |
| FRND-06 | Unfriend | `deleteOne` on normalized friendship |
| BLCK-01 | Block; auto-unfriend | D-14 transaction or ordered deletes |
| BLCK-02 | Either-direction block hides posts (read path) | Phase 2: **repository/query helpers** below; Phase 3: wire into post/feed pipelines |
| BLCK-03 | Unblock endpoint | D-15 |
</phase_requirements>

## Executive summary

Phase 2 is a **brownfield replacement** of the asymmetric `followers` graph with **symmetric friendships**, **directed pending requests**, and **blocks** on the **existing social MongoDB database** (same `DatabaseService` / native driver pattern as today). The current codebase already centralizes the follower graph in a small set of modules (`FollowersRoute`, `FollowersService`, `FollowerRepository`, `followers` collection, Redis cache key `followers:${userId}`) but **threads** `IFollowersService` into **posts** (feed + audience validation) and **search** (`people_follow` filters). Those call sites must switch to a **`IFriendsService`** (or renamed equivalent) that exposes **friend IDs for “who I am connected to”** and **“is this user my friend?”** so Phase 3 can extend the same service with visibility rules without another rip-out.

**Primary recommendation:** Implement **`friendships`**, **`friendRequests`**, and **`blocks`** collections with the **unique indexes** from CONTEXT, add **`/api/friends`** and **`/api/blocks`**, delete **`/api/followers`** and follower modules, and add **`BlockRepository` methods for symmetric block checks** (see BLCK-02 hooks) even though post filtering waits for Phase 3.

## Current codebase findings

### Follower module (to remove per D-01 / INFR-02)

| Layer | File | Role |
|-------|------|------|
| Route | `src/routes/followers.route.ts` | `POST /`, `DELETE /:userId` under `/api/followers` |
| Controller | `src/controllers/followers.controller.ts` | Self-follow guard, idempotent messages |
| Service | `src/services/followers.service.ts` | `findFollowedUserIds`, `findFollowerId`, Redis `CACHE_KEYS.followers` |
| Repository | `src/repositories/follower.repository.ts` | `followers` collection CRUD |
| Schema | `src/models/schemas/follower.schema.ts` | `userId`, `followedUserId` |
| DB | `src/database/mongodb/database.service.ts` | `get followers()`, `createFollowersIndex()` composite `{ userId, followedUserId }` |

### Integration points (must be rewired, not deleted with the route)

| Consumer | Usage | Phase 2 expectation |
|----------|--------|----------------------|
| `src/app.ts` | `router.use('/followers', followersRouter())` | Mount `friends` + `blocks` routers; remove followers |
| `src/container/index.ts` | Wires follower repo/service/controller; injects into `SearchService`, `PostsController`, `PostsValidation` | Replace with friends + blocks wiring |
| `src/controllers/posts.controller.ts` | `findFollowedUserIds` for `getNewFeeds` | Same shape: **list of friend `ObjectId`s** for feed query (`followedUserIds` param can be renamed in implementation for clarity) |
| `src/validations/posts.validation.ts` | `findFollowerId` for `audience === FOLLOWERS` gate | Replace with **friendship check** (symmetric); **enum/string `followers` in API** may remain until Phase 3 per deferred — but **logic** must use friendship graph |
| `src/services/search.service.ts` + `src/repositories/search.repository.ts` | `findFollowedUserIds` for `people_follow` FOLLOWING / NOT_FOLLOWING | Inject friends service; semantics = **friends**, not followers |
| `src/constants/cache.constant.ts` | `followers: (userId) => \`followers:${userId}\`` | New key e.g. `friends:${userId}`; **invalidate** on accept/unfriend/block side-effects |
| `swagger/paths.yaml`, `tags.yaml`, `components.yaml` | `/followers`, tags, audience enums | Replace docs with friends/blocks; audience enum change **can** stay for Phase 3 if CONTEXT defers enum rename |
| `scripts/fake-data.ts` | `followMultipleUsers` inserts into `followers` | Seed **friendships** and/or **requests** instead |

### Established patterns to copy

- **Routing:** `BaseRoute` + `protect` + `appLimiter` + `usersValidation.userVerifiedValidation` + `userIdValidation` (as in `followers.route.ts`).
- **DI:** Manual `Container` construction order (queues → repos → services → controllers).
- **Mongo:** `DatabaseService` collection getters + `initializeIndexes()` parallel creation.
- **Errors:** `asyncHandler`, `BaseController`, shared `*Error` classes from `@/responses/error.response`.

**Confidence:** HIGH — direct file reads, 2026-03-21.

## Proposed data model and indexes

### Collection: `friendships` (D-04)

| Field | Type | Notes |
|-------|------|--------|
| `_id` | ObjectId | Default |
| `userIdLow` | ObjectId | Always `<` high |
| `userIdHigh` | ObjectId | Always `>` low |
| `createdAt` | Date | Friendship time |

**Indexes (suggested):**

- **Unique:** `{ userIdLow: 1, userIdHigh: 1 }` — enforces single edge.
- **List friends:** `{ userIdLow: 1 }` and `{ userIdHigh: 1 }` (two single-field indexes) so `$or: [{ userIdLow: u }, { userIdHigh: u }]` can use indexes (or planner uses two queries + merge — both valid).

### Collection: `friendRequests` (D-05, D-06, D-07)

| Field | Type | Notes |
|-------|------|--------|
| `fromUserId` | ObjectId | Sender |
| `toUserId` | ObjectId | Recipient |
| `createdAt` | Date | Used for ordering + **UTC daily cap** |

**Indexes:**

- **Unique:** `{ fromUserId: 1, toUserId: 1 }` — at most one pending doc per directed pair (D-06), valid while you **delete** on resolve (D-05).
- **Lists:** `{ toUserId: 1, createdAt: -1 }` (incoming), `{ fromUserId: 1, createdAt: -1 }` (outgoing).
- **Cap query:** `{ fromUserId: 1, createdAt: 1 }` for `countDocuments` in UTC window (D-07).

### Collection: `blocks` (D-13)

| Field | Type | Notes |
|-------|------|--------|
| `blockerId` | ObjectId | Actor |
| `blockedId` | ObjectId | Target |
| `createdAt` | Date | Audit / sort |

**Indexes:**

- **Unique:** `{ blockerId: 1, blockedId: 1 }`.
- **List blocked users:** `{ blockerId: 1 }`.
- **Reverse lookup (who blocked me / symmetric check):** `{ blockedId: 1 }`.

### BLCK-02 — Minimal repository hooks (Phase 3 consumes)

Implement **once** in `BlockRepository` (names illustrative):

1. **`isBlockedEitherWay(a: ObjectId, b: ObjectId): Promise<boolean>`**  
   `countDocuments({ $or: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] })` with limit 1 / `findOne` — O(indexed) for pair checks (single post author, single profile).

2. **`listUserIdsBlockedInEitherDirection(viewerId: ObjectId): Promise<ObjectId[]>`**  
   - `A = distinct blockedId where blockerId = viewerId`  
   - `B = distinct blockerId where blockedId = viewerId`  
   - return **union** (dedupe) — feed/search can `$nin` author ids or pre-filter in app layer.

3. **Optional (Phase 4 preview):** `isBlockedEitherWay` reused for **CHAT-01** (“only friends” + no session if blocked).

**Do not** implement post `aggregate` filtering in Phase 2 unless needed for a **focused test** proving block data exists (CONTEXT D-16).

**Confidence:** HIGH — aligns with MongoDB compound/`$or` patterns; driver `mongodb@7.1.0` (verified `npm view mongodb version`, 2026-03-21).

## API surface sketch (aligned with D-01…D-16)

Planner refines paths and status codes; below is a **coherent** starting point consistent with CONTEXT.

### `/api/friends` (D-02)

| Method | Suggested path | Action |
|--------|----------------|--------|
| GET | `/` or `/me` | List **friends** (paginated user summaries) |
| GET | `/requests/incoming` | Pending **to** current user |
| GET | `/requests/outgoing` | Pending **from** current user |
| POST | `/requests` | Body: `{ toUserId }` — send (D-07 cap, D-11, D-12, D-06, D-10) |
| POST | `/requests/:fromUserId/accept` *or* `/:requestId/accept` | Accept (planner picks id strategy) |
| POST | `/requests/:fromUserId/decline` | Decline → delete |
| DELETE | `/requests/:toUserId` *or* `/requests/outgoing/:toUserId` | Revoke → delete |
| DELETE | `/:userId` | Unfriend (D-04 pair delete) |

*Alternative:* single `POST /requests/:id/accept` if requests are addressed by `_id` — still satisfies D-05/D-06.

### `/api/blocks` (D-03)

| Method | Suggested path | Action |
|--------|----------------|--------|
| POST | `/` | Body: `{ userId }` — block (D-14 side-effects) |
| DELETE | `/:userId` | Unblock (D-15) |
| GET | `/` | List blocked user ids / profiles (if product needs) |

All routes: `protect`, verified user, `appLimiter` on mutations — match followers route style.

## Standard stack

### Core

| Library | Version | Purpose | Why standard |
|---------|---------|---------|--------------|
| `mongodb` | 7.1.0 (registry 2026-03-21) | Social DB collections + indexes | Already project ORM-less data layer |
| `express` | 5.2.1 | HTTP API | Existing `src/app.ts` |
| `ioredis` | ^5.x | Cache for friend-id lists | Same pattern as `FollowersService` |

### Supporting

| Library | Version | Purpose | When |
|---------|---------|---------|------|
| (none new required) | — | — | Prefer **no** new deps until test wave adds Vitest/Jest |

**Installation:** No new packages for core Phase 2 graph; tests may add `vitest` / `supertest` later (see Validation Architecture).

## Architecture patterns

### Recommended placement (matches STRUCTURE.md)

```text
src/routes/friends.route.ts
src/routes/blocks.route.ts
src/controllers/friends.controller.ts
src/controllers/blocks.controller.ts
src/services/friends.service.ts
src/services/blocks.service.ts
src/repositories/friendship.repository.ts
src/repositories/friendRequest.repository.ts
src/repositories/block.repository.ts
src/models/schemas/friendship.schema.ts
src/models/schemas/friendRequest.schema.ts
src/models/schemas/block.schema.ts
```

`DatabaseService`: add getters `friendships`, `friendRequests`, `blocks`; add `createFriendshipIndexes`, `createFriendRequestIndexes`, `createBlockIndexes`; **remove** `followers` getter and `createFollowersIndex` from `initializeIndexes()`.

### Pattern: normalized friendship pair

**What:** Before insert, set `[low, high] = sort([idA, idB])` by **ObjectId binary comparison** (consistent with MongoDB’s default ordering).

**When:** Every accept-friend and unfriend/block path that touches `friendships`.

### Anti-patterns

- **Storing both (A,B) and (B,A)** as separate friendship rows — violates D-04 and complicates deletes.
- **Leaving pending requests** after block — D-14 requires cleanup **both directions**.
- **Using local timezone** for the 100/day cap — contradicts D-07.

## Don’t hand-roll

| Problem | Don’t build | Use instead | Why |
|---------|-------------|-------------|-----|
| Directed pending uniqueness | App-level “check then insert” | **Unique compound index** on `(fromUserId, toUserId)` | Race under concurrency |
| Undirected friendship identity | Two documents | **Single normalized pair** + unique `(userIdLow, userIdHigh)` | Matches D-04 |
| Block symmetry in SQL in app | N×M scans in feed | **Indexed `$or` pair query** or **precomputed id set** for viewer | Phase 3 performance |

## Runtime state inventory (follower removal / graph migration)

| Category | Items found | Action required |
|----------|-------------|-----------------|
| Stored data | Mongo **`followers`** collection | Drop collection or delete all docs in deploy task; **no** migration to friends |
| Stored data | Redis keys `followers:<userId>` | Delete pattern on deploy or lazy-expire; new keys for friends |
| Live service config | None in repo | None — verify no external dashboards reference “followers” API |
| OS-registered state | None identified | None |
| Secrets/env vars | None named “follower” | None |
| Build artifacts | `dist/` may reference old modules | `npm run build` after deletion |
| API docs | Swagger `/followers` | Remove/replace paths |
| Scripts | `scripts/fake-data.ts` | Stop inserting `followers`; seed friends/requests if needed |

## Edge cases (beyond D-09…D-12)

| Case | Expected behavior |
|------|-------------------|
| Duplicate accept | Idempotent success or 409 — choose one; no second friendship row (unique index) |
| Send request while inverse pending | Two directed pairs `(A→B)` and `(B→A)` are **different** unique keys — product may allow both; planner should confirm UX. If product forbids, add service rule + optional partial index (complex); CONTEXT silent → **document choice**. |
| Unfriend while request pending | Independent; optional cleanup of opposite-direction pending is product choice; minimum is D-14 on **block** only. |
| Cap at UTC boundary | First request after 00:00 UTC must succeed if under cap — use `[start, end)` bounds carefully. |
| `ObjectId` ordering | Use `Buffer.compare` or `ObjectId` comparison consistent with BSON — **unit-test** low/high helper. |

## Common pitfalls

### Pitfall 1: Forgetting Redis invalidation

**What goes wrong:** Stale friend list in feed/search after accept/unfriend/block.  
**Why:** Same as current `FollowersService` cache misses.  
**How to avoid:** Invalidate `friends:<userId>` for **both** users on graph mutations; on block, invalidate both parties.  
**Warning signs:** Feed shows old “following” filter results.

### Pitfall 2: Partial block cleanup

**What goes wrong:** Pending `(A→B)` remains after `B` blocks `A`.  
**Why:** D-14 requires delete **all** requests touching **either** user.  
**How to avoid:** Single helper `deleteAllRequestsBetween(userA, userB)` + `deleteFriendshipPair`.  
**Warning signs:** Accept succeeds after block.

### Pitfall 3: Daily cap timezone

**What goes wrong:** Users hit cap at “wrong” local midnight.  
**Why:** D-07 is **UTC-only**.  
**How to avoid:** Comment + OpenAPI description; compute `Date.UTC(y, m, d)` bounds.  
**Warning signs:** QA in non-UTC TZ reports inconsistent counts.

## Risks and dependencies (Phases 3–5)

| Risk | Impact | Mitigation |
|------|--------|------------|
| `EPostAudience.FOLLOWERS` string remains until Phase 3 | Confusing naming but workable | Phase 2 **logic** uses friendship; rename enum/docs in Phase 3 |
| Feed/search use `followedUserIds` naming | Technical debt | Rename to `friendUserIds` when touching those methods |
| BLCK-02 not testable end-to-end in Phase 2 | REQ traceability gap | Add **repository-level** tests for `isBlockedEitherWay`; stub post pipeline TODO for Phase 3 |
| Phase 4 chat will need friends + blocks | Rework if APIs hidden | Expose service methods on container for reuse |
| Phase 5 notifications | Duplicate events if accept retries | Optional idempotency key on notification insert (deferred) |

## Validation architecture (Nyquist dimension 8 — test / verification)

`workflow.nyquist_validation` is **enabled** in `.planning/config.json`. The repo **has no test runner** today (STACK.md); treat **test framework setup** as Wave 0 for this phase or parallel “spike” task.

### Test framework (target state)

| Property | Value |
|----------|--------|
| Framework | **Vitest** (or Jest) + **supertest** — pick one; Vitest aligns well with ESM `type: module` |
| Config file | `vitest.config.ts` (to be added) |
| Quick run | `npx vitest run` (single file) |
| Full suite | `npm test` once scripted |

### Phase requirements → verification map

| Req ID | Behavior | Test type | Automated idea | File exists? |
|--------|----------|-----------|----------------|--------------|
| FRND-05 | 100 cap UTC | Unit/integration | Freeze system time or inject clock; assert 101st POST → 429/400 per convention | ❌ Wave 0 |
| D-06 / FRND-01 | Unique pending | Integration | Two concurrent POSTs same pair → one 201, one duplicate error | ❌ |
| D-04 / FRND-02 | Normalized pair | Unit | Helper sorts ids; insert inverted order → same unique key collision | ❌ |
| D-14 / BLCK-01 | Block clears graph | Integration | Given friendship + pending both ways → block → no friendship, no requests | ❌ |
| BLCK-03 | Unblock | Integration | DELETE block → `isBlockedEitherWay` false | ❌ |
| BLCK-02 hooks | Symmetric query | Unit/repo | `isBlockedEitherWay` true for (A,B) and (B,A) single doc | ❌ |
| INFR-02 | No `/api/followers` | Smoke | supertest GET `/api/followers` → 404 | ❌ |

### Manual / tooling checks

- **Mongo indexes:** After `initializeIndexes()`, inspect `db.friendships.getIndexes()` (unique present).
- **OpenAPI:** `/api/docs` shows friends/blocks, not followers.
- **Grep gate:** `rg followers\\.route|/followers` in `src/` → no matches post-merge.

### Wave 0 gaps

- [ ] Add Vitest (or Jest) + supertest to `package.json`
- [ ] `tests/setup.ts` — env load for `DATABASE_URI` test DB or **MongoDB Testcontainers** (heavier)
- [ ] Single **integration** test file e.g. `tests/friends-graph.integration.test.ts` covering cap + block side-effects
- [ ] CI job invoking `npm test` (if CI exists)

*Until Wave 0 lands, Phase 2 verification leans on manual API exercise + index inspection — flag as **MEDIUM risk** for regression.*

## Code examples

### UTC day bounds for cap (illustrative)

```typescript
// Source: standard Date UTC manipulation — verify in implementation tests
function utcDayRange(now = new Date()): { start: Date; end: Date } {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = start + 24 * 60 * 60 * 1000;
  return { start: new Date(start), end: new Date(end) };
}
```

### Either-direction block query (illustrative)

```typescript
// Source: MongoDB query pattern — official $or docs
await blocksCollection.findOne({
  $or: [
    { blockerId: a, blockedId: b },
    { blockerId: b, blockedId: a }
  ]
});
```

### Normalized friendship ids

```typescript
// Source: project convention — ensure ordering matches BSON ObjectId ordering
import { ObjectId } from 'mongodb';

function friendshipPair(userIdA: ObjectId, userIdB: ObjectId): { userIdLow: ObjectId; userIdHigh: ObjectId } {
  const [x, y] = [userIdA, userIdB].sort((a, b) => a.toString().localeCompare(b.toString()));
  // Prefer binary compare if localeCompare ever mismatches BSON — validate with test against known ObjectIds
  return { userIdLow: x, userIdHigh: y };
}
```

*Note: Prefer **unsigned byte comparison** of ObjectId buffers if `localeCompare` is questioned — add a test comparing to Mongo’s sort order.*

## State of the art

| Old approach | Current approach | Notes |
|--------------|------------------|-------|
| Twitter-style follow | Mutual accept friendship | Matches chat-only-with-friends (Phase 4) |
| Asymmetric graph for “followers-only” posts | Symmetric friends + future `friends-only` audience (Phase 3) | Enum rename deferred per CONTEXT |

## Open questions

1. **Inverse simultaneous requests (A→B and B→A)**  
   - **What we know:** D-06 is per **directed** pair; both could exist.  
   - **What’s unclear:** Whether product wants auto-resolution when both pending.  
   - **Recommendation:** Planner defaults to **allow both** unless product says otherwise; document in PLAN.

2. **HTTP code for block masking (403 vs 404)**  
   - **What we know:** Discretion says pick one convention.  
   - **Recommendation:** Use **404** for “resource not visible” and **403** for “you know it exists but forbidden” — **pick one table** for friends vs blocks list vs request actions; document in OpenAPI.

## Sources

### Primary (HIGH)

- `.planning/phases/02-friends-graph-privacy/02-CONTEXT.md` — D-01…D-16, deferred, discretion  
- `.planning/REQUIREMENTS.md` — INFR-02, FRND-*, BLCK-*  
- `src/database/mongodb/database.service.ts`, `src/container/index.ts`, `src/services/followers.service.ts`, `src/repositories/search.repository.ts`, `src/validations/posts.validation.ts` — actual integration points  
- [MongoDB unique indexes](https://www.mongodb.com/docs/manual/core/index-unique/) — uniqueness for pending + friendship  

### Secondary (MEDIUM)

- `.planning/codebase/STACK.md`, `STRUCTURE.md` — layering and versions  
- `npm view mongodb version` → `7.1.0` (2026-03-21)

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — matches repo  
- Architecture: **HIGH** — follows existing follower module shape  
- Pitfalls / edge cases: **MEDIUM-HIGH** — some product ambiguity on dual pending  
- Validation: **MEDIUM** — no runner yet; Wave 0 required  

**Research date:** 2026-03-21  
**Valid until:** ~2026-04-21 (stable stack); sooner if product changes inverse-request rule  
