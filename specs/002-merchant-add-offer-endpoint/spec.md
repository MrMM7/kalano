# Spec: Merchant Add Offer Endpoint

> **Roadmap Reference**: Phase 6, Step 6.2 — Merchant: add offer to existing product
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 002 of 006 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Merchant Add Offer Endpoint enables an authenticated merchant to list their inventory and pricing for an existing catalog product. When a merchant finds a product already cataloged on Kalano, they use this endpoint to attach a new offer to it by providing their unit price, stock count, and estimated delivery timeline. The system verifies that the product exists and prevents duplicate offers from the same seller on the same product.

## 2. Dependencies

- Depends on: `specs/001-merchant-list-offers-endpoint/` (provides the base `backend/app/routers/dashboard.py` and `backend/app/models/dashboard.py`).

## 3. Functional Requirements

### 3.1 — Authorization & Role Verification
- [ ] The endpoint requires authentication via `get_current_user`.
- [ ] The endpoint verifies the caller has the `merchant` role. Non-merchants receive HTTP 403 Forbidden with error code `FORBIDDEN`.
- [ ] Unauthenticated callers receive HTTP 401 Unauthorized.

### 3.2 — Request Validation
- [ ] Payload must contain:
  - `product_id`: Valid UUID string referencing an existing product.
  - `price`: Floating-point number strictly greater than 0.
  - `stock`: Non-negative integer (greater than or equal to 0).
  - `estimated_delivery_days`: Optional integer greater than or equal to 1.
- [ ] Malformed or invalid input receives HTTP 422 Unprocessable Entity.

### 3.3 — Business Logic & Conflict Detection
- [ ] Verify that the product identified by `product_id` exists in the `products` table. If not found, return HTTP 404 Not Found with error code `PRODUCT_NOT_FOUND`.
- [ ] Verify that the merchant does not already have an offer for this product in `seller_products`. If an offer already exists with matching `product_id` and `seller_id`, return HTTP 409 Conflict with error code `DUPLICATE_OFFER`.
- [ ] Insert a new record into `seller_products` containing generated UUID `id`, `product_id`, `seller_id` (current user ID), `price`, `stock`, `estimated_delivery_days`, and `created_at`.
- [ ] Return the created offer with HTTP 201 Created.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated merchant can add an offer to an existing product and receive HTTP 201 with the created offer details.
- [ ] AC2: Providing a non-existent `product_id` returns HTTP 404 with error code `PRODUCT_NOT_FOUND`.
- [ ] AC3: Attempting to add a second offer for the same product by the same merchant returns HTTP 409 with error code `DUPLICATE_OFFER`.
- [ ] AC4: Submitting invalid field values (e.g. price <= 0, stock < 0, delivery days < 1) returns HTTP 422.
- [ ] AC5: Non-merchant users receive HTTP 403 Forbidden.

## 5. API Contract

### `POST /api/v1/dashboard/offers`

**Summary**: Add merchant offer to an existing product

**Description**: Creates a new seller product offer linking the authenticated merchant to an existing catalog product. Rejects duplicate offers by the same seller for the same product.

**Request Body**:
```json
{
  "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "price": 89.99,
  "stock": 15,
  "estimated_delivery_days": 2
}
```

**Success Response** (`201 Created`):
```json
{
  "id": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
  "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "seller_id": "9da85f64-5717-4562-b3fc-2c963f66afa8",
  "price": 89.99,
  "stock": 15,
  "estimated_delivery_days": 2,
  "created_at": "2026-09-06T12:00:00Z"
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_INPUT` | Input validation failure |
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication credentials missing or invalid |
| 403 | `FORBIDDEN` | User does not have the merchant role |
| 404 | `PRODUCT_NOT_FOUND` | Specified product_id does not exist in the catalog |
| 409 | `DUPLICATE_OFFER` | Merchant already has an active offer for this product |
| 422 | — | Request schema validation failure |
| 500 | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

## 6. UI/UX Requirements

- Frontend flow is specified in Spec 006 (`specs/006-seller-dashboard-frontend/`).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Product ID does not exist | Return 404 with code `PRODUCT_NOT_FOUND` |
| Merchant attempts to create duplicate offer | Return 409 with code `DUPLICATE_OFFER` and guidance to update existing offer |
| Price is negative or zero | Reject at schema validation with HTTP 422 |
| Stock is negative | Reject at schema validation with HTTP 422 |
| Estimated delivery days is 0 or negative | Reject at schema validation with HTTP 422 |
| Estimated delivery days is omitted | Allow null/omitted value and set to null |

## 8. Out of Scope

- ❌ Creating a new product in the catalog (handled in Spec 003).
- ❌ Modifying an existing offer (handled in Spec 004).
- ❌ Frontend form implementation (handled in Spec 006).

## 9. Constitution Compliance

- ✅ Business logic and validation run in FastAPI (`backend/app/`), not Next.js (§4.1).
- ✅ Endpoint uses `/api/v1/` prefix and OpenAPI tags with summary and field descriptions (§4.3).
- ✅ Standard error envelope used for all 4xx/5xx responses (§4.4).
- ✅ Role-based check enforces `merchant` role (§2).
- ✅ Pytest tests cover success and all error branches (§14).

## 10. Open Questions

- None. Requirements are clear and aligned with the constitution.
