# Phase 4: Chat HTTP API — Context

**Gathered:** 2026-03-22  
**Status:** Ready for planning  
**Source:** Thảo luận tiếng Việt — user trả lời trực tiếp các vùng 1–4 + ghi nhận tính năng lưu backlog.

<domain>
## Phase Boundary

API HTTP chat trên **MongoDB chat** (`DATABASE_CHAT_NAME`): hội thoại **1-1** và **nhóm**, **tin nhắn**, **lịch sử có cursor**, **đánh dấu đã đọc** (PATCH rõ ràng), **đính kèm S3** (ảnh + file, giới hạn 5MB v1). **Thay thế** luồng thử nghiệm `/api/conversations` và persistence trên DB social. **Không** gồm realtime Socket.IO (Phase 6), **không** gồm inbox notification đầy đủ (Phase 5). **Reaction / sửa / xóa tin** — **ngoài scope** phase này (xem `<deferred>`).

</domain>

<decisions>
## Implementation Decisions

### 1. Hội thoại trực tiếp (1-1)

- **D-01:** **Một** hội thoại **cố định** cho mỗi **cặp bạn** (idempotent get-or-create theo cặp user đã là friends). Không hỗ trợ nhiều thread DM song song giữa cùng hai người trong v1.

### 2. Nhóm: mời, rời, vai trò, metadata nhóm

- **D-02:** Sau khi nhóm được tạo, **mọi thành viên** đều có thể **mời thêm** người khác, với điều kiện: người được mời phải là **bạn của người mời** và **đồng thời là bạn của người tạo nhóm (creator)**.
- **D-03:** Thành viên có thể **rời nhóm** (self-leave).
- **D-04:** Có **kick**: **admin** kick được **manager** và **member**; **manager** kick được **member** (manager không kick admin; không kick manager trừ khi sau này có rule bổ sung — mặc định chỉ admin quản lý manager).
- **D-05:** **Hai role điều hành** ngoài member thường: **`admin`** và **`manager`**. **Admin** quyền cao nhất: kick bất kỳ (manager + member), **hạ manager xuống member**, **chuyển quyền admin** cho thành viên khác. **Creator** mặc định là **admin** đầu tiên.
- **D-06:** **Chuyển admin:** admin có thể trao quyền admin cho thành viên khác; **vai trò của admin cũ sau khi chuyển** — để **Claude's discretion** mặc định **→ manager** (có thể chỉnh nếu user xác nhận khác).
- **D-07:** **Ảnh nhóm, tên nhóm** và các **settings nhóm** trong tương lai: chỉ **admin** và **manager** được **sửa**; **member** không sửa được. (Chi tiết settings mở rộng chưa có plan — defer tới phase/backlog khi có spec.)

### 3. Chặn (block) và chat / hiển thị profile & post

- **D-08:** Khi **A chặn B** (theo graph block hiện có): **không tương tác chat** — **không gửi** tin mới; không mở thêm quyền tương tác xã hội mới giữa hai phía.
- **D-09:** **Phía bị chặn (B)** vẫn có thể **xem lại lịch sử chat** đã có với A (read-only history — không mở rộng tương tác mới).
- **D-10:** B **không** xem được **thông tin user / profile / post** của A như người dùng bình thường (theo ý user: cách hiển thị cụ thể do planner + khớp API hiện có).
- **D-11 (cần thống nhất với Phase 3 — BLCK-02):** Với các **bài post của A mà B đã từng tương tác**: vẫn **hiển thị** nội dung tương tác đó nhưng **danh tính A** hiển thị dạng **unknown user** (không còn hiển thị profile A cho B). **Mâu thuẫn tiềm ẩn:** `03-CONTEXT` / BLCK-02 hiện orient “không thấy post của nhau trên read path”. **Planner + product:** hoặc **sửa đặc tả BLCK-02** theo D-11, hoặc giới hạn D-11 chỉ vào **màn hình/context cụ thể** (ví dụ chỉ thread comment) — **cần user xác nhận một dòng** trước khi implement post paths.

### 4. Đã đọc, lịch sử, media (CHAT-04)

- **D-12:** **Mark-read:** endpoint **PATCH** (hoặc tương đương) **rõ ràng**, không chỉ dựa vào side-effect mơ hồ.
- **D-13:** **Lịch sử tin nhắn:** phân trang kiểu **cursor** (không bắt buộc offset/skip là primary).
- **D-14:** **Đính kèm:** gồm **ảnh và file**; giới hạn **5MB mỗi file** v1 (sau có thể đổi config). **Tái sử dụng** flow **S3 + auth** giống **bài post** (presigned / pattern hiện có trong codebase).

### Claude's Discretion

- Chi tiết path REST, tên field DTO, mã HTTP từng lỗi — miễn khớp D-01…D-14 và friends/block checks.
- Schema collection/index Mongo chat, shape `lastRead`, cursor encoding.
- Sau **chuyển admin**, role admin cũ nếu không quy định khác → mặc định **manager** (D-06).
- Cách triển khai “unknown user” trên FE không thuộc backend-only phase nhưng API nên trả cờ/placeholder thống nhất cho client mới.

</decisions>

<specifics>
## Specific Ideas

- Nhóm: mô hình **admin / manager / member** với quyền kick và sửa metadata như mô tả; settings nhóm mở rộng mới nghĩ ra — chưa plan.
- User đề xuất thêm **reaction**, **sửa/xóa tin** — ghi **deferred**, không vào scope Phase 4 trừ khi roadmap/requirements được sửa chính thức.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & requirements

- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, CHAT-01…04.
- `.planning/REQUIREMENTS.md` — CHAT-01, CHAT-02, CHAT-03, CHAT-04.
- `.planning/PROJECT.md` — HTTP-first chat, S3, không DM người lạ, thay conversations thử nghiệm.

### Prior phases (graph, block, feed)

- `.planning/phases/01-chat-database-foundation/01-CONTEXT.md` — Chat DB, fail-fast, không schema ở Phase 1.
- `.planning/phases/02-friends-graph-privacy/02-CONTEXT.md` — Friends + blocks; D-12…D-16.
- `.planning/phases/03-posts-feed-engagement/03-CONTEXT.md` — BLCK-02, 403, visibility — **đối chiếu với D-11**.

### Risks / alignment

- `.planning/codebase/CONCERNS.md` — Socket + conversations thử nghiệm; sender từ client (sửa Phase 6 + HTTP path).

### Code touchpoints (thay / nối)

- `src/routes/conversations.route.ts`, `src/controllers/conversations.controller.ts`, `src/services/conversations.service.ts`, `src/repositories/conversation.repository.ts`, `src/models/schemas/conversation.schema.ts` — luồng cũ **social DB**.
- `src/database/mongodb/database.service.ts` — `chatDb`, index chat (Phase 4).
- `src/app.ts`, `src/container/index.ts` — mount routes, DI.
- `src/services/s3.service.ts`, `src/services/media.service.ts` (hoặc tương đương) — tái dùng upload/presign cho chat.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `DatabaseService` + `chatDb` đã có từ Phase 1; repositories pattern trên social DB làm mẫu cho chat DB.
- Flow **S3 / media** cho post — tái dùng cho attachment chat (D-14).
- `FriendsService` / `BlocksService` — kiểm tra bạn bè và block trước khi tạo hội thoại hoặc gửi tin.

### Established patterns

- Route → validation → controller → service → repository; JWT + `protect`; một số route dùng `userVerifiedValidation` (thử nghiệm conversations) — **planner** quyết định có bắt buộc verified cho chat HTTP hay chỉ auth (user đã chưa nói; có thể giữ tương đương conversations cũ hoặc align Phase 3).

### Integration points

- Thay mount `/api/conversations` (hoặc namespace mới nếu planner đổi path — khớp INFR “không `/api/chat` prefix” vẫn có thể đổi resource name).
- Fake-data / Swagger: cập nhật sau khi contract ổn định.

</code_context>

<deferred>
## Deferred Ideas

### Tính năng chat (user đề xuất — chưa trong CHAT-01…04 v1)

- **Reaction** trên tin nhắn.
- **Sửa tin** (edit message).
- **Xóa tin** (delete message — soft/hard tùy spec sau).

→ Backlog hoặc phase sau (có thể decimal phase sau 4 khi roadmap cập nhật).

### Settings nhóm mở rộng

- Các tùy chỉnh nhóm ngoài tên/avatar — chưa có plan; chỉ khóa quyền admin/manager sửa (D-07).

### Đã xem xét — không gộp scope

- None khác — discussion chủ yếu trong boundary Phase 4 ngoài reaction/edit/delete.

</deferred>

---

*Phase: 04-chat-http-api*  
*Context gathered: 2026-03-22*
