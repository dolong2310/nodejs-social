---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Phase 4 context gathered
last_updated: "2026-03-22T09:11:59.685Z"
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 14
  completed_plans: 9
---

# Project State

## Project Reference

See: [.planning/PROJECT.md](PROJECT.md) (updated 2026-03-21)

**Core value:** Trusted friends, feed and engagement with correct permissions, stable 1:1 and group chat with history and notifications—one unified API aligned with the existing TypeScript/Express stack.

**Current focus:** Phase 04 — chat-http-api

**Roadmap:** [.planning/ROADMAP.md](ROADMAP.md)

## Current Position

Phase: 04 (chat-http-api) — EXECUTING
Plan: 1 of 5

## Performance Metrics

**Velocity:** Not tracked yet (no plans executed).

| Phase | Plans | Total time | Avg/plan |
|-------|-------|------------|----------|
| — | — | — | — |

*Update after each plan completion.*
| Phase 02-friends-graph-privacy P01 | 1 min | 2 tasks | 7 files |
| Phase 02-friends-graph-privacy P02 | 18 min | 3 tasks | 15 files |
| Phase 02-friends-graph-privacy P03 | 12min | 2 tasks | 12 files |
| Phase 02-friends-graph-privacy P04 | 18min | 3 tasks | 17 files |

## Accumulated Context

### Decisions

- **Phase 1:** `DATABASE_CHAT_NAME` bắt buộc; một `MongoClient`, hai `Db`, ping kép + fail-fast; `chatDb` expose cho phase sau.

Full log: PROJECT.md → Key Decisions. HTTP-first chat, notifications on social DB, persist-then-emit.

- [Phase 02]: Keep followers collection until 02-02 per 02-01 plan (avoid mid-phase build break).
- [Phase 02]: initializeIndexes change is additive only; GitNexus CRITICAL risk noted for bootstrap blast radius.
- [Phase 02-friends-graph-privacy]: INFR-02: legacy followers API, Mongo follower getter/index, and followers Redis key removed; posts/search use FriendsService mutual-friend cache.
- [Phase 02-friends-graph-privacy]: Friend outgoing request cap: 100 per UTC calendar day (not local TZ); documented in friends.service.ts.
- [Phase 02-friends-graph-privacy]: Inverse pending friend requests (B→A vs A→B) allowed; uniqueness is per directed pair only.
- [Phase 02-friends-graph-privacy]: Blocks: 409 on existing block (symmetric or duplicate key); unblock 404 when no directed block row.
- [Phase 02-friends-graph-privacy]: ONLY_FRIENDS_CAN_VIEW_POSTS replaces ONLY_FOLLOWERS key; removed unused YOU_CANNOT_FOLLOW_YOURSELF.

### Pending Todos

None recorded in GSD todos yet.

### Blockers/Concerns

None yet. See `.planning/codebase/CONCERNS.md` for targets phased into work (especially socket identity and ordering).

## Session Continuity

Last session: 2026-03-22T09:02:08.963Z
Stopped at: Phase 4 context gathered
Resume file: .planning/phases/04-chat-http-api/04-01-PLAN.md
