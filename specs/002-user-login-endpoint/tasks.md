# Tasks: User Login Endpoint

> **Spec**: `specs/002-user-login-endpoint/spec.md`  
> **Plan**: `specs/002-user-login-endpoint/plan.md`  
> **Branch**: `feat/authentication`  
> **Spec**: 002 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

- **Depends on**: `specs/001-user-registration-endpoint/` (Status: ⬜ Pending / in progress)
  - Requires `backend/app/models/auth.py` (`UserResponse`, `ErrorResponse`, `ErrorDetail`).
  - Requires `backend/app/services/auth_service.py` (PasswordHasher initialization).
  - Requires `backend/app/routers/auth.py` (FastAPI router definition mounted in `backend/app/main.py`).

---

## Batch 1: Foundation `[PARALLEL]`

_These foundational tasks create the JWT generation utility and declare login models independently._

### Task 1.1 — Create JWT Utility (`backend/app/utils/jwt.py`) `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/app/utils/jwt.py`
- **Description**:
  1. Import `datetime`, `timedelta`, `timezone` from standard library.
  2. Import `jwt` from `jose`.
  3. Import `settings` from `app.dependencies.config`.
  4. Implement `create_access_token(data: dict, expires_delta: timedelta | None = None) -> str`:
     - Copy `data` dict to prevent mutating input.
     - Compute expiration using `datetime.now(timezone.utc)` + `expires_delta` (or `timedelta(minutes=settings.jwt_expiration_minutes)` if `expires_delta` is `None`).
     - Update dict with `"exp": expire`.
     - Encode token using `jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)`.
     - Return the encoded JWT string.
- **Done when**: Running `python -c "from app.utils.jwt import create_access_token; print(create_access_token({'test': 1}))"` outputs a valid JWT token string without errors.

### Task 1.2 — Add Login Models (`backend/app/models/auth.py`) `[PARALLEL]` `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/app/models/auth.py`
- **Description**:
  1. Add `UserLoginRequest` Pydantic model:
     - `email: str` with pattern validation `pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"` and description `"Registered user email address"`.
     - Add `@field_validator("email", mode="before")` to strip whitespace and convert to lowercase.
     - `password: str` with `min_length=1` and description `"Plaintext password"`.
  2. Add `LoginResponse` Pydantic model:
     - `access_token: str` with description `"JWT access token for authentication"`.
     - `token_type: str = "bearer"` with description `"Authentication scheme identifier"`.
     - `user: UserResponse` with description `"Public profile of the authenticated user"`.
- **Done when**: Running `python -c "from app.models.auth import UserLoginRequest, LoginResponse"` executes cleanly without import or syntax errors.

---

## Batch 2: Core Implementation `[SEQUENTIAL]`

_These tasks implement the credential verification service and the login router endpoint._

### Task 2.1 — Implement Password Verification & User Authentication (`backend/app/services/auth_service.py`)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/services/auth_service.py`
- **Description**:
  1. Import argon2 exceptions:
     ```python
     from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
     ```
  2. Implement `verify_password(plain_password: str, hashed_password: str) -> bool`:
     - Calls `ph.verify(hashed_password, plain_password)`.
     - Catches `(VerifyMismatchError, VerificationError, InvalidHashError)` and returns `False`.
     - Returns `True` if verification succeeds.
  3. Implement `authenticate_user(email: str, password: str, supabase_client: Client) -> dict | None`:
     - Normalizes email: `normalized_email = email.strip().lower()`.
     - Queries `users` table: `supabase_client.table("users").select("*").eq("email", normalized_email).execute()`.
     - If `not response.data`, returns `None`.
     - Retrieves `user_record = response.data[0]`.
     - Reads stored hash `stored_hash = user_record.get("password_hash")`.
     - If hash is missing or `not verify_password(password, stored_hash)`, returns `None`.
     - Returns `user_record`.
- **Done when**: `python -c "from app.services.auth_service import verify_password, authenticate_user"` executes cleanly.

### Task 2.2 — Implement POST /auth/login Endpoint (`backend/app/routers/auth.py`)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/routers/auth.py`
- **Description**:
  1. Update imports to include:
     - `from fastapi import Response, status`
     - `from app.dependencies.config import settings`
     - `from app.models.auth import LoginResponse, UserLoginRequest`
     - `from app.services.auth_service import authenticate_user`
     - `from app.utils.jwt import create_access_token`
  2. Implement `@router.post("/auth/login", ...)` endpoint:
     - `response_model=LoginResponse`
     - `status_code=status.HTTP_200_OK`
     - `summary="Log in user"`
     - `description="Authenticates a user by email and password, generates a signed JWT token, sets an httpOnly cookie ('kalano_token'), and returns the token and public profile."`
     - Responses documented: `200` (`LoginResponse`), `401` (`ErrorResponse`), `422` (Validation error).
  3. Signature:
     ```python
     def login(
         payload: UserLoginRequest,
         response: Response,
         supabase_client: Client = Depends(get_supabase_client),
     ) -> LoginResponse | JSONResponse:
     ```
  4. Logic:
     - Call `user = authenticate_user(email=payload.email, password=payload.password, supabase_client=supabase_client)`.
     - If `not user`:
       ```python
       return JSONResponse(
           status_code=status.HTTP_401_UNAUTHORIZED,
           content=ErrorResponse(
               error=ErrorDetail(
                   code="INVALID_CREDENTIALS",
                   message="Invalid email or password.",
               )
           ).model_dump(),
       )
       ```
     - Generate token:
       ```python
       token_claims = {
           "user_id": str(user["id"]),
           "user_role": user["user_role"],
       }
       access_token = create_access_token(data=token_claims)
       ```
     - Set httpOnly cookie on `response`:
       ```python
       response.set_cookie(
           key="kalano_token",
           value=access_token,
           httponly=True,
           samesite="lax",
           secure=False,
           max_age=settings.jwt_expiration_minutes * 60,
           path="/",
       )
       ```
     - Return `LoginResponse(access_token=access_token, token_type="bearer", user=UserResponse(**user))`.
- **Done when**: `python -c "from app.routers.auth import router"` executes without error and `/auth/login` is registered on the router.

---

## Batch 3: Tests `[SEQUENTIAL]`

_This batch writes comprehensive unit and integration tests covering all login scenarios._

### Task 3.1 — Implement Pytest Suite for User Login (`backend/tests/test_auth_login.py`)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_auth_login.py`
- **Description**:
  1. Set up test helper and fixtures using `argon2.PasswordHasher` to generate known hashes.
  2. Implement tests using FastAPI `client` fixture and `monkeypatch` to mock `get_supabase_client`:
     - `test_login_success`:
       - User exists in mock DB with valid hash.
       - Send valid credentials to `POST /api/v1/auth/login`.
       - Assert status `200`.
       - Assert `access_token` and `token_type == "bearer"`.
       - Assert `user` object contains `id`, `email`, `display_name`, `user_role`, and does not contain `password_hash`.
       - Assert `kalano_token` is present in response cookies or `Set-Cookie` header.
     - `test_login_cookie_attributes`:
       - Inspect `set-cookie` header on 200 response.
       - Verify `kalano_token` contains `httponly`, `samesite=lax`, `path=/`, and `max-age`.
     - `test_login_jwt_claims`:
       - Decode returned `access_token` using `jose.jwt.decode`.
       - Assert `user_id` matches user UUID string.
       - Assert `user_role` matches user role.
       - Assert `exp` claim is present and in the future.
     - `test_login_wrong_password`:
       - User exists with password `"correctpass"`.
       - Submit `"wrongpass"`.
       - Assert status `401`.
       - Assert body matches `{"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."}}`.
       - Assert `kalano_token` is not set in cookies.
     - `test_login_nonexistent_user`:
       - Supabase query returns empty list `[]`.
       - Assert status `401`.
       - Assert identical error envelope `INVALID_CREDENTIALS`.
       - Assert `kalano_token` is not set.
     - `test_login_email_normalization`:
       - User registered with `buyer@example.com`.
       - Submit login with ` Buyer@Example.COM `.
       - Assert status `200` and successful authentication.
     - `test_login_missing_email`:
       - Send `{ "password": "password123" }`.
       - Assert status `422`.
     - `test_login_missing_password`:
       - Send `{ "email": "buyer@example.com" }`.
       - Assert status `422`.
- **Done when**: `uv run pytest backend/tests/test_auth_login.py` runs and all tests pass.

---

## Batch 4: Verification `[SEQUENTIAL]`

_Final verification of code quality, regression testing, and API documentation._

### Task 4.1 — Lint & Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Run Ruff linter and formatter on all backend files:
  ```bash
  cd backend && uv run ruff check . && uv run ruff format --check .
  ```
- **Done when**: Zero lint errors and no formatting discrepancies reported.

### Task 4.2 — Full Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**: Run the entire backend test suite to ensure health, registration, and login all pass cleanly:
  ```bash
  cd backend && uv run pytest -v
  ```
- **Done when**: 100% of tests pass across `test_health.py`, `test_auth_register.py`, and `test_auth_login.py`.

### Task 4.3 — OpenAPI Schema & Cookie Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Inspect the FastAPI app routes and OpenAPI schema to ensure `POST /api/v1/auth/login` is fully documented with tag `Auth`, correct summary, description, and status codes (200, 401, 422).
  - If verified by inspecting the schema directly via Python script, no server is needed.
  - If a server is launched for inspection or cookie testing, it MUST be executed with an explicit timeout constraint (e.g. background task with a max 30s timeout, terminated immediately via `manage_task kill`) to prevent the agent from waiting indefinitely.
- **Done when**: Endpoint metadata is confirmed present and valid in the generated OpenAPI schema, and any test server process is terminated.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|---|---|---|---|
| 1: Foundation | 2 (Task 1.1, 1.2) | Yes | 2 |
| 2: Core Implementation | 2 (Task 2.1, 2.2) | No | 1 |
| 3: Tests | 1 (Task 3.1) | No | 1 |
| 4: Verification | 3 (Task 4.1, 4.2, 4.3) | No | 1 |
| **Total** | **8 Tasks** | | |

---

## Git Commit Plan

1. `feat(auth): add JWT token creation utility and login request/response models`
2. `feat(auth): implement password verification and user authentication service`
3. `feat(auth): implement POST /api/v1/auth/login endpoint with httpOnly cookie`
4. `test(auth): add unit and integration tests for user login endpoint`
