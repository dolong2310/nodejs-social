---
phase: 6
slug: realtime-socket-io
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (Wave 0 — add if not present; align with Phase 7 QUAL-02) |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=dot` (once config exists) |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30–120 seconds (grows with integration harness) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot` when tests exist for touched paths
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

Phase 6 **PLAN.md** tasks use **`npm run build`** as `<automated>` verify (see `06-01` … `06-03`). This table aligns with those plans — not Vitest until Phase 7 (QUAL-02) or an explicit future wave adds a harness.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Notes |
|---------|------|------|-------------|-----------|-------------------|--------|
| 06-01-* | 01 | 1 | SOCK-01, SOCK-02 | compile | `npm run build` | per plan tasks |
| 06-02-* | 02 | 2 | SOCK-03 | compile | `npm run build` | per plan tasks |
| 06-03-* | 03 | 3 | SOCK-02 | compile | `npm run build` | per plan tasks |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 / Vitest (deferred)

- **Phase 6 plans:** no Vitest tasks — integration tests for socket auth / rooms / persist-then-emit are **Phase 7** (QUAL-02) unless you add a dedicated Wave 0 plan later.
- **Research / CONCERNS:** recommended harness = `socket.io-client` + test server; track in Phase 7 or `06-VERIFICATION.md` after execute.

*Heavy presence matrix (D-02) may be manual UAT if automated cost stays high.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Friend-list presence fan-out at scale | SOCK-02 | Load / many sockets | Two browsers + many friends fixture optional |
| Group aggregate “≥1 online” UX | D-03 | Visual | Open group as two members; verify tick |

*If automated harness covers multi-client presence, shrink this table in VERIFICATION.md after execution.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
