# Tasks: End-to-End Smoke Test

> **Spec**: `specs/005-end-to-end-smoke-test/spec.md`
> **Plan**: `specs/005-end-to-end-smoke-test/plan.md`
> **Branch**: `feat/polish-and-integration`
> **Spec**: 005 of 006 in phase
> **Date**: 2026-09-07
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. command invocations or minimal type references) are allowed, but **mock logic is
> strictly prohibited** (no function bodies, control flow, loops, or algorithms). Custom enums
> MUST be explained in pure text.

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

- Depends on: None (relies on backend API endpoints from Phases 1–7; can execute in parallel with frontend polish).

---

## Batch 1: Test Fixtures & Harness Setup `[SEQUENTIAL]`

### Task 1.1 — Scaffold E2E Smoke Test Harness

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_e2e_smoke.py`
- **Description**: Set up the smoke test module using Pytest and FastAPI `TestClient`. Define reusable helper functions or fixtures to initialize test state, create auth headers for arbitrary roles, and generate unique test credentials for merchant, buyer, and logistics users.
- **Done when**: `test_e2e_smoke.py` is initialized with test client and helper utilities.

---

## Batch 2: Core Smoke Test Implementation `[PARALLEL]`

### Task 2.1 — Implement Multi-Role Full Lifecycle Test `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/tests/test_e2e_smoke.py`
- **Description**: Implement `test_e2e_full_lifecycle`. Wire up the full sequence:
  1. Merchant registers, logs in, creates a product with offer (stock=10, price=29.99).
  2. Buyer registers, logs in, searches catalog, selects the offer, adds 2 to cart.
  3. Buyer checks out with delivery address; verify cart clears and order is created with status `pending`.
  4. Verify offer stock decremented to 8.
  5. Merchant inspects incoming orders, confirms order and marks ready for pickup (`confirmed`).
  6. Logistics user logs in, inspects orders, updates status to `shipped`, then updates to `delivered`.
  7. Buyer inspects order history and asserts final status is `delivered`.
- **Done when**: The entire happy-path multi-role lifecycle executes and asserts all transitions successfully.

### Task 2.2 — Implement Security Boundaries & Edge Case Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/tests/test_e2e_smoke.py`
- **Description**: Implement `test_e2e_role_boundaries` and `test_e2e_edge_cases`. Verify:
  1. Buyer attempting to view merchant dashboard orders receives 403 Forbidden.
  2. Merchant attempting to update logistics status receives 403 Forbidden.
  3. Attempting checkout with an empty cart returns 400 Bad Request.
  4. Attempting to transition status from `pending` directly to `delivered` via logistics endpoint returns 400 Bad Request.
- **Done when**: All security boundary and edge-case assertions pass.

---

## Batch 3: Bug Fixing & Stabilization `[SEQUENTIAL]`

### Task 3.1 — Remediate Discrepancies (If Any)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/routers/` (if needed)
  - Modify: `backend/app/services/` (if needed)
- **Description**: If running the end-to-end integration test reveals any subtle cross-service discrepancies, parameter mismatches, or status transition bugs, fix the underlying backend service or router cleanly without altering established API contracts.
- **Done when**: Any discovered issues are resolved and tests pass.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Backend Lint & Format

- **Type**: `[SEQUENTIAL]`
- **Description**: Run Ruff on backend codebase:
  - Backend: `uv run ruff check . && uv run ruff format --check .`
- **Done when**: Zero lint errors or formatting discrepancies.

### Task 4.2 — Run Complete Backend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run pytest on entire backend test directory:
  - Backend: `uv run pytest backend/tests/ -v`
- **Done when**: All test suites, including `test_e2e_smoke.py`, pass with 100% success.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | Yes | 2 |
| 3 | 1 | No | 1 |
| 4 | 2 | No | 1 |
| **Total** | **6** | | |

---

## Git Commit Plan

1. `test(backend): add comprehensive multi-role end-to-end smoke test suite`
2. `fix(backend): remediate any cross-router edge cases uncovered by e2e tests`
