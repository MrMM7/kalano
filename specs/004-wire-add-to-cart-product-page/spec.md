# Spec: Wire "Add to Cart" on Product Detail Page

> **Roadmap Reference**: Phase 4, Step 4.4 — Wire "Add to Cart" on product detail page
> **Branch**: `feat/cart`
> **Spec**: 004 of 004 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

This feature connects the user-facing "Add to Cart" button on the product detail page (`/products/[id]`) to the backend cart addition endpoint (`POST /api/v1/cart/items`).

On the product detail page, buyers can either purchase from the default cheapest in-stock merchant offer or choose an alternative seller offer from the comparison table. When clicking "Add to Cart":
- Unauthenticated users are promptly redirected to `/login?redirect=/products/[id]`.
- Authenticated buyers initiate a mutation to add 1 unit of the selected offer to their server-side cart.
- Immediate visual feedback (loading spinner on the button, toast notifications on success or failure) is provided.
- The global cart state cache (`queryKey: ['cart']`) is invalidated so any cart badge or cart view immediately reflects the update.

## 2. Dependencies

- Depends on: `specs/001-cart-backend-add-item/` — connects to `POST /api/v1/cart/items`.
- Depends on: `specs/003-cart-frontend-page/` — reuses `frontend/lib/api/cart.ts` and `frontend/types/cart.ts`.
- Depends on: Phase 2 Authentication — checks current authentication status via `useAuth`.
- Depends on: Phase 3 Product Catalog — integrates with existing `frontend/app/products/[id]/page.tsx`.

## 3. Functional Requirements

### 3.1 — Authentication Guard & Redirect

- [ ] Check authentication status using `useAuth`.
- [ ] If an unauthenticated user clicks the "Add to Cart" button:
  - Immediately redirect them to `/login?redirect=/products/[id]`.
  - Do NOT trigger the API mutation.

### 3.2 — Offer Selection & Cart Addition

- [ ] Default selection uses the cheapest in-stock seller offer (`product.cheapest_offer`).
- [ ] If the buyer selects a different offer in the "Compare All Merchant Offers" table, the purchasing card updates to target that selected offer (`activeOffer.seller_product_id`).
- [ ] Clicking "Add to Cart" sends a mutation calling `POST /api/v1/cart/items` with payload:
  - `seller_product_id`: string (UUID of the active offer).
  - `quantity`: 1.
- [ ] While the mutation is in flight:
  - The "Add to Cart" button displays a loading spinner and disabled state.
  - User cannot trigger duplicate requests.

### 3.3 — Feedback & Cache Invalidation

- [ ] On successful addition:
  - Invalidate the `['cart']` query cache using TanStack Query's `queryClient.invalidateQueries`.
  - Display a success toast notification: "[Product name] added to your cart!" with a clickable action to "View Cart" navigating to `/cart`.
- [ ] On failure:
  - If the backend returns HTTP 400 with `INSUFFICIENT_STOCK`, show an error toast: "Cannot add to cart: stock limit reached."
  - For other errors, show an error toast with the backend error message or a generic fallback.

### 3.4 — Out of Stock State

- [ ] If the active offer has `stock <= 0` or no offers exist, the button remains disabled with label "Out of Stock" (preserving existing UI behavior).

## 4. Acceptance Criteria

- [ ] AC1: Clicking "Add to Cart" while unauthenticated redirects to `/login?redirect=/products/[id]`.
- [ ] AC2: Clicking "Add to Cart" while logged in as a buyer sends `POST /api/v1/cart/items` with the active seller offer ID and quantity 1.
- [ ] AC3: If an alternative seller offer is selected from the table, clicking "Add to Cart" adds that specific seller's offer ID.
- [ ] AC4: A loading state is shown during mutation execution.
- [ ] AC5: On success, a toast appears confirming addition with a link to `/cart`, and the cart query is invalidated.
- [ ] AC6: On stock exhaustion error (`INSUFFICIENT_STOCK`), an error toast is displayed.
- [ ] AC7: Out-of-stock offers disable the button and prevent cart addition.
- [ ] AC8: Vitest tests verify both logged-in and unauthenticated interactions.

## 5. UI/UX Requirements

- **Button State Changes**:
  - Default: Shopping cart icon + "Add to Cart".
  - Loading: Spinning loader icon + "Adding to Cart...".
  - Disabled: "Out of Stock" when zero units are available.
- **Toasts**:
  - Success toast: "Added to Cart" with product title and "View Cart" action.
  - Error toast: Alert icon with concise error text.
- **Accessibility**:
  - Accessible `aria-label` specifying the product and merchant (e.g. `aria-label="Add Wireless Headphones sold by BestAudio to cart"`).

## 6. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Unauthenticated user clicks button | Instantly redirected to login with return path preserving product ID. |
| Buyer adds item repeatedly until stock exhausted | First additions succeed; subsequent addition hitting stock limit displays `INSUFFICIENT_STOCK` toast. |
| Network error during addition | Display error toast; re-enable button for retry. |
| Non-buyer role clicks Add to Cart | Backend returns 403 `FORBIDDEN_ROLE`; frontend shows error toast explaining buyer-only restriction. |

## 7. Out of Scope

- ❌ Changing quantity on the product detail page before adding (default 1 unit; quantity adjustments occur on `/cart`).
- ❌ Direct "Buy Now" instant checkout button (deferred to Phase 5).

## 8. Constitution Compliance

- ✅ §4.1 Strict Backend Separation: Calls FastAPI `POST /api/v1/cart/items`.
- ✅ §4.2 Authentication: Enforces buyer authentication and cookie JWT flow.
- ✅ §8 Frontend Pages: Product detail page is public, but cart actions require buyer login.
- ✅ §14 Testing: Vitest test coverage for product detail page cart wiring.

## 9. Open Questions

- None. Clarification confirmed: Unauthenticated users are redirected to `/login` with `?redirect=/products/[id]`.
