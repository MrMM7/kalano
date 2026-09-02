# Kalano — Development Roadmap

> Each step is designed to be **1–2 hours of work max**. Steps are atomic and build on each other
> sequentially. Complete each step fully (backend + frontend + tests where applicable) before
> moving on.

---

## [ ] Phase 1: Project Scaffolding

### [ ] Step 1.1 — Initialize the full monorepo

- Create `frontend/` and `backend/` top-level directories.
- **Frontend**: Initialize Next.js with TypeScript, TailwindCSS, App Router. Install and configure
  shadcn/ui, TanStack Query, Zod, Vitest. Set up ESLint + Prettier.
- **Backend**: Initialize FastAPI with uv and `pyproject.toml`. Install supabase-py, python-jose
  (JWT), argon2-cffi, pytest. Set up Ruff. Create the folder structure (`app/main.py`,
  `app/routers/`, `app/models/`, `app/services/`, `app/dependencies/`, `app/utils/`).
- Create the FastAPI app instance in `main.py` with CORS middleware. Add a health-check endpoint
  (`GET /api/v1/health`) and a test for it.
- Create a Supabase client utility in `app/dependencies/` that reads credentials from `.env`.
- Create `.env.example` files for both frontend and backend. Add `.gitignore` entries for `.env`,
  `node_modules`, `__pycache__`, `.venv`.
- Verify both apps start locally (`pnpm dev` and `uv run uvicorn`) and lint/format commands run
  cleanly.

---

## [ ] Phase 2: Authentication

### [ ] Step 2.1 — User registration endpoint

- Create `POST /api/v1/auth/register`.
- Accept: `email`, `password`, `display_name`, `user_role` (buyer or merchant).
- Hash the password with argon2, insert into `users` table.
- Return the created user (without password_hash).
- Write pytest tests for: success, duplicate email, missing fields.

### [ ] Step 2.2 — User login endpoint

- Create `POST /api/v1/auth/login`.
- Accept: `email`, `password`.
- Verify password against stored hash.
- Issue a JWT token containing `user_id`, `user_role`, and `exp`.
- Return the JWT in the response body (frontend will set it as a cookie).
- Write pytest tests for: success, wrong password, non-existent user.

### [ ] Step 2.3 — Auth dependency & current user

- Create a FastAPI dependency `get_current_user` that extracts and validates the JWT from the
  request (cookie or Authorization header).
- Create a `GET /api/v1/auth/me` endpoint that returns the current user's profile.
- Write tests for: valid token, expired token, missing token.

### [ ] Step 2.4 — Frontend auth pages (Sign Up)

- Build the `/signup` page with a form: email, password, display name, role selector
  (Buyer/Merchant).
- Use Zod for client-side validation.
- On submit, call `POST /api/v1/auth/register`.
- On success, redirect to `/login`.
- Display validation errors inline.

### [ ] Step 2.5 — Frontend auth pages (Log In)

- Build the `/login` page with a form: email, password.
- On submit, call `POST /api/v1/auth/login`.
- Store the returned JWT in an httpOnly cookie.
- Redirect to `/` on success.
- Display error messages for invalid credentials.

### [ ] Step 2.6 — Auth context & middleware

- Create a React Context (`AuthContext`) that holds the current user state.
- On app mount, call `GET /api/v1/auth/me` to hydrate the user.
- Set up Next.js middleware to protect routes: `/cart`, `/checkout`, `/orders`, `/dashboard`,
  `/logistics`.
- Add a logout flow that clears the cookie and redirects to `/`.

---

## [ ] Phase 3: Product Catalog (Read-Only)

### [ ] Step 3.1 — List products endpoint

- Create `GET /api/v1/products`.
- Return all products with their cheapest in-stock seller offer (price, seller name, stock).
- Support optional query parameter `?q=` for ILIKE substring search on name and description.
- Write tests for: list all, search with results, search with no results.

### [ ] Step 3.2 — Product detail endpoint

- Create `GET /api/v1/products/{product_id}`.
- Return the product details plus **all** seller offers (price, stock, estimated delivery days,
  seller display name), sorted by price ascending.
- Write tests for: existing product, non-existent product.

### [ ] Step 3.3 — Landing page (Home)

- Build the `/` page showing a grid/list of popular products.
- Fetch products from `GET /api/v1/products` using TanStack Query.
- Display product cards: image, name, brand, cheapest price.
- Include a prominent search bar at the top.

### [ ] Step 3.4 — Product search & listing page

- Build the `/products` page that accepts a `?q=` query parameter.
- Fetch filtered results from the backend.
- Display results in the same card format as the landing page.
- Handle empty state ("No products found").

### [ ] Step 3.5 — Product detail page

- Build the `/products/[id]` page.
- Show product info: image, name, brand, description.
- Show the default cheapest in-stock seller offer prominently.
- List all alternative seller offers in a table/list below.
- Include an "Add to Cart" button (wired up in Phase 4).

---

## [ ] Phase 4: Cart

### [ ] Step 4.1 — Cart backend: add item

- Create `POST /api/v1/cart/items`.
- Accept: `seller_product_id`, `quantity`.
- If the buyer has no cart, create one. Add the item to `cart_items`.
- If the item already exists in the cart (same `seller_product_id`), update the quantity.
- Validate that stock is sufficient.
- Write tests for: add new item, update existing item, insufficient stock.

### [ ] Step 4.2 — Cart backend: view & modify

- Create `GET /api/v1/cart` — return the current user's cart with all items (product name, seller
  name, price, quantity, subtotal).
- Create `PATCH /api/v1/cart/items/{item_id}` — update quantity.
- Create `DELETE /api/v1/cart/items/{item_id}` — remove item.
- Write tests for each endpoint.

### [ ] Step 4.3 — Cart frontend page

- Build the `/cart` page (protected route).
- Fetch cart data from `GET /api/v1/cart`.
- Display each item: product name, seller, price, quantity (editable), subtotal.
- Add +/- buttons to adjust quantity (calls `PATCH`).
- Add a remove button (calls `DELETE`).
- Show the total price at the bottom.
- Add a "Proceed to Checkout" button.

### [ ] Step 4.4 — Wire "Add to Cart" on product detail page

- Connect the "Add to Cart" button on `/products/[id]` to `POST /api/v1/cart/items`.
- Default to the cheapest in-stock seller; allow selecting an alternative seller first.
- Show success/error feedback (toast or inline message).
- If not logged in, redirect to `/login`.

---

## [ ] Phase 5: Checkout & Orders

### [ ] Step 5.1 — Checkout endpoint

- Create `POST /api/v1/checkout`.
- Accept: `address` (delivery address).
- For each cart item: create a `user_orders` row with status `pending`, decrement stock in
  `seller_products`.
- Clear the cart after successful order placement.
- Return the list of created order IDs.
- Write tests for: successful checkout, empty cart, out-of-stock item.

### [ ] Step 5.2 — Checkout frontend page

- Build the `/checkout` page (protected route).
- Show an order summary (items, quantities, prices, total).
- Include an address input field (pre-filled from user profile if available).
- Show a simulated "Payment" section (fake — just a confirmation button).
- On "Place Order", call `POST /api/v1/checkout`.
- On success, redirect to `/orders` with a success message.

### [ ] Step 5.3 — Order history endpoint

- Create `GET /api/v1/orders` — return all orders for the current buyer, with product name, seller
  name, price, quantity, status, and order date.
- Write tests.

### [ ] Step 5.4 — Order history frontend page

- Build the `/orders` page (protected route).
- Fetch orders from `GET /api/v1/orders`.
- Display a list/table of past orders with status badges (pending, confirmed, shipped, delivered,
  cancelled, returned).

---

## [ ] Phase 6: Merchant Dashboard

### [ ] Step 6.1 — Merchant: list my offers endpoint

- Create `GET /api/v1/dashboard/offers` — return all `seller_products` for the current merchant,
  joined with product name, brand, and image.
- Write tests.

### [ ] Step 6.2 — Merchant: add offer to existing product

- Create `POST /api/v1/dashboard/offers`.
- Accept: `product_id`, `price`, `stock`, `estimated_delivery_days`.
- Validate the product exists and the merchant doesn't already have an offer for it.
- Write tests.

### [ ] Step 6.3 — Merchant: create new product + offer

- Create `POST /api/v1/dashboard/products`.
- Accept: product details (name, description, brand, image) + offer details (price, stock,
  estimated_delivery_days).
- Create the product row, then create the seller_products row.
- Handle image upload to Supabase Storage.
- Write tests.

### [ ] Step 6.4 — Merchant: update & delete offers

- Create `PATCH /api/v1/dashboard/offers/{offer_id}` — update price, stock, delivery estimate.
- Create `DELETE /api/v1/dashboard/offers/{offer_id}` — remove the offer.
- Write tests.

### [ ] Step 6.5 — Merchant: view incoming orders

- Create `GET /api/v1/dashboard/orders` — return orders where `seller_id` matches the current
  merchant.
- Include a way to mark an order as "ready for pickup" (updates status to `confirmed`).
- Write tests.

### [ ] Step 6.6 — Seller dashboard frontend

- Build the `/dashboard` page (protected, merchant-only).
- **My Offers tab**: List all offers with edit/delete actions inline.
- **Add Offer**: Search existing products → if found, add offer; if not, create new product form.
- **Orders tab**: Show incoming orders with a "Ready for Pickup" button.

---

## [ ] Phase 7: Logistics Dashboard

### [ ] Step 7.1 — Logistics: view all orders endpoint

- Create `GET /api/v1/logistics/orders` — return all orders with buyer address, seller info,
  product details, and current status.
- Support filtering by status query parameter.
- Write tests.

### [ ] Step 7.2 — Logistics: update order status

- Create `PATCH /api/v1/logistics/orders/{order_id}` — update `delivery_types`.
- Only allow valid transitions: `pending` → `confirmed` → `shipped` → `delivered`.
- Also allow: any status → `cancelled`, delivered → `returned`.
- Write tests for valid and invalid transitions.

### [ ] Step 7.3 — Logistics dashboard frontend

- Build the `/logistics` page (protected, logistics-only).
- Display all orders in a table with status badges.
- Add filter/sort by status.
- Include status update buttons (Confirm, Ship, Deliver, Cancel).
- Include the "End Delivery" button that marks as `delivered`.

---

## [ ] Phase 8: Polish & Integration

### [ ] Step 8.1 — Shared layout & navigation

- Build the global layout: navbar with logo, search bar, cart icon (with item count badge), user
  menu (login/signup or profile/logout).
- Conditionally show dashboard links based on user role.
- Add a simple footer.

### [ ] Step 8.2 — Loading & error states

- Add loading skeletons/spinners to all pages that fetch data.
- Add user-friendly error states for failed API calls.
- Add toast notifications for actions (added to cart, order placed, etc.).

### [ ] Step 8.3 — Accessibility pass

- Audit all interactive elements for `aria-label` attributes.
- Ensure all forms have proper `<label>` elements.
- Test keyboard navigation through the main flows.
- Verify semantic HTML usage (`<main>`, `<nav>`, `<section>`, `<button>`).

### [ ] Step 8.4 — Responsive design pass

- Ensure all pages render well on desktop and tablet breakpoints.
- Adjust grid layouts, font sizes, and spacing for smaller screens.
- Test the navbar collapses or adapts on tablet.

### [ ] Step 8.5 — End-to-end smoke test

- Manually (or via a test script) walk through the complete flow:
  1. Register a merchant → create a product with an offer.
  2. Register a buyer → search for the product → add to cart → checkout.
  3. Merchant marks order as ready for pickup.
  4. Logistics picks up, ships, and delivers the order.
- Fix any bugs found during this walkthrough.

### [ ] Step 8.6 — README & documentation

- Write a comprehensive `README.md` with: project description, tech stack, setup instructions
  (frontend + backend), environment variable reference, and how to run tests.
- Ensure `.env.example` files are up to date.
- Final review of all code against the constitution.

---

## [ ] Phase 9: UI/UX Improvements

### [ ] Step 9.1 — Research & synthesize UI/UX best practices

- Research online for current UI/UX best practices relevant to e-commerce platforms — covering
  layout patterns, typography, color theory, spacing systems, micro-interactions, navigation UX,
  form design, empty states, feedback patterns, and conversion-oriented design.
- Synthesize all findings into `.specify/memory/RESEARCH.md` — a structured reference document with
  cited sources, categorized recommendations, and concrete actionable items mapped to Kalano's
  pages.
- This file serves as the design rationale for all changes in the following step.

### [ ] Step 9.2 — Apply UI/UX research to code

- Using the recommendations from `RESEARCH.md`, systematically improve the frontend:
  - Refine spacing, typography scale, and color palette across all pages.
  - Improve component visual hierarchy (buttons, cards, tables, forms).
  - Add micro-interactions and transitions where they aid usability (hover states, page transitions,
    button feedback).
  - Polish empty states, zero-data screens, and onboarding cues.
  - Improve form UX (inline validation, clear error placement, input affordances).
  - Enhance navigation flow and visual consistency across all pages.
- Every change must be traceable back to a specific recommendation in `RESEARCH.md`.
