# Spec: Auth Context & Middleware

> **Roadmap Reference**: Phase 2, Step 2.6 — Auth context & middleware  
> **Branch**: `feat/authentication`  
> **Spec**: 006 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## 1. Overview

This specification defines the client-side authentication state management and edge route protection system for the Kalano multi-vendor e-commerce platform. It completes Phase 2 (Authentication) by providing the central glue between the backend JWT cookie authentication mechanism and the frontend application layer.

In Kalano, user authentication is managed via an httpOnly cookie (`kalano_token`) issued by the FastAPI backend (§4.2). Because httpOnly cookies are inaccessible to client-side JavaScript, the frontend cannot parse or read token claims directly. Instead:
1. The **React AuthContext** (`AuthProvider`) acts as the single source of truth for the authenticated user on the client. Upon initial application mount, it automatically issues an authenticated request to `GET /api/v1/auth/me` (with `credentials: "include"`) to hydrate the user profile into state.
2. The **`useAuth` custom hook** exposes the authentication state (`user`, `isLoading`, `isAuthenticated`) and actions (`logout`, `refreshUser`) to components throughout the application.
3. The **Next.js Middleware** (`middleware.ts`) runs at the network edge on every incoming page request. It verifies the presence of the `kalano_token` cookie before allowing access to protected client routes (`/cart`, `/checkout`, `/orders`, `/dashboard`, `/logistics`). If the cookie is absent, it immediately redirects the visitor to `/login?redirect=<requested_path>`.
4. The **Logout Flow** coordinates cookie revocation and state cleanup across both tiers: calling the backend `POST /api/v1/auth/logout` endpoint (which deletes the `kalano_token` cookie with matching domain/path attributes), resetting the client-side `AuthContext` state to `null`, and navigating the user to the landing page (`/`).
5. The **Backend Logout Endpoint** (`POST /api/v1/auth/logout`) provides an idempotent mechanism to delete the authentication cookie and return a structured confirmation.

---

## 2. Dependencies

- **`specs/001-user-registration-endpoint/`**: Provides the base user schema and standard error envelope models (`ErrorResponse`, `ErrorDetail`).
- **`specs/002-user-login-endpoint/`**: Sets the `kalano_token` httpOnly cookie on successful login via `POST /api/v1/auth/login`.
- **`specs/003-auth-dependency-and-current-user/`**: Provides the `GET /api/v1/auth/me` endpoint used by `AuthContext` to hydrate the user profile upon mount and on demand.
- **`specs/004-frontend-signup-page/`**: Provides base TypeScript types (`UserResponse`, `ApiError`) in `frontend/types/auth.ts`.
- **`specs/005-frontend-login-page/`**: Provides API client infrastructure in `frontend/lib/api/auth.ts` and the `/login` page that will be updated to trigger `refreshUser()` after successful authentication.

---

## 3. Functional Requirements

### 3.1 — Backend Logout Endpoint (`POST /api/v1/auth/logout`)

- [ ] The backend MUST expose a `POST /api/v1/auth/logout` endpoint in `backend/app/routers/auth.py`.
- [ ] The endpoint MUST accept the FastAPI `Response` object to manipulate outgoing HTTP headers.
- [ ] The endpoint MUST delete the `kalano_token` cookie by setting:
  - `key="kalano_token"`
  - `httponly=True`
  - `samesite="lax"`
  - `path="/"`
- [ ] The endpoint MUST return HTTP `200 OK` with a JSON payload conforming to `LogoutResponse`:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```
- [ ] The endpoint MUST be idempotent. If called without an active session or without a `kalano_token` cookie, it must still return HTTP `200 OK` and ensure the cookie deletion header is sent.
- [ ] The endpoint MUST be documented under the `"Auth"` OpenAPI tag with descriptive summary and responses.

### 3.2 — Frontend API Client Functions (`frontend/lib/api/auth.ts`)

- [ ] **`fetchCurrentUser`**:
  - Signature: `fetchCurrentUser(): Promise<UserResponse>`
  - MUST issue a `GET` request to `${API_BASE_URL}/api/v1/auth/me`.
  - MUST set `credentials: "include"` so the browser transmits the `kalano_token` httpOnly cookie.
  - On HTTP `200 OK`, MUST parse and return the `UserResponse` object.
  - On non-OK responses (e.g. 401 Unauthorized), MUST throw an Error indicating authentication failure.
- [ ] **`logoutUser`**:
  - Signature: `logoutUser(): Promise<void>`
  - MUST issue a `POST` request to `${API_BASE_URL}/api/v1/auth/logout`.
  - MUST set `credentials: "include"` to ensure cookie deletion headers are applied to the active session.
  - MUST NOT fail or throw if the server returns 200; in case of network failure, MUST catch gracefully so client state can still be cleared.

### 3.3 — React Auth Context & Provider (`frontend/lib/auth-context.tsx`)

- [ ] MUST define and export `AuthContext` using `createContext<AuthContextValue | undefined>(undefined)`.
- [ ] MUST export `AuthProvider({ children }: { children: ReactNode })` marked with `"use client"`.
- [ ] MUST maintain internal state:
  - `user`: `UserResponse | null` (defaults to `null`).
  - `isLoading`: `boolean` (defaults to `true`).
- [ ] MUST define `refreshUser: () => Promise<void>` using `useCallback`:
  1. Sets `isLoading(true)`.
  2. Awaits `fetchCurrentUser()`.
  3. On success, updates `user` state with the returned profile.
  4. On failure (e.g. 401 Unauthorized or network error), sets `user` to `null`.
  5. In the `finally` block, sets `isLoading(false)`.
- [ ] MUST invoke `refreshUser()` on mount using `useEffect` with empty/stable dependencies.
- [ ] MUST define `logout: () => Promise<void>` using `useCallback`:
  1. Invokes `await logoutUser()`.
  2. Sets `user` state to `null`.
  3. Uses Next.js App Router `router.push("/")` to redirect the user to the home page.
- [ ] MUST compute `isAuthenticated: boolean` as `Boolean(user)`.
- [ ] MUST provide the context value: `{ user, isLoading, isAuthenticated, logout, refreshUser }`.

### 3.4 — Convenience Hook (`frontend/lib/hooks/use-auth.ts`)

- [ ] MUST define and export `useAuth(): AuthContextValue`.
- [ ] MUST call `useContext(AuthContext)`.
- [ ] If the context is `undefined` (i.e. called outside of an `<AuthProvider>`), MUST throw an Error:
  `"useAuth must be used within an AuthProvider"`.
- [ ] Otherwise, MUST return the active `AuthContextValue`.

### 3.5 — Next.js Route Protection Middleware (`frontend/middleware.ts`)

- [ ] MUST be located at `frontend/middleware.ts` (Next.js root convention).
- [ ] MUST define the list of protected route prefixes:
  - `/cart`
  - `/checkout`
  - `/orders`
  - `/dashboard`
  - `/logistics`
- [ ] MUST evaluate `request.nextUrl.pathname`:
  - A path is considered protected if `pathname === route || pathname.startsWith(`${route}/`)` for any route in the protected list.
- [ ] For protected paths:
  - MUST inspect `request.cookies.get("kalano_token")`.
  - If the cookie is absent or has an empty value:
    1. Constructs a redirect URL to `/login`.
    2. Appends `?redirect=${pathname}` query parameter preserving the original target.
    3. Returns `NextResponse.redirect(loginUrl)`.
  - If the cookie is present:
    - Returns `NextResponse.next()`, allowing the request to proceed.
- [ ] For non-protected paths (e.g. `/`, `/products`, `/login`, `/signup`, `/_next`, `/api`):
  - MUST return `NextResponse.next()` without redirection.
- [ ] MUST define a `config` object with a path `matcher` to avoid executing middleware on static assets, images, and favicon:
  ```typescript
  export const config = {
    matcher: [
      "/cart/:path*",
      "/checkout/:path*",
      "/orders/:path*",
      "/dashboard/:path*",
      "/logistics/:path*",
    ],
  };
  ```
- [ ] **Architectural Boundary Note**: Middleware only verifies the presence of the `kalano_token` cookie. It does NOT verify the cryptographic signature or decode JWT claims. Backend endpoints and `AuthContext` handle cryptographic validation.

### 3.6 — Global Providers Setup (`frontend/lib/providers.tsx`)

- [ ] MUST modify `frontend/lib/providers.tsx` to wrap children with `<AuthProvider>` inside `<QueryClientProvider>`.
- [ ] Provider hierarchy MUST be:
  ```tsx
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
  ```
- [ ] Ensures all client pages, components, and hooks inside `RootLayout` have access to both React Query and AuthContext.

### 3.7 — Login Page Context Hydration (`frontend/app/login/page.tsx`)

- [ ] MUST update `frontend/app/login/page.tsx`:
  - Upon receiving HTTP 200 from `POST /api/v1/auth/login`, call `await refreshUser()` from `useAuth()` to immediately hydrate the user profile into state before navigating.
  - Read optional `redirect` search parameter (`searchParams.get("redirect")`).
  - If a valid relative redirect path is specified (e.g. `/checkout`), navigate to that path via `router.push(redirect)`.
  - If `redirect` is not provided or is an external URL, default navigate to `/`.

---

## 4. Acceptance Criteria

- [ ] **AC1 — Logout Endpoint Success**: `POST /api/v1/auth/logout` returns HTTP `200 OK` with body `{"message": "Logged out successfully"}`.
- [ ] **AC2 — Cookie Deletion Header**: The response of `POST /api/v1/auth/logout` contains a `Set-Cookie` header for `kalano_token` with an expiration date in the past (deleting the cookie) and `path="/"`.
- [ ] **AC3 — Idempotent Logout**: Calling `POST /api/v1/auth/logout` without cookies or when already logged out returns HTTP `200 OK` and sets the cookie deletion header without errors.
- [ ] **AC4 — Context Hydration on Mount**: When `AuthProvider` mounts and a valid `kalano_token` cookie exists, `fetchCurrentUser()` is called and `user` is populated with the returned `UserResponse`. `isLoading` transitions from `true` to `false`.
- [ ] **AC5 — Unauthenticated Mount Handling**: When `AuthProvider` mounts and no valid cookie exists, `fetchCurrentUser()` fails (401), `user` remains `null`, `isAuthenticated` is `false`, and `isLoading` becomes `false`.
- [ ] **AC6 — useAuth Outside Provider Guard**: Invoking `useAuth()` outside an `<AuthProvider>` throws an Error with the message `"useAuth must be used within an AuthProvider"`.
- [ ] **AC7 — Logout Action**: Calling `logout()` from `useAuth()` calls `logoutUser()`, resets `user` to `null`, `isAuthenticated` to `false`, and navigates to `/`.
- [ ] **AC8 — Middleware Missing Cookie Redirect**: Sending a GET request to `/dashboard` without a `kalano_token` cookie redirects with HTTP 307/302 to `/login?redirect=/dashboard`.
- [ ] **AC9 — Middleware Subpath Protection**: Sending a GET request to `/cart/items/1` without a `kalano_token` cookie redirects to `/login?redirect=/cart/items/1`.
- [ ] **AC10 — Middleware Allows Authenticated Access**: Sending a GET request to `/dashboard` with a `kalano_token` cookie passes through (`NextResponse.next()`).
- [ ] **AC11 — Middleware Ignores Public Routes**: Sending a GET request to `/` or `/products` without a cookie proceeds without redirection.
- [ ] **AC12 — Open Redirect Prevention**: If `redirect` search parameter begins with `//` or an external protocol (`http:`, `https:`), the login page falls back to `/`.

---

## 5. API Contract

### `POST /api/v1/auth/logout`

**Summary**: Log out the current user  
**Description**: Clears the httpOnly `kalano_token` cookie by setting a deletion cookie header, effectively terminating the browser session.  
**Tags**: `["Auth"]`  

#### Request Headers & Cookies

| Location | Name | Type | Required | Description |
|---|---|---|---|---|
| Cookie | `kalano_token` | string | Optional | The httpOnly JWT access token to clear |

#### Success Response (`200 OK`)

```json
{
  "message": "Logged out successfully"
}
```

**Response Headers**:
```http
Set-Cookie: kalano_token=""; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=lax
```

| Field | Type | Description |
|---|---|---|
| `message` | string | Human-readable confirmation of successful logout |

#### Error Responses

| HTTP Status | Error Code | Description / Scenario | Response Shape |
|---|---|---|---|
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected server or infrastructure failure | Standard error envelope |

---

## 6. UI/UX Requirements

### 6.1 — Route Guard Behavior & Transition States
- When an unauthenticated user navigates directly to a protected page (e.g. `/orders` or `/dashboard`):
  - Middleware intercepts the request before page rendering begins.
  - Browser is immediately redirected to `/login?redirect=%2Forders`.
  - The login card optionally displays a contextual banner: `"Please sign in to access this page."`
- After logging in successfully:
  - User is navigated back to `/orders` seamlessly.

### 6.2 — App Mount & Hydration State
- During initial hydration (`isLoading === true`):
  - Components consuming `useAuth` can display a subtle skeleton or spinner instead of immediately flashing unauthenticated UI elements.
  - Navigation headers render a neutral loading placeholder where "Sign In" or user profile controls appear.
- Once hydration completes (`isLoading === false`):
  - If authenticated: Header renders user display name, role badge (`Buyer` or `Merchant`), and a `Log Out` button.
  - If unauthenticated: Header renders `Sign In` and `Register` navigation links.

### 6.3 — Logout Interaction
- Clicking the `Log Out` button:
  - Immediately initiates `logout()`.
  - Disables the logout button to prevent multiple triggers.
  - Clears `user` in AuthContext.
  - Navigates the browser to `/`.

---

## 7. Edge Cases & Error Handling

| Scenario | Handling Strategy | Expected Status Code & Payload |
|---|---|---|
| Initial visit with no cookie | `fetchCurrentUser()` returns 401; `refreshUser` catches error, sets `user=null`, `isLoading=false` | No console crash; UI renders unauthenticated state |
| Expired or corrupted `kalano_token` cookie | Middleware allows request through (checks presence only); page loads; `fetchCurrentUser()` returns 401; `AuthContext` clears user; page redirects or prompts login | 401 from API caught gracefully; client user is `null` |
| Network offline on mount | `fetchCurrentUser()` throws NetworkError; `refreshUser` catches error, defaults `user=null`, `isLoading=false` | App remains usable in offline/logged-out state |
| Backend server unreachable during logout | `logoutUser()` fetch catches failure; `logout()` still clears client `user` state and redirects to `/` | User is locally logged out even if backend is down |
| Malicious open redirect param (e.g. `?redirect=https://evil.com` or `?redirect=//evil.com`) | Login page validates that `redirect` starts with a single `/` and not `//`; falls back to `/` | Redirects safely to `/` |
| User logs out in one tab while another tab is open | Protected API requests in second tab will return 401; tab can call `refreshUser()` to sync state | Session securely terminated across tabs |
| Protected route with nested query parameters (e.g. `/checkout?step=2&coupon=SAVE10`) | Middleware preserves full pathname and search params in `redirect` query parameter | Redirects to `/login?redirect=%2Fcheckout%3Fstep%3D2%26coupon%3DSAVE10` |

---

## 8. Out of Scope

- ❌ Refresh token rotation and silent token refreshing (Phase 2 uses standard JWT expiration).
- ❌ Role-based page access restrictions in middleware (e.g. preventing a Buyer from viewing `/dashboard`; this will be enforced at page/layout level in Phase 6: Merchant Dashboard and Phase 8: Logistics).
- ❌ Server-Side Rendering (SSR) cookie hydration into React Context (client-side `useEffect` hydration is standard for App Router thin client architecture).
- ❌ Automatic cross-tab BroadcastChannel synchronization (can be added as an enhancement in later phases).

---

## 9. Constitution Compliance

- ✅ **§4.1 Strict Backend Separation**: All authentication and session verification logic resides in FastAPI (`/api/v1/auth/me`, `/api/v1/auth/logout`). The Next.js frontend is a thin client.
- ✅ **§4.2 Authentication & Cookies**: JWT is stored exclusively in the `kalano_token` httpOnly cookie. Next.js middleware checks for cookie presence to guard routes.
- ✅ **§4.2 Protected Routes**: Protects `/cart`, `/checkout`, `/orders`, `/dashboard`, and `/logistics` as specified in the Constitution.
- ✅ **§4.3 API Communication**: Endpoint prefixed with `/api/v1/auth/logout`, uses Pydantic response model with field descriptions, tagged with `Auth`.
- ✅ **§4.4 Standard Error Envelope**: Any API errors return `{"error": {"code": "...", "message": "..."}}`.
- ✅ **§7 Naming Conventions**:
  - Frontend files: `kebab-case` (`auth-context.tsx`, `use-auth.ts`, `middleware.ts`).
  - React components: `PascalCase` (`AuthProvider`).
  - Functions & hooks: `camelCase` (`useAuth`, `fetchCurrentUser`, `logoutUser`, `refreshUser`).
  - Backend files: `snake_case` (`test_auth_logout.py`).
- ✅ **§14 Testing**: Comprehensive unit and integration test coverage across Pytest (backend logout endpoint) and Vitest (frontend AuthContext, useAuth hook, and middleware).

---

## 10. Open Questions

- None. All requirements, interface shapes, error handling strategies, and boundary conditions are fully resolved.
