# Phase 7: Quality hardening & tests — Context

**Gathered:** 2026-03-23  
**Status:** Ready for planning  
**Source:** `/gsd-discuss-phase 7` — user chọn thảo luận đủ bốn mục (smoke scope, socket tests, bằng chứng CONCERNS, cổng local/CI); quyết định chi tiết chốt theo đề xuất phù hợp QUAL-01/02 và Phase 6.

<domain>
## Phase Boundary

**QUAL-01:** Đối chiếu và **đóng hoặc ghi nhận đã verify** các mục trong `.planning/codebase/CONCERNS.md` liên quan **socket identity** và **persist → emit** trên đường **chat + notification đã triển khai** (không mở rộng sang toàn bộ P2/P3 như S3 buffer, `any`, feed counters trong phase này trừ khi planner tách wave rõ).  
**QUAL-02:** Thêm **test runner** (Vitest đã được các phase trước tham chiếu) + **smoke** auth + **cả** luồng **friend** và **chat HTTP** tối thiểu (vượt tối thiểu “một trong hai” của REQUIREMENTS — có chủ đích sau khi user chọn thảo luận đủ các mục liên quan).

</domain>

<decisions>
## Implementation Decisions

### 1. Smoke integration (QUAL-02)

- **D-01:** Suite smoke **gồm cả hai** nhánh: **(a)** auth tối thiểu (đăng ký/đăng nhập hoặc seed user + lấy JWT — do planner cụ thể hóa) **và** ít nhất một **API có Bearer**; **(b)** **friend**: luồng tối thiểu có ý nghĩa (vd. gửi request + accept, hoặc tương đương đủ để chứng minh graph + guard); **(c)** **chat HTTP**: tối thiểu **text-only** (tạo/tìm direct conv giữa hai user đã bạn + gửi tin + đọc list/cursor tùy contract) — **không** bắt buộc attachment S3 trong smoke đầu.
- **D-02:** Smoke **không** nhằm coverage đầy đủ; chỉ bảo vệ regressions trên đường đi đã chọn và đáp ứng văn bản QUAL-02 + roadmap.

### 2. Socket trong automated tests

- **D-03:** Phase 7 **có** ít nhất **một** test tự động Socket.IO **tối thiểu:** client kết nối với **JWT hợp lệ**, **join** room conversation **`chat:<conversationId>`** (hoặc constant tương đương trong code) khi user là **thành viên** — align SOCK-01/02.  
- **D-04:** **Không** bắt buộc trong smoke đầu: assert mọi loại event realtime; **assert một event** sau khi HTTP persist (vd. `chat:message:new`) là **stretch tốt** nếu ổn định — do planner/executor quyết định sau probe flakiness.

### 3. Bằng chứng đóng CONCERNS (QUAL-01)

- **D-05:** Bắt buộc **hai lớp tài liệu:** **(1)** `.planning/phases/07-quality-hardening-tests/07-VERIFICATION.md` — checklist verify + tham chiếu test/commit; **(2)** cập nhật `.planning/codebase/CONCERNS.md` — ghi rõ mục nào **resolved / verified closed** trên path triển khai, ngày/phase, link tới verification hoặc test path (không xóa lịch sử; ưu tiên section “Resolved” hoặc status table).

### 4. Cổng chất lượng (local vs CI)

- **D-06:** **Definition of done** phase 7: **`npm test` (hoặc script tương đương)** chạy **thành công trên máy dev** với **hướng dẫn env** trong plan/README test (Mongo + Redis theo pattern dự án — planner chi tiết).  
- **D-07:** **CI (GitHub Actions hoặc tương đương) không nằm trong DoD phase 7**; có thể ghi **Deferred** nếu muốn làm ngay sau — tránh bloated phase 7.

### Claude's Discretion

- Cụ thể framework (Vitest + `@vitest/coverage` có hay không), supertest vs fetch, factory/seed script, timeout, parallel vs serial cho socket, tách `test` MongoDB name — miễn thỏa D-01…D-07 và không phá QUAL-01 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 7 goal, success criteria, QUAL-01/02.
- `.planning/REQUIREMENTS.md` — QUAL-01, QUAL-02 (smoke auth + friend hoặc chat; dự án chốt **cả hai** luồng trong CONTEXT này).

### Risks & prior verification

- `.planning/codebase/CONCERNS.md` — matrix + tech debt; mục tiêu đóng/verify phần socket identity + persist/emit trên path đã ship.
- `.planning/codebase/STACK.md` — Node ESM, Express, chưa có test runner tại thời điểm map.

### Prior phase context

- `.planning/phases/06-realtime-socket-io/06-CONTEXT.md` — SOCK-01…03, HTTP-only send, rooms.
- `.planning/phases/06-realtime-socket-io/06-VERIFICATION.md` — ghi nhận defer integration socket tests tới Phase 7.

### Code touchpoints (tham khảo)

- `src/app.ts`, `src/index.ts` — HTTP + Socket attach.
- `src/services/socket.service.ts` — handshake, rooms, events.
- `package.json` — thêm script `test` khi wire runner.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- Toàn bộ REST chat `/api/chats`, friends `/api/friends`, auth routes hiện có — smoke gọi trực tiếp như client.
- `DatabaseService` / `chatDb` — test cần env giống dev hoặc DB tên riêng cho test (planner).

### Established patterns

- Layering route → middleware → controller → service → repository; test nên đi qua HTTP public surface hoặc app factory nếu có refactor nhỏ cho testability.

### Integration points

- Socket.IO gắn cùng `HttpServer`; test socket client cần URL server test (cùng process hoặc listen ephemeral port).

</code_context>

<specifics>
## Specific Ideas

- User đã chọn thảo luận **đủ bốn** gray area (smoke scope, socket trong suite, tài liệu verify CONCERNS, cổng local/CI). Các dòng D-01…D-07 phản ánh đề xuất chốt; chỉnh sửa CONTEXT nếu product owner muốn thu hẹp (vd. chỉ một luồng friend/chat) hoặc bắt buộc CI.

</specifics>

<deferred>
## Deferred Ideas

- **CI bắt buộc xanh** trên mọi PR — ngoài DoD phase 7 (D-07); có thể thêm phase nhỏ hoặc backlog.
- Mở rộng CONCERNS P2 (S3 memory, `any`, feed counters) — không thuộc QUAL-01 theo roadmap; phase riêng hoặc backlog.

</deferred>

---

*Phase: 07-quality-hardening-tests*  
*Context gathered: 2026-03-23*
