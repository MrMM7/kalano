# Spec: Landing Page (Home)

> **Roadmap Reference**: Phase 3, Step 3.3 — Landing page (Home)
> **Branch**: `feat/product-catalog`
> **Spec**: 003 of 005 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Landing Page (`/`) serves as the welcoming storefront for Kalano. It gives visitors and buyers immediate access to discovery through a prominent search input and showcases a curated selection of marketplace products. Each product is displayed in a structured product card featuring the product's image (or fallback placeholder), brand name, product title, and cheapest in-stock price (or an out-of-stock badge). Submitting a search query from the landing page transitions the user directly to the search and listing catalog page (`/products?q=...`) to explore matching results.

## 2. Dependencies

- Depends on: `specs/001-list-products-endpoint/` (requires `GET /api/v1/products` to fetch products)

## 3. Functional Requirements

### 3.1 — Hero & Prominent Search Bar

- [ ] Present a clean, welcoming hero section introducing Kalano as a multi-vendor marketplace.
- [ ] Provide a prominent search bar featuring an input field and a search button.
- [ ] Submitting the search form (via button click or Enter key) with non-empty input must navigate to `/products?q={encoded_query}`.
- [ ] If the user submits an empty or whitespace-only search, either focus the input or navigate to `/products` with no query parameter.

### 3.2 — Featured Products Section

- [ ] Query products from `GET /api/v1/products?limit=8&offset=0` using TanStack Query.
- [ ] Render a responsive grid (e.g. 1 column on mobile, 2 columns on tablet, 4 columns on desktop) displaying product cards.
- [ ] While fetching data, display skeleton loading placeholders matching the card layout.
- [ ] If the fetch fails, display a user-friendly error message with a "Retry" button.
- [ ] If no products exist in the catalog, display a welcoming empty state indicating no products are available yet.

### 3.3 — Product Card Component

- [ ] Display product image if `image_url` is present; otherwise display an accessible placeholder icon/graphic.
- [ ] Display product brand name with subtle muted styling.
- [ ] Display product name as a prominent heading.
- [ ] Display pricing information:
  - If `cheapest_offer` exists and is non-null: display formatted price (e.g. `$149.99`) with label "From" or "Best price".
  - If `cheapest_offer` is null: display an "Out of Stock" badge with muted styling.
- [ ] The entire card (or its primary link) must navigate to the product detail page at `/products/{product_id}`.

### 3.4 — Responsive Design & Accessibility

- [ ] Layout must be desktop-first and responsive down to tablet breakpoints.
- [ ] Semantic HTML structure: `<main>`, `<section>`, `<header>`, `<form role="search">`.
- [ ] All interactive elements must have accessible labels (`aria-label` for search input and buttons).
- [ ] Keyboard navigation: cards, search input, and buttons must be accessible via Tab and Enter/Space.

## 4. Acceptance Criteria

- [ ] AC1: Navigating to `/` displays the hero section, prominent search bar, and featured products section.
- [ ] AC2: Typing a query into the search bar and submitting navigates to `/products?q={query}`.
- [ ] AC3: Product cards accurately display product brand, title, image/placeholder, and cheapest offer price.
- [ ] AC4: Products without in-stock offers display an "Out of Stock" badge instead of a price.
- [ ] AC5: Clicking a product card navigates to `/products/[id]`.
- [ ] AC6: Loading state displays skeleton cards during initial API fetch.
- [ ] AC7: Error state displays clear notification with retry functionality when backend is unreachable.
- [ ] AC8: Vitest component and integration tests pass cleanly.
- [ ] AC9: Any local server launched for testing or verification (FastAPI backend or Next.js dev server) must have an automatic timeout configured to kill the process after X seconds (maximum 30 seconds).

## 5. API Contract

_Consumed by frontend_:

### `GET /api/v1/products`

- Query: `limit=8`, `offset=0`
- Response schema conforms to `ProductsListResponse` specified in Spec 001.

## 6. UI/UX Requirements

- **Page/Route**: `/`
- **Hero Section**:
  - Centered hero container with marketplace title, brief subtitle, and search bar.
  - Search bar input has placeholder: "Search products, brands, or descriptions...".
- **Product Grid**:
  - Section heading: "Featured Products" with an optional "View all products" link navigating to `/products`.
  - Grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`.
- **Card Styling**:
  - Border with subtle hover shadow (`hover:shadow-md transition-shadow`).
  - Fixed aspect ratio for product thumbnail image (`aspect-square` or `aspect-[4/3]`) with object-cover.
  - Truncated title (maximum 2 lines) to maintain equal card heights.
- **States**:
  - Loading: 8 skeleton cards with shimmer effect.
  - Error: Alert card with error description and retry button.
  - Empty: Empty illustration/icon and text "No products available yet. Check back soon!"

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| API request fails or times out | Display error banner with "Unable to load products" and a "Try Again" button |
| Catalog has fewer than 8 products | Render all available products in grid without layout breaking |
| Product image URL is broken / 404 | Render graceful fallback placeholder without broken image icon |
| Search input contains special characters | URL-encode query parameter when navigating to `/products` |
| Product has extremely long name or brand | Text truncates with ellipsis without overflowing card boundary |

## 8. Out of Scope

- ❌ Real-time live search dropdown / autocomplete suggestions (covered as potential future enhancement)
- ❌ Direct "Add to Cart" quick-button on homepage cards (Add to cart belongs in Phase 4)
- ❌ User personalized recommendations (out of scope for MVP)

## 9. Constitution Compliance

- ✅ Thin client: Next.js only fetches data from FastAPI endpoints via `fetch` (§4.1)
- ✅ No Supabase JS client in frontend (§4.1)
- ✅ Semantic HTML and accessibility attributes used throughout (§12)
- ✅ Desktop-first responsive design down to tablet (§12)
- ✅ Naming conventions followed (`kebab-case` files, `PascalCase` components) (§7)
- ✅ Vitest tests for UI components and pages (§14)

## 10. Open Questions

- None.
