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
- ✓ Users, posts, bookmarks, search, media (S3), email (SES), static/video pipeline — existing
- ✓ Socket.IO gắn chung `HttpServer` với Express; auth handshake — existing (luồng message hiện tại mang tính thử nghiệm)
- ✓ OpenAPI/Swagger tại `/api/docs`, logging Pino — existing
- ✓ Route `/api/conversations` + service/repository/collection `conversations` trên **DB chính** — existing nhưng **coi là thử nghiệm**, sẽ thay bằng nghiệp vụ chat mới
- ✓ **Phase 1 — INFR-01 / INFR-03:** Hai database Mongo trên **cùng cluster** (social + chat), một `MongoClient`, hai `Db`; biến bắt buộc `DATABASE_CHAT_NAME` trong `envConfig` + `.env.example`; ping kép khi `connect()`, fail-fast nếu chat DB lỗi; getter `chatDb` cho phase sau.
- ✓ **Phase 2 — INFR-02, FRND-01…06, BLCK-01…03:** Mutual friends graph (`friendships`, `friendRequests`, `blocks`), REST `/api/friends` và `/api/blocks`, giới hạn **~100** friend request gửi đi / user / **ngày UTC**, unfriend, block/unblock (D-14: unfriend + xóa request khi block). Legacy followers **đã gỡ** khỏi code và Mongo wiring. Posts/search/validation dùng **`FriendsService`** (bạn hai chiều) thay followers.
- ✓ **Phase 3 — POST-*, FEED-*, ENGA-*, BLCK-02 (read/engagement):** Audience literals `public` \| `friends-only` \| `only-me`; `allowStrangerComments` trên create + owner PATCH; feed merged (public + friends-only từ bạn + mọi bài của mình) với **BLCK-02** loại author bị block; guest feed chỉ public; sort `createdAt` desc; đọc GET posts cho phép user **chưa verify**; like/bookmark/comment/repost/quote qua rule block + visibility + stranger flag; **`GET /api/search` posts** cùng logic block + visibility; **`/api/likes`** + collection `likes`.
- ✓ **Phase 7 — QUAL-01, QUAL-02:** Vitest + `npm test`; smoke HTTP (auth verify-email, friends, chat text); socket JWT + `chat:subscribe` + `presence:chat`; `07-VERIFICATION.md` + bảng Resolved trong `CONCERNS.md` (phạm vi socket identity + persist/emit trên path đã ship). CI tự động **ngoài** DoD phase 7 (D-07).

### Active

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

- (đã chuyển xuống Validated — Phase 7)

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
| Friends thay followers + drop data cũ | Đồng bộ social graph với chat (chỉ bạn mới chat); đơn giản hóa migration | Phase 2: API + DB graph; follower code removed |
| Chat DB riêng `DATABASE_CHAT_NAME` | Tách bounded context, backup/scale độc lập; cùng cluster | Phase 1: kết nối + env; schema/index Phase 4 |
| Notifications: DB + REST + socket emit | Inbox đáng tin + realtime; vượt mức PingMe | — Pending |
| Post defaults: public + stranger comments allowed | Giảm ma sát UX; user chỉnh từng bài | — Pending |
| Block ẩn post lẫn nhau + unfriend | Rõ ràng về quyền riêng tư | Phase 2: block API + side effects; feed ẩn post → Phase 3 |
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

*Last updated: 2026-03-23 after Phase 7 complete (Vitest integration tests, QUAL-01 verification doc + CONCERNS Resolved section)*
