---
phase: 01
slug: chat-database-foundation
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-21
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — Phase 7 (QUAL-02) adds test runner |
| **Config file** | n/a |
| **Quick run command** | `npx tsc --noEmit` (or project `npm run build` if defined) |
| **Full suite command** | same as quick until Vitest exists |
| **Estimated runtime** | ~30–60 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick typecheck
- **After every plan wave:** Run quick typecheck + manual server boot smoke (if env available)
- **Before `/gsd-verify-work`:** Typecheck green; manual dual-DB log check documented in UAT
- **Max feedback latency:** 120 seconds (includes optional local Mongo)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFR-03 | grep + tsc | `rg DATABASE_CHAT_NAME src/config/envConfig.ts` + `npx tsc --noEmit` | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | INFR-01 | grep + tsc | `rg chatDb\|getChatDb\|DATABASE_CHAT_NAME src/database` + `npx tsc --noEmit` | ✅ | ⬜ pending |
| 01-01-03 | 01 | 1 | INFR-01, INFR-03 | manual | Start app with Mongo; logs show both DB names | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure: TypeScript compiler as compile-time gate; no new test framework in Phase 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Both DBs ping on startup | INFR-01 | Needs live Mongo | Set `DATABASE_URI`, `DATABASE_NAME`, `DATABASE_CHAT_NAME` in `.env.development`; run `npm run dev` (or start script); confirm log lines reference social + chat DB connect success |
| Fail-fast on bad chat DB | D-01 (CONTEXT) | Needs misconfiguration | Temporarily set invalid `DATABASE_CHAT_NAME` or block network; expect process exit non-zero and error log |

*If none: "All phase behaviors have automated verification."* — **Not applicable:** connectivity requires Mongo.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
