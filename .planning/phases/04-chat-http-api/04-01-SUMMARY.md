---
phase: 04-chat-http-api
plan: "01"
subsystem: api
tags: [block, privacy, feed, search, mongodb]

requires:
  - phase: 03-posts-feed-engagement
    provides: feed, search, post validation, BLCK-02 baseline
provides:
  - Engagement helpers on PostRepository (like/bookmark/comment-on-post)
  - D-11 redaction on home feed, search posts, post detail (after visibility), comment lists under a thread
  - D-10 profile GET by username returns 403 when viewer authenticated and block either way
  - optionalProtect middleware for public routes that need viewer context
affects: [chat-http-api, frontend-clients]

tech-stack:
  added: []
  patterns: [block-redaction.util, extraVisiblePostIds OR-branch in feed/search match]

key-files:
  created:
    - src/utils/block-redaction.util.ts
  modified:
    - src/repositories/post.repository.ts
    - src/services/posts.service.ts
    - src/repositories/search.repository.ts
    - src/services/search.service.ts
    - src/validations/posts.validation.ts
    - src/middlewares/auth.middleware.ts
    - src/controllers/users.controller.ts
    - src/routes/users.route.ts
    - src/container/index.ts
    - src/constants/message.constant.ts
    - .planning/REQUIREMENTS.md

key-decisions:
  - "403 on GET /api/users/:username when authenticated viewer has block either way with target (D-10)."
  - "Sentinel ObjectId 0000… for redacted userId on post detail; feed/search use unknown author object."

patterns-established:
  - "extraVisiblePostIds: union into $or for feed/search when viewer engaged with posts from blocked authors; redact author in service after fetch."

requirements-completed: [BLCK-02, CHAT-context-D10, CHAT-context-D11]

duration: 45min
completed: 2026-03-22
---

# Phase 4 — Wave 01 Summary

**BLCK-02 được mở rộng theo D-11/D-10:** feed/search có thể trả lại bài đã engage dù author nằm trong tập block; author được redact; profile public trả 403 khi có block (viewer đã login).

## Performance / tech debt

- Feed/search: thêm tối đa **3 aggregation** (`findPostIdsWhereViewerEngagedWithAuthors`) mỗi request authenticated — chấp nhận v1; có thể gộp 1 pipeline sau nếu cần.

## Task Commits

1. Wave 01 — single commit `feat(phase-04-01): BLCK-02 D-11 engagement paths and profile block`

## Self-Check: PASSED

- `npm run build` exits 0.
