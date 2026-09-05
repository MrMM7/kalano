# Tasks: Order History Endpoint

> **Spec**: `specs/003-order-history-endpoint/spec.md`
> **Plan**: `specs/003-order-history-endpoint/plan.md`
> **Branch**: `feat/checkout-and-orders`
> **Spec**: 003 of 004 in phase
> **Date**: 2026-09-05
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

- Depends on: `specs/001-checkout-endpoint/` (Status: ⬜ Pending) — Reads order records created by the checkout endpoint.

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Define Order History Pydantic Models

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/order.py`
- **Description**: Define the Pydantic response models for order history:
  - Create `OrderDetailResponse` schema with fields: `id` (integer), `product_id` (UUID), `product_name` (string), `product_brand` (string), `product_image_url` (optional string), `seller_id` (UUID), `seller_name` (string), `bought_price` (float), `quantity` (integer), `subtotal` (float), `delivery_types` (string, explaining that custom enum values accept `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`), `address` (string), and `created_at` (datetime or string). Include field descriptions and examples.
  - Create `OrderListResponse` schema with fields: `orders` (list of `OrderDetailResponse`) and `total_orders` (integer).
- **Done when**: File `backend/app/models/order.py` exists, imports cleanly, and passes type validation.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Order Service Logic `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/app/services/order_service.py`
- **Description**: Implement business logic for fetching buyer orders:
  - Verify user has the `buyer` role; raise HTTP 403 Forbidden with `FORBIDDEN` error envelope if not.
  - Query `user_orders` table for rows where `buyer_id` matches the user ID, sorted by `created_at` descending.
  - If no orders found, return empty order list response with count 0.
  - For each order, fetch product details (`name`, `brand`, `image_url`) from `products` table and seller name from `users` table.
  - Compute `subtotal` as `bought_price * quantity`.
  - Return `OrderListResponse`.
- **Done when**: Service function `get_buyer_orders` correctly queries, enriches, and returns buyer orders.

### Task 2.2 — Implement Orders Router & Endpoint `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/app/routers/orders.py`
- **Description**: Implement the FastAPI router for orders:
  - Initialize `APIRouter` with prefix `/api/v1/orders` and tag `Orders`.
  - Create `GET /` endpoint with summary "List buyer order history" and full description.
  - Inject dependencies: `get_current_user` and `get_supabase_client`.
  - Map response model to `OrderListResponse`.
  - Document error responses: HTTP 401 (`UNAUTHORIZED`) and HTTP 403 (`FORBIDDEN`).
  - Call `get_buyer_orders` service and return response.
- **Done when**: Router is created with full OpenAPI documentation and dependency wiring.

---

## Batch 3: Integration & Wiring `[SEQUENTIAL]`

### Task 3.1 — Register Orders Router in Main Application

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/main.py`
- **Description**: Import `orders.router` from `app.routers` and register it on the FastAPI application using `app.include_router(orders.router)`.
- **Done when**: The `/api/v1/orders` endpoint appears in the OpenAPI documentation at `/docs` and `/openapi.json`.

---

## Batch 4: Tests `[PARALLEL]`

### Task 4.1 — Backend Unit and Integration Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/test_orders.py`
- **Description**: Write Pytest tests for the order history endpoint:
  - Test successful order listing for buyer with multiple existing orders (verifying descending sort order and complete field mapping).
  - Test order listing for buyer with zero orders (returns HTTP 200 with empty list and `total_orders: 0`).
  - Test rejection of unauthenticated requests with HTTP 401.
  - Test rejection of merchant user with HTTP 403 `FORBIDDEN`.
  - Test rejection of logistics user with HTTP 403 `FORBIDDEN`.
  - Test subtotal calculation accuracy.
- **Done when**: All tests pass cleanly in `backend/tests/test_orders.py`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Backend

- **Type**: `[SEQUENTIAL]`
- **Description**: Run Ruff linter and formatter:
  - Command: `uv run ruff check app/ tests/`
  - Command: `uv run ruff format --check app/ tests/`
- **Done when**: Zero lint warnings or formatting errors.

### Task 5.2 — Backend Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**: Run the complete backend test suite:
  - Command: `uv run pytest`
- **Done when**: 100% of test cases pass.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | Yes | 2 |
| 3 | 1 | No | 1 |
| 4 | 1 | Yes | 1 |
| 5 | 2 | No | 1 |
| **Total** | **7** | | |

---

## Git Commit Plan

1. `feat(backend): define order history response models`
2. `feat(backend): implement order history service and enrichment logic`
3. `feat(backend): register orders router in main application`
4. `test(backend): add tests for order history endpoint and role enforcement`
