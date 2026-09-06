# Tasks: Seller Dashboard Frontend

> **Spec**: `specs/006-seller-dashboard-frontend/spec.md`
> **Plan**: `specs/006-seller-dashboard-frontend/plan.md`
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 006 of 006 in phase
> **Date**: 2026-09-06
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

- Depends on: `specs/001-merchant-list-offers-endpoint/` (Status: ⬜ Pending)
- Depends on: `specs/002-merchant-add-offer-endpoint/` (Status: ⬜ Pending)
- Depends on: `specs/003-merchant-create-product-offer-endpoint/` (Status: ⬜ Pending)
- Depends on: `specs/004-merchant-update-delete-offers-endpoints/` (Status: ⬜ Pending)
- Depends on: `specs/005-merchant-incoming-orders-endpoint/` (Status: ⬜ Pending)

---

## Batch 1: Types & API Layer `[SEQUENTIAL]`

### Task 1.1 — Create TypeScript Interfaces
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/types/dashboard.ts`
- **Description**: Define TypeScript interfaces for `MerchantOffer`, `CreateOfferPayload`, `UpdateOfferPayload`, `MerchantOrder`, and product creation form state.
- **Done when**: Interfaces compile with zero TypeScript errors.

### Task 1.2 — Implement API Client Helpers
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/lib/api/dashboard.ts`
- **Description**: Implement typed API functions using `fetch`: `fetchMerchantOffers`, `createMerchantOffer`, `createProductAndOffer` (FormData), `updateMerchantOffer`, `deleteMerchantOffer`, `fetchMerchantOrders`, and `updateMerchantOrderStatus`. Include credentials for cookie transmission.
- **Done when**: Functions typecheck and are exported cleanly.

### Task 1.3 — Create TanStack Query Hooks
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/lib/hooks/use-dashboard.ts`
- **Description**: Implement query and mutation hooks: `useMerchantOffers`, `useCreateOffer`, `useCreateProductAndOffer`, `useUpdateOffer`, `useDeleteOffer`, `useMerchantOrders`, and `useUpdateOrderStatus`, with proper query key invalidation.
- **Done when**: Hooks export without type issues.

---

## Batch 2: Core Components `[PARALLEL]`

### Task 2.1 — Implement My Offers Tab and Dialogs `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/dashboard/my-offers-tab.tsx`
  - Create: `frontend/components/dashboard/edit-offer-dialog.tsx`
  - Create: `frontend/components/dashboard/delete-offer-dialog.tsx`
- **Description**: Build the offers list view with product thumbnails, title, brand, price, stock, and delivery days. Implement modal dialogs for editing terms and confirming deletion, with accessible form inputs and mutation feedback.
- **Done when**: Component renders list and dialogs open/close with responsive styling.

### Task 2.2 — Implement Add Offer and Catalog Search Tab `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/dashboard/add-offer-tab.tsx`
- **Description**: Build catalog search view querying existing products with an "Add Offer" flow. Build multipart form for creating brand new products with name, description, brand, image upload, price, stock, and delivery days.
- **Done when**: Tab handles both existing product offer additions and new product creation.

### Task 2.3 — Implement Incoming Orders Tab `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/dashboard/incoming-orders-tab.tsx`
- **Description**: Build incoming orders table with status filter buttons (All, Pending, Confirmed, Shipped, Delivered), order summary cards, buyer shipping details, and the "Ready for Pickup" button for pending orders.
- **Done when**: Component renders orders and triggers status mutation on click.

---

## Batch 3: Page Integration & Wiring `[SEQUENTIAL]`

### Task 3.1 — Implement Dashboard Shell and Page Component
- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/components/dashboard/dashboard-shell.tsx`
  - Create: `frontend/app/dashboard/page.tsx`
- **Description**: Build `DashboardShell` managing active tab selection. In `page.tsx`, check `useAuth`: if loading render skeleton; if unauthenticated redirect to `/login`; if role is not `merchant` render access restricted banner; if merchant render `DashboardShell`.
- **Done when**: Navigating to `/dashboard` renders tabbed dashboard for merchant users.

---

## Batch 4: Tests `[PARALLEL]`

### Task 4.1 — Offers Tab Vitest Tests `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/dashboard/dashboard-offers.test.tsx`
- **Description**: Test rendering of offers table, empty state, opening edit dialog, and delete confirmation interaction.
- **Done when**: All tests pass via `pnpm test frontend/__tests__/dashboard/dashboard-offers.test.tsx`.

### Task 4.2 — Orders Tab Vitest Tests `[SUBAGENT]`
- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/dashboard/dashboard-orders.test.tsx`
- **Description**: Test rendering of orders, filtering, and clicking "Ready for Pickup" button calling status update mutation.
- **Done when**: All tests pass via `pnpm test frontend/__tests__/dashboard/dashboard-orders.test.tsx`.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Typecheck
- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and typecheck on all frontend files.
  - Frontend: `pnpm lint && pnpm typecheck`
- **Done when**: Zero errors reported.

### Task 5.2 — Full Test Suite
- **Type**: `[SEQUENTIAL]`
- **Description**: Run full test suites across both frontend and backend.
  - Backend: `uv run pytest`
  - Frontend: `pnpm test`
- **Done when**: All tests pass cleanly.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 3 | No | 1 |
| 2 | 3 | Yes | 3 |
| 3 | 1 | No | 1 |
| 4 | 2 | Yes | 2 |
| 5 | 2 | No | 1 |
| **Total** | **11** | | |

---

## Git Commit Plan

1. `feat(frontend): add dashboard TypeScript types and API client functions`
2. `feat(frontend): add TanStack Query hooks for merchant dashboard`
3. `feat(frontend): implement My Offers tab and edit/delete modal dialogs`
4. `feat(frontend): implement Add Offer tab with catalog search and new product form`
5. `feat(frontend): implement Incoming Orders tab with Ready for Pickup action`
6. `feat(frontend): add merchant dashboard page with role protection`
7. `test(frontend): add Vitest unit and integration tests for merchant dashboard`
