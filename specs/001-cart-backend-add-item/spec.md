# Spec: Cart Backend — Add Item Endpoint

> **Roadmap Reference**: Phase 4, Step 4.1 — Cart backend: add item
> **Branch**: `feat/cart`
> **Spec**: 001 of 004 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

This feature introduces the backend endpoint allowing authenticated buyers to add product offers into their persistent server-side shopping cart.

In Kalano's multi-vendor architecture, items added to the cart are tied to a specific merchant's offer represented by `seller_product_id` in the `seller_products` table. Each buyer owns at most one active cart recorded in the `carts` table, which holds one or more entries in the `cart_items` table.

This endpoint handles:
- Locating or creating a cart for the authenticated buyer.
- Validating the requested seller product offer exists and has sufficient stock.
- Adding a new cart item if the offer is not yet in the cart.
- Incrementing the item quantity if the offer already exists in the cart, verifying the cumulative quantity does not exceed available inventory.
- Returning the updated cart item details along with standard error envelopes for validation failures.

## 2. Dependencies

- Depends on: Phase 2 Authentication (`specs/` completed) — relies on `get_current_user` FastAPI dependency and `users` table.
- Depends on: Phase 3 Product Catalog (`specs/` completed) — relies on `products` and `seller_products` tables.
- Prior specs in Phase 4: None (this is the first spec in Phase 4).

## 3. Functional Requirements

### 3.1 — Authentication & Authorization

- [ ] The endpoint requires authentication via httpOnly cookie `kalano_token` or `Authorization: Bearer <token>` header through `get_current_user`.
- [ ] Only users with the `buyer` role may add items to cart. If an authenticated user has the `merchant` or `logistics` role, return HTTP 403 Forbidden with error code `FORBIDDEN_ROLE`.
- [ ] Unauthenticated requests must return HTTP 401 Unauthorized with standard error envelope.

### 3.2 — Cart Creation & Retrieval

- [ ] Check if a row exists in `carts` where `user_id` matches the authenticated buyer's UUID.
- [ ] If no cart exists, automatically create a new row in `carts` with `user_id` set to the buyer's ID and `created_at` timestamp.
- [ ] If a cart already exists, reuse the existing cart row ID.

### 3.3 — Offer Validation & Stock Verification

- [ ] Validate that the provided `seller_product_id` exists in `seller_products`. If it does not exist, return HTTP 404 Not Found with error code `SELLER_PRODUCT_NOT_FOUND`.
- [ ] Validate that the requested `quantity` is a positive integer greater than or equal to 1. If not, return HTTP 422 Unprocessable Entity.
- [ ] Check whether the seller product is already present in `cart_items` for this cart:
  - If NOT present: verify that `quantity <= stock`. If requested quantity exceeds available stock, return HTTP 400 Bad Request with error code `INSUFFICIENT_STOCK`.
  - If ALREADY present: calculate prospective quantity (`existing_quantity + requested_quantity`). Verify that `prospective_quantity <= stock`. If prospective quantity exceeds available stock, return HTTP 400 Bad Request with error code `INSUFFICIENT_STOCK`.

### 3.4 — Cart Item Persistence

- [ ] If the item does not exist in `cart_items` for this cart, insert a new record linking `cart_id`, `seller_product_id`, and `quantity`.
- [ ] If the item already exists in `cart_items`, update the existing record with the new cumulative `quantity`.
- [ ] Return HTTP 201 Created on new item addition, or HTTP 200 OK on existing item increment.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated buyer can add a valid seller product offer to their cart with quantity 1, resulting in a created cart and cart item.
- [ ] AC2: Adding an item that already exists in the cart increases its quantity by the requested amount.
- [ ] AC3: Attempting to add an item with quantity exceeding available stock returns HTTP 400 with `INSUFFICIENT_STOCK` and details the maximum available stock.
- [ ] AC4: Attempting to add an item when cumulative quantity exceeds available stock returns HTTP 400 with `INSUFFICIENT_STOCK`.
- [ ] AC5: Non-existent `seller_product_id` returns HTTP 404 with `SELLER_PRODUCT_NOT_FOUND`.
- [ ] AC6: Requests without valid authentication credentials return HTTP 401.
- [ ] AC7: Requests from users with roles other than `buyer` return HTTP 403.
- [ ] AC8: OpenAPI documentation for `POST /api/v1/cart/items` contains summary, description, tag `Cart`, typed Pydantic models with field descriptions, and documented error responses.

## 5. API Contract

### `POST /api/v1/cart/items`

**Summary**: Add item to cart

**Description**: Adds a merchant product offer to the authenticated buyer's cart. Creates a cart if one does not exist. If the offer is already in the cart, increases the quantity. Validates available inventory stock before persisting.

**Tag**: `Cart`

**Security**: Bearer Token or `kalano_token` cookie

**Request Body**:
```json
{
  "seller_product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quantity": 1
}
```

**Success Response** (`200 OK` or `201 Created`):
```json
{
  "id": 1,
  "cart_id": 1,
  "seller_product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quantity": 2,
  "created_at": "2026-09-05T20:00:00Z"
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `INSUFFICIENT_STOCK` | Requested quantity exceeds available seller product inventory |
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Missing or invalid authentication credentials |
| 403 | `FORBIDDEN_ROLE` | Authenticated user is not a buyer |
| 404 | `SELLER_PRODUCT_NOT_FOUND` | The specified seller product offer does not exist |
| 422 | `VALIDATION_ERROR` | Malformed request body or quantity less than 1 |

All error responses strictly follow the standard envelope format:
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Only 3 units available in stock. Cannot add 5 units."
  }
}
```

## 6. UI/UX Requirements

_N/A — This is a pure backend API endpoint spec. Frontend integration is covered in Spec 003 and Spec 004._

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Buyer has no existing cart in `carts` table | Transparently create a new cart row for the user, then add the item. Return HTTP 201 Created. |
| Buyer already has a cart in `carts` table | Query existing cart by `user_id`, insert or update `cart_items`. |
| Seller product exists but `stock == 0` | Reject immediately with HTTP 400 `INSUFFICIENT_STOCK`. |
| Existing cart item quantity is 3, stock is 4, user adds 2 | Prospective total is 5 > 4. Reject with HTTP 400 `INSUFFICIENT_STOCK`. Existing cart quantity remains 3. |
| Seller product ID is not a valid UUID format | FastAPI/Pydantic returns HTTP 422 with standard validation error envelope. |
| Quantity is 0 or negative integer | FastAPI/Pydantic returns HTTP 422 validation error envelope. |
| Concurrent requests adding items to a newly created cart | Query cart row idempotently; handle or prevent duplicate cart creation for the same buyer. |

## 8. Out of Scope

- ❌ Viewing cart contents or calculating cart totals (covered in Spec 002).
- ❌ Modifying quantities directly via PATCH or deleting items via DELETE (covered in Spec 002).
- ❌ Frontend cart page UI (covered in Spec 003).
- ❌ Wiring UI buttons on product detail page (covered in Spec 004).
- ❌ Order placement and checkout stock decrements (covered in Phase 5).

## 9. Constitution Compliance

- ✅ §4.1 Strict Backend Separation: All cart business logic and database access reside exclusively in FastAPI services.
- ✅ §4.2 Authentication: Relies on `get_current_user` reading `kalano_token` httpOnly cookie or Bearer token.
- ✅ §4.3 API Communication: Route prefixed with `/api/v1/`, OpenAPI tag `Cart`, Pydantic models with field descriptions and explicit examples.
- ✅ §4.4 Error Handling: Standard `{ "error": { "code": "...", "message": "..." } }` error envelope for all error responses.
- ✅ §5 Database Schema: Uses existing predefined tables `carts` and `cart_items` without migration scripts.
- ✅ §7 Naming Conventions: Snake_case Python files and kebab-case URL path `/api/v1/cart/items`.
- ✅ §14 Backend Testing: Comprehensive Pytest suite covering success, duplicate/increment, stock exhaustion, non-existent offers, and authorization.

## 10. Open Questions

- None. Clarification confirmed: 400 Bad Request with `INSUFFICIENT_STOCK` is returned when requested quantity exceeds available stock, leaving cart unchanged.
