# nodejs-social

## What This Is

Backend **social + realtime chat** cho ứng dụng kiểu mạng xã hội: người dùng đăng bài, tương tác (like, comment, bookmark), tìm kiếm, media trên **AWS S3**; **đồng thời** có **kết bạn hai chiều** (friend request), **chat trực tiếp và nhóm**, và **trung tâm thông báo** (lưu DB + REST + đẩy qua Socket.IO). Auth dùng **chuẩn dự án hiện tại** (JWT, OAuth Google, …), mở rộng khi thiếu — không sao chép flow auth của project tham chiếu (PingMe).

**Kiến trúc triển khai:** một process HTTP, một port; **module chat** tách code theo bounded context nhưng **không** thêm prefix URL kiểu `/api/chat` — route vẫn dạng `/api/...` như hiện tại. Dữ liệu chat nằm trên **MongoDB cùng cluster, database riêng** (`DATABASE_CHAT_NAME`); dữ liệu social chính giữ database hiện tại.

## Core Value

Người dùng **kết bạn tin cậy**, **xem feed và tương tác đúng quyền**, và **nhắn tin (1-1 hoặc nhóm) ổn định, có lịch sử và thông báo** — tất cả qua một API thống nhất, bảo mật và nhất quán với codebase TypeScript/Express hiện có.

## Current state (v1.0)

**Shipped:** Milestone **v1.0 — brownfield evolution** (2026-03-23). Bảy phase (chat DB, friends/blocks, feed/engagement, chat HTTP, notifications, Socket.IO, tests + CONCERNS verification) đã hoàn thành; chi tiết roadmap và requirements nằm trong [`.planning/milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md) và [`.planning/milestones/v1.0-REQUIREMENTS.md`](milestones/v1.0-REQUIREMENTS.md). Tóm tắt shipped: [`.planning/MILESTONES.md`](MILESTONES.md).

**Next milestone goals:** Chưa định nghĩa — dùng `/gsd-new-milestone` để cập nhật core value (nếu cần), viết `REQUIREMENTS.md` mới, và lập `ROADMAP.md` cho v1.1+.

## Requirements

### Validated

Các khả năng **đã có trong codebase** (brownfield) — tham chiếu `.planning/codebase/ARCHITECTURE.md`, `STACK.md`, `INTEGRATIONS.md`:

- ✓ API Express 5 dưới prefix `/api` với layering **route → middleware/validation → controller → service → repository** — existing
- ✓ MongoDB (native driver), Redis, BullMQ workers, graceful shutdown — existing
- ✓ Auth: JWT + bcrypt, Google OAuth bridge; cookie-parser, CORS — existing
- ✓ Users, posts, bookmarks, search, media (S3), email (SES), static/video pipeline — existing
- ✓ Socket.IO trên cùng `HttpServer` với Express; JWT handshake; chat + notification fan-out qua rooms đã ship (v1.0 / Phase 6).
- ✓ OpenAPI/Swagger tại `/api/docs`, logging Pino — existing
- ✓ **Phase 1 — INFR-01 / INFR-03:** Hai database Mongo trên **cùng cluster** (social + chat), một `MongoClient`, hai `Db`; biến bắt buộc `DATABASE_CHAT_NAME` trong `envConfig` + `.env.example`; ping kép khi `connect()`, fail-fast nếu chat DB lỗi; getter `chatDb` cho phase sau.
- ✓ **Phase 2 — INFR-02, FRND-01…06, BLCK-01…03:** Mutual friends graph (`friendships`, `friendRequests`, `blocks`), REST `/api/friends` và `/api/blocks`, giới hạn **~100** friend request gửi đi / user / **ngày UTC**, unfriend, block/unblock (D-14: unfriend + xóa request khi block). Legacy followers **đã gỡ** khỏi code và Mongo wiring. Posts/search/validation dùng **`FriendsService`** (bạn hai chiều) thay followers.
- ✓ **Phase 3 — POST-*, FEED-*, ENGA-*, BLCK-02 (read/engagement):** Audience literals `public` \| `friends-only` \| `only-me`; `allowStrangerComments` trên create + owner PATCH; feed merged (public + friends-only từ bạn + mọi bài của mình) với **BLCK-02** loại author bị block; guest feed chỉ public; sort `createdAt` desc; đọc GET posts cho phép user **chưa verify**; like/bookmark/comment/repost/quote qua rule block + visibility + stranger flag; **`GET /api/search` posts** cùng logic block + visibility; **`/api/likes`** + collection `likes`.
- ✓ **Phase 4 — CHAT-01…04:** `/api/chats` (direct + group, membership rules), messages + cursor history + read semantics, S3 metadata attachments (5MB/file); luồng `/api/conversations` thử nghiệm đã thay.
- ✓ **Phase 5 — NOTF-01…03:** Inbox trên social DB, REST list/mark-read, v1 notification types, `notification:new` sau persist.
- ✓ **Phase 6 — SOCK-01…03:** Identity từ JWT; rooms `user:` + `chat:`; persist-then-emit cho tin nhắn và read; typing + presence.
- ✓ **Phase 7 — QUAL-01, QUAL-02:** Vitest + `npm test`; smoke HTTP (auth verify-email, friends, chat text); socket JWT + `chat:subscribe` + `presence:chat`; `07-VERIFICATION.md` + bảng Resolved trong `CONCERNS.md` (phạm vi socket identity + persist/emit trên path đã ship). CI tự động **ngoài** DoD phase 7 (D-07).

### Active

*(Trống — chờ milestone tiếp theo.)* Định hướng ứng viên từ **Out of Scope / deferred** trong archive requirements v1.0: moderation, feed ranking, email/push notification — sẽ được chọn khi chạy `/gsd-new-milestone`.

### Out of Scope

- Moderation / report user-post-comment — **không v1**
- Tương thích frontend/API cũ (PingMe hay bản cũ) — **không**; FE thiết kế lại
- Mongoose cho chat; Cloudinary; microservice/port tách cho chat
- Setting “chặt tin nhắn từ người lạ” — **bỏ** (redundant với rule chỉ chat khi đã bạn)
- Feed ranking / thuật toán phức tạp — **sau v1**

## Context

- **Tham chiếu hành vi chat:** `/Users/dolong/Documents/ReactJS/pingme/backend` — vẫn có thể tham khảo cho UX; contract hiện tại là **HTTP-first chat + DB notification inbox + Socket.IO** đã ship trong v1.0.
- Codebase map: `.planning/codebase/*`.
- Env: **`DATABASE_CHAT_NAME`** bắt buộc giống `.env.example`; tag git **`v1.0`** đánh dấu snapshot milestone.

## Constraints

- **Tech stack:** Giữ TypeScript, Express 5, Mongo native driver, Redis/BullMQ/S3/SES như hiện tại — không nhập Mongoose cho scope chat.
- **URL:** Không thêm segment `chat` vào path; giữ pattern `/api/auth`, `/api/users`, …
- **Process:** Một app, một server HTTP; chat module chỉ tách **code + database**.
- **Dữ liệu followers:** Đã drop trong v1.0 (không migration follow → friend).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Friends thay followers + drop data cũ | Đồng bộ social graph với chat (chỉ bạn mới chat); đơn giản hóa migration | ✓ v1.0 Phase 2: graph + APIs; follower code removed |
| Chat DB riêng `DATABASE_CHAT_NAME` | Tách bounded context, backup/scale độc lập; cùng cluster | ✓ v1.0 Phase 1 + 4: env + chat collections/indexes |
| Notifications: DB + REST + socket emit | Inbox đáng tin + realtime; vượt mức PingMe | ✓ v1.0 Phase 5 |
| Post defaults: public + stranger comments allowed | Giảm ma sát UX; user chỉnh từng bài | ✓ v1.0 Phase 3 |
| Block ẩn post lẫn nhau + unfriend | Rõ ràng về quyền riêng tư | ✓ Phase 2–4 (feed, engagement, profile D-10, redaction D-11) |
| Không DM trước khi bạn | Giảm spam/abuse | ✓ v1.0 Phase 4 chat eligibility |
| Replace socket + conversations thử nghiệm | Loại bỏ luồng test; align production chat | ✓ v1.0 Phase 4 HTTP + Phase 6 Socket.IO |

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

*Last updated: 2026-03-23 after v1.0 milestone complete (archive + tag v1.0)*
