# Spec: Accessibility Pass

> **Roadmap Reference**: Phase 8, Step 8.3 — Accessibility pass
> **Branch**: `feat/polish-and-integration`
> **Spec**: 003 of 006 in phase
> **Date**: 2026-09-07
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

Accessibility is a non-negotiable core standard defined in Section 12 of the Kalano Constitution. As the user flows for buyers, merchants, and logistics staff have expanded across Phases 1 through 7, several interactive controls (such as icon-only buttons, modal dialogs, status badges, and table actions) lack complete ARIA labels, semantic landmark wrapping, or full keyboard operability.

This feature performs an end-to-end accessibility overhaul across all views:
1. Ensuring every icon-only button and interactive trigger has an explicit, accessible name (`aria-label` or `aria-labelledby`).
2. Associating every form input and select element with a dedicated, visible or screen-reader-accessible `<label>` via `htmlFor` and matching `id`.
3. Verifying semantic landmark structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`) across all page layouts.
4. Ensuring complete keyboard navigation (tabbing order, visible focus rings with `focus-visible`, Enter/Space activation, and Escape to dismiss popups and dialogs).

## 2. Dependencies

- Depends on:
  - `specs/001-shared-layout-and-navigation/` (audits navbar, footer, and search controls)
  - `specs/002-loading-and-error-states/` (audits toasts, skeletons, and error alerts)

## 3. Functional Requirements

### 3.1 — Form Controls & Label Associations

- [ ] All inputs, textareas, and select elements across `/login`, `/signup`, `/checkout`, `/dashboard`, and `/products` must have an associated `<label>` element with `htmlFor` matching the input's `id`.
- [ ] For visually minimalist inputs (such as search bars with internal icons), if a visible label is omitted, an explicit `aria-label` or `sr-only` `<label>` must be provided.
- [ ] Form validation errors must be linked to the respective input using `aria-invalid="true"` and `aria-describedby="{error-id}"`.

### 3.2 — Accessible Names for Icon Buttons & Interactive Triggers

- [ ] Every button containing only an SVG/Lucide icon must have an `aria-label` describing the action (e.g., `aria-label="Remove item from cart"`, `aria-label="Increase quantity"`, `aria-label="Close dialog"`).
- [ ] Cart icon in the navigation bar must announce the item count to screen readers (e.g., `aria-label="Shopping Cart, 3 items"`).
- [ ] Decorative icons must be marked with `aria-hidden="true"` to prevent duplicate screen reader announcements.

### 3.3 — Semantic HTML & Landmark Roles

- [ ] Ensure every page renders inside a `<main>` container.
- [ ] Navigation elements must use `<nav aria-label="...">` to provide landmark context.
- [ ] Data tables on `/orders`, `/dashboard`, and `/logistics` must use semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` tags with `scope="col"` or `scope="row"` attributes.
- [ ] Status indicators must use semantic markup or provide text alternatives for color-only badges.

### 3.4 — Keyboard Navigation & Focus Management

- [ ] Visible focus indicators must appear around all interactive elements when navigated via Tab key using Tailwind's `focus-visible:ring-2` and `focus-visible:ring-offset-2`.
- [ ] Modal dialogs and dropdown menus must trap focus while open and restore focus to the triggering element upon closing.
- [ ] Pressing `Escape` must close open dropdowns, mobile menus, and dialogs.

## 4. Acceptance Criteria

- [ ] AC1: Screen readers announce appropriate accessible names for all icon buttons and interactive controls across the entire site.
- [ ] AC2: Every input field has a programmatic label connection via `htmlFor` and `id`.
- [ ] AC3: Navigating using only the keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Esc`) allows completing buyer checkout, merchant offer updates, and logistics status changes.
- [ ] AC4: Focus rings are clearly visible on every focused interactive element.
- [ ] AC5: Form validation error messages are programmatically tied to their input fields via `aria-describedby`.
- [ ] AC6: All tables in `/orders`, `/dashboard`, and `/logistics` have proper headers with `scope` attributes.

## 5. API Contract

This spec involves frontend accessibility attributes and DOM semantics. No backend API modifications are required.

## 6. UI/UX Requirements

- **Focus Ring Styling**: Consistent, prominent focus ring (`ring-2 ring-primary ring-offset-2`) that activates on keyboard focus (`focus-visible`) without showing distracting outlines on mouse clicks.
- **Color Contrast**: All text and status badges meet WCAG 2.1 AA minimum contrast ratio (4.5:1 for normal text, 3:1 for large text).
- **Reduced Motion**: Respect user preferences for reduced motion (`motion-reduce:animate-none`).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Screen reader encounters a status badge | Reads the status text explicitly (e.g. "Status: Confirmed") rather than relying on color. |
| User tabs into a closed dropdown menu | Focus moves sequentially to the next sibling element without opening dropdown prematurely. |
| Form input has multiple validation errors | `aria-describedby` points to container listing errors; `aria-invalid` set to `"true"`. |

## 8. Out of Scope

- ❌ Full automated screen-reader voice synthesizer integration in CI.
- ❌ High-contrast custom theme toggle (standard system dark/light contrast compliance is sufficient).

## 9. Constitution Compliance

- ✅ Section 12: Strict compliance with semantic HTML tags (`<main>`, `<nav>`, `<section>`, `<button>`).
- ✅ Section 12: `aria-label` required on all interactive elements lacking visible text.
- ✅ Section 12: Keyboard navigation enabled for all interactive flows.
- ✅ Section 12: Color contrast ratios strictly maintained.

## 10. Open Questions

- None. Requirements align directly with Section 12 of the Constitution.
