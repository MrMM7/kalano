# Tasks: Frontend Sign Up Page

> **Spec**: `specs/004-frontend-signup-page/spec.md`  
> **Plan**: `specs/004-frontend-signup-page/plan.md`  
> **Branch**: `feat/authentication`  
> **Spec**: 004 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

- **Depends on**: `specs/001-user-registration-endpoint/` (Status: ⬜ Pending / in progress) — Provides `POST /api/v1/auth/register`. Client tasks mock or code to this contract.
- **Depends on**: `specs/002-user-login-endpoint/` (Status: ⬜ Pending) — Target `/login` route for navigation redirect.

---

## Batch 1: Foundation & Dependencies `[PARALLEL]`

_Foundation tasks establish the types, validation schema, API client, and toast provider necessary for the UI components._

### Task 1.1 — Install Sonner & Create Toast Component `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/package.json`
  - Create: `frontend/components/ui/sonner.tsx`
- **Description**:
  1. Install `sonner` in `frontend/` using `pnpm add sonner`.
  2. Create `frontend/components/ui/sonner.tsx` exporting the configured `Toaster` component compatible with Tailwind CSS styling and dark/light themes.
- **Done when**:
  - `sonner` is listed under `dependencies` in `frontend/package.json`.
  - `frontend/components/ui/sonner.tsx` compiles without TypeScript errors.

### Task 1.2 — Mount Toaster in Root Layout `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/app/layout.tsx`
- **Description**:
  1. Import `Toaster` from `@/components/ui/sonner`.
  2. Add `<Toaster position="top-right" richColors />` inside the `<Providers>` wrapper in `RootLayout`.
- **Done when**:
  - `RootLayout` renders `<Toaster />` alongside `{children}`.
  - Page builds cleanly without errors.

### Task 1.3 — Define Auth TypeScript Types `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/types/auth.ts`
- **Description**:
  1. Define `UserRole` as `"buyer" | "merchant" | "logistics"`.
  2. Define `UserRegisterPayload` interface:
     - `email: string`
     - `password: string`
     - `display_name: string`
     - `user_role: "buyer" | "merchant"`
  3. Define `UserResponse` interface:
     - `id: string`
     - `created_at: string`
     - `email: string`
     - `display_name: string`
     - `user_role: string`
     - `address: string | null`
  4. Define `ApiError` interface:
     - `error: { code: string; message: string }`
- **Done when**:
  - `frontend/types/auth.ts` exports `UserRole`, `UserRegisterPayload`, `UserResponse`, and `ApiError`.

### Task 1.4 — Implement Zod Validation Schema `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/lib/validators/auth.ts`
- **Description**:
  1. Import `z` from `"zod"`.
  2. Implement `signupSchema`:
     - `display_name`: trimmed string, minimum 1 character (`"Display name is required"`).
     - `email`: trimmed string, valid email (`"Invalid email address"`).
     - `password`: minimum 8 characters (`"Password must be at least 8 characters"`).
     - `confirm_password`: minimum 1 character (`"Please confirm your password"`).
     - `user_role`: `z.enum(["buyer", "merchant"])` with error message `"Please select a role"`.
  3. Refine schema: `data.password === data.confirm_password` with message `"Passwords do not match"` mapped to `confirm_password`.
  4. Export `SignupFormData` inferred type (`z.infer<typeof signupSchema>`).
- **Done when**:
  - `signupSchema` correctly validates valid input and catches invalid fields and mismatched passwords.

### Task 1.5 — Implement API Client Wrapper `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/lib/api/auth.ts`
- **Description**:
  1. Read `API_BASE_URL` from `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"`.
  2. Implement `registerUser(data: UserRegisterPayload): Promise<UserResponse>`.
  3. Send `POST /api/v1/auth/register` with headers `Content-Type: application/json` and stringified `data`.
  4. If `res.ok` is false, parse response JSON into `ApiError` and throw. If JSON parsing fails, throw standard envelope with `UNKNOWN_ERROR`.
  5. Return parsed JSON on success.
- **Done when**:
  - `registerUser` function is exported and conforms to the specified types.

---

## Batch 2: Core Components & Page `[SEQUENTIAL]`

_Build the UI components and assemble the signup page once the foundation batch is complete._

### Task 2.1 — Implement Role Selector Component `[SEQUENTIAL]`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/components/role-selector.tsx`
- **Description**:
  1. Create `RoleSelectorProps` interface:
     - `selectedRole: "buyer" | "merchant" | null`
     - `onRoleSelect: (role: "buyer" | "merchant") => void`
     - `errorMessage?: string`
  2. Use `Store` and `ShoppingBag` icons from `lucide-react` for headers, and `Check` icon for benefit items.
  3. Render two interactive panels in a responsive grid (`grid grid-cols-1 sm:grid-cols-2 gap-4`):
     - Left panel: "Merchant" + benefits (List products on the marketplace, Set your own prices, Manage your inventory, Track orders).
     - Right panel: "Buyer" + benefits (Browse thousands of products, Compare seller prices, Track your orders, Easy checkout).
  4. Apply active styling when selected (`border-primary bg-primary/5 ring-2 ring-primary/20`) vs. inactive styling (`border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30`).
  5. Ensure accessibility:
     - Container has `role="radiogroup"` and `aria-label="Select account type"`.
     - Panels are buttons or focusable cards with `role="radio"`, `aria-checked={selectedRole === role}`, and keyboard event handlers (Space/Enter).
  6. Display `errorMessage` below grid if present with `text-xs text-destructive`.
- **Done when**:
  - Clicking or pressing Enter/Space on either panel triggers `onRoleSelect`.
  - Selected panel renders highlighted border and background.
  - Error message renders when prop is provided.

### Task 2.2 — Implement Sign Up Page Component `[SEQUENTIAL]`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/app/signup/page.tsx`
- **Description**:
  1. Add `"use client"` at the top of `frontend/app/signup/page.tsx`.
  2. Set up component state:
     - Form fields: `displayName`, `email`, `password`, `confirmPassword`, `selectedRole`.
     - Validation errors: `fieldErrors: Record<string, string>`.
     - API error: `apiError: string | null`.
  3. Set up `useRouter` from `next/navigation` and `useMutation` from `@tanstack/react-query`:
     - `mutationFn: registerUser`.
     - `onSuccess`: call `toast.success("Account created successfully!")` and `router.push("/login")`.
     - `onError`: extract error message from API response envelope and set `apiError`.
  4. Render centered layout:
     - Viewport container: `min-h-screen flex items-center justify-center bg-muted/40 p-4`.
     - Card container: `max-w-xl w-full mx-auto shadow-md`.
     - CardHeader: "Create an Account" title, "Choose your account type and fill in your details to get started" description.
     - CardContent:
       - API error banner (rendered if `apiError` is non-null).
       - `<RoleSelector selectedRole={selectedRole} onRoleSelect={...} errorMessage={fieldErrors.user_role} />`.
       - Form with 4 inputs: Display Name, Email, Password, Confirm Password using shadcn `<Input>` and `<label>` elements.
       - Field error messages below each input (`text-xs text-destructive`).
       - Full-width Submit `<Button>`: disabled when `registerMutation.isPending`, shows loading spinner and "Creating account..." text.
     - CardFooter: Link `"Already have an account? Log in"` pointing to `/login`.
  5. Implement `handleSubmit`:
     - Call `signupSchema.safeParse`.
     - If invalid, map issues to `fieldErrors`.
     - If valid, dispatch `registerMutation.mutate({ email, password, display_name, user_role })`.
- **Done when**:
  - `/signup` displays full card with role selector and inputs.
  - Form validates on submit and displays inline errors.
  - Submitting valid form calls API, displays toast, and pushes to `/login`.
  - Backend errors are displayed in error banner without navigating away.

---

## Batch 3: Tests `[PARALLEL]`

_Write comprehensive automated tests for all components, validators, and user flows._

### Task 3.1 — Unit & Component Tests for Role Selector `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/role-selector.test.tsx`
- **Description**:
  1. Test rendering:
     - Displays "Merchant" and "Buyer" titles and corresponding benefit bullet items.
  2. Test user interaction:
     - Clicking "Merchant" calls `onRoleSelect("merchant")`.
     - Clicking "Buyer" calls `onRoleSelect("buyer")`.
  3. Test active state styling:
     - Passing `selectedRole="merchant"` gives Merchant panel active styling and `aria-checked="true"`.
     - Passing `selectedRole="buyer"` gives Buyer panel active styling and `aria-checked="true"`.
  4. Test error display:
     - Passing `errorMessage="Please select a role"` renders the error message text.
- **Done when**:
  - All test cases in `frontend/__tests__/role-selector.test.tsx` pass under `vitest run`.

### Task 3.2 — Validator & API Client Tests `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/auth-api.test.ts`
- **Description**:
  1. Validator test cases (`signupSchema`):
     - Valid payload passes validation.
     - Empty display name fails with `"Display name is required"`.
     - Malformed email fails with `"Invalid email address"`.
     - Password < 8 characters fails with `"Password must be at least 8 characters"`.
     - Mismatched passwords fails with `"Passwords do not match"`.
     - Missing or invalid role fails with `"Please select a role"`.
  2. API client test cases (`registerUser`):
     - Mock fetch with status 201 returns resolved user object.
     - Mock fetch with status 409 and `{ error: { code: "DUPLICATE_EMAIL", message: "A user with this email address already exists." } }` throws parsed `ApiError`.
     - Mock fetch with non-JSON 500 error throws fallback `ApiError`.
- **Done when**:
  - All test cases in `frontend/__tests__/auth-api.test.ts` pass under `vitest run`.

### Task 3.3 — Sign Up Page Integration Tests `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/signup.test.tsx`
- **Description**:
  1. Set up mocks for `next/navigation` (`useRouter`), `sonner` (`toast.success`), and `@/lib/api/auth` (`registerUser`).
  2. Wrap render in `QueryClientProvider`.
  3. Test cases:
     - `test_signup_form_renders`: renders title, role selector, 4 inputs, submit button, and login link.
     - `test_role_selector_interaction`: clicking Buyer highlights the buyer panel.
     - `test_validation_errors_displayed`: submitting empty form shows errors for all fields and does not invoke `registerUser`.
     - `test_password_mismatch`: shows `"Passwords do not match"` when confirm password differs.
     - `test_successful_submission`: filling valid data and clicking submit calls `registerUser`, shows success toast, and redirects to `/login`.
     - `test_api_error_display`: when `registerUser` rejects with an `ApiError`, renders the error message inline banner.
- **Done when**:
  - All integration test cases pass under `vitest run`.

---

## Batch 4: Verification & Polish `[SEQUENTIAL]`

### Task 4.1 — Lint & Format Verification

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - All created and modified files in `frontend/`
- **Description**:
  - Run linting and formatting scripts:
    - `pnpm --filter frontend lint`
    - `pnpm --filter frontend format`
- **Done when**:
  - Zero lint warnings or errors.
  - Prettier formatting applied cleanly.

### Task 4.2 — Full Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - `frontend/`
- **Description**:
  - Run the entire frontend test suite:
    - `pnpm --filter frontend test`
- **Done when**:
  - All frontend tests (including `home.test.tsx`, `role-selector.test.tsx`, `auth-api.test.ts`, and `signup.test.tsx`) pass with 100% exit code 0.

### Task 4.3 — Manual Verification & Accessibility Smoke Test

- **Type**: `[SEQUENTIAL]`
- **Description**:
  1. Start the frontend dev server under an explicit timeout constraint (run as a background task with a maximum 30–60s timeout, or terminate immediately after verification via `manage_task kill` to prevent the agent from waiting indefinitely): `pnpm --filter frontend dev`.
  2. Navigate to `http://localhost:3000/signup`.
  3. Verify keyboard accessibility: Tab order, role selection using keyboard, input focus rings.
  4. Verify responsive layout on mobile (<640px) and desktop (>=640px).
  5. Verify toast appears on mock or real API success and redirects to `/login`.
  6. Immediately terminate the frontend server process using `manage_task kill` to bring the agent back to working.
- **Done when**:
  - Page conforms visually and behaviorally to the specification, and the dev server process is completely terminated.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1: Foundation & Dependencies | 5 | Yes | 3–5 |
| 2: Core Components & Page | 2 | No | 1 |
| 3: Tests | 3 | Yes | 3 |
| 4: Verification & Polish | 3 | No | 1 |
| **Total** | **13** | | |

---

## Git Commit Plan

_Suggested commits following Conventional Commits (§13 of constitution):_

1. `chore(frontend): install sonner and add Toaster to root layout`
2. `feat(frontend): add auth types and zod signup validation schema`
3. `feat(frontend): add auth API client for user registration`
4. `feat(frontend): create RoleSelector component with merchant and buyer panels`
5. `feat(frontend): implement /signup page with role selector and validation`
6. `test(frontend): add tests for role selector, auth api client, and signup page`
