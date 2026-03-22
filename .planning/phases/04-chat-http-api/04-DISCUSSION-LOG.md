# Phase 4: Chat HTTP API — Discussion Log

> **Chỉ để audit.** Không dùng làm input cho research/planner/executor. Quyết định chính thức nằm ở `04-CONTEXT.md`.

**Date:** 2026-03-22  
**Phase:** 4 — Chat HTTP API  
**Areas discussed:** 1-1 model, group roles & lifecycle, block + visibility, read/history/media, backlog features

---

## 1. Hội thoại 1-1

| Option | Mô tả | Chọn |
|--------|--------|------|
| Một thread / cặp bạn | Get-or-create cố định | ✓ |
| Nhiều thread / cặp | — | |

**User's choice:** Một hội thoại cố định cho mỗi cặp bạn.

---

## 2. Nhóm: mời, rời, admin/manager/member

| Chủ đề | Ghi nhận |
|--------|-----------|
| Mời thêm | Mọi thành viên mời được; người được mời = bạn của **người mời** và **creator** |
| Rời nhóm | Có |
| Kick | Admin kick manager + member; manager **chỉ** kick member (**không** kick manager khác) |
| Admin | Creator = admin đầu; quyền cao nhất; kick; hạ manager → member; chuyển admin |
| Manager | Sửa tên/ảnh/settings (cùng admin); kick member |
| Member | Không sửa metadata nhóm |
| Settings nhóm mở rộng | Mới nghĩ, chưa plan — defer |

**Notes:** Sau chuyển admin, admin cũ → **manager** (đã xác nhận).

---

## 3. Block: chat, history, post/profile

| Hành vi | Ghi nhận |
|---------|-----------|
| Tương tác / gửi | Không |
| B xem history chat với A | Có (read-only) |
| B xem user info / post A | Không như bình thường |
| Post A mà B đã tương tác | Vẫn hiện; danh tính A → **unknown user** |

**Notes:** User xác nhận **toàn bộ read paths**; cập nhật BLCK-02 / docs Phase 3 khi implement (xem D-11 trong CONTEXT).

---

## 4. Read, history, media

| Hạng mục | Ghi nhận |
|----------|-----------|
| Mark read | PATCH rõ ràng |
| History | Cursor pagination |
| Media | Ảnh + file; **5MB tối đa mỗi file** gửi kèm (v1), S3/auth giống post |

---

## Backlog (ngoài Phase 4)

- Reaction, sửa tin, xóa tin — user đề xuất; defer.

---

## Follow-up A–D (2026-03-22)

| ID | Câu hỏi | Trả lời |
|----|---------|---------|
| A | Phạm vi “unknown user” vs BLCK-02 | **Toàn bộ read paths** |
| B | Admin cũ sau khi trao quyền | **Manager** |
| C | 5MB là gì | **Mỗi file** user gửi (ảnh hoặc file) |
| D | Manager kick manager? | **Không**; chỉ **admin** kick manager |

## Claude's Discretion (từ CONTEXT)

- Schema/cursor/HTTP chi tiết; shape API “unknown user” cho client.
