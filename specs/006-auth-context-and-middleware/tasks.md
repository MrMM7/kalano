# Tasks: Auth Context & Middleware

> **Spec**: `specs/006-auth-context-and-middleware/spec.md`  
> **Plan**: `specs/006-auth-context-and-middleware/plan.md`  
> **Branch**: `feat/authentication`  
> **Spec**: 006 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## Legend

- `[SEQUENTIAL]` — Must be completed in order as subsequent tasks depend on its output.
- `[PARALLEL]` — Independent task that can be executed concurrently with other tasks in the same batch.
- `[SUBAGENT]` — Suitable for delegation to an independent subagent.

---

## Prior Spec Dependencies

- **`specs/001-user-registration-endpoint/`**: Provides user models and standard error envelopes in `backend/app/models/auth.py`.
- **`specs/002-user-login-endpoint/`**: Sets `kalano_token` cookie on login.
- **`specs/003-auth-dependency-and-current-user/`**: Implements `GET /api/v1/auth/me` endpoint in `backend/app/routers/auth.py`.
- **`specs/004-frontend-signup-page/`**: Provides base frontend auth types in `frontend/types/auth.ts`.
- **`specs/005-frontend-login-page/`**: Provides base API client in `frontend/lib/api/auth.ts` and `/login` page in `frontend/app/login/page.tsx`.

---

## Batch 1: Backend Logout Endpoint & Tests `[SEQUENTIAL]`

### Task 1.1 — Add `LogoutResponse` to `backend/app/models/auth.py`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/models/auth.py`
- **Description**:
  1. Open `backend/app/models/auth.py`.
  2. Import `BaseModel` and `Field` from `pydantic`.
  3. Define `LogoutResponse(BaseModel)` with field `message: str = Field(default="Logged out successfully", description="Confirmation message that the user was logged out", examples=["Logged out successfully"])`.
- **Done when**:
  - `LogoutResponse` is defined and exportable from `backend/app/models/auth.py`.

### Task 1.2 — Implement `POST /api/v1/auth/logout` in `backend/app/routers/auth.py`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/routers/auth.py`
- **Description**:
  1. Open `backend/app/routers/auth.py`.
  2. Import `Response` and `status` from `fastapi`.
  3. Import `LogoutResponse` from `app.models.auth`.
  4. Implement route handler:
     ```python
     @router.post(
         "/logout",  # Or "/auth/logout" depending on router prefix
         response_model=LogoutResponse,
         status_code=status.HTTP_200_OK,
         summary="Log out the current user",
         description="Clears the httpOnly authentication cookie, effectively logging the user out.",
         tags=["Auth"],
     )
     async def logout(response: Response) -> LogoutResponse:
         response.delete_cookie(
             key="kalano_token",
             httponly=True,
             samesite="lax",
             path="/",
         )
         return LogoutResponse(message="Logged out successfully")
     ```
- **Done when**:
  - `POST /api/v1/auth/logout` is registered on the FastAPI app.
  - Endpoint returns HTTP 200 with `LogoutResponse` and includes a `Set-Cookie` header deleting `kalano_token`.

### Task 1.3 — Create Backend Logout Tests in `backend/tests/test_auth_logout.py`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_auth_logout.py`
- **Description**:
  1. Create `backend/tests/test_auth_logout.py`.
  2. Implement tests using `pytest` and `httpx.AsyncClient` or FastAPI `TestClient`:
     - `test_logout_clears_cookie`: Send `POST /api/v1/auth/logout` with cookies `{"kalano_token": "dummy_token"}`. Assert status 200, response JSON `{"message": "Logged out successfully"}`, and header `set-cookie` deletes `kalano_token` (`Expires=Thu, 01 Jan 1970` or `Max-Age=0`).
     - `test_logout_when_not_logged_in`: Send `POST /api/v1/auth/logout` without cookies. Assert status 200, confirmation message, and deletion cookie header.
- **Done when**:
  - Running `pytest backend/tests/test_auth_logout.py` executes cleanly with 100% pass rate.

---

## Batch 2: Frontend Types & API Client `[PARALLEL]`

### Task 2.1 — Add `AuthContextValue` and `LogoutResponse` in `frontend/types/auth.ts` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/types/auth.ts`
- **Description**:
  1. Open `frontend/types/auth.ts`.
  2. Export interface `LogoutResponse`:
     ```typescript
     export interface LogoutResponse {
       message: string;
     }
     ```
  3. Export interface `AuthContextValue`:
     ```typescript
     export interface AuthContextValue {
       user: UserResponse | null;
       isLoading: boolean;
       isAuthenticated: boolean;
       logout: () => Promise<void>;
       refreshUser: () => Promise<void>;
     }
     ```
- **Done when**:
  - `LogoutResponse` and `AuthContextValue` are exported from `frontend/types/auth.ts`.
  - Type-checking (`tsc --noEmit` or `pnpm build`) passes without errors.

### Task 2.2 — Add `fetchCurrentUser` and `logoutUser` in `frontend/lib/api/auth.ts` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/lib/api/auth.ts`
- **Description**:
  1. Open `frontend/lib/api/auth.ts`.
  2. Import `UserResponse` and `LogoutResponse` from `@/types/auth`.
  3. Implement `fetchCurrentUser(): Promise<UserResponse>`:
     - `fetch(`${API_BASE_URL}/api/v1/auth/me`, { method: "GET", credentials: "include" })`.
     - Check `if (!res.ok) throw new Error("Not authenticated")`.
     - Return `await res.json()`.
  4. Implement `logoutUser(): Promise<LogoutResponse>`:
     - `fetch(`${API_BASE_URL}/api/v1/auth/logout`, { method: "POST", credentials: "include" })`.
     - Return `res.ok ? await res.json() : { message: "Logged out" }`.
- **Done when**:
  - `fetchCurrentUser` and `logoutUser` are exported from `frontend/lib/api/auth.ts`.
  - Both functions explicitly include `credentials: "include"`.

---

## Batch 3: Frontend Auth Context, Hook & Provider Wiring `[SEQUENTIAL]`

### Task 3.1 — Implement `frontend/lib/auth-context.tsx`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/lib/auth-context.tsx`
- **Description**:
  1. Add `"use client"` directive at top of file.
  2. Import React hooks (`createContext`, `useCallback`, `useEffect`, `useState`, `type ReactNode`).
  3. Import `useRouter` from `next/navigation`.
  4. Import `UserResponse`, `AuthContextValue` from `@/types/auth`.
  5. Import `fetchCurrentUser`, `logoutUser` from `@/lib/api/auth`.
  6. Create `AuthContext = createContext<AuthContextValue | undefined>(undefined)`.
  7. Implement `AuthProvider`:
     - Maintain `[user, setUser] = useState<UserResponse | null>(null)`.
     - Maintain `[isLoading, setIsLoading] = useState<boolean>(true)`.
     - Define `refreshUser` with `useCallback`: sets `isLoading=true`, calls `fetchCurrentUser()`, updates `user`, catches and sets `user=null`, finally sets `isLoading=false`.
     - Define `useEffect(() => { refreshUser(); }, [refreshUser])`.
     - Define `logout` with `useCallback`: calls `await logoutUser()`, sets `user=null`, calls `router.push("/")`.
     - Return `<AuthContext.Provider value={{ user, isLoading, isAuthenticated: Boolean(user), logout, refreshUser }}>{children}</AuthContext.Provider>`.
  8. Export `{ AuthContext, AuthProvider }`.
- **Done when**:
  - `frontend/lib/auth-context.tsx` is created, compiles, and properly manages user hydration and logout.

### Task 3.2 — Implement `frontend/lib/hooks/use-auth.ts`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `frontend/lib/hooks/use-auth.ts`
- **Description**:
  1. Import `useContext` from `react`.
  2. Import `AuthContext` from `@/lib/auth-context`.
  3. Import `type AuthContextValue` from `@/types/auth`.
  4. Implement `useAuth(): AuthContextValue`:
     - Check `const context = useContext(AuthContext)`.
     - If `!context`, throw `new Error("useAuth must be used within an AuthProvider")`.
     - Return `context`.
  5. Export `useAuth`.
- **Done when**:
  - `useAuth` hook is created and throws when called outside `AuthProvider`.

### Task 3.3 — Update `frontend/lib/providers.tsx` to wrap with `AuthProvider`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `frontend/lib/providers.tsx`
- **Description**:
  1. Open `frontend/lib/providers.tsx`.
  2. Import `AuthProvider` from `./auth-context`.
  3. Nest `<AuthProvider>` inside `<QueryClientProvider>`:
     ```tsx
     export function Providers({ children }: { children: ReactNode }) {
       const [queryClient] = useState(() => makeQueryClient());
       return (
         <QueryClientProvider client={queryClient}>
           <AuthProvider>{children}</AuthProvider>
         </QueryClientProvider>
       );
     }
     ```
- **Done when**:
  - All children in the Next.js component tree receive both React Query and AuthContext.

---

## Batch 4: Next.js Middleware & Login Page Integration `[PARALLEL]`

### Task 4.1 — Implement `frontend/middleware.ts` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/middleware.ts`
- **Description**:
  1. Create `frontend/middleware.ts` at the root of `frontend/`.
  2. Import `NextResponse` and `type NextRequest` from `next/server`.
  3. Define `PROTECTED_ROUTES = ["/cart", "/checkout", "/orders", "/dashboard", "/logistics"]`.
  4. Implement `middleware(request: NextRequest)`:
     - Check if `request.nextUrl.pathname` matches any protected route or starts with `${route}/`.
     - If protected:
       - Inspect `token = request.cookies.get("kalano_token")`.
       - If `!token || !token.value`:
         - Construct `loginUrl = new URL("/login", request.url)`.
         - Set `redirect` search param to `${request.nextUrl.pathname}${request.nextUrl.search}`.
         - Return `NextResponse.redirect(loginUrl)`.
     - Return `NextResponse.next()`.
  5. Export `config = { matcher: ["/cart/:path*", "/checkout/:path*", "/orders/:path*", "/dashboard/:path*", "/logistics/:path*"] }`.
- **Done when**:
  - Requests to protected routes without `kalano_token` cookie are redirected to `/login?redirect=...`.
  - Requests with cookie or to public routes pass through.

### Task 4.2 — Update `frontend/app/login/page.tsx` with Context Hydration `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/app/login/page.tsx`
- **Description**:
  1. Open `frontend/app/login/page.tsx`.
  2. Import `useAuth` from `@/lib/hooks/use-auth`.
  3. Import `useSearchParams` from `next/navigation`.
  4. Extract `refreshUser` from `useAuth()`.
  5. In form submission handler, after successful call to `loginUser`:
     - Execute `await refreshUser()`.
     - Read `redirectParam = searchParams.get("redirect")`.
     - Sanitize redirect: ensure it begins with a single `/` and not `//` (prevent open redirect vulnerabilities).
     - Navigate to `redirectParam` or fallback to `/`.
- **Done when**:
  - Successful login immediately hydrates `AuthContext` and redirects to the intended destination.

---

## Batch 5: Frontend Unit Tests `[PARALLEL]`

### Task 5.1 — Unit Tests for `AuthContext` and `useAuth` in `frontend/__tests__/auth-context.test.tsx` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/auth-context.test.tsx`
- **Description**:
  1. Create `frontend/__tests__/auth-context.test.tsx`.
  2. Setup Vitest with `@testing-library/react` and mock `next/navigation` (`useRouter`).
  3. Mock `fetchCurrentUser` and `logoutUser` from `@/lib/api/auth`.
  4. Implement test cases:
     - `throws error when useAuth is called outside AuthProvider`.
     - `hydrates user profile on mount when fetchCurrentUser succeeds`.
     - `sets user to null and isLoading to false when fetchCurrentUser fails (401)`.
     - `logoutUser resets user state and redirects to '/'`.
     - `refreshUser manually re-fetches user profile`.
- **Done when**:
  - Running `pnpm test auth-context` passes all tests with 0 failures.

### Task 5.2 — Unit Tests for Middleware in `frontend/__tests__/middleware.test.ts` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/middleware.test.ts`
- **Description**:
  1. Create `frontend/__tests__/middleware.test.ts`.
  2. Import `middleware` from `../middleware`.
  3. Implement test cases:
     - `redirects unauthenticated request for /dashboard to /login?redirect=/dashboard`.
     - `redirects unauthenticated request for /cart/checkout to /login?redirect=/cart/checkout`.
     - `preserves search parameters in redirect query parameter`.
     - `allows access when kalano_token cookie is present`.
     - `allows public routes through without cookie`.
- **Done when**:
  - Running `pnpm test middleware` passes all tests with 0 failures.

---

## Batch 6: Verification & Quality Assurance `[SEQUENTIAL]`

### Task 6.1 — Code Quality, Linting & Formatting

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Backend: Run `ruff check backend/` and `ruff format backend/ --check`.
  - Frontend: Run `pnpm lint` and `pnpm format:check` (or `prettier --check`).
- **Done when**:
  - All files adhere to formatting and linting rules with zero errors or warnings.

### Task 6.2 — Full Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Backend: Run `pytest` across all test suites (`backend/tests/`).
  - Frontend: Run `pnpm test` across all test files (`frontend/__tests__/`).
- **Done when**:
  - All backend and frontend test suites pass.

### Task 6.3 — End-to-End Authentication & Route Guard Smoke Test

- **Type**: `[SEQUENTIAL]`
- **Description**:
  - Verify complete authentication cycle:
    1. If servers are started for manual smoke test, launch backend and frontend under strict timeout constraints (background tasks with a max 60s timeout, or terminate immediately via `manage_task kill`).
    2. Unauthenticated request to `/dashboard` redirects to `/login?redirect=%2Fdashboard`.
    3. Submitting login credentials sets `kalano_token`, hydrates `AuthContext`, and forwards to `/dashboard`.
    4. Clicking logout triggers `POST /api/v1/auth/logout`, deletes cookie, resets user state, and navigates to `/`.
    5. Subsequent visit to `/dashboard` immediately redirects to `/login`.
    6. Immediately terminate all running server processes using `manage_task kill` to return the agent to working state without waiting indefinitely.
- **Done when**:
  - Full flow operates without errors or console warnings, and all background server processes are completely terminated.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|---|---|---|---|
| 1: Backend Logout Endpoint & Tests | 3 | No (Sequential) | 1 |
| 2: Frontend Types & API Client | 2 | Yes (Parallel) | 2 |
| 3: Frontend Auth Context, Hook & Provider | 3 | No (Sequential) | 1 |
| 4: Next.js Middleware & Login Page | 2 | Yes (Parallel) | 2 |
| 5: Frontend Unit Tests | 2 | Yes (Parallel) | 2 |
| 6: Verification & QA | 3 | No (Sequential) | 1 |
| **Total** | **15** | | |

---

## Git Commit Plan

1. `feat(backend): add logout endpoint and response model`
2. `test(backend): add tests for logout endpoint`
3. `feat(frontend): add auth API client functions and context types`
4. `feat(frontend): implement AuthContext and useAuth hook`
5. `feat(frontend): add Next.js route protection middleware`
6. `feat(frontend): integrate AuthContext with providers and login page`
7. `test(frontend): add unit tests for AuthContext and middleware`
