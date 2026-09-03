# Tasks: Auth Dependency & Current User Endpoint

> **Spec**: `specs/003-auth-dependency-and-current-user/spec.md`  
> **Plan**: `specs/003-auth-dependency-and-current-user/plan.md`  
> **Branch**: `feat/authentication`  
> **Spec**: 003 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Complete  

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

- **`specs/001-user-registration-endpoint/`**: Must be completed first. Provides `UserResponse`, `ErrorResponse`, and `ErrorDetail` in `backend/app/models/auth.py`, along with the `users` table schema structure.
- **`specs/002-user-login-endpoint/`**: Must be completed first. Provides `create_access_token` in `backend/app/utils/jwt.py`, token claim keys (`user_id`, `user_role`, `exp`), and sets the `kalano_token` cookie convention.

---

## Batch 1: JWT Decoding Utility `[SEQUENTIAL]`

### Task 1.1 — Implement `decode_access_token` in `backend/app/utils/jwt.py`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/utils/jwt.py`
- **Description**:
  1. Open `backend/app/utils/jwt.py`.
  2. Import `ExpiredSignatureError` and `JWTError` from `jose`.
  3. Import `settings` from `app.dependencies.config`.
  4. Implement `decode_access_token(token: str) -> dict | None`:
     - Wrap `jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])` in a `try...except` block.
     - Catch `(JWTError, ExpiredSignatureError)`.
     - Return the decoded payload dictionary on success, or `None` on any decoding or expiration failure.
- **Done when**:
  - `decode_access_token` is exported from `backend/app/utils/jwt.py`.
  - Calling `decode_access_token` with a valid token returns its payload dictionary.
  - Calling `decode_access_token` with an expired token or invalid string returns `None` without raising uncaught exceptions.

---

## Batch 2: Auth Dependency `[SEQUENTIAL]`

### Task 2.1 — Implement `get_current_user` in `backend/app/dependencies/auth.py`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/dependencies/auth.py`
- **Description**:
  1. Create `backend/app/dependencies/auth.py`.
  2. Import `Request`, `HTTPException`, and `status` from `fastapi`.
  3. Import `decode_access_token` from `app.utils.jwt`.
  4. Import `get_supabase_client` from `app.dependencies.database`.
  5. Implement `async def get_current_user(request: Request) -> dict`:
     - **Step 1**: Retrieve `token = request.cookies.get("kalano_token")`.
     - **Step 2**: If no cookie token, inspect `request.headers.get("Authorization")`. If present and starts with `"Bearer "`, extract `token = auth_header.split(" ", 1)[1].strip()`.
     - **Step 3**: If no token from either source, raise `HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": {"code": "MISSING_TOKEN", "message": "Authentication required."}})`.
     - **Step 4**: Call `payload = decode_access_token(token)`. If `payload` is `None` or `payload.get("user_id")` is missing, raise `HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": {"code": "INVALID_TOKEN", "message": "Token is invalid or expired."}})`.
     - **Step 5**: Query Supabase: `client = get_supabase_client()`, `result = client.table("users").select("*").eq("id", user_id).execute()`.
     - **Step 6**: If `not result.data`, raise `HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": {"code": "USER_NOT_FOUND", "message": "User no longer exists."}})`.
     - **Step 7**: Return `result.data[0]`.
- **Done when**:
  - `get_current_user` is defined, passes static typing checks, and handles cookie retrieval, header fallback, token verification, database query, and 401 exceptions.

---

## Batch 3: Endpoint Integration `[SEQUENTIAL]`

### Task 3.1 — Add `GET /api/v1/auth/me` to `backend/app/routers/auth.py`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/routers/auth.py`
- **Description**:
  1. Open `backend/app/routers/auth.py`.
  2. Import `Depends`, `status` from `fastapi`.
  3. Import `get_current_user` from `app.dependencies.auth`.
  4. Import `UserResponse`, `ErrorResponse` from `app.models.auth`.
  5. Define route handler:
     ```python
     @router.get(
         "/me",
         response_model=UserResponse,
         status_code=status.HTTP_200_OK,
         summary="Get current user profile",
         description="Returns the profile of the currently authenticated user. Requires a valid JWT access token provided via httpOnly cookie (kalano_token) or Authorization Bearer header.",
         responses={
             status.HTTP_401_UNAUTHORIZED: {
                 "model": ErrorResponse,
                 "description": "Missing, invalid, or expired token, or user no longer exists",
             },
         },
     )
     async def get_me(current_user: dict = Depends(get_current_user)) -> UserResponse:
         return UserResponse(**current_user)
     ```
- **Done when**:
  - Route `GET /api/v1/auth/me` is registered on the auth router.
  - Endpoint documentation in Swagger UI matches summary, description, tags, and response schemas.
  - Injects `current_user` via `Depends(get_current_user)` and serializes to `UserResponse`.

---

## Batch 4: Test Suite `[SEQUENTIAL]`

### Task 4.1 — Implement Pytest Test Suite in `backend/tests/test_auth_me.py`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_auth_me.py`
- **Description**:
  1. Create `backend/tests/test_auth_me.py`.
  2. Set up test client and mock Supabase fixture using `unittest.mock.MagicMock` or `monkeypatch`.
  3. Implement test cases:
     - `test_me_with_valid_cookie_token`: Verify valid JWT in `kalano_token` cookie returns 200 OK with correct `UserResponse` data and without `password_hash`.
     - `test_me_with_valid_bearer_token`: Verify valid JWT in `Authorization: Bearer <token>` header returns 200 OK with `UserResponse`.
     - `test_me_cookie_precedence`: Verify that if both cookie and header are passed, the cookie identity is used.
     - `test_me_no_token`: Verify request without cookie or header returns 401 with code `MISSING_TOKEN`.
     - `test_me_expired_token`: Verify request with expired JWT returns 401 with code `INVALID_TOKEN`.
     - `test_me_invalid_token_string`: Verify request with random unparsable token returns 401 with code `INVALID_TOKEN`.
     - `test_me_invalid_signature`: Verify request with JWT signed with wrong secret key returns 401 with code `INVALID_TOKEN`.
     - `test_me_token_missing_user_id`: Verify request with token missing `user_id` claim returns 401 with code `INVALID_TOKEN`.
     - `test_me_user_not_found`: Verify request with valid token but non-existent user ID in DB returns 401 with code `USER_NOT_FOUND`.
     - `test_me_malformed_auth_header`: Verify header not matching `Bearer <token>` returns 401 with code `MISSING_TOKEN`.
- **Done when**:
  - All 10 test cases in `backend/tests/test_auth_me.py` pass cleanly.

---

## Batch 5: Verification & Quality Assurance `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Backend Code

- **Type**: `[SEQUENTIAL]`
- **Description**:
  1. Run Ruff linter: `uv run ruff check backend/`.
  2. Run Ruff formatter: `uv run ruff format --check backend/`.
  3. Correct any formatting or lint issues found.
- **Done when**: `ruff check` and `ruff format` exit with 0 errors.

### Task 5.2 — Run Full Backend Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**:
  1. Run all backend tests: `uv run pytest`.
  2. Ensure both existing health/auth tests and newly added `test_auth_me.py` tests pass without failures.
- **Done when**: 100% of backend tests pass.

### Task 5.3 — Manual Smoke Test & OpenAPI Documentation Verification

- **Type**: `[SEQUENTIAL]`
- **Description**:
  1. Start local Uvicorn server under an explicit timeout constraint (run as a background task with a max 30s timeout, or terminate immediately after testing via `manage_task kill`): `uv run uvicorn app.main:app --port 8000`.
  2. Fetch OpenAPI schema (`GET /openapi.json` or check `/docs`).
  3. Verify `GET /api/v1/auth/me` is present under tag `Auth`.
  4. Perform curl smoke test:
     - Missing token request returns 401 with standard envelope.
     - Invalid Bearer token returns 401 with standard envelope.
  5. Immediately stop the server process via `manage_task kill` to ensure the agent is brought back to working without waiting indefinitely.
- **Done when**: OpenAPI documentation is verified, manual requests return expected status codes, and the server process is completely terminated.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|---|---|---|---|
| 1: Foundation (JWT Utility) | 1 | No | 1 |
| 2: Auth Dependency | 1 | No | 1 |
| 3: Endpoint Integration | 1 | No | 1 |
| 4: Test Suite | 1 | No | 1 |
| 5: Verification & QA | 3 | No | 1 |
| **Total** | **7** | | |

---

## Git Commit Plan

1. `feat(backend): implement decode_access_token utility in jwt.py`
2. `feat(backend): implement get_current_user authentication dependency`
3. `feat(backend): add GET /api/v1/auth/me endpoint to auth router`
4. `test(backend): add comprehensive test suite for auth dependency and /auth/me endpoint`
5. `chore(backend): lint and verify auth me endpoint implementation`
