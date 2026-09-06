# Tasks: Merchant Add Offer Endpoint

> **Spec**: `specs/002-merchant-add-offer-endpoint/spec.md`
> **Plan**: `specs/002-merchant-add-offer-endpoint/plan.md`
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 002 of 006 in phase
> **Date**: 2026-09-06
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

- Depends on: `specs/001-merchant-list-offers-endpoint/` (Status: ⬜ Pending)

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Add Add-Offer Pydantic Request & Response Schemas
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/models/dashboard.py`
- **Description**: Add `MerchantOfferCreateRequest` (with fields for product_id, price > 0, stock >= 0, estimated_delivery_days >= 1) and `MerchantOfferResponse` schemas with OpenAPI descriptions.
- **Done when**: Models validate valid inputs and reject invalid values in tests.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Create Offer Service Logic `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/services/dashboard_service.py`
- **Description**: Implement `create_merchant_offer`. Verify target product exists (raise 404 if not). Verify seller does not already have an offer for this product (raise 409 if duplicate exists). Insert new offer row into `seller_products` and return `MerchantOfferResponse`.
- **Done when**: Service function handles insertion and raises appropriate HTTP exceptions for missing product or duplicate offer.

### Task 2.2 — Add POST /offers Endpoint to Dashboard Router `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/routers/dashboard.py`
- **Description**: Implement `@router.post("/offers", status_code=201)`. Enforce merchant role check (raise 403 if not merchant). Call `create_merchant_offer` and return created offer response.
- **Done when**: Endpoint is defined with all OpenAPI response schemas and status 201.

---

## Batch 3: Tests `[PARALLEL]`

### Task 3.1 — Pytest Test Suite for Add Offer `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/test_dashboard_add_offer.py`
- **Description**: Write tests covering:
  - Successful offer creation (HTTP 201).
  - Target product not found (HTTP 404 with `PRODUCT_NOT_FOUND`).
  - Duplicate offer attempt (HTTP 409 with `DUPLICATE_OFFER`).
  - Validation failure on negative price or stock (HTTP 422).
  - Non-merchant forbidden access (HTTP 403).
  - Unauthenticated access (HTTP 401).
- **Done when**: All test cases pass via `uv run pytest backend/tests/test_dashboard_add_offer.py`.

---

## Batch 4: Integration & Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Format
- **Type**: `[SEQUENTIAL]`
- **Description**: Run `uv run ruff check . && uv run ruff format --check .` on modified backend files.
- **Done when**: No lint or formatting issues.

### Task 4.2 — Full Test Suite
- **Type**: `[SEQUENTIAL]`
- **Description**: Run `uv run pytest` to ensure both prior specs and new add-offer tests pass.
- **Done when**: All tests pass.

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

1. `feat(backend): add schemas for merchant offer creation`
2. `feat(backend): implement create_merchant_offer service and endpoint`
3. `test(backend): add comprehensive tests for POST /api/v1/dashboard/offers`
