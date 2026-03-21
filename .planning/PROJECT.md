# nodejs-social

## What This Is

Backend **social + realtime chat** cho ứng dụng kiểu mạng xã hội: người dùng đăng bài, tương tác (like, comment, bookmark), tìm kiếm, media trên **AWS S3**; **đồng thời** có **kết bạn hai chiều** (friend request), **chat trực tiếp và nhóm**, và **trung tâm thông báo** (lưu DB + REST + đẩy qua Socket.IO). Auth dùng **chuẩn dự án hiện tại** (JWT, OAuth Google, …), mở rộng khi thiếu — không sao chép flow auth của project tham chiếu (PingMe).

**Kiến trúc triển khai:** một process HTTP, một port; **module chat** tách code theo bounded context nhưng **không** thêm prefix URL kiểu `/api/chat` — route vẫn dạng `/api/...` như hiện tại. Dữ liệu chat nằm trên **MongoDB cùng cluster, database riêng** (`DATABASE_CHAT_NAME`); dữ liệu social chính giữ database hiện tại.

## Core Value

Người dùng **kết bạn tin cậy**, **xem feed và tương tác đúng quyền**, và **nhắn tin (1-1 hoặc nhóm) ổn định, có lịch sử và thông báo** — tất cả qua một API thống nhất, bảo mật và nhất quán với codebase TypeScript/Express hiện có.

## Requirements

### Validated

Các khả năng **đã có trong codebase** (brownfield) — tham chiếu `.planning/codebase/ARCHITECTURE.md`, `STACK.md`, `INTEGRATIONS.md`:

- ✓ API Express 5 dưới prefix `/api` với layering **route → middleware/validation → controller → service → repository** — existing
- ✓ MongoDB (native driver), Redis, BullMQ workers, graceful shutdown — existing
- ✓ Auth: JWT + bcrypt, Google OAuth bridge; cookie-parser, CORS — existing
- ✓ Users, posts, bookmarks, **followers** (sẽ bị thay thế), search, media (S3), email (SES), static/video pipeline — existing
- ✓ Socket.IO gắn chung `HttpServer` với Express; auth handshake — existing (luồng message hiện tại mang tính thử nghiệm)
- ✓ OpenAPI/Swagger tại `/api/docs`, logging Pino — existing
- ✓ Route `/api/conversations` + service/repository/collection `conversations` trên **DB chính** — existing nhưng **coi là thử nghiệm**, sẽ thay bằng nghiệp vụ chat mới
- ✓ **Phase 1 — INFR-01 / INFR-03:** Hai database Mongo trên **cùng cluster** (social + chat), một `MongoClient`, hai `Db`; biến bắt buộc `DATABASE_CHAT_NAME` trong `envConfig` + `.env.example`; ping kép khi `connect()`, fail-fast nếu chat DB lỗi; getter `chatDb` cho phase sau.

### Active

**Social graph & hồ sơ**

- [ ] **Thay toàn bộ luồng followers bằng friends:** request → accept / decline / revoke; danh sách bạn; **bỏ dữ liệu follow cũ** (drop, không migration).
- [ ] **Giới hạn ~100 friend request gửi đi / user / ngày** (chống spam).
- [ ] **Unfriend** và **Block** (API v1): block ⇒ **hai bên không còn thấy post của nhau** (kể cả public), và **auto unfriend**.

**Bài viết & feed**

- [ ] **Visibility theo từng post:** `public` | `friends-only` | `only-me`.
- [ ] **Mặc định tạo post:** visibility `public`; field **cho phép người lạ comment** mặc định `true`.
- [ ] **Feed:** hợp nhất bài **public** (toàn hệ) + bài từ **bạn bè**; sắp xếp theo `createdAt` giảm dần (**không rank** trong v1; cải tiến sau).
- [ ] **Tương tác:** người lạ chỉ **comment** nếu post **public** và field “cho phép người lạ comment” = true; nếu không thì người lạ vẫn có thể **like** và **bookmark** khi xem được post.

**Chat (DB `DATABASE_CHAT_NAME`, Mongo native — không Mongoose)**

- [ ] **Direct** giữa hai user đã là bạn; **group chat** (nhiều thành viên; **cho phép group 2 người**).
- [ ] **Không DM** khi chưa kết bạn (không inbox người lạ).
- [ ] **Replace** implementation `/api/conversations` (và luồng liên quan) + **replace toàn bộ Socket.IO** cho chat: join room theo conversation, tin nhắn, đã đọc, online users, v.v. — bám cấu trúc `src/` hiện tại.
- [ ] Avatar / upload media chat: **dùng S3** (không Cloudinary); auth giữ chuẩn dự án.

**Notifications**

- [ ] **Lưu DB + REST:** list, mark read (và các thao tác tối thiểu cần cho v1).
- [ ] Loại tối thiểu: `friend_request`, `friend_accepted`, `new_message`, `added_to_group`; **mở rộng** loại sau.
- [ ] Mỗi lần tạo notification: **emit Socket.IO** tới room user (đồng bộ realtime với inbox).

**Chất lượng & an toàn**

- [ ] Sửa các rủi ro đã ghi trong `.planning/codebase/CONCERNS.md` trên đường đi (đặc biệt: **không tin `senderId` từ client**; persist trước khi emit; kiểm tra participant/group).
- [ ] Bổ sung **tests** theo roadmap (hiện chưa có test runner trong `package.json`).

### Out of Scope

- Moderation / report user-post-comment — **không v1**
- Tương thích frontend/API cũ (PingMe hay bản cũ) — **không**; FE thiết kế lại
- Mongoose cho chat; Cloudinary; microservice/port tách cho chat
- Setting “chặt tin nhắn từ người lạ” — **bỏ** (redundant với rule chỉ chat khi đã bạn)
- Feed ranking / thuật toán phức tạp — **sau v1**

## Context

- **Tham chiếu hành vi chat:** `/Users/dolong/Documents/ReactJS/pingme/backend` (socket rooms, friend/message flow) — **chỉ tham khảo**, contract REST/event có thể khác; **notifications** PingMe gần như chỉ socket, còn dự án này v1 có **DB + REST + socket**.
- Codebase map: `.planning/codebase/*`.
- Env: **`DATABASE_CHAT_NAME`** đã wired trong app (Phase 1); staging/prod cần set giống pattern `.env.example`.

## Constraints

- **Tech stack:** Giữ TypeScript, Express 5, Mongo native driver, Redis/BullMQ/S3/SES như hiện tại — không nhập Mongoose cho scope chat.
- **URL:** Không thêm segment `chat` vào path; giữ pattern `/api/auth`, `/api/users`, …
- **Process:** Một app, một server HTTP; chat module chỉ tách **code + database**.
- **Dữ liệu followers:** Drop theo quyết định sản phẩm — cần script/migration hoặc xóa collection/indexes có liên quan trong kế hoạch triển khai.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Friends thay followers + drop data cũ | Đồng bộ social graph với chat (chỉ bạn mới chat); đơn giản hóa migration | — Pending |
| Chat DB riêng `DATABASE_CHAT_NAME` | Tách bounded context, backup/scale độc lập; cùng cluster | Phase 1: kết nối + env; schema/index Phase 4 |
| Notifications: DB + REST + socket emit | Inbox đáng tin + realtime; vượt mức PingMe | — Pending |
| Post defaults: public + stranger comments allowed | Giảm ma sát UX; user chỉnh từng bài | — Pending |
| Block ẩn post lẫn nhau + unfriend | Rõ ràng về quyền riêng tư | — Pending |
| Không DM trước khi bạn | Giảm spam/abuse | — Pending |
| Replace socket + conversations thử nghiệm | Loại bỏ luồng test; align production chat | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-03-21 after Phase 1 transition (chat DB foundation shipped)*
