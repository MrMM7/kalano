# Phase Index: Cart

> **Roadmap Reference**: Phase 4 — Cart
> **Branch**: `feat/cart`
> **Date**: 2026-09-05
> **Total Specs**: 4

---

## Execution Order

| # | Spec Folder | Step | Status |
|---|-------------|------|--------|
| 001 | `specs/001-cart-backend-add-item/` | Step 4.1 — Cart backend: add item | ✅ Complete |
| 002 | `specs/002-cart-backend-view-modify/` | Step 4.2 — Cart backend: view & modify | ⬜ Pending |
| 003 | `specs/003-cart-frontend-page/` | Step 4.3 — Cart frontend page | ⬜ Pending |
| 004 | `specs/004-wire-add-to-cart-product-page/` | Step 4.4 — Wire "Add to Cart" on product detail page | ⬜ Pending |

---

## Dependencies

- **Spec 001 (Cart Backend: Add Item)**:
  - Foundation backend spec; establishes `models/cart.py`, `services/cart_service.py`, `routers/cart.py`, and `POST /api/v1/cart/items`.
  - No prior specs in Phase 4 required.

- **Spec 002 (Cart Backend: View & Modify)**:
  - Depends on `specs/001-cart-backend-add-item/`.
  - Expands the cart models, services, router, and tests to provide `GET /api/v1/cart`, `PATCH /api/v1/cart/items/{item_id}`, and `DELETE /api/v1/cart/items/{item_id}`.

- **Spec 003 (Cart Frontend Page)**:
  - Depends on `specs/002-cart-backend-view-modify/`.
  - Builds `/cart` page, TypeScript types, API client, TanStack Query hooks, and UI components relying on backend endpoints from Specs 001 and 002.

- **Spec 004 (Wire "Add to Cart" on Product Detail Page)**:
  - Depends on `specs/001-cart-backend-add-item/` (for backend endpoint) and `specs/003-cart-frontend-page/` (for API client functions and hooks).
  - Wires the purchasing action button on `/products/[id]`, including auth redirect and toast notifications.

---

## Notes & Decisions

1. **Strict No-Logic Spec Policy**: All specifications, plans, and task breakdowns are documented in pure natural language text without implementation code or logic blocks, in strict compliance with project guidelines.
2. **Stock Validation**: Adding or updating items beyond available merchant inventory rejects with HTTP 400 Bad Request (`INSUFFICIENT_STOCK`) and leaves the cart unchanged.
3. **Guest Cart Behavior**: Unauthenticated visitors clicking "Add to Cart" or navigating to `/cart` are redirected to `/login?redirect=...` preserving return destinations.
4. **Role Isolation**: Cart endpoints and pages are restricted to the `buyer` role per Constitution §2 and §8.
