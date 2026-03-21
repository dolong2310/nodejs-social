# Phase 1: Chat database foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `01-CONTEXT.md`.

**Date:** 2026-03-21  
**Phase:** 1 — Chat database foundation  
**Areas discussed:** Chat DB failure policy, `DATABASE_CHAT_NAME` policy, Phase 1 bootstrap scope, Mongo URI strategy  

**User input:** `recommend` — adopt all recommended options from formatted discuss-phase prompt.

---

## 1) Chat DB connection failure

| Option | Description | Selected |
|--------|-------------|----------|
| A | Fail-fast — stop entire process | ✓ |
| B | Log warning only; social API continues | |

**User's choice:** Recommend package (A).

---

## 2) `DATABASE_CHAT_NAME` requirement

| Option | Description | Selected |
|--------|-------------|----------|
| A | Mandatory in all environments | ✓ |
| B | Mandatory prod/staging; dev default if missing | |

**User's choice:** Recommend package (A).

---

## 3) Phase 1 scope (besides opening chat `Db`)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Connect + ping only; no collections/indexes | ✓ |
| B | Pre-create empty indexes for known collections | |

**User's choice:** Recommend package (A).

---

## 4) MongoDB URI strategy

| Option | Description | Selected |
|--------|-------------|----------|
| A | Single `DATABASE_URI` + `DATABASE_CHAT_NAME` | ✓ |
| B | Separate URI for chat (cluster/DR) | |

**User's choice:** Recommend package (A). Separate URI noted as deferred in CONTEXT.

---

## Claude's Discretion

- Implementation details of exposing chat `Db` and log messages — per CONTEXT "Claude's Discretion".

## Deferred Ideas

- Separate Mongo URI for chat database — deferred past Phase 1.
