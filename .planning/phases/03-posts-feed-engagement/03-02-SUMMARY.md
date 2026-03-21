---
phase: 03-posts-feed-engagement
plan: "02"
subsystem: api
tags: [feed, blocks, mongodb, aggregation]

requires:
  - phase: 03-01
    provides: audience literals FRIENDS_ONLY, PUBLIC, ONLY_ME
provides:
  - Authenticated GET /posts merged feed with global public + own + friends friends-only
  - BLCK-02 author exclusion via listUserIdsBlockedInEitherDirection
  - Guest feed remains public-only (no block filter)
affects: [engagement read paths]

tech-stack:
  added: []
  patterns:
    - PostsService owns block list fetch for feed queries

key-files:
  created: []
  modified:
    - src/repositories/post.repository.ts
    - src/utils/posts.pipeline.util.ts
    - src/services/posts.service.ts
    - src/container/index.ts

key-decisions:
  - Removed legacy followers string matching from post repository feed (friends-only uses enum value only; migrate old docs if needed)
  - Sort inserted after $match in buildBasePostPipeline for chronological feeds

patterns-established: []

requirements-completed: [FEED-01, FEED-02, BLCK-02]

duration: 15min
completed: 2026-03-22
---

# Phase 3: Posts — Plan 02 Summary

**Home feed for signed-in users is now a merged, reverse-chronological stream: all eligible public posts (minus blocked authors), everything the viewer authored at any visibility, and friends-only posts from mutual friends—guests still see public only.**

## Manual sanity

- With a block in place, the blocked user’s public posts should not appear on `GET /api/posts` for the viewer (authenticated).

## Task Commits

1. **Tasks 1–2** — `7edb7c1` feat(phase-03-02)

## Self-Check: PASSED

- `npm run build` succeeded.
