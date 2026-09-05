# Plan: Product Detail Page

> **Spec Reference**: `specs/005-product-detail-page/spec.md`
> **Branch**: `feat/product-catalog`
> **Spec**: 005 of 005 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON schemas or minimal type/interface signatures) are allowed, but **mock logic is
> strictly prohibited** (no function bodies, control flow, loops, or algorithms). Custom enums
> MUST be explained in pure text.

---

## 1. Technical Approach

The Product Detail Page (`frontend/app/products/[id]/page.tsx`) provides an in-depth view of an individual item and its seller options.

1. **Type Definition Updates**:
   - Extend `frontend/types/product.ts` to include `SellerOffer` and `ProductDetailResponse`.
2. **API Client & Query Hook**:
   - Add `getProductById(id: string)` to `frontend/lib/api/products.ts`.
   - Create TanStack Query hook `useProductDetail(id: string)` in `frontend/lib/hooks/use-product-detail.ts`.
3. **UI Components**:
   - `frontend/components/seller-offers-table.tsx`: Renders the comparison table of all available merchants, pricing, delivery times, and inventory. Allows selecting an alternative seller.
   - `frontend/components/product-detail-skeleton.tsx`: Shimmer placeholder for loading the 2-column detail page layout and table.
4. **Detail Page Implementation**:
   - Create `frontend/app/products/[id]/page.tsx`.
   - Reads `params.id` from Next.js dynamic route parameters.
   - Manages local state for `selectedOfferId` (defaults to `cheapest_offer?.seller_product_id`).
   - Renders image, brand, description, active purchase box, and the `SellerOffersTable`.
   - Includes "Add to Cart" button (disabled or placeholder notification until Phase 4).
5. **Testing**:
   - Write Vitest tests for `SellerOffersTable` and `product-detail.test.tsx`.

## 2. Dependencies on Prior Specs

| Prior Spec | What It Provides | What This Spec Uses |
|------------|-----------------|---------------------|
| `specs/002-product-detail-endpoint/` | Backend API `GET /api/v1/products/{product_id}` | Serves product specifications and sorted seller offers |
| `specs/003-landing-page/` | `frontend/types/product.ts`, `frontend/lib/api/products.ts` | Extends types and API client functions |

## 3. Files to Create

| File Path | Purpose |
|-----------|---------|
| `frontend/lib/hooks/use-product-detail.ts` | TanStack Query hook for fetching a single product by ID |
| `frontend/components/seller-offers-table.tsx` | Table component comparing all merchant offers |
| `frontend/components/product-detail-skeleton.tsx` | Shimmer loading skeleton for the detail view |
| `frontend/app/products/[id]/page.tsx` | Next.js App Router product detail page |
| `frontend/__tests__/components/seller-offers-table.test.tsx` | Vitest test for offer selection and table rendering |
| `frontend/__tests__/pages/product-detail.test.tsx` | Vitest test for product detail page states and behavior |

## 4. Files to Modify

| File Path | Changes |
|-----------|---------|
| `frontend/types/product.ts` | Add `SellerOffer` and `ProductDetailResponse` types |
| `frontend/lib/api/products.ts` | Add `getProductById(id: string)` API client function |

## 5. Dependencies & Order

```mermaid
graph TD
    A[Extend Types in frontend/types/product.ts] --> B[API Client in frontend/lib/api/products.ts]
    B --> C[Hook in frontend/lib/hooks/use-product-detail.ts]
    C --> D[Component in frontend/components/seller-offers-table.tsx]
    D --> E[Page in frontend/app/products/[id]/page.tsx]
    E --> F[Vitest Tests]
```

## 6. Detailed Implementation Notes

### 6.1 — Frontend: Types (`frontend/types/product.ts`)

- **`SellerOffer` Interface**:
  - `seller_product_id`: string (UUID).
  - `seller_id`: string (UUID).
  - `seller_name`: string.
  - `price`: number.
  - `stock`: number.
  - `estimated_delivery_days`: number or null.
- **`ProductDetailResponse` Interface**:
  - `id`: string (UUID).
  - `name`: string.
  - `description`: string.
  - `brand`: string.
  - `image_url`: string or null.
  - `created_at`: string.
  - `cheapest_offer`: `SellerOffer` or null.
  - `offers`: array of `SellerOffer`.

### 6.2 — Frontend: API Client (`frontend/lib/api/products.ts`)

- **`getProductById` Function**:
  - Takes `id` string parameter.
  - Calls `fetch(`${API_BASE_URL}/api/v1/products/${encodeURIComponent(id)}`)`.
  - Checks for 404 status; throws specific not found error or standard parsed error envelope.
  - Returns parsed `ProductDetailResponse`.

### 6.3 — Frontend: Hook (`frontend/lib/hooks/use-product-detail.ts`)

- **`useProductDetail` Hook**:
  - Uses `useQuery` with key `['product', id]`.
  - Calls `getProductById(id)`.
  - Configures `retry: false` for 404 responses so the UI displays the not found state immediately.

### 6.4 — Frontend: Components

- **`SellerOffersTable` (`frontend/components/seller-offers-table.tsx`)**:
  - Props:
    - `offers`: array of `SellerOffer`.
    - `selectedOfferId`: string or null.
    - `onSelectOffer`: `(offerId: string) => void`.
  - Renders a table with columns: Seller, Price, Delivery Estimate, Stock, and Select Action.
  - Highlights row corresponding to `selectedOfferId`.
  - Out of stock offers have disabled select buttons and muted styling.
- **`ProductDetailPage` (`frontend/app/products/[id]/page.tsx`)**:
  - Client component unwrapping `params.id` using React `use()`.
  - Calls `useProductDetail(id)`.
  - Maintains `selectedOfferId` state defaulting to `data.cheapest_offer?.seller_product_id`.
  - Computes `activeOffer` based on `selectedOfferId` (falling back to `cheapest_offer`).
  - Renders breadcrumbs navigation: "Home" > "Products" > Product Name.
  - Left column: Image container with fallback graphic if `image_url` is null.
  - Right column: Brand badge, title, description, and Featured Offer Box.
  - Featured Offer Box displays price of `activeOffer`, seller name, delivery days, and "Add to Cart" button.
  - If no offers in stock: displays "Currently Unavailable" warning banner.
  - Renders `SellerOffersTable` below the two-column grid.

### 6.5 — Frontend: Tests

- `SellerOffersTable.test.tsx`:
  - Verify all offers render with correct price and delivery days.
  - Verify selecting an alternative offer triggers `onSelectOffer`.
  - Verify out of stock rows disable the select button.
- `ProductDetail.test.tsx`:
  - Verify loading skeleton renders during fetch.
  - Verify product specifications and cheapest offer render on success.
  - Verify 404 error displays "Product Not Found" screen.
  - Verify "Currently Unavailable" displays when all offers have zero stock.

## 7. Testing Strategy

### Frontend Tests (Vitest)
- Execute `pnpm test` targeting `seller-offers-table.test.tsx` and `product-detail.test.tsx`.
- Mock Next.js route params and query hooks.

### Manual Verification
> **Server Process Timeout Rule**: Any server process started for manual verification (Next.js dev server or FastAPI Uvicorn) MUST include an automatic timeout that automatically terminates and kills the process after X seconds (e.g. 20–30 seconds max).
- Start frontend dev server (`pnpm dev`) and backend (`uv run uvicorn app.main:app`) with an automated timeout (max 25 seconds) configured to kill the processes after the timeout expires.
- Navigate to `/products/{product_id}`.
- Verify product image, title, and description load correctly.
- Verify featured offer box displays the cheapest price.
- Click an alternative seller in the table; verify the featured price updates.
- Test visiting a non-existent UUID; verify the 404 screen displays gracefully before the server processes automatically terminate.

## 8. Constitution Compliance Checklist

- [ ] All business logic in FastAPI (§4.1)
- [ ] No Supabase JS client in frontend (§4.1)
- [ ] Semantic HTML and accessibility labels used (`aria-label`, `<table role="table">`, `<th scope="col">`) (§12)
- [ ] Desktop-first responsive layout down to tablet (§12)
- [ ] Naming conventions followed (§7)
- [ ] Vitest tests written (§14)
- [ ] Conventional Commits used (§13)

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Product exists but all offers are out of stock | Safely default `selectedOfferId` to null, render Out of Stock banner, and disable purchase button |
| User navigates to invalid UUID route | Handle 404 / 422 errors gracefully and render helpful "Product Not Found" state with link to catalog |
