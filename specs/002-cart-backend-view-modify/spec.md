# Spec: Cart Backend — View & Modify Endpoints

> **Roadmap Reference**: Phase 4, Step 4.2 — Cart backend: view & modify
> **Branch**: `feat/cart`
> **Spec**: 002 of 004 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

This feature completes the core cart management capabilities in the FastAPI backend by providing endpoints to:
1. View the buyer's current shopping cart (`GET /api/v1/cart`), enriched with product details, seller information, unit pricing, item quantity, line item subtotals, and cumulative cart total.
2. Directly update the quantity of an existing cart item (`PATCH /api/v1/cart/items/{item_id}`), enforcing inventory stock limits.
3. Remove an item entirely from the cart (`DELETE /api/v1/cart/items/{item_id}`).

Together with Spec 001, this provides a complete RESTful API suite for managing cart contents before checkout.

## 2. Dependencies

- Depends on: `specs/001-cart-backend-add-item/` — relies on `cart_service.py`, `models/cart.py`, and `routers/cart.py` introduced in Step 4.1.

## 3. Functional Requirements

### 3.1 — View Cart (`GET /api/v1/cart`)

- [ ] Requires authentication via `get_current_user` dependency.
- [ ] Accessible only to users with the `buyer` role. Non-buyers receive HTTP 403 Forbidden with code `FORBIDDEN_ROLE`.
- [ ] If the buyer has no record in the `carts` table, return an empty cart representation with `items: []`, `total_price: 0.0`, and `total_items: 0`.
- [ ] If the buyer has a cart, fetch all associated `cart_items` records joined with:
  - `seller_products` (to obtain current `price`, `stock`, and `estimated_delivery_days`).
  - `products` (to obtain `name`, `brand`, `description`, `image_url`).
  - `users` (to obtain seller's `display_name`).
- [ ] For each cart item, compute `subtotal = price * quantity`.
- [ ] Compute overall cart `total_price = sum(item.subtotal)` and `total_items = sum(item.quantity)`.
- [ ] Return the full cart payload sorted by item creation date or item ID.

### 3.2 — Update Cart Item Quantity (`PATCH /api/v1/cart/items/{item_id}`)

- [ ] Requires authentication and `buyer` role verification.
- [ ] Accepts request body containing target `quantity` (positive integer, minimum 1).
- [ ] Verify that `item_id` exists in `cart_items` AND belongs to the current authenticated buyer's cart.
  - If the item does not exist or belongs to another user's cart, return HTTP 404 Not Found with code `CART_ITEM_NOT_FOUND`.
- [ ] Validate requested `quantity` against the seller product's current available stock in `seller_products`.
  - If requested `quantity > stock`, return HTTP 400 Bad Request with code `INSUFFICIENT_STOCK` and available stock in message.
- [ ] Update `quantity` in `cart_items` and return the updated cart item or full cart summary.

### 3.3 — Delete Cart Item (`DELETE /api/v1/cart/items/{item_id}`)

- [ ] Requires authentication and `buyer` role verification.
- [ ] Verify that `item_id` exists in `cart_items` and belongs to the authenticated buyer's cart.
  - If not found or belongs to another user's cart, return HTTP 404 Not Found with code `CART_ITEM_NOT_FOUND`.
- [ ] Delete the row from `cart_items`.
- [ ] Return HTTP 200 OK with success confirmation message, or HTTP 204 No Content.

## 4. Acceptance Criteria

- [ ] AC1: `GET /api/v1/cart` returns empty list and 0 total when cart has no items.
- [ ] AC2: `GET /api/v1/cart` returns all items with product name, brand, seller name, unit price, stock, delivery estimate, quantity, and line subtotal.
- [ ] AC3: `PATCH /api/v1/cart/items/{item_id}` updates quantity when valid and within stock limits.
- [ ] AC4: `PATCH /api/v1/cart/items/{item_id}` returns HTTP 400 with `INSUFFICIENT_STOCK` when requested quantity exceeds available inventory.
- [ ] AC5: `PATCH` or `DELETE` for an `item_id` that does not exist or belongs to another user returns HTTP 404 with `CART_ITEM_NOT_FOUND`.
- [ ] AC6: `DELETE /api/v1/cart/items/{item_id}` successfully removes the item from the cart.
- [ ] AC7: Unauthenticated requests to all three endpoints return HTTP 401.
- [ ] AC8: Authenticated requests from non-buyers (e.g. merchants) return HTTP 403.
- [ ] AC9: OpenAPI documentation includes summaries, descriptions, tags, and models for all three endpoints.

## 5. API Contract

### `GET /api/v1/cart`

**Summary**: Get current user cart

**Description**: Retrieves the active shopping cart for the authenticated buyer, including detailed item listings, merchant information, subtotals, and total price.

**Tag**: `Cart`

**Success Response** (`200 OK`):
```json
{
  "id": 1,
  "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "items": [
    {
      "id": 10,
      "seller_product_id": "8fa85f64-5717-4562-b3fc-2c963f66af11",
      "product_id": "9fa85f64-5717-4562-b3fc-2c963f66af22",
      "product_name": "Wireless Noise-Canceling Headphones",
      "product_brand": "AudioTech",
      "product_image_url": "https://example.com/product.jpg",
      "seller_id": "4fa85f64-5717-4562-b3fc-2c963f66af33",
      "seller_name": "BestAudio Official",
      "unit_price": 199.99,
      "stock": 15,
      "estimated_delivery_days": 3,
      "quantity": 2,
      "subtotal": 399.98,
      "created_at": "2026-09-05T20:00:00Z"
    }
  ],
  "total_items": 2,
  "total_price": 399.98
}
```

---

### `PATCH /api/v1/cart/items/{item_id}`

**Summary**: Update cart item quantity

**Description**: Modifies the quantity of an existing item in the authenticated buyer's cart. Validates available stock.

**Tag**: `Cart`

**Path Parameters**:
- `item_id`: integer — The primary key ID of the cart item to update.

**Request Body**:
```json
{
  "quantity": 3
}
```

**Success Response** (`200 OK`):
```json
{
  "id": 10,
  "cart_id": 1,
  "seller_product_id": "8fa85f64-5717-4562-b3fc-2c963f66af11",
  "quantity": 3,
  "created_at": "2026-09-05T20:00:00Z"
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `INSUFFICIENT_STOCK` | Requested quantity exceeds available stock |
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication credentials missing or invalid |
| 403 | `FORBIDDEN_ROLE` | User is not a buyer |
| 404 | `CART_ITEM_NOT_FOUND` | Cart item not found or does not belong to user |
| 422 | `VALIDATION_ERROR` | Quantity less than 1 |

---

### `DELETE /api/v1/cart/items/{item_id}`

**Summary**: Remove item from cart

**Description**: Deletes a specific item from the authenticated buyer's cart.

**Tag**: `Cart`

**Path Parameters**:
- `item_id`: integer — The primary key ID of the cart item to remove.

**Success Response** (`200 OK`):
```json
{
  "message": "Cart item removed successfully."
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication credentials missing or invalid |
| 403 | `FORBIDDEN_ROLE` | User is not a buyer |
| 404 | `CART_ITEM_NOT_FOUND` | Cart item not found or does not belong to user |

## 6. UI/UX Requirements

_N/A — Pure backend endpoints. Frontend consuming these endpoints is defined in Spec 003._

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Buyer has never added any item and calls `GET /api/v1/cart` | Returns HTTP 200 with empty items list, total items 0, and total price 0.0. Does not error. |
| Buyer updates item quantity to 0 via PATCH | Pydantic validation rejects with HTTP 422 (quantity must be `>= 1`). To delete, client must call DELETE. |
| Buyer attempts to modify another buyer's cart item | Query filters by both `item_id` and buyer's `cart_id`. Returns HTTP 404 `CART_ITEM_NOT_FOUND` to prevent ID enumeration. |
| Stock drops between adding and updating | Live check of `seller_products.stock` on PATCH returns HTTP 400 with `INSUFFICIENT_STOCK`. |
| Product or seller was deleted in backend | Handle null joins gracefully without crashing endpoint. |

## 8. Out of Scope

- ❌ Adding new items to cart (covered in Spec 001).
- ❌ Building frontend cart page (covered in Spec 003).
- ❌ Checkout and payment simulation (covered in Phase 5).

## 9. Constitution Compliance

- ✅ §4.1 Strict Backend Separation: All calculations (subtotals, totals, stock checks) run entirely in FastAPI.
- ✅ §4.3 API Standards: All endpoints prefixed with `/api/v1/`, OpenAPI tags, Pydantic schemas with detailed docstrings.
- ✅ §4.4 Consistent Error Envelope: Standard error schema for all error codes (`CART_ITEM_NOT_FOUND`, `INSUFFICIENT_STOCK`, `FORBIDDEN_ROLE`).
- ✅ §5 Schema: Direct query on existing tables `carts`, `cart_items`, `seller_products`, `products`, and `users`.
- ✅ §14 Testing: Full Pytest coverage for all three endpoints including failure and edge cases.

## 10. Open Questions

- None.
