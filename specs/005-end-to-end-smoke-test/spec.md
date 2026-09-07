# Spec: End-to-End Smoke Test

> **Roadmap Reference**: Phase 8, Step 8.5 — End-to-end smoke test
> **Branch**: `feat/polish-and-integration`
> **Spec**: 005 of 006 in phase
> **Date**: 2026-09-07
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

Across Phases 1 through 7, all individual API routers and services were built and tested in unit isolation. However, the complete lifecycle of an e-commerce order requires seamless collaboration across multiple distinct user roles:
1. A **Merchant** listing a product and establishing stock and pricing.
2. A **Buyer** discovering the product, staging it in their cart, and checking out.
3. The **Merchant** fulfilling incoming demand and designating the items as ready for pickup.
4. **Logistics** personnel managing delivery through transit stages to fulfillment.

This feature implements an automated, comprehensive backend integration smoke test suite (`backend/tests/test_e2e_smoke.py`) using FastAPI's `TestClient`. It executes the end-to-end lifecycle sequentially against the API, verifying authentication boundaries, role permissions, inventory decrements, and status transitions without requiring live third-party network services. Any subtle cross-router defects discovered during this test run will be fixed.

## 2. Dependencies

- Depends on: Existing backend endpoints from Phases 1–7 (`auth`, `products`, `cart`, `checkout`, `orders`, `dashboard`, `logistics`). Can be executed independently or in parallel with frontend polish.

## 3. Functional Requirements

### 3.1 — Full Order Lifecycle Simulation

The automated integration test suite must execute the following chronological sequence:
1. **Merchant Onboarding & Listing**:
   - Register a merchant user account (`POST /api/v1/auth/register` with role `merchant`).
   - Authenticate as merchant (`POST /api/v1/auth/login`).
   - Create a new catalog product with an initial offer (`POST /api/v1/dashboard/products`) specifying price, stock, brand, and estimated delivery days.
   - Verify the product appears in merchant's active offers (`GET /api/v1/dashboard/offers`).
2. **Buyer Discovery & Purchase**:
   - Register a buyer user account (`POST /api/v1/auth/register` with role `buyer`).
   - Authenticate as buyer (`POST /api/v1/auth/login`).
   - Search for the product by name/keyword (`GET /api/v1/products?q={term}`).
   - Retrieve product details (`GET /api/v1/products/{id}`) and identify the cheapest seller offer.
   - Add the seller offer to the cart (`POST /api/v1/cart/items`) with a specified quantity.
   - Verify cart contents and subtotal (`GET /api/v1/cart`).
   - Complete checkout with a delivery address (`POST /api/v1/checkout`).
   - Verify the cart is cleared post-checkout.
   - Verify the initial order record exists with status `pending`.
3. **Merchant Order Management**:
   - Re-authenticate or switch session to the merchant.
   - Query incoming merchant orders (`GET /api/v1/dashboard/orders`).
   - Verify the newly created order appears with buyer and product details.
   - Mark the order as ready for pickup, transitioning status to `confirmed`.
4. **Logistics Transit & Completion**:
   - Authenticate as a user with role `logistics`.
   - Query all orders (`GET /api/v1/logistics/orders?status=confirmed`).
   - Verify the order is present.
   - Transition order status from `confirmed` to `shipped` (`PATCH /api/v1/logistics/orders/{id}`).
   - Transition order status from `shipped` to `delivered` (`PATCH /api/v1/logistics/orders/{id}`).
5. **Buyer Final Verification**:
   - Re-authenticate as buyer.
   - Query order history (`GET /api/v1/orders`).
   - Verify the order status reflects `delivered`.
   - Verify that seller product stock in the catalog was decremented appropriately.

### 3.2 — Negative & Edge Case Walkthroughs

- [ ] **Role Protection**: Verify a buyer cannot access `/api/v1/dashboard/orders` (expects 403 Forbidden).
- [ ] **Role Protection**: Verify a merchant cannot access `/api/v1/logistics/orders` (expects 403 Forbidden).
- [ ] **Stock Exhaustion**: Attempting to add more items than available stock returns 400 Bad Request.
- [ ] **Invalid Status Transitions**: Attempting to jump directly from `pending` to `delivered` via logistics router returns 400 Bad Request.

## 4. Acceptance Criteria

- [ ] AC1: The automated smoke test suite executes from start to finish via `pytest backend/tests/test_e2e_smoke.py` and passes with 100% success.
- [ ] AC2: All three user roles (buyer, merchant, logistics) participate in the simulated flow with realistic token credentials.
- [ ] AC3: Stock levels correctly decrement upon checkout and match the catalog queries.
- [ ] AC4: Order status accurately advances across the state machine: `pending` -> `confirmed` -> `shipped` -> `delivered`.
- [ ] AC5: Unauthorized role access attempts are caught with 403 Forbidden responses.
- [ ] AC6: Invalid status transitions are rejected with proper error envelopes.

## 5. API Contract

The smoke test validates existing API contracts across:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/products`
- `GET /api/v1/products/{id}`
- `POST /api/v1/cart/items`
- `GET /api/v1/cart`
- `POST /api/v1/checkout`
- `GET /api/v1/orders`
- `POST /api/v1/dashboard/products`
- `GET /api/v1/dashboard/offers`
- `GET /api/v1/dashboard/orders`
- `GET /api/v1/logistics/orders`
- `PATCH /api/v1/logistics/orders/{id}`

Status enums for delivery types accept: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`.
User roles accept: `buyer`, `merchant`, or `logistics`.

## 6. UI/UX Requirements

This is a backend integration testing specification. No direct UI changes are required, but findings from this test ensure end-to-end frontend transactions succeed without runtime backend exceptions.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Cart checkout attempted with 0 items | Checkout returns 400 error with standard error envelope (`EMPTY_CART`). |
| Logistics tries to deliver a cancelled order | Logistics router rejects status change with 400 error. |
| Buyer tries to view another user's cart | Auth dependency scopes cart lookup strictly to authenticated `user_id`. |

## 8. Out of Scope

- ❌ Browser-based Selenium or Cypress automated testing (Pytest `TestClient` is chosen per user direction).
- ❌ External payment gateway integration (platform checkout is simulated).

## 9. Constitution Compliance

- ✅ Section 4.1: Strictly tests FastAPI endpoints without any frontend dependencies.
- ✅ Section 4.4: Enforces standard API error envelopes on negative test cases.
- ✅ Section 5: Respects predefined database schema (`users`, `products`, `seller_products`, `user_orders`, `carts`, `cart_items`).
- ✅ Section 14: Automated tests required for all critical business logic and multi-role operations.

## 10. Open Questions

- None. Approach confirmed: automated integration test suite in `backend/tests/test_e2e_smoke.py`.
