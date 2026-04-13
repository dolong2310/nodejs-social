# Phase 6 — Socket.IO client contract

**Phase:** 06-realtime-socket-io  
**Stack:** Socket.IO v4, JWT in `handshake.auth.Authorization` (`Bearer <accessToken>`), same rules as HTTP (verified, not banned).

## Rooms (server-managed)

| Pattern | Meaning |
|---------|---------|
| `user:<userId>` | All authenticated tabs/devices for that user (hex `userId`). Joined automatically on connect. **D-05** |
| `chat:<conversationId>` | Members who passed `chat:subscribe` for that `conversationId` (Mongo ObjectId hex). **SOCK-02** |

Constants: `SOCKET_ROOM_USER_PREFIX` = `user:`, `SOCKET_ROOM_CHAT_PREFIX` = `chat:` in `src/constants/socket.constant.ts`.

## Client → server events

| Event | Payload | Behavior |
|-------|---------|----------|
| `chat:subscribe` | `{ conversationId: string }` | Server checks membership (`findMembership`); on success `socket.join('chat:' + conversationId)` and may emit `presence:chat`. On failure: disconnect not required; no join. |
| `chat:unsubscribe` | `{ conversationId: string }` | `socket.leave('chat:' + conversationId)`. |
| `chat:typing` | `{ conversationId: string, typing: boolean }` | Member check; ephemeral broadcast to `chat:<conversationId>` only. **D-12, D-13** |

**Removed (breaking):** `sendMessage`, `receiveMessage` — use REST `POST /api/chats/:conversationId/messages` only. **D-08**

## Server → client events

| Event | When | Payload (summary) |
|-------|------|-------------------|
| `chat:message:new` | After DB insert + touch from HTTP `sendMessage`. **D-09, D-10, SOCK-03** | `{ message: <ChatMessageResponseDTO> }` — same shape as HTTP message JSON (`id`, `conversationId`, `senderId`, `text?`, `attachments?`, `createdAt`). |
| `chat:read:updated` | After successful PATCH read. **D-07, SOCK-03** | `{ conversationId, userId, lastReadMessageId, lastReadAt }` (ISO string for `lastReadAt`). |
| `chat:typing` | Typing indicator | `{ conversationId, userId, typing }` — `userId` from JWT only. |
| `presence:user` | Mutual friend connect/disconnect. **D-01, D-02** | `{ userId, online: boolean }` |
| `presence:chat` | After subscribe or when chat online aggregate changes. **D-03** | `{ conversationId, anyMemberOnline: boolean }` |
| `notification:new` | After notification row persisted (Phase 5). **D-11** | `{ notification: <list item DTO> }` — **Name unchanged** in Phase 6; delivery moves to `user:<userId>` room (multi-tab). **Migration:** subscribe to `notification:new`; no event rename. |

Dedup: clients may receive both `notification:new` and `chat:message:new` for a new message; dedupe by `message.id` / notification payload ids as needed.

## D-11 resolution

**Keep** event name `notification:new` (`NOTIFICATION_SOCKET_EVENT` unchanged). Document-only migration: recipients are targeted via `io.to('user:' + recipientUserId)` instead of a single socket id map.

`NOTIFICATION_SOCKET_EVENT` in `src/constants/notification.constant.ts` stays `'notification:new'`; `NotificationsService` uses `emitToUser` → `user:<userId>` room (Phase 6 plan 01). No client rename.

---

*Locked decisions: `06-CONTEXT.md` D-01–D-13.*
