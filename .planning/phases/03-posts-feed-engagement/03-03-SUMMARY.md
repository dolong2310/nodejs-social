---
phase: 03-posts-feed-engagement
plan: "03"
subsystem: api
tags: [auth, blocks, likes, bookmarks, validation]

requires:
  - phase: 03-01
  - phase: 03-02
provides:
  - Unverified users can read GET /posts paths; engagement requires verified account
  - BLCK-02 on post detail / child list via audienceValidation
  - Likes API mirroring bookmarks with same middleware chain
  - Parent post rules for COMMENT/REPOST/QUOTE (block, visibility, stranger comments)
affects: [clients, swagger]

tech-stack:
  added: [likes Mongo collection]
  patterns:
    - attachAuthenticatedUserAllowUnverified + forbidUnverifiedEngagement for mutations

key-files:
  created:
    - src/routes/likes.route.ts
    - src/repositories/like.repository.ts
    - src/models/schemas/like.schema.ts
    - src/services/likes.service.ts
    - src/controllers/likes.controller.ts
    - src/dtos/requests/like.request.dto.ts
    - src/dtos/responses/like.response.dto.ts
  modified:
    - src/validations/users.validation.ts
    - src/validations/posts.validation.ts
    - src/routes/posts.route.ts
    - src/routes/bookmarks.route.ts
    - src/controllers/posts.controller.ts
    - src/services/posts.service.ts
    - src/database/mongodb/database.service.ts
    - src/container/index.ts
    - src/app.ts
    - scripts/fake-data.ts
    - src/constants/message.constant.ts

key-decisions:
  - fake-data uses PostRepository.createPost directly to avoid full DI for engagement checks

requirements-completed: [ENGA-01, ENGA-02, ENGA-03, BLCK-02]

duration: 40min
completed: 2026-03-22
---

# Phase 3: Posts — Plan 03 Summary

**Reads and writes are split by verification tier: optional user attach on feed/detail, strict verified gates on bookmarks/likes, symmetric block checks on views, and parent-aware rules for threaded post types.**

## Task Commits

1. **Tasks 1–2** — `e3fdd8c` feat(phase-03-03)

## Self-Check: PASSED

- `npm run build` succeeded.
