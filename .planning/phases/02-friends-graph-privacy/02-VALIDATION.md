---
phase: 02
slug: friends-graph-privacy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (or Jest) + supertest — align with ESM `type: module` |
| **Config file** | `vitest.config.ts` (Wave 0 — to be added) |
| **Quick run command** | `npx vitest run` (single file) |
| **Full suite command** | `npm test` once scripted |
| **Estimated runtime** | TBD after Wave 0 (target under 120s for graph suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` on touched test files when tests exist
- **After every plan wave:** Run full `npm test` when Wave 0 is complete
- **Before `/gsd-verify-work`:** Full suite must be green (or document manual-only gaps)
- **Max feedback latency:** 120 seconds (target)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| *assign during execution* | *PLAN* | *N* | INFR-02 / FRND-* / BLCK-* | integration / unit | `npx vitest run tests/friends-graph.integration.test.ts` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Vitest + supertest in `package.json`
- [ ] `tests/setup.ts` — env for test DB or MongoDB Testcontainers
- [ ] `tests/friends-graph.integration.test.ts` — cap (UTC day), unique pending, block side-effects, no `/api/followers`
- [ ] `npm test` script in `package.json`

*Until Wave 0: manual API exercise + index inspection + grep gates (see 02-RESEARCH.md Validation Architecture).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mongo unique indexes present | D-04, D-06, D-13 | DB introspection | After `initializeIndexes()`, `db.friendships.getIndexes()` etc. |
| OpenAPI docs | INFR-02 | Browser/docs | `/api/docs` shows friends/blocks, not followers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency under 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
