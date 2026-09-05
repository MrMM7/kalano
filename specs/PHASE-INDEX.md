# Phase Index: Product Catalog (Read-Only)

> **Roadmap Reference**: Phase 3 — Product Catalog (Read-Only)
> **Branch**: `feat/product-catalog`
> **Date**: 2026-09-05
> **Total Specs**: 5

---

## Execution Order

| # | Spec Folder | Step | Status |
|---|-------------|------|--------|
| 001 | `specs/001-list-products-endpoint/` | Step 3.1 — List products endpoint | ⬜ Pending |
| 002 | `specs/002-product-detail-endpoint/` | Step 3.2 — Product detail endpoint | ⬜ Pending |
| 003 | `specs/003-landing-page/` | Step 3.3 — Landing page (Home) | ⬜ Pending |
| 004 | `specs/004-product-search-listing-page/` | Step 3.4 — Product search & listing page | ⬜ Pending |
| 005 | `specs/005-product-detail-page/` | Step 3.5 — Product detail page | ⬜ Pending |

---

## Dependencies

- **Spec 001 (`specs/001-list-products-endpoint/`)**: Foundational backend endpoint. No prior spec dependencies.
- **Spec 002 (`specs/002-product-detail-endpoint/`)**: Depends on Spec 001 (extends `backend/app/models/product.py`, `backend/app/services/product_service.py`, and `backend/app/routers/products.py`).
- **Spec 003 (`specs/003-landing-page/`)**: Depends on Spec 001 (`GET /api/v1/products` required to fetch featured products for homepage grid). Establishes initial frontend catalog types, API client, and reusable `ProductCard` and `SearchBar` components.
- **Spec 004 (`specs/004-product-search-listing-page/`)**: Depends on Spec 001 (API) and Spec 003 (reuses `ProductCard`, `ProductCardSkeleton`, `SearchBar`, and `useProducts` hook).
- **Spec 005 (`specs/005-product-detail-page/`)**: Depends on Spec 002 (`GET /api/v1/products/{id}` endpoint) and Spec 003 (extends `frontend/types/product.ts` and `frontend/lib/api/products.ts`).

---

## Key Decisions & Architecture Highlights

1. **Pagination & Querying**: `GET /api/v1/products` enforces required `limit` (1-100) and `offset` (>=0) parameters, with optional `q` for case-insensitive substring ILIKE search matching across product `name` and `description`.
2. **Cheapest Offer Calculation**: The backend automatically selects the lowest-priced seller offer with `stock > 0` (tie-broken by lowest estimated delivery days) and attaches it as `cheapest_offer` to each catalog item.
3. **Out-of-Stock Handling**: Products without in-stock offers remain visible in the catalog with an "Out of Stock" badge and `cheapest_offer: null`. The product detail page clearly communicates "Currently Unavailable" and disables purchase actions.
4. **Search Interaction**: Submitting a query in the homepage search bar navigates to `/products?q={query}&limit=20&offset=0`. On `/products`, the search input stays synced with `q` in the URL, triggering automatic refetching via TanStack Query.
5. **No Implementation Code in Specs**: All spec files adhere to the strict pure-text requirement with zero implementation code or mock logic.
6. **Server Process Lifecycle & Automatic Timeout Rule**: Whenever any development or preview server (such as FastAPI/Uvicorn via `uv run uvicorn`, Next.js dev server via `pnpm dev`, or any local HTTP test server) is started during manual verification or smoke checks, it **MUST** have an automatic timeout configured that terminates and kills the process after X seconds (e.g. 15 to 30 seconds max). Subagents and execution runners must never leave server processes running indefinitely.
