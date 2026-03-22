---
phase: 04-chat-http-api
plan: "02"
subsystem: database
tags: [mongodb, chat-db, schemas]

requires:
  - phase: 01-chat-database-foundation
    provides: DATABASE_CHAT_NAME, second Db
provides:
  - Chat schemas: chats, chatMembers, chatMessages (attachments shape)
  - DatabaseService getters + initializeChatIndexes (partial unique direct pair, member uniqueness, message history indexes)
  - App bootstrap calls initializeChatIndexes alongside social indexes
affects: [chat-http-api]

tech-stack:
  added: [chat collections on chatDb]
  patterns: [IChat*, EChatType, EChatMemberRole]

key-files:
  created:
    - src/models/schemas/chat.schema.ts
    - src/models/schemas/chatMember.schema.ts
    - src/models/schemas/chatMessage.schema.ts
  modified:
    - src/database/mongodb/database.service.ts
    - src/app.ts

key-decisions:
  - "Direct chats: partial unique index on sorted pair (userA, userB) when type=direct."
  - "Messages live in chat DB collection `messages` with chatId + createdAt cursor ordering."

requirements-completed: []

duration: —
completed: 2026-03-22
---

# Phase 4 — Wave 02 Summary

Schema và index MongoDB cho chat trên `chatDb`; `DatabaseService` expose collections; `initializeChatIndexes` trong bootstrap app.

## Self-Check

- `npm run build` exits 0 (after full phase).
