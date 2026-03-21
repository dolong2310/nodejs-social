# Architecture Research

**Domain:** Brownfield social backend + durable chat + notifications + Socket.IO (single process)
**Researched:** 2026-03-21
**Confidence:** HIGH for boundaries and build order (grounded in `PROJECT.md` + existing layered monolith); MEDIUM for long-horizon scaling (standard patterns, not load-tested here)

## Standard Architecture

### System Overview

Single **HttpServer** hosts Express (`/api/...`) and Socket.IO. Four **logical** bounded contexts share one process; **two MongoDB databases** on the same cluster separate persistence: **social** (existing) and **chat** (`DATABASE_CHAT_NAME`). **Notifications** are stored on the **social** DB (per product decision) but are produced by both social and chat workflows.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Transport (one process)                             │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │  HTTP: /api/*                 │    │  Socket.IO (realtime transport)   │  │
│  │  routes → controller → …      │    │  auth → handlers → same services  │  │
│  └───────────────┬───────────────┘    └──────────────────┬───────────────┘  │
└──────────────────┼──────────────────────────────────────┼──────────────────┘
                   │                                      │
                   ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    Application / domain services (container)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │ Social      │  │ Chat        │  │ Notifications│  │ Realtime adapter    ││
│  │ (friends,   │  │ (convos,    │  │ (inbox CRUD, │  │ (room join, emit    ││
│  │  posts,     │  │  messages,  │  │  fan-out     │  │  only; no business  ││
│  │  feed,      │  │  read state │  │  from apps)  │  │  rules here)        ││
│  │  blocks)    │  │  on chat DB)│  │              │  │                     ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘│
│         │                │                │                     │          │
│         │    chat may call social for eligibility (friends/block)          │
│         │    notifications invoked AFTER successful social/chat writes       │
└─────────┼────────────────┼────────────────┼─────────────────────┼──────────┘
          ▼                ▼                ▼                     │
┌────────────────────────────────────────────────────────────────────────────┐
│                         Persistence (MongoDB native driver)                 │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐│
│  │  Social DB (existing)         │    │  Chat DB (`DATABASE_CHAT_NAME`)   ││
│  │  users, posts, friends,       │    │  conversations, messages,         ││
│  │  notifications, …             │    │  membership, read pointers, …     ││
│  └──────────────────────────────┘    └──────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Owns | Must not own |
|-----------|----------------|------|----------------|
| **Social** | Graph, feed, posts, visibility, blocks, media refs | Social collections, notification **documents** | Chat message bodies, chat-only indexes |
| **Chat** | Conversations, messages, membership, read state, chat media metadata | Chat DB collections | Social graph tables/collections (may **read** via injected services) |
| **Notifications** | Create/list/mark-read; types (`friend_request`, `new_message`, …) | Notification schema + repo on **social** DB | Socket room bookkeeping, message persistence |
| **Realtime (Socket)** | Auth handshake, join `user:{id}` / `conversation:{id}` rooms, **emit after** app services succeed | In-memory maps (today); optional Redis adapter later | Trusting client `senderId`; emitting before DB commit |

### Structure Rationale (align with existing `src/`)

Keep **route → controller → service → repository** per feature. Boundaries are **code + database**, not URL prefixes (`/api/chat` is explicitly out of scope — stay `/api/...`).

**Recommended grouping (incremental, not big-bang folder move):**

- **Social:** existing `routes/controllers/services/repositories` for users, posts, friends, blocks, feed.
- **Chat:** same layering for conversation/message endpoints; repositories target **chat** `DatabaseService` (or dedicated accessor) only.
- **Notifications:** dedicated service + repository on **social** DB; called from **social** and **chat** services (or a thin **application** orchestrator if you want to avoid cross-service imports — see patterns below).
- **Realtime:** `socket.service.ts` (or split: `socket.transport.ts` + handlers) calls **only** public methods on chat/notification services — no direct repository access from socket handlers.

## Architectural Patterns

### Pattern 1: Persistence-first, then emit (mandatory write path)

**What:** Any mutation that clients see in realtime is **committed** (or at least acknowledged by the primary store) **before** Socket.IO emits to rooms.

**When to use:** Every `send_message`, `mark_read`, `friend_accepted`, notification creation.

**Trade-offs:** Slightly higher latency vs “optimistic emit”; avoids ghost messages and desync with REST/history.

**Example (conceptual):**

```typescript
// Inside ChatMessageService (used by BOTH REST controller and socket handler)
async sendMessage(input: SendMessageInput) {
  const senderId = assertFromAuth(input.ctx); // never from untrusted client body
  await this.assertParticipant(senderId, input.conversationId);
  const doc = await this.messageRepository.insert({ ... });
  await this.notificationService.notifyNewMessage(/* refs only */);
  this.realtime.emitToConversation(input.conversationId, 'message:new', doc);
  return doc;
}
```

### Pattern 2: Chat reads social for authorization, not vice versa

**What:** Chat services depend on **narrow interfaces** (e.g. `IFriendshipService`, `IBlocklistService`) implemented by social modules. Social services **do not** import chat repositories.

**When to use:** Enforcing “only friends DM,” block rules, user existence checks.

**Trade-offs:** One extra hop per sensitive operation; keeps DB boundaries clean and avoids circular persistence coupling.

### Pattern 3: Notification fan-out as a downstream step

**What:** Social and chat **application services** call `NotificationService.create(...)` after their own transaction/logical unit succeeds. Socket emits for notifications use the **same** service result (id, payload).

**When to use:** All notification types in v1.

**Trade-offs:** Duplicated “call sites” unless you centralize helpers; acceptable for v1 vs event bus complexity.

## Data Flow

### HTTP vs Socket

| Concern | HTTP | Socket |
|---------|------|--------|
| Source of truth | Yes — list history, mark read, create conversation, upload URLs | No — delivery + optional “typing” ephemera |
| Auth | JWT middleware + `req` context | Handshake auth mirroring HTTP rules |
| Ordering guarantee | Natural request/response | Best-effort; client reconciles with HTTP/pagination |

### Request / message flow (write)

```
Client (HTTP or Socket “send”)
    → Transport validates auth only
    → Controller (HTTP) OR thin socket adapter
    → ChatService: validate membership + friend/block (via Social)
    → MessageRepository (chat DB): insert
    → NotificationService (social DB): insert (if applicable)
    → Socket: emit to conversation room (+ user inbox room for notification)
    → Ack to client (HTTP body or socket callback)
```

**Invariant:** No `emit` of durable events **before** the responsible `repository` write succeeds (notifications: social DB; messages: chat DB).

### Read flow

```
Client GET history / conversations
    → HTTP only (recommended for v1 pagination and caching)
Socket: join room → receive pushes for new rows created by the path above
```

### State management

- **Durable:** Mongo (social + chat).
- **Ephemeral:** socket id ↔ user, typing indicators — stay in memory until you add Redis adapter for horizontal scale (known hotspot today).

## Suggested build order (minimal risk)

Dependencies are explicit; skipping order increases rework or security bugs (e.g. trusting client sender, chat without friends).

| Step | Deliverable | Depends on | Risk if reordered |
|------|-------------|------------|-------------------|
| **1** | Second DB connection + chat `DatabaseService` (or parallel client), env `DATABASE_CHAT_NAME`, container registration, empty indexes | None | Chat code without DB split → migration pain |
| **2** | **Friends + block + unfriend** (social) + rules used as **interfaces** for chat | Stable user auth | Chat eligibility wrong or duplicated |
| **3** | Chat **repositories + schemas** on chat DB; domain types; **no** socket dependency yet | Step 1–2 | Socket-first → experimental coupling repeats |
| **4** | Replace **`/api/conversations`** experiment: HTTP-only chat API (list/send/mark read as required) through full stack | Step 3 | Harder to test persistence without HTTP |
| **5** | **Notifications:** collection on social DB, repository, service, REST; hook **friend** events first | Step 2 | — |
| **6** | Hook **chat** → `NotificationService` (`new_message`, `added_to_group`) | Step 4–5 | Missing inbox for chat |
| **7** | **Socket.IO replacement:** rooms, events calling **same services** as HTTP; remove old relay | Step 4–6 | Double logic or emit-before-persist |

**Ordering rationale in one line:** Persist split → graph rules → durable chat → REST contract → notification store → realtime as thin edge.

## Scaling Considerations

| Scale | Adjustment |
|-------|------------|
| Single instance | Current model; persist-then-emit is enough |
| Multiple instances | Shared Socket.IO adapter (Redis); **still** persist before emit; chat DB and social DB scale independently on cluster |
| Hot conversations | Index chat collections by `conversationId` + `createdAt`; cap page sizes; consider archive later (out of v1) |

**First bottleneck:** chat DB write rate + index design; **second:** Socket fan-out (CPU + Redis adapter).

## Anti-Patterns

### Emit-before-persist

**What people do:** Socket handler broadcasts message, then saves to Mongo async.
**Why it's wrong:** Ghost messages, inconsistent history, abuse with forged payloads.
**Do this instead:** Single service method used by HTTP and socket; emit last.

### Socket owns business rules

**What people do:** Parse `senderId` / `conversationId` from event payload and skip service layer.
**Why it's wrong:** Violates `CONCERNS.md` direction; bypasses friend/block checks.
**Do this instead:** Derive identity from authenticated socket context; validate membership in `ChatService`.

### Chat collections on social DB “for simplicity”

**What people do:** One DB to avoid two connections.
**Why it's wrong:** Conflicts with `PROJECT.md` decision; backup/operational boundaries blur.
**Do this instead:** Two databases, one cluster; two repository namespaces in container.

### Social → Chat repository imports

**What people do:** Post service queries messages for “preview.”
**Why it's wrong:** Tight coupling, transaction span across DBs, circular deps.
**Do this instead:** If needed later, explicit read API on chat service or materialized preview on social (defer until required).

## Integration Points

### External services

| Service | Pattern | Notes |
|---------|---------|-------|
| MongoDB | Two DB names, same URI/cluster | Chat indexes bootstrapped alongside social in startup discipline |
| S3 | Existing media service | Chat attachments reuse project auth + upload flow |
| Redis / BullMQ | Existing | Optional: async notification delivery later; v1 can stay inline after persist |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Chat ↔ Social | In-process service interfaces (sync reads for ACL) | No cross-DB joins; application composes |
| Notifications ↔ Chat/Social | `NotificationService` called from orchestrating service | Same process; later could become events |
| Socket ↔ Domain | Calls services only | Controllers and socket adapters are two facades to one core |

## Sources

- `.planning/PROJECT.md` — dual DB, notifications on social, replace experimental conversations + socket, no `/api/chat` prefix
- `.planning/codebase/ARCHITECTURE.md` — layered monolith, container, socket hotspot, current data flow
- `.planning/codebase/CONCERNS.md` (referenced in PROJECT) — untrusted `senderId`, persist-before-emit

---
*Architecture research for: nodejs-social (milestone: durable chat + notifications)*
*Researched: 2026-03-21*
