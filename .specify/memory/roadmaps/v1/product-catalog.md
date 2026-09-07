# [x] Phase 3: Product Catalog (Read-Only)

### [x] Step 3.1 — List products endpoint

- Create `GET /api/v1/products`.
- Return all products with their cheapest in-stock seller offer (price, seller name, stock).
- Support optional query parameter `?q=` for ILIKE substring search on name and description.
- Write tests for: list all, search with results, search with no results.

### [x] Step 3.2 — Product detail endpoint

- Create `GET /api/v1/products/{product_id}`.
- Return the product details plus **all** seller offers (price, stock, estimated delivery days,
  seller display name), sorted by price ascending.
- Write tests for: existing product, non-existent product.

### [x] Step 3.3 — Landing page (Home)

- Build the `/` page showing a grid/list of popular products.
- Fetch products from `GET /api/v1/products` using TanStack Query.
- Display product cards: image, name, brand, cheapest price.
- Include a prominent search bar at the top.

### [x] Step 3.4 — Product search & listing page

- Build the `/products` page that accepts a `?q=` query parameter.
- Fetch filtered results from the backend.
- Display results in the same card format as the landing page.
- Handle empty state ("No products found").

### [x] Step 3.5 — Product detail page

- Build the `/products/[id]` page.
- Show product info: image, name, brand, description.
- Show the default cheapest in-stock seller offer prominently.
- List all alternative seller offers in a table/list below.
- Include an "Add to Cart" button (wired up in Phase 4).
