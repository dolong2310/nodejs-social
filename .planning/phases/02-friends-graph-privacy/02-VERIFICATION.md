---
phase: 02-friends-graph-privacy
verified: 2026-03-21T16:53:17Z
status: passed
score: 7/7
---

# Phase 2: Friends graph & privacy — Verification Report

**Phase goal:** Users manage mutual friendships and blocks with spam limits; legacy follower data and APIs are gone.

**Verified:** 2026-03-21T16:53:17Z

**Status:** passed

**Re-verification:** No — initial verification (no prior `*-VERIFICATION.md` in this phase directory).

## Goal achievement

### Observable truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|--------|--------|----------|
| 1 | User can send, accept, decline, and revoke friend requests; no self-requests; consistent pending state | ✓ VERIFIED | `FriendsService.sendFriendRequest`, `acceptIncomingRequest`, `declineIncomingRequest`, `revokeOutgoingRequest`; self-check at `friends.service.ts` L129–132; duplicate pending via unique index + `MongoServerError` 11000 → `FRIEND_REQUEST_ALREADY_PENDING`; routes in `friends.route.ts` (GET lists, POST send/accept/decline, DELETE revoke/unfriend). |
| 2 | User can list friends and sent/received requests with fields usable for a typical client | ✓ VERIFIED | `listFriends`, `listIncomingRequests`, `listOutgoingRequests` return `FriendUserRow` (`_id`, `name`, `username?`, `avatar?`); `FriendsController` maps to response DTOs. |
| 3 | Outgoing friend requests capped at ~100 per user per day; calendar vs rolling documented | ✓ VERIFIED | `OUTGOING_REQUESTS_PER_UTC_DAY = 100`; `utcDayRange` uses UTC midnight window + 86400000 ms; file header documents FRND-05/D-07; `countOutgoingRequestsCreatedOnUtcDay` in `friendRequest.repository.ts`. |
| 4 | User can unfriend; block auto-clears friendship and pending requests; user can unblock (no dead end) | ✓ VERIFIED | `unfriend` → `deleteFriendshipPair`; `BlocksService.blockUser` → `deleteFriendshipPair`, `deleteAllRequestsInvolvingUsers`, `createBlock`, cache invalidation; `unblockUser` → `deleteBlock` with `NotFoundError` if no row; `GET /blocks` lists blocked users. |
| 5 | Blocked users’ posts hidden in all read paths (incl. public) | ⏭ DEFERRED (Phase 3) | Per ROADMAP note: read-path enforcement is Phase 3. `listUserIdsBlockedInEitherDirection` / `isBlockedEitherWay` exist in `block.repository.ts` but are **not** referenced from posts/search read paths yet (grep: only `friends.service.ts` + `blocks.service.ts`). Phase 2 delivers data + helpers per plan 02-01 / D-16. |
| 6 | Legacy follower APIs and follower persistence removed | ✓ VERIFIED | No `*follower*` files under `src/`; no `FollowersService`, `FollowerRepository`, or `/followers` mount in `app.ts` (friends + blocks only); `database.service.ts` has `friendships` / `friendRequests` / `blocks`, no `followers` getter; `swagger/paths.yaml` has `/friends` and `/blocks`, no `/followers`. |

**Score:** 7/7 criteria accounted for — **6 implemented in this phase**, **1 explicitly deferred** with supporting infrastructure present.

### Required artifacts (aggregated from plans 02-01 … 02-04)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/repositories/block.repository.ts` | BLCK-02 symmetric queries + block CRUD | ✓ VERIFIED | `isBlockedEitherWay`, `listUserIdsBlockedInEitherDirection`, `createBlock`, `deleteBlock`, `listBlockedUserIdsForBlocker`; substantive implementations, not stubs. |
| `src/database/mongodb/database.service.ts` | Collections + indexes for graph | ✓ VERIFIED | Getters `friendships`, `friendRequests`, `blocks`; index creators registered (unique pairs, list indexes). |
| `src/services/friends.service.ts` | Read cache + full graph mutations | ✓ VERIFIED | `CACHE_KEYS.friends`; mutations + lists; wired from container. |
| `src/routes/friends.route.ts` | `/api/friends` surface | ✓ VERIFIED | Mounted in `app.ts` as `/friends` under API prefix; uses `protect`, `appLimiter`, validations. |
| `src/routes/blocks.route.ts` | `/api/blocks` POST/DELETE/GET | ✓ VERIFIED | Mounted in `app.ts`; matches plan 04. |
| `swagger/paths.yaml` | Friends + blocks documented; no followers REST | ✓ VERIFIED | Paths present; no `followers` substring in `paths.yaml`. |
| `scripts/fake-data.ts` | No follower collection seeding | ✓ VERIFIED | Seeds `friendships` via `normalizeFriendshipPair`; no follower imports/inserts. |

### Key link verification (manual, plan must_haves)

| From | To | Via | Status |
|------|----|-----|--------|
| `database.service.ts` | `friendships` / `friendRequests` / `blocks` | getters + `initializeIndexes` | ✓ WIRED |
| `container/index.ts` | `FriendsService` / `BlocksService` / repos | constructors | ✓ WIRED |
| `friends.route.ts` | `FriendsController` → `FriendsService` | `BaseRoute` + container | ✓ WIRED |
| `FriendsService` | `BlockRepository` | `isBlockedEitherWay` on send/accept | ✓ WIRED |
| `BlocksService` | `FriendshipRepository` / `FriendRequestRepository` | `deleteFriendshipPair`, `deleteAllRequestsInvolvingUsers` on block | ✓ WIRED |
| `posts.controller.ts` | `FriendsService` | `findFriendUserIds` (mutual friends) | ✓ WIRED |
| `search.service.ts` | `FriendsService` | `findFriendUserIds` injected into search | ✓ WIRED |
| `posts.validation.ts` | `FriendsService` | `isFriendOf` for audience / access checks | ✓ WIRED |

### Requirements coverage (.planning/REQUIREMENTS.md)

| ID | Source plan(s) | Description (abbrev.) | Status | Evidence |
|----|----------------|------------------------|--------|----------|
| INFR-02 | 02-02, 02-04 | Remove legacy follower data/API | ✓ SATISFIED | No follower module or `/api/followers`; DB layer has no followers collection accessor. Residual: post **audience** enum value `followers` / OpenAPI enum `followers` still names “friends-only” visibility — **social graph** follower feature removed; naming is product/Phase-3 cleanup, not INFR-02 follower persistence. |
| FRND-01 | 02-03 | Send friend request; no self; no invalid duplicate | ✓ SATISFIED | `sendFriendRequest` + unique index on directed pair. |
| FRND-02 | 02-03 | Accept → mutual friendship; stable normalized pair | ✓ SATISFIED | `insertFriendship` + `normalizeFriendshipPair`; delete pending after accept. |
| FRND-03 | 02-03 | Decline + revoke | ✓ SATISFIED | `declineIncomingRequest`, `revokeOutgoingRequest`. |
| FRND-04 | 02-03 | List friends + incoming/outgoing with populate | ✓ SATISFIED | Paginated lists + `userRepository.findManyByIds`. |
| FRND-05 | 02-03 | ~100 sends per day | ✓ SATISFIED | UTC calendar day, 100 cap, documented in service. |
| FRND-06 | 02-03 | Unfriend | ✓ SATISFIED | `unfriend` + `deleteFriendshipPair`. |
| BLCK-01 | 02-04 | Block; auto-unfriend if friends | ✓ SATISFIED | `blockUser` order: friendship + requests cleared, then block row. |
| BLCK-02 | 02-01 (+ REQ text) | Neither sees the other’s posts in read paths | ⚠️ PHASE-SPLIT | **REQ** text implies full read-path hiding. **Phase 2 contract** (ROADMAP + 02-CONTEXT D-16): persist blocks + `BlockRepository` helpers for Phase 3. Helpers implemented; **post/feed/search read paths do not yet filter by block** — tracked for Phase 3. |
| BLCK-03 | 02-04 | Unblock | ✓ SATISFIED | `DELETE /blocks/:userId` → `unblockUser`. |

**Orphaned requirements:** None — all listed IDs appear in plan frontmatter for this phase.

### Anti-patterns / stubs

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| `src/enums/posts.enum.ts` | `FOLLOWERS = 'followers'` | ℹ️ Info | Legacy **label** for friends-only audience; not the removed follower graph API. |
| `swagger/components.yaml` | `enum: [public, followers, only_me]` | ℹ️ Info | Same as above; aligns with stored post audience values. |

No `TODO` / `Not implemented` / empty handlers found in `friends.service.ts` or `blocks.service.ts`.

### Human verification (recommended)

Static verification only (no server run). Suggested checks:

1. **Friend request daily cap** — **Test:** Send 100 friend requests from user A to distinct users in one UTC day, then send one more. **Expected:** 429 / too-many-requests style error with documented message. **Why human:** Requires live DB + clock boundary confidence.

2. **Block side effects** — **Test:** Users A and B are friends with a pending request from A→C involving B if applicable; A blocks B. **Expected:** Friendship removed; any pending requests between A and B removed; `GET /friends` and block list consistent. **Why human:** Multi-step state machine + HTTP.

3. **Unblock idempotence** — **Test:** Unblock a user; repeat unblock. **Expected:** Second call 404 / not found for “no active block”. **Why human:** Confirm API contract matches product expectation.

### Gaps summary

**None** for the Phase 2 goal and ROADMAP-defined scope (including deferral of success criterion #5 to Phase 3).

**Follow-up for Phase 3:** Consume `BlockRepository.listUserIdsBlockedInEitherDirection` (or equivalent) in post list, post detail, search, and feed queries to close BLCK-02 read-path semantics and REQUIREMENTS.md wording end-to-end.

---

_Verified: 2026-03-21T16:53:17Z_

_Verifier: Claude (gsd-verifier)_
