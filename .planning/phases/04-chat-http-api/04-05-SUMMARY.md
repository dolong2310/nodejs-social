---
phase: 04-chat-http-api
plan: "05"
subsystem: api
tags: [attachments, swagger, deprecation]

requires:
  - phase: 04-wave-04
    provides: message POST with body shape
provides:
  - Attachment metadata validation (S3 key/mime/size); 5MB per file cap server-side
  - Removal of experimental `/api/conversations` stack; mount `/chats` only
  - Swagger paths/components/tags for chats; socket.service comment for Phase 6
  - fake-data.ts header note for chat seeding via REST
affects: [chat-http-api, openapi-clients]

tech-stack:
  added: []
  patterns: [reuse existing S3 presign from posts for uploads; message carries keys]

key-files:
  created: []
  modified:
    - src/services/chatMessages.service.ts
    - swagger/paths.yaml
    - swagger/components.yaml
    - swagger/tags.yaml
    - src/services/socket.service.ts
    - scripts/fake-data.ts
  removed:
    - src/routes/conversations.route.ts
    - (and related conversation repository/service/controller/schema/DTOs per implementation)

key-decisions:
  - "CHAT-04: no Cloudinary; attachments are metadata; client uploads via existing media/S3 flow."

requirements-completed: [CHAT-04]

duration: —
completed: 2026-03-22
---

# Phase 4 — Wave 05 Summary

Giới hạn đính kèm 5MB/file; gỡ conversations thử nghiệm; OpenAPI và ghi chú seed/fake-data.

## Self-Check

- `npm run build` exits 0.
