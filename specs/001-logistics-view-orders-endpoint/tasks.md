# Tasks: Logistics View All Orders Endpoint

> **Spec**: `specs/001-logistics-view-orders-endpoint/spec.md`
> **Plan**: `specs/001-logistics-view-orders-endpoint/plan.md`
> **Branch**: `feat/logistics-dashboard`
> **Spec**: 001 of 003 in phase
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

- Depends on: None (this is the first spec in Phase 7)

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Logistics Response Models

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/logistics.py`
- **Description**:
  - Define `LogisticsOrderItemResponse` containing: order ID (int), product ID (UUID), product name (str), product brand (str), product image URL (optional str), seller ID (UUID), seller name (str), buyer ID (optional UUID), buyer name (optional str), shipping address (str), bought price (float), quantity (int), subtotal (float), delivery status (str), and creation timestamp.
  - Explain the `delivered_types` enum in pure text for the status field: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`.
  - Add descriptive metadata strings and examples to every Pydantic field using `Field(description="...", examples=[...])`.
- **Done when**:
  - Model file imports cleanly and validates all expected fields.

---

## Batch 2: Core Implementation `[SEQUENTIAL]`

### Task 2.1 — Implement Logistics Orders Query Service

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/services/logistics_service.py`
- **Description**:
  - Implement `get_all_logistics_orders` accepting Supabase client and optional status filter string.
  - Validate status query parameter against allowed values (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `returned`). Raise HTTP 400 with `INVALID_STATUS` if invalid.
  - Query `user_orders` table with ordering by `created_at` descending. Apply status filter if provided.
  - Join or fetch product details (`name`, `brand`, `image_url`) and user display names for seller and buyer, using fallback individual lookups if relational queries fail.
  - Compute subtotal as price multiplied by quantity.
  - Return a list of `LogisticsOrderItemResponse` objects.
- **Done when**:
  - Service functions can be imported and executed with mock or live database client.

### Task 2.2 — Implement Logistics Router and Endpoint

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/routers/logistics.py`
- **Description**:
  - Create `APIRouter` with prefix `/api/v1/logistics` and tag `Logistics`.
  - Implement `GET /api/v1/logistics/orders` accepting optional `status` query parameter.
  - Protect route using `get_current_user` and `get_supabase_client` dependencies.
  - Enforce role check: verify `current_user.user_role == "logistics"`. If not, raise HTTP 403 with `FORBIDDEN` error envelope.
  - Call `get_all_logistics_orders` and return `list[LogisticsOrderItemResponse]`.
  - Add OpenAPI documentation with `summary`, `description`, and response documentation for 200, 400, 401, 403, and 500 status codes.
- **Done when**:
  - Router passes static analysis and exposes `GET /api/v1/logistics/orders`.

---

## Batch 3: Integration & Router Registration `[SEQUENTIAL]`

### Task 3.1 — Register Logistics Router in Main App

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/main.py`
- **Description**:
  - Import `logistics` from `app.routers`.
  - Add `app.include_router(logistics.router)` to the FastAPI application.
- **Done when**:
  - FastAPI app starts and exposes `/api/v1/logistics/orders` on Swagger `/docs`.

---

## Batch 4: Automated Testing `[SEQUENTIAL]`

### Task 4.1 — Write Pytest Tests for Logistics View Orders Endpoint

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_logistics_orders.py`
- **Description**:
  - Write test case for unauthenticated request returning 401 `MISSING_TOKEN`.
  - Write test case for buyer role returning 403 `FORBIDDEN`.
  - Write test case for merchant role returning 403 `FORBIDDEN`.
  - Write test case for logistics role returning 200 and list of enriched orders.
  - Write test case for status filtering returning only matching orders.
  - Write test case for invalid status query returning 400 `INVALID_STATUS`.
  - Write test case for empty order collection returning empty array.
- **Done when**:
  - All test cases pass with `pytest backend/tests/test_logistics_orders.py`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint and Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Run backend linter: `uv run ruff check .`
  - Run backend formatter: `uv run ruff format . --check`
- **Done when**:
  - Ruff reports no lint errors or formatting issues.

### Task 5.2 — Backend Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Run complete backend test suite: `uv run pytest`
- **Done when**:
  - 100% of test cases in test suite pass.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | No | 1 |
| 3 | 1 | No | 1 |
| 4 | 1 | No | 1 |
| 5 | 2 | No | 1 |
| **Total** | **7** | | |

---

## Git Commit Plan

1. `feat(backend): add logistics order response models`
2. `feat(backend): implement logistics orders query service`
3. `feat(backend): add GET /api/v1/logistics/orders endpoint and register router`
4. `test(backend): add pytest tests for logistics orders retrieval and filtering`
