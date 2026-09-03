# Spec: User Registration Endpoint

> **Roadmap Reference**: Phase 2, Step 2.1 — User registration endpoint  
> **Branch**: `feat/authentication`  
> **Spec**: 001 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## 1. Overview

This specification defines the user registration endpoint (`POST /api/v1/auth/register`) for the Kalano multi-vendor e-commerce platform. It provides the mechanism for new users to create accounts as either a **Buyer** or a **Merchant**.

Per the Kalano Constitution (§2, §4.2):
- Users self-select their role as either `buyer` or `merchant` during registration. (Logistics accounts are provisioned internally and cannot be self-registered.)
- Passwords must be hashed using `argon2` before storage.
- Supabase Auth is not used; user records are persisted directly to the custom `users` database table in Supabase.
- Password hashes are strictly omitted from all responses.
- Duplicate email registrations are detected and returned as a `409 Conflict` response with the platform-standard error envelope.
- Input validation failures are reported via `422 Unprocessable Entity` responses.

---

## 2. Dependencies

- **Prior Specs**: None (this is the first spec in Phase 2).
- **Existing Codebase Foundations**:
  - `backend/app/dependencies/database.py`: Provides `get_supabase_client()` for database access.
  - `backend/app/dependencies/config.py`: Provides application `settings`.
  - Installed packages: `fastapi`, `pydantic`, `argon2-cffi`, `supabase`, `pytest`.

---

## 3. Functional Requirements

### 3.1 — Request Payload & Validation

The endpoint must accept a JSON body containing:
- **`email`**: Valid email string, required. Leading/trailing whitespace must be trimmed and converted to lowercase for consistent uniqueness checks.
- **`password`**: Plaintext password string, required, minimum 8 characters (`min_length=8`).
- **`display_name`**: User's public name, required, non-empty string (`min_length=1`, `max_length=100`), stripped of leading/trailing whitespace.
- **`user_role`**: User role string, required. Allowed values: `"buyer"` or `"merchant"`. Any other role (e.g. `"logistics"`, `"admin"`) must be rejected with a 422 validation error.

### 3.2 — Password Hashing with Argon2

- The backend must hash the incoming plaintext password using `argon2` (`argon2.PasswordHasher` with secure defaults from `argon2-cffi`).
- The plaintext password must never be persisted, logged, or included in any response.
- The resulting hash string must be stored in the `password_hash` column of the `users` table.

### 3.3 — Database Insertion

- Both `id` and `created_at` are handled automatically and exclusively by Supabase database defaults (`gen_random_uuid()` and `now()`). The application code **MUST NOT** generate, provide, or include `id` or `created_at` in the insert dictionary.
- The user record dictionary passed to `client.table("users").insert(...)` must ONLY contain:
  - `email`: User's normalized email address.
  - `password_hash`: Argon2 password hash.
  - `display_name`: Provided display name.
  - `user_role`: Provided role (`"buyer"` or `"merchant"`).
  - `address`: `None` / `null` (addresses are added later during checkout or profile management).
- The insert operation requests the newly inserted record back from Supabase (`client.table("users").insert(...).execute()`), which returns the record populated with Supabase-generated `id` and `created_at` values.

### 3.4 — Conflict Detection (Duplicate Email)

- If a user attempts to register with an email address that already exists in the `users` table:
  - The database unique constraint on `email` will trigger a PostgreSQL error code `23505` (unique violation).
  - The service/router layer must catch this error and return an HTTP `409 Conflict` status code.
  - The response body must conform to the standard error envelope:
    ```json
    {
      "error": {
        "code": "DUPLICATE_EMAIL",
        "message": "A user with this email address already exists."
      }
    }
    ```

### 3.5 — Success Response

- Upon successful creation, the endpoint must return an HTTP `201 Created` status code.
- The response body must include the created user's public profile:
  - `id`: UUID string.
  - `created_at`: ISO 8601 datetime string.
  - `email`: User's email string.
  - `display_name`: User's display name string.
  - `user_role`: `"buyer"` or `"merchant"`.
  - `address`: `null` (or string if provided).
- **CRITICAL**: The `password_hash` field MUST NOT be included in the response body under any circumstance.

---

## 4. Acceptance Criteria

- [ ] **AC1 — Successful Registration**: Sending a valid payload (`email`, `password` >= 8 chars, `display_name`, `user_role` in `["buyer", "merchant"]`) returns HTTP `201 Created` with the user profile in the response body.
- [ ] **AC2 — Password Hash Exclusion**: The `201 Created` response body does not contain `password_hash` or plaintext `password`.
- [ ] **AC3 — Argon2 Hashing**: The database record in `users` stores the password hashed using Argon2, verifiable via `PasswordHasher().verify(...)`.
- [ ] **AC4 — Duplicate Email Rejection**: Attempting to register with an email that already exists returns HTTP `409 Conflict` with error code `DUPLICATE_EMAIL`.
- [ ] **AC5 — Short Password Validation**: Sending a password with fewer than 8 characters returns HTTP `422 Unprocessable Entity`.
- [ ] **AC6 — Invalid Role Validation**: Sending a `user_role` other than `"buyer"` or `"merchant"` (e.g. `"logistics"`, `"admin"`, or arbitrary string) returns HTTP `422 Unprocessable Entity`.
- [ ] **AC7 — Invalid Email Validation**: Sending a malformed or missing email returns HTTP `422 Unprocessable Entity`.
- [ ] **AC8 — Empty Display Name Validation**: Sending an empty or missing `display_name` returns HTTP `422 Unprocessable Entity`.
- [ ] **AC9 — Standard Error Envelope**: All 4xx/5xx business errors use the standard `{"error": {"code": "...", "message": "..."}}` envelope format.
- [ ] **AC10 — OpenAPI Documentation**: The endpoint is documented at `/docs` under the `Auth` tag with complete request/response schemas and summary/description.

---

## 5. API Contract

### `POST /api/v1/auth/register`

**Summary**: Register a new user  
**Description**: Creates a new user account with role `buyer` or `merchant`. Hashes password with argon2, persists user record to Supabase, and returns public profile without password hash.  
**Tags**: `["Auth"]`  

#### Request Body (`application/json`)

```json
{
  "email": "buyer@example.com",
  "password": "securepassword123",
  "display_name": "Jane Doe",
  "user_role": "buyer"
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `email` | string | Yes | Valid email format, lowercase | The unique email address for authentication |
| `password` | string | Yes | Min length 8 | Plaintext password to be hashed with argon2 |
| `display_name` | string | Yes | Min length 1, max length 100 | The public display name of the user |
| `user_role` | string | Yes | Enum: `"buyer"`, `"merchant"` | The account role; logistics is not self-registerable |

#### Success Response (`201 Created`)

```json
{
  "id": "e4b01e3e-7a42-4f1b-8c29-33b6d080b091",
  "created_at": "2026-09-03T12:00:00Z",
  "email": "buyer@example.com",
  "display_name": "Jane Doe",
  "user_role": "buyer",
  "address": null
}
```

| Field | Type | Description |
|---|---|---|
| `id` | UUID string | Unique user identifier |
| `created_at` | datetime (ISO 8601) | Account creation timestamp |
| `email` | string | User email address |
| `display_name` | string | User public display name |
| `user_role` | string | User role (`"buyer"` or `"merchant"`) |
| `address` | string or null | User delivery/contact address (null on registration) |

#### Error Responses

| HTTP Status | Error Code | Description / Scenario | Response Shape |
|---|---|---|---|
| `409 Conflict` | `DUPLICATE_EMAIL` | Email is already registered to an existing account | Standard error envelope |
| `422 Unprocessable Entity` | Pydantic validation error | Missing or invalid fields (e.g. password < 8 chars, invalid role) | FastAPI default / standard validation details |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database connectivity or unexpected server error | Standard error envelope |

**409 Conflict Example**:
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

This spec focuses exclusively on the backend API endpoint (`POST /api/v1/auth/register`).  
The frontend sign-up page is specified and built in **Spec 004** (`specs/004-frontend-signup-page/`).  
The API contract defined here is designed directly to satisfy the needs of the frontend registration form.

---

## 7. Edge Cases & Error Handling

| Scenario | Handling Strategy | Expected Status Code & Payload |
|---|---|---|
| Email with leading/trailing whitespace | Strip whitespace and convert to lowercase in Pydantic validator before processing | `201 Created` |
| Email with uppercase letters (e.g. `User@Example.COM`) | Normalize to lowercase (`user@example.com`) to prevent duplicate casing collisions | `201 Created` |
| Email already in database | Catch Postgres unique constraint violation (`23505`) from Supabase client | `409 Conflict` with `DUPLICATE_EMAIL` |
| Password with 7 characters | Rejected by Pydantic `min_length=8` constraint | `422 Unprocessable Entity` |
| `user_role` is `"logistics"` | Rejected by Pydantic `Literal["buyer", "merchant"]` constraint | `422 Unprocessable Entity` |
| `user_role` is arbitrary string (e.g. `"admin"`) | Rejected by Pydantic `Literal["buyer", "merchant"]` constraint | `422 Unprocessable Entity` |
| Display name is empty or only whitespace | Stripped and rejected by Pydantic string validation | `422 Unprocessable Entity` |
| Supabase database connection down | Catch connection/client error, log failure, return 500 error envelope without exposing trace | `500 Internal Server Error` |

---

## 8. Out of Scope

- ❌ JWT generation and token issuance on registration (handled upon login in Spec 002).
- ❌ Automatic login / cookie setting after registration (user is redirected to `/login` per roadmap Step 2.4).
- ❌ Email verification links or verification codes (simulated learning project per constitution §1).
- ❌ Registration of Logistics role (assigned internally per constitution §2).
- ❌ Address collection at registration time (collected during checkout in Phase 5).
- ❌ Application-side generation or provision of `id` and `created_at` (handled exclusively by Supabase defaults).
- ❌ Frontend UI components or pages (handled in Spec 004).

---

## 9. Constitution Compliance

- ✅ **§2 User Roles**: Allows only `buyer` and `merchant` self-registration; prevents `logistics` account creation.
- ✅ **§4.1 Strict Backend Separation**: All registration logic, hashing, and database persistence reside in FastAPI.
- ✅ **§4.2 Custom Authentication**: Does not use Supabase Auth; stores email and hashed password directly in the `users` table.
- ✅ **§4.2 Password Hashing**: Uses `argon2` via `argon2-cffi` for password hashing.
- ✅ **§4.3 API Communication**: Endpoint is prefixed with `/api/v1/auth/register`, tagged with `Auth`, has descriptive `summary` and `description`, and uses strictly typed Pydantic models.
- ✅ **§4.4 Standard Error Envelope**: Errors follow `{"error": {"code": "...", "message": "..."}}`.
- ✅ **§5 Database Schema**: Targets pre-existing `users` table columns (`id`, `created_at`, `user_role`, `display_name`, `email`, `password_hash`, `address`).
- ✅ **§7 Naming Conventions**: Python files use `snake_case`, endpoint URLs use `kebab-case`.
- ✅ **§14 Testing**: Comprehensive Pytest coverage required for all success and error scenarios.

---

## 10. Open Questions

- None. All requirements, constraints, and error codes are fully defined.
