# Phase 6: Realtime (Socket.IO) — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `06-CONTEXT.md`.

**Date:** 2026-03-23  
**Phase:** 6 — Realtime (Socket.IO)  
**Areas discussed:** Presence & online; Multi-device & read sync; Client event contract; Typing

---

## Mục 1 — Presence & online

| Topic | User input / resolution |
|--------|-------------------------|
| Câu 1 — Định nghĩa online | **a)** Socket auth = online; disconnect = offline; không last seen v1. |
| Câu 2 — Ai thấy ai | Đổi từ (a) sang **(c):** bạn bè mutual → presence global; không mutual → không pairwise friend-rail; trong conversation (nhóm) dùng aggregate (≥1 online). Giải thích: nhóm Phase 4 có thể có cặp không mutual friends. |
| Câu 3 — UX direct/group/feed | Direct: online/offline đối phương. Group: tick xanh nếu ≥1 member online. Feed cột phải: conversations đã có + group, **recent**, placeholder nếu chưa chat. |
| Follow-up sidebar | Thứ tự **recent**; group cùng quy tắc tick. |
| Câu 4 — Unverified/banned | Không socket, không presence; API 403 nếu cố. |

---

## Mục 2 — Multi-device & read

| # | Question | Selected |
|---|----------|----------|
| 1 | Mọi socket cùng user nhận sự kiện? | **a)** Có |
| 2 | Gửi tin | **a)** Chỉ REST; socket chỉ delivery sau persist |
| 3 | Read PATCH → emit cho người khác? | **a)** Có |
| 4 | Đồng bộ tab cùng user | **a)** Có |

---

## Mục 3 — Event contract

| # | Question | Selected |
|---|----------|----------|
| 1 | Legacy send/receive | **a)** Xóa; breaking; contract mới `conversationId` + gần REST |
| 2 | Tên event tin mới | **a)** Một tên chung DM + group |
| 3 | Payload message | **a)** Full như HTTP response |
| 4 | `notification:new` | **b)** Cho phép planner đổi nếu cần; chấp nhận breaking inbox |

---

## Mục 4 — Typing

| # | Question | Selected |
|---|----------|----------|
| 1 | Trong scope Phase 6? | **a)** Có |
| 2 | Persist DB? | **a)** Không — ephemeral socket only |

---

## Claude's Discretion

- Chi tiết tên event, room id, implementation fan-out đa socket (thay `Map` một socket/user).

## Deferred Ideas

- Last seen; typing DB — không v1.
