# Spec: Logistics Update Order Status Endpoint

> **Roadmap Reference**: Phase 7, Step 7.2 — Logistics: update order status
> **Branch**: `feat/logistics-dashboard`
> **Spec**: 002 of 003 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

Kalano's logistics personnel need the ability to transition the delivery status of customer orders as shipments move through physical fulfillment stages (e.g. picked up from merchant, in-transit with courier, delivered to customer, or returned/cancelled). To ensure business logic integrity, order transitions must follow strict state machine rules. Additionally, if an order is cancelled prior to completion, the system must automatically restore the reserved inventory back to the merchant's stock in `seller_products`.

This specification defines the backend endpoint `PATCH /api/v1/logistics/orders/{order_id}` that validates status transitions, updates the `user_orders` table, manages inventory restoration upon cancellation, and returns the updated order details.

## 2. Dependencies

- Depends on: `specs/001-logistics-view-orders-endpoint/` (requires `backend/app/models/logistics.py`, `backend/app/routers/logistics.py`, and base service structure).

## 3. Functional Requirements

### 3.1 — Authentication & Authorization

- [ ] The endpoint must authenticate requests via the `kalano_token` httpOnly cookie or `Authorization: Bearer <token>` header.
- [ ] If no token is provided or the token is invalid/expired, the endpoint must reject the request with HTTP status `401 Unauthorized`.
- [ ] The endpoint must verify that the authenticated user has the `logistics` role.
- [ ] Non-logistics users (buyers or merchants) must be rejected with HTTP status `403 Forbidden` and error code `FORBIDDEN`.

### 3.2 — Request Validation

- [ ] The endpoint must accept the order ID as a path parameter of integer type.
- [ ] The endpoint must accept a JSON request body containing a `status` field of string type.
- [ ] The value of `status` must be validated against the allowed `delivered_types` values: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, and `returned`.
- [ ] If an invalid status string is provided, reject the request with HTTP status `400 Bad Request` and error code `INVALID_STATUS`.

### 3.3 — State Machine & Transition Rules

- [ ] The order must exist in `user_orders`. If no record matches `order_id`, return HTTP status `404 Not Found` with error code `ORDER_NOT_FOUND`.
- [ ] The transition from the order's current `delivery_types` status to the requested `status` must adhere to the following permitted paths:
  - From `pending`: can transition to `confirmed` or `cancelled`.
  - From `confirmed`: can transition to `shipped` or `cancelled`.
  - From `shipped`: can transition to `delivered` or `cancelled`.
  - From `delivered`: can transition to `returned`.
  - From `cancelled`: cannot transition to any other status (terminal state).
  - From `returned`: cannot transition to any other status (terminal state).
- [ ] Any transition outside the permitted paths (e.g. `pending` to `delivered`, `delivered` to `shipped`, or any transition from `cancelled` or `returned`) must be rejected with HTTP status `400 Bad Request` and error code `INVALID_STATUS_TRANSITION`.
- [ ] If the requested status is identical to the current status, reject with HTTP status `400 Bad Request` and error code `INVALID_STATUS_TRANSITION` (no redundant transitions).

### 3.4 — Stock Restoration on Cancellation

- [ ] When an order transitions from `pending`, `confirmed`, or `shipped` to `cancelled`:
  - Locate the corresponding offer row in `seller_products` matching the order's `product_id` and `seller_id`.
  - If a matching `seller_products` row exists, increment its `stock` value by the order's `quantity` (`stock = stock + order.quantity`).
  - Perform the stock update as part of the cancellation workflow.

### 3.5 — Order Update & Return Representation

- [ ] Update `user_orders.delivery_types` to the target status.
- [ ] Re-fetch or assemble the updated order enriched with product, buyer, seller, price, and calculated subtotal data.
- [ ] Return the updated order as `LogisticsOrderItemResponse` with HTTP status `200 OK`.

## 4. Acceptance Criteria

- [ ] AC1: Unauthenticated request receives HTTP 401 with standard error envelope.
- [ ] AC2: Request from non-logistics role receives HTTP 403 with `FORBIDDEN`.
- [ ] AC3: Non-existent order ID receives HTTP 404 with `ORDER_NOT_FOUND`.
- [ ] AC4: Invalid status string receives HTTP 400 with `INVALID_STATUS`.
- [ ] AC5: Permitted transition from `confirmed` to `shipped` succeeds with HTTP 200 and reflects the new status.
- [ ] AC6: Permitted transition from `shipped` to `delivered` succeeds with HTTP 200 and reflects the new status.
- [ ] AC7: Permitted transition from `delivered` to `returned` succeeds with HTTP 200 and reflects the new status.
- [ ] AC8: Permitted transition to `cancelled` succeeds and restores the quantity to the seller's product stock.
- [ ] AC9: Forbidden transition (e.g. `pending` to `delivered` or `cancelled` to `shipped`) receives HTTP 400 with `INVALID_STATUS_TRANSITION`.
- [ ] AC10: Pytest test suite thoroughly verifies all permitted transitions, rejected transitions, error codes, and stock restoration.

## 5. API Contract

### `PATCH /api/v1/logistics/orders/{order_id}`

**Summary**: Update fulfillment delivery status for an order

**Description**: Transitions an order's delivery status according to the logistics state machine rules. Only logistics personnel may invoke this endpoint. If transitioning an active order to `cancelled`, reserved product stock is restored to the seller's inventory.

**Path Parameters**:
- `order_id` (integer, required): Unique identifier of the order record in `user_orders`.

**Request Body**:
```json
{
  "status": "shipped"
}
```

**Success Response** (`200 OK`):
```json
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
  "delivery_types": "shipped",
  "created_at": "2026-09-06T14:30:00Z"
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_STATUS` | Provided status value is not a member of the allowed delivery types enum |
| 400 | `INVALID_STATUS_TRANSITION` | Requested transition is not allowed by the order state machine |
| 401 | `MISSING_TOKEN` | Authentication credentials missing |
| 401 | `INVALID_TOKEN` | Authentication token invalid or expired |
| 403 | `FORBIDDEN` | User does not have the logistics role |
| 404 | `ORDER_NOT_FOUND` | No order found matching the specified order_id |
| 500 | `INTERNAL_SERVER_ERROR` | Database failure during status update or stock restoration |

## 6. UI/UX Requirements

This spec covers backend API functionality. Frontend integration will be specified in Spec 003 (`specs/003-logistics-dashboard-frontend/`).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Order already in terminal state (`cancelled` or `returned`) | Reject with HTTP 400 `INVALID_STATUS_TRANSITION` |
| Attempting identical status transition (`confirmed` to `confirmed`) | Reject with HTTP 400 `INVALID_STATUS_TRANSITION` |
| Seller offer no longer exists upon cancellation | Log warning server-side and proceed with updating order to cancelled without crashing |
| Concurrent status update race condition | Read-verify-update or handle optimistic failure gracefully |
| Database error during stock restoration | Abort or rollback order status change to prevent inconsistent state, return HTTP 500 |

## 8. Out of Scope

- ❌ Bulk status updating in a single request
- ❌ Modifying recipient address or order price
- ❌ Refund processing with external payment processors (platform simulates payment)

## 9. Constitution Compliance

- ✅ All business logic and state machine enforcement in FastAPI backend (§4.1)
- ✅ Standard endpoint prefix `/api/v1/` used (§4.3)
- ✅ Standard error envelope format `{ "error": { "code": "...", "message": "..." } }` (§4.4)
- ✅ Delivery status transitions defined in pure text adhering to `delivered_types` (§5)
- ✅ Tests required for all transitions and error responses (§14)
- ✅ Conventional Commits naming followed (§13)

## 10. Open Questions

- None. Inventory restoration behavior and state transitions were confirmed during the clarifying questions phase.
