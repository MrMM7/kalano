# Tasks: Product Search & Listing Page

> **Spec**: `specs/004-product-search-listing-page/spec.md`
> **Plan**: `specs/004-product-search-listing-page/plan.md`
> **Branch**: `feat/product-catalog`
> **Spec**: 004 of 005 in phase
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

- Depends on: `specs/001-list-products-endpoint/` (Status: ⬜ Pending)
- Depends on: `specs/003-landing-page/` (Status: ⬜ Pending)

---

## Batch 1: UI Components `[PARALLEL]`

### Task 1.1 — Create Pagination Controls Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/pagination-controls.tsx`
- **Description**: Build accessible `PaginationControls` component accepting `total`, `limit`, `offset`, and `onPageChange` callback. Display "Previous" and "Next" buttons with disabled boundary states and page indicator text ("Page X of Y").
- **Done when**: Component renders with accessible navigation tags and handles button clicks.

---

## Batch 2: Catalog Page Implementation `[SEQUENTIAL]`

### Task 2.1 — Build Products Listing & Search Page

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/app/products/page.tsx`
- **Description**:
  - Create `/products` page wrapped in React `Suspense`.
  - Extract `q`, `limit`, and `offset` from `useSearchParams()`.
  - Fetch products with `useProducts({ limit, offset, q })`.
  - Render persistent `SearchBar` pre-filled with `q`.
  - On search submit, update URL search params with new query and reset offset to 0.
  - Render results counter ("Found X products") and "Clear search" button when query is active.
  - Render grid of `ProductCard` components, or `ProductCardSkeleton` during loading.
  - Render empty state ("No products found matching '{q}'") when results are empty.
  - Render `PaginationControls` at bottom with URL offset synchronization.
- **Done when**: Visiting `/products` and `/products?q=...` displays search results with functioning pagination.

---

## Batch 3: Tests `[PARALLEL]`

### Task 3.1 — Pagination Controls Unit Test `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/components/pagination-controls.test.tsx`
- **Description**: Test `PaginationControls` component:
  - Correct page count calculation.
  - Disabled states for Previous on first page and Next on last page.
  - Calling `onPageChange` with correct offset offsets when buttons are clicked.
- **Done when**: Tests pass via `pnpm test`.

### Task 3.2 — Products Listing Page Integration Test `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/pages/products-list.test.tsx`
- **Description**: Test `/products` page:
  - Renders product cards matching query results.
  - Handles search input submission and parameter updates.
  - Handles empty search result view.
  - Handles pagination navigation.
- **Done when**: Tests pass via `pnpm test`.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Run frontend linters:
  - Command: `pnpm lint`
  - Command: `pnpm format:check`
- **Done when**: Zero lint errors and formatting warnings.

### Task 4.2 — Full Frontend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run complete frontend test suite:
  - Command: `pnpm test`
- **Done when**: All tests pass.

### Task 4.3 — Server Smoke Verification with Timeout

- **Type**: `[SEQUENTIAL]`
- **Description**: If launching the Next.js dev server (`pnpm dev`) or backend API (`uv run uvicorn`) to verify catalog search and pagination in a browser:
  - **MANDATORY TIMEOUT RULE**: Any server process MUST be launched with an automatic timeout that terminates and kills the process after X seconds (maximum 25 seconds). Never start a server process without an automated process termination timer.
- **Done when**: Verification is complete and all server processes terminate automatically after the timeout without hanging.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | Yes | 1 |
| 2 | 1 | No | 1 |
| 3 | 2 | Yes | 2 |
| 4 | 3 | No | 1 |
| **Total** | **7** | | |

---

## Git Commit Plan

1. `feat(frontend): create reusable PaginationControls component`
2. `feat(frontend): implement /products catalog search and listing page`
3. `test(frontend): add tests for pagination controls and products listing page`
