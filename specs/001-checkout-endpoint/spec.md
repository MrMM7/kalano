# Spec: Checkout Endpoint

> **Roadmap Reference**: Phase 5, Step 5.1 — Checkout endpoint
> **Branch**: `feat/checkout-and-orders`
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

The Checkout Endpoint handles the conversion of items in an authenticated buyer's shopping cart into placed orders. It verifies current stock availability across all cart items, validates the delivery address, decrements inventory atomically, records each item as a new row in the `user_orders` table with initial delivery status set to `pending`, and empties the buyer's cart upon success. It also allows optional persistence of the delivery address to the user's profile.

## 2. Dependencies

- Depends on: None (this is the first spec in Phase 5; relies on existing cart and user infrastructure established in Phase 2 and Phase 4).

## 3. Functional Requirements

### 3.1 — Authentication and Authorization
- [ ] Only authenticated users can access the endpoint.
- [ ] The user must possess the `buyer` role. Requests from merchants or logistics users must be rejected with HTTP 403 Forbidden.
- [ ] Unauthenticated requests must be rejected with HTTP 401 Unauthorized.

### 3.2 — Cart Validation
- [ ] Retrieve the active cart for the authenticated buyer.
- [ ] If no cart exists or if the cart contains zero items, reject the request with HTTP 400 Bad Request (`EMPTY_CART`).

### 3.3 — Atomic Inventory & Stock Verification
- [ ] Inspect each item in the buyer's cart against current records in the `seller_products` table.
- [ ] Verify that every item has available stock greater than or equal to the requested quantity.
- [ ] If any single item has insufficient stock, abort the entire transaction. No orders may be created, no stock decremented, and the cart must remain untouched. Return HTTP 400 Bad Request (`INSUFFICIENT_STOCK`).

### 3.4 — Order Creation and Stock Decrement
- [ ] For each valid cart item, create a record in the `user_orders` table.
- [ ] Populate `product_id` with the UUID of the parent product.
- [ ] Populate `bought_price` with the price per unit recorded on the seller product offer at the moment of checkout.
- [ ] Populate `buyer_id` with the authenticated buyer's user UUID.
- [ ] Populate `delivery_types` with the initial status value `pending`. The `delivery_types` enum accepts: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`.
- [ ] Populate `address` with the shipping address provided in the checkout request payload.
- [ ] Populate `seller_id` with the merchant seller's user UUID.
- [ ] Populate `quantity` with the ordered item quantity.
- [ ] Decrement the `stock` column in `seller_products` by the ordered quantity for each item.

### 3.5 — User Profile Address Update
- [ ] Accept an optional boolean flag `save_address` (defaulting to false) in the request payload.
- [ ] When `save_address` is true, update the `address` column in the `users` table for the authenticated user with the submitted address string.

### 3.6 — Cart Cleanup
- [ ] Delete all `cart_items` rows associated with the buyer's cart upon successful order creation and stock decrement.
- [ ] Return a response containing the list of created orders, the total count of orders, and the grand total price.

## 4. Acceptance Criteria

- [x] AC1: Authenticated buyer with 2 items in cart successfully checks out; 2 `user_orders` rows are created with status `pending`, seller stocks are reduced by respective quantities, cart items are deleted, and HTTP 200 is returned with order summaries.
- [x] AC2: If cart is empty, checkout returns HTTP 400 with code `EMPTY_CART` and message "Cannot checkout with an empty cart."
- [x] AC3: If any cart item requests a quantity exceeding current seller product stock, checkout returns HTTP 400 with code `INSUFFICIENT_STOCK` identifying the unavailable item; no database changes occur.
- [x] AC4: If user role is `merchant` or `logistics`, endpoint returns HTTP 403 with code `FORBIDDEN` and message "Only buyers can place orders."
- [x] AC5: When `save_address` is true, the user's record in the `users` table is updated with the new address value.
- [x] AC6: Missing or blank address string in payload returns HTTP 422 Unprocessable Entity.

## 5. API Contract

### `POST /api/v1/checkout`

**Summary**: Process buyer checkout and create orders

**Description**: Converts all items in the authenticated buyer's cart into placed orders. Validates available stock for every item atomically, decrements stock in `seller_products`, writes rows into `user_orders` with initial `pending` delivery status, optionally updates the buyer's profile address, and clears the cart upon completion.

**Request Body**:
```json
{
  "address": "string — Required delivery address (non-empty)",
  "save_address": "boolean — Optional flag to save this address to the user profile, default false"
}
```

**Success Response** (`200 OK`):
```json
{
  "order_ids": [101, 102],
  "orders": [
    {
      "id": 101,
      "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "product_name": "Ergonomic Mechanical Keyboard",
      "seller_id": "7ca85f64-5717-4562-b3fc-2c963f66af77",
      "seller_name": "KeyTech Store",
      "bought_price": 129.99,
      "quantity": 1,
      "subtotal": 129.99,
      "delivery_types": "pending",
      "address": "123 Main St, Suite 400, Cityville, CA 94105",
      "created_at": "2026-09-05T20:00:00Z"
    }
  ],
  "total_items": 1,
  "total_price": 129.99,
  "message": "Order placed successfully."
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `EMPTY_CART` | Cart has no items to check out |
| 400 | `INSUFFICIENT_STOCK` | One or more items exceed currently available inventory |
| 401 | `UNAUTHORIZED` | Authentication token is missing or invalid |
| 403 | `FORBIDDEN` | Authenticated user is not a buyer |
| 422 | `VALIDATION_ERROR` | Malformed body or address is empty/whitespace |

## 6. UI/UX Requirements

_Not applicable for this backend endpoint spec. See Spec 002 for UI/UX requirements for the checkout page._

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Cart has 0 items | Return HTTP 400 with `EMPTY_CART` error envelope |
| Buyer has no existing cart row | Return HTTP 400 with `EMPTY_CART` error envelope |
| Concurrent stock decrease leaves insufficient stock | Stock check detects stock < requested quantity; aborts with HTTP 400 `INSUFFICIENT_STOCK` |
| Multiple items from different sellers | Create separate `user_orders` row for each cart item with matching `seller_id`, atomic stock decrement for each |
| Address contains only whitespace | Pydantic validator rejects with HTTP 422 validation error |
| Merchant attempts to checkout | Return HTTP 403 with `FORBIDDEN` error envelope |
| Supabase order insertion failure | Catch exception, do not clear cart, return HTTP 500 error envelope with safe error message |

## 8. Out of Scope

- ❌ Real payment gateway processing (payment is strictly simulated per constitution §1).
- ❌ Order cancellation or status modifications by buyer (handled by merchant/logistics in later phases).
- ❌ Discount codes, coupons, or tax calculations.
- ❌ Email or SMS dispatch notifications.

## 9. Constitution Compliance

- ✅ All checkout business logic and database queries reside exclusively in FastAPI (§4.1).
- ✅ Access controlled via JWT dependency, ensuring buyer role validation (§4.2).
- ✅ Endpoint prefixed with `/api/v1/checkout` and fully documented in OpenAPI (§4.3).
- ✅ Standard error envelope returned for all client errors (§4.4).
- ✅ No database migration files; uses predefined `user_orders`, `seller_products`, `carts`, and `cart_items` tables (§5).
- ✅ Custom enum `delivery_types` uses status value `pending` (§5).
- ✅ Unit tests implemented in Pytest for all outcomes (§14).

## 10. Open Questions

- None. All scope and requirements were confirmed during phase alignment.
