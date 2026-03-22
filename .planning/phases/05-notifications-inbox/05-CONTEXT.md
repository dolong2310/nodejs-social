# Phase 5: Notifications inbox — Context

**Gathered:** 2026-03-22  
**Status:** Ready for planning  
**Source:** `/gsd-discuss-phase 5` — thảo luận tiếng Việt, 4 vùng (list/read, payload, dedup/retention, block).

<domain>
## Phase Boundary

Hộp thông báo **bền** trên **DB social** + **REST**: list có phân trang, đánh dấu đã đọc; schema **mở rộng** với type v1: `friend_request`, `friend_accepted`, `new_message`, `added_to_group`. Khi tạo notification: **ghi DB trước**, sau đó **emit Socket.IO** tới kênh user nhận (**NOTF-03**). Không mở scope email/push, ranking inbox, hay type ngoài roadmap trong phase này.

</domain>

<decisions>
## Implementation Decisions

### 1. API list & trạng thái đọc (NOTF-01)

- **D-01:** Mặc định list trả về **tất cả** thông báo (đã đọc + chưa đọc), sắp xếp **mới nhất trước** (`createdAt` giảm dần). Có query lọc **chỉ chưa đọc** (tên param do planner chọn, ví dụ `unreadOnly`).
- **D-02:** Phân trang **cursor** (không lấy offset/skip làm primary).
- **D-03:** Đánh dấu đã đọc hỗ trợ **cả** theo **từng id** lẫn **batch** (nhiều id và/hoặc mark-all — chi tiết endpoint do planner).
- **D-04:** Response list là **mảng phẳng**; **không** gom nhóm theo ngày trên server. FE hiển thị `createdAt` từng dòng nếu cần.

### 2. Payload & type schema (NOTF-02)

- **D-05:** Mỗi item có **dòng text ngắn** cho list **và** đủ **id** để điều hướng; text có thể **generic theo type**.
- **D-06:** `new_message`: có **preview nội dung** chỉ khi tin là **text thuần**; nếu chỉ file/ảnh (hoặc không có text hiển thị) thì **không** preview nội dung — dùng nhãn kiểu **“Đã gửi một ảnh”** (hoặc tương đương theo loại đính kèm).
- **D-07:** **Snapshot actor** tại thời điểm tạo: tối thiểu **displayName** + **avatarUrl** (hoặc key ảnh tương đương) để list inbox **không bắt buộc** gọi thêm `/users`.
- **D-08:** **Mỗi type một nhóm field cố định** trong schema/contract; type mới = **nhánh/type riêng** (strict, dễ validate, OpenAPI mô tả rõ).

### 3. Trùng lặp, nhiều sự kiện, retention

- **D-09:** `new_message`: **mỗi tin nhắn** tạo **một** dòng notification mới. **Gộp** nhiều tin thành một dòng (kiểu b) là **change request / phase sau**, không v1.
- **D-10:** `friend_request`: mỗi lần gửi lời mời hợp lệ (kể cả gửi lại sau decline/revoke) → **một** thông báo mới cho người nhận.
- **D-11:** Giới hạn **tổng số** notification **lưu trữ / user** (trần **N** — planner đề xuất số, ví dụ 500–2000). Cơ chế **ưu tiên**: sau khi insert thành công, **trim** bản ghi **cũ nhất** cho tới khi ≤ N (**không bắt buộc cron**). **Claude’s discretion:** ưu tiên xóa bản **đã đọc** trước khi đụng **chưa đọc** nếu có thể; nếu mâu thuẫn với invariant, document trong plan.
- **D-12:** `added_to_group`: **mỗi người được thêm** nhận **một** dòng thông báo riêng.

### 4. Block & inbox (khớp graph Phase 2 + chat Phase 4)

- **D-13:** **Không tạo** notification **mới** mang ý nghĩa tương tác xã hội/chat **giữa cặp user đang block lẫn nhau** (theo rule block hiện có). Không mở rộng tương tác mới qua kênh notify.
- **D-14:** API **list** inbox: **lọc/ẩn** các thông báo **liên quan tới user mà viewer hiện đang block (hai chiều)** — client không thấy các dòng đó trong response list khi block còn hiệu lực. (Chi tiết “liên quan” — actor, conversation, group — do planner + khớp index/query.)
- **D-15:** Hook tạo notification sau luồng friends: **không chạy** tạo notify nếu thao tác friend **đã bị từ chối vì block** (đồng bộ với friends API / Phase 2).
- **D-16:** Sau **unblock**: tạo notification mới trở lại **bình thường**, không rule đặc biệt.

### Claude's Discretion

- Giá trị **N** (D-11), tên query param unread, encoding cursor, tên event Socket.IO, và chi tiết filter D-14 (trường nào dùng để map notification → đối phương bị block).
- Cách map từng `type` sang field bắt buộc trong OpenAPI (miễn khớp D-08).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & requirements

- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, NOTF-01…03.
- `.planning/REQUIREMENTS.md` — NOTF-01, NOTF-02, NOTF-03.
- `.planning/PROJECT.md` — Notifications trên social DB + REST + socket emit; persist-then-emit.

### Prior phases

- `.planning/phases/02-friends-graph-privacy/02-CONTEXT.md` — Friends, blocks, D-12…D-16; cap UTC.
- `.planning/phases/04-chat-http-api/04-CONTEXT.md` — Chat HTTP, `new_message` / `added_to_group` hooks; block D-08…D-11.

### Risks

- `.planning/codebase/CONCERNS.md` — Socket identity, persist-then-emit (align NOTF-03 với Phase 6 sau).

### Code touchpoints (dự kiến)

- `src/database/mongodb/database.service.ts` — collection `notifications` (hoặc tên planner chọn) trên **social** `Db`, indexes.
- `src/container/index.ts`, `src/app.ts` — DI, mount routes.
- `src/services/socket.service.ts` — emit sau persist (pattern hiện có: `receiveMessage` legacy; Phase 5 thêm event/room user phù hợp NOTF-03).
- `src/services/friends.service.ts` (và chat services sau Phase 4) — gọi `NotificationsService` (hoặc tương đương) **sau** khi DB write thành công; respect block (D-13, D-15).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- Layering route → validation → controller → service → repository trên social DB (posts, friends, …).
- `DatabaseService` — thêm collection + `initializeIndexes()` theo pattern hiện tại.
- `SocketService` — `Server` gắn HTTP, auth handshake JWT; map `userId` → `socket.id`; chỗ emit có thể mở rộng cho personal channel (NOTF-03).

### Established patterns

- `protect` / validation async; OpenAPI fragments trong `swagger/`.

### Integration points

- Tạo notification từ **FriendsService** (request, accept) và **chat message / group membership** flows (sau Phase 4) — **sau** transaction/write thành công, rồi emit.

</code_context>

<specifics>
## Specific Ideas

- User ưu tiên **đơn giản** cho `new_message` (mỗi tin một row); gộp inbox sau này = **change request**.
- Retention: **trim on insert** thay vì cron cho invariant “≤ N / user”; cron có thể bổ sung sau cho TTL theo thời gian nếu cần.

</specifics>

<deferred>
## Deferred Ideas

- **Gộp** nhiều `new_message` trong cùng conversation thành một dòng (thay D-09) — backlog / CR sau.
- **Email/push** notification — NOTF-R01 / Out of scope v1.

### Reviewed Todos (not folded)

- Không có todo GSD match phase 5 tại thời điểm discuss.

</deferred>

---

*Phase: 05-notifications-inbox*  
*Context gathered: 2026-03-22*
