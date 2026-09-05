# Spec: Cart Frontend — Dedicated Cart Page

> **Roadmap Reference**: Phase 4, Step 4.3 — Cart frontend page
> **Branch**: `feat/cart`
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

This feature builds the dedicated shopping cart page at route `/cart` in the Next.js frontend application.

The cart page is a role-protected route (restricted to authenticated buyers) that allows customers to review all items they plan to purchase, inspect multi-vendor merchant attributions, adjust item quantities using intuitive plus/minus controls, remove unwanted items, see subtotal and total pricing breakdowns, and transition smoothly toward checkout.

Data fetching and state mutations leverage TanStack Query with standard mutation lifecycle management and cache invalidation, accompanied by user feedback notifications (toasts).

## 2. Dependencies

- Depends on: `specs/002-cart-backend-view-modify/` — consumes `GET /api/v1/cart`, `PATCH /api/v1/cart/items/{item_id}`, and `DELETE /api/v1/cart/items/{item_id}`.
- Depends on: Phase 2 Authentication — relies on `middleware.ts` for route protection and `AuthContext` for buyer profile.

## 3. Functional Requirements

### 3.1 — Access Control & Route Protection

- [ ] `/cart` is protected by Next.js middleware. If an unauthenticated user visits `/cart`, they are automatically redirected to `/login?redirect=/cart`.
- [ ] If a logged-in user with role other than `buyer` (e.g. `merchant` or `logistics`) navigates to `/cart`, display an informative banner indicating that carts are reserved for buyers, with links to their respective dashboards.

### 3.2 — Cart Data Fetching

- [ ] Use TanStack Query to fetch cart data from `GET /api/v1/cart`.
- [ ] Render a loading skeleton while the cart query is pending.
- [ ] Render a friendly error message with a "Retry" button if the API request fails.
- [ ] If the cart is empty (`items.length === 0`), render a dedicated Empty Cart state featuring an icon, empty message ("Your cart is empty"), and a "Browse Catalog" CTA button linking to `/products`.

### 3.3 — Cart Item Listing

- [ ] Display each cart item with:
  - Product thumbnail image (with fallback placeholder if null).
  - Product title linked to `/products/[product_id]`.
  - Brand name.
  - Merchant seller name ("Sold by [seller_name]").
  - Unit price formatted as currency.
  - Delivery estimate text ("Estimated delivery in X days" or standard delivery).
  - Current quantity controls (Decrement `-` button, numeric display, Increment `+` button).
  - Computed line item subtotal (`price * quantity`).
  - Remove button (with trash icon and accessible label).

### 3.4 — Quantity Adjustment

- [ ] Clicking the `+` (Increment) button fires a mutation calling `PATCH /api/v1/cart/items/{item_id}` with `quantity = current_quantity + 1`.
- [ ] Disable the `+` button if `current_quantity >= stock`, and display an inline tooltip or helper notice "Max stock reached".
- [ ] Clicking the `-` (Decrement) button fires a mutation calling `PATCH /api/v1/cart/items/{item_id}` with `quantity = current_quantity - 1`.
- [ ] If `current_quantity === 1`, clicking the `-` button triggers item removal (or is disabled with the trash button serving as explicit removal).
- [ ] Disable quantity buttons during active mutation to prevent duplicate clicks.
- [ ] On successful mutation, invalidate the cart query and display a subtle success feedback.
- [ ] On failure (e.g. `INSUFFICIENT_STOCK`), show an error toast with the backend error message.

### 3.5 — Item Removal

- [ ] Clicking the Remove button triggers a mutation calling `DELETE /api/v1/cart/items/{item_id}`.
- [ ] On success, invalidate the cart query and display a success toast ("Item removed from cart").
- [ ] On error, display an error toast.

### 3.6 — Order Summary & Checkout Navigation

- [ ] Display an Order Summary card showing:
  - Items subtotal.
  - Estimated shipping badge (e.g. "Fulfilled by Kalano Logistics").
  - Final total price.
  - "Proceed to Checkout" primary action button linking to `/checkout`.
- [ ] Disable the "Proceed to Checkout" button if the cart is empty or if any item has zero stock.

## 4. Acceptance Criteria

- [ ] AC1: Unauthenticated visitors navigating to `/cart` are redirected to `/login?redirect=/cart`.
- [ ] AC2: An authenticated buyer with an empty cart sees the empty cart UI with a link to `/products`.
- [ ] AC3: An authenticated buyer with items in their cart sees all item rows, correct merchant attribution, line item subtotals, and total price.
- [ ] AC4: Clicking `+` increases quantity and updates the cart total via `PATCH`.
- [ ] AC5: Clicking `-` decreases quantity down to 1 via `PATCH`.
- [ ] AC6: Clicking the Remove button deletes the item from the cart via `DELETE`.
- [ ] AC7: Attempting to increment beyond available stock is prevented or rejected with an informative toast.
- [ ] AC8: Clicking "Proceed to Checkout" navigates to `/checkout`.
- [ ] AC9: All buttons and interactive elements include accessible `aria-label` attributes.
- [ ] AC10: Vitest unit and integration tests verify rendering, empty state, quantity adjustments, and removal.

## 5. UI/UX Requirements

- **Route**: `/cart`
- **Layout**:
  - Two-column layout on desktop: Left column (approx. 65-70% width) for Cart Items List; Right column (approx. 30-35% width) for Order Summary card (sticky on scroll).
  - Single-column stacked layout on tablet/mobile: Cart items on top, Order Summary below.
- **States**:
  - **Loading**: Pulse skeletons for table rows and summary card.
  - **Empty**: Centered card with shopping bag icon, "Your cart is empty", and a primary button "Explore Products" linking to `/products`.
  - **Error**: Alert card with retry button.
  - **Mutating**: Spinner or disabled state on active quantity/remove buttons.
- **Typography & Styling**: Clean shadcn/ui components, TailwindCSS, high contrast, dark mode compatible.

## 6. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Network failure during quantity update | Revert UI state, show error toast, leave item interactive for retry. |
| Seller's stock drops while user has cart open | Backend returns 400 `INSUFFICIENT_STOCK`; frontend catches error and displays toast: "Only X units currently available". Cart query is re-fetched. |
| User deletes the last item in the cart | Cart query updates; UI smoothly transitions from item list to Empty Cart state. |
| Rapid repeated clicks on increment/decrement | Button is disabled while pending mutation resolves, preventing race conditions. |

## 7. Out of Scope

- ❌ Payment processing or checkout address input (covered in Phase 5).
- ❌ Persistent guest cart stored in localStorage (constitution mandates server-side cart with buyer auth).
- ❌ Discount coupon / promo code inputs (not part of MVP specification).

## 8. Constitution Compliance

- ✅ §4.1 Strict Backend Separation: Frontend only fetches and mutates data via FastAPI endpoints (`GET /api/v1/cart`, `PATCH`, `DELETE`).
- ✅ §4.2 Authentication: Route protected by cookie-based JWT middleware.
- ✅ §8 Frontend Pages: `/cart` route requires auth, restricted to Buyer role.
- ✅ §9 Cart & Checkout Flow: Server-side cart backed by `carts` and `cart_items`.
- ✅ §12 Design & Accessibility: Semantic HTML, aria-labels on icon buttons (+, -, remove), desktop-first responsive layout.
- ✅ §14 Testing: Vitest tests for cart page rendering and mutation interactions.

## 9. Open Questions

- None. Clarification confirmed: Standard TanStack Query mutations with cache invalidation and toast notifications.
