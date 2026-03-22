# Phase 7: Quality hardening & tests — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `07-CONTEXT.md`.

**Date:** 2026-03-23  
**Phase:** 7 — Quality hardening & tests  
**Areas discussed:** (1) Smoke integration scope, (2) Socket automated tests, (3) CONCERNS evidence artifacts, (4) Local vs CI gate

---

## Selection step

| Input | Meaning |
|--------|---------|
| User reply `1,2,3,4` | Chọn thảo luận **cả bốn** gray area đã trình bày ở bước discuss-phase. |

---

## Area 1 — Smoke integration (QUAL-02)

| Topic | Resolution |
|--------|------------|
| Luồng nghiệp vụ | **Cả friend lẫn chat HTTP** tối thiểu (text-only chat; không bắt S3 trong smoke đầu). |
| Auth | Auth smoke + ít nhất một request có Bearer; chi tiết seed vs register do planner. |
| vs REQUIREMENTS “một trong hai” | **Vượt tối thiểu** có chủ đích sau khi user chọn đủ các mục liên quan coverage. |

---

## Area 2 — Socket trong suite

| Topic | Resolution |
|--------|------------|
| Có test socket tự động? | **Có** — tối thiểu: connect JWT + join room conversation hợp lệ. |
| Assert event | **Stretch** (vd. sau HTTP persist) — không bắt buộc smoke đầu nếu flaky. |

---

## Area 3 — Bằng chứng QUAL-01

| Topic | Resolution |
|--------|------------|
| Artifacts | **`07-VERIFICATION.md` + cập nhật `CONCERNS.md`** với trạng thái resolved/verified và tham chiếu. |

---

## Area 4 — Cổng merge

| Topic | Resolution |
|--------|------------|
| DoD phase 7 | **`npm test` chạy local** với env được tài liệu hóa. |
| CI | **Không** bắt buộc trong phase 7 — deferred. |

---

## Claude's Discretion

Vitest wiring, supertest vs fetch, DB tên test, timeouts, parallel — xem `07-CONTEXT.md`.

## Deferred Ideas

CI bắt buộc; mở rộng CONCERNS ngoài scope QUAL-01 — xem `<deferred>` trong CONTEXT.
