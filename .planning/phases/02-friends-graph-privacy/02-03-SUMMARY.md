---
phase: 02-friends-graph-privacy
plan: "03"
subsystem: api
tags: [express, mongodb, redis, friends, rate-limit, utc]

requires:
  - phase: 02-friends-graph-privacy
    provides: friendships / friendRequests collections, repositories, FriendsService read+cache (plan 02-02)
provides:
  - "/api/friends REST surface (requests, accept/decline/revoke, list friends, unfriend)"
  - "UTC calendar-day cap (~100 outgoing friend requests per user per UTC day)"
  - "Block guard (403) on send/accept via BlockRepository.isBlockedEitherWay"
affects:
  - "02-04 (blocks API, swagger)"
  - "Phase 3 feed and engagement (friend-gated content)"

tech-stack:
  added: []
  patterns:
    - "BaseRoute + protect + appLimiter on POST/DELETE; validatePaginationQuery on GET lists"
    - "FriendsService throws domain errors (400/403/404/409/429) consumed by error middleware"

key-files:
  created:
    - src/routes/friends.route.ts
    - src/controllers/friends.controller.ts
    - src/dtos/requests/friends.request.dto.ts
    - src/dtos/responses/friends.response.dto.ts
    - src/validations/friends.validation.ts
  modified:
    - src/services/friends.service.ts
    - src/container/index.ts
    - src/app.ts
    - src/repositories/friendRequest.repository.ts
    - src/repositories/friendship.repository.ts
    - src/repositories/user.repository.ts
    - src/constants/message.constant.ts

key-decisions:
  - "Friend-request daily cap uses UTC calendar midnight boundaries (documented in friends.service.ts header), not local TZ."
  - "Inverse pending requests (B→A) do not block (A→B); uniqueness is only on the directed pair."
  - "Blocked users get 403 on send/accept (D-12); HTTP surface for block list remains plan 02-04."

patterns-established:
  - "IFriendsValidation composes IUsersValidation.userIdValidation for body/params user ids."
  - "List endpoints return paginated FriendUserSummaryResponseDTO rows hydrated via UserRepository.findManyByIds."

requirements-completed: [FRND-01, FRND-02, FRND-03, FRND-04, FRND-05, FRND-06]

duration: 12min
completed: 2026-03-21
---

# Phase 2 Plan 3: `/api/friends` REST Summary

**Mutual friends API under `/api/friends` with directed requests, accept/decline/revoke, paginated lists, unfriend, ~100 outgoing requests per UTC day, and block checks on graph mutations.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-21T16:34:00Z
- **Completed:** 2026-03-21T16:46:16Z
- **Tasks:** 2
- **Files touched:** 12 (7 new + 5 repo/config/app edits across commits; overlap counted once ≈ 12 paths)

## Accomplishments

- Shipped `/api/friends` matching plan path matrix: GET friends + incoming/outgoing requests, POST send/accept/decline, DELETE revoke + unfriend.
- Implemented `FriendsService` graph mutations with Redis friend-list cache invalidation rules from the plan (both users on accept/unfriend/decline/revoke; sender only on new outbound request).
- Extended repositories (`insert`/`list`/`delete` counts) and `UserRepository.findManyByIds` for list hydration.

## Task Commits

1. **Task 1: DTOs, validation, FriendsRoute skeleton** — `c85a400` (feat)
2. **Task 2: FriendsService mutations, UTC cap, policy; container + app mount** — `f25efe6` (feat)

**Plan metadata:** docs commit amends planning artifacts with this SUMMARY (search `docs(02-friends-graph-privacy-03)` in `git log`).

## Files Created/Modified

- `src/routes/friends.route.ts` — Registers protected routes, `appLimiter` on mutating methods, pagination validation on GET.
- `src/controllers/friends.controller.ts` — Maps HTTP to `IFriendsService`, 201 on new request via `Created`.
- `src/dtos/requests/friends.request.dto.ts` / `src/dtos/responses/friends.response.dto.ts` — Request bodies and list/send response shapes.
- `src/validations/friends.validation.ts` — Wraps `userIdValidation` for `toUserId` / `fromUserId` / `userId` params.
- `src/services/friends.service.ts` — Full graph logic, UTC window helper, `TooManyRequestsError` for cap.
- `src/repositories/friendRequest.repository.ts` — Insert pending, counted deletes, paginated incoming/outgoing.
- `src/repositories/friendship.repository.ts` — `insertFriendship`, `deleteFriendshipPair` returns deleted count.
- `src/repositories/user.repository.ts` — `findManyByIds` for batch user load.
- `src/constants/message.constant.ts` — Friend graph validation messages.
- `src/container/index.ts` — `FriendsService` expanded deps; `FriendsController` / `FriendsValidation` getters.
- `src/app.ts` — `router.use('/friends', friendsRouter())`.

## Decisions Made

- **UTC day cap:** Implemented as `[Date.UTC(y,m,d), +86400000)` with file-level documentation (D-07).
- **Inverse requests:** Allowed both `(A→B)` and `(B→A)` pending; documented inline in `sendFriendRequest`.
- **403 vs 404 for blocks:** Send/accept use **403** with `FRIEND_ACTION_BLOCKED` per plan convention (D-12).

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as specified.

### Process / scope notes

**[Rule 3 - Blocking] Container wiring in Task 1**

- **Found during:** Task 1 (`FriendsRoute` DI)
- **Issue:** `FriendsRoute` calls `getFriendsController()` / `getFriendsValidation()`; without container getters the route module cannot compile.
- **Fix:** Registered `FriendsController` and `FriendsValidation` in `Container` in the same commit as the route skeleton (still using stub `FriendsService` methods until Task 2).
- **Files modified:** `src/container/index.ts`
- **Committed in:** `c85a400`

---

**Total deviations:** 1 (blocking / DI wiring moved into Task 1 commit)
**Impact on plan:** No behavior change; only splits “container” work across Task 1 (controller/validation) vs Task 2 (`FriendsService` constructor + app mount).

## Issues Encountered

- `FriendsValidation` could not use field initializers that referenced `this.usersValidation` (TS “used before initialization”); resolved by assigning handlers in the constructor body.

## User Setup Required

None — no new environment variables.

## Next Phase Readiness

- Ready for **02-04**: `/api/blocks`, Swagger, fake-data; this plan intentionally omits those.
- Feed/post hiding for blocks (ROADMAP success criterion #5) remains Phase 3 as documented in ROADMAP.

## Self-Check: PASSED

- `02-03-SUMMARY.md` present at `.planning/phases/02-friends-graph-privacy/02-03-SUMMARY.md`.
- Commits `c85a400`, `f25efe6` exist (`git rev-parse --verify c85a400^{commit}` and `f25efe6^{commit}`).

---
*Phase: 02-friends-graph-privacy*
*Completed: 2026-03-21*
