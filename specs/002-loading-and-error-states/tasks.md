# Tasks: Loading and Error States

> **Spec**: `specs/002-loading-and-error-states/spec.md`
> **Plan**: `specs/002-loading-and-error-states/plan.md`
> **Branch**: `feat/polish-and-integration`
> **Spec**: 002 of 006 in phase
> **Date**: 2026-09-07
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

- Depends on: `specs/001-shared-layout-and-navigation/` (Status: ⬜ Pending)

---

## Batch 1: Foundation UI Components `[PARALLEL]`

### Task 1.1 — Create Reusable ErrorState Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/ui/error-state.tsx`
- **Description**: Implement `ErrorState` component accepting `title`, `message`, `onRetry`, and `retryLabel`. Use `AlertCircle` or `AlertTriangle` icon from `lucide-react`, centered layout, accessible `role="alert"` tag, and a button triggering `onRetry` when passed.
- **Done when**: `ErrorState` renders title, message, and working retry button when supplied.

### Task 1.2 — Create TableSkeleton Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/ui/table-skeleton.tsx`
- **Description**: Implement `TableSkeleton` component accepting `rows` and `columns` props. Render an accessible skeleton table layout with animated pulsing bars to prevent layout shift while tabular data loads.
- **Done when**: Component renders requested number of placeholder rows and columns with `animate-pulse`.

---

## Batch 2: App Router Special Boundaries `[PARALLEL]`

### Task 2.1 — Implement Root Loading Boundary `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/app/loading.tsx`
- **Description**: Implement root `loading.tsx` using Next.js App Router conventions. Render a centered skeleton or loading indicator with accessible `aria-busy="true"` and `aria-label="Loading page content"`.
- **Done when**: Navigating between routes triggers smooth root loading boundary without jarring blank states.

### Task 2.2 — Implement Root Error Boundary & 404 Page `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/app/error.tsx`
  - Create: `frontend/app/not-found.tsx`
- **Description**: Implement `app/error.tsx` as a client error boundary receiving `error` and `reset()`. Render `ErrorState` passing `reset` to retry. Implement `app/not-found.tsx` showing a clean 404 illustration, title, and "Return to Home" button.
- **Done when**: Uncaught errors and 404 routes display friendly fallback interfaces.

---

## Batch 3: Page Toast & Error Integration `[SEQUENTIAL]`

### Task 3.1 — Wire Toasts & Error Handling in Buyer Pages

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/app/cart/page.tsx`
  - Modify: `frontend/app/checkout/page.tsx`
  - Modify: `frontend/app/products/[id]/page.tsx`
  - Modify: `frontend/app/login/page.tsx`
  - Modify: `frontend/app/signup/page.tsx`
- **Description**: Integrate `toast.success()` and `toast.error()` across buyer interactions. On cart add, update, remove: show confirmation toast. On checkout: show placement toast. On auth login/signup: show welcome/success toast. If product load fails, display `ErrorState` with retry.
- **Done when**: All buyer actions trigger appropriate Sonner toasts and product detail handles errors with retry.

### Task 3.2 — Wire Toasts & Error Handling in Merchant & Logistics Pages

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/app/dashboard/page.tsx`
  - Modify: `frontend/app/logistics/page.tsx`
- **Description**: Integrate `toast.success()` and `toast.error()` into merchant and logistics views. On offer creation, edit, deletion, or marking order ready for pickup: show confirmation toast. On logistics status update: show transition toast. Replace raw loading texts with `TableSkeleton`.
- **Done when**: Merchant and logistics operations show immediate feedback toasts and tabular skeletons during fetching.

---

## Batch 4: Component Tests `[PARALLEL]`

### Task 4.1 — Vitest Tests for ErrorState and Skeletons `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/error-state.test.tsx`
- **Description**: Write Vitest unit tests verifying:
  1. `ErrorState` renders title, message, and calls `onRetry` on click.
  2. `TableSkeleton` renders specified rows and columns.
  3. `not-found.tsx` renders return home link.
- **Done when**: All test cases in `error-state.test.tsx` pass.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters:
  - Frontend: `pnpm lint` and `pnpm format:check`
- **Done when**: Clean exit with 0 errors.

### Task 5.2 — Full Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run test suite:
  - Frontend: `pnpm test`
- **Done when**: All tests pass.

### Task 5.3 — Manual Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Verify toasts and error states in browser:
  1. Add an item to cart: confirm toast appears.
  2. Enter wrong password on login: confirm error toast appears.
  3. Navigate to `/invalid-url`: confirm custom 404 page renders.
- **Done when**: All scenarios produce expected UI feedback.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 2 | Yes | 2 |
| 2 | 2 | Yes | 2 |
| 3 | 2 | No | 1 |
| 4 | 1 | Yes | 1 |
| 5 | 3 | No | 1 |
| **Total** | **10** | | |

---

## Git Commit Plan

1. `feat(frontend): add ErrorState, TableSkeleton, loading and error boundaries`
2. `feat(frontend): integrate Sonner toast notifications across buyer and merchant flows`
3. `test(frontend): add unit tests for ErrorState and skeletons`
