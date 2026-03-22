---
phase: 04-chat-http-api
plan: "03"
subsystem: api
tags: [rest, express, friends-gate]

requires:
  - phase: 02-friends-graph-privacy
    provides: FriendsService, blocks
provides:
  - Chat repositories; ChatsService (direct get-or-create, group create, list/detail, patch, invite, leave, kick, role, transfer admin)
  - GET/POST/PATCH `/api/chats` (+ sub-routes per plan)
  - Cursor util for chat list
affects: [chat-http-api, frontend-clients]

tech-stack:
  added: []
  patterns: [protect + userVerified, DTO validation]

key-files:
  created:
    - src/repositories/chat.repository.ts
    - src/repositories/chatMember.repository.ts
    - src/utils/chat-cursor.util.ts
    - src/dtos/requests/chat.request.dto.ts
    - src/dtos/responses/chat.response.dto.ts
    - src/services/chats.service.ts
    - src/controllers/chats.controller.ts
    - src/validations/chats.validation.ts
    - src/routes/chats.route.ts
  modified:
    - src/container/index.ts
    - src/app.ts
    - src/constants/message.constant.ts

key-decisions:
  - "Direct open only for mutual friends; group members must be friends of creator (per product)."
  - "ChatsValidation uses definite assignment for body fields parsed in constructor."

requirements-completed: [CHAT-01, CHAT-02]

duration: —
completed: 2026-03-22
---

# Phase 4 — Wave 03 Summary

REST `/api/chats`: direct/group lifecycle, membership và roles; wire container và mount router.

## Self-Check

- `npm run build` exits 0.
