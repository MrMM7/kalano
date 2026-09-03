# Spec: Frontend Sign Up Page

> **Roadmap Reference**: Phase 2, Step 2.4 — Frontend auth pages (Sign Up)  
> **Branch**: `feat/authentication`  
> **Spec**: 004 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## 1. Overview

The Sign Up page (`/signup`) provides a streamlined self-service registration interface for new users joining the Kalano multi-vendor marketplace platform.

In accordance with Kalano's business model, users can register under one of two customer-facing roles:
- **Merchant**: Users who want to list products, manage inventory, set custom prices, and fulfill orders.
- **Buyer**: Users who want to browse products, compare seller offers, place orders, and track deliveries.

(Note: The **Logistics** role is managed internally by operations staff and is strictly prohibited from self-registration.)

The `/signup` page is a client-rendered Next.js page that serves as a thin client communicating directly with the FastAPI backend endpoint `POST /api/v1/auth/register`. It features a prominent visual role selector, client-side input validation using Zod, comprehensive error handling conforming to Kalano's standard error envelope, and seamless navigation with feedback.

---

## 2. Dependencies

- **Depends on**: `specs/001-user-registration-endpoint/` (Step 2.1) — The backend API `POST /api/v1/auth/register` must be defined and available to complete end-to-end registration. However, frontend development and testing can proceed in parallel using contract-based mock handlers.
- **Depends on**: `specs/002-user-login-endpoint/` (Step 2.2) — The login page (`/login`) is the redirect destination upon successful account creation. No functional code dependency exists.

---

## 3. Functional Requirements

### 3.1 — Layout & Presentation
- [ ] The page MUST be accessible at the route `/signup`.
- [ ] The page MUST render a clean, centered card layout on a subtle background (`min-h-screen flex items-center justify-center bg-muted/40 p-4`).
- [ ] The card MUST include a header with the Kalano branding/title ("Create an Account") and a concise subtitle ("Choose your account type and get started").
- [ ] The card MUST contain the role selector, followed by the registration input fields, the submission button, and a link to the login page.

### 3.2 — Role Selector Component
- [ ] The role selector MUST be positioned at the top of the form, directly above the text input fields.
- [ ] The selector MUST feature two side-by-side selectable panels:
  - **Left Panel ("Merchant")**:
    - Header: Store icon + "Merchant" label.
    - Benefits bullet list:
      - List products on the marketplace
      - Set your own prices
      - Manage your inventory
      - Track orders
  - **Right Panel ("Buyer")**:
    - Header: Shopping bag icon + "Buyer" label.
    - Benefits bullet list:
      - Browse thousands of products
      - Compare seller prices
      - Track your orders
      - Easy checkout
- [ ] Clicking either panel MUST select that role (`"merchant"` or `"buyer"`).
- [ ] The selected panel MUST be visually distinct with a highlighted primary border, subtle background tint, and active indicator.
- [ ] The unselected panel MUST retain a muted/neutral border and background.
- [ ] The role selector MUST support full keyboard navigation (accessible via tab and select with Enter or Space, with proper `role="radiogroup"` and `role="radio"` attributes).
- [ ] The user MUST select a role before submitting the form. If no role is selected when submission is attempted, a validation error message ("Please select a role") MUST be displayed below the role selector.

### 3.3 — Form Fields & Input Handling
- [ ] The form MUST contain the following input fields below the role selector:
  1. **Display Name**: Text input (`id="display_name"`, `type="text"`, placeholder `"e.g. Jane Doe"`).
  2. **Email**: Email input (`id="email"`, `type="email"`, placeholder `"name@example.com"`, autocomplete `"email"`).
  3. **Password**: Masked password input (`id="password"`, `type="password"`, placeholder `"••••••••"`, autocomplete `"new-password"`).
  4. **Confirm Password**: Masked password input (`id="confirm_password"`, `type="password"`, placeholder `"••••••••"`, autocomplete `"new-password"`).
- [ ] All inputs MUST have visible, accessible `<label>` elements linked via `htmlFor`.
- [ ] Confirm Password is client-side only and MUST NOT be included in the API payload sent to the backend.

### 3.4 — Client-Side Validation (Zod)
- [ ] Validation MUST execute on form submission using Zod schema `signupSchema`.
- [ ] Validation rules:
  - `user_role`: Must be `"buyer"` or `"merchant"` (error: `"Please select a role"`).
  - `display_name`: Must be non-empty string after trimming (error: `"Display name is required"`).
  - `email`: Must be a valid email format (error: `"Invalid email address"`).
  - `password`: Must be at least 8 characters in length (error: `"Password must be at least 8 characters"`).
  - `confirm_password`: Must match `password` exactly (error: `"Passwords do not match"`).
- [ ] When validation fails:
  - Form submission MUST be prevented.
  - Field-specific error messages MUST be rendered beneath their corresponding input fields in red text (`text-destructive`).
  - Inputs with errors MUST display visual error borders (`aria-invalid="true"`).

### 3.5 — Submission & API Integration
- [ ] On valid form submission, the page MUST invoke the API client function `registerUser` which issues a `POST /api/v1/auth/register` request.
- [ ] The request body MUST contain:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "display_name": "Jane Doe",
    "user_role": "buyer"
  }
  ```
- [ ] During the request lifecycle:
  - The submit button MUST be disabled to prevent duplicate submissions.
  - The submit button MUST display a loading spinner and text ("Creating account...").
  - Form inputs MUST be disabled or read-only.

### 3.6 — Success & Error Feedback
- [ ] **On Success (HTTP 201/200)**:
  - A success toast notification MUST be triggered: `"Account created successfully!"`.
  - The user MUST be redirected to `/login` via Next.js router (`router.push('/login')`).
- [ ] **On API Error**:
  - The API error message extracted from the standard envelope (`res.error.message`) MUST be displayed in an alert or banner above the form (e.g., `"Email already registered"`).
  - The submit button and inputs MUST be re-enabled for the user to correct and retry.
  - No redirect should occur.

### 3.7 — Navigation & Secondary Links
- [ ] A navigation link MUST be rendered at the bottom of the card: `"Already have an account? Log in"` linking to `/login`.

---

## 4. Acceptance Criteria

- [ ] **AC1**: Navigating to `/signup` renders the centered card with the Role Selector, all 4 input fields, Submit button, and Login link.
- [ ] **AC2**: Clicking the "Merchant" card selects "merchant" with visible highlight; clicking "Buyer" selects "buyer" with visible highlight.
- [ ] **AC3**: Submitting the form with empty fields displays inline validation errors for every field and does not fire any network request.
- [ ] **AC4**: Entering mismatched passwords displays the inline error `"Passwords do not match"` under the Confirm Password input.
- [ ] **AC5**: Entering a password with fewer than 8 characters displays `"Password must be at least 8 characters"`.
- [ ] **AC6**: Submitting with valid data sends a `POST /api/v1/auth/register` request containing `email`, `password`, `display_name`, and `user_role` (and omits `confirm_password`).
- [ ] **AC7**: A successful registration response triggers a toast notification `"Account created successfully!"` and redirects to `/login`.
- [ ] **AC8**: When the backend returns an error envelope (e.g., status 409 with code `DUPLICATE_EMAIL` and message `"A user with this email address already exists."`), the message is displayed clearly to the user without redirecting.
- [ ] **AC9**: During API submission, the submit button is disabled and displays a loading state.
- [ ] **AC10**: The page and role selector pass keyboard navigation checks (Tab, Space, Enter) and pass accessibility checks with labeled inputs.

---

## 5. API Contract

### `POST /api/v1/auth/register`

**Summary**: Register a new user account  
**Description**: Creates a new user in the `users` table with hashed credentials and specified role (`buyer` or `merchant`).

**Request Body** (`UserRegisterPayload`):
```json
{
  "email": "string (email format, required)",
  "password": "string (min 8 chars, required)",
  "display_name": "string (min 1 char, required)",
  "user_role": "buyer | merchant (required)"
}
```

**Success Response** (`201 Created` or `200 OK` — `UserResponse`):
```json
{
  "id": "uuid string",
  "created_at": "ISO-8601 timestamp string",
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "user_role": "buyer",
  "address": null
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | Malformed request or invalid payload |
| 409 | `DUPLICATE_EMAIL` | An account with this email address already exists |
| 422 | `UNPROCESSABLE_ENTITY` | Validation failed on backend fields |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

**Error Response Body Format**:
```json
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "A user with this email address already exists."
  }
}
```

---

## 6. UI/UX Requirements

- **Page/Route**: `/signup`
- **Layout**: Centered card layout (`max-w-xl w-full mx-auto`) inside a viewport-centered flex container.
- **Visual Design**:
  - Clean, modern aesthetic using shadcn/ui primitives.
  - Card with subtle shadow, border, and comfortable padding.
  - Role Selector: Two equal-width cards in a grid (`grid grid-cols-1 sm:grid-cols-2 gap-4`).
    - Merchant card: Storefront icon (`Store` from `lucide-react`), bold title, 4 checklist items with small checkmark icons.
    - Buyer card: Shopping bag icon (`ShoppingBag` from `lucide-react`), bold title, 4 checklist items with small checkmark icons.
    - Active state: `border-primary bg-primary/5 ring-2 ring-primary/20`.
    - Inactive state: `border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30`.
- **Form Elements**:
  - Vertical stack (`flex flex-col gap-4`) with clear `<Label>` elements above each `<Input>`.
  - Error messages in small red text (`text-destructive text-xs mt-1`).
  - Full-width primary Submit button (`w-full`).
- **Responsive Behavior**:
  - On screens `>= 640px` (sm and above): Role selector cards are displayed side-by-side (`grid-cols-2`).
  - On small screens (`< 640px`): Role selector cards stack cleanly (`grid-cols-1`).

---

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| User submits without selecting a role | Form submission is halted; error `"Please select a role"` is displayed under the selector. |
| Password and Confirm Password do not match | Form submission is halted; error `"Passwords do not match"` is displayed under Confirm Password. |
| Password is shorter than 8 characters | Error `"Password must be at least 8 characters"` is displayed. |
| Invalid email format (e.g. `user@`) | Error `"Invalid email address"` is displayed under Email input. |
| Backend returns 409 (`DUPLICATE_EMAIL`) | Error banner displayed at top of form with message from backend. Inputs remain editable. |
| Backend is offline / network failure | Error banner displayed: `"Unable to connect to the server. Please check your connection and try again."` |
| Rapid repeated clicks on Submit button | Button is immediately disabled on first click while mutation is in progress (`mutation.isPending`). |
| Whitespace in display name or email | Whitespace is trimmed before validation and submission. |

---

## 8. Out of Scope

- ❌ Automatic sign-in / session creation upon signup (the user is intentionally redirected to `/login` to sign in, per roadmap flow).
- ❌ Logistics user registration (logistics accounts are provisioned internally).
- ❌ OAuth / Social logins (Google, GitHub, etc.).
- ❌ Email verification links or OTP flows.
- ❌ Password reset / "Forgot password" flows.
- ❌ Address entry during registration (address is entered at checkout or updated in profile later).

---

## 9. Constitution Compliance

- ✅ **§4.1 Strict Backend Separation**: Frontend acts solely as a thin client calling FastAPI via `fetch`. No business logic, no direct database queries, and no Supabase JS client in frontend.
- ✅ **§4.2 Authentication**: Password hashing (argon2) and user storage are executed strictly in FastAPI. Frontend simply passes cleartext credentials over HTTPS to backend.
- ✅ **§4.3 API Communication**: Consumes `/api/v1/auth/register` with proper headers (`Content-Type: application/json`).
- ✅ **§4.4 Error Handling**: Expects and correctly parses the standard envelope `{ error: { code, message } }`.
- ✅ **§7 Naming Conventions**:
  - File names in `kebab-case` (`role-selector.tsx`, `signup/page.tsx`, `auth.ts`).
  - React components in `PascalCase` (`RoleSelector`, `SignUpPage`).
  - Functions in `camelCase` (`registerUser`, `signupSchema`).
  - TypeScript interfaces in `PascalCase` (`UserRegisterPayload`, `UserResponse`).
- ✅ **§12 Design & Accessibility**: Semantic elements (`<main>`, `<form>`, `<label>`, `<button>`), accessible ARIA attributes (`role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-invalid`), keyboard accessible.
- ✅ **§13 Git Conventions**: Conventional commits (`feat(frontend): ...`).
- ✅ **§14 Testing**: Vitest and React Testing Library tests covering rendering, interaction, validation, and submission states.

---

## 10. Open Questions

- None. All implementation requirements, role choices, validation rules, and error envelopes are well-defined.
