# Spec: Merchant Update and Delete Offers Endpoints

> **Roadmap Reference**: Phase 6, Step 6.4 — Merchant: update & delete offers
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 004 of 006 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Merchant Update and Delete Offers Endpoints grant merchants direct control over their listed offers. Merchants can adjust product prices, replenish or reduce stock counts, and update estimated delivery transit times. When a merchant discontinues carrying an item, they can remove their offer entirely. Strict ownership verification ensures merchants can only modify or delete offers they own.

## 2. Dependencies

- Depends on: `specs/001-merchant-list-offers-endpoint/` and `specs/002-merchant-add-offer-endpoint/`.

## 3. Functional Requirements

### 3.1 — Authorization & Ownership Verification
- [ ] Both endpoints require authentication via `get_current_user`.
- [ ] Callers must possess the `merchant` role. Non-merchants receive HTTP 403 Forbidden.
- [ ] The system must verify that the target offer's `seller_id` matches the authenticated merchant's ID.
- [ ] If the offer does not exist in `seller_products`, return HTTP 404 Not Found with error code `OFFER_NOT_FOUND`.
- [ ] If the offer exists but belongs to a different merchant, return HTTP 403 Forbidden with error code `FORBIDDEN`.

### 3.2 — Update Offer (`PATCH /api/v1/dashboard/offers/{offer_id}`)
- [ ] Accepts a partial JSON payload containing one or more of:
  - `price`: Numeric float strictly greater than 0.
  - `stock`: Non-negative integer (greater than or equal to 0).
  - `estimated_delivery_days`: Optional integer greater than or equal to 1, or null.
- [ ] Validates provided values. Rejects negative price or stock with HTTP 422.
- [ ] Updates the matching row in `seller_products` with provided fields.
- [ ] Returns the updated offer object with HTTP 200 OK.

### 3.3 — Delete Offer (`DELETE /api/v1/dashboard/offers/{offer_id}`)
- [ ] Removes any referencing rows in `cart_items` for this `seller_product_id` to maintain foreign key integrity.
- [ ] Deletes the row from `seller_products`.
- [ ] Returns HTTP 200 OK with a confirmation message and deleted offer ID.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated merchant can update price, stock, and delivery estimate for an offer they own and receive HTTP 200 with updated values.
- [ ] AC2: Authenticated merchant can delete an offer they own and receive HTTP 200 confirmation.
- [ ] AC3: Attempting to update or delete an offer owned by a different merchant returns HTTP 403 Forbidden.
- [ ] AC4: Attempting to update or delete a non-existent offer ID returns HTTP 404 Not Found.
- [ ] AC5: Non-merchant users receive HTTP 403 Forbidden on both endpoints.
- [ ] AC6: Unauthenticated requests receive HTTP 401 Unauthorized.

## 5. API Contract

### `PATCH /api/v1/dashboard/offers/{offer_id}`

**Summary**: Update merchant offer details

**Description**: Updates price, stock quantity, or estimated delivery days for a specific seller offer. The merchant must own the offer.

**Path Parameters**:
- `offer_id`: UUID — Unique identifier of the seller product offer

**Request Body**:
```json
{
  "price": 79.99,
  "stock": 50,
  "estimated_delivery_days": 1
}
```

**Success Response** (`200 OK`):
```json
{
  "id": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
  "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "seller_id": "9da85f64-5717-4562-b3fc-2c963f66afa8",
  "price": 79.99,
  "stock": 50,
  "estimated_delivery_days": 1,
  "created_at": "2026-09-06T12:00:00Z"
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `EMPTY_UPDATE` | No fields provided in update payload |
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication missing or invalid |
| 403 | `FORBIDDEN` | Caller is not a merchant or does not own this offer |
| 404 | `OFFER_NOT_FOUND` | Offer with specified ID does not exist |
| 422 | — | Invalid field values (e.g. price <= 0) |
| 500 | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

---

### `DELETE /api/v1/dashboard/offers/{offer_id}`

**Summary**: Delete merchant offer

**Description**: Permanently removes an offer owned by the authenticated merchant from the marketplace.

**Path Parameters**:
- `offer_id`: UUID — Unique identifier of the seller product offer

**Success Response** (`200 OK`):
```json
{
  "message": "Offer successfully deleted",
  "id": "8fa85f64-5717-4562-b3fc-2c963f66afa9"
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication missing or invalid |
| 403 | `FORBIDDEN` | Caller is not a merchant or does not own this offer |
| 404 | `OFFER_NOT_FOUND` | Offer with specified ID does not exist |
| 500 | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

## 6. UI/UX Requirements

- Frontend flow is specified in Spec 006 (`specs/006-seller-dashboard-frontend/`).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Merchant submits empty PATCH body | Return HTTP 400 with code `EMPTY_UPDATE` |
| Merchant attempts to update offer of another seller | Return HTTP 403 with code `FORBIDDEN` |
| Merchant attempts to delete non-existent offer ID | Return HTTP 404 with code `OFFER_NOT_FOUND` |
| Offer is in buyer carts when deleted | Cascade remove from `cart_items` to avoid database FK violations |
| Stock set to 0 via update | Valid update; offer becomes out-of-stock in product catalog |

## 8. Out of Scope

- ❌ Deleting the catalog product itself (products remain in platform catalog even if a seller leaves).
- ❌ Restoring deleted offers (deletion is permanent).

## 9. Constitution Compliance

- ✅ All business logic and ownership checks in FastAPI (§4.1).
- ✅ Endpoint uses `/api/v1/` prefix and OpenAPI tags with summary and schemas (§4.3).
- ✅ Standard error envelope used (§4.4).
- ✅ Role-based check enforces `user_role == "merchant"` (§2).
- ✅ Pytest tests cover partial update, full update, delete, not found, and unauthorized access (§14).

## 10. Open Questions

- None. Scope and contracts are complete.
