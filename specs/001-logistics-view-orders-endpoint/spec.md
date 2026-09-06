# Spec: Logistics View All Orders Endpoint

> **Roadmap Reference**: Phase 7, Step 7.1 — Logistics: view all orders endpoint
> **Branch**: `feat/logistics-dashboard`
> **Spec**: 001 of 003 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

Kalano's logistics personnel require a centralized view of all customer orders across all merchants on the platform. Unlike merchants who only see items they sell, logistics staff must oversee platform-wide order fulfillment, track seller dispatch status, review delivery destinations, and coordinate courier pickups and deliveries.

This specification defines the backend endpoint `GET /api/v1/logistics/orders` that returns all platform orders enriched with buyer details (shipping address and buyer name), merchant seller details (seller name), product information (title, brand, image URL), pricing/quantity metrics, and current fulfillment status. The endpoint supports optional status-based filtering and requires logistics role authorization.

## 2. Dependencies

- Depends on: None (this is the first spec in Phase 7)
- Builds upon:
  - Database schema table `user_orders` joined with `products` and `users`
  - Authentication dependency `get_current_user` established in Phase 2
  - Constitution role definition for `logistics`

## 3. Functional Requirements

### 3.1 — Authentication & Authorization

- [ ] The endpoint must authenticate requests via the `kalano_token` httpOnly cookie or the `Authorization: Bearer <token>` header.
- [ ] If no token is provided or if the token is invalid/expired, the endpoint must reject the request with HTTP status `401 Unauthorized`.
- [ ] The endpoint must verify that the authenticated user has the `logistics` role.
- [ ] If an authenticated user has any other role (such as `buyer` or `merchant`), the endpoint must reject the request with HTTP status `403 Forbidden` and error code `FORBIDDEN`.

### 3.2 — Query Parameters & Filtering

- [ ] The endpoint must accept an optional query parameter `status` of type string.
- [ ] When `status` is omitted or null, all orders across all statuses must be returned.
- [ ] When `status` is provided, it must be validated against the allowed `delivered_types` values: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, and `returned`.
- [ ] If an unrecognized status parameter is supplied (e.g. `processing`), the endpoint must reject the request with HTTP status `400 Bad Request` and error code `INVALID_STATUS`.
- [ ] When a valid status is provided, only orders whose `delivery_types` match that status must be returned.

### 3.3 — Order Retrieval & Data Enrichment

- [ ] Orders must be ordered chronologically by order placement time (`created_at`) descending (newest orders first).
- [ ] Each order record must include:
  - Order ID: integer identifier from `user_orders.id`
  - Product ID: UUID identifier of the product
  - Product Name: title of the product from `products.name` (fallback to "Unknown Product" if unresolvable)
  - Product Brand: brand name of the product from `products.brand` (fallback to "Unknown Brand" if unresolvable)
  - Product Image URL: image link from `products.image_url` (nullable)
  - Seller ID: UUID identifier of the merchant from `user_orders.seller_id`
  - Seller Name: merchant display name from `users.display_name` (fallback to "Unknown Merchant" if unresolvable)
  - Buyer ID: UUID identifier of the buyer from `user_orders.buyer_id` (nullable)
  - Buyer Name: buyer display name from `users.display_name` (fallback to "Unknown Buyer" if unresolvable or null)
  - Delivery Address: shipping destination address string from `user_orders.address`
  - Bought Price: float unit price captured at purchase from `user_orders.bought_price`
  - Quantity: integer number of units purchased from `user_orders.quantity`
  - Subtotal: calculated total amount for this order line (`bought_price` multiplied by `quantity`), rounded to 2 decimal places
  - Delivery Status: fulfillment status string corresponding to `user_orders.delivery_types`
  - Created At: timestamp string indicating when the order was placed
- [ ] If no orders match the filter or if no orders exist, return an empty array with HTTP status `200 OK`.

## 4. Acceptance Criteria

- [ ] AC1: A request from an unauthenticated caller receives HTTP 401 with standard error envelope (`MISSING_TOKEN` or `INVALID_TOKEN`).
- [ ] AC2: A request from an authenticated buyer or merchant receives HTTP 403 with standard error envelope (`FORBIDDEN`).
- [ ] AC3: A request from an authenticated user with `user_role` equal to `logistics` receives HTTP 200 with an array of enriched order objects.
- [ ] AC4: Providing `?status=pending` returns only orders whose delivery status is `pending`.
- [ ] AC5: Providing an invalid status query parameter like `?status=invalid_status` returns HTTP 400 with code `INVALID_STATUS`.
- [ ] AC6: Each returned order object contains correct product details, merchant name, buyer name, shipping address, and calculated line subtotal.
- [ ] AC7: Automated pytest tests verify all authentication checks, role restrictions, filtering scenarios, and data shape contracts.

## 5. API Contract

### `GET /api/v1/logistics/orders`

**Summary**: Retrieve all platform orders for logistics management

**Description**: Returns all customer orders across all merchants and buyers, enriched with seller information, customer delivery addresses, product details, and fulfillment statuses. Supports optional filtering by order delivery status. Access is restricted strictly to users with the logistics role.

**Query Parameters**:
- `status` (string, optional): Filter orders by fulfillment status. Allowed values: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `returned`.

**Request Headers / Cookies**:
- Cookie: `kalano_token=<jwt>` or Header: `Authorization: Bearer <jwt>`

**Success Response** (`200 OK`):
```json
[
  {
    "id": 101,
    "product_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "product_name": "Ergonomic Mechanical Keyboard",
    "product_brand": "KeyTech",
    "product_image_url": "https://example.com/keyboard.png",
    "seller_id": "7ca85f64-5717-4562-b3fc-2c963f66af77",
    "seller_name": "KeyTech Official Store",
    "buyer_id": "4da85f64-5717-4562-b3fc-2c963f66af11",
    "buyer_name": "Jane Buyer",
    "address": "456 Oak Avenue, Apt 2B, Metropolis, NY 10001",
    "bought_price": 129.99,
    "quantity": 2,
    "subtotal": 259.98,
    "delivery_types": "pending",
    "created_at": "2026-09-06T14:30:00Z"
  }
]
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_STATUS` | Query parameter status does not match allowed delivery types |
| 401 | `MISSING_TOKEN` | Authentication cookie or Bearer token is missing |
| 401 | `INVALID_TOKEN` | Authentication token is invalid, tampered, or expired |
| 403 | `FORBIDDEN` | Authenticated user does not possess the logistics role |
| 500 | `INTERNAL_SERVER_ERROR` | Database query failure or unexpected server error |

## 6. UI/UX Requirements

This spec covers the backend API only. Frontend integration will be specified in Spec 003 (`specs/003-logistics-dashboard-frontend/`).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| No orders exist in database | Return HTTP 200 with an empty list `[]` |
| Filter matches zero orders | Return HTTP 200 with an empty list `[]` |
| Buyer account deleted or null `buyer_id` | Return `"buyer_name": "Unknown Buyer"` and keep `buyer_id` null without raising an exception |
| Seller account deleted or null `seller_id` | Return `"seller_name": "Unknown Merchant"` and preserve order without raising an exception |
| Product deleted from catalog | Return `"product_name": "Unknown Product"` and `"product_brand": "Unknown Brand"` without raising an exception |
| Case sensitivity in status query | Treat status query case-insensitively or enforce exact lowercase match against enum values |
| Database connection failure | Catch database exception, log error server-side, and return HTTP 500 standard error envelope |

## 8. Out of Scope

- ❌ Mutating or transitioning order statuses (covered in Spec 002)
- ❌ Frontend dashboard layout and interface components (covered in Spec 003)
- ❌ Modifying customer shipping addresses or order line item quantities
- ❌ Exporting order lists to CSV or PDF

## 9. Constitution Compliance

- ✅ All business logic and queries reside exclusively in FastAPI backend (§4.1)
- ✅ Standard endpoint prefix `/api/v1/` used (§4.3)
- ✅ Comprehensive OpenAPI summary, description, tags, and field descriptions (§4.3)
- ✅ Standard error envelope format `{ "error": { "code": "...", "message": "..." } }` (§4.4)
- ✅ Custom enum `delivered_types` and `user_role` explained in pure text (§5)
- ✅ Pytest unit and integration test coverage required (§14)
- ✅ Conventional Commits naming followed for tasks (§13)

## 10. Open Questions

- None. All scope and requirements have been confirmed during the clarifying questions phase.
