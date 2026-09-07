# Spec: Responsive Design Pass

> **Roadmap Reference**: Phase 8, Step 8.4 — Responsive design pass
> **Branch**: `feat/polish-and-integration`
> **Spec**: 004 of 006 in phase
> **Date**: 2026-09-07
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

Section 12 of the Constitution requires a desktop-first design that remains fully functional and visually coherent down to tablet breakpoints (768px `md` and 640px `sm`). While the initial implementation targeted standard desktop monitors, several views have fixed-width containers, multi-column tables that cause horizontal overflow, and a desktop-centric navigation bar that crowds search and menu buttons on narrower screens.

This feature adapts the entire application for tablet and smaller screens:
1. Transforming the navigation bar with a collapsible tablet/mobile menu (sheet/drawer) for navigation links and role actions, along with an adaptive search input.
2. Converting multi-column grid layouts (such as product listings, hero callouts, and checkout columns) to fluid, responsive grids that gracefully scale from 4 columns down to 2 or 1.
3. Wrapping data tables (Order history, Seller offers, Logistics dashboard) in accessible horizontal scroll containers (`overflow-x-auto`) with sticky primary columns or mobile-friendly card alternatives to eliminate viewport distortion.
4. Harmonizing typography, padding, and button sizes across breakpoints.

## 2. Dependencies

- Depends on:
  - `specs/001-shared-layout-and-navigation/` (responsive navbar and footer base)
  - `specs/002-loading-and-error-states/` (responsive skeletons and error cards)
  - `specs/003-accessibility-pass/` (preserves ARIA attributes during responsive transitions)

## 3. Functional Requirements

### 3.1 — Responsive Navigation & Header Adaptation

- [ ] Tablet/Mobile Menu Drawer: When viewport width drops below `md` (768px), primary navigation links and role-specific shortcuts collapse behind an accessible hamburger menu icon button.
- [ ] Adaptive Search Bar: On smaller screens, the search bar adapts from full width to an expandable or neatly stacked input without overflowing the header boundary.
- [ ] Cart icon and user profile trigger remain easily accessible on all screen sizes.

### 3.2 — Catalog & Product Detail Responsive Grids

- [ ] Product Grid (`/` and `/products`):
  - Large desktop (`lg` and above): 4 columns.
  - Standard desktop / tablet landscape (`md` to `lg`): 3 columns.
  - Tablet portrait / large mobile (`sm` to `md`): 2 columns.
  - Mobile (`<sm`): 1 column.
- [ ] Product Detail (`/products/[id]`):
  - Desktop: 2-column layout (product image/gallery on left, info and offers on right).
  - Tablet/Mobile: Single-column stacked layout (image on top, followed by product description, default offer, and alternative offers).

### 3.3 — Responsive Data Tables & Horizontal Scrolling

- [ ] Wrap all data tables (`/orders`, `/dashboard`, `/logistics`, `seller-offers-table`) inside responsive container elements with `overflow-x-auto` and `-webkit-overflow-scrolling: touch`.
- [ ] Ensure minimum column widths so text never truncates awkwardly or collapses into unreadable slivers.
- [ ] Add subtle scroll indicators or shadow cues to inform users that tables can be scrolled horizontally on narrow viewports.

### 3.4 — Responsive Forms & Layout Containers

- [ ] Checkout Page (`/checkout`): Stacks order summary and address/payment forms into a single vertical column on tablet/mobile views (`flex-col lg:flex-row`).
- [ ] Auth Pages (`/login`, `/signup`): Form cards scale to full width with appropriate padding on mobile while remaining centered with a max-width on desktop.

## 4. Acceptance Criteria

- [ ] AC1: At 768px viewport width (standard iPad portrait), no horizontal page scrollbar appears on any route.
- [ ] AC2: At 768px and 640px, the navigation bar collapses secondary items into an accessible menu drawer.
- [ ] AC3: Product cards resize fluidly and stack into 2 columns on tablet screens without clipping images or text.
- [ ] AC4: Tables on orders, dashboard, and logistics pages scroll smoothly within their containers without breaking page borders.
- [ ] AC5: The checkout page presents a clean, stacked layout on tablet/mobile with both address inputs and order summaries accessible.
- [ ] AC6: Touch targets for buttons and links on tablet screens meet the minimum recommended 44x44px hit area.

## 5. API Contract

This spec addresses CSS and responsive layout behavior. No backend API modifications are required.

## 6. UI/UX Requirements

- **Breakpoints (Tailwind Standards)**:
  - `sm`: 640px
  - `md`: 768px (primary tablet target)
  - `lg`: 1024px (small desktop / large tablet)
  - `xl`: 1280px (standard desktop)
- **Navigation Drawer**: Smooth slide-in transition from right or top; backdrop overlay with dismiss on tap outside or `Esc` key.
- **Table Usability**: Minimum column widths (`min-w-[120px]`, `min-w-[200px]`) within scrollable table container.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Device rotated between portrait and landscape | Layout immediately recalculates without requiring page reload; drawer closes cleanly if open. |
| User opens mobile menu on tablet and resizes window to desktop | Drawer automatically closes and standard desktop navigation items reappear. |
| Table content exceeds tablet viewport width | Container scrolls horizontally while maintaining table header alignment and row borders. |

## 8. Out of Scope

- ❌ Native mobile app wrapper or PWA manifest offline caching.
- ❌ Device-specific biometric integrations.

## 9. Constitution Compliance

- ✅ Section 12: Desktop-first layout, fully responsive down to tablet breakpoints (768px / 640px).
- ✅ Section 12: Touch-friendly targets and keyboard-navigable responsive drawer.

## 10. Open Questions

- None. Breakpoints adhere to standard Tailwind breakpoints down to 768px tablet portrait.
