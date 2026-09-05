# Tasks: List Products Endpoint

> **Spec**: `specs/001-list-products-endpoint/spec.md`
> **Plan**: `specs/001-list-products-endpoint/plan.md`
> **Branch**: `feat/product-catalog`
> **Spec**: 001 of 005 in phase
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

- Depends on: None (this is the first spec in Phase 3)

---

## Batch 1: Foundation Models `[SEQUENTIAL]`

### Task 1.1 — Create Product Schemas

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/product.py`
- **Description**: Define Pydantic models for catalog products:
  - `CheapestOfferResponse` with `seller_product_id`, `seller_id`, `seller_name`, `price`, `stock`, `estimated_delivery_days`. Add field-level descriptions and examples.
  - `ProductListItemResponse` with `id`, `name`, `description`, `brand`, `image_url`, `cheapest_offer`. Add field-level descriptions and examples.
  - `ProductsListResponse` with `items`, `total`, `limit`, `offset`.
- **Done when**: File exists, models validate properly, and `ruff check` succeeds.

---

## Batch 2: Service & Endpoint Implementation `[SEQUENTIAL]`

### Task 2.1 — Implement Product Service Layer

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/services/product_service.py`
- **Description**: Implement `list_products` function in `product_service.py`:
  - Query Supabase `products` table with count configuration.
  - If `q` query string is provided, apply ILIKE search filter matching against `name` and `description`.
  - Apply pagination slice using `limit` and `offset`, ordered by `created_at` descending.
  - Query `seller_products` for returned product IDs where `stock > 0`, joining with `users` to fetch `display_name`.
  - For each product, select the offer with the minimum price (tie-breaking with `estimated_delivery_days`), or `None` if out of stock.
  - Return structured dictionary matching `ProductsListResponse`.
- **Done when**: Service function compiles cleanly and handles search, pagination, and offer mapping.

### Task 2.2 — Implement Products Router & Register in Main

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/routers/products.py`
  - Modify: `backend/app/main.py`
- **Description**:
  - Create route `GET /api/v1/products` in `backend/app/routers/products.py`.
  - Validate required parameters `limit` (int, 1-100) and `offset` (int, >=0), and optional `q` (string).
  - Add comprehensive OpenAPI metadata: summary, detailed description, tag `Products`, and error responses.
  - Inject Supabase client dependency and call `product_service.list_products`.
  - Register `products.router` in `backend/app/main.py`.
- **Done when**: Router is included in `main.py` and endpoint responds at `/api/v1/products`.

---

## Batch 3: Automated Tests `[SEQUENTIAL]`

### Task 3.1 — Create Pytest Suite for List Products

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_products_list.py`
- **Description**: Write comprehensive test cases covering:
  - Valid list request with `limit` and `offset` returning HTTP 200 and paginated structure.
  - Product with multiple seller offers correctly selects the lowest-price in-stock offer.
  - Product with zero-stock offers returns `cheapest_offer: null`.
  - Search query `?q=` matches substring in product name.
  - Search query `?q=` matches substring in description.
  - Search query with no match returns empty array with `total: 0`.
  - Missing `limit` returns HTTP 422.
  - Missing `offset` returns HTTP 422.
  - Invalid bounds (limit=0, limit=101, offset=-1) return HTTP 422.
- **Done when**: All tests pass with `uv run pytest backend/tests/test_products_list.py`.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Code Formatting

- **Type**: `[SEQUENTIAL]`
- **Description**: Run backend linter and formatter:
  - Command: `uv run ruff check backend/`
  - Command: `uv run ruff format backend/`
- **Done when**: Zero lint errors and zero formatting issues reported.

### Task 4.2 — Full Backend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run the complete backend test suite to verify zero regressions across existing auth and health endpoints:
  - Command: `uv run pytest backend/`
- **Done when**: All tests pass with 100% success rate.

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

1. `feat(backend): add catalog product Pydantic models`
2. `feat(backend): implement product listing service and query logic`
3. `feat(backend): create GET /api/v1/products router with pagination and search`
4. `test(backend): add pytest suite for GET /api/v1/products`
