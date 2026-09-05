# Tasks: Landing Page (Home)

> **Spec**: `specs/003-landing-page/spec.md`
> **Plan**: `specs/003-landing-page/plan.md`
> **Branch**: `feat/product-catalog`
> **Spec**: 003 of 005 in phase
> **Date**: 2026-09-05
> **Status**: Complete
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

- Depends on: `specs/001-list-products-endpoint/` (Status: ⬜ Pending)

---

## Batch 1: Frontend Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Product Types & API Client

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/types/product.ts`
  - Create: `frontend/lib/api/products.ts`
- **Description**:
  - In `frontend/types/product.ts`, define TypeScript interfaces: `CheapestOffer`, `ProductListItem`, `ProductsListResponse`, and `GetProductsParams`.
  - In `frontend/lib/api/products.ts`, implement `getProducts` function that fetches `/api/v1/products` with query parameters `limit`, `offset`, and optional `q`. Include error handling for non-200 responses.
- **Done when**: Files exist, TypeScript types compile with no errors, and lint passes.

---

## Batch 2: Core Components & Hooks `[PARALLEL]`

### Task 2.1 — Implement TanStack Query Hook `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/lib/hooks/use-products.ts`
- **Description**: Implement `useProducts` hook using `useQuery` with query key `['products', params]` calling `getProducts(params)`.
- **Done when**: Hook exports cleanly and handles query caching.

### Task 2.2 — Implement ProductCard & Skeleton Components `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/product-card.tsx`
  - Create: `frontend/components/product-card-skeleton.tsx`
- **Description**:
  - Build `ProductCard` displaying product thumbnail, fallback placeholder, brand name, truncated title, and lowest price or "Out of Stock" badge. Wrap card in Next.js `Link` to `/products/[id]`.
  - Build `ProductCardSkeleton` with shimmering placeholder blocks for image, text, and price.
- **Done when**: Both components render cleanly and support responsive grid containers.

### Task 2.3 — Implement SearchBar Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/search-bar.tsx`
- **Description**: Build accessible `SearchBar` form component with input field and submit button. On submission, push to `/products?q={encoded_query}` using `useRouter`.
- **Done when**: Component handles typing, form submission, and route navigation.

---

## Batch 3: Page Integration `[SEQUENTIAL]`

### Task 3.1 — Integrate Home Page

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/app/page.tsx`
- **Description**:
  - Update `frontend/app/page.tsx` to render the hero section with `SearchBar`.
  - Add "Featured Products" section utilizing `useProducts({ limit: 8, offset: 0 })`.
  - Render 8 skeleton cards during loading, error banner on failure, empty message if no items, and `ProductCard` grid on success.
- **Done when**: Navigating to `/` displays the full storefront with live backend product data or skeletons.

---

## Batch 4: Frontend Tests `[PARALLEL]`

### Task 4.1 — ProductCard & SearchBar Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/components/product-card.test.tsx`
  - Create: `frontend/__tests__/components/search-bar.test.tsx`
- **Description**:
  - Test `ProductCard` renders product details, formatted price, and out-of-stock badge when offer is null.
  - Test `SearchBar` handles user typing and form submit triggering router navigation.
- **Done when**: All component tests pass via `pnpm test`.

### Task 4.2 — Home Page Integration Test `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/pages/home.test.tsx`
- **Description**:
  - Test `Home` page renders hero, search bar, and handles loading skeleton and successful product grid display using mocked query data.
- **Done when**: Test passes cleanly with `pnpm test`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Run frontend linter and formatter:
  - Command: `pnpm lint`
  - Command: `pnpm format:check`
- **Done when**: Zero lint errors and clean formatting.

### Task 5.2 — Full Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run all frontend tests:
  - Command: `pnpm test`
- **Done when**: All tests pass.

### Task 5.3 — Server Smoke Verification with Timeout

- **Type**: `[SEQUENTIAL]`
- **Description**: If launching the Next.js dev server (`pnpm dev`) or backend API (`uv run uvicorn`) to verify page rendering in a browser:
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

1. `feat(frontend): add product catalog types and API client`
2. `feat(frontend): create ProductCard, skeleton, and SearchBar components`
3. `feat(frontend): implement useProducts query hook`
4. `feat(frontend): upgrade landing page with search hero and featured products`
5. `test(frontend): add unit tests for ProductCard, SearchBar, and home page`
