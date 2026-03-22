---
phase: 07-quality-hardening-tests
status: complete
updated: "2026-03-23"
---

# Phase 7 verification (QUAL-01)

## Scope

This checklist covers **QUAL-01** only: **socket identity** and **persist-then-emit** on **implemented** chat and notification paths.

**Explicitly out of scope:** P2/P3 items in `CONCERNS.md` (S3 buffering, `any` boundaries, feed/search counters, etc.) — deferred per roadmap.

## Socket identity

| Check | Evidence |
|--------|-----------|
| Handshake reads Bearer JWT from `socket.handshake.auth.Authorization` | `src/services/socket.service.ts` `initMiddleware` (approx. L123–149): parses `Authorization`, `verifyAccessToken`, loads user, rejects `UNVERIFIED` / `BANNED`. |
| Packet middleware re-validates access token | Same file `socket.use` (approx. L179–197): `verifyAccessToken` on each packet. |
| Chat subscribe uses server-side membership, not client sender | `SOCKET_CLIENT_CHAT_SUBSCRIBE` handler (approx. L205–216): `findMembership(cid, viewerOid)`; `viewerOid` from `decoded.userId` on connection. |
| No chat `sendMessage` / trusted client `senderId` on socket | `grep` / search: **no matches** for `sendMessage` or `senderId` in `src/services/socket.service.ts` (supersedes 2026-03-21 audit rows that referenced legacy socket send + `conversations.route.ts`). |

## Persist-then-emit

### 3a Chat (HTTP-first)

| Check | Evidence |
|--------|-----------|
| Messages persisted before realtime emit | `src/services/chatMessages.service.ts` `sendMessage`: `insertMessage` (L105) → `emitMessageCreated` (L111–112) via `IRealtimeChatEmitter`. |
| Read updates persisted before emit | Same service `markRead`: DB update then `emitReadUpdated` (see `rg emitReadUpdated src/services/chatMessages.service.ts`). |
| Socket service implements emitter only (no DM persist in socket path) | `SocketService` implements `emitMessageCreated` / `emitReadUpdated` (`src/services/socket.service.ts`); durable writes go through HTTP → `ChatMessagesService`. |

### 3b Notifications (NOTF-03)

| Check | Evidence |
|--------|-----------|
| Row inserted before socket fan-out | `src/services/notifications.service.ts` `persistAndEmit` (approx. L87–91): `await this.notificationRepository.insertOne(doc)` → `await this.trimIfNeeded` → `this.emitToRecipient` (`notification:new` via `NOTIFICATION_SOCKET_EVENT`). |
| Trace command | `grep -n persistAndEmit src/services/notifications.service.ts` → shows ordering above. |

## Automated tests

| Checklist row | Test file |
|---------------|-----------|
| HTTP register → verify → login → friends → direct chat → message list | `tests/integration/smoke.integration.test.ts` |
| JWT socket auth + `chat:subscribe` + `presence:chat` for member; non-member negative | `tests/integration/socket.chat-subscribe.test.ts` |

## Obsolete audit evidence (historical)

The 2026-03-21 matrix cites `src/routes/conversations.route.ts`, socket `sendMessage`, and client `senderId`. Those paths are **superseded** by Phase 4–6: **`/api/chats`**, `ChatMessagesService`, `SocketService` as **`IRealtimeChatEmitter`**, and membership-gated `chat:subscribe`. See `.planning/phases/07-quality-hardening-tests/07-RESEARCH.md` reconciliation table.

## Local DoD and CI

- **D-06:** `npm test` (Vitest + integration) is the local gate when MongoDB and Redis are up and `.env.development` satisfies `ENV_KEYS`.
- **D-07:** **CI automation (e.g. GitHub Actions) is deferred** — not part of Phase 7 DoD.

## Self-check commands (run from repo root)

```bash
grep -n persistAndEmit src/services/notifications.service.ts
grep -n emitMessageCreated src/services/chatMessages.service.ts
! grep -q sendMessage src/services/socket.service.ts && echo "no sendMessage in socket.service"
! grep -q senderId src/services/socket.service.ts && echo "no senderId in socket.service"
npm test
```
