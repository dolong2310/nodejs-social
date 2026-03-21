# Phase 2: Friends graph & privacy — Context

**Gathered:** 2026-03-21  
**Status:** Ready for planning  
**Source:** `/gsd-discuss-phase 2` — user chọn **all** gray areas; các quyết định dưới đây là **defaults khuyến nghị** đã khóa để research/planner không phải hỏi lại.

<domain>
## Phase Boundary

Thay **toàn bộ** followers (API + persistence + index liên quan) bằng **friends hai chiều** (gửi / chấp nhận / từ chối / thu hồi), **danh sách bạn** và **lời mời đã gửi–đã nhận**, **unfriend**, **block / unblock** với auto-unfriend, **giới hạn ~100 lời mời gửi đi mỗi user mỗi ngày** (cơ chế cụ thể đã chọn bên dưới). **Không** sửa feed/visibility post trong phase này (Phase 3) ngoài việc **cung cấp dữ liệu block + friend** để phase sau dùng. **Không** inbox notification đầy đủ (Phase 5) — chỉ có thể chừa hook hoặc TODO nếu planner thấy cần.

</domain>

<decisions>
## Implementation Decisions

### 1. REST paths & naming (thay `/api/followers`)

- **D-01:** **Gỡ hẳn** mount `/api/followers` và mọi route/controller/service/repository/schema/index Mongo dùng cho follower **theo INFR-02**. Không giữ path cũ với semantics mới (tránh nhầm lẫn Swagger/client).
- **D-02:** Namespace mới **`/api/friends`** cho: danh sách bạn, lời mời (gửi/nhận), gửi / chấp nhận / từ chối / thu hồi lời mời, unfriend. Hình thức path con (ví dụ `/requests`, `/:userId`) để **planner** chi tiết hóa nhưng **không** dùng lại `/followers`.
- **D-03:** **`/api/blocks`** (hoặc tên số ít tương đương) cho **block**, **unblock**, và (nếu cần UI) **danh sách đã chặn** — tách resource để policy block rõ khỏi friend graph.

### 2. Hình dạng dữ liệu friendship

- **D-04:** Quan hệ **đã là bạn** là **một document vô hướng** trên **social DB**: hai trường `userIdLow`, `userIdHigh` (ObjectId, **luôn sort** `userIdLow < userIdHigh`), thêm `createdAt`. **Unique** trên `(userIdLow, userIdHigh)`.
- **D-05:** Lời mời là **có hướng**: `fromUserId`, `toUserId`, `createdAt`. Trạng thái chỉ cần **pending** trong DB; khi accept → tạo friendship + **xóa** request; khi decline hoặc revoke → **xóa** request (**không** lưu bản ghi declined lâu dài trong v1).
- **D-06:** Tối đa **một** request **pending** cho cặp có hướng `(fromUserId, toUserId)` — enforce bằng unique index (hoặc tương đương) trên pending.

### 3. FRND-05 — Giới hạn ~100 lời mời gửi / ngày

- **D-07:** Đếm theo **ngày lịch UTC** (00:00–23:59:59.999 UTC): mỗi `fromUserId` tối đa **100** request **tạo mới** (POST gửi lời mời) trong ngày UTC hiện tại. **Ghi rõ** trong comment code + OpenAPI/behavior doc để tránh nhầm múi giờ.
- **D-08:** Chấp nhận sai số “~100” theo REQUIREMENTS; không cần rolling window trừ khi sau này đổi có chủ đích.

### 4. Vòng đời lời mời (edge cases)

- **D-09:** Sau **từ chối** hoặc **thu hồi**, người gửi **được phép gửi lại** (vẫn áp cap ngày và rule duplicate pending).
- **D-10:** Nếu đã **friends**: từ chối gửi thêm lời mời cùng chiều (409 hoặc 400 có message rõ).
- **D-11:** **Không** gửi lời mời tới chính mình (400).
- **D-12:** Nếu tồn tại quan hệ **block** (theo D-16): **không** gửi và **không** nhận xử lý lời mời giữa cặp đó (kỳ vọng 403/404 tùy policy — planner chọn mã nhất quán).

### 5. Lưu trữ block (BLCK)

- **D-13:** Collection riêng **`blocks`** trên **social DB** (cùng `DatabaseService` hiện tại, **không** chat DB): `blockerId`, `blockedId`, `createdAt`. Unique `(blockerId, blockedId)`.
- **D-14:** **Block** ⇒ nếu đang friends thì **xóa** friendship (normalized pair) + **xóa mọi friend request pending** liên quan hai user (cả hai chiều) để trạng thái sạch.
- **D-15:** **Unblock** ⇒ xóa document block; không tự tạo lại friendship.
- **D-16:** Phase 2 **cung cấp** API + repository để Phase 3 filter “có block hai chiều thì không thấy post của nhau”; **implement filter post** trong Phase 3, không bắt buộc trong Phase 2 ngoài chỗ cần thiết để test block API.

### Claude's Discretion

- Chi tiết đường dẫn con dưới `/api/friends`, mã HTTP cụ thể từng endpoint, DTO field names, pagination (cursor vs skip), và cách đếm cap ngày (query count vs counter doc) — miễn khớp D-07 và unique/pending rules.
- Có hay không **soft** response 404 vs 403 khi block — chọn một convention nhất quán toàn API.

</decisions>

<specifics>
## Specific Ideas

- User chọn **all** mà không chỉnh từng câu hỏi — defaults ưu tiên: **rõ ràng cho FE mới**, **Mongo index đơn giản**, **UTC cho cap**, **xóa request khi decline/revoke** để tránh schema phức tạp.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & requirements

- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, requirement IDs.
- `.planning/REQUIREMENTS.md` — INFR-02, FRND-01 … FRND-06, BLCK-01 … BLCK-03.
- `.planning/PROJECT.md` — Drop followers, block ẩn cả public post (hiệu lực read path Phase 3).

### Code thay thế / gỡ

- `src/routes/followers.route.ts`, `src/controllers/followers.controller.ts`, `src/services/followers.service.ts`, `src/repositories/follower.repository.ts`, `src/models/schemas/follower.schema.ts`
- `src/app.ts` — đăng ký router followers
- `src/container/index.ts` — wiring followers
- `src/database/mongodb/database.service.ts` — `followers` collection + `createFollowersIndex`
- `scripts/fake-data.ts` — `followMultipleUsers` / follower usage
- Các chỗ còn `EPostAudience.FOLLOWERS` / logic “followers” trong post — **Phase 3** đổi semantic; Phase 2 ghi nhận nợ nếu chạm khi gỡ follower.

### Rủi ro đã biết

- `.planning/codebase/CONCERNS.md` — không mở scope socket; chỉ đừng phá auth pattern hiện có.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **Layering:** `BaseRoute` + `Container` + `protect` + validation giống followers hiện tại — nhân bản pattern cho friends/blocks services và repositories.
- **Mongo:** native driver, collection getters trên `DatabaseService` — thêm collection mới + `initializeIndexes()` cho `friendships`, `friendRequests`, `blocks` (và gỡ followers index).

### Established patterns

- ObjectId trong schema types; `asyncHandler`; rate limit `appLimiter` trên route mutating.

### Integration points

- `createApp` / routes setup: thay followers bằng friends + blocks.
- **Search / các service** import follower logic — cần rà soát `search.service.ts`, `posts` nếu filter theo follower (sửa tối thiểu hoặc đánh dấu TODO Phase 3).

</code_context>

<deferred>
## Deferred Ideas

- **Đổi enum / audience `followers` → `friends-only` trên post** và mọi read path feed — **Phase 3** (POST-*, FEED-*, ENGA-*).
- **Notification `friend_request` / `friend_accepted`** persist + REST + socket — **Phase 5**; Phase 2 có thể chỉ chuẩn bị idempotency hooks nếu planner muốn.
- **Rate limit ngoài cap 100/ngày** (per-IP, abuse) — không v1 trừ khi thêm phase sau.

</deferred>

---

*Phase: 02-friends-graph-privacy*  
*Context gathered: 2026-03-21 (discuss-phase, all areas → locked defaults)*
