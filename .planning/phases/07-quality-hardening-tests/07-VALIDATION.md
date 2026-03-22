---
phase: 07
slug: quality-hardening-tests
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` (Wave 1 — add if not present) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30–120 seconds (integration + Mongo/Redis) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-* | 01 | 1 | QUAL-02 | integration | `npm test` | ❌ W0 | ⬜ pending |
| 07-02-* | 02 | 2 | QUAL-02 | integration (socket) | `npm test` | ❌ W0 | ⬜ pending |
| 07-03-* | 03 | 2–3 | QUAL-01 | doc + grep audit | `npm test` + manual checklist | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `supertest` + `@types/supertest` — install
- [ ] `vitest.config.ts` — `@/*` alias aligned with `tsconfig.json`
- [ ] `tests/integration/` — smoke + socket harness stubs (filled in Wave 1+)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|---------------|------------|-------------------|
| CONCERNS narrative accuracy | QUAL-01 | Human reads Resolved vs code | Open `07-VERIFICATION.md` + `CONCERNS.md` after executor finishes |

*Automated: smoke + socket subscribe cover implemented paths.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags in CI-facing scripts (local watch optional)
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
