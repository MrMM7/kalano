# Spec: Shared Layout and Navigation

> **Roadmap Reference**: Phase 8, Step 8.1 — Shared layout & navigation
> **Branch**: `feat/polish-and-integration`
> **Spec**: 001 of 006 in phase
> **Date**: 2026-09-07
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

Currently, the frontend application has ad-hoc navigation headers inside certain individual pages (such as the landing page and products catalog) while other pages have inconsistent or missing navigation. There is no unified header, navigation bar, or footer embedded into the root layout.

This feature establishes a centralized, persistent global navigation bar and a shared footer inside `frontend/app/layout.tsx`. The navigation bar will feature the Kalano brand logo, a persistent global search input that redirects queries to the catalog page (`/products?q=...`), a shopping cart indicator with a dynamic item count badge, and a role-aware user menu. When logged out, the user menu offers direct links to log in and sign up. When authenticated, it displays the user's name and role, and presents contextual navigation links based on their role (`/dashboard` for merchants, `/logistics` for logistics staff, `/orders` and `/cart` for buyers), along with a one-click logout action.

## 2. Dependencies

- Depends on: None (this is the first spec in Phase 8).

## 3. Functional Requirements

### 3.1 — Global Navigation Bar Structure

- [ ] The navigation bar must be rendered at the top of every page via the root layout (`frontend/app/layout.tsx`).
- [ ] Brand Logo: Display the Kalano logo and name linking directly to `/`.
- [ ] Persistent Global Search Input: A search bar present on all views. Submitting a search query redirects the user to `/products?q={query}`.
- [ ] Catalog Link: Direct navigational link to browse all products (`/products`).
- [ ] Cart Indicator with Badge: Visible for all users. For authenticated buyers with active cart items, displays a numeric count badge showing total items in the cart. Clicking the cart icon navigates to `/cart`.
- [ ] Sticky or fixed positioning at the top with a subtle bottom border and background blur effect.

### 3.2 — Role-Aware User Navigation Menu

- [ ] Unauthenticated State: When no authenticated user session exists, display visible "Log In" (`/login`) and "Sign Up" (`/signup`) action buttons.
- [ ] Authenticated State: When a user session exists (hydrated via `AuthContext`), display a user profile trigger containing the user's display name or avatar icon.
- [ ] Contextual Menu Items by Role:
  - For Buyer: Link to "My Orders" (`/orders`), link to "Cart" (`/cart`), and "Log Out".
  - For Merchant: Link to "Seller Dashboard" (`/dashboard`), link to "Catalog" (`/products`), and "Log Out".
  - For Logistics: Link to "Logistics Dashboard" (`/logistics`), and "Log Out".
- [ ] Logout Trigger: Clicking "Log Out" triggers the existing logout routine (clearing the JWT cookie and session state) and redirects the user to `/`.

### 3.3 — Global Footer

- [ ] A clean, semantic `<footer>` component rendered at the bottom of every page via the root layout.
- [ ] Contains brand information, learning-project disclaimer ("Kalano is built solely for educational purposes; all payments and logistics are simulated"), quick navigational links, and copyright text.

### 3.4 — Page Cleanup

- [ ] Remove duplicate ad-hoc `<header>` elements and inline navigation bars from individual pages (`app/page.tsx`, `app/products/page.tsx`, `app/dashboard/page.tsx`, etc.) to prevent redundant headers.

## 4. Acceptance Criteria

- [ ] AC1: Every page in the application automatically displays the global navigation bar at the top and the footer at the bottom without individual pages needing to define them.
- [ ] AC2: Typing a query in the persistent search bar and pressing Enter navigates to `/products?q={query}` with the query populated.
- [ ] AC3: When an unauthenticated visitor views the site, "Log In" and "Sign Up" buttons are clearly visible.
- [ ] AC4: When a merchant logs in, the user menu displays their display name, a merchant badge, and a direct link to `/dashboard`.
- [ ] AC5: When a logistics user logs in, the user menu displays a link to `/logistics`.
- [ ] AC6: When a buyer logs in and has items in their cart, the cart icon displays a badge matching the total quantity of cart items.
- [ ] AC7: Clicking "Log Out" clears user authentication and resets the navigation bar to the unauthenticated state.
- [ ] AC8: No page has double headers or mismatched navigation styles.

## 5. API Contract

This feature is frontend-focused and consumes existing endpoints:
- `GET /api/v1/auth/me` (reads user session, user role, and display name)
- `POST /api/v1/auth/logout` (clears authentication cookie)
- `GET /api/v1/cart` (reads cart item count for buyers)

No new backend API endpoints are introduced in this spec.

## 6. UI/UX Requirements

- **Page/Route**: Global layout wrapping all routes (`/`, `/products`, `/products/[id]`, `/cart`, `/checkout`, `/orders`, `/dashboard`, `/logistics`, `/login`, `/signup`).
- **Layout**:
  - Top header: 64px height (`h-16`), horizontal flexbox container, maximum width `max-w-7xl`, centered with responsive padding.
  - Left zone: Brand logo and title.
  - Center zone: Persistent search input with magnifying glass icon and clear button.
  - Right zone: Browse Catalog link, Cart icon button with absolute-positioned badge, and User Menu dropdown or auth buttons.
  - Bottom footer: Multi-column responsive layout with brand description, quick navigation links, simulated platform disclaimer, and copyright.
- **Interactions**:
  - Hover states on links and buttons with smooth transitions.
  - Dropdown menu for authenticated user profiles with keyboard navigation (Esc to dismiss).
  - Search input supports clearing current text and submission via Enter key.
- **States**:
  - Loading auth state: Subtle skeleton placeholder for user menu to avoid layout shift while session hydrates.
  - Empty cart state: Cart icon displays without count badge or with a badge value of 0.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| User is unauthenticated and clicks the cart icon | Redirected to `/login` with return destination `/cart`. |
| Cart API fails or returns 401 | Cart icon remains visible without badge; does not crash navbar. |
| User enters whitespace-only in search bar | Search submission is ignored or trimmed; does not trigger empty query redirect. |
| User logs out while on a protected page (`/dashboard`) | Logout flow clears session and Next.js middleware redirects back to `/`. |
| User profile name is very long | User display name in navbar is truncated with ellipsis (`max-w-[150px] truncate`). |

## 8. Out of Scope

- ❌ Redesigning the landing page hero section or product card grids (covered in Step 8.4 and Phase 9).
- ❌ Adding external real-time WebSocket notifications to the navbar.
- ❌ Multi-language / internationalization selectors.

## 9. Constitution Compliance

- ✅ Section 4.1: Next.js remains a thin client; all user and cart data is retrieved from FastAPI via existing client hooks.
- ✅ Section 4.2: Authentication status relies strictly on the httpOnly JWT cookie verified via `GET /api/v1/auth/me`.
- ✅ Section 7: All frontend files use `kebab-case` naming (`navbar.tsx`, `footer.tsx`, `user-nav.tsx`).
- ✅ Section 12: Semantic HTML used throughout (`<header>`, `<nav>`, `<footer>`, `<button>`) with proper ARIA attributes.

## 10. Open Questions

- None. Scope and design decisions resolved: persistent search across all pages, role-aware user menu, and dynamic cart badge.
