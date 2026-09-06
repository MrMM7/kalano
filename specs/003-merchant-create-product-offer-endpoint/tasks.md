# Tasks: Merchant Create Product and Offer Endpoint

> **Spec**: `specs/003-merchant-create-product-offer-endpoint/spec.md`
> **Plan**: `specs/003-merchant-create-product-offer-endpoint/plan.md`
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 003 of 006 in phase
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
- Depends on: `specs/002-merchant-add-offer-endpoint/` (Status: ⬜ Pending)

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Add Product Creation Schemas
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/models/dashboard.py`
- **Description**: Add `ProductRecordModel` and `MerchantProductCreateResponse` schemas to `dashboard.py` with field definitions and OpenAPI descriptions.
- **Done when**: Models import cleanly without syntax or typing errors.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Storage Helper and Product Creation Service `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/services/dashboard_service.py`
- **Description**: Implement `upload_product_image` to handle Supabase Storage uploads and public URL generation. Implement `create_product_and_offer` to create a `products` row followed by a `seller_products` row, returning both in `MerchantProductCreateResponse`.
- **Done when**: Service handles image upload and database insertions for both tables.

### Task 2.2 — Add Multipart POST /products Endpoint `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/routers/dashboard.py`
- **Description**: Implement `@router.post("/products", status_code=201)` accepting multipart Form and File parameters. Verify merchant role, call `create_product_and_offer`, and return HTTP 201.
- **Done when**: Endpoint is exposed on `/api/v1/dashboard/products` with multipart OpenAPI specifications.

---

## Batch 3: Tests `[PARALLEL]`

### Task 3.1 — Pytest Test Suite for Product Creation `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/test_dashboard_create_product.py`
- **Description**: Write tests with mock Supabase client and storage:
  - Create product with image file upload (HTTP 201).
  - Create product without image (HTTP 201, image_url is null).
  - Storage upload failure (HTTP 400 with `IMAGE_UPLOAD_FAILED`).
  - Validation failures for empty fields or negative numbers (HTTP 422).
  - Non-merchant forbidden access (HTTP 403).
  - Unauthenticated access (HTTP 401).
- **Done when**: All tests pass via `uv run pytest backend/tests/test_dashboard_create_product.py`.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Format
- **Type**: `[SEQUENTIAL]`
- **Description**: Run `uv run ruff check . && uv run ruff format --check .` on modified backend files.
- **Done when**: Zero lint errors reported.

### Task 4.2 — Full Test Suite
- **Type**: `[SEQUENTIAL]`
- **Description**: Run full backend test suite with `uv run pytest`.
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

1. `feat(backend): add schemas for product and offer creation`
2. `feat(backend): implement storage upload and create_product_and_offer service`
3. `feat(backend): add multipart POST /api/v1/dashboard/products endpoint`
4. `test(backend): add unit and integration tests for merchant product creation`
