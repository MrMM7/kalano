# Tasks: Checkout Endpoint

> **Spec**: `specs/001-checkout-endpoint/spec.md`
> **Plan**: `specs/001-checkout-endpoint/plan.md`
> **Branch**: `feat/checkout-and-orders`
> **Spec**: 001 of 004 in phase
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

- None (this is the first spec in Phase 5).

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Define Checkout Pydantic Models

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/checkout.py`
- **Description**: Define the Pydantic request and response schemas for checkout:
  - Create `CheckoutRequest` schema with fields `address` (validated non-empty string with minimum length 5) and `save_address` (boolean, default false). Include field descriptions and examples.
  - Create `OrderItemSummary` schema with fields: `id` (integer), `product_id` (UUID), `product_name` (string), `seller_id` (UUID), `seller_name` (string), `bought_price` (float), `quantity` (integer), `subtotal` (float), `delivery_types` (string, explaining that custom enum values accept `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`), `address` (string), and `created_at` (datetime or string).
  - Create `CheckoutResponse` schema with fields: `order_ids` (list of integers), `orders` (list of `OrderItemSummary`), `total_items` (integer), `total_price` (float), and `message` (string).
- **Done when**: File `backend/app/models/checkout.py` exists, imports cleanly, and all schemas pass type checking.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Checkout Service Logic `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/app/services/checkout_service.py`
- **Description**: Implement business logic for processing checkout:
  - Verify user has the `buyer` role; raise HTTP 403 Forbidden with `FORBIDDEN` error envelope if not.
  - Fetch active cart from `carts` table for the given `user_id`.
  - Fetch all cart items from `cart_items` table linked to this cart, along with associated `seller_products` (price, stock, product_id, seller_id), `products` (name), and `users` (display name for seller).
  - Validate that cart has at least 1 item; raise HTTP 400 Bad Request with `EMPTY_CART` error envelope if empty.
  - Iterate through items and check that requested quantity does not exceed available stock in `seller_products`. If any item fails, raise HTTP 400 Bad Request with `INSUFFICIENT_STOCK` error envelope detailing the out-of-stock product.
  - Insert rows into `user_orders` table for each cart item: `product_id`, `bought_price`, `buyer_id`, `delivery_types` (set to `pending`), `address`, `seller_id`, and `quantity`.
  - Update `seller_products` table to decrement inventory stock by ordered quantity for each item.
  - If `save_address` is true, update `users` table for the user, setting `address` to the provided shipping address.
  - Delete cart items from `cart_items` table for the buyer's cart.
  - Return `CheckoutResponse` with order summary details.
- **Done when**: Service function `process_checkout` is implemented and handles all validation, database queries, and error cases according to specification.

### Task 2.2 — Implement Checkout Router & Endpoints `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/app/routers/checkout.py`
- **Description**: Implement the FastAPI router for checkout:
  - Initialize `APIRouter` with prefix `/api/v1/checkout` and tag `Checkout`.
  - Create `POST /` endpoint with summary "Process buyer checkout" and full description.
  - Wire FastAPI dependencies: `get_current_user` for authentication and `get_supabase_client` for database access.
  - Map response model to `CheckoutResponse`.
  - Document possible error responses: HTTP 400 (`EMPTY_CART`, `INSUFFICIENT_STOCK`), HTTP 401 (`UNAUTHORIZED`), HTTP 403 (`FORBIDDEN`), HTTP 422 (`VALIDATION_ERROR`).
  - Invoke `process_checkout` service function and return response.
- **Done when**: Router is created with complete OpenAPI documentation and dependency injection.

---

## Batch 3: Integration & Wiring `[SEQUENTIAL]`

### Task 3.1 — Register Checkout Router in Main Application

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/main.py`
- **Description**: Import `checkout.router` from `app.routers` and register it on the FastAPI application using `app.include_router(checkout.router)`.
- **Done when**: The `/api/v1/checkout` endpoint appears in the OpenAPI documentation at `/docs` and `/openapi.json`.

---

## Batch 4: Tests `[PARALLEL]`

### Task 4.1 — Backend Unit and Integration Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/test_checkout.py`
- **Description**: Write comprehensive Pytest test suite using `TestClient`:
  - Test successful checkout with single cart item (status 200, order created, stock decremented, cart emptied).
  - Test successful checkout with multiple items from different sellers.
  - Test checkout fails with HTTP 400 `EMPTY_CART` when cart has zero items.
  - Test checkout fails with HTTP 400 `EMPTY_CART` when user has no cart row.
  - Test checkout fails with HTTP 400 `INSUFFICIENT_STOCK` when requested quantity exceeds available stock (verify no order row created).
  - Test checkout rejects non-buyer role (merchant) with HTTP 403 `FORBIDDEN`.
  - Test checkout rejects unauthenticated requests with HTTP 401 `UNAUTHORIZED`.
  - Test `save_address=True` persists address to `users` table.
  - Test `save_address=False` does not overwrite existing `users` address.
  - Test whitespace-only or missing address returns HTTP 422 validation error.
- **Done when**: All tests in `backend/tests/test_checkout.py` pass cleanly with pytest.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Backend

- **Type**: `[SEQUENTIAL]`
- **Description**: Run Ruff linter and formatter on backend codebase:
  - Command: `uv run ruff check app/ tests/`
  - Command: `uv run ruff format --check app/ tests/`
- **Done when**: Zero lint warnings or formatting errors reported.

### Task 5.2 — Backend Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**: Run the complete backend test suite to verify no regressions:
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

1. `feat(backend): define checkout models and request schemas`
2. `feat(backend): implement checkout service business logic and inventory decrement`
3. `feat(backend): register checkout router in main application`
4. `test(backend): add tests for checkout endpoint and stock validation`
