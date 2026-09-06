# Tasks: Merchant List Offers Endpoint

> **Spec**: `specs/001-merchant-list-offers-endpoint/spec.md`
> **Plan**: `specs/001-merchant-list-offers-endpoint/plan.md`
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 001 of 006 in phase
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

- None (this is the first spec in Phase 6).

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Pydantic Dashboard Models
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/dashboard.py`
- **Description**: Define `MerchantOfferItemResponse` model with fields for offer ID, product ID, product title, brand, description, image URL, price, stock, estimated delivery days, and creation timestamp. Add descriptive annotations for OpenAPI documentation.
- **Done when**: Model file imports cleanly in Python and passes Ruff linting.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Merchant Offers Service `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/app/services/dashboard_service.py`
- **Description**: Implement `get_merchant_offers` to query `seller_products` filtered by `seller_id`, joining product catalog fields from `products`. Map returned rows into `MerchantOfferItemResponse` objects, ordering by creation timestamp descending.
- **Done when**: Service function returns list of offer responses when supplied with mock Supabase responses.

### Task 2.2 — Implement Dashboard Offers Router `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/app/routers/dashboard.py`
- **Description**: Create APIRouter prefixed at `/api/v1/dashboard` with tag `Dashboard`. Implement `GET /offers` requiring `get_current_user`. Enforce that `user_role == "merchant"`; return 403 Forbidden with standard error envelope if non-merchant. Call service function and return response list.
- **Done when**: Endpoint handler is defined and properly typed with OpenAPI response definitions.

---

## Batch 3: Tests `[PARALLEL]`

### Task 3.1 — Pytest Test Suite for Dashboard Offers `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/test_dashboard_offers.py`
- **Description**: Implement comprehensive tests using FastAPI `TestClient`:
  - Test successful retrieval with multiple offers.
  - Test empty offers array when merchant has no listings.
  - Test 403 Forbidden when accessed by a buyer account.
  - Test 401 Unauthorized when unauthenticated.
- **Done when**: All tests pass when run via `uv run pytest backend/tests/test_dashboard_offers.py`.

---

## Batch 4: Integration & Wiring `[SEQUENTIAL]`

### Task 4.1 — Register Dashboard Router in FastAPI App
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/main.py`
- **Description**: Import the newly created `dashboard.router` and register it on the FastAPI application instance.
- **Done when**: Running the FastAPI server mounts `/api/v1/dashboard/offers` and displays it in OpenAPI `/docs`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format
- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and formatters on all changed backend files.
  - Backend: `uv run ruff check . && uv run ruff format --check .`
- **Done when**: No lint or formatting errors are reported.

### Task 5.2 — Run Test Suite
- **Type**: `[SEQUENTIAL]`
- **Description**: Execute the full pytest test suite to ensure existing endpoints remain intact and new tests pass.
  - Backend: `uv run pytest`
- **Done when**: All test suites pass 100% cleanly.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | Yes | 2 |
| 3 | 1 | No | 1 |
| 4 | 1 | No | 1 |
| 5 | 2 | No | 1 |
| **Total** | **7** | | |

---

## Git Commit Plan

1. `feat(backend): add merchant dashboard offer models and schemas`
2. `feat(backend): implement merchant offers service and router endpoint`
3. `test(backend): add unit and integration tests for GET /api/v1/dashboard/offers`
4. `chore(backend): register dashboard router in main application`
