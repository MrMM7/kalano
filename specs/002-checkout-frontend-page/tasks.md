# Tasks: Checkout Frontend Page

> **Spec**: `specs/002-checkout-frontend-page/spec.md`
> **Plan**: `specs/002-checkout-frontend-page/plan.md`
> **Branch**: `feat/checkout-and-orders`
> **Spec**: 002 of 004 in phase
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

- Depends on: `specs/001-checkout-endpoint/` (Status: ⬜ Pending) — Backend endpoint `POST /api/v1/checkout` must exist for client integration.

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Checkout TypeScript Types

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/types/checkout.ts`
- **Description**: Define TypeScript interfaces for the checkout flow:
  - `CheckoutPayload` containing `address` (string) and `save_address` (optional boolean).
  - `CheckoutOrderItem` containing `id`, `product_id`, `product_name`, `seller_id`, `seller_name`, `bought_price`, `quantity`, `subtotal`, `delivery_types` (string), `address`, and `created_at`.
  - `CheckoutResponse` containing `order_ids` (number array), `orders` (array of `CheckoutOrderItem`), `total_items` (number), `total_price` (number), and `message` (string).
- **Done when**: File `frontend/types/checkout.ts` exists and type checks cleanly with `pnpm tsc --noEmit`.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Checkout API Client Function `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/lib/api/checkout.ts`
- **Description**: Implement `processCheckout` function:
  - Uses native `fetch` to POST JSON data to `${API_BASE_URL}/api/v1/checkout`.
  - Sets `credentials: "include"` so httpOnly JWT cookie is transmitted.
  - Handles non-ok responses by extracting standard `ApiError` envelope and throwing.
  - Returns parsed `CheckoutResponse`.
- **Done when**: Function is callable and properly typed.

### Task 2.2 — Implement Checkout UI Subcomponents `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/checkout/shipping-address-form.tsx`
  - Create: `frontend/components/checkout/simulated-payment-card.tsx`
  - Create: `frontend/components/checkout/checkout-order-summary.tsx`
  - Create: `frontend/components/checkout/checkout-skeleton.tsx`
- **Description**: Build modular presentation components for the checkout screen:
  - `shipping-address-form.tsx`: Delivery address textarea, profile sync checkbox, and validation error display.
  - `simulated-payment-card.tsx`: Card mockup with security disclaimer and dummy details.
  - `checkout-order-summary.tsx`: Item preview list, subtotal, shipping line ($0.00 / Free), total price, and "Place Order" submit button with loading spinner.
  - `checkout-skeleton.tsx`: Skeletons matching the two-column layout.
- **Done when**: All subcomponents exist, accept proper props, and render with accessible HTML and Tailwind styling.

---

## Batch 3: Page Integration `[SEQUENTIAL]`

### Task 3.1 — Build Checkout Page Component

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/app/checkout/page.tsx`
- **Description**: Assemble the `/checkout` route page:
  - Mark component as `"use client"`.
  - Consume `useCart()` for cart data and `useAuth()` for user profile address.
  - Maintain form state for shipping address and save_address flag.
  - Show `checkout-skeleton.tsx` when cart data is loading.
  - Show empty cart alert with link to `/products` when cart has 0 items.
  - Wire TanStack Query mutation for `processCheckout`:
    - On success: invalidate `["cart"]` query, call `refreshUser()` if save_address was checked, display success toast, and navigate to `/orders`.
    - On error: display error notification banner or toast.
  - Arrange into two-column desktop responsive grid.
- **Done when**: Visiting `/checkout` renders the full experience and handles empty, loading, submit, and error states.

---

## Batch 4: Tests `[PARALLEL]`

### Task 4.1 — Frontend Vitest Component Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/checkout/checkout-page.test.tsx`
- **Description**: Write Vitest unit and integration tests:
  - Test checkout page displays skeleton while loading.
  - Test checkout page renders empty state if cart is empty.
  - Test form initializes with address from user profile.
  - Test validation error appears if user submits blank address.
  - Test clicking "Place Order" calls checkout API with address and save_address.
  - Test successful submission invalidates cart query and redirects to `/orders`.
  - Test error response displays error alert to user without navigating.
- **Done when**: All tests pass cleanly with `pnpm test`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Frontend

- **Type**: `[SEQUENTIAL]`
- **Description**: Run ESLint and Prettier across frontend code:
  - Command: `pnpm lint`
  - Command: `pnpm format:check`
- **Done when**: No lint or formatting errors are detected.

### Task 5.2 — Full Frontend Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**: Run full Vitest suite to verify no regressions:
  - Command: `pnpm test`
- **Done when**: 100% of frontend tests pass.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | Yes | 2 |
| 3 | 1 | No | 1 |
| 4 | 1 | Yes | 1 |
| 5 | 2 | No | 1 |
| **Total** | **7** | | |

---

## Git Commit Plan

1. `feat(frontend): create checkout TypeScript types`
2. `feat(frontend): add checkout API client and UI subcomponents`
3. `feat(frontend): implement checkout page with order placement flow`
4. `test(frontend): add Vitest tests for checkout page and interactions`
