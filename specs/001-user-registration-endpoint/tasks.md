# Tasks: User Registration Endpoint

> **Spec**: `specs/001-user-registration-endpoint/spec.md`  
> **Plan**: `specs/001-user-registration-endpoint/plan.md`  
> **Branch**: `feat/authentication`  
> **Spec**: 001 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

- **Prior Spec**: None (this is the first spec in Phase 2).

---

## Batch 1: Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Auth and Common Error Models (`backend/app/models/auth.py`)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/auth.py`
- **Description**:
  1. Define `ErrorDetail` Pydantic model with fields:
     - `code: str` (with `Field(description="Machine-readable error code", examples=["DUPLICATE_EMAIL"])`).
     - `message: str` (with `Field(description="Human-readable error description", examples=["A user with this email address already exists."])`).
  2. Define `ErrorResponse` Pydantic model with field:
     - `error: ErrorDetail` (with `Field(description="Standard error envelope")`).
  3. Define `UserRegisterRequest` Pydantic model with fields:
     - `email: str` (with `Field(pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", description="Unique user email address", examples=["user@example.com"])`).
     - Add field validator to strip leading/trailing whitespace and lowercase the email.
     - `password: str` (with `Field(min_length=8, description="Plaintext password, minimum 8 characters", examples=["secret12345"])`).
     - `display_name: str` (with `Field(min_length=1, max_length=100, description="Public display name", examples=["Jane Doe"])`).
     - Add field validator to strip leading/trailing whitespace from `display_name`.
     - `user_role: Literal["buyer", "merchant"]` (with `Field(description="User account role", examples=["buyer"])`).
  4. Define `UserResponse` Pydantic model with fields:
     - `id: UUID = Field(description="Unique user identifier")`
     - `created_at: datetime = Field(description="Account creation timestamp")`
     - `email: str = Field(description="User email address")`
     - `display_name: str = Field(description="User public display name")`
     - `user_role: str = Field(description="User role")`
     - `address: str | None = Field(default=None, description="User address, null upon registration")`
     - Enable `from_attributes = True` in model configuration.
- **Done when**: `python -c "from app.models.auth import UserRegisterRequest, UserResponse, ErrorResponse, ErrorDetail"` executes cleanly without errors.

---

## Batch 2: Core Implementation `[SEQUENTIAL]`

### Task 2.1 — Implement Authentication Service (`backend/app/services/auth_service.py`)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/services/auth_service.py`
- **Description**:
  1. Define domain exception:
     ```python
     class DuplicateEmailError(Exception):
         """Raised when a user registration attempts to use an already registered email."""
         pass
     ```
  2. Initialize an `argon2.PasswordHasher()` instance.
  3. Implement `hash_password(password: str) -> str` using the argon2 hasher.
  4. Implement `register_user(payload: UserRegisterRequest, supabase_client: Client) -> UserResponse`:
     - Hash the plaintext password via `hash_password(payload.password)`.
     - Prepare record payload with `email`, `password_hash`, `display_name`, `user_role`, and `address=None`.
     - NOTE: Do NOT include `id` or `created_at` in the record payload; both are handled automatically by Supabase defaults.
     - Execute database insert: `supabase_client.table("users").insert(record).execute()`.
     - If insert is successful, return `UserResponse(**response.data[0])`.
     - Catch database exceptions: inspect for PostgreSQL error code `23505` or substring `"duplicate key"` / `"23505"` in exception message; raise `DuplicateEmailError` when detected.
- **Done when**: Service module imports cleanly and can hash passwords and handle mocked Supabase responses.

### Task 2.2 — Implement Auth Router with Registration Endpoint (`backend/app/routers/auth.py`)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/routers/auth.py`
- **Description**:
  1. Create `router = APIRouter(prefix="/api/v1", tags=["Auth"])`.
  2. Implement `@router.post("/auth/register", ...)` endpoint:
     - `response_model=UserResponse`
     - `status_code=status.HTTP_201_CREATED`
     - `summary="Register a new user"`
     - `description="Registers a new user account with either 'buyer' or 'merchant' role. Hashes password with argon2, persists user in Supabase, and returns the public user profile excluding sensitive password hash data."`
     - Document responses: `201` (`UserResponse`), `409` (`ErrorResponse`), `422` (Validation error).
  3. Inject `supabase_client: Client = Depends(get_supabase_client)`.
  4. Call `register_user(payload=payload, supabase_client=supabase_client)`.
  5. Catch `DuplicateEmailError` and return `JSONResponse(status_code=status.HTTP_409_CONFLICT, content=ErrorResponse(error=ErrorDetail(code="DUPLICATE_EMAIL", message=str(exc))).model_dump())`.
- **Done when**: Router module imports cleanly and exports `router`.

---

## Batch 3: Integration & Wiring `[SEQUENTIAL]`

### Task 3.1 — Register Auth Router in FastAPI App (`backend/app/main.py`)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/main.py`
- **Description**:
  1. Import `auth` from `app.routers`:
     ```python
     from app.routers import auth
     ```
  2. Register router on `app`:
     ```python
     app.include_router(auth.router)
     ```
- **Done when**: Inspecting `app.routes` confirms `/api/v1/auth/register` is mounted.

---

## Batch 4: Tests `[SEQUENTIAL]`

### Task 4.1 — Implement Pytest Suite for User Registration (`backend/tests/test_auth_register.py`)

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/tests/test_auth_register.py`
- **Description**:
  1. Implement test cases using pytest and `client` fixture:
     - `test_register_buyer_success`: Valid buyer payload returns 201, contains UUID, correct role, and `password_hash` is not in response. Also asserts that the payload passed to Supabase `.insert(...)` does not contain `"id"` or `"created_at"`.
     - `test_register_merchant_success`: Valid merchant payload returns 201 with role `"merchant"`.
     - `test_register_duplicate_email`: Mock Supabase raising unique violation error (23505); verify response is 409 with envelope `{"error": {"code": "DUPLICATE_EMAIL", "message": "A user with this email address already exists."}}`.
     - `test_register_missing_email`: Omit email field; verify 422.
     - `test_register_invalid_email_format`: Send invalid email format (e.g. `"not-an-email"`); verify 422.
     - `test_register_short_password`: Send password with length < 8 (e.g. `"short"`): verify 422.
     - `test_register_missing_password`: Omit password; verify 422.
     - `test_register_empty_display_name`: Send empty string for display_name; verify 422.
     - `test_register_invalid_role`: Send `user_role="logistics"` or `user_role="admin"`; verify 422.
     - `test_argon2_password_hashing`: Verify directly that `hash_password` creates valid Argon2 hashes verifiable via `PasswordHasher().verify(...)`.
  2. Use `monkeypatch` to mock `get_supabase_client` across `app.routers.auth` and `app.dependencies.database`.
- **Done when**: `uv run pytest backend/tests/test_auth_register.py` passes with all tests green.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Run Ruff linter and formatter to guarantee code cleanliness and adherence to standards:
  ```bash
  cd backend && uv run ruff check . && uv run ruff format --check .
  ```
- **Done when**: Zero lint errors or formatting discrepancies.

### Task 5.2 — Full Test Suite Execution

- **Type**: `[SEQUENTIAL]`
- **Description**: Run the complete backend test suite to ensure no regressions:
  ```bash
  cd backend && uv run pytest -v
  ```
- **Done when**: All tests pass (both `test_health.py` and `test_auth_register.py`).

### Task 5.3 — OpenAPI Schema & Documentation Inspection

- **Type**: `[SEQUENTIAL]`
- **Description**: Verify the generated OpenAPI schema exposes `/api/v1/auth/register` with correct metadata, tags, summary, and schema models.
  - If verified by inspecting the schema directly via Python (`python -c "from app.main import app; ..."`), no server is needed.
  - If verified by starting Uvicorn (`uv run uvicorn app.main:app`), it MUST be launched with an explicit timeout constraint (e.g. background task with a max 30s timeout, killed immediately after inspection via `manage_task kill`) to prevent the agent from waiting indefinitely.
- **Done when**: Endpoint is verified present under tag `Auth` with request and response models properly documented, and any test server process is completely terminated.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|---|---|---|---|
| 1: Foundation | 1 (Task 1.1) | No | 1 |
| 2: Core Implementation | 2 (Task 2.1, 2.2) | No | 1 |
| 3: Integration & Wiring | 1 (Task 3.1) | No | 1 |
| 4: Tests | 1 (Task 4.1) | No | 1 |
| 5: Verification | 3 (Task 5.1, 5.2, 5.3) | No | 1 |
| **Total** | **8 Tasks** | | |

---

## Git Commit Plan

1. `feat(auth): create registration models and error response envelope`
2. `feat(auth): implement argon2 password hashing and user registration service`
3. `feat(auth): implement POST /api/v1/auth/register endpoint and wire router`
4. `test(auth): add unit and integration tests for user registration endpoint`
