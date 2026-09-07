# [x] Phase 5: Checkout & Orders

### [x] Step 5.1 — Checkout endpoint

- Create `POST /api/v1/checkout`.
- Accept: `address` (delivery address).
- For each cart item: create a `user_orders` row with status `pending`, decrement stock in
  `seller_products`.
- Clear the cart after successful order placement.
- Return the list of created order IDs.
- Write tests for: successful checkout, empty cart, out-of-stock item.

### [x] Step 5.2 — Checkout frontend page

- Build the `/checkout` page (protected route).
- Show an order summary (items, quantities, prices, total).
- Include an address input field (pre-filled from user profile if available).
- Show a simulated "Payment" section (fake — just a confirmation button).
- On "Place Order", call `POST /api/v1/checkout`.
- On success, redirect to `/orders` with a success message.

### [x] Step 5.3 — Order history endpoint

- Create `GET /api/v1/orders` — return all orders for the current buyer, with product name, seller
  name, price, quantity, status, and order date.
- Write tests.

### [x] Step 5.4 — Order history frontend page

- Build the `/orders` page (protected route).
- Fetch orders from `GET /api/v1/orders`.
- Display a list/table of past orders with status badges (pending, confirmed, shipped, delivered,
  cancelled, returned).
