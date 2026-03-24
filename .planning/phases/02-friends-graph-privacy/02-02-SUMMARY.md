---
phase: 02-friends-graph-privacy
plan: "02"
subsystem: api
tags: [mongodb, redis, express, friends, social-graph]

requires:
  - phase: 02-friends-graph-privacy
    provides: friendships / friendRequests / blocks collections, repositories from 02-01
provides:
  - FriendsService with cached mutual friend IDs and isFriendOf / invalidateFriendCache
  - Removal of followers collection surface, indexes, HTTP mount, and follower module files
  - Container wiring for graph repos + IFriendsService consumers (posts, search, validation)
affects:
  - 02-03 (friends REST mutations will call invalidateFriendCache)
  - 02-04 (Swagger/fake-data cleanup)
  - Phase 3 (post enum rename, feed copy)

tech-stack:
  added: []
  patterns:
    - "Cache-aside for friend id list: Redis `friends:${userId}` + FriendshipRepository on miss"
    - "`findFriendUserIds` on `IFriendsService`; search uses `people` query + `ESearchPeople`"

key-files:
  created:
    - src/services/friends.service.ts
  modified:
    - src/constants/cache.constant.ts
    - src/constants/message.constant.ts
    - src/repositories/friendship.repository.ts
    - src/database/mongodb/database.service.ts
    - src/container/index.ts
    - src/app.ts
    - src/controllers/posts.controller.ts
    - src/services/search.service.ts
    - src/validations/posts.validation.ts
  removed:
    - src/routes/followers.route.ts
    - src/controllers/followers.controller.ts
    - src/services/followers.service.ts
    - src/repositories/follower.repository.ts
    - src/models/schemas/follower.schema.ts
    - src/dtos/requests/follower.request.dto.ts
    - src/dtos/responses/follower.response.dto.ts

key-decisions:
  - "Friend list cache uses key `friends:${userId}` and TTL constant `FRIENDS_GRAPH` (no `FOLLOWERS` export)."
  - "Posts/search use `findFriendUserIds` and `friendUserIds` payload naming; mutual friends from `friendships`."
  - "FriendRequestRepository and BlockRepository are constructed in Container (not yet exposed via getters) for upcoming plans."

patterns-established:
  - "IFriendshipRepository documents the read surface FriendsService needs; FriendshipRepository implements it."

requirements-completed: [INFR-02]

duration: 18min
completed: 2026-03-21
---

# Phase 02 Plan 02: INFR-02 followers removal + FriendsService Summary

**Legacy followers stack, `/api/followers`, and `followers:` Redis keys are removed; feed and search use `FriendsService` with mutual-friend IDs cached on `friends:${userId}`.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-21T16:22:00Z (approx.)
- **Completed:** 2026-03-21T16:40:00Z (approx.)
- **Tasks:** 3
- **Files touched:** 15 (7 deleted, 1 created, rest modified)

## Accomplishments

- Added `FriendsService` (`findFriendUserIds`, `isFriendOf`, `invalidateFriendCache`) backed by `FriendshipRepository` and Redis.
- Replaced follower cache TTL/key with `FRIENDS_GRAPH` / `CACHE_KEYS.friends`.
- Removed `followers` collection getter and `createFollowersIndex` from `DatabaseService`; unmounted followers router from `app.ts`.
- Deleted follower route, controller, service, repository, schema, and DTOs; rewired Container with `FriendshipRepository`, `FriendRequestRepository`, `BlockRepository`, and `FriendsService`.
- Posts controller, search service, and post audience validation now depend on `IFriendsService`; friends-only audience uses `isFriendOf`.

## Task Commits

1. **Task 1: FriendsService read path + cache constants** — `e692cab` (feat)
2. **Task 2: Remove followers from DatabaseService, delete follower module, app mount, Container wiring** — `a37578a` (feat)
3. **Task 3: Rewire posts and search to IFriendsService semantics** — `5369df8` (docs)

**Plan metadata:** Same docs commit as `.planning/STATE.md` / `ROADMAP.md` / `REQUIREMENTS.md` update (`docs(02-02): complete INFR-02 followers removal and FriendsService plan`).

## Files Created/Modified

- `src/services/friends.service.ts` — Mutual friends read path + cache + invalidation hook.
- `src/constants/cache.constant.ts` — `friends:` cache key; `FRIENDS_GRAPH` TTL.
- `src/repositories/friendship.repository.ts` — `IFriendshipRepository` interface.
- `src/database/mongodb/database.service.ts` — Followers collection/index removed.
- `src/container/index.ts` — Graph repos + `FriendsService`; `getFriendsService()`.
- `src/app.ts` — No `/followers` mount.
- `src/controllers/posts.controller.ts`, `src/services/search.service.ts`, `src/validations/posts.validation.ts` — `IFriendsService` wiring.
- `src/constants/message.constant.ts` — User-facing copy for friends-only denial.
- Removed follower-only modules per plan list.

## Decisions Made

- Kept `EPostAudience.FOLLOWERS` enum value for Phase 3 rename; behavior documented as friends-only in validation comments.
- `FriendRequestRepository` and `BlockRepository` are instantiated in the Container for the next plans without public getters yet.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1 build bridge + repository interface**
- **Found during:** Task 1 (FriendsService read path + cache constants)
- **Issue:** Removing `CACHE_KEYS.followers` / `CACHE_TTL.FOLLOWERS` broke `FollowersService` until Task 2 deleted it; `IFriendshipRepository` was required for the new service constructor contract.
- **Fix:** Pointed legacy `FollowersService` at `friends` cache keys/TTL for one commit; added `IFriendshipRepository` and `implements` on `FriendshipRepository`.
- **Files modified:** `src/services/followers.service.ts` (deleted in Task 2), `src/repositories/friendship.repository.ts`
- **Verification:** `npm run build` after Task 1
- **Committed in:** `e692cab`

**2. [Scope merge] Posts validation `isFriendOf` in Task 2**
- **Found during:** Task 2 (Container wiring)
- **Issue:** Swapping to `IFriendsService` in `PostsValidation` without replacing `findFollowerId` would not type-check.
- **Fix:** Replaced follower edge check with `isFriendOf` while wiring Container (Task 3 only refined comments/messages).
- **Files modified:** `src/validations/posts.validation.ts`
- **Verification:** `npm run build` after Task 2
- **Committed in:** `a37578a`

---

**Total deviations:** 2 auto-fixed (2 blocking/typing)
**Impact on plan:** Necessary for incremental commits with passing builds; no product behavior beyond intended friends semantics.

## Issues Encountered

- GitNexus `detect_changes` / impact still referenced deleted follower symbols (stale index). Run `npx gitnexus analyze` after merge to refresh the graph.

## User Setup Required

None — no new env vars or external services.

## Next Phase Readiness

- Ready for **02-03** (`/api/friends` REST): call `invalidateFriendCache` from accept/unfriend flows when implemented.
- **02-04** should remove remaining follower references in Swagger and `scripts/fake-data.ts` (out of scope for this plan).

## Self-Check: PASSED

- `02-02-SUMMARY.md` present at `.planning/phases/02-friends-graph-privacy/02-02-SUMMARY.md`
- Task commits present: `e692cab`, `a37578a`, `5369df8`
- Docs bundle committed with message `docs(02-02): complete INFR-02 followers removal and FriendsService plan`

---
*Phase: 02-friends-graph-privacy*
*Completed: 2026-03-21*
