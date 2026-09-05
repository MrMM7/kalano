# Phase Index: Checkout & Orders

> **Roadmap Reference**: Phase 5 — Checkout & Orders
> **Branch**: `feat/checkout-and-orders`
> **Date**: 2026-09-05
> **Total Specs**: 4

---

## Execution Order

| # | Spec Folder | Step | Status |
|---|-------------|------|--------|
| 001 | `specs/001-checkout-endpoint/` | Step 5.1 — Checkout endpoint | ✅ Complete |
| 002 | `specs/002-checkout-frontend-page/` | Step 5.2 — Checkout frontend page | ⬜ Pending |
| 003 | `specs/003-order-history-endpoint/` | Step 5.3 — Order history endpoint | ⬜ Pending |
| 004 | `specs/004-order-history-frontend-page/` | Step 5.4 — Order history frontend page | ⬜ Pending |

## Dependencies

- **Spec 001** (`specs/001-checkout-endpoint/`) is independent and foundation-level within this phase; it creates `user_orders` records and decrements stock.
- **Spec 002** (`specs/002-checkout-frontend-page/`) depends on Spec 001 (`POST /api/v1/checkout` endpoint).
- **Spec 003** (`specs/003-order-history-endpoint/`) depends on Spec 001 (needs `user_orders` records to query and verify), but can be developed in parallel with Spec 002.
- **Spec 004** (`specs/004-order-history-frontend-page/`) depends on Spec 003 (`GET /api/v1/orders` endpoint) and integrates with the post-checkout redirection from Spec 002.

## Parallelization Opportunities

- Spec 002 (Checkout Frontend) and Spec 003 (Order History Backend) can be implemented in parallel once Spec 001 is completed.
- Within each spec, backend models/services and frontend components/tests can be split across subagents.

## Phase Notes & Decisions

- **Atomic Stock Verification**: All items in the cart are checked against inventory atomically prior to placing orders; if any item is out of stock, the entire checkout is aborted without modifying database state.
- **Address Persistence**: The checkout form allows buyers to enter a delivery address (pre-filled with `user.address` if available) and provides an optional checkbox to update the buyer's default profile address.
- **Simulated Payment**: In accordance with the project constitution (§1), payment processing is simulated without integrating external payment processors. A clear educational disclaimer is displayed on the checkout screen.
- **Post-Checkout Navigation**: Upon completing checkout, the cart is cleared, cart cache invalidated, and the buyer is redirected immediately to `/orders` with a success toast notification.
