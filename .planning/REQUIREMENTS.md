# Requirements: nodejs-social (v1 evolution)

**Defined:** 2026-03-21  
**Core Value:** Người dùng kết bạn tin cậy, xem feed và tương tác đúng quyền, và nhắn tin (1-1 hoặc nhóm) ổn định có lịch sử và thông báo — một API thống nhất.

## v1 Requirements

### Infrastructure & data

- [x] **INFR-01**: Ứng dụng đọc `DATABASE_CHAT_NAME` và kết nối MongoDB **cùng cluster**, database chat tách khỏi database social chính (hai `Db` từ cùng client hoặc tương đương an toàn).
- [x] **INFR-02**: Loại bỏ dữ liệu và API **followers** cũ theo quyết định drop (collection/indexes/routes liên quan được gỡ hoặc thay thế, không migration follow → friend).
- [x] **INFR-03**: Biến môi trường và `envConfig` cập nhật tài liệu/example cho `DATABASE_CHAT_NAME`.

### Friends & requests

- [x] **FRND-01**: User có thể gửi **lời mời kết bạn** tới user khác (không gửi cho chính mình; chống trùng trạng thái hợp lệ).
- [x] **FRND-02**: User nhận có thể **chấp nhận** lời mời; tạo quan hệ bạn bè hai chiều ổn định (chuẩn hóa cặp id nếu cần).
- [x] **FRND-03**: User nhận có thể **từ chối**; người gửi có thể **thu hồi** lời mời đang chờ.
- [x] **FRND-04**: User có thể xem danh sách **bạn** và danh sách lời mời **đã gửi / đã nhận** (populate tối thiểu cho UI).
- [x] **FRND-05**: Giới hạn **~100** lời mời gửi đi **mỗi user mỗi ngày** (rolling hoặc calendar day — ghi rõ trong triển khai).
- [x] **FRND-06**: User có thể **hủy kết bạn** (unfriend).

### Block

- [x] **BLCK-01**: User có thể **chặn** user khác; chặn ⇒ **tự động hủy kết bạn** nếu đang là bạn.
- [x] **BLCK-02**: Khi A chặn B (hoặc ngược lại), **cả hai không còn thấy post của nhau** trong mọi luồng đọc (kể cả post `public`), **trừ** khi viewer **đã từng có engagement** trên **post đó** (like, bookmark, hoặc đã comment trên post đó): khi đó nội dung post/thread vẫn có thể đọc được nhưng **danh tính author** (và payload user gắn author) được **redact** thành **unknown user** (Phase 4 / 04-CONTEXT D-11). **Profile** user đối phương khi có block hai chiều: **403** (D-10).
- [x] **BLCK-03**: User có thể **bỏ chặn** (nếu v1 có endpoint; nếu không thì ghi vào Out of Scope — mặc định v1 **có** bỏ chặn để tránh dead-end).

### Posts — visibility & defaults

- [x] **POST-01**: Mỗi post có **visibility**: `public` | `friends-only` | `only-me`.
- [x] **POST-02**: Post mới mặc định **public** và field **cho phép người lạ comment** mặc định **true**.
- [x] **POST-03**: User có thể set/đổi visibility và flag cho phép người lạ comment khi tạo/sửa post (theo rule nghiệp vụ hiện có của API post).

### Feed

- [x] **FEED-01**: Feed gồm bài **public** (toàn hệ phù hợp policy) **và** bài từ **bạn bè** (theo visibility).
- [x] **FEED-02**: Sắp xếp feed theo **`createdAt` giảm dần**; **không** rank phức tạp trong v1.

### Engagement (like, comment, bookmark)

- [x] **ENGA-01**: Người xem chỉ thấy/tương tác post khi **được phép theo visibility và block** (stranger = chưa kết bạn).
- [x] **ENGA-02**: Với post **public**: người lạ được **like** và **bookmark** nếu xem được; **comment** chỉ khi flag “cho phép người lạ comment” = true.
- [x] **ENGA-03**: Với post **friends-only** / **only-me**: chỉ audience hợp lệ mới xem/tương tác (theo rule đã thống nhất).

### Chat (HTTP) — chat database

- [ ] **CHAT-01**: Chỉ **bạn bè** mới mở được **hội thoại trực tiếp** (không DM người lạ).
- [ ] **CHAT-02**: User có thể tạo **nhóm chat** với nhiều bạn; **cho phép nhóm 2 người**; thành viên phải là bạn của người tạo (theo rule đã thống nhất).
- [ ] **CHAT-03**: API **tin nhắn** và **hội thoại** thay thế luồng `/api/conversations` thử nghiệm: tạo/liệt kê hội thoại, gửi tin, đọc lịch sử có phân trang/cursor, đánh dấu đã xem khi có tin nhắn cuối từ người khác.
- [ ] **CHAT-04**: Upload ảnh/file chat (nếu v1 có) dùng **S3** và auth hiện tại — **không** Cloudinary.

### Realtime (Socket.IO)

- [ ] **SOCK-01**: **Thay thế** toàn bộ luồng socket hiện tại phục vụ chat: auth từ token đã có; **identity sender chỉ từ JWT**, không tin field client.
- [ ] **SOCK-02**: Join room theo **conversation** và room theo **userId** cho sự kiện cá nhân; **online-users** (hoặc tương đương) nhất quán.
- [ ] **SOCK-03**: **Ghi DB trước**, emit sau cho tin nhắn và trạng thái đọc (persist-then-emit).

### Notifications

- [ ] **NOTF-01**: Lưu **notification** trên DB (social DB), có REST: **list** (phân trang), **đánh dấu đã đọc** (từng item hoặc batch — tối thiểu cho v1).
- [ ] **NOTF-02**: Các type v1 tối thiểu: `friend_request`, `friend_accepted`, `new_message`, `added_to_group`; schema **mở rộng** được.
- [ ] **NOTF-03**: Khi tạo notification, **emit Socket.IO** tới user nhận đồng bộ với inbox.

### Quality & testing

- [ ] **QUAL-01**: Sửa các lỗ hổng đã biết trong `.planning/codebase/CONCERNS.md` liên quan tới **socket identity** và **persist/emit** trên đường triển khai chat.
- [ ] **QUAL-02**: Thêm **test runner** và smoke tests cho luồng auth + một luồng friend hoặc chat tối thiểu (theo research STACK).

## v2 Requirements

### Moderation

- **MODR-01**: Báo cáo user/post/comment — **deferred** (Out of scope v1).

### Feed

- **FEED-R01**: Ranking / cá nhân hóa feed — **deferred**.

### Notifications

- **NOTF-R01**: Email/push mobile — **deferred**.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Moderation / report | Không v1 theo PROJECT.md |
| Parity API/FE PingMe | FE thiết kế lại; contract mới |
| Mongoose / Cloudinary / chat microservice | Constraint tech & kiến trúc |
| Feed ranking nâng cao | Sau v1 |
| Setting chặn tin người lạ (redundant) | Đã bỏ — chỉ chat khi đã bạn |

## Traceability

Which phases cover which requirements — cập nhật khi `ROADMAP.md` được tạo.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 2 | Complete |
| INFR-03 | Phase 1 | Complete |
| FRND-01 | Phase 2 | Complete |
| FRND-02 | Phase 2 | Complete |
| FRND-03 | Phase 2 | Complete |
| FRND-04 | Phase 2 | Complete |
| FRND-05 | Phase 2 | Complete |
| FRND-06 | Phase 2 | Complete |
| BLCK-01 | Phase 2 | Complete |
| BLCK-02 | Phase 2 | Complete |
| BLCK-03 | Phase 2 | Complete |
| POST-01 | Phase 3 | Complete |
| POST-02 | Phase 3 | Complete |
| POST-03 | Phase 3 | Complete |
| FEED-01 | Phase 3 | Complete |
| FEED-02 | Phase 3 | Complete |
| ENGA-01 | Phase 3 | Complete |
| ENGA-02 | Phase 3 | Complete |
| ENGA-03 | Phase 3 | Complete |
| CHAT-01 | Phase 4 | Pending |
| CHAT-02 | Phase 4 | Pending |
| CHAT-03 | Phase 4 | Pending |
| CHAT-04 | Phase 4 | Pending |
| SOCK-01 | Phase 6 | Pending |
| SOCK-02 | Phase 6 | Pending |
| SOCK-03 | Phase 6 | Pending |
| NOTF-01 | Phase 5 | Pending |
| NOTF-02 | Phase 5 | Pending |
| NOTF-03 | Phase 5 | Pending |
| QUAL-01 | Phase 7 | Pending |
| QUAL-02 | Phase 7 | Pending |

**Coverage:**

- v1 requirements: **32** total
- Mapped to phases: **32**
- Unmapped: **0**

---

*Requirements defined: 2026-03-21*  
*Last updated: 2026-03-21 after ROADMAP traceability (32 v1 requirements mapped to 7 phases)*
