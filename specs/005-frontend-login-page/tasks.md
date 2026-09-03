# Tasks: Frontend Login Page

> **Spec**: `specs/005-frontend-login-page/spec.md`  
> **Plan**: `specs/005-frontend-login-page/plan.md`  
> **Branch**: `feat/authentication`  
> **Spec**: 005 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

- **`specs/002-user-login-endpoint/`**: Backend `POST /api/v1/auth/login` endpoint must be functional, accepting email and password, setting the `kalano_token` httpOnly cookie, and returning `LoginResponse`.
- **`specs/004-frontend-signup-page/`**: Shared types (`UserResponse`, `ApiError`), validation module, and API client scaffolding must be in place.

---

## Batch 1: Types & Validation Foundation `[SEQUENTIAL]`

### Task 1.1 — Add Login Types to `frontend/types/auth.ts`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/types/auth.ts`
- **Description**:
  1. Open `frontend/types/auth.ts`.
  2. Export the `UserLoginPayload` interface:
     ```typescript
     export interface UserLoginPayload {
       email: string;
       password: string;
     }
     ```
  3. Export the `LoginResponse` interface:
     ```typescript
     export interface LoginResponse {
       access_token: string;
       token_type: string;
       user: UserResponse;
     }
     ```
- **Done when**: `UserLoginPayload` and `LoginResponse` are exported with proper TypeScript typings and compile without type errors.

---

### Task 1.2 — Add Login Zod Schema to `frontend/lib/validators/auth.ts`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/lib/validators/auth.ts`
- **Description**:
  1. Open `frontend/lib/validators/auth.ts`.
  2. Define and export `loginSchema`:
     ```typescript
     export const loginSchema = z.object({
       email: z
         .string()
         .trim()
         .min(1, "Email is required")
         .email("Invalid email address"),
       password: z
         .string()
         .min(1, "Password is required"),
     });
     ```
  3. Export the inferred type:
     ```typescript
     export type LoginFormData = z.infer<typeof loginSchema>;
     ```
- **Done when**: `loginSchema` correctly parses valid `{ email, password }` objects and fails on empty strings or malformed emails with expected error messages.

---

## Batch 2: API Client Implementation `[SEQUENTIAL]`

### Task 2.1 — Implement `loginUser` in `frontend/lib/api/auth.ts`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/lib/api/auth.ts`
- **Description**:
  1. Import `UserLoginPayload` and `LoginResponse` from `@/types/auth`.
  2. Implement `loginUser(data: UserLoginPayload): Promise<LoginResponse>`:
     - Dispatches a `fetch` request to `${API_BASE_URL}/api/v1/auth/login`.
     - Sets HTTP method to `POST`.
     - Sets `headers: { "Content-Type": "application/json" }`.
     - **CRITICAL**: Sets `credentials: "include"` so the browser accepts and persists the `kalano_token` httpOnly cookie set by the FastAPI backend.
     - Serializes `data` into JSON body.
     - If response is not ok (`!res.ok`), parses and throws the JSON error envelope (`ApiError`).
     - If response is ok, returns parsed `LoginResponse`.
- **Done when**: `loginUser` is exported, correctly typed, includes `credentials: "include"`, and handles error responses appropriately.

---

## Batch 3: Login Page Component `[SEQUENTIAL]`

### Task 3.1 — Create `/login` Page Component in `frontend/app/login/page.tsx`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/app/login/page.tsx`
- **Description**:
  1. Add `"use client"` directive at top.
  2. Import UI primitives: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` from `@/components/ui/card`, `Input` from `@/components/ui/input`, `Button` from `@/components/ui/button`.
  3. Import `useRouter` from `next/navigation` and `Link` from `next/link`.
  4. Import `useMutation` from `@tanstack/react-query` and `loginUser` from `@/lib/api/auth`.
  5. Import `loginSchema` from `@/lib/validators/auth`.
  6. Manage component state:
     - `formData`: `{ email: "", password: "" }`
     - `validationErrors`: `Record<string, string>`
     - `apiError`: `string | null`
  7. Form submit handler:
     - Prevents default form submission.
     - Clears previous `apiError` and `validationErrors`.
     - Runs `loginSchema.safeParse(formData)`.
     - If validation fails, sets `validationErrors` and halts execution.
     - If valid, triggers `mutation.mutate(formData)`.
  8. Mutation callbacks:
     - `onSuccess`: Calls `router.push("/")`.
     - `onError`: Extracts error message from API error envelope (`err?.error?.message ?? "Invalid email or password"`) and updates `apiError`.
  9. Render layout:
     - Outer container: `min-h-screen flex items-center justify-center p-4 bg-background`.
     - Card container: `w-full max-w-md shadow-md`.
     - Title: "Sign in to Kalano".
     - Subtitle: "Enter your email and password to access your account".
     - Conditionally rendered inline error alert banner with `role="alert"` if `apiError` is non-null.
     - Form fields: Email input and Password input with labels and inline validation error messages.
     - Submit button: Displays "Sign In" when idle, "Signing in..." with spinner when `isPending` is true.
     - Footer link: "Don't have an account? Sign up" linking to `/signup`.
- **Done when**: Navigating to `/login` displays the form, validates inputs, sends API mutation, displays inline errors on failure, and redirects to `/` on success.

---

## Batch 4: Automated Testing `[SEQUENTIAL]`

### Task 4.1 — Implement Vitest Tests in `frontend/__tests__/login.test.tsx`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/__tests__/login.test.tsx`
- **Description**:
  1. Set up test environment with `@testing-library/react` and `@testing-library/jest-dom/vitest`.
  2. Mock `next/navigation` (`useRouter` returning mock `push` method).
  3. Mock `@/lib/api/auth` (`loginUser`).
  4. Create a test helper wrapper providing a fresh `QueryClient` and `QueryClientProvider`.
  5. Implement test cases:
     - `test_login_form_renders`: Renders email input, password input, submit button, and signup link.
     - `test_validation_errors`: Submitting an empty form displays validation errors without calling `loginUser`.
     - `test_invalid_email_validation`: Entering an invalid email displays "Invalid email address".
     - `test_login_link_to_signup`: The "Sign up" link points to `/signup`.
     - `test_successful_submission`: Entering valid credentials calls `loginUser`, displays pending state, and redirects to `/` via `router.push`.
     - `test_api_error_display`: When `loginUser` rejects with an API error envelope, the inline error alert renders the API error message.
- **Done when**: All Vitest test cases pass cleanly when executing `pnpm test`.

---

## Batch 5: Verification & Quality Assurance `[SEQUENTIAL]`

### Task 5.1 — Code Linting & Formatting

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Run frontend linter: `pnpm --filter frontend lint` (or root `pnpm lint`).
  - Run code formatter: `pnpm --filter frontend format` (or root `pnpm format`).
- **Done when**: Zero ESLint warnings or errors, and all files formatted to Prettier standards.

---

### Task 5.2 — Execute Frontend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Execute Vitest across all test files: `pnpm test`.
- **Done when**: 100% of test suites pass, including `home.test.tsx` and `login.test.tsx`.

---

### Task 5.3 — End-to-End Manual Verification

- **Type**: `[SEQUENTIAL]`
- **Description**:
  1. Start FastAPI backend under an explicit timeout constraint (run as a background task with a max 30–60s timeout, or terminate immediately after verification via `manage_task kill`): `uv run uvicorn app.main:app --port 8000`.
  2. Start frontend under an explicit timeout constraint (run as a background task with a max 30–60s timeout, or terminate immediately after verification via `manage_task kill`): `pnpm dev`.
  3. Open `http://localhost:3000/login` in browser.
  4. Test client validation by clicking "Sign In" with empty fields (verify inline errors).
  5. Test invalid credentials (verify inline error alert displays "Invalid email or password").
  6. Test valid credentials (verify redirection to `/` and verify `kalano_token` cookie is present in browser Application tab).
  7. Verify "Sign up" link navigates to `/signup`.
  8. Immediately terminate both backend and frontend server processes using `manage_task kill` so the agent is brought back to working without waiting indefinitely.
- **Done when**: All scenarios execute smoothly without console errors or layout glitches, and all server processes are completely terminated.

---

## Execution Summary

| Batch | Tasks | Description | Parallelizable | Estimated Subagents |
|---|---|---|---|---|
| 1 | 1.1, 1.2 | Types & Zod validation schema | No (sequential file edits) | 1 |
| 2 | 2.1 | API client implementation with `credentials: "include"` | No | 1 |
| 3 | 3.1 | Login page UI component (`frontend/app/login/page.tsx`) | No | 1 |
| 4 | 4.1 | Vitest test suite (`frontend/__tests__/login.test.tsx`) | No | 1 |
| 5 | 5.1, 5.2, 5.3 | Linting, full test suite, manual verification | No | 1 |
| **Total** | **7** | | | |

---

## Git Commit Plan

1. `feat(frontend): add login types and validation schema`
   - Files: `frontend/types/auth.ts`, `frontend/lib/validators/auth.ts`
2. `feat(frontend): add loginUser API client function`
   - Files: `frontend/lib/api/auth.ts`
3. `feat(frontend): implement login page at /login`
   - Files: `frontend/app/login/page.tsx`
4. `test(frontend): add Vitest unit and integration tests for login page`
   - Files: `frontend/__tests__/login.test.tsx`
