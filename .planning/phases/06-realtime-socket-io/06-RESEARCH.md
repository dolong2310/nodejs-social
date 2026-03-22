# Phase 6: Realtime (Socket.IO) - Research

**Researched:** 2026-03-23  
**Domain:** Socket.IO v4 + Express, JWT auth, rooms, persist-then-emit chat/notifications/read receipts, presence (ephemeral online state)  
**Confidence:** HIGH (stack + official API); MEDIUM (presence graph efficiency, exact client contract — planner/discretion)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

(Content under `## Implementation Decisions` in `06-CONTEXT.md`, subsections **1–4** only.)

### 1. Presence & online (SOCK-02)

- **D-01:** **Online** = user có **kết nối WebSocket đã auth**; mất kết nối = **offline** ngay. **Không** last seen / heartbeat phức tạp trong v1.
- **D-02:** Quy tắc hiển thị presence **kết hợp (tương đương option c đã thống nhất):**
  - **Bạn bè hai chiều (mutual friends):** thấy nhau **online/offline kiểu “toàn app”** (danh sách bạn, v.v.).
  - **Không phải bạn bè hai chiều:** **không** có presence pairwise kiểu friend rail; chỉ áp dụng **trong phạm vi conversation** (ví dụ **nhóm:** tick xanh nếu **≥1 thành viên** trong nhóm online — không yêu cầu từng cặp trong nhóm đều là bạn).
  - **Lưu ý graph:** Phase 4 cho phép hai thành viên nhóm **không** mutual friends (cùng nhóm qua creator/invite); **D-02** vẫn nhất quán với UX aggregate trong nhóm.
- **D-03 (UX — direct / group / feed):**
  - **Direct:** hiển thị online/offline **đối phương** (luôn là bạn theo CHAT-01).
  - **Group:** **một** trạng thái giống direct: **online** nếu **có ít nhất một** thành viên trong nhóm đang online; **offline** nếu không ai online.
  - **Cột phải ngoài màn chat (vd feed):** kiểu Facebook — chỉ **conversation đã từng có** (đã chat) **+** group; **sắp xếp theo recent**; chưa từng chat → **placeholder**. **Group** trên cột phải: **cùng quy tắc tick** (≥1 member online).
- **D-04:** **Unverified / banned:** không tương tác (kể cả kết bạn), API **403** nếu cố; **không** tham gia socket → **không** presence với người khác (giữ tinh thần handshake hiện tại).

### 2. Đa tab / thiết bị & đã đọc (SOCK-03)

- **D-05:** **Mọi** socket đã auth của cùng `userId` nhận **sự kiện cá nhân** và **đồng bộ** (tin, notif, read trên các tab của chính user).
- **D-06:** **Chỉ REST** để **gửi tin**; socket **không** là path gửi tin tin cậy — chỉ **phát** sau khi **ghi DB thành công** (cùng service/luồng với HTTP).
- **D-07:** Sau **PATCH đánh dấu đã đọc** thành công: **emit realtime** tới thành viên **khác** trong conversation; đồng thời **các tab/device cùng user** cập nhật (badge / đã đọc) qua socket (**D-05**).

### 3. Hợp đồng sự kiện client

- **D-08:** **Gỡ** luồng cũ `sendMessage` / `receiveMessage` (payload có `senderId` client). **Breaking change** — contract mới bám **`conversationId`** và shape **gần REST**.
- **D-09:** **Một tên event chung** cho tin mới trong room (**DM + group**); tên cụ thể do planner + tài liệu client.
- **D-10:** Payload realtime cho message (sau persist) = **full message** như **response HTTP** (giảm fetch thêm trên client).
- **D-11:** **`notification:new` (constant hiện tại) không cố định vĩnh viễn** — **planner được đổi** tên hoặc shape nếu thống nhất được lý do; **chấp nhận breaking** client inbox — cần **ghi rõ migration** trong plan nếu đổi.

### 4. Typing

- **D-12:** **Typing indicator** nằm trong **scope Phase 6**.
- **D-13:** Typing **chỉ ephemeral** qua socket (**không** persist DB); timeout/stop do planner (debounce, disconnect).

### Claude's Discretion

- Chuỗi tên event cụ thể, tên room, join/leave protocol, throttle typing, tài liệu Socket cho client, cách implement fan-out đa socket (xem `code_context`).
- Chi tiết payload read-receipt (minimal vs extended) miễn thỏa **D-07** và persist-then-emit.

### Deferred Ideas (OUT OF SCOPE)

- **Last seen** / presence lịch sử — không v1 (D-01).
- **Typing persist** — không (D-13).

**None — discussion stayed within phase scope** (ngoài các mục deferred rõ ràng trên).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SOCK-01 | Thay thế luồng socket chat: auth token hiện có; **sender chỉ từ JWT**, không tin field client. | Remove `sendMessage`/`receiveMessage`; derive `userId` from `socket.handshake.auth.decoded` only; optional packet middleware re-verify token (already present — tighten if needed). |
| SOCK-02 | Join room theo **conversation** và room theo **userId** cho cá nhân; **online-users** (hoặc tương đương) nhất quán. | `socket.join` + `io.to(room).emit`; per-user room = fan-out; conversation room = delivery + typing; presence = targeted emits per D-02 (mutual friends + group aggregate). |
| SOCK-03 | **Ghi DB trước**, emit sau cho tin nhắn và trạng thái đọc. | Emit only after `insertMessage` / `updateReadState` succeed in `ChatMessagesService`; notifications already persist-then-emit in `NotificationsService`. |

</phase_requirements>

## Summary

Phase 6 aligns Socket.IO with Phase 4 HTTP chat and Phase 5 notifications: **identity from JWT only** (SOCK-01), **conversation rooms + per-user rooms** for fan-out (SOCK-02), and **database write before any chat/read-related emit** (SOCK-03). The current `SocketService` already validates access tokens at handshake and on each packet, and mirrors Phase 5’s `ISocketUserEmitter` pattern for notifications — but it **stores one socket id per user** (`Map<userId, socket.id>`), which violates multi-tab/device sync (D-05), and it still exposes **`sendMessage` / `receiveMessage` with client-trusted `senderId`**, which matches CONCERNS.md P1 and must be removed.

**Standard remediation:** use Socket.IO **rooms** so every connection `join`s a stable per-user room (e.g. `user:<userId>`) and optionally `chat:<chatId>` after server-side membership checks. Emit with `io.to(room).emit(...)` so all tabs receive personal and in-chat events without custom socket-id maps. Hook **`ChatMessagesService.sendMessage`** and **`markRead`** after successful persistence to emit; keep **message creation only on REST** — sockets deliver only.

**Primary recommendation:** Replace the one-socket map with **per-user room fan-out**, remove legacy chat socket events, and inject a narrow **realtime emitter port** into `ChatMessagesService` (same style as `NotificationsService.bindSocketEmitter`) so HTTP services own persist-then-emit ordering.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `socket.io` | **4.8.3** (project + `npm view` 2026-03-23) | WebSocket server, rooms, broadcast | Already integrated; v4 docs match API in use. |
| `socket.io-client` | **4.8.3** (devDependency) | Automated tests / manual probes | Same major as server (protocol match). |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@socket.io/redis-adapter` | *not in project* | Multi-node room sync | **v1:** single process per PROJECT — omit unless scaling out. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Socket.IO rooms + `io.to()` | In-memory `Map<userId, Set<socketId>>` | Rooms are **documented** and support `fetchSockets()` for “last tab disconnected” checks; less bug-prone than manual set sync. |
| Custom heartbeat / last_seen DB | Connection-only online (D-01) | Aligns with locked scope; simpler server state. |

**Installation:** No new packages required for baseline Phase 6; optional Redis adapter only if multi-instance deployment is planned.

**Version verification:**

```bash
npm view socket.io version   # 4.8.3 (verified 2026-03-23)
```

## Architecture Patterns

### Recommended layout (conceptual)

```
src/services/socket.service.ts       # Server, auth middleware, connection/join handlers, typing
src/constants/socket.constant.ts     # NEW — event names + room prefixes (planner names)
src/ports/realtimeChat.port.ts       # NEW — narrow interface emitMessage / emitRead / presence hooks
```

Keep **HTTP services authoritative**: `ChatMessagesService` calls the port **after** DB success (constructor injection from container, mirroring notifications).

### Pattern 1: Per-user room for multi-tab fan-out (D-05)

**What:** On connection, `socket.join('user:' + userId)` (use a prefix to avoid collisions with socket ids). Replace `emitToUser` with `this.io.to('user:' + userId).emit(...)`.

**When to use:** All personal events: notifications (`NOTIFICATION_SOCKET_EVENT`), read-sync to own tabs, optional global friend presence subscription.

**Example:**

```typescript
// Source: https://socket.io/docs/v4/server-api/#socketjoinroom
io.on('connection', (socket) => {
  const userId = computeUserId(socket);
  socket.join(`user:${userId}`);
  socket.on('disconnect', async () => {
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    if (sockets.length === 0) {
      // no more active connections for this user — emit offline to mutual friends, etc.
    }
  });
});
```

**Confidence:** HIGH — official Server API documents `join`, `in(room).fetchSockets()`, and disconnect handling.

### Pattern 2: Conversation room after membership check (SOCK-02)

**What:** Client requests join (e.g. `chat:subscribe` with `chatId`). Server loads membership via `IChatMemberRepository` (same rules as HTTP). On success: `socket.join('chat:' + chatId)`.

**When to use:** Message delivery to everyone currently viewing the thread; typing broadcasts; optional group online aggregate updates to room.

**Anti-pattern:** Joining `chat:<id>` based only on client-supplied id without DB check — allows leaking events.

### Pattern 3: Persist-then-emit for messages and read (SOCK-03)

**What:** In `ChatMessagesService.sendMessage`, after `insertMessage` and `touchUpdatedAt`, call realtime emit with **`toChatMessageDto(msg)`** (D-10). Target: `io.to('chat:' + chatId)` and optionally `io.to('user:' + memberId)` for members not in room (planner — discretion); minimum is conversation room for open clients + user room for cross-tab if spec requires.

**What (read):** After `updateReadState` in `markRead`, emit a read-receipt event to `chat:` room (others + own tabs per D-07).

**Established precedent:** `NotificationsService.persistAndEmit` inserts then `emitToRecipient`.

### Anti-Patterns to Avoid

- **Client-supplied sender identity:** Never accept `senderId` on socket payloads for authoritative actions (CONCERNS.md).
- **Emit-before-persist for durable state:** Causes history/realtime divergence (CONCERNS.md tech debt).
- **`socket.to(socket.id).emit()`:** Official docs warn this does not work; use `io.to(socket.id).emit()` for by-id delivery.
- **Wildcard CORS in credentialed mode:** Existing project note in CONCERNS.md — keep production allowlist.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-socket fan-out | Manual maps of one id per user | **Room per user** + `io.to()` | Built-in dedupe, documented `fetchSockets()` for “last connection gone”. |
| Typing persistence | DB rows for typing | Ephemeral `chat:` broadcast + TTL/debounce (D-13) | Matches product decision; avoids write churn. |
| Cross-server rooms (future) | Homegrown pub/sub | `@socket.io/redis-adapter` | Official scaling path when >1 Node process. |

**Key insight:** Rooms map cleanly to **conversation** and **user** channels required by SOCK-02 and D-05.

## Common Pitfalls

### Pitfall 1: Stale token on long-lived socket

**What goes wrong:** Handshake succeeds; access token expires; server still trusts old `decoded` on new events.

**Why:** Packet middleware re-verifies token in `socket.service.ts` but does not refresh `handshake.auth.decoded` after rotation.

**How to avoid:** On each successful packet verify, update `decoded` from fresh `verifyAccessToken` result; disconnect on failure (partially there).

**Warning signs:** Clients receive `Unauthorized` and disconnect intermittently — expected if token TTL is short.

### Pitfall 2: Presence storm on connect/disconnect

**What goes wrong:** Broadcasting “friend online” to entire friend list without batching costs CPU on large graphs.

**Why:** D-02 requires mutual-friend global presence.

**How to avoid:** Emit only to **mutual friends’ `user:` rooms** (requires loading friend ids from `FriendsService` / repository — same bounded context as HTTP). Debounce rapid reconnects if needed (discretion).

### Pitfall 3: Group “anyone online” incorrect after partial membership

**What goes wrong:** Showing online for a group when only non-members are connected.

**Why:** Joining wrong room or not scoping aggregate to **chat members**.

**How to avoid:** Aggregate online for chat `C` = intersection of online set with **member list** for `C` (planner algorithm; may query `chatMemberRepository.listMembers` or cache on join).

### Pitfall 4: Double notification + socket message

**What goes wrong:** Client shows duplicate UI from `notification:new` and `chat:message` for the same send.

**Why:** `sendMessage` already calls `recordNewMessage` which emits notification.

**How to avoid:** Document client behavior or align payloads so inbox + thread dedupe by `messageId` (open question for FE).

## Code Examples

### Emit to a room (server)

```typescript
// Source: https://socket.io/docs/v4/server-api/#serverroroom
io.to('room-101').emit('foo', 'bar');
```

### Join multiple rooms

```typescript
// Source: https://socket.io/docs/v4/server-api/#socketjoinroom
socket.join(['room 237', 'room 238']);
```

### Integration touchpoints (existing code)

Message persistence (emit **after** this block):

```96:118:src/services/chatMessages.service.ts
    const msg = ChatMessageRepository.newOutgoingMessage(cid, viewerOid, text || undefined, attachments);
    await this.chatMessageRepository.insertMessage(msg);
    await this.chatRepository.touchUpdatedAt(cid, msg.createdAt);
    // ... notifications ...
    return toChatMessageDto(msg);
```

Read persistence (emit **after** `updateReadState`):

```155:178:src/services/chatMessages.service.ts
  async markRead(userId: string, chatId: string, body: MarkChatReadBodyDTO): Promise<void> {
    // ...
    await this.chatMemberRepository.updateReadState(cid, viewerOid, messageId, at);
  }
```

Notification emit pattern to preserve:

```72:77:src/services/notifications.service.ts
  private emitToRecipient(recipientUserId: string, doc: INotification): void {
    if (!this.socketEmitter) return;
    this.socketEmitter.emitToUser(recipientUserId, NOTIFICATION_SOCKET_EVENT, {
      notification: toNotificationListItem(doc)
    });
  }
```

**Required change:** `emitToUser` implementation must fan-out (rooms), not single `Map` entry:

```41:46:src/services/socket.service.ts
  public emitToUser(userId: string, event: string, data: unknown): void {
    const socketId = this.users.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct `socket.id` map per user | **User-scoped room** + `io.to()` | Socket.IO v4 docs / ecosystem | Multi-tab; aligns with `fetchSockets()` idiom |
| Client sends `senderId` in socket payload | **JWT-only identity** | Phase 6 requirement | Closes CONCERNS.md spoofing vector |

**Deprecated/outdated (remove in Phase 6):**

- `sendMessage` / `receiveMessage` handlers trusting client `senderId` in `socket.service.ts`.

**Scaling note (LOW priority v1):** Default in-memory adapter is fine for single Node process. Horizontal scaling needs Redis/Postgres adapter per [Socket.IO adapter docs](https://socket.io/docs/v4/adapter/).

## Open Questions

1. **Dedupe: notification vs chat thread**
   - What we know: Both paths fire on new message (`recordNewMessage` + future chat emit).
   - What’s unclear: Whether FE dedupes by id or server suppresses one channel.
   - Recommendation: Document contract; prefer explicit `messageId` on both payloads.

2. **Read receipt payload shape**
   - What we know: D-07 requires others + self tabs.
   - What’s unclear: Minimal `{ chatId, userId, lastReadMessageId }` vs full DTO.
   - Recommendation: Minimal + timestamps matching HTTP if any.

3. **Friend presence subscriber list cost**
   - What we know: D-02 needs mutual-friend targeting.
   - What’s unclear: Max friends v1; whether to cache friend ids on connect.
   - Recommendation: Reuse existing friends repository; measure in verification.

## Validation Architecture

> Nyquist enabled (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **None wired** — `package.json` has no `test` script; CONCERNS.md P0 / QUAL-02 |
| Config file | none — **Wave 0**: add e.g. `vitest.config.ts` or `node:test` runner (planner picks; `socket.io-client` already devDependency) |
| Quick run command | `{to be defined}` e.g. `npx vitest run --pool forks tests/socket --reporter=dot` |
| Full suite command | same until broader suite exists |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SOCK-01 | Connect rejects missing/invalid token; no socket event accepts spoofed sender | integration | vitest + `socket.io-client` against test `http.Server` | ❌ Wave 0 |
| SOCK-02 | After subscribe with valid membership, client receives room emits; non-member does not | integration | same harness + seeded chat member | ❌ Wave 0 |
| SOCK-03 | Message REST triggers socket emit only after DB insert (ordering / spy on repo) | integration | HTTP supertest + socket client or service-level mock | ❌ Wave 0 |
| Presence D-02/D-03 | Mutual friend sees online; non-friend in same group sees aggregate per rules | integration | multi-client harness + friend fixture | ❌ Wave 0 — **complex**; may be wave 2 |
| Multi-tab D-05 | Two connections same `userId` both receive `user:` room emit | integration | two `socket.io-client` instances | ❌ Wave 0 |
| Typing D-12/D-13 | Ephemeral only; no DB writes on typing path | unit/integration | spy on `chatMessageRepository` / mongo | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** quick socket/auth smoke once framework exists.
- **Per wave merge:** full Phase 6 integration subset.
- **Phase gate:** SOCK-01–03 automated where feasible; presence edge cases documented for manual UAT if too heavy.

### Wave 0 Gaps

- [ ] Choose runner (**vitest** recommended for TS/ESM alignment with project).
- [ ] `tests/socket/` (or `src/__tests__/socket/`) — harness: spin `SocketService` + in-memory or test Mongo (planner decides).
- [ ] Fixtures: JWT minting via `TokenService`, test users verified/not banned.
- [ ] No hand-rolled production server in tests — use dedicated test `createServer()` pattern.

## Sources

### Primary (HIGH confidence)

- [Socket.IO Server API v4](https://socket.io/docs/v4/server-api/) — `Server`, `socket.join`, `io.to`, `fetchSockets`, adapter notes.
- Codebase: `src/services/socket.service.ts`, `src/services/chatMessages.service.ts`, `src/services/notifications.service.ts`, `.planning/codebase/CONCERNS.md`, `06-CONTEXT.md`.

### Secondary (MEDIUM confidence)

- [Socket.IO adapter overview](https://socket.io/docs/v4/adapter/) — multi-node future scope.

### Tertiary (LOW confidence)

- Community blog patterns for “socket.io jwt room” — use only if reconciled with official API above.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — versions from lockfile + npm registry.
- Architecture: **HIGH** — official room API + explicit code touchpoints.
- Pitfalls: **MEDIUM** — presence algorithm needs implementation validation.

**Research date:** 2026-03-23  
**Valid until:** ~2026-04-23 (socket.io 4.x stable); re-check if upgrading major.

## RESEARCH COMPLETE
