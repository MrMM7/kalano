# Phase Index: Merchant Dashboard

> **Roadmap Reference**: Phase 6 — Merchant Dashboard
> **Branch**: `feat/merchant-dashboard`
> **Date**: 2026-09-06
> **Total Specs**: 6

---

## Execution Order

| # | Spec Folder | Step | Status |
|---|-------------|------|--------|
| 001 | `specs/001-merchant-list-offers-endpoint/` | Step 6.1 — Merchant: list my offers endpoint | ✅ Complete |
| 002 | `specs/002-merchant-add-offer-endpoint/` | Step 6.2 — Merchant: add offer to existing product | ✅ Complete |
| 003 | `specs/003-merchant-create-product-offer-endpoint/` | Step 6.3 — Merchant: create new product + offer | ✅ Complete |
| 004 | `specs/004-merchant-update-delete-offers-endpoints/` | Step 6.4 — Merchant: update & delete offers | ⬜ Pending |
| 005 | `specs/005-merchant-incoming-orders-endpoint/` | Step 6.5 — Merchant: view incoming orders | ⬜ Pending |
| 006 | `specs/006-seller-dashboard-frontend/` | Step 6.6 — Seller dashboard frontend | ⬜ Pending |

---

## Dependencies

- **Spec 001** initializes the core foundation: `backend/app/routers/dashboard.py`, `backend/app/models/dashboard.py`, and `backend/app/services/dashboard_service.py`.
- **Spec 002** depends on Spec 001 (extends the dashboard router and models with offer creation logic).
- **Spec 003** depends on Specs 001 and 002 (adds multipart product creation and Supabase Storage upload, reusing offer schemas).
- **Spec 004** depends on Specs 001 and 002 (modifies and deletes existing seller offers).
- **Spec 005** depends on Spec 001 (adds incoming orders retrieval and the ready-for-pickup status update).
- **Spec 006** depends on Specs 001 through 005 (frontend seller dashboard at `/dashboard` consuming all backend endpoints).
- **Parallelization**: Specs 004 and 005 can be executed in parallel after Spec 002 is completed.

---

## Notes & Design Decisions

1. **Role Protection**: All dashboard endpoints strictly enforce authentication and require `current_user.user_role == "merchant"`. Non-merchants receive HTTP 403 Forbidden with standard error code `FORBIDDEN`.
2. **Product Image Upload**: Handled as `multipart/form-data` directly on `POST /api/v1/dashboard/products`. The backend streams the image file to the `products` bucket in Supabase Storage and records the public URL.
3. **Order Status Transition**: Merchants can only transition orders from `pending` to `confirmed` (marking items as ready for pickup). Courier dispatch and downstream statuses (`shipped`, `delivered`, `returned`) are managed by Logistics in Phase 7.
4. **Dashboard Layout**: Single-page tabbed interface at `/dashboard` with three primary views: "My Offers", "Add Offer" (with catalog search and new product modal), and "Incoming Orders".
