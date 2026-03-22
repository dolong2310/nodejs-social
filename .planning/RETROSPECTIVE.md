# Project Retrospective

*Living document updated after each milestone.*

## Milestone: v1.0 — brownfield v1 evolution

**Shipped:** 2026-03-23  
**Phases:** 7 | **Plans:** 23 | **Sessions:** not tracked

### What was built

- Second Mongo database for chat (`DATABASE_CHAT_NAME`) with fail-fast wiring.
- Mutual friends graph, blocks, daily request cap—followers removed.
- Post visibility, merged feed, engagement and search aligned with block rules.
- Friend-gated chat HTTP on dedicated chat DB; S3-backed message attachments.
- Notification inbox (REST + persist-then-emit Socket.IO).
- Socket.IO v1: JWT identity, conversation + user rooms, typing/presence, persist-then-emit for durable chat events.
- Vitest integration/smoke tests plus documented CONCERNS closure for implemented paths.

### What worked

- Phased roadmap (infra → graph → feed → HTTP chat → notifications → sockets → quality) reduced integration risk.
- HTTP-first chat before rewriting sockets kept a single service layer for persistence rules.

### What was inefficient

- No formal `v1.0-MILESTONE-AUDIT.md` before close; requirements checkboxes lagged ROADMAP until `requirements mark-complete` at archive time.
- Phase 5 lacked plan-level SUMMARY files until milestone completion (backfilled minimal summaries for MILESTONES tooling).

### Patterns established

- Persist-then-emit for notifications and chat over Socket.IO.
- `FriendsService` as the cache-backed source for “who is a friend” across feed, search, chat, and sockets.

### Key lessons

1. Run `/gsd-audit-milestone` before `/gsd-complete-milestone` when stakeholders need a signed coverage record.
2. Keep REQUIREMENTS.md traceability in sync with ROADMAP as phases close to avoid false “pending” noise at ship time.

### Cost observations

- Model mix: not recorded for this repo.
- Sessions: not recorded.
- Notable: Milestone completion is smoother when every plan folder includes a SUMMARY with a `one-liner` in frontmatter.

---

## Cross-milestone trends

### Process evolution

| Milestone | Sessions | Phases | Key change |
|-----------|----------|--------|------------|
| v1.0 | — | 7 | Baseline brownfield evolution from planning through ship |

### Cumulative quality

| Milestone | Tests | Coverage | Zero-dep additions |
|-----------|-------|----------|---------------------|
| v1.0 | Vitest smoke (HTTP + socket) | Not a goal for v1.0 | — |

### Top lessons (verified across milestones)

1. *(Single milestone to date — populate after v1.1+.)*
