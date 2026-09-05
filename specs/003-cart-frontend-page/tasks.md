# Tasks: Cart Frontend — Dedicated Cart Page

> **Spec**: `specs/003-cart-frontend-page/spec.md`
> **Plan**: `specs/003-cart-frontend-page/plan.md`
> **Branch**: `feat/cart`
> **Spec**: 003 of 004 in phase
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

- Depends on: `specs/002-cart-backend-view-modify/` (Status: ⬜ Pending)

---

## Batch 1: Types & API Client `[SEQUENTIAL]`

### Task 1.1 — Create Cart Types & API Client

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/types/cart.ts`
  - Create: `frontend/lib/api/cart.ts`
  - Create: `frontend/lib/hooks/use-cart.ts`
- **Description**: Set up client-side data contract and communication layer.
  - In `frontend/types/cart.ts`, define `CartItem`, `CartResponse`, and `CartItemUpdateInput`.
  - In `frontend/lib/api/cart.ts`, write `getCart`, `updateCartItemQuantity`, and `deleteCartItem` using standard `fetch`.
  - In `frontend/lib/hooks/use-cart.ts`, create `useCart`, `useUpdateCartItem`, and `useDeleteCartItem` using TanStack Query hooks.
- **Done when**: Types and hooks are created and compile cleanly without TypeScript errors.

---

## Batch 2: Cart Components `[PARALLEL]`

### Task 2.1 — Implement Cart Item Row & List `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/cart/cart-item-row.tsx`
  - Create: `frontend/components/cart/cart-item-list.tsx`
- **Description**: Build modular components for displaying cart items and controls.
  - `CartItemRow`: Renders product image, title link, brand, merchant name, unit price, quantity stepper (+/-), line subtotal, and remove button.
  - Disables increment button when stock limit is reached with visual indicator.
  - `CartItemList`: Maps and renders list of `CartItemRow` elements with accessible labels.
- **Done when**: Components render accurately with interactive stepper controls and accessible attributes.

### Task 2.2 — Implement Cart Summary, Empty State & Skeleton `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/cart/cart-summary.tsx`
  - Create: `frontend/components/cart/cart-empty-state.tsx`
  - Create: `frontend/components/cart/cart-skeleton.tsx`
- **Description**: Build auxiliary UI states and summary card.
  - `CartSummary`: Displays subtotal, shipping fulfillment notice, final total, and "Proceed to Checkout" button.
  - `CartEmptyState`: Displays empty illustration, message, and button linking to `/products`.
  - `CartSkeleton`: Pulsing placeholders for table rows and summary sidebar.
- **Done when**: Components render cleanly across breakpoints.

---

## Batch 3: Cart Page Assembly `[SEQUENTIAL]`

### Task 3.1 — Assemble Cart Page

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/app/cart/page.tsx`
- **Description**: Create the Next.js page at `/cart`.
  - Check user role via `useAuth`; show message for non-buyers.
  - Integrate `useCart`, `useUpdateCartItem`, and `useDeleteCartItem`.
  - Render `CartSkeleton` while loading, error view with retry on failure, `CartEmptyState` when items are empty, and two-column layout with `CartItemList` and `CartSummary` when items exist.
- **Done when**: Visiting `/cart` displays the full interactive cart experience.

---

## Batch 4: Vitest Tests `[SEQUENTIAL]`

### Task 4.1 — Write Vitest Tests for Cart Page

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/__tests__/cart/cart-page.test.tsx`
- **Description**: Write tests covering all cart interactions.
  - Test loading skeleton display.
  - Test empty cart display and link to catalog.
  - Test populated cart rendering with product and merchant info.
  - Test increment and decrement interactions.
  - Test disabled increment at max stock limit.
  - Test item removal.
  - Test checkout button link to `/checkout`.
- **Done when**: All Vitest tests pass cleanly.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Test Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and tests across frontend.
  - Run `pnpm lint` and `pnpm format:check` (or `pnpm prettier --check`)
  - Run `pnpm test`
- **Done when**: No lint errors and all tests pass.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | Yes | 2 |
| 3 | 1 | No | 1 |
| 4 | 1 | No | 1 |
| 5 | 1 | No | 1 |
| **Total** | **6** | | |

---

## Git Commit Plan

1. `feat(frontend): add cart types, API client, and TanStack Query hooks`
2. `feat(frontend): create cart item list, summary, empty state, and skeleton components`
3. `feat(frontend): implement /cart page with quantity updates and removal`
4. `test(frontend): add vitest tests for cart page and user interactions`
