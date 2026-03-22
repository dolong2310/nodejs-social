---
phase: 07-quality-hardening-tests
plan: "02"
requirements-completed: [QUAL-02]
completed: "2026-03-23"
---

# Phase 7 plan 02 — Socket `chat:subscribe` + `presence:chat`

**Outcome:** `tests/integration/socket.chat-subscribe.test.ts` connects with `auth: { Authorization: 'Bearer …' }`, emits `SOCKET_CLIENT_CHAT_SUBSCRIBE`, asserts `SOCKET_SERVER_PRESENCE_CHAT` for the member, and asserts a verified non-member does not observe `presence:chat` for that conversation within 2s.

## Key files

- `tests/integration/socket.chat-subscribe.test.ts`
- Reuses `startIntegrationHttpServer()`; client uses `extraHeaders: { Origin: envConfig.FRONTEND_URL }` to satisfy Socket.IO CORS against `FRONTEND_URL`.

## Notes

- Optional `chat:message:new` stretch not added (flakiness discretion per D-04).
