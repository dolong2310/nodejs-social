---
phase: 02-friends-graph-privacy
plan: "04"
subsystem: api
tags: [express, mongodb, swagger, blocks, friends, openapi]

requires:
  - phase: 02-friends-graph-privacy
    provides: friendships/friendRequests/blocks repos, FriendsService, /api/friends
provides:
  - HTTP /api/blocks (block, unblock, list blocked) with D-14 cleanup on block
  - IBlockRepository contract and deleteBlock deletedCount for idempotent unblock UX
  - OpenAPI paths for /friends and /blocks; followers REST docs removed
  - fake-data seeds friendships via normalizeFriendshipPair; INFR-02 grep gates for src/scripts
affects:
  - phase: 03-posts-feed-engagement
  - BLCK-02 feed filtering (deferred to Phase 3 per CONTEXT)

tech-stack:
  added: []
  patterns:
    - "Blocks stack mirrors friends route layering (BaseRoute, protect, appLimiter, userId validations)"
    - "Block flow order: deleteFriendshipPair → deleteAllRequestsInvolvingUsers → createBlock; then invalidate both friend caches"

key-files:
  created:
    - src/services/blocks.service.ts
    - src/controllers/blocks.controller.ts
    - src/routes/blocks.route.ts
    - src/dtos/requests/blocks.request.dto.ts
    - src/dtos/responses/blocks.response.dto.ts
    - src/validations/blocks.validation.ts
  modified:
    - src/repositories/block.repository.ts
    - src/container/index.ts
    - src/app.ts
    - swagger/paths.yaml
    - swagger/tags.yaml
    - swagger/components.yaml
    - swagger/operationId.yaml
    - scripts/fake-data.ts
    - src/constants/message.constant.ts
    - src/validations/posts.validation.ts

key-decisions:
  - "Duplicate or symmetric block: HTTP 409 Conflict (BLOCK_ALREADY_EXISTS), including unique-index race mapped to 409"
  - "Unblock only removes directed edge blocker→blocked; 404 when deletedCount is 0"
  - "Renamed ONLY_FOLLOWERS_CAN_VIEW_POSTS → ONLY_FRIENDS_CAN_VIEW_POSTS; removed unused YOU_CANNOT_FOLLOW_YOURSELF"

patterns-established:
  - "BlocksService depends on IFriendsService only for invalidateFriendCache after graph mutations"

requirements-completed: [INFR-02, BLCK-01, BLCK-03]

duration: 18min
completed: 2026-03-21
---

# Phase 02 Plan 04: Blocks API & docs cleanup Summary

**/api/blocks with D-14 unfriend/request cleanup, OpenAPI friends+blocks (no followers paths), fake-data friendship seeding, and message key aligned to friends-only visibility.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-03-21T17:00:00Z (approx.)
- **Completed:** 2026-03-21T17:18:00Z (approx.)
- **Tasks:** 3
- **Files modified:** 17 (created + updated across tasks)

## Accomplishments

- Shipped authenticated block/unblock/list with rate limiting on mutating routes and 409 on existing block (either direction).
- On block: remove friendship pair, clear pending requests both ways, insert block row, invalidate Redis friend caches for both users.
- Replaced Swagger follower endpoints with documented `/friends` and `/blocks`; added shared schemas for friend lists, requests, and block create.
- Replaced fake-data follower inserts with normalized `friendships` rows; renamed post visibility constant key to `ONLY_FRIENDS_CAN_VIEW_POSTS`.

## Task Commits

1. **Task 1: BlocksService, controller, route, D-14 wiring, app mount** — `98d021c` (feat)
2. **Task 2: Swagger/OpenAPI — remove followers, add friends & blocks** — `4f2db37` (docs)
3. **Task 3: fake-data, messages, final INFR-02 grep gates** — `12529cc` (chore)

**Plan metadata:** `docs(02-friends-graph-privacy-04): complete blocks and INFR-02 plan` (same commit as this SUMMARY)

## Files Created/Modified

- `src/services/blocks.service.ts` — Block/unblock/list domain logic and D-14 ordering
- `src/controllers/blocks.controller.ts` — 201 on block, paginated list DTOs
- `src/routes/blocks.route.ts` — Router under `/blocks`
- `src/dtos/requests/blocks.request.dto.ts` / `blocks.response.dto.ts` — Request/response shapes
- `src/validations/blocks.validation.ts` — Body/param `userId` validation
- `src/repositories/block.repository.ts` — `IBlockRepository`; `deleteBlock` returns deleted count
- `src/container/index.ts` / `src/app.ts` — DI and `router.use('/blocks', …)`
- `swagger/paths.yaml`, `tags.yaml`, `components.yaml`, `operationId.yaml` — API docs
- `scripts/fake-data.ts` — Friendship seeding via `normalizeFriendshipPair`
- `src/constants/message.constant.ts`, `src/validations/posts.validation.ts` — Friends-only visibility constant rename; dead follow-self message removed

## Decisions Made

- Chose **409 Conflict** when `isBlockedEitherWay` is already true or on duplicate key from `blocks` unique index (race), per plan wording.
- **404** on unblock when no directed `blockerId`/`blockedId` row exists (user cannot unblock a block they did not create as blocker).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Block persistence and HTTP are ready; **BLCK-02** post/feed exclusion remains Phase 3 per roadmap note (D-16).
- Clients should use **POST /api/blocks** with `{ "userId" }` and **DELETE /api/blocks/:userId** for unblock.

---
*Phase: 02-friends-graph-privacy*  
*Completed: 2026-03-21*

## Self-Check: PASSED

- `02-04-SUMMARY.md` present at `.planning/phases/02-friends-graph-privacy/02-04-SUMMARY.md`
- Task commits `98d021c`, `4f2db37`, `12529cc` verified via `git cat-file -t` (type `commit`)
- Planning docs (`STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`) updated in the same commit as this SUMMARY (`docs(02-friends-graph-privacy-04): complete blocks and INFR-02 plan`)
