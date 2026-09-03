# Spec: Frontend Login Page

> **Roadmap Reference**: Phase 2, Step 2.5 — Frontend auth pages (Log In)  
> **Branch**: `feat/authentication`  
> **Spec**: 005 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## 1. Overview

This specification defines the frontend Log In page (`/login`) for the Kalano multi-vendor e-commerce platform. It provides the user interface for registered users (both Buyers and Merchants) to authenticate with their credentials (email and password).

Per the Kalano Constitution (§4.1, §4.2):
- The frontend operates as a thin client: authentication logic, password verification, and JWT issuance are handled exclusively by FastAPI on the backend.
- Supabase Auth is not used; authentication targets the custom FastAPI endpoint `POST /api/v1/auth/login`.
- JWT session tokens are issued by the backend and transported via an `httpOnly` cookie (`kalano_token`). The frontend must configure requests with `credentials: "include"` so the browser accepts and stores the cookie from the backend `Set-Cookie` header.
- The `/login` page performs client-side validation using Zod before submitting credentials.
- On successful authentication, the user is redirected to the home page (`/`).
- On authentication failure, errors returned in the standard platform error envelope (`{"error": {"code": "...", "message": "..."}}`) are displayed inline to the user.
- The visual presentation follows the centered card layout established by the registration page (`/signup`), maintaining design harmony across the authentication flow.

---

## 2. Dependencies

### Prior Specs in this Phase

- **Depends on `specs/002-user-login-endpoint/`**: The backend login endpoint (`POST /api/v1/auth/login`) must exist, verify argon2 password hashes, issue the `kalano_token` httpOnly cookie, and return `LoginResponse`.
- **Depends on `specs/004-frontend-signup-page/`**: Reuses shared TypeScript types in `frontend/types/auth.ts` (`UserResponse`, `ApiError`), API client conventions in `frontend/lib/api/auth.ts` (`API_BASE_URL`), the validator module in `frontend/lib/validators/auth.ts`, installed shadcn/ui components (`Button`, `Card`, `Input`, `Label`), and Sonner toast configuration.

### Codebase Assets

- `frontend/types/auth.ts`: Shared authentication types and interfaces.
- `frontend/lib/api/auth.ts`: Fetch wrapper functions for authentication endpoints.
- `frontend/lib/validators/auth.ts`: Zod validation schemas for authentication forms.
- `frontend/components/ui/card.tsx`: shadcn/ui card primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
- `frontend/components/ui/button.tsx`: shadcn/ui button primitive.
- `frontend/components/ui/input.tsx`: shadcn/ui input primitive.

---

## 3. Functional Requirements

### 3.1 — Layout & Visual Structure

- The `/login` page must present a centered card layout identical in container width, padding, border styling, and typography to the `/signup` page.
- Container: Flexbox centering (`min-h-screen flex items-center justify-center p-4 bg-background`).
- Card width: `w-full max-w-md` to ensure optimal readability on desktop, tablet, and mobile viewports.
- Header section:
  - Title: "Welcome back" or "Sign in to Kalano" (rendered as an `<h1>` inside `CardTitle`).
  - Description: "Enter your email and password to access your account" (rendered inside `CardDescription`).
- Footer section:
  - Text prompt: "Don't have an account? " with an inline link to `/signup` ("Sign up").

### 3.2 — Form Fields

The form must contain exactly two credential inputs inside a semantic `<form>` element:

1. **Email Field**:
   - Label: `Email` (associated via `htmlFor`/`id="email"`).
   - Type: `email`.
   - Placeholder: `you@example.com`.
   - Autocomplete: `email`.
   - Required: Yes.
   - Validation message container: Displays inline error text below the input when validation fails.
2. **Password Field**:
   - Label: `Password` (associated via `htmlFor`/`id="password"`).
   - Type: `password`.
   - Placeholder: `••••••••`.
   - Autocomplete: `current-password`.
   - Required: Yes.
   - Validation message container: Displays inline error text below the input when validation fails.
3. **Submit Button**:
   - Text when idle: "Sign In".
   - Text when loading/submitting: "Signing in..." (accompanied by an accessible loading indicator / spinner icon).
   - Type: `submit`.
   - Disabled state: Disabled during submission (`isPending` is true) to prevent duplicate requests.

### 3.3 — Client-Side Zod Validation

Form inputs must be validated against `loginSchema` before making any network request:

- **`email`**:
  - Must not be empty.
  - Must be a valid email format (`z.string().email("Invalid email address")`).
  - Whitespace should be trimmed (`z.string().trim()`).
- **`password`**:
  - Must not be empty (`z.string().min(1, "Password is required")`).
- **Validation Timing**:
  - Errors must appear immediately when the user attempts to submit an invalid form.
  - Individual field errors clear or update when the user corrects the respective input.

### 3.4 — Submission & API Communication

- Form submission triggers `loginUser({ email, password })`.
- The network call is executed via TanStack Query's `useMutation` hook.
- HTTP Request specifications:
  - Method: `POST`
  - URL: `${API_BASE_URL}/api/v1/auth/login`
  - Headers: `{"Content-Type": "application/json"}`
  - Credentials: `credentials: "include"` (**CRITICAL**: mandatory for the browser to receive and set the httpOnly cookie from the backend `Set-Cookie` header).
  - Body: JSON serialized `{ email, password }`.

### 3.5 — Success & Redirection

- On HTTP 200 response:
  - The backend issues the `Set-Cookie` header with the httpOnly `kalano_token` cookie.
  - The browser stores the cookie automatically.
  - The component triggers client-side navigation to the home page (`/`) via `router.push("/")`.

### 3.6 — Error Handling & Feedback

- When `POST /api/v1/auth/login` fails:
  - The API returns an error envelope: `{"error": {"code": "...", "message": "..."}}`.
  - For HTTP 401 (e.g. code `INVALID_CREDENTIALS`): The error message (e.g. "Invalid email or password") is rendered prominently in an inline alert/banner directly above the submit button or form fields.
  - For HTTP 422 (validation errors): Displays the backend validation error message.
  - For network failures or HTTP 500: Displays a generic, user-friendly error message ("Unable to connect to the server. Please check your connection and try again.").
  - The inline error alert must have an accessible `role="alert"` attribute.
  - The error alert clears automatically if the user edits either form field or resubmits.

### 3.7 — Navigation & Auxiliary Links

- Card footer includes a link: "Don't have an account? Sign up".
- Built with Next.js `<Link href="/signup">` for fast client-side transition without full page reloads.

---

## 4. Acceptance Criteria

- [ ] **AC1 — Form Rendering**: Navigating to `/login` renders a centered card containing title, description, email input, password input, "Sign In" submit button, and a link to `/signup`.
- [ ] **AC2 — Empty Form Validation**: Submitting an empty form does not trigger an API request; it displays "Invalid email address" under the email input and "Password is required" under the password input.
- [ ] **AC3 — Email Format Validation**: Entering an invalid email format (e.g., `notanemail`) and submitting displays "Invalid email address" inline.
- [ ] **AC4 — Loading State**: While the authentication request is in-flight, the submit button is disabled, displays "Signing in...", and form inputs are disabled to prevent double submission.
- [ ] **AC5 — Cookie Acceptance**: The API request is dispatched with `credentials: "include"`, ensuring the browser processes the backend's `Set-Cookie: kalano_token=...` directive.
- [ ] **AC6 — Successful Login Redirection**: Upon receiving HTTP 200 with valid credentials, the client redirects to `/`.
- [ ] **AC7 — Invalid Credentials Error**: When the backend returns HTTP 401 with `{"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}}`, the message "Invalid email or password" is displayed inline within an alert box with `role="alert"`.
- [ ] **AC8 — Network / Server Error**: When the backend is unreachable or returns HTTP 500, a clear fallback error message is shown inline without crashing the UI.
- [ ] **AC9 — Signup Navigation**: Clicking "Sign up" navigates the user to `/signup`.
- [ ] **AC10 — Semantic HTML & Accessibility**: Form controls use `<label>` with matching `htmlFor`, `<input>` with correct `type` and autocomplete attributes, accessible errors using `aria-invalid` and `role="alert"`, and full keyboard navigation (Tab and Enter key submission).

---

## 5. API Contract

### `POST /api/v1/auth/login`

**Summary**: Authenticate user and issue session cookie  
**Description**: Verifies the user's email and password against stored argon2 hash. On success, returns the user profile and access token, while issuing the `kalano_token` JWT cookie via `Set-Cookie`.  
**Tags**: `["Auth"]`  

#### Request Body (`application/json`)

```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `email` | string | Yes | Valid email format | The user's account email |
| `password` | string | Yes | Min length 1 | The user's plaintext password |

#### Success Response (`200 OK`)

**Headers**:
```http
Set-Cookie: kalano_token=<jwt-token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400
```

**Body**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "e4b01e3e-7a42-4f1b-8c29-33b6d080b091",
    "created_at": "2026-09-03T12:00:00Z",
    "email": "jane@example.com",
    "display_name": "Jane Doe",
    "user_role": "buyer",
    "address": null
  }
}
```

#### Error Responses

| Status | Code | Message | Description |
|---|---|---|---|
| 401 Unauthorized | `INVALID_CREDENTIALS` | "Invalid email or password" | Email not found or argon2 password mismatch |
| 422 Unprocessable Entity | `VALIDATION_ERROR` | "Validation error" | Malformed request body or missing fields |
| 500 Internal Server Error | `INTERNAL_SERVER_ERROR` | "An unexpected error occurred" | Unexpected database or server error |

---

## 6. UI/UX Requirements

- **Route**: `/login`
- **Layout**: Centered card (`max-w-md w-full`) vertically and horizontally centered in viewport.
- **Card Hierarchy**:
  - `CardHeader`:
    - `CardTitle`: "Sign in to Kalano"
    - `CardDescription`: "Enter your email and password to access your account"
  - `CardContent`:
    - Inline Alert container (rendered conditionally when API error occurs, red border/background with alert icon)
    - Form groups:
      - Email: Label, Input (`type="email"`), Error text (red-500, text-sm)
      - Password: Label, Input (`type="password"`), Error text (red-500, text-sm)
  - `CardFooter`:
    - Submit Button (`w-full`, variant `default`)
    - Sub-footer text: "Don't have an account? [Sign up](/signup)" with hover underline
- **Interactive States**:
  - *Default*: Inputs empty, button enabled, no error messages.
  - *Validation Error*: Red border around invalid inputs, error text below each field.
  - *Submitting*: Button disabled, text changes to "Signing in...", input fields disabled.
  - *API Error*: Inline alert displayed above the form or submit button with the exact message from the backend.
  - *Success*: Immediate transition to `/`.
- **Keyboard Navigation**:
  - Tab order: Email → Password → Sign In Button → Sign Up Link.
  - Pressing Enter inside either input submits the form.

---

## 7. Edge Cases & Error Handling

| Scenario | Trigger | Expected Behavior |
|---|---|---|
| Empty submission | User clicks "Sign In" with blank fields | Form submission prevented; inline Zod errors ("Invalid email address", "Password is required") displayed under inputs. No network call. |
| Malformed email | User types `user@` or `invalid` | Form submission prevented; inline error "Invalid email address" displayed. |
| Invalid credentials | Backend returns 401 with `INVALID_CREDENTIALS` | Inline error banner displayed: "Invalid email or password". Inputs remain populated so the user can retype their password. |
| User not found | Email does not exist in DB | Backend returns generic 401 `INVALID_CREDENTIALS` (to prevent user enumeration); UI displays "Invalid email or password". |
| Backend unreachable | Network down or backend offline | Network request rejects; UI displays "Unable to connect to the server. Please try again." |
| Double submission | User rapidly clicks submit button | Button disabled immediately on first click (`isPending=true`), preventing duplicate network requests. |
| Whitespace in email | User enters leading/trailing spaces | Email is trimmed client-side prior to validation and API dispatch. |
| Cookie blocked in browser | Third-party / strict cookie blocking | Browser still accepts first-party httpOnly cookie under same domain / proxy configuration. |

---

## 8. Out of Scope

- ❌ "Forgot Password" / Password reset email flow (deferred to future roadmap step).
- ❌ Third-party OAuth / Social Logins (Google, GitHub, etc.).
- ❌ Persistent "Remember Me" checkbox (token lifetime governed by backend JWT expiration).
- ❌ Next.js route protection and redirect query parameters e.g. `/login?next=/checkout` (handled in Spec 006: `specs/006-auth-context-and-middleware/`).
- ❌ Multi-factor authentication (MFA).

---

## 9. Constitution Compliance

- ✅ **§4.1 Strict Backend Separation**: The frontend contains zero authentication logic or direct database queries; it purely consumes `POST /api/v1/auth/login`.
- ✅ **§4.1 No Supabase JS Client**: Uses native `fetch` via `frontend/lib/api/auth.ts`; no `@supabase/supabase-js` imports.
- ✅ **§4.2 Authentication & Cookies**: Authentication uses custom argon2-verified credentials. Session JWT is transported via httpOnly cookie using `credentials: "include"`.
- ✅ **§4.3 API Standards**: Communicates with endpoint prefixed with `/api/v1/auth/login`.
- ✅ **§4.4 Error Handling**: Consumes and renders the standard error envelope `{ "error": { "code": "...", "message": "..." } }`.
- ✅ **§7 Naming Conventions**: Files use `kebab-case` (`auth.ts`), components use `PascalCase` (`LoginPage`), functions use `camelCase` (`loginUser`), types use `PascalCase` (`UserLoginPayload`, `LoginResponse`).
- ✅ **§12 Design & Accessibility**: Responsive desktop-to-mobile card layout; semantic `<main>`, `<form>`, `<label>`, `<input>`, `<button>`; accessible attributes (`aria-invalid`, `role="alert"`).
- ✅ **§14 Testing**: Vitest test suite covering component rendering, client validation, successful submission, and error display.

---

## 10. Open Questions

- None. All requirements, layouts, validation rules, and API specifications are aligned with the constitution and previous phase specifications.
