# Tasks: Logistics Dashboard Frontend

> **Spec**: `specs/003-logistics-dashboard-frontend/spec.md`
> **Plan**: `specs/003-logistics-dashboard-frontend/plan.md`
> **Branch**: `feat/logistics-dashboard`
> **Spec**: 003 of 003 in phase
> **Date**: 2026-09-06
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

- Depends on:
  - `specs/001-logistics-view-orders-endpoint/` (Status: ⬜ Pending)
  - `specs/002-logistics-update-order-status-endpoint/` (Status: ⬜ Pending)

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Create TypeScript Interfaces and API Client Functions

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/types/logistics.ts`
  - Create: `frontend/lib/api/logistics.ts`
- **Description**:
  - Define `LogisticsOrderItem` interface matching backend response attributes: order ID, product info (ID, name, brand, image URL), seller info (ID, name), buyer info (ID, name), shipping address, bought price, quantity, subtotal, delivery status, and creation date.
  - Explain the `delivered_types` enum in pure text for the status type: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, or `returned`.
  - Define `LogisticsStatusUpdateRequest` interface with `status: string`.
  - Implement `fetchLogisticsOrders` fetch wrapper accepting optional status filter.
  - Implement `updateLogisticsOrderStatus` fetch wrapper sending PATCH to `/api/v1/logistics/orders/{order_id}`.
- **Done when**:
  - Types and API functions import cleanly with TypeScript compiler checks passing.

---

## Batch 2: Core Components `[PARALLEL]`

### Task 2.1 — Implement Logistics Status Badge and Metrics Cards `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/logistics/logistics-status-badge.tsx`
  - Create: `frontend/components/logistics/logistics-metrics.tsx`
- **Description**:
  - Create `LogisticsStatusBadge` rendering color-coded badges for `pending` (amber), `confirmed` (blue), `shipped` (purple), `delivered` (green), `cancelled` (red), and `returned` (gray).
  - Create `LogisticsMetrics` rendering 4 responsive metric summary cards: Total Orders, Pending Pickup, In Transit, and Delivered.
- **Done when**:
  - Components render correctly with expected styles and icons.

### Task 2.2 — Implement Filter Bar, Confirm Dialog, and Data Table `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/logistics/logistics-filter-bar.tsx`
  - Create: `frontend/components/logistics/logistics-confirm-dialog.tsx`
  - Create: `frontend/components/logistics/logistics-table.tsx`
- **Description**:
  - Create `LogisticsFilterBar` with status tabs and search input for live text filtering.
  - Create `LogisticsConfirmDialog` for modal confirmation of order cancellation and return processing.
  - Create `LogisticsTable` with accessible columns (Order ID, Product, Seller, Buyer & Address, Quantity/Subtotal, Status Badge, and Contextual Action Buttons).
  - Include the prominent primary "End Delivery" button for shipped items.
- **Done when**:
  - Components render table markup with accessibility attributes and interactive action buttons.

---

## Batch 3: Page Integration & Wiring `[SEQUENTIAL]`

### Task 3.1 — Build Main Logistics Dashboard Page

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/app/logistics/page.tsx`
  - Create: `frontend/components/logistics/logistics-header.tsx`
- **Description**:
  - Create `LogisticsHeader` with Kalano branding, Logistics Dashboard badge, and user details.
  - In `/logistics` page, integrate `useAuth` to guard access: redirect unauthenticated users to `/login?redirect=/logistics`, and render Access Denied card if `user.user_role !== "logistics"`.
  - Use TanStack Query `useQuery` to fetch orders from `fetchLogisticsOrders`.
  - Use `useMutation` for `updateLogisticsOrderStatus`, invalidating orders query and displaying toast feedback upon success.
  - Integrate header, metrics cards, filter bar, confirm dialog, and orders table.
  - Handle loading skeleton, empty filter states, and error retry states.
- **Done when**:
  - `/logistics` page compiles and renders complete interactive dashboard in the browser.

---

## Batch 4: Automated Testing `[SEQUENTIAL]`

### Task 4.1 — Write Vitest Tests for Logistics Dashboard

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/__tests__/logistics-dashboard.test.tsx`
- **Description**:
  - Write test verifying loading skeleton displays when data is loading.
  - Write test verifying Access Denied message renders when user role is not logistics.
  - Write test verifying order table renders orders, addresses, and status badges.
  - Write test verifying search bar filters visible rows.
  - Write test verifying status action buttons (such as "End Delivery") invoke mutation function.
- **Done when**:
  - Vitest test suite passes with `pnpm test logistics-dashboard`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint and Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Run frontend linter: `pnpm lint`
  - Run frontend formatter: `pnpm format`
- **Done when**:
  - No lint errors or code formatting issues.

### Task 5.2 — Frontend Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Run complete frontend test suite: `pnpm test`
- **Done when**:
  - 100% of frontend tests pass.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 2 | Yes | 2 |
| 3 | 1 | No | 1 |
| 4 | 1 | No | 1 |
| 5 | 2 | No | 1 |
| **Total** | **7** | | |

---

## Git Commit Plan

1. `feat(frontend): add logistics types and API client functions`
2. `feat(frontend): create logistics status badge, metrics, and filter components`
3. `feat(frontend): create logistics data table and confirmation modal`
4. `feat(frontend): implement /logistics dashboard page with auth guards and mutation flows`
5. `test(frontend): add vitest tests for logistics dashboard`
