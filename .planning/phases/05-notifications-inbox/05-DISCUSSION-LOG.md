# Phase 5: Notifications inbox — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `05-CONTEXT.md`.

**Date:** 2026-03-22  
**Phase:** 5 — Notifications inbox  
**Areas discussed:** List/read, Payload, Dedup/retention, Block  

---

## Area 1 — List & read state

| Topic | User choice / notes |
|-------|---------------------|
| Default list | All notifications; optional query filter unread-only |
| Pagination | Cursor |
| Mark read | Both per-id and batch |
| Response shape | Flat list, newest first; no server-side day grouping; FE shows `createdAt` per row |

**Notes:** User asked for clearer explanation of “list API” (inbox vs chat) and distinction between notification mark-read vs chat mark-read.

---

## Area 2 — Payload

| Topic | User choice |
|-------|-------------|
| List line content | Short text + ids (1c) |
| `new_message` preview | Preview only for plain text; file/image → label only (2c) |
| Actor | Snapshot displayName + avatar at create time (3a) |
| Extensibility | Per-type fixed fields / strict branches in schema (4b) |

**Notes:** User requested clarification of “metadata vs strict types” (question 4); explained as flexible bag vs typed union per notification type.

---

## Area 3 — Dedup & retention

| Topic | User choice |
|-------|-------------|
| Multiple messages same chat | One notification row per message (a); merge (b) deferred to CR |
| Resent friend request | New row each valid send (a) |
| Retention | Cap N per user (b); mechanism discussed — prefer post-insert trim, not required cron |
| Bulk add to group | One notification per added user (a) |

---

## Area 4 — Block

| Topic | User choice |
|-------|-------------|
| New notifications when blocked | Do not create new interaction-related notifications between blocked pair (1a) |
| Historical rows in list | Filter/hide from list when block active (2b) |
| Friends hook + block | Document: no notification if friend action rejected due to block (3a) |
| After unblock | Normal behavior (4a) |

---

## Deferred ideas (conversation)

- Merge `new_message` rows — future change request.
- Optional cron/TTL for age-based cleanup — not required for N-cap trim.
