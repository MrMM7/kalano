# Tasks: Product Detail Endpoint

> **Spec**: `specs/002-product-detail-endpoint/spec.md`
> **Plan**: `specs/002-product-detail-endpoint/plan.md`
> **Branch**: `feat/product-catalog`
> **Spec**: 002 of 005 in phase
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

- Depends on: `specs/001-list-products-endpoint/` (Status: ⬜ Pending)

---

## Batch 1: Models & Schema Extension `[SEQUENTIAL]`

### Task 1.1 — Extend Product Models for Detail Response

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/models/product.py`
- **Description**: Add `SellerOfferItem` and `ProductDetailResponse` models:
  - `SellerOfferItem`: `seller_product_id`, `seller_id`, `seller_name`, `price`, `stock`, `estimated_delivery_days` with descriptions and example schema.
  - `ProductDetailResponse`: `id`, `name`, `description`, `brand`, `image_url`, `created_at`, `cheapest_offer`, `offers` (list of `SellerOfferItem`).
- **Done when**: Models are defined, exported, and pass `ruff check`.

---

## Batch 2: Service & Endpoint Implementation `[SEQUENTIAL]`

### Task 2.1 — Implement Product Detail Service Function

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/services/product_service.py`
- **Description**: Add `get_product_by_id` function:
  - Query Supabase `products` table for `id = product_id`.
  - Return `ErrorDetail(code="RESOURCE_NOT_FOUND", message=f"Product with ID '{product_id}' was not found.")` if product is missing.
  - Query `seller_products` matching `product_id`, joined with `users` to fetch `display_name`.
  - Sort offers by `price` ascending, then `estimated_delivery_days` ascending.
  - Calculate `cheapest_offer` as the lowest-priced offer with `stock > 0`, or `None` if out of stock.
  - Return formatted dictionary conforming to `ProductDetailResponse`.
- **Done when**: Function compiles and handles product lookup, sorting, and error handling.

### Task 2.2 — Add Detail Route to Products Router

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/routers/products.py`
- **Description**:
  - Add route `GET /api/v1/products/{product_id}`.
  - Set summary, description, tag `Products`, and response models for 200, 404, and 422.
  - Validate `product_id` path parameter as UUID.
  - Call `product_service.get_product_by_id` with Supabase dependency; if `ErrorDetail` is returned, respond with HTTP 404 `ErrorResponse`.
- **Done when**: Endpoint responds to `GET /api/v1/products/{product_id}`.

---

## Batch 3: Automated Tests `[SEQUENTIAL]`

### Task 3.1 — Create Pytest Suite for Product Detail

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_products_detail.py`
- **Description**: Write tests covering:
  - Querying existing product with multiple offers returns 200 with sorted offers.
  - Offers in response are strictly ordered by price ascending.
  - `cheapest_offer` correctly selects the cheapest in-stock seller.
  - Out of stock offers: `cheapest_offer` is null if all offers have stock 0.
  - Product with zero offers returns 200 with empty offers list.
  - Non-existent UUID returns 404 with standard error envelope code `RESOURCE_NOT_FOUND`.
  - Non-UUID path parameter returns 422.
- **Done when**: All tests pass via `uv run pytest backend/tests/test_products_detail.py`.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Code Formatting

- **Type**: `[SEQUENTIAL]`
- **Description**: Run backend linter and formatter across all changed files:
  - Command: `uv run ruff check backend/`
  - Command: `uv run ruff format backend/`
- **Done when**: Zero lint errors or formatting warnings.

### Task 4.2 — Full Backend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run complete backend test suite:
  - Command: `uv run pytest backend/`
- **Done when**: All tests pass cleanly.

### Task 4.3 — Server Smoke Verification with Timeout

- **Type**: `[SEQUENTIAL]`
- **Description**: If launching the local Uvicorn development server to verify OpenAPI `/docs` or endpoint responses:
  - **MANDATORY TIMEOUT RULE**: The server process MUST be started with an automatic timeout that terminates and kills the process after X seconds (maximum 20 seconds). Leaving server processes running indefinitely is strictly prohibited.
- **Done when**: Verification is complete and the server process terminates automatically after the timeout without hanging.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | No | 1 |
| 3 | 1 | No | 1 |
| 4 | 3 | No | 1 |
| **Total** | **7** | | |

---

## Git Commit Plan

1. `feat(backend): add product detail Pydantic models`
2. `feat(backend): implement product detail service with offer sorting`
3. `feat(backend): expose GET /api/v1/products/{product_id} endpoint`
4. `test(backend): add pytest suite for product detail endpoint`
