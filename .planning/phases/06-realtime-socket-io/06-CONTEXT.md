# Phase 6: Realtime (Socket.IO) — Context

**Gathered:** 2026-03-23  
**Status:** Ready for planning  
**Source:** `/gsd-discuss-phase 6` — thảo luận tiếng Việt, 4 mục (presence, multi-device/read, contract, typing).

<domain>
## Phase Boundary

Đồng bộ **Socket.IO** với chat HTTP (Phase 4) và inbox (Phase 5): **SOCK-01** identity chỉ từ JWT, không tin field client; **SOCK-02** join room theo **conversation** + room theo **user** cho sự kiện cá nhân; **presence** và **typing** (ephemeral) theo quyết định dưới đây; **SOCK-03** **ghi DB trước, emit sau** cho tin nhắn và trạng thái đọc. **Gửi tin chỉ qua REST**; socket chỉ **delivery** sau persist. Không mở scope ngoài roadmap (email/push, last_seen DB, v.v.).

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & requirements

- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, SOCK-01…03.
- `.planning/REQUIREMENTS.md` — SOCK-01, SOCK-02, SOCK-03.

### Prior phases

- `.planning/phases/04-chat-http-api/04-CONTEXT.md` — HTTP-first chat, rooms/membership, block D-08…D-11.
- `.planning/phases/05-notifications-inbox/05-CONTEXT.md` — persist-then-emit, `notification:new`, D-01…D-16.

### Risks

- `.planning/codebase/CONCERNS.md` — socket sender trust, persist trước emit; align Phase 6.

### Code touchpoints

- `src/services/socket.service.ts` — handshake JWT, map user→socket, legacy handlers (thay thế).
- `src/constants/notification.constant.ts` — `NOTIFICATION_SOCKET_EVENT` (D-11: có thể đổi).
- `src/services/notifications.service.ts` — `emitToUser` sau persist.
- `src/container/index.ts`, `src/app.ts` — DI, bootstrap socket + chat services.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- Auth handshake: verify access token, user exists, verified/banned checks — tái dùng / siết chặt cho SOCK-01.
- `ISocketUserEmitter` / `NotificationsService.bindSocketEmitter` — pattern emit sau DB.

### Established patterns

- Phase 5: **persist-then-emit** cho notification.
- Phase 4: chat writes qua services/repos trên **chat DB**.

### Integration points

- Sau **create message** / **mark read** trong **chat services** (HTTP path): gọi layer socket để **emit** tới conversation room + fan-out user (xem dưới).

### Ràng buộc quan trọng (đa tab)

- Hiện `SocketService` dùng `Map<userId, socket.id>` — **một** socket/user. Quyết định **D-05** yêu cầu **fan-out tới mọi kết nối** của cùng user (Set/socket list **hoặc** room per-user mà mỗi tab join). Planner **bắt buộc** thay pattern này.

</code_context>

<specifics>
## Specific Ideas

- Cột phải feed: **recent + chỉ đã có conversation**; group và direct cùng quy tắc aggregate online cho nhóm.
- User đã làm rõ: “all” trong discuss = **chọn đủ 4 mục thảo luận tuần tự**, không phải auto-default planner.

</specifics>

<deferred>
## Deferred Ideas

- **Last seen** / presence lịch sử — không v1 (D-01).
- **Typing persist** — không (D-13).

**None — discussion stayed within phase scope** (ngoài các mục deferred rõ ràng trên).

</deferred>

---

*Phase: 06-realtime-socket-io*  
*Context gathered: 2026-03-23*
