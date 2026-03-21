# Phase 2: Friends graph & privacy — Discussion Log

> **Audit trail only.** Decisions chính thức nằm trong `02-CONTEXT.md`.

**Date:** 2026-03-21  
**Phase:** 02-friends-graph-privacy  
**Areas discussed:** REST paths, friendship shape, daily cap, request lifecycle, block storage  

---

## 1. REST paths & naming

| Option | Description | Selected |
|--------|-------------|----------|
| A | Giữ `/api/followers`, đổi semantics | |
| B | Gỡ followers; `/api/friends` + `/api/blocks` | ✓ |

**User's choice:** `all` — áp dụng default B.  
**Notes:** FE mới, Swagger rõ; INFR-02 gỡ follower.

---

## 2. Friendship record shape

| Option | Description | Selected |
|--------|-------------|----------|
| A | Hai edge có hướng per friendship | |
| B | Một doc vô hướng `userIdLow`/`userIdHigh` + request riêng có hướng | ✓ |

**User's choice:** default B.  
**Notes:** Unique pair; request chỉ pending trong DB.

---

## 3. FRND-05 daily cap

| Option | Description | Selected |
|--------|-------------|----------|
| A | Rolling 24h | |
| B | Calendar day UTC | ✓ |

**User's choice:** default B.  
**Notes:** Dễ doc/query; ~100 theo REQUIREMENTS.

---

## 4. Request lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| A | Lưu declined lâu dài | |
| B | Xóa request khi decline/revoke; cho gửi lại (trong cap) | ✓ |

**User's choice:** default B.

---

## 5. Block storage

| Option | Description | Selected |
|--------|-------------|----------|
| A | Embed trên user document | |
| B | Collection `blocks` + unique (blocker, blocked) | ✓ |

**User's choice:** default B.  
**Notes:** Social DB; Phase 3 dùng cho filter post.

---

## Claude's Discretion

- HTTP codes chi tiết, tên path con, pagination, cách implement đếm UTC.

## Deferred Ideas

- Xem `02-CONTEXT.md` → Deferred (post audience, notifications Phase 5).
