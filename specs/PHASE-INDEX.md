# Phase Index: Logistics Dashboard

> **Roadmap Reference**: Phase 7 — Logistics Dashboard
> **Branch**: `feat/logistics-dashboard`
> **Date**: 2026-09-06
> **Total Specs**: 3

---

## Execution Order

| # | Spec Folder | Step | Status |
|---|-------------|------|--------|
| 001 | `specs/001-logistics-view-orders-endpoint/` | Step 7.1 — Logistics: view all orders endpoint | ✅ Complete |
| 002 | `specs/002-logistics-update-order-status-endpoint/` | Step 7.2 — Logistics: update order status | ✅ Complete |
| 003 | `specs/003-logistics-dashboard-frontend/` | Step 7.3 — Logistics dashboard frontend | ✅ Complete |

---

## Dependencies

- **Spec 001 (`specs/001-logistics-view-orders-endpoint/`)**:
  - Independent foundation for Phase 7.
  - Establishes the `backend/app/models/logistics.py` schemas, `backend/app/routers/logistics.py` router, and `backend/app/services/logistics_service.py` query logic.
- **Spec 002 (`specs/002-logistics-update-order-status-endpoint/`)**:
  - Depends directly on Spec 001.
  - Builds on the logistics models, service, and router to implement the state machine transition rules and inventory restoration on cancellation for `PATCH /api/v1/logistics/orders/{order_id}`.
- **Spec 003 (`specs/003-logistics-dashboard-frontend/`)**:
  - Depends directly on Spec 001 and Spec 002.
  - Consumes both the view orders endpoint (`GET /api/v1/logistics/orders`) and the status update endpoint (`PATCH /api/v1/logistics/orders/{order_id}`) to build the interactive `/logistics` dashboard.

---

## Notes & Design Decisions

1. **Role Access Control**:
   - Access to both API endpoints and the frontend page is strictly restricted to authenticated users whose `user_role` equals `logistics`.
   - Buyers and merchants receive HTTP 403 `FORBIDDEN` from the API and an "Access Denied" view on the frontend.
2. **State Machine Transitions**:
   - `pending` can transition to `confirmed` or `cancelled`.
   - `confirmed` can transition to `shipped` or `cancelled`.
   - `shipped` can transition to `delivered` (via "End Delivery" button) or `cancelled`.
   - `delivered` can transition to `returned`.
   - `cancelled` and `returned` are terminal states and cannot transition to any other status.
3. **Stock Restoration on Cancellation**:
   - Cancelling an order automatically restores reserved quantity to the seller's product stock in `seller_products`.
4. **UI Architecture**:
   - Unified data table on `/logistics` with responsive metric cards, search by order ID/customer/seller, status filter tabs, and contextual action buttons with confirmation modals for destructive transitions.
