# Spec: Loading and Error States

> **Roadmap Reference**: Phase 8, Step 8.2 — Loading & error states
> **Branch**: `feat/polish-and-integration`
> **Spec**: 002 of 006 in phase
> **Date**: 2026-09-07
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

While several components in the application provide basic inline states, user experience across transitions, data fetching, and mutations remains uneven. Several pages either show abrupt layout shifts during loading or lack user-friendly error boundaries when network or API failures happen. Furthermore, user actions (such as adding an item to the cart, modifying quantity, completing simulated checkout, updating listing inventory, or advancing delivery statuses) lack consistent, modern toast notifications.

This feature introduces a comprehensive feedback architecture across the frontend:
1. Standardized loading skeleton primitives and App Router loading boundaries (`loading.tsx`).
2. Robust, friendly error fallback components with retry triggers and App Router error boundaries (`error.tsx` and `not-found.tsx`).
3. Rich, accessible toast notifications using `shadcn/ui` Sonner (providing success, error, warning, and informational feedback for all user mutations).

## 2. Dependencies

- Depends on: `specs/001-shared-layout-and-navigation/` (requires unified layout and navbar context).

## 3. Functional Requirements

### 3.1 — Standardized Loading Skeletons

- [ ] Provide reusable skeleton components conforming to Tailwind pulsing animation standards:
  - `TableSkeleton`: Configurable row and column count for tabular data (orders, offers, logistics).
  - `CardSkeleton`: Card-shaped placeholder for product catalog items.
- [ ] Implement `frontend/app/loading.tsx` to handle route transition loading smoothly at the root layout level.
- [ ] Ensure all asynchronous queries in TanStack Query display matching skeleton structures rather than raw text or blank screens while `isLoading` is true.

### 3.2 — Standardized Error States & Boundaries

- [ ] Create a reusable `ErrorState` component featuring:
  - An intuitive warning or alert icon.
  - A clear, human-readable title and description (without leaking raw technical stack traces or database errors).
  - A "Try Again" / "Retry" action button that invokes the relevant query's `refetch()` or error boundary `reset()`.
- [ ] Implement `frontend/app/error.tsx` to catch uncaught client runtime errors gracefully without crashing the whole application window.
- [ ] Implement `frontend/app/not-found.tsx` to provide a friendly 404 screen with a prominent "Return to Home" button.

### 3.3 — Toast Notification System (Sonner)

- [ ] Leverage shadcn/ui Sonner (`toast` from `sonner`) to trigger notifications across all key user workflows:
  - **Cart Operations**:
    - "Added to cart: [Product Name]" (with optional "View Cart" action button).
    - "Quantity updated."
    - "Item removed from cart."
    - "Failed to update cart: [Friendly error message]."
  - **Checkout Flow**:
    - "Order placed successfully! Redirecting to orders..."
    - "Checkout failed: [Friendly error message]."
  - **Merchant Dashboard**:
    - "New product created successfully."
    - "Offer created successfully."
    - "Offer updated."
    - "Offer removed."
    - "Order marked as ready for pickup."
  - **Logistics Dashboard**:
    - "Order status updated to [Status]."
    - "Delivery ended successfully."
  - **Authentication Events**:
    - "Welcome back, [Name]!" upon successful login.
    - "Account created successfully! Please log in." upon signup.
    - "You have been logged out." upon logout.

## 4. Acceptance Criteria

- [ ] AC1: When navigating between pages or waiting for initial API data, users see smooth skeleton placeholders instead of blank screens.
- [ ] AC2: If an API request fails (e.g. network disconnect, 500 error), the affected view renders the `ErrorState` component with a working "Try Again" button.
- [ ] AC3: If an unhandled route error occurs, `app/error.tsx` captures it and offers a "Try again" button.
- [ ] AC4: Navigating to an invalid route renders the custom `app/not-found.tsx` page.
- [ ] AC5: Adding a product to cart displays a success toast notification confirming the action.
- [ ] AC6: Changing order delivery status in `/logistics` displays a success toast notification confirming the transition.
- [ ] AC7: Submitting invalid credentials or encountering server errors displays a red error toast describing the issue cleanly.
- [ ] AC8: Toast notifications stack nicely in the upper-right corner without obscuring critical interactive controls.

## 5. API Contract

This spec consumes existing endpoints and standard error envelopes:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Human-readable explanation"
  }
}
```
Client code parses the `error.message` field to present clear toast notifications and error messages.

## 6. UI/UX Requirements

- **Toaster Configuration**: Positioned at `top-right`, rich colors enabled, auto-dismiss duration of 4000ms.
- **Error State Layout**: Centered card or container with subtle red/amber accent, descriptive message, and a distinct button to retry.
- **Skeleton Visuals**: Muted background (`bg-muted`), rounded corners matching shadcn theme, smooth pulse animation (`animate-pulse`).
- **Toast Styling**: Clean typography, crisp icons (checkmark for success, alert for error), accessible contrast.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Multiple rapid toasts triggered | Sonner gracefully stacks up to 3-5 toasts and dismisses them in order. |
| API returns non-JSON error or 500 without envelope | Fallback error message "An unexpected error occurred. Please try again later." is displayed. |
| Network offline during refetch | Error state remains visible and triggers an immediate error toast stating connection lost. |
| User navigates away before toast auto-dismisses | Toast remains managed by global provider until its timeout expires or is closed. |

## 8. Out of Scope

- ❌ Custom server-side logging integration (e.g., Sentry or Datadog).
- ❌ Persistent push notifications outside of browser tab.

## 9. Constitution Compliance

- ✅ Section 4.4: Error messages presented to the user derive from the standard API error envelope (`error.message`) and never expose database traces or raw 500 tracebacks.
- ✅ Section 12: All error messages, alerts, and skeletons maintain proper accessibility roles (`role="alert"`, `aria-live="polite"` or `"assertive"`).

## 10. Open Questions

- None. Sonner is selected and already integrated into root layout; standard error envelopes and skeletons apply universally.
