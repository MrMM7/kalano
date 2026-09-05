# Tasks: Cart Backend — View & Modify Endpoints

> **Spec**: `specs/002-cart-backend-view-modify/spec.md`
> **Plan**: `specs/002-cart-backend-view-modify/plan.md`
> **Branch**: `feat/cart`
> **Spec**: 002 of 004 in phase
> **Date**: 2026-09-05
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

- Depends on: `specs/001-cart-backend-add-item/` (Status: ⬜ Pending)

---

## Batch 1: Models & Service Expansion `[SEQUENTIAL]`

### Task 1.1 — Extend Cart Pydantic Models

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/models/cart.py`
- **Description**: Add Pydantic schemas for retrieving, modifying, and deleting cart items.
  - Add `CartItemDetail` schema with product name, brand, image URL, seller name, unit price, stock, estimated delivery days, quantity, and computed subtotal.
  - Add `CartResponse` schema containing cart ID, list of `CartItemDetail`, `total_items`, and `total_price`.
  - Add `CartItemUpdate` schema with `quantity` constrained to minimum 1.
  - Add `CartItemDeleteResponse` schema with confirmation message.
- **Done when**: All new schemas are added to `models/cart.py` and pass Ruff lint checks.

### Task 1.2 — Extend Cart Service Logic

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/services/cart_service.py`
- **Description**: Add business logic functions for cart viewing, quantity updates, and item deletion.
  - Implement `get_user_cart` querying `carts` and `cart_items` joined with `seller_products`, `products`, and seller `users`. Calculate subtotals and overall totals. Return empty cart if no items exist.
  - Implement `update_cart_item_quantity` verifying buyer ownership of the cart item, checking live stock in `seller_products`, updating `quantity` in `cart_items`, and raising 400 `INSUFFICIENT_STOCK` or 404 `CART_ITEM_NOT_FOUND` where appropriate.
  - Implement `delete_cart_item` verifying buyer ownership and removing the row from `cart_items`.
- **Done when**: Service methods are fully implemented and handle error edge cases cleanly.

---

## Batch 2: Router Implementation `[SEQUENTIAL]`

### Task 2.1 — Implement Cart View, Update, and Delete Endpoints

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/routers/cart.py`
- **Description**: Add route handlers to the cart router.
  - Add `GET /` endpoint returning `CartResponse`.
  - Add `PATCH /items/{item_id}` endpoint accepting `CartItemUpdate` and returning the updated item.
  - Add `DELETE /items/{item_id}` endpoint removing the item and returning `CartItemDeleteResponse`.
  - Ensure all endpoints use `get_current_user` dependency, enforce `buyer` role check, and document OpenAPI responses.
- **Done when**: Endpoints are active and properly documented in OpenAPI docs.

---

## Batch 3: Pytest Tests `[SEQUENTIAL]`

### Task 3.1 — Add Pytest Tests for View, Modify, and Delete

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/tests/test_cart.py`
- **Description**: Add comprehensive test cases covering view, patch, and delete operations.
  - Test viewing empty cart returns empty list and 0 total.
  - Test viewing populated cart returns correct joined data, subtotals, and total price.
  - Test updating quantity successfully.
  - Test updating quantity above available stock returns 400 `INSUFFICIENT_STOCK`.
  - Test updating quantity to zero or negative returns 422.
  - Test updating or deleting non-existent item returns 404 `CART_ITEM_NOT_FOUND`.
  - Test updating or deleting an item belonging to another user returns 404.
  - Test deleting an item removes it from cart.
  - Test authorization: unauthenticated requests return 401, non-buyer requests return 403.
- **Done when**: All new and existing tests in `backend/tests/test_cart.py` pass.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Backend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and full test suites.
  - Run `uv run ruff check .` and `uv run ruff format --check .`
  - Run `uv run pytest`
- **Done when**: All checks and tests pass with zero errors.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 2 | No | 1 |
| 2 | 1 | No | 1 |
| 3 | 1 | No | 1 |
| 4 | 1 | No | 1 |
| **Total** | **5** | | |

---

## Git Commit Plan

1. `feat(backend): add models for viewing, updating, and deleting cart items`
2. `feat(backend): implement cart service view, update quantity, and delete methods`
3. `feat(backend): add GET /api/v1/cart, PATCH and DELETE /api/v1/cart/items/{item_id} endpoints`
4. `test(backend): add tests for cart retrieval, quantity updates, and item deletion`
