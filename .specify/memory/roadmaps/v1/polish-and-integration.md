# [x] Phase 8: Polish & Integration

### [x] Step 8.1 — Shared layout & navigation

- Build the global layout: navbar with logo, search bar, cart icon (with item count badge), user
  menu (login/signup or profile/logout).
- Conditionally show dashboard links based on user role.
- Add a simple footer.

### [x] Step 8.2 — Loading & error states

- Add loading skeletons/spinners to all pages that fetch data.
- Add user-friendly error states for failed API calls.
- Add toast notifications for actions (added to cart, order placed, etc.).

### [x] Step 8.3 — Accessibility pass

- Audit all interactive elements for `aria-label` attributes.
- Ensure all forms have proper `<label>` elements.
- Test keyboard navigation through the main flows.
- Verify semantic HTML usage (`<main>`, `<nav>`, `<section>`, `<button>`).

### [x] Step 8.4 — Responsive design pass

- Ensure all pages render well on desktop and tablet breakpoints.
- Adjust grid layouts, font sizes, and spacing for smaller screens.
- Test the navbar collapses or adapts on tablet.

### [x] Step 8.5 — End-to-end smoke test

- Manually (or via a test script) walk through the complete flow:
  1. Register a merchant → create a product with an offer.
  2. Register a buyer → search for the product → add to cart → checkout.
  3. Merchant marks order as ready for pickup.
  4. Logistics picks up, ships, and delivers the order.
- Fix any bugs found during this walkthrough.

### [x] Step 8.6 — README & documentation

- Write a comprehensive `README.md` with: project description, tech stack, setup instructions
  (frontend + backend), environment variable reference, and how to run tests.
- Ensure `.env.example` files are up to date.
- Final review of all code against the constitution.
