# Tasks: Logistics Update Order Status Endpoint

> **Spec**: `specs/002-logistics-update-order-status-endpoint/spec.md`
> **Plan**: `specs/002-logistics-update-order-status-endpoint/plan.md`
> **Branch**: `feat/logistics-dashboard`
> **Spec**: 002 of 003 in phase
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

- Depends on: `specs/001-logistics-view-orders-endpoint/` (Status: ⬜ Pending)

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Add Order Status Update Request Schema

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/models/logistics.py`
- **Description**:
  - Add `LogisticsOrderStatusUpdateRequest` Pydantic model with field `status: str`.
  - Add field descriptions and examples explaining in pure text that `delivered_types` accepts: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`.
- **Done when**:
  - Model file imports cleanly and validates request bodies with a status property.

---

## Batch 2: Core Implementation `[SEQUENTIAL]`

### Task 2.1 — Implement Status Update Service with State Machine and Stock Restoration

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/services/logistics_service.py`
- **Description**:
  - Define state transition mapping: `pending` to (`confirmed`, `cancelled`), `confirmed` to (`shipped`, `cancelled`), `shipped` to (`delivered`, `cancelled`), `delivered` to (`returned`), terminal states map to none.
  - Implement `update_logistics_order_status` accepting Supabase client, order ID, and new status.
  - Validate new status against allowed delivery types (raise HTTP 400 `INVALID_STATUS` if invalid).
  - Retrieve existing order from `user_orders`. If not found, raise HTTP 404 `ORDER_NOT_FOUND`.
  - Validate that new status is in the allowed target set of the current status. If not, raise HTTP 400 `INVALID_STATUS_TRANSITION`.
  - If new status is `cancelled`, find matching `seller_products` row and increment `stock` by the order's `quantity`.
  - Update `user_orders.delivery_types` to the new status.
  - Return updated order as `LogisticsOrderItemResponse`.
- **Done when**:
  - Service functions can be imported and pass state transition tests.

### Task 2.2 — Add PATCH Endpoint to Logistics Router

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/routers/logistics.py`
- **Description**:
  - Add route `PATCH /api/v1/logistics/orders/{order_id}` with path parameter `order_id` (int) and body `LogisticsOrderStatusUpdateRequest`.
  - Check role: verify `current_user.user_role == "logistics"`. If not, raise HTTP 403 `FORBIDDEN`.
  - Call `update_logistics_order_status` and return the updated order.
  - Document summary, description, and responses for 200, 400, 401, 403, 404, and 500 status codes.
- **Done when**:
  - Route is mounted and visible in Swagger `/docs`.

---

## Batch 3: Automated Testing `[SEQUENTIAL]`

### Task 3.1 — Write Pytest Tests for Logistics Order Status Update

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_logistics_status_update.py`
- **Description**:
  - Write test for unauthenticated request returning 401 `MISSING_TOKEN`.
  - Write test for buyer/merchant roles returning 403 `FORBIDDEN`.
  - Write test for non-existent order returning 404 `ORDER_NOT_FOUND`.
  - Write test for invalid status string returning 400 `INVALID_STATUS`.
  - Write test for valid transition `confirmed` -> `shipped` returning 200.
  - Write test for valid transition `shipped` -> `delivered` returning 200.
  - Write test for valid transition `delivered` -> `returned` returning 200.
  - Write test for valid cancellation transition restoring `seller_products` stock.
  - Write test for illegal transition `pending` -> `delivered` returning 400 `INVALID_STATUS_TRANSITION`.
  - Write test for transition out of terminal state (`cancelled` -> `shipped`) returning 400 `INVALID_STATUS_TRANSITION`.
- **Done when**:
  - All test cases pass with `pytest backend/tests/test_logistics_status_update.py`.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint and Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Run backend linter: `uv run ruff check .`
  - Run backend formatter: `uv run ruff format . --check`
- **Done when**:
  - Ruff reports no lint or formatting errors.

### Task 4.2 — Backend Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Run complete backend test suite: `uv run pytest`
- **Done when**:
  - 100% of test cases pass cleanly.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | No | 1 |
| 3 | 1 | No | 1 |
| 4 | 2 | No | 1 |
| **Total** | **6** | | |

---

## Git Commit Plan

1. `feat(backend): add logistics status update request model`
2. `feat(backend): implement order state machine and stock restoration service`
3. `feat(backend): add PATCH /api/v1/logistics/orders/{order_id} endpoint`
4. `test(backend): add pytest tests for logistics status transitions and stock restoration`
