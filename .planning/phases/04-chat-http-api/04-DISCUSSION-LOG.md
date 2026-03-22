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
| Kick | Admin kick manager + member; manager kick member |
| Admin | Creator = admin đầu; quyền cao nhất; kick; hạ manager → member; chuyển admin |
| Manager | Sửa tên/ảnh/settings (cùng admin); kick member |
| Member | Không sửa metadata nhóm |
| Settings nhóm mở rộng | Mới nghĩ, chưa plan — defer |

**Notes:** Sau chuyển admin, role admin cũ → mặc định manager trong CONTEXT (discretion).

---

## 3. Block: chat, history, post/profile

| Hành vi | Ghi nhận |
|---------|-----------|
| Tương tác / gửi | Không |
| B xem history chat với A | Có (read-only) |
| B xem user info / post A | Không như bình thường |
| Post A mà B đã tương tác | Vẫn hiện; danh tính A → **unknown user** |

**Notes:** Cần align với BLCK-02 Phase 3 — ghi trong CONTEXT là mở / cần xác nhận.

---

## 4. Read, history, media

| Hạng mục | Ghi nhận |
|----------|-----------|
| Mark read | PATCH rõ ràng |
| History | Cursor pagination |
| Media | Ảnh + file, 5MB (v1), S3/auth giống post |

---

## Backlog (ngoài Phase 4)

- Reaction, sửa tin, xóa tin — user đề xuất; defer.

---

## Claude's Discretion (từ CONTEXT)

- Role admin cũ sau transfer; schema/cursor/HTTP chi tiết; “unknown user” shape API.
