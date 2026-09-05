# Spec: Product Detail Page

> **Roadmap Reference**: Phase 3, Step 3.5 — Product detail page
> **Branch**: `feat/product-catalog`
> **Spec**: 005 of 005 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Product Detail Page (`/products/[id]`) presents comprehensive details for an individual product in the Kalano marketplace. Because Kalano operates as a multi-vendor platform, this page serves two key functions: showcasing the physical product specifications (title, brand, description, image) and comparing offers from multiple competing sellers. The page automatically highlights the lowest-priced in-stock seller offer by default while presenting a transparent comparison table of all alternative merchant offers (displaying seller names, unit prices, available stock, and estimated delivery turnaround times). The page also includes the UI for the "Add to Cart" action, which will be fully wired to the backend cart system in Phase 4.

## 2. Dependencies

- Depends on: `specs/002-product-detail-endpoint/` (backend endpoint `GET /api/v1/products/{product_id}`)
- Depends on: `specs/003-landing-page/` (shared product types in `frontend/types/product.ts`)

## 3. Functional Requirements

### 3.1 — Route & Data Fetching

- [ ] The page must live at route `/products/[id]`, extracting `id` from route parameters.
- [ ] Fetch product details using TanStack Query hook `useProductDetail(id)` calling backend endpoint `GET /api/v1/products/{product_id}`.
- [ ] While fetching, display a structured skeleton loading layout simulating the image, metadata, and offers table.
- [ ] If the backend returns a 404 status (product not found), display a dedicated "Product Not Found" screen with a link back to the catalog.
- [ ] If any other network or server error occurs, display an error banner with a "Retry" button.

### 3.2 — Product Metadata Presentation

- [ ] Render a two-column desktop layout (responsive to single column on mobile/tablet):
  - Left column: Product image container (displaying `image_url` or an accessible geometric placeholder graphic).
  - Right column: Product title, brand badge, full description text, and featured purchasing card.
- [ ] Brand name must be clearly highlighted.
- [ ] Product title must use prominent typography (`text-3xl font-bold`).

### 3.3 — Featured Offer & Purchasing Card

- [ ] If `cheapest_offer` is present and in-stock:
  - Display the featured price prominently in bold typography.
  - Display seller display name: "Sold by [Seller Display Name]".
  - Display delivery estimate: "Estimated delivery in X days" (or "Standard delivery" if days are unspecified).
  - Display in-stock status indicator: "In Stock (X units available)".
  - Include an "Add to Cart" button (styled as primary call-to-action; for Phase 3, this displays a disabled state or placeholder notification indicating cart connectivity arrives in Phase 4).
- [ ] If all offers have zero stock or if no offers exist (`cheapest_offer` is null):
  - Display a prominent "Currently Unavailable" or "Out of Stock" banner.
  - Disable the "Add to Cart" button.
  - Explain that no merchants currently have stock available for delivery.

### 3.4 — Alternative Sellers Comparison Table

- [ ] Below the primary product information, render an "All Seller Offers" section.
- [ ] If multiple sellers exist, display a clean table listing every offer sorted by price ascending:
  - Column 1: Seller (merchant display name).
  - Column 2: Price (unit price formatted in currency).
  - Column 3: Delivery Estimate (e.g. "2 days").
  - Column 4: Stock (inventory count or "Out of stock").
  - Column 5: Action (e.g. "Select Offer" button, which updates the active offer shown in the featured purchasing card).
- [ ] Highlight the currently selected offer row in the table.
- [ ] If only one seller exists, display a message that this is the sole seller on Kalano.

## 4. Acceptance Criteria

- [ ] AC1: Navigating to `/products/[id]` with a valid product ID loads and displays the product title, brand, description, and image.
- [ ] AC2: If in-stock offers exist, the cheapest offer is highlighted with price, seller name, stock, and delivery estimate.
- [ ] AC3: If no offers are in stock, "Currently Unavailable / Out of Stock" is displayed and purchase action is disabled.
- [ ] AC4: Alternative offers table lists all available seller offers sorted by price ascending.
- [ ] AC5: Selecting a different offer from the comparison table updates the active selected offer in the purchasing card.
- [ ] AC6: Querying an invalid or non-existent product ID displays a clear 404 "Product Not Found" screen.
- [ ] AC7: Skeletons are displayed while loading.
- [ ] AC8: Vitest tests verify component rendering, offer selection, and error states.
- [ ] AC9: Any local server launched for testing or verification (FastAPI backend or Next.js dev server) must have an automatic timeout configured to kill the process after X seconds (maximum 30 seconds).

## 5. API Contract

_Consumed by frontend_:

### `GET /api/v1/products/{product_id}`

- Path parameter: `product_id` (UUID)
- Response schema conforms to `ProductDetailResponse` specified in Spec 002.

## 6. UI/UX Requirements

- **Page/Route**: `/products/[id]`
- **Layout**:
  - Container: `max-w-7xl mx-auto px-4 py-8`.
  - Top: Breadcrumb navigation (Home > Products > [Product Name]).
  - Main Grid: `grid grid-cols-1 lg:grid-cols-2 gap-12`.
  - Lower Section: `mt-16` containing "Compare All Sellers" table.
- **Visuals**:
  - Image box: `aspect-square rounded-lg border bg-muted/20 flex items-center justify-center overflow-hidden`.
  - Purchasing Box: Styled card with clear visual hierarchy, border, and prominent action button.
- **States**:
  - Loading: Page skeleton covering image, title blocks, and table rows.
  - 404 State: Centered error message with "Back to Catalog" button.
  - Error State: Alert banner with retry trigger.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Product ID does not exist (404) | Display 404 "Product not found" layout with button redirecting to `/products` |
| Malformed UUID in URL route | Catch error in query and display 404 / not found screen |
| Product has no seller offers at all | Display "No sellers have listed this item yet. Check back later." |
| All seller offers have stock = 0 | Display "Out of Stock", disable cart button, show offers as unavailable |
| Selected alternative seller goes out of stock | Revert selection to cheapest in-stock seller |

## 8. Out of Scope

- ❌ Mutation of cart items via `POST /api/v1/cart/items` (scheduled for Phase 4: Cart)
- ❌ Merchant adding new listing directly from this page (scheduled for Phase 6: Merchant Dashboard)
- ❌ Product reviews and star ratings (not in roadmap)

## 9. Constitution Compliance

- ✅ Thin client: All data fetched directly from FastAPI backend (§4.1)
- ✅ No Supabase JS client in frontend (§4.1)
- ✅ Semantic HTML and accessibility (`aria-label`, `<table>`, `<th scope="col">`) (§12)
- ✅ Desktop-first responsive design down to tablet (§12)
- ✅ Vitest test coverage (§14)

## 10. Open Questions

- None.
