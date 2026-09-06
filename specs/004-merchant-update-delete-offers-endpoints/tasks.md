# Tasks: Merchant Update and Delete Offers Endpoints

> **Spec**: `specs/004-merchant-update-delete-offers-endpoints/spec.md`
> **Plan**: `specs/004-merchant-update-delete-offers-endpoints/plan.md`
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 004 of 006 in phase
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

### Task 1.1 — Add Update and Delete Pydantic Models
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/models/dashboard.py`
- **Description**: Add `MerchantOfferUpdateRequest` (with optional fields for price > 0, stock >= 0, estimated_delivery_days >= 1) and `MerchantOfferDeleteResponse` (message and id).
- **Done when**: Models validate input data and reject negative values.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Update and Delete Service Logic `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/services/dashboard_service.py`
- **Description**: Implement `verify_offer_ownership` helper, `update_merchant_offer` to patch fields, and `delete_merchant_offer` to remove cart item references and delete the seller product. Raise 404 for missing offer and 403 for cross-seller access.
- **Done when**: Service handles both update and delete operations while protecting seller ownership.

### Task 2.2 — Add PATCH and DELETE Endpoints to Router `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/routers/dashboard.py`
- **Description**: Add `PATCH /offers/{offer_id}` and `DELETE /offers/{offer_id}`. Enforce merchant role check and document OpenAPI responses for 200, 400, 401, 403, 404, 422, 500.
- **Done when**: Endpoints are active and reachable on `/api/v1/dashboard/offers/{offer_id}`.

---

## Batch 3: Tests `[PARALLEL]`

### Task 3.1 — Pytest Test Suite for Update and Delete Offers `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/test_dashboard_update_delete_offers.py`
- **Description**: Write tests covering:
  - Successful PATCH with individual and combined fields.
  - PATCH empty payload validation (HTTP 400).
  - Successful DELETE of an owned offer (HTTP 200).
  - Attempting to PATCH or DELETE another seller's offer (HTTP 403).
  - Attempting to PATCH or DELETE a non-existent offer (HTTP 404).
  - Unauthorized and non-merchant access attempts.
- **Done when**: All test cases pass via `uv run pytest backend/tests/test_dashboard_update_delete_offers.py`.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Format
- **Type**: `[SEQUENTIAL]`
- **Description**: Run `uv run ruff check . && uv run ruff format --check .` on modified backend files.
- **Done when**: No lint or style issues reported.

### Task 4.2 — Full Test Suite
- **Type**: `[SEQUENTIAL]`
- **Description**: Run full test suite with `uv run pytest`.
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

1. `feat(backend): add schemas for updating and deleting offers`
2. `feat(backend): implement update and delete service logic with ownership verification`
3. `feat(backend): add PATCH and DELETE /api/v1/dashboard/offers/{offer_id} endpoints`
4. `test(backend): add unit and integration tests for offer update and deletion`
