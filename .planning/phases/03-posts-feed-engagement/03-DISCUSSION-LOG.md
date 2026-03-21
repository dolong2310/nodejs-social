# Phase 3: Posts, feed & engagement — Discussion Log

> **Audit trail only.** Không dùng làm input cho planner/executor. Quyết định chính thức: `03-CONTEXT.md`.

**Date:** 2026-03-21  
**Phase:** 3-posts-feed-engagement  
**Areas discussed:** API visibility literals; home feed guest vs verified vs unverified; allowStrangerComments; error semantics; Swagger/FE scope

---

## 1. API visibility literals

| Option | Description | Selected |
|--------|-------------|----------|
| A | Giữ `followers` trong JSON/DB | |
| B | Client mới: `public` / `friends-only` / `only-me`; bỏ `followers`; DB drop làm mới | ✓ |

**User's choice:** B — database cũ drop hết, không migration, làm mới hoàn toàn.

**Notes:** Swagger/FE không ưu tiên; FE build lại sau.

---

## 2. Home feed & verification

| Option | Description | Selected |
|--------|-------------|----------|
| A | Feed chỉ cho user đăng nhập | |
| B | Guest xem feed chỉ public; verified: xem + like + bookmark + comment (theo rule); unverified: chỉ xem, không like/comment/bookmark | ✓ |

**User's choice:** B như mô tả chi tiết trong chat.

**Notes:** Swagger tinh chỉnh có thể phase cuối.

---

## 3. allowStrangerComments

| Option | Description | Selected |
|--------|-------------|----------|
| A | Optional on create/PATCH, default server-side | |
| B | Bắt buộc trong body create và bắt buộc gửi trên PATCH | ✓ |

**User's choice:** B — field name `allowStrangerComments`.

---

## 4. Not allowed to view / interact

| Option | Description | Selected |
|--------|-------------|----------|
| A | 404 che existence | |
| B | 403 + message rõ | ✓ |

**User's choice:** B.

---

## Deferred / out of discuss scope

- Swagger hoàn chỉnh — dồn phase cuối nếu không quan trọng.
- FE cũ — không quan tâm.

---

*End of discussion log*
