# Tasks: Responsive Design Pass

> **Spec**: `specs/004-responsive-design-pass/spec.md`
> **Plan**: `specs/004-responsive-design-pass/plan.md`
> **Branch**: `feat/polish-and-integration`
> **Spec**: 004 of 006 in phase
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
  - `specs/003-accessibility-pass/` (Status: ⬜ Pending)

---

## Batch 1: Responsive Navigation Implementation `[PARALLEL]`

### Task 1.1 — Create MobileNav Drawer Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/layout/mobile-nav.tsx`
- **Description**: Build `MobileNav` component using shadcn/ui `Sheet` or an accessible slide-out modal. Include a hamburger trigger button with `aria-label="Open navigation menu"` visible on `<md` screens. Inside the drawer, render search input, navigation links, role-specific dashboard links, and auth controls. Close drawer on item selection or route navigation.
- **Done when**: Drawer opens on trigger click, displays all navigation options, and closes upon navigation.

### Task 1.2 — Integrate MobileNav into Navbar `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/components/layout/navbar.tsx`
- **Description**: Integrate `MobileNav` into `Navbar`. Hide desktop navigation links and search input on screens below `md` breakpoint (`hidden md:flex`), revealing the hamburger button (`md:hidden`). Preserve logo, cart badge, and user menu access.
- **Done when**: Navbar switches gracefully between desktop and tablet/mobile configurations at 768px.

---

## Batch 2: Layout & Grid Responsive Refactoring `[PARALLEL]`

### Task 2.1 — Refactor Catalog & Product Detail Responsiveness `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/app/page.tsx`
  - Modify: `frontend/app/products/page.tsx`
  - Modify: `frontend/app/products/[id]/page.tsx`
- **Description**: Update product grid classes to `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`. On product detail page, change layout to single column on tablet portrait and 2 columns on desktop (`grid-cols-1 lg:grid-cols-2`).
- **Done when**: Products grid and detail view render without overflow down to 640px.

### Task 2.2 — Refactor Cart & Checkout Responsive Stacking `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/app/cart/page.tsx`
  - Modify: `frontend/app/checkout/page.tsx`
- **Description**: In Cart and Checkout pages, change horizontal side-by-side flex layouts to vertical stacks on tablet (`flex-col lg:flex-row`). Ensure summary card and checkout action buttons remain clearly visible and full-width on narrow screens.
- **Done when**: Cart and Checkout views stack cleanly on tablet viewports without horizontal clipping.

### Task 2.3 — Wrap Data Tables in Responsive Scroll Containers `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/app/orders/page.tsx`
  - Modify: `frontend/app/dashboard/page.tsx`
  - Modify: `frontend/app/logistics/page.tsx`
  - Modify: `frontend/components/seller-offers-table.tsx`
- **Description**: Wrap all data table elements in `<div className="w-full overflow-x-auto rounded-lg border border-border">`. Apply minimum table width (`min-w-[600px]`) so text and action columns don't compress.
- **Done when**: Tables scroll smoothly inside their containers on tablet screens without causing full-page horizontal overflow.

---

## Batch 3: Responsive Component Tests `[PARALLEL]`

### Task 3.1 — Vitest Responsive Nav Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/responsive-nav.test.tsx`
- **Description**: Write tests verifying:
  1. Hamburger trigger renders with accessible attributes.
  2. Clicking hamburger trigger toggles drawer open.
  3. Drawer displays navigation items and closes on link click.
- **Done when**: All test cases in `responsive-nav.test.tsx` pass.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Lint & Format

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters on frontend:
  - Frontend: `pnpm lint` and `pnpm format:check`
- **Done when**: 0 errors and clean formatting.

### Task 4.2 — Full Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run complete test suite:
  - Frontend: `pnpm test`
- **Done when**: All tests pass.

### Task 4.3 — Tablet Breakpoint Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Test responsiveness using browser responsive design mode:
  1. Inspect at 768px (iPad portrait): verify no page-level horizontal scroll on all routes.
  2. Inspect at 640px (large phone): verify grid layouts and stacked forms behave cleanly.
  3. Test drawer open/close and table horizontal scrolling on tablet viewports.
- **Done when**: Application behaves fluidly down to 640px.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 2 | Yes | 2 |
| 2 | 3 | Yes | 3 |
| 3 | 1 | Yes | 1 |
| 4 | 3 | No | 1 |
| **Total** | **9** | | |

---

## Git Commit Plan

1. `feat(frontend): add responsive MobileNav drawer and tablet-adaptive navbar`
2. `style(frontend): make product grids, checkout layouts, and tables responsive for tablet breakpoints`
3. `test(frontend): add Vitest tests for responsive mobile navigation`
