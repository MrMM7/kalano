# Tasks: Accessibility Pass

> **Spec**: `specs/003-accessibility-pass/spec.md`
> **Plan**: `specs/003-accessibility-pass/plan.md`
> **Branch**: `feat/polish-and-integration`
> **Spec**: 003 of 006 in phase
> **Date**: 2026-09-07
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

- Depends on:
  - `specs/001-shared-layout-and-navigation/` (Status: ⬜ Pending)
  - `specs/002-loading-and-error-states/` (Status: ⬜ Pending)

---

## Batch 1: Navigation & Global Component Accessibility `[PARALLEL]`

### Task 1.1 — Audit & Fix Navigation Accessibility `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/components/layout/navbar.tsx`
  - Modify: `frontend/components/layout/nav-search.tsx`
  - Modify: `frontend/components/layout/cart-badge.tsx`
  - Modify: `frontend/components/layout/user-nav.tsx`
- **Description**: Add `<nav aria-label="Main Navigation">` wrapper. Add `aria-label="Search products"` to search input and `aria-label="Submit search"` to search button. Update cart badge link with dynamic `aria-label` announcing total item count. Add accessible names and focus rings to user menu trigger and menu items.
- **Done when**: All navigation elements have accessible names and visible focus-visible indicators.

### Task 1.2 — Audit & Fix Catalog & Product Card Accessibility `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/components/product-card.tsx`
  - Modify: `frontend/components/search-bar.tsx`
  - Modify: `frontend/components/seller-offers-table.tsx`
- **Description**: Add descriptive `alt` text to product card images. Ensure card links have explicit aria-label including product name and brand. Ensure `seller-offers-table.tsx` uses semantic `<table>`, `<thead>`, and `<th scope="col">` elements with accessible action buttons.
- **Done when**: Product cards, search bars, and seller offer tables comply with semantic standards.

---

## Batch 2: Form & Workflow Accessibility Pass `[PARALLEL]`

### Task 2.1 — Audit & Fix Auth & Checkout Forms `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/app/login/page.tsx`
  - Modify: `frontend/app/signup/page.tsx`
  - Modify: `frontend/app/checkout/page.tsx`
- **Description**: Ensure every form input has a paired `<label htmlFor="...">`. Wire `aria-invalid` and `aria-describedby` to error message containers. Ensure role selector in signup uses accessible radio group semantics or fieldset/legend.
- **Done when**: All form fields in auth and checkout are programmatically associated with labels and validation alerts.

### Task 2.2 — Audit & Fix Cart, Dashboard, & Logistics Views `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/app/cart/page.tsx`
  - Modify: `frontend/app/orders/page.tsx`
  - Modify: `frontend/app/dashboard/page.tsx`
  - Modify: `frontend/app/logistics/page.tsx`
- **Description**: In cart, add descriptive `aria-label` to quantity adjustment buttons and remove buttons. In orders, dashboard, and logistics tables, ensure headers have `scope="col"`, actions columns are labeled, and status badges include accessible text alternatives.
- **Done when**: Cart controls, dashboard tabs/tables, and logistics order tables are fully keyboard accessible and screen-reader labeled.

---

## Batch 3: Automated Accessibility Tests `[PARALLEL]`

### Task 3.1 — Vitest Accessibility Test Suite `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/accessibility.test.tsx`
- **Description**: Implement tests verifying:
  1. All icon-only buttons in Navbar, Cart, and Dashboard have non-empty `aria-label` attributes.
  2. All inputs in LoginForm, SignupForm, and CheckoutForm have matching labels via `htmlFor` and `id`.
  3. Data tables have `th` headers with `scope="col"`.
  4. Cart badge announces dynamic count to screen readers.
- **Done when**: All test cases in `accessibility.test.tsx` pass.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Format

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters on frontend:
  - Frontend: `pnpm lint` and `pnpm format:check`
- **Done when**: 0 errors and clean formatting.

### Task 4.2 — Full Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run complete frontend test suite:
  - Frontend: `pnpm test`
- **Done when**: All tests pass.

### Task 4.3 — Keyboard Navigation Audit

- **Type**: `[SEQUENTIAL]`
- **Description**: Complete a mouse-free verification pass:
  1. Tab across Navbar and search for a product.
  2. Tab to a product card and press Enter.
  3. Tab to "Add to Cart" and activate with Space.
  4. Tab to Cart, adjust quantity with keyboard, and proceed to checkout.
  5. Fill checkout address and submit order using keyboard only.
- **Done when**: Entire flow can be completed without a mouse, and focus rings remain visible at each step.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 2 | Yes | 2 |
| 2 | 2 | Yes | 2 |
| 3 | 1 | Yes | 1 |
| 4 | 3 | No | 1 |
| **Total** | **8** | | |

---

## Git Commit Plan

1. `style(frontend): improve accessibility with semantic landmarks, ARIA labels, and focus rings`
2. `refactor(frontend): associate form inputs with explicit labels and error descriptors`
3. `test(frontend): add Vitest accessibility audit test suite`
