# Spec: Product Search & Listing Page

> **Roadmap Reference**: Phase 3, Step 3.4 — Product search & listing page
> **Branch**: `feat/product-catalog`
> **Spec**: 004 of 005 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Product Search & Listing Page (`/products`) provides the complete browsable catalog and search results interface for Kalano. Users arriving from the homepage search bar or navigating directly can explore products, search by keyword across product titles and descriptions, and page through catalog results. The page mirrors the visual card language of the homepage while introducing catalog controls: active query indication, total results count, empty search states, and pagination controls.

## 2. Dependencies

- Depends on: `specs/001-list-products-endpoint/` (backend API `GET /api/v1/products`)
- Depends on: `specs/003-landing-page/` (reusable components `ProductCard`, `ProductCardSkeleton`, `SearchBar`, API client `getProducts`, and hook `useProducts`)

## 3. Functional Requirements

### 3.1 — URL Query Parameter Handling

- [ ] The page must read `q`, `limit`, and `offset` from URL search parameters.
- [ ] Defaults: `limit` defaults to 20, `offset` defaults to 0. `q` defaults to undefined/empty string.
- [ ] When the user submits a new search in the search bar on this page, the URL search parameters must update to `?q={query}&limit=20&offset=0`, resetting the offset to 0.
- [ ] Browser forward and back button navigation must correctly update the page's search input and catalog query state.

### 3.2 — Catalog Grid & Product Cards

- [ ] Fetch catalog products using TanStack Query hook `useProducts({ limit, offset, q })`.
- [ ] Display products in a responsive grid using the shared `ProductCard` component.
- [ ] Each card displays image/placeholder, brand, product title, and cheapest offer price (or "Out of Stock" badge).
- [ ] Clicking any product card navigates to `/products/[id]`.

### 3.3 — Header & Search Feedback

- [ ] Provide an active search input bar at the top pre-populated with the current `q` parameter value.
- [ ] Display a results header showing contextual information:
  - If `q` is provided: "Results for '{q}' (X items found)"
  - If `q` is absent or empty: "All Products (X items found)"
- [ ] If `q` is active, provide a "Clear search" button/link that resets the query to browse all products.

### 3.4 — Empty & Error States

- [ ] When search returns 0 products (`total == 0`):
  - Display an informative empty state illustration/icon.
  - Display clear text: "No products found matching '{q}'".
  - Provide suggestions: "Try checking your spelling or searching for a more general keyword."
  - Provide a button to "View All Products".
- [ ] When the API request fails:
  - Display an error notice with a "Retry" button.

### 3.5 — Pagination Controls

- [ ] Calculate current page number and total pages:
  - Current page = `Math.floor(offset / limit) + 1`
  - Total pages = `Math.ceil(total / limit)`
- [ ] Display "Previous" and "Next" pagination buttons below the product grid:
  - "Previous" button is disabled when `offset == 0`.
  - "Next" button is disabled when `offset + limit >= total`.
- [ ] Display current pagination position text: "Page X of Y" or "Showing X-Y of Z products".
- [ ] Clicking "Next" updates the URL parameter to `offset = current_offset + limit`.
- [ ] Clicking "Previous" updates the URL parameter to `offset = Math.max(0, current_offset - limit)`.
- [ ] Pagination change scrolls the window back up to the top of the product grid.

## 4. Acceptance Criteria

- [ ] AC1: Visiting `/products` displays the full catalog with default limit 20.
- [ ] AC2: Visiting `/products?q=wireless` displays products filtered by the keyword with search bar pre-filled.
- [ ] AC3: Searching for a new keyword updates URL query string and refetches filtered data.
- [ ] AC4: Results header displays accurate total count from API response.
- [ ] AC5: Empty search state is shown when no products match the query.
- [ ] AC6: Pagination controls allow advancing to next and previous pages, updating `offset` parameter in URL.
- [ ] AC7: "Previous" button is disabled on first page; "Next" button is disabled on final page.
- [ ] AC8: Vitest tests verify page rendering, search parameter synchronization, and pagination interactions.
- [ ] AC9: Any local server launched for testing or verification (FastAPI backend or Next.js dev server) must have an automatic timeout configured to kill the process after X seconds (maximum 30 seconds).

## 5. API Contract

_Consumed by frontend_:

### `GET /api/v1/products`

- Query Parameters: `limit` (number), `offset` (number), `q` (optional string)
- Response schema conforms to `ProductsListResponse`.

## 6. UI/UX Requirements

- **Page/Route**: `/products`
- **Layout**:
  - Container with max-width `max-w-7xl mx-auto px-4 py-8`.
  - Top: Search bar with clear button.
  - Sub-header: Results count, active search terms, and layout controls.
  - Main: Product card grid (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`).
  - Bottom: Pagination bar with Previous/Next buttons and page indicator.
- **Loading State**:
  - Grid of skeleton cards matching the requested limit (e.g. 8 or 20 skeletons).
- **Responsive**:
  - Desktop-first down to tablet. On tablet/mobile, search bar and pagination remain touch-friendly with minimum 44px tap targets.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid `offset` or `limit` in URL (e.g. negative number or non-numeric) | Coerce to safe defaults (`offset = 0`, `limit = 20`) |
| `offset` exceeds `total` results | Display empty page with button to return to page 1 (`offset = 0`) |
| Search query containing extra spaces | Trim spaces before query and URL serialization |
| Network error during page navigation | Render friendly error boundary with retry action |

## 8. Out of Scope

- ❌ Multi-attribute filter sidebar (brands, price range, categories) — future enhancement
- ❌ Sorting dropdown (sort by price, sort by newest) — future enhancement

## 9. Constitution Compliance

- ✅ Thin client: All data fetched from FastAPI backend (§4.1)
- ✅ No Supabase JS client in frontend (§4.1)
- ✅ Semantic HTML and accessibility labels (`aria-label`, `<form role="search">`, `<nav aria-label="Pagination">`) (§12)
- ✅ Desktop-first responsive layout down to tablet (§12)
- ✅ Vitest test coverage (§14)

## 10. Open Questions

- None.
