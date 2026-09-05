# Spec: Order History Endpoint

> **Roadmap Reference**: Phase 5, Step 5.3 — Order history endpoint
> **Branch**: `feat/checkout-and-orders`
> **Spec**: 003 of 004 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Order History Endpoint provides buyers with a chronological record of all orders they have placed on Kalano. It queries the `user_orders` table filtered by the authenticated user's ID, enriches each order record with joined product information (name, brand, image URL) and seller information (seller display name), calculates the order item subtotal, and returns the list sorted by creation timestamp in descending order.

## 2. Dependencies

- Depends on: `specs/001-checkout-endpoint/` — Uses the `user_orders` records created during checkout.
- Depends on: Existing authentication dependencies (`get_current_user`) and database client (`get_supabase_client`).

## 3. Functional Requirements

### 3.1 — Authentication and Role Authorization
- [ ] Endpoint must require an active authentication session via JWT cookie or header.
- [ ] Endpoint must verify that the user possesses the `buyer` role.
- [ ] If unauthenticated, reject with HTTP 401 Unauthorized.
- [ ] If authenticated as a non-buyer (e.g., `merchant` or `logistics`), reject with HTTP 403 Forbidden (`FORBIDDEN`).

### 3.2 — Query and Data Filtering
- [ ] Query `user_orders` where `buyer_id` equals the authenticated user's ID.
- [ ] Order records by `created_at` descending (most recent orders first).
- [ ] If the buyer has not placed any orders, return an empty list with total count 0 and HTTP 200 OK.

### 3.3 — Data Enrichment
- [ ] For each order, resolve product metadata from `products` table: `name`, `brand`, and `image_url`.
- [ ] For each order, resolve seller display name from `users` table via `seller_id`.
- [ ] Calculate `subtotal` for each order line as `bought_price` multiplied by `quantity`.
- [ ] Return the current order fulfillment state in the `delivery_types` field. The `delivery_types` enum accepts values: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated buyer with existing orders sends `GET /api/v1/orders` and receives HTTP 200 OK with their complete order list sorted newest to oldest.
- [ ] AC2: Each returned order object contains `id`, `product_id`, `product_name`, `product_brand`, `product_image_url`, `seller_id`, `seller_name`, `bought_price`, `quantity`, `subtotal`, `delivery_types`, `address`, and `created_at`.
- [ ] AC3: Authenticated buyer with no past orders receives HTTP 200 OK with `{"orders": [], "total_orders": 0}`.
- [ ] AC4: Unauthenticated request returns HTTP 401 Unauthorized.
- [ ] AC5: Merchant or logistics user sending `GET /api/v1/orders` receives HTTP 403 Forbidden with code `FORBIDDEN`.

## 5. API Contract

### `GET /api/v1/orders`

**Summary**: List order history for current buyer

**Description**: Retrieves all orders placed by the currently authenticated buyer, ordered from most recent to oldest. Each order entry includes detailed product details, seller identity, purchase price, quantity, delivery address, and current delivery status.

**Query Parameters**: None

**Success Response** (`200 OK`):
```json
{
  "orders": [
    {
      "id": 105,
      "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "product_name": "Ergonomic Mechanical Keyboard",
      "product_brand": "KeyTech",
      "product_image_url": "https://example.com/keyboard.jpg",
      "seller_id": "7ca85f64-5717-4562-b3fc-2c963f66af77",
      "seller_name": "KeyTech Official",
      "bought_price": 129.99,
      "quantity": 1,
      "subtotal": 129.99,
      "delivery_types": "pending",
      "address": "123 Main St, Suite 400, Cityville, CA 94105",
      "created_at": "2026-09-05T21:00:00Z"
    }
  ],
  "total_orders": 1
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | User is not logged in or JWT token is invalid |
| 403 | `FORBIDDEN` | User does not have the buyer role |

## 6. UI/UX Requirements

_Not applicable for this backend endpoint spec. See Spec 004 for UI/UX requirements for the order history page._

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Buyer has 0 orders in database | Return HTTP 200 with empty list `orders: []` and `total_orders: 0` |
| Product referenced in order was subsequently edited | The order record preserves its historical `bought_price` and displays current product name and brand |
| Seller profile deleted or inactive | Handle gracefully with fallback seller display name "Unknown Merchant" if not found |
| Nullable address in historical records | Return empty string or null for address |
| Merchant attempts to query buyer orders | Return HTTP 403 with `FORBIDDEN` code |

## 8. Out of Scope

- ❌ Pagination or filtering by date range (can be introduced in polish phases).
- ❌ Order cancellation or return initiation endpoints (handled in logistics/merchant flows).
- ❌ Invoice or PDF receipt generation.

## 9. Constitution Compliance

- ✅ All business logic and queries reside exclusively in FastAPI (§4.1).
- ✅ Access controlled via JWT dependency with role validation (§4.2).
- ✅ Endpoint prefixed with `/api/v1/orders` and documented with OpenAPI summary and description (§4.3).
- ✅ Standard error envelope returned on failure (§4.4).
- ✅ Reads from predefined `user_orders`, `products`, and `users` tables (§5).
- ✅ Custom enum `delivery_types` documented in pure text (§5).
- ✅ Unit tests written in Pytest for all outcomes (§14).

## 10. Open Questions

- None. Requirements confirmed.
