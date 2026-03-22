# Milestones

## v1.0 brownfield v1 evolution (Shipped: 2026-03-23)

**Phases completed:** 7 phases, 23 plans, 18 tasks (per plan summaries).

**Key accomplishments:**

- **Phase 1 — INFR-01/03:** Mandatory `DATABASE_CHAT_NAME`, dual `Db` on one cluster, dual ping + fail-fast, documented env.
- **Phase 2 — graph:** `friendships` / `friendRequests` / `blocks` + repositories; legacy followers and Redis follower keys removed; `FriendsService` + `/api/friends`, `/api/blocks`, UTC daily request cap.
- **Phase 3 — feed & engagement:** Audience literals, merged home feed + guest public-only, block rules, search and OpenAPI aligned; likes collection and engagement matrix.
- **Phase 4 — CHAT:** `/api/chats` HTTP (direct/group, messages, cursor history, read state, S3 attachments); experimental `/api/conversations` removed; D-10/D-11 block behavior on profiles and redaction paths.
- **Phase 5 — NOTF:** Notifications on social DB, REST inbox, v1 types, `notification:new` after persist from friends + chat hooks.
- **Phase 6 — SOCK:** JWT-only sender identity, `user:` + `chat:` rooms, persist-then-emit for messages/read, typing and presence signals.
- **Phase 7 — QUAL:** Vitest + HTTP + socket smoke tests; `07-VERIFICATION.md` and CONCERNS resolved table for scoped socket/persist paths.

**Archive:** [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) · [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)

**Pre-flight note:** No `v1.0-MILESTONE-AUDIT.md` was present before completion; consider `/gsd-audit-milestone` earlier next time for formal coverage sign-off.

---
