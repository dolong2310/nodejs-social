---
phase: 04-chat-http-api
plan: "04"
subsystem: api
tags: [messages, cursor, read-state, block]

requires:
  - phase: 04-wave-03
    provides: ChatsService, membership checks
provides:
  - ChatMessageRepository; ChatMessagesService (POST/GET messages, PATCH read)
  - Cursor pagination for messages; block guard on sending in direct chats
  - Routes nested under `/api/chats/:conversationId/messages` and read endpoint order before `GET /:conversationId`
affects: [chat-http-api]

tech-stack:
  added: []
  patterns: [senderId from JWT only in service]

key-files:
  created:
    - src/repositories/chatMessage.repository.ts
    - src/dtos/requests/chatMessage.request.dto.ts
    - src/dtos/responses/chatMessage.response.dto.ts
    - src/services/chatMessages.service.ts
    - src/controllers/chatMessages.controller.ts
  modified:
    - src/routes/chats.route.ts
    - src/container/index.ts
    - src/constants/message.constant.ts
    - src/utils/chat-cursor.util.ts

key-decisions:
  - "Mark-read updates member lastRead when last message is from another user."
  - "Direct: block either way prevents sending new messages."

requirements-completed: [CHAT-03]

duration: —
completed: 2026-03-22
---

# Phase 4 — Wave 04 Summary

Tin nhắn REST với cursor; đánh dấu đã đọc; chặn gửi tin direct khi block.

## Self-Check

- `npm run build` exits 0.
