---
phase: 06-realtime-socket-io
plan: "02"
subsystem: api
tags: [socket.io, persist-then-emit]

requires:
  - phase: 06
    provides: Plan 01 rooms and SocketService
provides:
  - IRealtimeChatEmitter port
  - chat:message:new and chat:read:updated after DB success in ChatMessagesService
affects: [phase-07]

tech-stack:
  added: []
  patterns: [bindRealtimeChatEmitter mirrors bindNotificationsSocket]

key-files:
  created:
    - src/ports/realtimeChatEmitter.port.ts
  modified:
    - src/services/socket.service.ts
    - src/services/chatMessages.service.ts
    - src/container/index.ts
    - src/app.ts

key-decisions:
  - "emitReadUpdated takes memberUserIdHexes for union broadcast (aligns with message fan-out)"

patterns-established:
  - "Persist-then-emit for chat messages and read state"

requirements-completed: [SOCK-03]

duration: 0min
completed: 2026-03-23
---

# Phase 6 — Plan 02 Summary

**SOCK-03:** `ChatMessagesService` emits `chat:message:new` and `chat:read:updated` only after successful persistence; `SocketService` implements `IRealtimeChatEmitter` with union `to([chatRoom, ...userRooms])`.

## Accomplishments

- Port `IRealtimeChatEmitter` with `emitMessageCreated` / `emitReadUpdated` (read includes `memberUserIdHexes` for correct room union).
- `bindRealtimeChatEmitter` on service + container; `app.ts` calls after `bindNotificationsSocket`.

## Files

- `src/ports/realtimeChatEmitter.port.ts`
- `src/services/chatMessages.service.ts` — hooks after insert+touch and after `updateReadState`
- `src/services/socket.service.ts` — emit implementations
