---
status: complete
phase: 05-notifications-inbox
source:
  - 05-VALIDATION.md
  - 05-CONTEXT.md
  - ROADMAP.md (Phase 5 success criteria)
started: "2026-03-23T12:00:00.000Z"
updated: "2026-03-23T20:00:00.000Z"
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Tắt server nếu đang chạy. Khởi động lại từ đầu (`npm run dev` hoặc lệnh bạn dùng). Ứng dụng lên được, Mongo/Redis kết nối hoặc báo lỗi rõ — không treo im lặng. Một request cơ bản (ví dụ health nếu có, hoặc GET có auth) phản hồi bình thường.
result: pass

### 2. Danh sách inbox (NOTF-01)
expected: |
  Với JWT user đã xác minh, GET `/api/notifications` trả 200; body có danh sách phẳng, sắp xếp mới nhất trước (`createdAt` giảm dần). Mỗi phần tử có `type` thuộc tập v1 và có thể nhận biết trạng thái đã đọc/chưa đọc theo contract API (field hoặc flag rõ ràng).
result: pass

### 3. Phân trang cursor + unreadOnly
expected: |
  Gọi list với `limit` nhỏ (ví dụ 2–5); nếu còn trang, dùng `cursor` từ response để lấy trang tiếp — không trùng lặp id giữa hai trang. Gọi lại với `unreadOnly=true` (hoặc `1`) — chỉ thấy mục chưa đọc (sau khi bạn đã có cả đã đọc và chưa đọc trong hộp thư).
result: pass

### 4. Đánh dấu đã đọc (NOTF-01)
expected: |
  PATCH `/api/notifications/{id}/read` đánh dấu một mục; GET list sau đó phản ánh đã đọc. PATCH `/api/notifications/read` với body `ids` (mảng id) đánh dấu hàng loạt; hoặc không gửi ids / mảng rỗng nếu contract cho phép — mark tất cả chưa đọc. Response 200, thông điệp thành công hợp lý.
result: pass

### 5. Các type thông báo v1 (NOTF-02)
expected: |
  Qua API đã có (friends + chat), kích hoạt ít nhất các tình huống sau và người nhận thấy đúng `type` trong inbox: `friend_request` (nhận lời mời), `friend_accepted` (khi chấp nhận kết bạn — đúng phía nhận theo product), `new_message` (tin nhắn mới trong hội thoại), `added_to_group` (được thêm vào nhóm). Payload có text/field điều hướng và snapshot actor (displayName/avatar) đủ dùng list mà không bắt buộc gọi thêm `/users`.
result: pass

### 6. Socket persist-then-emit (NOTF-03)
expected: |
  Client Socket.IO đã đăng nhập (JWT) subscribe kênh user. Khi một notification mới được tạo (cùng luồng REST/friends/chat như production), sau khi ghi DB thành công, client nhận sự kiện realtime (tên kiểu `notification:new` hoặc tương đương đã triển khai) chứa payload nhất quán với bản ghi inbox. Không có emit “ảo” nếu DB không ghi được.
result: pass

### 7. Block và inbox (D-13–D-15)
expected: |
  Hai user A và B đang block lẫn nhau: không phát sinh notification tương tác xã hội/chat mới giữa cặp đó khi rule block áp dụng. GET inbox của mỗi bên không trả các dòng có actor/đối tượng liên quan user đang bị block hai chiều (theo behavior đã implement). Sau unblock, luồng tạo notify trở lại bình thường.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

<!-- none — automated verification: scripts/uat-notifications-smoke.ts (tests 2–7); test 1 manual / prior session -->
