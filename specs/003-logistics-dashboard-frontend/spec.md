# Spec: Logistics Dashboard Frontend

> **Roadmap Reference**: Phase 7, Step 7.3 — Logistics dashboard frontend
> **Branch**: `feat/logistics-dashboard`
> **Spec**: 003 of 003 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

Kalano's logistics coordinators need a modern, intuitive, desktop-first web interface to monitor active shipments, look up customer delivery addresses, coordinate with merchant sellers, and transition orders through fulfillment stages.

This specification defines the frontend interface for the `/logistics` page. It provides a role-guarded portal featuring operational summary metric cards, an interactive filter tab bar, client-side keyword search, and a comprehensive data table with contextual action buttons — prominently including an "End Delivery" button that completes delivery when courier drop-off is fulfilled.

## 2. Dependencies

- Depends on:
  - `specs/001-logistics-view-orders-endpoint/` (provides `GET /api/v1/logistics/orders`)
  - `specs/002-logistics-update-order-status-endpoint/` (provides `PATCH /api/v1/logistics/orders/{order_id}`)
- Builds upon:
  - Next.js App Router and TailwindCSS styling
  - AuthContext and middleware protection for `/logistics`
  - TanStack Query (React Query) for state management
  - shadcn/ui components (Buttons, Badges, Cards, Tabs, Dialog/Alerts, Inputs)

## 3. Functional Requirements

### 3.1 — Route Protection & Access Control

- [ ] The `/logistics` page must enforce authentication:
  - Next.js middleware must redirect unauthenticated visitors to `/login?redirect=/logistics`.
  - Client-side `useAuth` hook must check loading state and redirect to login if not authenticated.
- [ ] The page must verify that the authenticated user possesses the `logistics` role.
- [ ] If an authenticated buyer or merchant visits `/logistics`, display a clear "Access Denied" notice with an option to navigate back to the home page (`/`) or dashboard.

### 3.2 — Dashboard Summary Metrics

- [ ] Display an operational metric bar with 4 summary cards:
  - **Total Orders**: Total count of orders loaded.
  - **Pending Pickup**: Count of orders with status `pending`.
  - **In Transit**: Count of orders with status `confirmed` or `shipped`.
  - **Delivered**: Count of orders with status `delivered`.
- [ ] Summary counts must reactively update when orders change or are filtered.

### 3.3 — Filtering & Search Controls

- [ ] Status Filter Tabs: Provide filter pills/tabs for:
  - "All Orders"
  - "Pending"
  - "Confirmed"
  - "Shipped"
  - "Delivered"
  - "Cancelled"
  - "Returned"
- [ ] Search Input: Provide a text input that filters displayed orders by:
  - Order ID (e.g. "101")
  - Buyer Display Name
  - Seller Display Name
  - Product Name
  - Delivery Destination Address
- [ ] Filtering and search must execute smoothly without page reloads.

### 3.4 — Orders Data Table & Row Details

- [ ] Display a responsive, accessible table of orders with columns:
  - **Order ID & Date**: Order ID integer and formatted order placement timestamp.
  - **Product**: Product thumbnail image, product name, and brand name.
  - **Merchant Seller**: Display name of the seller providing the product.
  - **Buyer & Shipping Address**: Buyer display name and the physical delivery address.
  - **Quantity & Subtotal**: Number of units ordered and calculated line item subtotal.
  - **Status Badge**: Visually distinctive badge for each fulfillment status:
    - `pending`: Amber/Yellow
    - `confirmed`: Sky Blue
    - `shipped`: Purple/Indigo
    - `delivered`: Emerald Green
    - `cancelled`: Rose/Red
    - `returned`: Slate Gray
  - **Actions**: Contextual action buttons based on current delivery status.

### 3.5 — Contextual Status Actions

- [ ] For `pending` orders:
  - Display "Confirm Pickup" button (transitions to `confirmed`).
  - Display "Cancel" button (opens confirmation dialog, transitions to `cancelled`).
- [ ] For `confirmed` orders:
  - Display "Mark Shipped" button (transitions to `shipped`).
  - Display "Cancel" button (opens confirmation dialog, transitions to `cancelled`).
- [ ] For `shipped` orders:
  - Display prominent primary **"End Delivery"** button (transitions to `delivered`).
  - Display "Cancel" button (opens confirmation dialog, transitions to `cancelled`).
- [ ] For `delivered` orders:
  - Display "Process Return" button (opens confirmation dialog, transitions to `returned`).
- [ ] For `cancelled` and `returned` orders:
  - Display text badge "Final" with no transition buttons.
- [ ] All status change mutations must use optimistic updates or TanStack Query invalidation to immediately refresh the dashboard UI without requiring manual page refresh.
- [ ] Display a visual toast or alert banner upon successful transition or if an error occurs.

## 4. Acceptance Criteria

- [ ] AC1: Visiting `/logistics` while unauthenticated redirects to `/login?redirect=/logistics`.
- [ ] AC2: Visiting `/logistics` as a buyer or merchant displays an Access Denied state.
- [ ] AC3: Visiting `/logistics` as a logistics user displays the header, metric cards, status tabs, search bar, and order table.
- [ ] AC4: Clicking a status tab (e.g. "Pending") displays only orders matching that status.
- [ ] AC5: Typing a search term in the search box filters the displayed table rows in real time.
- [ ] AC6: Clicking the "End Delivery" button on a shipped order triggers the PATCH request and updates the order status to `delivered`.
- [ ] AC7: Clicking "Cancel" prompts for confirmation before updating status to `cancelled`.
- [ ] AC8: Loading state renders a clean skeleton loader; empty states render an informative illustration or message.
- [ ] AC9: Vitest unit and integration tests verify rendering, access control, filtering, and action triggers.

## 5. API Contract Integration

### Endpoints Consumed:
1. `GET /api/v1/logistics/orders`
   - Optional query: `status`
   - Response: array of order objects conforming to `LogisticsOrderItemResponse`
2. `PATCH /api/v1/logistics/orders/{order_id}`
   - Request body: `{ "status": "<target_status>" }`
   - Response: updated order object conforming to `LogisticsOrderItemResponse`

## 6. UI/UX Requirements

- **Page/Route**: `/logistics`
- **Layout**: Desktop-first layout with max-width container, header bar, 4 metric cards, filter toolbar, and full-width card containing the data table.
- **Interactions**:
  - Hover states on interactive buttons and table rows.
  - Confirmation modal for "Cancel Order" and "Process Return" to prevent accidental state changes.
  - Loading spinner indicator on action buttons during ongoing mutation requests.
- **States**:
  - Loading: Card and table skeletons matching table row layout.
  - Empty: "No orders found matching your criteria" with clear filter button.
  - Error: Clean error card with "Retry" button.
- **Accessibility**:
  - Semantic `<main>`, `<header>`, `<nav>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`.
  - Accessible `aria-label` attributes on icon-only buttons or status controls.
  - Full keyboard focusability for tabs, search input, and action buttons.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Network failure while fetching orders | Show error banner with a "Retry" button |
| Action mutation fails (e.g. server error 500) | Show toast notification with error message; preserve previous state |
| Rapid repeated clicks on action button | Disable button while mutation is in flight |
| Long customer address strings | Wrap gracefully or truncate with tooltip showing full address |
| Missing product image | Render placeholder image with product title fallback |

## 8. Out of Scope

- ❌ Real-time live courier GPS tracking
- ❌ Direct customer messaging or SMS notifications
- ❌ Editing order item quantities or payment details

## 9. Constitution Compliance

- ✅ Thin Next.js client calling FastAPI via `fetch` (§4.1)
- ✅ No Supabase JS client in frontend (§4.1)
- ✅ Role-based page access checks logistics user role (§4.2, §8)
- ✅ TanStack Query used for server state management (§3)
- ✅ Desktop-first responsive layout with semantic HTML and accessibility labels (§12)
- ✅ Unit and component tests written with Vitest (§14)

## 10. Open Questions

- None. UI preferences and button flows confirmed during clarifying questions.
