# Tasks: Order History Frontend Page

> **Spec**: `specs/004-order-history-frontend-page/spec.md`
> **Plan**: `specs/004-order-history-frontend-page/plan.md`
> **Branch**: `feat/checkout-and-orders`
> **Spec**: 004 of 004 in phase
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

- Depends on: `specs/003-order-history-endpoint/` (Status: ⬜ Pending) — Endpoint `GET /api/v1/orders` must exist to serve order history data.

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Order History TypeScript Types

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/types/order.ts`
- **Description**: Define TypeScript types for order history:
  - `DeliveryStatus` union type (`"pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned"`).
  - `OrderItem` interface containing `id`, `product_id`, `product_name`, `product_brand`, `product_image_url`, `seller_id`, `seller_name`, `bought_price`, `quantity`, `subtotal`, `delivery_types`, `address`, and `created_at`.
  - `OrderListResponse` interface containing `orders` (array of `OrderItem`) and `total_orders` (number).
- **Done when**: File `frontend/types/order.ts` exists and type checks with `pnpm tsc --noEmit`.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Order API Client & Hook `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/lib/api/orders.ts`
  - Create: `frontend/lib/hooks/use-orders.ts`
- **Description**: Implement data fetching layer for orders:
  - `frontend/lib/api/orders.ts`: Implement `fetchBuyerOrders` which sends GET request to `${API_BASE_URL}/api/v1/orders` with `credentials: "include"`, extracts error envelope on failure, and returns `OrderListResponse`.
  - `frontend/lib/hooks/use-orders.ts`: Implement custom hook `useOrders` using TanStack `useQuery` with key `["orders"]`.
- **Done when**: API client and hook are created and cleanly typed.

### Task 2.2 — Implement Order Presentation Subcomponents `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/orders/order-status-badge.tsx`
  - Create: `frontend/components/orders/order-card.tsx`
  - Create: `frontend/components/orders/orders-empty-state.tsx`
  - Create: `frontend/components/orders/orders-skeleton.tsx`
- **Description**: Implement modular presentation components:
  - `order-status-badge.tsx`: Color-coded badge rendering text and styling for statuses (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `returned`).
  - `order-card.tsx`: Card component displaying order ID, formatted date, badge, product image, title linking to `/products/[id]`, brand, seller name, unit price, quantity, subtotal, and shipping address.
  - `orders-empty-state.tsx`: Friendly illustration and message when user has no orders, with "Explore Products" button navigating to `/products`.
  - `orders-skeleton.tsx`: Skeleton placeholders simulating order cards while loading.
- **Done when**: Subcomponents exist, accept proper props, and render with accessible Tailwind styling.

---

## Batch 3: Page Integration `[SEQUENTIAL]`

### Task 3.1 — Build Order History Page Component

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/app/orders/page.tsx`
- **Description**: Assemble `/orders` page component:
  - Mark component as `"use client"`.
  - Consume `useOrders()` hook.
  - Render `OrdersSkeleton` while loading.
  - Render error banner with "Retry" button calling `refetch()` if query errors.
  - Render `OrdersEmptyState` when orders list is empty.
  - Render order count header and list of `OrderCard` items when data is available.
- **Done when**: Visiting `/orders` renders complete history view with all states supported.

---

## Batch 4: Tests `[PARALLEL]`

### Task 4.1 — Frontend Vitest Component Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/orders/orders-page.test.tsx`
- **Description**: Write Vitest unit and integration tests:
  - Test orders page renders skeleton during loading.
  - Test orders page renders empty state when order list has 0 items.
  - Test orders page renders list of orders with product names, seller names, subtotals, and addresses.
  - Test status badge reflects correct label and style for each delivery status.
  - Test error state displays retry button and invokes refetch on click.
- **Done when**: All tests pass cleanly in `frontend/__tests__/orders/orders-page.test.tsx`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Frontend

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and formatters:
  - Command: `pnpm lint`
  - Command: `pnpm format:check`
- **Done when**: Zero lint or formatting errors.

### Task 5.2 — Full Frontend Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**: Run full test suite:
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

1. `feat(frontend): create order history TypeScript types`
2. `feat(frontend): implement order history API client, hook, and UI components`
3. `feat(frontend): assemble order history page`
4. `test(frontend): add Vitest tests for order history page and components`
