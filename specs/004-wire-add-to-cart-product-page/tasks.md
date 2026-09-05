# Tasks: Wire "Add to Cart" on Product Detail Page

> **Spec**: `specs/004-wire-add-to-cart-product-page/spec.md`
> **Plan**: `specs/004-wire-add-to-cart-product-page/plan.md`
> **Branch**: `feat/cart`
> **Spec**: 004 of 004 in phase
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

- Depends on: `specs/001-cart-backend-add-item/` (Status: ⬜ Pending)
- Depends on: `specs/003-cart-frontend-page/` (Status: ⬜ Pending)

---

## Batch 1: Hook & API Verification `[SEQUENTIAL]`

### Task 1.1 — Ensure Add to Cart API & Mutation Hook

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/lib/api/cart.ts`
  - Modify: `frontend/lib/hooks/use-cart.ts`
- **Description**: Verify and ensure `addToCart` API function and `useAddToCart` mutation hook are fully integrated.
  - `addToCart` sends POST to `/api/v1/cart/items` with `seller_product_id` and `quantity`.
  - `useAddToCart` uses TanStack Query mutation and invalidates `['cart']` cache on success.
- **Done when**: API client and hook are exported and pass TypeScript checks.

---

## Batch 2: Wire Product Detail Page `[SEQUENTIAL]`

### Task 2.1 — Connect Button in Product Detail Page

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/app/products/[id]/page.tsx`
- **Description**: Wire the purchasing card's "Add to Cart" button.
  - Integrate `useAuth`, `useRouter`, and `useAddToCart`.
  - Redirect unauthenticated users to `/login?redirect=/products/[id]`.
  - When authenticated, invoke `addToCart` mutation using `effectiveOfferId` (cheapest offer by default, or user-selected offer from the comparison table).
  - Show loading state and disable button while mutation is running.
  - Display toast notification on success with action link to `/cart`.
  - Display error toast if mutation fails (e.g., `INSUFFICIENT_STOCK`).
- **Done when**: Clicking Add to Cart triggers redirect when logged out, or adds item to cart when logged in.

---

## Batch 3: Vitest Tests `[SEQUENTIAL]`

### Task 3.1 — Add Vitest Tests for Add to Cart Button Flow

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/__tests__/products/product-detail-add-to-cart.test.tsx`
- **Description**: Write Vitest tests verifying the complete button behavior.
  - Test clicking Add to Cart when unauthenticated redirects to login with redirect param.
  - Test clicking Add to Cart when logged in calls mutation with active offer ID.
  - Test selecting alternative seller updates the offer ID passed to the mutation.
  - Test button shows loading state and is disabled during mutation.
  - Test error toast on stock failure.
- **Done when**: All Vitest tests pass cleanly.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Test Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and tests across frontend.
  - Run `pnpm lint`
  - Run `pnpm test`
- **Done when**: Zero lint errors and all test suites pass.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 1 | No | 1 |
| 3 | 1 | No | 1 |
| 4 | 1 | No | 1 |
| **Total** | **4** | | |

---

## Git Commit Plan

1. `feat(frontend): ensure addToCart API and mutation hook`
2. `feat(frontend): wire Add to Cart button on product detail page with auth redirect and feedback`
3. `test(frontend): add vitest tests for Add to Cart interaction and auth guard`
