# Phase 3: Posts, feed & engagement — Context

**Gathered:** 2026-03-21  
**Status:** Ready for planning  
**Source:** User decisions sau `/gsd-discuss-phase 3` (trả lời trực tiếp; không qua từng vòng hỏi UI).

<domain>
## Phase Boundary

Bài viết có **visibility** `public` | `friends-only` | `only-me`; mặc định tạo mới theo REQUIREMENTS; field **allowStrangerComments** theo quyết định dưới đây. **Home feed** gộp bài public (policy) và bài từ bạn bè theo visibility; sort **`createdAt` giảm dần**; không rank v1. **Like, comment, bookmark** dùng **một ma trận quyền** thống nhất với visibility + **block hai chiều** (BLCK-02) trên mọi read/mutation path. **Không** mở scope chat, notification đầy đủ, hay Swagger hoàn chỉnh trong phase này nếu không cần cho implementation — user ghi nhận Swagger tinh chỉnh có thể dồn **phase cuối**; **FE không là ràng buộc** (build FE mới sau).

</domain>

<decisions>
## Implementation Decisions

### 1. API & persistence — visibility literals

- **D-01:** Client/API (JSON, validation, OpenAPI khi cập nhật) dùng literal **`public`**, **`friends-only`**, **`only-me`**. **Bỏ hẳn** giá trị / tên **`followers`** trong contract và trong DB going forward.
- **D-02:** Database có thể **drop dữ liệu cũ** — **không** bắt buộc migration từ `followers` → `friends-only`; làm mới enum/string lưu Mongo cho `audience` (và mọi chỗ liên quan) cho khớp D-01.

### 2. Home feed — guest vs authenticated (verification)

- **D-03:** **Guest (không đăng nhập)** có thể gọi **home feed** và chỉ thấy post **`public`** (vẫn áp filter **block** không áp dụng cho guest theo user-user block — hoặc chỉ ẩn nội dung theo rule kỹ thuật đã thống nhất: block là giữa hai user; guest không có user id thì không có cặp block — **planner** làm rõ query).
- **D-04:** User **đã verify** (`EUserVerificationStatus.VERIFIED`): được **xem** post theo visibility + block; được **like** và **bookmark** khi được phép xem; được **comment** khi được phép xem **và** (với post public) **`allowStrangerComments`** cho phép nếu người comment là “stranger”, theo ENGA-02.
- **D-05:** User **chưa verify** (đã đăng nhập nhưng không verified): **chỉ được xem** post (theo visibility + block); **không** like, **không** comment, **không** bookmark — các endpoint đó trả **403** với message rõ (đồng bộ với D-08).

### 3. Field `allowStrangerComments`

- **D-06:** Tên field: **`allowStrangerComments`** (boolean). **Bắt buộc** có trong body khi **create** post. **Bắt buộc** gửi trong body khi **PATCH** update post (partial update không được omit field này — nếu planner chọn “replace toàn bộ resource trên PATCH” thì vẫn phải có field trong contract; mặc định user muốn **luôn gửi explicit** trên PATCH).

### 4. Lỗi khi không đủ quyền xem / tương tác

- **D-07:** Dùng **HTTP 403** với **một message rõ ràng** (message constant hoặc i18n key thống nhất) khi không được xem post hoặc không được like/comment/bookmark — **không** dùng 404 để che existence trong phase này (user chọn explicit).

### 5. Swagger / FE

- **D-08:** **Swagger** chi tiết cho guest vs verified có thể **hoãn tinh chỉnh** tới **phase cuối** nếu không chặn implement; tối thiểu phase 3 vẫn có thể cập nhật paths/schemas cần thiết cho dev — **Claude's discretion** mức độ cập nhật OpenAPI trong phase 3.
- **D-09:** **Không** coi FE hiện tại là ràng buộc; contract hướng tới **client mới**.

### Claude's Discretion

- Cách triển khai query feed (một hay nhiều aggregation stage), pagination (cursor/skip) miễn khớp FEED-02 và performance hợp lý.
- Cách inject **block list** (`listUserIdsBlockedInEitherDirection` / tương đương) vào post list vs single get — một lớp service chung hay repository; miễn mọi read path và engagement path áp BLCK-02.
- Message string cụ thể cho từng 403 (constants trong `message.constant.ts` hoặc tương đương).
- Guest feed: có cho phép xem **only-me** / **friends-only** của ai đó không — **không** (chỉ public cho guest), trừ khi conflict — mặc định **chỉ public**.

</decisions>

<specifics>
## Specific Ideas

- Làm mới DB; không cần tương thích giá trị `followers` trong collection posts.
- Unverified user: read-only social consumption (xem feed/post hợp lệ), không tương tác.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & requirements

- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, requirement IDs POST-*, FEED-*, ENGA-*.
- `.planning/REQUIREMENTS.md` — POST-01…03, FEED-01…02, ENGA-01…03; BLCK-02 (read path).
- `.planning/PROJECT.md` — Defaults post, block ẩn post, feed.

### Prior phase (graph & block)

- `.planning/phases/02-friends-graph-privacy/02-CONTEXT.md` — D-16 block filter deferred to Phase 3; repository helpers.

### Code touchpoints (scout)

- `src/enums/posts.enum.ts` — `EPostAudience` (đổi giá trị/string).
- `src/models/schemas/post.schema.ts`, `src/repositories/post.repository.ts`, `src/validations/posts.validation.ts`, `src/controllers/posts.controller.ts`, `src/services/posts.service.ts` (nếu có).
- `src/repositories/search.repository.ts` — audience filters.
- `src/repositories/block.repository.ts` — `isBlockedEitherWay`, `listUserIdsBlockedInEitherDirection`.
- `src/services/friends.service.ts` — mutual friends cho feed friends-only branch.

### Risk / quality

- `.planning/codebase/CONCERNS.md` — không mở scope ngoài phase; tránh regress auth.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- Post schema đã có `audience`; enum hiện dùng `FOLLOWERS = 'followers'` — cần thay bằng `friends-only` (hoặc enum key mới map tới literal đúng).
- `FriendsService` / `BlockRepository` đã có sau Phase 2.

### Established patterns

- Layer route → validation → controller → service → repository; `asyncHandler`; ObjectId trong Mongo.

### Integration points

- `app.ts` routes posts; middleware `protect` optional cho guest feed vs protected mutations.
- Verification check: `EUserVerificationStatus` trên user từ JWT/session.

</code_context>

<deferred>
## Deferred Ideas

- Swagger polish toàn diện — user: phase cuối nếu không quan trọng cho dev ngay.
- Feed ranking / personalization — v2 (FEED-R01).

</deferred>

---

*Phase: 03-posts-feed-engagement*  
*Context gathered: 2026-03-21*
