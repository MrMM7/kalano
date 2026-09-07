# Tasks: Shared Layout and Navigation

> **Spec**: `specs/001-shared-layout-and-navigation/spec.md`
> **Plan**: `specs/001-shared-layout-and-navigation/plan.md`
> **Branch**: `feat/polish-and-integration`
> **Spec**: 001 of 006 in phase
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

- Depends on: None (this is the first spec in Phase 8).

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Layout Component Directory & Base Primitives

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/components/layout/` directory
- **Description**: Verify directory structure for shared layout components under `frontend/components/layout/`. Ensure required icons from `lucide-react` (such as `ShoppingBag`, `ShoppingCart`, `Search`, `User`, `LogOut`, `LayoutDashboard`, `Truck`, `Package`) and UI primitives from `frontend/components/ui/` (such as `Button`, `DropdownMenu`, `Badge`) are available.
- **Done when**: Directory exists and all required UI primitives are confirmed available.

---

## Batch 2: Core Implementation `[PARALLEL]`

### Task 2.1 — Implement Persistent Search Bar Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/layout/nav-search.tsx`
- **Description**: Implement `NavSearch` component. Provide an accessible search form with text input and submit icon button. Read the current search parameter from `useSearchParams` to prefill if present. On submit, trim input, prevent page reload, and navigate to `/products?q={query}` using `useRouter`. Include accessible labels (`aria-label="Search products"`).
- **Done when**: Search component accepts input, submits to `/products?q=...`, and handles empty input gracefully.

### Task 2.2 — Implement Cart Indicator & Badge Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/layout/cart-badge.tsx`
- **Description**: Implement `CartBadge` component. Connect to `useCart` hook to compute the aggregate item quantity in the cart. Render an accessible link to `/cart` wrapping a shopping cart icon. Display a highlighted badge showing the total count when quantity is greater than zero. Cap display at `99+` for large numbers.
- **Done when**: Cart badge dynamically updates based on cart state and links to `/cart`.

### Task 2.3 — Implement Role-Aware User Menu Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/layout/user-nav.tsx`
- **Description**: Implement `UserNav` component using `useAuth`. When unauthenticated, render "Log In" and "Sign Up" buttons. When authenticated, render a dropdown menu displaying the user's name, email, and role badge. Show role-specific links: `/dashboard` for merchants, `/logistics` for logistics staff, and `/orders` for buyers. Wire the "Log Out" item to the auth logout method and redirect to `/`. Include loading skeleton during auth initialization to avoid layout shifts.
- **Done when**: Component renders appropriate buttons for guests and role-filtered menu for logged-in users with functioning logout.

### Task 2.4 — Implement Shared Footer Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/layout/footer.tsx`
- **Description**: Implement `Footer` component with semantic `<footer>`. Structure columns for brand overview, quick navigational links (Home, Catalog, Cart, Login), an educational disclaimer stating Kalano is built for learning and payments/fulfillment are simulated, and copyright notice.
- **Done when**: Footer renders responsive columns and required educational disclaimer text cleanly.

---

## Batch 3: Main Navbar Assembly & Tests `[PARALLEL]`

### Task 3.1 — Assemble Global Navbar Component `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/components/layout/navbar.tsx`
- **Description**: Assemble `Navbar` using `NavSearch`, `CartBadge`, and `UserNav`. Include brand logo and title linked to `/`, Catalog link to `/products`, and responsive flex container layout with sticky positioning (`sticky top-0 z-50`), border bottom, and backdrop blur styling.
- **Done when**: Navbar integrates all subcomponents cleanly and renders sticky at top of viewport.

### Task 3.2 — Vitest Navigation Unit Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/navbar.test.tsx`
- **Description**: Write Vitest unit tests for the navigation components. Test:
  1. Renders brand logo and catalog link.
  2. Renders login and signup buttons when unauthenticated.
  3. Renders user dropdown with role links when logged in as buyer, merchant, and logistics.
  4. Search bar submission navigates to `/products?q={query}`.
  5. Cart badge displays correct item count.
- **Done when**: All Vitest test suites in `frontend/__tests__/navbar.test.tsx` pass.

---

## Batch 4: Root Layout Integration & Page Cleanup `[SEQUENTIAL]`

### Task 4.1 — Wire Navbar and Footer into Root Layout

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/app/layout.tsx`
- **Description**: Import `Navbar` and `Footer` into `frontend/app/layout.tsx`. Wrap the `{children}` node inside a flexbox column layout (`min-h-screen flex flex-col`) with `<main className="flex-1">{children}</main>`.
- **Done when**: Every page automatically renders the global navbar at top and footer at bottom.

### Task 4.2 — Clean Up Duplicate Page Headers

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/app/page.tsx`
  - Modify: `frontend/app/products/page.tsx`
  - Modify: `frontend/app/products/[id]/page.tsx`
  - Modify: `frontend/app/cart/page.tsx`
  - Modify: `frontend/app/checkout/page.tsx`
  - Modify: `frontend/app/orders/page.tsx`
  - Modify: `frontend/app/dashboard/page.tsx`
  - Modify: `frontend/app/logistics/page.tsx`
- **Description**: Remove redundant ad-hoc `<header>` tags, standalone search bars, and manual login/signup buttons from individual route pages that are now redundant with the global navbar. Keep hero sections, page-specific titles, and action controls intact.
- **Done when**: No page displays double headers or duplicated search inputs.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and formatters on frontend code:
  - Frontend: `pnpm lint` and `pnpm format:check`
- **Done when**: Zero lint errors or formatting warnings.

### Task 5.2 — Full Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run complete frontend test suite:
  - Frontend: `pnpm test`
- **Done when**: All tests pass without regressions.

### Task 5.3 — Manual Navigation Smoke Test

- **Type**: `[SEQUENTIAL]`
- **Description**: Walk through navigation manually:
  1. Visit `/` as guest; verify logo, search, catalog link, cart icon, and login/signup buttons appear.
  2. Submit query "laptop" in navbar search; verify redirection to `/products?q=laptop`.
  3. Log in as merchant; verify user menu shows Merchant badge and link to `/dashboard`.
  4. Log in as logistics; verify link to `/logistics`.
  5. Log in as buyer with items; verify cart badge count updates.
  6. Click "Log Out"; verify session terminates and UI resets to unauthenticated state.
- **Done when**: All navigation flows succeed seamlessly.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 1 | No | 1 |
| 2 | 4 | Yes | 4 |
| 3 | 2 | Yes | 2 |
| 4 | 2 | No | 1 |
| 5 | 3 | No | 1 |
| **Total** | **12** | | |

---

## Git Commit Plan

1. `feat(frontend): add shared layout components (navbar, footer, nav-search, cart-badge, user-nav)`
2. `feat(frontend): integrate navbar and footer into root layout and clean up page headers`
3. `test(frontend): add unit tests for shared navigation components`
