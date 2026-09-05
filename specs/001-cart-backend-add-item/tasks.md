# Tasks: Cart Backend — Add Item Endpoint

> **Spec**: `specs/001-cart-backend-add-item/spec.md`
> **Plan**: `specs/001-cart-backend-add-item/plan.md`
> **Branch**: `feat/cart`
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

- None (this is the first spec in Phase 4).

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Cart Pydantic Models

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/cart.py`
- **Description**: Define Pydantic request and response schemas for cart operations.
  - Define `CartItemCreate` schema with `seller_product_id` (UUID) and `quantity` (integer, default 1, minimum 1) including descriptive field summaries and examples.
  - Define `CartItemResponse` schema containing `id`, `cart_id`, `seller_product_id`, `quantity`, and `created_at`.
  - Define standard error detail models matching the constitution error format.
- **Done when**: File `backend/app/models/cart.py` exists with complete typed models and passes Ruff checks.

---

## Batch 2: Service & Router `[SEQUENTIAL]`

### Task 2.1 — Implement Cart Service

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/services/cart_service.py`
- **Description**: Implement database interactions and business logic for cart item addition.
  - Implement `get_or_create_user_cart` to retrieve an existing cart by `user_id` or insert a new cart record in `carts` table.
  - Implement `add_item_to_cart` to validate seller product existence and stock availability in `seller_products`.
  - Handle item increment when the seller product is already in the cart, enforcing cumulative stock limits.
  - Raise appropriate HTTP exceptions with error envelopes for non-existent offers (`SELLER_PRODUCT_NOT_FOUND`) and stock exhaustion (`INSUFFICIENT_STOCK`).
- **Done when**: `cart_service.py` handles cart retrieval, stock validation, and item creation/updates cleanly without lint errors.

### Task 2.2 — Implement Cart Router & Register in Main

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/routers/cart.py`
  - Modify: `backend/app/main.py`
- **Description**: Expose the `POST /api/v1/cart/items` endpoint.
  - Define endpoint in `backend/app/routers/cart.py` using `APIRouter(prefix="/cart", tags=["Cart"])`.
  - Guard endpoint with `get_current_user` dependency and verify user role is `buyer`, returning 403 `FORBIDDEN_ROLE` for other roles.
  - Call `add_item_to_cart` and return `CartItemResponse`.
  - Register the new router in `backend/app/main.py` under the `/api/v1` prefix.
- **Done when**: `POST /api/v1/cart/items` is registered and visible in OpenAPI schema at `/docs`.

---

## Batch 3: Pytest Tests `[SEQUENTIAL]`

### Task 3.1 — Implement Comprehensive Cart Addition Tests

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_cart.py`
- **Description**: Write Pytest test cases covering all requirements and edge cases for cart addition.
  - Test adding a new item to an empty cart for an authenticated buyer.
  - Test adding the same item again to verify quantity increments.
  - Test adding quantity greater than available stock returns 400 `INSUFFICIENT_STOCK`.
  - Test prospective quantity exceeding stock on repeated additions returns 400 `INSUFFICIENT_STOCK`.
  - Test invalid/non-existent `seller_product_id` returns 404 `SELLER_PRODUCT_NOT_FOUND`.
  - Test unauthenticated requests return 401.
  - Test merchant user requests return 403 `FORBIDDEN_ROLE`.
  - Test invalid payloads (zero quantity, malformed UUID) return 422.
- **Done when**: All tests in `backend/tests/test_cart.py` pass cleanly with pytest.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Backend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and full test suites.
  - Backend formatting and linting: `uv run ruff check .` and `uv run ruff format --check .`
  - Backend tests: `uv run pytest`
- **Done when**: All linting and pytest tests pass with zero errors.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | No | 1 |
| 3 | 1 | No | 1 |
| 4 | 1 | No | 1 |
| **Total** | **5** | | |

---

## Git Commit Plan

1. `feat(backend): add cart models and schemas`
2. `feat(backend): implement cart service with stock validation`
3. `feat(backend): add POST /api/v1/cart/items endpoint and register router`
4. `test(backend): add pytest tests for cart item addition and error scenarios`
