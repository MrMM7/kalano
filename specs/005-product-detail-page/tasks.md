# Tasks: Product Detail Page

> **Spec**: `specs/005-product-detail-page/spec.md`
> **Plan**: `specs/005-product-detail-page/plan.md`
> **Branch**: `feat/product-catalog`
> **Spec**: 005 of 005 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. command invocations or minimal type references) are allowed, but **mock logic is
> strictly prohibited** (no function bodies, control flow, loops, or algorithms). Custom enums
> MUST be explained in pure text.

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

- Depends on: `specs/002-product-detail-endpoint/` (Status: ⬜ Pending)
- Depends on: `specs/003-landing-page/` (Status: ⬜ Pending)

---

## Batch 1: Types & API Client Extension `[SEQUENTIAL]`

### Task 1.1 — Extend Product Types & API Client

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/types/product.ts`
  - Modify: `frontend/lib/api/products.ts`
- **Description**:
  - Add `SellerOffer` and `ProductDetailResponse` TypeScript interfaces to `frontend/types/product.ts`.
  - Add `getProductById` function to `frontend/lib/api/products.ts` fetching `GET /api/v1/products/{product_id}`.
- **Done when**: Types compile and function handles 200 responses and 404 error envelope parsing.

---

## Batch 2: Query Hook & UI Components `[PARALLEL]`

### Task 2.1 — Implement useProductDetail Hook `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/lib/hooks/use-product-detail.ts`
- **Description**: Implement `useProductDetail` TanStack Query hook invoking `getProductById(id)`. Set `retry: false` for 404 responses.
- **Done when**: Hook exports cleanly and handles caching for product details.

### Task 2.2 — Implement Seller Offers Table Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/seller-offers-table.tsx`
- **Description**: Build `SellerOffersTable` accepting `offers`, `selectedOfferId`, and `onSelectOffer`. Render table with columns: Seller Name, Price, Delivery Estimate, Stock, and Select button. Highlight active offer row.
- **Done when**: Component renders offer rows, highlights selection, and handles clicks.

### Task 2.3 — Implement Product Detail Skeleton `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/product-detail-skeleton.tsx`
- **Description**: Build shimmer skeleton layout simulating two-column product layout (image box, title, description, purchase card) and bottom table rows.
- **Done when**: Skeleton renders responsive placeholder layout.

---

## Batch 3: Page Implementation `[SEQUENTIAL]`

### Task 3.1 — Build Product Detail Page

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/app/products/[id]/page.tsx`
- **Description**:
  - Build `/products/[id]` page unwrapping `params.id`.
  - Use `useProductDetail` hook to fetch data.
  - Render breadcrumb navigation (Home > Products > Product Title).
  - Render two-column grid: left side product image / placeholder, right side title, brand, description, and Featured Offer Card.
  - Featured Offer Card displays active selected offer price, seller display name, delivery estimate, stock status, and "Add to Cart" button.
  - If no offers in stock: display "Currently Unavailable / Out of Stock" notice and disable button.
  - Below grid, render `SellerOffersTable` enabling alternative offer selection.
  - Render dedicated 404 "Product Not Found" screen if ID does not exist.
- **Done when**: Navigating to `/products/{id}` displays complete product details and allows switching seller offers.

---

## Batch 4: Tests `[PARALLEL]`

### Task 4.1 — Seller Offers Table Unit Test `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/components/seller-offers-table.test.tsx`
- **Description**: Test `SellerOffersTable`:
  - Renders all seller offers with prices and delivery days.
  - Clicking select button triggers `onSelectOffer` with seller offer ID.
  - Disables button for out of stock rows.
- **Done when**: Tests pass via `pnpm test`.

### Task 4.2 — Product Detail Page Integration Test `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/pages/product-detail.test.tsx`
- **Description**: Test `/products/[id]` page:
  - Renders skeleton while loading.
  - Renders product metadata and cheapest offer on success.
  - Renders 404 screen when API returns 404 error envelope.
  - Selecting an offer from the table updates the featured price card.
- **Done when**: Tests pass via `pnpm test`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Run frontend linters:
  - Command: `pnpm lint`
  - Command: `pnpm format:check`
- **Done when**: Zero lint errors and clean formatting.

### Task 5.2 — Full Frontend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run complete frontend test suite:
  - Command: `pnpm test`
- **Done when**: All tests pass.

### Task 5.3 — Server Smoke Verification with Timeout

- **Type**: `[SEQUENTIAL]`
- **Description**: If launching the Next.js dev server (`pnpm dev`) or backend API (`uv run uvicorn`) to verify product details and seller offers switching in a browser:
  - **MANDATORY TIMEOUT RULE**: Any server process MUST be launched with an automatic timeout that terminates and kills the process after X seconds (maximum 25 seconds). Never start a server process without an automated process termination timer.
- **Done when**: Verification is complete and all server processes terminate automatically after the timeout without hanging.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 3 | Yes | 3 |
| 3 | 1 | No | 1 |
| 4 | 2 | Yes | 2 |
| 5 | 3 | No | 1 |
| **Total** | **10** | | |

---

## Git Commit Plan

1. `feat(frontend): extend product types and API client for product detail`
2. `feat(frontend): create useProductDetail hook and SellerOffersTable component`
3. `feat(frontend): create ProductDetailSkeleton component`
4. `feat(frontend): implement /products/[id] product detail page`
5. `test(frontend): add tests for SellerOffersTable and product detail page`
