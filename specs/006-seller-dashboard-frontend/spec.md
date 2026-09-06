# Spec: Seller Dashboard Frontend

> **Roadmap Reference**: Phase 6, Step 6.6 — Seller dashboard frontend
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 006 of 006 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Seller Dashboard Frontend provides a unified, responsive interface for merchants on Kalano to manage their inventory, expand their catalog presence, and fulfill customer orders. Located at `/dashboard`, the page utilizes a single-page tabbed interface consisting of "My Offers", "Add / Search Catalog", and "Incoming Orders". The interface connects directly to the backend dashboard APIs (implemented in Specs 001–005) using TanStack Query, offering inline modals for editing terms, deleting listings, searching catalog items, uploading new products with photos, and marking orders ready for courier pickup.

## 2. Dependencies

- Depends on:
  - `specs/001-merchant-list-offers-endpoint/` (backend `GET /api/v1/dashboard/offers`)
  - `specs/002-merchant-add-offer-endpoint/` (backend `POST /api/v1/dashboard/offers`)
  - `specs/003-merchant-create-product-offer-endpoint/` (backend `POST /api/v1/dashboard/products`)
  - `specs/004-merchant-update-delete-offers-endpoints/` (backend `PATCH` & `DELETE /api/v1/dashboard/offers/{offer_id}`)
  - `specs/005-merchant-incoming-orders-endpoint/` (backend `GET /api/v1/dashboard/orders` & `PATCH /api/v1/dashboard/orders/{order_id}/status`)
  - Existing `frontend/lib/auth-context.tsx` and Next.js middleware for route protection.

## 3. Functional Requirements

### 3.1 — Authentication & Role Guard
- [ ] Route `/dashboard` is protected by Next.js middleware and client-side `AuthContext`.
- [ ] If unauthenticated, redirect to `/login?redirect=/dashboard`.
- [ ] If authenticated but role is not `merchant` (e.g., `buyer` or `logistics`), display an "Access Restricted" alert stating merchant credentials are required.

### 3.2 — Tab Navigation
- [ ] Provide three accessible tab controls:
  - **My Offers**: Lists existing seller offers.
  - **Add Offer**: Catalog search and product creation.
  - **Incoming Orders**: Orders received for merchant listings.
- [ ] State persists active tab in component state or URL query parameter.

### 3.3 — "My Offers" Tab
- [ ] Fetches merchant offers using TanStack Query.
- [ ] Displays each offer with: product image, product title, brand, price, current stock, and estimated delivery days.
- [ ] Shows stock status indicators (e.g. "In Stock", "Low Stock" when stock < 5, "Out of Stock" when stock is 0).
- [ ] **Edit Offer Action**: Opens a dialog modal allowing the merchant to modify price, stock, and delivery estimate. Submitting calls `PATCH /api/v1/dashboard/offers/{offer_id}` and invalidates the query cache.
- [ ] **Delete Offer Action**: Opens a confirmation dialog. Confirming calls `DELETE /api/v1/dashboard/offers/{offer_id}` and removes the listing.
- [ ] Shows an empty state with a call-to-action button switching to "Add Offer" if no listings exist.

### 3.4 — "Add Offer" Tab
- [ ] **Step 1 — Catalog Search**:
  - Includes a search input querying `GET /api/v1/products?q=`.
  - Displays matching products with an "Add Offer" button.
  - If the merchant selects an existing product, displays a modal or form with fields for `price`, `stock`, and `estimated_delivery_days`. Submitting calls `POST /api/v1/dashboard/offers`.
- [ ] **Step 2 — Create New Product**:
  - Prominent button/action: "Can't find your product? Create a new product".
  - Displays a creation form with fields: `name`, `brand`, `description`, `price`, `stock`, `estimated_delivery_days`, and a file input for product image.
  - Submitting sends a `multipart/form-data` request to `POST /api/v1/dashboard/products`.
  - On success, switches to the "My Offers" tab and shows a success toast/notification.

### 3.5 — "Incoming Orders" Tab
- [ ] Fetches merchant incoming orders using TanStack Query.
- [ ] Displays filter selector: All, Pending, Confirmed, Shipped, Delivered.
- [ ] Each order card shows:
  - Order ID and placement timestamp
  - Product title and image thumbnail
  - Quantity and unit price
  - Total purchase price
  - Buyer shipping address
  - Buyer display name
  - Status badge (pending, confirmed, shipped, delivered, cancelled, returned)
- [ ] **"Ready for Pickup" Button**:
  - Displayed only on orders with `pending` status.
  - Clicking sends `PATCH /api/v1/dashboard/orders/{order_id}/status` with `{"status": "confirmed"}`.
  - Disables button while mutating and updates status badge to `confirmed` on success.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated merchant navigating to `/dashboard` sees their offers, can edit price/stock, and can delete an offer with instantaneous UI refresh.
- [ ] AC2: Searching for an existing product and submitting an offer adds the listing to the merchant's catalog.
- [ ] AC3: Creating a brand new product with metadata and an image file creates both the product and the offer, appearing immediately in "My Offers".
- [ ] AC4: Incoming orders display all buyer and shipping details; clicking "Ready for Pickup" transitions status from pending to confirmed.
- [ ] AC5: Non-merchant users see an Access Restricted message and are prevented from viewing or interacting with dashboard tabs.
- [ ] AC6: Loading skeletons are rendered while data is fetching, and empty states guide the user when zero items exist.

## 5. API Contracts & TypeScript Shapes

### Data Shapes (TypeScript)

**MerchantOffer**:
- `id`: string (UUID)
- `product_id`: string (UUID)
- `product_name`: string
- `product_brand`: string
- `product_description`: string
- `product_image_url`: string or null
- `price`: number
- `stock`: number
- `estimated_delivery_days`: number or null
- `created_at`: string or null

**MerchantOrder**:
- `id`: number
- `product_id`: string (UUID)
- `product_name`: string
- `product_brand`: string
- `product_image_url`: string or null
- `bought_price`: number
- `quantity`: number
- `total_price`: number
- `status`: string (pending, confirmed, shipped, delivered, cancelled, returned)
- `address`: string
- `buyer_name`: string or null
- `created_at`: string

## 6. UI/UX Requirements

- **Route**: `/dashboard`
- **Layout**: Desktop-first layout with max-width container, clean header with merchant greeting and store overview stats (total offers, pending orders count).
- **Tab Bar**: Horizontal tabs with active indicators, accessible keyboard navigation (Tab / Arrow keys).
- **Forms**: Clear label tags, inline validation errors, numeric step constraints (e.g. price step="0.01", min="0.01").
- **Accessibility**: Semantic HTML `<main>`, `<section>`, `<nav>`, `<button>`, with `aria-label` attributes on icon-only buttons (edit, delete).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Network failure during tab load | Show inline retry button with clear error message |
| Duplicate offer submitted on existing product | Display toast/alert: "You already have an active offer for this product" |
| Image upload fails during product creation | Display error message: "Failed to upload image. Please try again or submit without an image" |
| Attempting to confirm already confirmed order | Disable button and show message indicating order is already confirmed |
| Zero offers or zero orders | Render informative empty state graphic with action button |

## 8. Out of Scope

- ❌ Multi-image gallery upload (single image supported per constitution).
- ❌ Logistics courier dispatching (handled in Phase 7).
- ❌ Payment processing (simulated marketplace per constitution).

## 9. Constitution Compliance

- ✅ Thin client: all data logic flows to FastAPI endpoints, no direct Supabase JS access (§4.1).
- ✅ Role guard checks `user_role == "merchant"` (§2, §8).
- ✅ Responsive desktop-first design (§12).
- ✅ Semantic HTML and accessibility attributes (§12).
- ✅ Vitest tests cover UI components and state mutations (§14).

## 10. Open Questions

- None. Tabbed layout and dialog patterns confirmed during clarifying questions.
