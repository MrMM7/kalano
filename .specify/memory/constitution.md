# Kalano — Project Constitution

> This document is the single source of truth for all requirements, standards, conventions, and rules
> governing the Kalano codebase. Every contributor (human or AI) **must** follow it without exception.

---

## 1. Project Overview

Kalano is a **multi-vendor e-commerce platform** (similar to Amazon) where multiple sellers can list
offers for the same product. Buyers search for products, automatically receive the cheapest in-stock
offer (or manually select a seller), and have orders fulfilled by Kalano's logistics team.

> **This is NOT a real product.** It is built solely for learning purposes. References to "payment",
> "money", or "checkout" are simulated — **never integrate real payment processors.**

---

## 2. User Roles

| Role | Description |
|------|-------------|
| **Buyer** | Browses, searches, adds items to cart, places orders, tracks delivery. |
| **Merchant** | Manages listings, stock, pricing, estimated delivery times. Receives order notifications and marks items as ready for pickup. |
| **Logistics** | Views incoming orders, manages pickup & delivery flow, updates delivery statuses. Auto-assigned by the company (not self-registered). |

During account creation, users choose between **Merchant** or **Buyer**. Logistics accounts are
created internally.

---

## 3. Tech Stack

### Frontend

| Tool | Purpose |
|------|---------|
| **Next.js** (App Router) | React framework — `app/` directory routing |
| **TypeScript** | Type safety (strict mode enabled) |
| **TailwindCSS** | Utility-first styling |
| **shadcn/ui** | Component library (copy-paste, fully customizable) |
| **Zod** | Runtime schema validation |
| **TanStack Query** (React Query) | Server state management |
| **React Context** | Local/client state management |
| **Vitest** | Unit & integration testing |
| **pnpm** | Package manager |

### Backend

| Tool | Purpose |
|------|---------|
| **Python** | Backend language |
| **FastAPI** | REST API framework |
| **Pydantic** | Request/response models & validation |
| **Supabase** (Python client) | Database & storage (accessed **only** from the backend) |
| **argon2** | Password hashing |
| **Pytest** | Testing |
| **uv** | Dependency management |

### Code Quality

| Tool | Scope |
|------|-------|
| **ESLint + Prettier** | Frontend linting & formatting |
| **Ruff** | Backend linting & formatting |

---

## 4. Architecture Rules

### 4.1 — Strict Backend Separation

- **Next.js is strictly prohibited from doing any backend work.** All business logic, database
  queries, authentication, and data mutations live in FastAPI.
- The frontend is a **thin client**: it calls FastAPI endpoints via `fetch` and renders the
  responses.
- The frontend **never** imports or uses the Supabase JS client. All Supabase access flows through
  FastAPI → Supabase Python client.

### 4.2 — Authentication

- Supabase Auth is **not used**. Email and password are stored directly in the `users` table
  (anti-pattern accepted for learning purposes).
- Passwords are hashed with **argon2** before storage.
- FastAPI issues **JWT tokens** upon successful login.
- The frontend stores the JWT in an **httpOnly cookie** (not localStorage).
- Next.js **middleware** checks for the JWT cookie and redirects unauthenticated users away from
  protected routes (seller dashboard, logistics dashboard, checkout, cart, order history).

### 4.3 — API Communication

- REST API with the **OpenAPI spec auto-generated** by FastAPI (`/docs` available in development).
- All endpoints are prefixed with `/api/v1/`.
- The frontend consumes the API using `fetch` (no axios dependency unless explicitly added later).

#### OpenAPI Documentation Standards

The auto-generated OpenAPI spec must be **thorough and production-quality**:

- Every endpoint must have a **`summary`** (short, shown in the endpoint list) and a
  **`description`** (detailed, explains behavior, side effects, and edge cases).
- Every endpoint must be assigned to a **tag** (e.g., `Auth`, `Products`, `Cart`, `Orders`,
  `Dashboard`, `Logistics`) for logical grouping in the docs UI.
- All request bodies and responses must use **Pydantic models** with:
  - Field-level `description` strings (via `Field(description="...")`).
  - Explicit `examples` where helpful.
  - Proper types — no `Any` or `dict` as a shortcut.
- All path/query parameters must have `description` strings.
- Error responses must be documented using FastAPI's `responses` parameter on the route decorator,
  listing the possible error codes and their meaning.

### 4.4 — Error Handling

All API errors return a consistent JSON envelope:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Product with the given ID does not exist."
  }
}
```

- Use appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`, `422`, `500`).
- Never expose internal stack traces or database errors to the client.

### 4.5 — Environment & Configuration

- Secrets and configuration live in `.env` files (**gitignored**).
- A `.env.example` file is committed to the repo as a template with placeholder values.
- Both `frontend/.env.example` and `backend/.env.example` must be maintained.

---

## 5. Database Schema

The Supabase schema is **predefined and already created** — do not write migration scripts or
attempt to recreate these tables.

### Tables

- **`users`** — id (uuid PK), created_at, user_role, display_name, email (unique), password_hash,
  address (nullable)
- **`products`** — id (uuid PK), created_at, name, description, brand, image_url (nullable)
- **`seller_products`** — id (uuid PK), product_id (FK → products), seller_id (FK → users), price,
  stock, estimated_delivery_days (nullable)
- **`user_orders`** — id (int8 PK identity), created_at, product_id (FK → products), bought_price,
  buyer_id (FK → users, nullable), delivery_types, address, seller_id (FK → users, nullable),
  quantity
- **`carts`** — id (int8 PK identity), created_at, user_id (FK → users, nullable), updated_at
  (nullable)
- **`cart_items`** — id (int8 PK identity), created_at, cart_id (FK → carts), seller_product_id
  (FK → seller_products), quantity

### Custom Enums

- **`delivered_types`**: `pending` | `confirmed` | `shipped` | `delivered` | `cancelled` |
  `returned`
- **`user_role`**: `buyer` | `merchant` | `logistics`

---

## 6. Repository Structure

Monorepo with two top-level directories:

```
kalano/
├── frontend/          # Next.js app
│   ├── app/           # App Router pages & layouts
│   ├── components/    # Reusable UI components
│   ├── lib/           # Utilities, API client, hooks
│   ├── types/         # Shared TypeScript types
│   ├── public/        # Static assets
│   ├── .env.example
│   ├── package.json
│   └── ...
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── main.py        # FastAPI app entry point
│   │   ├── routers/       # Route modules
│   │   ├── models/        # Pydantic models / schemas
│   │   ├── services/      # Business logic
│   │   ├── dependencies/  # Dependency injection (auth, db)
│   │   └── utils/         # Helpers
│   ├── tests/
│   ├── .env.example
│   ├── pyproject.toml
│   └── ...
├── .specify/          # Project memory & constitution
├── DESIGN.md
├── TECHNICAL.md
└── README.md
```

---

## 7. Naming Conventions

### Frontend (TypeScript / Next.js)

| Element | Convention | Example |
|---------|-----------|---------|
| Files & folders | `kebab-case` | `product-card.tsx`, `use-auth.ts` |
| React components | `PascalCase` | `ProductCard`, `SearchBar` |
| Functions & variables | `camelCase` | `fetchProducts`, `isLoading` |
| Types & interfaces | `PascalCase` | `Product`, `SellerOffer` |
| Constants | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| CSS classes | Tailwind utilities (no custom CSS files unless absolutely necessary) | — |

### Backend (Python / FastAPI)

| Element | Convention | Example |
|---------|-----------|---------|
| Files & folders | `snake_case` | `product_router.py`, `auth_service.py` |
| Functions & variables | `snake_case` | `get_product_by_id`, `current_user` |
| Classes | `PascalCase` | `ProductResponse`, `OrderCreate` |
| Constants | `UPPER_SNAKE_CASE` | `JWT_SECRET_KEY` |
| API endpoints | `kebab-case` in URL paths | `/api/v1/seller-products` |

---

## 8. Frontend Pages

| Page | Route | Auth Required | Roles |
|------|-------|--------------|-------|
| Landing / Home | `/` | No | All |
| Sign Up | `/signup` | No | — |
| Log In | `/login` | No | — |
| Product Search / Listing | `/products` | No | All |
| Product Detail | `/products/[id]` | No | All |
| Cart | `/cart` | Yes | Buyer |
| Checkout | `/checkout` | Yes | Buyer |
| Order History | `/orders` | Yes | Buyer |
| Seller Dashboard | `/dashboard` | Yes | Merchant |
| Logistics Dashboard | `/logistics` | Yes | Logistics |

---

## 9. Cart & Checkout Flow

1. **Cart is server-side** — backed by the `carts` and `cart_items` tables in Supabase.
2. Each buyer has one cart. Adding items creates/updates `cart_items` rows linked via
   `seller_product_id`.
3. By default, the cheapest in-stock seller is auto-selected. The buyer can override this on the
   product detail page.
4. **Checkout** displays a simulated payment confirmation page (no real payment processing).
5. On "Place Order", each cart item is converted into a `user_orders` row with status `pending`, and
   the cart is cleared.
6. Stock is decremented on order placement.

---

## 10. Search

- Simple **substring / ILIKE search** on `products.name` and `products.description`.
- Search is triggered from a search bar available on the landing page and persisted in the products
  listing page.
- No external search engine (no Algolia, Meilisearch, etc.).

---

## 11. Image Storage

- Product images are stored in **Supabase Storage buckets**.
- The backend handles image uploads and returns a public URL stored in `products.image_url`.

---

## 12. Design & Accessibility

### Responsive Design

- **Desktop-first** layout, responsive down to tablet breakpoints.
- Mobile is nice-to-have but not a hard requirement for MVP.

### Accessibility

- Use **semantic HTML** (`<main>`, `<nav>`, `<section>`, `<button>`, etc.).
- Add `aria-label` attributes to all interactive elements that lack visible text.
- Ensure keyboard navigation works for all interactive flows.
- Maintain sufficient color contrast ratios.

---

## 13. Git Conventions

### Commit Messages — Conventional Commits

```
<type>(<scope>): <short description>

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`

**Scopes** (optional): `frontend`, `backend`, `db`, `auth`, `cart`, `checkout`, `logistics`,
`search`, `dashboard`

Examples:
- `feat(backend): add JWT token generation on login`
- `fix(frontend): correct cart quantity update logic`
- `docs: update constitution with search rules`

### Branching Strategy

- `main` — stable, always deployable.
- `feat/<short-description>` — feature branches.
- `fix/<short-description>` — bug fix branches.
- All work happens on feature/fix branches and is merged into `main`.

---

## 14. Testing

### Frontend (Vitest)

- Test critical UI components and hooks.
- Test API client utility functions.

### Backend (Pytest)

- **All API endpoints must have tests.**
- **All critical business logic** (auth, cart operations, order placement, stock management) must
  have tests.
- No strict coverage percentage enforced, but untested endpoints are not considered complete.

---

## 15. Merchant Product Listing Flow

1. Merchant searches the platform catalog for the product they want to sell.
2. **If the product exists**: Merchant adds themselves as a seller under that product — providing
   their price, stock quantity, and estimated delivery days.
3. **If the product does not exist**: Merchant creates a new product listing (name, description,
   brand, image) and then adds their offer under it.
4. Merchants can update price, stock, and delivery estimate from their dashboard.
5. Merchants receive order notifications and mark items as **ready for pickup**.

---

## 16. Logistics Flow

1. Logistics staff access `/logistics` (protected by role-based middleware).
2. Dashboard shows incoming orders, seller pickup details, customer delivery addresses, and current
   statuses.
3. Logistics staff update delivery progress: `pending` → `confirmed` → `shipped` → `delivered`.
4. Orders can be marked as `cancelled` or `returned` when applicable.
5. The **"End Delivery"** button marks an order as `delivered` and closes it.

---

## 17. Rules for AI Agents

- Always read and respect this constitution before writing any code.
- Never create database migration files — the schema is predefined.
- Never use Supabase Auth — use the custom `users` table with argon2 hashing.
- Never import the Supabase JS client in the frontend.
- Never write backend logic in Next.js (no API routes, no server actions for data mutations).
- Always use the `/api/v1/` prefix for backend endpoints.
- Always return the standard error envelope for API errors.
- Always write tests for new endpoints and critical business logic.
- Always follow the naming conventions defined in this document.
- Always follow Conventional Commits for git commit messages.
