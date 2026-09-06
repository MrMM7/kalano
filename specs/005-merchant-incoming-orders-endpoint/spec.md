# Spec: Merchant Incoming Orders and Status Update Endpoints

> **Roadmap Reference**: Phase 6, Step 6.5 — Merchant: view incoming orders
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 005 of 006 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Merchant Incoming Orders and Status Update Endpoints provide merchants with visibility and fulfillment management for customer purchases involving their listings. Merchants can view all incoming orders where they are the fulfilling seller, complete with ordered items, quantities, buyer shipping addresses, and status. When the merchant finishes packing an item, they mark it as ready for pickup by transitioning its delivery status from pending to confirmed, signaling the logistics team to initiate courier pickup.

## 2. Dependencies

- Depends on: `specs/001-merchant-list-offers-endpoint/` (provides base router and service modules). Utilizes existing database schema for `user_orders`, `products`, and `users`.

## 3. Functional Requirements

### 3.1 — Authorization & Role Verification
- [ ] Both endpoints require authentication via `get_current_user`.
- [ ] The user must possess the `merchant` role. Non-merchants receive HTTP 403 Forbidden with error code `FORBIDDEN`.
- [ ] Unauthenticated requests receive HTTP 401 Unauthorized.

### 3.2 — List Incoming Orders (`GET /api/v1/dashboard/orders`)
- [ ] Query `user_orders` table where `seller_id` matches the authenticated merchant's user ID.
- [ ] Support an optional query parameter `status` to filter results by delivery status (e.g., `?status=pending`).
- [ ] Join with `products` table on `product_id` to retrieve product name, brand, and image URL.
- [ ] Join with `users` table on `buyer_id` to retrieve the buyer's display name.
- [ ] Return fields:
  - `id`: Integer order identifier.
  - `product_id`: UUID of the product.
  - `product_name`: String title of the product.
  - `product_brand`: String brand name.
  - `product_image_url`: String URL or null.
  - `bought_price`: Float purchase price per unit.
  - `quantity`: Integer purchase count.
  - `total_price`: Float (`bought_price * quantity`).
  - `status`: String representing delivery progress. The `delivery_types` status accepts: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`.
  - `address`: String delivery destination.
  - `buyer_name`: String display name of the customer.
  - `created_at`: Timestamp of order placement.
- [ ] Results ordered by `created_at` descending.

### 3.3 — Update Order Status (`PATCH /api/v1/dashboard/orders/{order_id}/status`)
- [ ] Path parameter: `order_id` (integer).
- [ ] Accepts JSON payload with `status` field.
- [ ] Verify that the order exists. If not found, return HTTP 404 Not Found with error code `ORDER_NOT_FOUND`.
- [ ] Verify that `order.seller_id == current_user.id`. If not owned by the merchant, return HTTP 403 Forbidden with error code `FORBIDDEN`.
- [ ] Enforce merchant status transition rules:
  - The requested `status` in payload must strictly be `confirmed`.
  - The current order status in the database must strictly be `pending`.
  - Any attempt to transition to any status other than `confirmed`, or any attempt to modify an order whose status is not `pending`, must be rejected with HTTP 400 Bad Request and error code `INVALID_STATUS_TRANSITION`.
- [ ] Update order row `delivery_types` column to `confirmed`.
- [ ] Return the updated order details with HTTP 200 OK.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated merchant can retrieve all orders placed for their offers, receiving HTTP 200 with an array of orders containing product and buyer details.
- [ ] AC2: Filtering by `?status=pending` returns only pending orders for the merchant.
- [ ] AC3: Merchant can mark a `pending` order as `confirmed` via `PATCH /api/v1/dashboard/orders/{order_id}/status` with `{"status": "confirmed"}` and receive HTTP 200.
- [ ] AC4: Attempting to set status to anything other than `confirmed` (e.g. `shipped` or `delivered`) returns HTTP 400 with `INVALID_STATUS_TRANSITION`.
- [ ] AC5: Attempting to update an order that is already `confirmed`, `shipped`, or `delivered` returns HTTP 400 with `INVALID_STATUS_TRANSITION`.
- [ ] AC6: Attempting to view or update orders belonging to another merchant returns HTTP 403 Forbidden.
- [ ] AC7: Non-merchant roles receive HTTP 403 Forbidden.

## 5. API Contract

### `GET /api/v1/dashboard/orders`

**Summary**: Retrieve merchant incoming orders

**Description**: Returns all customer orders where the authenticated merchant is the seller. Supports filtering by delivery status.

**Query Parameters**:
- `status`: string (optional) — Filter by delivery status: pending, confirmed, shipped, delivered, cancelled, returned

**Success Response** (`200 OK`):
```json
[
  {
    "id": 101,
    "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "product_name": "Wireless Noise-Cancelling Headphones",
    "product_brand": "SoundWave",
    "product_image_url": "https://example.com/images/headphones.jpg",
    "bought_price": 149.99,
    "quantity": 1,
    "total_price": 149.99,
    "status": "pending",
    "address": "742 Evergreen Terrace, Springfield",
    "buyer_name": "Jane Buyer",
    "created_at": "2026-09-06T14:30:00Z"
  }
]
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication credentials missing or invalid |
| 403 | `FORBIDDEN` | User does not have the merchant role |
| 500 | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

---

### `PATCH /api/v1/dashboard/orders/{order_id}/status`

**Summary**: Update merchant order status (Mark ready for pickup)

**Description**: Transitions an incoming customer order from pending to confirmed, signaling that the package is packed and ready for logistics courier pickup.

**Path Parameters**:
- `order_id`: integer — Order identity number

**Request Body**:
```json
{
  "status": "confirmed"
}
```

**Success Response** (`200 OK`):
```json
{
  "id": 101,
  "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "product_name": "Wireless Noise-Cancelling Headphones",
  "product_brand": "SoundWave",
  "product_image_url": "https://example.com/images/headphones.jpg",
  "bought_price": 149.99,
  "quantity": 1,
  "total_price": 149.99,
  "status": "confirmed",
  "address": "742 Evergreen Terrace, Springfield",
  "buyer_name": "Jane Buyer",
  "created_at": "2026-09-06T14:30:00Z"
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_STATUS_TRANSITION` | Status transition is not allowed for merchants |
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication credentials missing or invalid |
| 403 | `FORBIDDEN` | User is not a merchant or does not own this order |
| 404 | `ORDER_NOT_FOUND` | Order with specified ID does not exist |
| 422 | — | Request schema validation failure |
| 500 | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

## 6. UI/UX Requirements

- Frontend flow is specified in Spec 006 (`specs/006-seller-dashboard-frontend/`).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Merchant has no incoming orders | Return HTTP 200 with empty list `[]` |
| Filter query `?status=nonexistent` | Return HTTP 200 with empty list `[]` |
| Merchant attempts to mark an already `confirmed` order | Return HTTP 400 with `INVALID_STATUS_TRANSITION` |
| Merchant attempts to mark order as `shipped` or `delivered` | Return HTTP 400 with `INVALID_STATUS_TRANSITION` (logistics staff handles downstream delivery) |
| Order belongs to another merchant | Return HTTP 403 `FORBIDDEN` |
| Order ID does not exist | Return HTTP 404 `ORDER_NOT_FOUND` |

## 8. Out of Scope

- ❌ Updating status to `shipped` or `delivered` (handled exclusively by Logistics in Phase 7).
- ❌ Order cancellations or buyer refunds (handled in logistics or customer service workflows).

## 9. Constitution Compliance

- ✅ All query and state transition logic resides in FastAPI (§4.1).
- ✅ Merchant status transition strictly bounded: can only mark `pending` -> `confirmed` (§15).
- ✅ Standard error envelope used (§4.4).
- ✅ Role-based check enforces `user_role == "merchant"` (§2).
- ✅ Pytest tests cover listing, filtering, successful transition, and invalid transitions (§14).

## 10. Open Questions

- None. General status update approach with merchant transition rules confirmed.
