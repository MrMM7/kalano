# [x] Phase 7: Logistics Dashboard

### [x] Step 7.1 — Logistics: view all orders endpoint

- Create `GET /api/v1/logistics/orders` — return all orders with buyer address, seller info,
  product details, and current status.
- Support filtering by status query parameter.
- Write tests.

### [x] Step 7.2 — Logistics: update order status

- Create `PATCH /api/v1/logistics/orders/{order_id}` — update `delivery_types`.
- Only allow valid transitions: `pending` → `confirmed` → `shipped` → `delivered`.
- Also allow: any status → `cancelled`, delivered → `returned`.
- Write tests for valid and invalid transitions.

### [x] Step 7.3 — Logistics dashboard frontend

- Build the `/logistics` page (protected, logistics-only).
- Display all orders in a table with status badges.
- Add filter/sort by status.
- Include status update buttons (Confirm, Ship, Deliver, Cancel).
- Include the "End Delivery" button that marks as `delivered`.
