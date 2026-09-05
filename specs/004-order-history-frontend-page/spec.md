# Spec: Order History Frontend Page

> **Roadmap Reference**: Phase 5, Step 5.4 — Order history frontend page
> **Branch**: `feat/checkout-and-orders`
> **Spec**: 004 of 004 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Order History Frontend Page enables authenticated buyers to view a chronological log of all their past orders. It fetches order data from the backend `GET /api/v1/orders` endpoint and presents each order in an intuitive, structured card format. Each card displays the order identifier, timestamp, fulfillment status badge, product image, product title linking to the catalog detail page, merchant seller name, item quantity, purchase price, subtotal, and the delivery destination address.

## 2. Dependencies

- Depends on: `specs/003-order-history-endpoint/` — Consumes the `GET /api/v1/orders` endpoint.
- Depends on: Existing authentication context (`AuthContext`) and Next.js middleware for route protection.

## 3. Functional Requirements

### 3.1 — Route Protection and Role Authorization
- [ ] Route `/orders` must be protected by Next.js middleware.
- [ ] Unauthenticated requests must be redirected to `/login?redirect=/orders`.
- [ ] Non-buyer accounts (merchants or logistics staff) accessing `/orders` must receive a role notification and be guided to their respective dashboards.

### 3.2 — Data Fetching & State Management
- [ ] Fetch buyer orders using TanStack Query with a designated query key `["orders"]`.
- [ ] Provide automatic background refetching and window-focus hydration.
- [ ] Display an animated skeleton state while initial loading is underway.
- [ ] Display an error container with a "Retry" button if data retrieval fails.

### 3.3 — Order Card Presentation
- [ ] Render each order inside an individual card container.
- [ ] Order Header: Display order reference number (e.g., "Order #101") and human-formatted placement date.
- [ ] Status Badge: Display a color-coded status badge indicating the delivery phase. The `delivery_types` status values and their presentation styles are:
  - `pending`: Amber/yellow styling ("Order Placed")
  - `confirmed`: Blue styling ("Ready for Pickup")
  - `shipped`: Indigo/purple styling ("In Transit")
  - `delivered`: Emerald/green styling ("Delivered")
  - `cancelled`: Red/destructive styling ("Cancelled")
  - `returned`: Slate/gray styling ("Returned")
- [ ] Item Details: Display thumbnail image (or fallback placeholder icon), product title (as a clickable link navigating to `/products/[id]`), and brand name.
- [ ] Merchant Identity: Display "Sold by: [Seller Display Name]".
- [ ] Financial Breakdown: Display unit price, quantity, and computed item subtotal.
- [ ] Shipping Information: Display the delivery address where the order is dispatched.

### 3.4 — Empty State
- [ ] If the buyer has placed zero orders, render an empty state illustration/icon with a helpful prompt ("You haven't placed any orders yet").
- [ ] Provide a primary call-to-action button ("Explore Products") redirecting to `/products`.

### 3.5 — Post-Checkout Feedback
- [ ] Detect when the user arrives directly following a successful checkout and display a confirmation banner or toast alert celebrating the order placement.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated buyer visiting `/orders` sees their list of past orders sorted from newest to oldest.
- [ ] AC2: Each order displays its order number, formatted date, status badge with appropriate styling, product name with link, seller name, price, quantity, subtotal, and delivery address.
- [ ] AC3: If buyer has no orders, an empty state card with a "Start Shopping" button linking to `/products` is displayed.
- [ ] AC4: Clicking a product title navigates directly to the corresponding product detail page (`/products/[id]`).
- [ ] AC5: Network loading state renders animated skeletons; network error state renders a retry button that triggers query re-fetch.
- [ ] AC6: Unauthenticated visits redirect to `/login`.

## 5. API Contract

### Frontend API Client Integration

Consumes `GET /api/v1/orders`:

**Success Response Expected**:
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

## 6. UI/UX Requirements

- **Page/Route**: `/orders`
- **Layout**: Centered desktop container (max-w-4xl) with clean vertical stack of order cards.
- **Interactions**:
  - Hovering on product title shows subtle underline and pointer cursor.
  - Hovering on cards provides subtle elevation/border contrast.
  - Clicking "Retry" in error state invokes TanStack Query `refetch()`.
- **States**:
  - Loading: Multi-card skeleton state with simulated badge and text blocks.
  - Empty: Centered card with package icon, headline, description, and link to catalog.
  - Error: Centered alert card with error details and retry button.
  - Populated: Vertical list of order cards with date headers and status badges.
- **Responsive**: Adapts gracefully to tablet and mobile screens with stacked metadata.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Product image URL is broken or missing | Display neutral placeholder package icon |
| Long shipping address string | Truncate cleanly or wrap across lines without breaking container layout |
| Network offline / 500 server error | Show error state with retry button |
| Unknown status string returned | Default to neutral slate badge displaying raw status string |
| Multiple orders placed at once | Render each item as an individual order card with corresponding details |

## 8. Out of Scope

- ❌ Buyer-initiated cancellation or returns from UI (handled in future merchant/logistics iterations).
- ❌ Order filtering or pagination controls.
- ❌ Real-time live GPS map tracking.

## 9. Constitution Compliance

- ✅ Thin client Next.js page consuming FastAPI endpoints (§4.1).
- ✅ Protected route enforced by Next.js middleware and auth context (§4.2).
- ✅ TanStack Query manages server state (§3).
- ✅ TailwindCSS and shadcn/ui components used (§3).
- ✅ Custom enum `delivery_types` formatted and explained in pure text (§5).
- ✅ Desktop-first responsive layout with accessible markup (§12).
- ✅ Vitest tests cover rendering and state management (§14).

## 10. Open Questions

- None. All requirements confirmed.
