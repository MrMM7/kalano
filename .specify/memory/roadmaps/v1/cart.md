# [x] Phase 4: Cart

### [x] Step 4.1 — Cart backend: add item

- Create `POST /api/v1/cart/items`.
- Accept: `seller_product_id`, `quantity`.
- If the buyer has no cart, create one. Add the item to `cart_items`.
- If the item already exists in the cart (same `seller_product_id`), update the quantity.
- Validate that stock is sufficient.
- Write tests for: add new item, update existing item, insufficient stock.

### [x] Step 4.2 — Cart backend: view & modify

- Create `GET /api/v1/cart` — return the current user's cart with all items (product name, seller
  name, price, quantity, subtotal).
- Create `PATCH /api/v1/cart/items/{item_id}` — update quantity.
- Create `DELETE /api/v1/cart/items/{item_id}` — remove item.
- Write tests for each endpoint.

### [x] Step 4.3 — Cart frontend page

- Build the `/cart` page (protected route).
- Fetch cart data from `GET /api/v1/cart`.
- Display each item: product name, seller, price, quantity (editable), subtotal.
- Add +/- buttons to adjust quantity (calls `PATCH`).
- Add a remove button (calls `DELETE`).
- Show the total price at the bottom.
- Add a "Proceed to Checkout" button.

### [x] Step 4.4 — Wire "Add to Cart" on product detail page

- Connect the "Add to Cart" button on `/products/[id]` to `POST /api/v1/cart/items`.
- Default to the cheapest in-stock seller; allow selecting an alternative seller first.
- Show success/error feedback (toast or inline message).
- If not logged in, redirect to `/login`.
