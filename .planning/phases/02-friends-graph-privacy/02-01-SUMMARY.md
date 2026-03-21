---
phase: 02-friends-graph-privacy
plan: "01"
subsystem: database
tags: [mongodb, friends, blocks, indexes, repository]

requires:
  - phase: 01-chat-database-foundation
    provides: social + chat Db wiring via DatabaseService
provides:
  - friendships / friendRequests / blocks collection accessors and index bootstrappers
  - FriendshipRepository with BSON-normalized pair helpers
  - FriendRequestRepository with UTC-day outgoing count and request cleanup
  - BlockRepository with BLCK-02 symmetric block queries and CRUD hooks for later HTTP
affects:
  - 02-02-PLAN (followers removal and service wiring)
  - 02-03-PLAN (friends API)
  - 02-04-PLAN (blocks API)
  - Phase 3 feed filtering (consumers of isBlockedEitherWay / listUserIdsBlockedInEitherDirection)

tech-stack:
  added: []
  patterns: normalized undirected friendship edges; directed requests; symmetric block lookups via $or

key-files:
  created:
    - src/models/schemas/friendship.schema.ts
    - src/models/schemas/friendRequest.schema.ts
    - src/models/schemas/block.schema.ts
    - src/repositories/friendship.repository.ts
    - src/repositories/friendRequest.repository.ts
    - src/repositories/block.repository.ts
  modified:
    - src/database/mongodb/database.service.ts

key-decisions:
  - "Kept legacy followers collection and indexes until plan 02-02 per 02-01-PLAN (avoid mid-phase build break)."
  - "GitNexus impact on initializeIndexes is CRITICAL (bootstrap); change is additive index + collection registration only—no caller signature changes."

patterns-established:
  - "Friendship pair order: Buffer.compare on ObjectId bytes, not string sort."
  - "Index gate pattern: single compound unique name check then Promise.all remaining indexes (matches followers)."

requirements-completed:
  - BLCK-02

duration: 1 min
completed: 2026-03-21T16:35:39Z
---

# Phase 2 Plan 01: Friend graph persistence & block query helpers Summary

**Mongo collections `friendships`, `friendRequests`, and `blocks` with D-04/D-05/D-07/D-13-style indexes, plus three repositories—`BlockRepository` exposes BLCK-02 either-direction helpers for Phase 3 feed work.**

## Performance

- **Duration:** ~1 min (executor wall time; commits 2026-03-21T16:35:09Z → 16:35:39Z UTC equivalent)
- **Started:** 2026-03-21T16:35:09Z
- **Completed:** 2026-03-21T16:35:39Z
- **Tasks:** 2
- **Files touched:** 7 (295 insertions in tracked diff across both commits)

## Accomplishments

- Schemas and `DatabaseService` getters/index creators for friend graph and blocks alongside existing followers wiring.
- `FriendshipRepository` with exported `normalizeFriendshipPair` (BSON byte order), neighbor listing, pair find/delete.
- `FriendRequestRepository` with UTC-day outgoing count, directed delete, bilateral request cleanup, `findPendingByDirectedPair`.
- `BlockRepository` with `isBlockedEitherWay`, `listUserIdsBlockedInEitherDirection`, `createBlock` / `deleteBlock`, `listBlockedUserIdsForBlocker`.

## Task Commits

1. **Task 1: Schemas and DatabaseService collections + indexes** — `63ec61e` (feat)
2. **Task 2: Repositories — friendship, friendRequest, block (BLCK-02 hooks)** — `72004ee` (feat)

**Plan metadata:** `docs(02-01): complete friend graph persistence plan` (same commit as this SUMMARY file).

## Files Created/Modified

- `src/models/schemas/friendship.schema.ts` — IFriendship + invariant comment (D-04).
- `src/models/schemas/friendRequest.schema.ts` — IFriendRequest (D-05/D-06 pending state as row).
- `src/models/schemas/block.schema.ts` — IBlock (D-13).
- `src/database/mongodb/database.service.ts` — getters `friendships`, `friendRequests`, `blocks`; `createFriendshipIndexes`, `createFriendRequestIndexes`, `createBlockIndexes`; registered in `initializeIndexes`.
- `src/repositories/friendship.repository.ts` — normalized pair + friend id queries.
- `src/repositories/friendRequest.repository.ts` — cap/count and delete helpers.
- `src/repositories/block.repository.ts` — BLCK-02 queries and block CRUD for plan 02-04.

## Decisions Made

- Followed plan scope: no `FriendsService`, Container, or route changes in this plan.
- **GitNexus:** `initializeIndexes` upstream impact is CRITICAL (bootstrap); only additive work was added—no breaking API changes to `DatabaseService` consumers.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no new env vars or external services.

## Next Phase Readiness

- Ready for **02-02-PLAN**: remove followers stack and wire services/container against new repositories.
- Phase 3 can import `BlockRepository` for symmetric block checks when filtering posts.

## GitNexus detect_changes (post-plan)

Compared to parent of first task commit: **medium** risk summary; affected bootstrap processes touch `initializeIndexes` / `DatabaseService` as expected for new index registration.

## Self-Check: PASSED

- `02-01-SUMMARY.md` exists at `.planning/phases/02-friends-graph-privacy/02-01-SUMMARY.md`
- Task commits `63ec61e`, `72004ee` present; docs commit contains this SUMMARY + STATE + ROADMAP + REQUIREMENTS

---
*Phase: 02-friends-graph-privacy*  
*Completed: 2026-03-21*
