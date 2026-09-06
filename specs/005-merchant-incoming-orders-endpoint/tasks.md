# Tasks: Merchant Incoming Orders and Status Update Endpoints

> **Spec**: `specs/005-merchant-incoming-orders-endpoint/spec.md`
> **Plan**: `specs/005-merchant-incoming-orders-endpoint/plan.md`
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 005 of 006 in phase
> **Date**: 2026-09-06
> **Status**: Complete
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

- Depends on: `specs/001-merchant-list-offers-endpoint/` (Status: ⬜ Pending)

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Add Order Models
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/models/dashboard.py`
- **Description**: Add `MerchantOrderItemResponse` (with order ID, product metadata, price, quantity, total, status, address, buyer name, created timestamp) and `MerchantOrderStatusUpdateRequest` schemas with OpenAPI descriptions.
- **Done when**: Models import and validate sample order structures cleanly.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Merchant Orders Service Logic `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/services/dashboard_service.py`
- **Description**: Implement `get_merchant_orders` with status filtering and table joins on `products` and `users`. Implement `update_merchant_order_status` with strict checks: caller must be seller, current status must be pending, target status must be confirmed.
- **Done when**: Service function retrieves orders and validates state transitions.

### Task 2.2 — Add Orders Endpoints to Router `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/routers/dashboard.py`
- **Description**: Add `GET /orders` with optional status query parameter and `PATCH /orders/{order_id}/status`. Enforce merchant role check and document OpenAPI responses for 200, 400, 401, 403, 404, 422, 500.
- **Done when**: Endpoints are active and reachable under `/api/v1/dashboard/orders`.

---

## Batch 3: Tests `[PARALLEL]`

### Task 3.1 — Pytest Test Suite for Merchant Orders `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/test_dashboard_orders.py`
- **Description**: Write tests covering:
  - Listing orders with joined product and customer names.
  - Filtering orders by status parameter.
  - Successfully updating status to `confirmed`.
  - Rejecting transition if new status is not `confirmed` (HTTP 400).
  - Rejecting transition if existing status is not `pending` (HTTP 400).
  - Order not found (HTTP 404) and forbidden access to other sellers' orders (HTTP 403).
  - Unauthenticated and non-merchant access attempts.
- **Done when**: All tests pass via `uv run pytest backend/tests/test_dashboard_orders.py`.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Format
- **Type**: `[SEQUENTIAL]`
- **Description**: Run `uv run ruff check . && uv run ruff format --check .` on modified backend files.
- **Done when**: Zero lint errors reported.

### Task 4.2 — Full Test Suite
- **Type**: `[SEQUENTIAL]`
- **Description**: Run full test suite with `uv run pytest`.
- **Done when**: All tests across all suites pass.

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

1. `feat(backend): add schemas for merchant incoming orders and status updates`
2. `feat(backend): implement merchant orders service with ready-for-pickup transition`
3. `feat(backend): add GET and PATCH /api/v1/dashboard/orders endpoints`
4. `test(backend): add unit and integration tests for merchant orders endpoints`
