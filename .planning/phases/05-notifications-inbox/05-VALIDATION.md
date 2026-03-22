---
phase: 05
slug: notifications-inbox
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none in repo yet — Phase 7 (QUAL-02) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30–60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Build green + manual UAT per 05-RESEARCH.md
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | NOTF-02 | build | `npm run build` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | NOTF-01, NOTF-02 | build | `npm run build` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 2 | NOTF-01 | build | `npm run build` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | NOTF-01 | build + grep swagger | `npm run build` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 3 | NOTF-03 | build | `npm run build` | ✅ | ⬜ pending |
| 05-03-02 | 03 | 3 | NOTF-02, D-13–D-15 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] *Không bắt buộc Wave 0 — test runner thuộc Phase 7.*

*Existing infrastructure: TypeScript build only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Inbox list + cursor + unreadOnly | NOTF-01 | No API test harness | Gọi GET với JWT; lặp cursor |
| Mark read single / batch / all | NOTF-01 | Same | PATCH endpoints |
| Persist-then-emit socket | NOTF-03 | Socket client | Gửi friend request; lắng `notification:new` |
| Block: không notify + list ẩn | D-13–D-14 | Multi-user | Hai user block; thử gửi tin / list |

*If none: "All phase behaviors have automated verification."* → **Không áp dụng** (có manual).

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
