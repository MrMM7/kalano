# Spec: Checkout Frontend Page

> **Roadmap Reference**: Phase 5, Step 5.2 — Checkout frontend page
> **Branch**: `feat/checkout-and-orders`
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

The Checkout Frontend Page allows authenticated buyers to review their order before finalizing the simulated purchase. It renders an order summary listing items, quantities, and calculated prices from their current cart. It provides a shipping address form (pre-filled with their saved profile address if available), a checkbox to update their default address, a simulated payment method card, and a "Place Order" submission trigger. Upon successful placement, the user is redirected to the Order History page (`/orders`) with a confirmation toast.

## 2. Dependencies

- Depends on: `specs/001-checkout-endpoint/` — The checkout API endpoint (`POST /api/v1/checkout`) must be available to process order creation.
- Depends on: Existing cart API client and hooks (`GET /api/v1/cart`) from Phase 4.
- Depends on: Existing authentication context and profile data (`AuthContext`, `GET /api/v1/auth/me`) from Phase 2.

## 3. Functional Requirements

### 3.1 — Route Protection and Access Control
- [ ] The `/checkout` route must be protected and restricted to authenticated buyers.
- [ ] If an unauthenticated user visits `/checkout`, Next.js middleware redirects to `/login?redirect=/checkout`.
- [ ] If a logged-in user with a role other than `buyer` (such as `merchant` or `logistics`) navigates to `/checkout`, show an access denied banner with a link back to `/dashboard` or `/`.

### 3.2 — Cart Data Hydration & Empty State
- [ ] Fetch current cart items from the backend using TanStack Query.
- [ ] Display a loading skeleton while cart data is being retrieved.
- [ ] If the cart contains 0 items, display an empty cart prompt informing the user they cannot checkout an empty cart, and provide a button linking to `/products` ("Continue Shopping").

### 3.3 — Order Summary Breakdown
- [ ] Display each cart item with product thumbnail (or placeholder), product title, seller name, unit price, quantity, and item subtotal.
- [ ] Display an order price summary showing total items, items subtotal, simulated shipping cost ("Free"), and grand total.

### 3.4 — Shipping Address Form
- [ ] Provide an address text input area for entering the delivery destination.
- [ ] Pre-fill the address input with `user.address` if available in `AuthContext`.
- [ ] Require a minimum length of 5 characters; prevent submission if empty or whitespace-only, showing an inline validation error.
- [ ] Provide a checkbox: "Save this shipping address to my profile for future orders", unchecked by default (or checked if user has no saved address).

### 3.5 — Simulated Payment Section
- [ ] Render a mock payment details card with a credit card icon, dummy masked card number (`•••• •••• •••• 4242`), and simulated expiry date.
- [ ] Include an explicit disclaimer banner: "Simulated Payment: This is an educational prototype. No actual payment will be processed or charged."
- [ ] Display a security badge ("Simulated 256-bit Encrypted Checkout").

### 3.6 — Order Placement & Navigation
- [ ] Include a prominent "Place Order" button displaying the grand total.
- [ ] Disable the button and display a loading spinner while the order placement request is in flight.
- [ ] On click, send a POST request to `/api/v1/checkout` containing `address` and `save_address`.
- [ ] On success:
  - Invalidate the cart query so cart state resets to empty across the application.
  - If `save_address` was checked, trigger `refreshUser()` to update local auth context.
  - Redirect the buyer to `/orders`.
  - Display a success toast notification (e.g. "Order placed successfully!").
- [ ] On failure (such as `INSUFFICIENT_STOCK` or `EMPTY_CART`):
  - Display a clear error alert or toast detailing why the order failed (e.g., "An item in your cart is out of stock").
  - Do not clear the form inputs.

## 4. Acceptance Criteria

- [ ] AC1: Visiting `/checkout` while authenticated with items in cart displays the full order breakdown, address field, simulated payment block, and place order button.
- [ ] AC2: Visiting `/checkout` with an empty cart displays an empty-cart alert and redirects or links to `/products`.
- [ ] AC3: If the user profile has an address, it is automatically populated in the shipping address input field on page load.
- [ ] AC4: Clicking "Place Order" with a valid address submits the checkout payload, shows loading state, invalidates cart queries, and redirects to `/orders`.
- [ ] AC5: An address input with fewer than 5 characters or only whitespace prevents submission and displays an inline validation message.
- [ ] AC6: Backend error responses (such as out-of-stock items) display an error banner without navigating away from the page.

## 5. API Contract

### Frontend API Client Integration

Consumes `POST /api/v1/checkout`:

**Request Payload**:
```json
{
  "address": "456 Oak Avenue, Apt 12, Metropolis, NY 10001",
  "save_address": true
}
```

**Response Expected**:
```json
{
  "order_ids": [201],
  "orders": [
    {
      "id": 201,
      "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "product_name": "Wireless Noise-Canceling Headphones",
      "seller_id": "8fa85f64-5717-4562-b3fc-2c963f66af11",
      "seller_name": "BestAudio Official",
      "bought_price": 199.99,
      "quantity": 1,
      "subtotal": 199.99,
      "delivery_types": "pending",
      "address": "456 Oak Avenue, Apt 12, Metropolis, NY 10001",
      "created_at": "2026-09-05T20:00:00Z"
    }
  ],
  "total_items": 1,
  "total_price": 199.99,
  "message": "Order placed successfully."
}
```

## 6. UI/UX Requirements

- **Page/Route**: `/checkout`
- **Layout**: Two-column responsive desktop layout (collapsing to single column on tablets and mobile):
  - Left column: Shipping address form card, followed by the simulated payment information card.
  - Right column: Sticky order summary card with item thumbnail previews, quantities, price calculation, disclaimer note, and "Place Order" action button.
- **Interactions**:
  - Typing in the address input updates form state.
  - Toggling "Save address" checkbox updates boolean state.
  - Submitting changes "Place Order" button to disabled with a spinning indicator.
- **States**:
  - Loading: Skeleton layout representing form cards and order summary.
  - Empty: Friendly empty cart message with shopping link.
  - Error: Inline validation messages for fields; red banner for server errors.
  - Submitting: Disabled inputs and spinner on action button.
- **Responsive**: Stacks into a clean single column on screens narrower than 1024px.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Cart becomes empty while on checkout | Empty cart state replaces summary with link to product catalog |
| Network error during checkout submission | Show error toast; keep address input intact; re-enable "Place Order" button |
| Out of stock error returned from backend | Display toast/banner stating item is no longer available in requested quantity; recommend visiting `/cart` |
| User enters whitespace in address | Client-side validation triggers prior to network request |
| User logs out in another tab | Next fetch triggers 401; user redirected to `/login` |

## 8. Out of Scope

- ❌ Real payment processing integrations (Stripe, PayPal, etc.).
- ❌ Multiple separate shipping addresses per item.
- ❌ Coupon / promo code entry.
- ❌ Express shipping selector options.

## 9. Constitution Compliance

- ✅ Next.js frontend acts strictly as a thin client calling FastAPI endpoints (§4.1).
- ✅ Protected route handled via Next.js middleware checking httpOnly JWT cookie (§4.2).
- ✅ TanStack Query handles server state and query invalidation (§3).
- ✅ Shadcn/ui and TailwindCSS used for styling and components (§3).
- ✅ Follows desktop-first responsive design (§12).
- ✅ Vitest tests created for page components and interactions (§14).

## 10. Open Questions

- None. Requirements and flow confirmed during phase clarification.
