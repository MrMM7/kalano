# [x] Phase 6: Merchant Dashboard

### [x] Step 6.1 — Merchant: list my offers endpoint

- Create `GET /api/v1/dashboard/offers` — return all `seller_products` for the current merchant,
  joined with product name, brand, and image.
- Write tests.

### [x] Step 6.2 — Merchant: add offer to existing product

- Create `POST /api/v1/dashboard/offers`.
- Accept: `product_id`, `price`, `stock`, `estimated_delivery_days`.
- Validate the product exists and the merchant doesn't already have an offer for it.
- Write tests.

### [x] Step 6.3 — Merchant: create new product + offer

- Create `POST /api/v1/dashboard/products`.
- Accept: product details (name, description, brand, image) + offer details (price, stock,
  estimated_delivery_days).
- Create the product row, then create the seller_products row.
- Handle image upload to Supabase Storage.
- Write tests.

### [x] Step 6.4 — Merchant: update & delete offers

- Create `PATCH /api/v1/dashboard/offers/{offer_id}` — update price, stock, delivery estimate.
- Create `DELETE /api/v1/dashboard/offers/{offer_id}` — remove the offer.
- Write tests.

### [x] Step 6.5 — Merchant: view incoming orders

- Create `GET /api/v1/dashboard/orders` — return orders where `seller_id` matches the current
  merchant.
- Include a way to mark an order as "ready for pickup" (updates status to `confirmed`).
- Write tests.

### [x] Step 6.6 — Seller dashboard frontend

- Build the `/dashboard` page (protected, merchant-only).
- **My Offers tab**: List all offers with edit/delete actions inline.
- **Add Offer**: Search existing products → if found, add offer; if not, create new product form.
- **Orders tab**: Show incoming orders with a "Ready for Pickup" button.
