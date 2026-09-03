# Spec: User Login Endpoint

> **Roadmap Reference**: Phase 2, Step 2.2 — User login endpoint  
> **Branch**: `feat/authentication`  
> **Spec**: 002 of 006 in phase  
> **Date**: 2026-09-03  
> **Status**: Draft  

---

## 1. Overview

This specification defines the user login endpoint (`POST /api/v1/auth/login`) for the Kalano multi-vendor e-commerce platform. It provides the mechanism for existing registered users (**Buyers** and **Merchants**) to authenticate using their email and password, receive a secure JSON Web Token (JWT), and establish an authenticated session.

Per the Kalano Constitution (§4.2):
- Authentication does not use Supabase Auth; user credentials reside in the custom `users` database table in Supabase.
- Passwords stored as `argon2` hashes are verified during authentication using `argon2-cffi`.
- Upon successful authentication, FastAPI generates a signed JWT access token containing identity claims (`user_id`, `user_role`) and an expiration timestamp (`exp`).
- The JWT is delivered to the client via an **`httpOnly` cookie** named `kalano_token` configured with secure defaults (`httponly=True`, `samesite="lax"`, `secure=False` for local dev, `path="/"`, `max_age=settings.jwt_expiration_minutes * 60`).
- For architectural flexibility (e.g. mobile, testing tools, alternative API consumers), the token is simultaneously returned in the JSON response body (`access_token`, `token_type="bearer"`), along with public user profile data.
- To prevent user enumeration attacks, failures due to non-existent email addresses and failures due to incorrect passwords return identical `401 Unauthorized` responses with error code `INVALID_CREDENTIALS`.
- All API errors conform strictly to the platform's standard error envelope (`{"error": {"code": "...", "message": "..."}}`).

---

## 2. Dependencies

- **Prior Specs**:
  - `specs/001-user-registration-endpoint/`: Provides foundational models (`UserResponse`, `ErrorDetail`, `ErrorResponse`) in `backend/app/models/auth.py`, the authentication router in `backend/app/routers/auth.py`, and the argon2 hasher in `backend/app/services/auth_service.py`.
- **Existing Codebase Foundations**:
  - `backend/app/dependencies/config.py`: Exposes application `settings` including `jwt_secret_key`, `jwt_algorithm`, and `jwt_expiration_minutes`.
  - `backend/app/dependencies/database.py`: Exposes `get_supabase_client()` for database querying.
  - Installed packages: `fastapi`, `pydantic`, `python-jose[cryptography]`, `argon2-cffi`, `supabase`, `pytest`.

---

## 3. Functional Requirements

### 3.1 — Request Payload & Validation

The endpoint must accept an incoming JSON body conforming to `UserLoginRequest`:
- **`email`**: Required string, validated against standard email format. Whitespace must be trimmed and converted to lowercase before database query to match the normalized storage format established in Spec 001.
- **`password`**: Required plaintext password string. Must not be empty.
- Missing or malformed fields must be rejected by FastAPI/Pydantic with an HTTP `422 Unprocessable Entity` response.

### 3.2 — User Lookup & Credential Verification

1. The service layer must look up the user record by the normalized email in the `users` table:
   ```python
   supabase_client.table("users").select("*").eq("email", normalized_email).execute()
   ```
2. If no record matches the email address, authentication fails immediately.
3. If a record is found, the provided plaintext password must be verified against the stored `password_hash` using `argon2.PasswordHasher().verify(stored_hash, password)`.
4. If the hash verification fails (raises `argon2.exceptions.VerifyMismatchError`, `VerificationError`, or `InvalidHashError`), authentication fails.
5. In both failure conditions (non-existent email or wrong password), the service returns `None`, and the router returns HTTP `401 Unauthorized` with error code `INVALID_CREDENTIALS`. Internal details (such as whether the email existed) are strictly shielded.

### 3.3 — JWT Access Token Generation

Upon successful authentication:
1. A JWT access token must be encoded using `jose.jwt.encode`.
2. Token payload claims:
   - **`user_id`**: String representation of the user's UUID (from `users.id`).
   - **`user_role`**: String representation of the user's role (`"buyer"`, `"merchant"`, or `"logistics"`).
   - **`exp`**: UNIX timestamp representing token expiration, calculated as current UTC time plus `settings.jwt_expiration_minutes` (`datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)`).
3. Secret key and algorithm:
   - Key: `settings.jwt_secret_key`
   - Algorithm: `settings.jwt_algorithm` (default `"HS256"`)

### 3.4 — httpOnly Cookie Setting

The endpoint must set an `httpOnly` session cookie on the outgoing HTTP response via `response.set_cookie(...)`:
- **`key`**: `"kalano_token"`
- **`value`**: The generated JWT string
- **`httponly`**: `True` (prevents JavaScript access, mitigating XSS token theft)
- **`samesite`**: `"lax"` (provides CSRF protection for standard top-level navigations)
- **`secure`**: `False` (for local development; configurable for HTTPS in production)
- **`max_age`**: `settings.jwt_expiration_minutes * 60` (integer seconds matching token validity)
- **`path`**: `"/"` (accessible across all API and application paths)

### 3.5 — Success Response Payload

The endpoint must return an HTTP `200 OK` status code with a JSON payload conforming to `LoginResponse`:
- **`access_token`**: The generated JWT string.
- **`token_type`**: `"bearer"`.
- **`user`**: The authenticated user's public profile (`UserResponse` from Spec 001):
  - `id`: UUID string
  - `created_at`: Datetime string (ISO 8601)
  - `email`: User's email string
  - `display_name`: User's public display name
  - `user_role`: `"buyer"` or `"merchant"`
  - `address`: Address string or `None`
- **Security Check**: The `password_hash` column MUST NEVER be included in `LoginResponse` or `UserResponse`.

---

## 4. Acceptance Criteria

- [ ] **AC1 — Successful Login (Status 200)**: Submitting valid credentials for an existing user returns HTTP `200 OK` with `access_token`, `token_type: "bearer"`, and populated `user` object.
- [ ] **AC2 — httpOnly Cookie Set**: The response includes a `set-cookie` header with cookie name `kalano_token`, value equal to `access_token`, and flags `HttpOnly`, `SameSite=lax`, `Path=/`, and `Max-Age` matching token expiration in seconds.
- [ ] **AC3 — JWT Claims Verification**: Decoding the issued JWT reveals `user_id` equal to the user's UUID, `user_role` matching the user's role, and an `exp` expiration timestamp valid for `settings.jwt_expiration_minutes` from issuance.
- [ ] **AC4 — Incorrect Password Rejection (Status 401)**: Submitting an existing email with an incorrect password returns HTTP `401 Unauthorized` with envelope `{"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."}}`.
- [ ] **AC5 — Non-existent User Rejection (Status 401)**: Submitting an email that does not exist in the database returns HTTP `401 Unauthorized` with identical envelope `{"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."}}`.
- [ ] **AC6 — No Cookie on Failure**: Neither 401 nor 422 error responses contain a `set-cookie` header for `kalano_token`.
- [ ] **AC7 — Email Normalization**: Submitting an email with mixed casing (e.g. `User@EXAMPLE.com`) or whitespace successfully matches the normalized lowercase email in the database.
- [ ] **AC8 — Missing Fields Validation (Status 422)**: Omitting `email` or `password` returns HTTP `422 Unprocessable Entity`.
- [ ] **AC9 — Sensitive Data Exclusion**: The response body does not include `password_hash` or plaintext `password`.
- [ ] **AC10 — OpenAPI Documentation**: The endpoint is documented at `/docs` under the `Auth` tag with full request/response schemas, summary, description, and status codes (200, 401, 422).

---

## 5. API Contract

### `POST /api/v1/auth/login`

**Summary**: Log in user  
**Description**: Authenticates a user with email and password. Verifies argon2 hash, issues a signed JWT access token, attaches it as an httpOnly cookie (`kalano_token`), and returns token details with user profile in the response body.  
**Tags**: `["Auth"]`  

#### Request Body (`application/json`)

```json
{
  "email": "buyer@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `email` | string | Yes | Valid email format | The registered user's email address |
| `password` | string | Yes | Non-empty string | The plaintext password |

#### Success Response (`200 OK`)

**Response Headers**:
```http
Set-Cookie: kalano_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Max-Age=3600; Path=/; SameSite=lax; HttpOnly
```

**Response Body (`application/json`)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTRiMDFlM2UtN2E0Mi00ZjFiLThjMjktMzNiNmQwODBiMDkxIiwidXNlcl9yb2xlIjoiYnV5ZXIiLCJleHAiOjE3MjU0MDkyMDB9...",
  "token_type": "bearer",
  "user": {
    "id": "e4b01e3e-7a42-4f1b-8c29-33b6d080b091",
    "created_at": "2026-09-03T12:00:00Z",
    "email": "buyer@example.com",
    "display_name": "Jane Doe",
    "user_role": "buyer",
    "address": null
  }
}
```

| Field | Type | Description |
|---|---|---|
| `access_token` | string | Signed JWT access token |
| `token_type` | string | Authorization scheme identifier, always `"bearer"` |
| `user` | object | Authenticated user's public profile (`UserResponse`) |
| `user.id` | UUID string | Unique user identifier |
| `user.created_at` | datetime (ISO 8601) | Account creation timestamp |
| `user.email` | string | User email address |
| `user.display_name` | string | User public display name |
| `user.user_role` | string | User role (`"buyer"` or `"merchant"`) |
| `user.address` | string or null | User delivery/contact address |

#### Error Responses

| HTTP Status | Error Code | Description / Scenario | Response Shape |
|---|---|---|---|
| `401 Unauthorized` | `INVALID_CREDENTIALS` | Invalid email or incorrect password | Standard error envelope |
| `422 Unprocessable Entity` | Pydantic validation error | Missing or malformed `email` or `password` | FastAPI default validation details |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Database connectivity or unexpected server error | Standard error envelope |

**401 Unauthorized Example**:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
}
```

---

## 6. UI/UX Requirements

This specification covers the backend API endpoint (`POST /api/v1/auth/login`).  
The frontend login interface is specified and implemented in **Spec 005** (`specs/005-frontend-login-page/`).  
Key integration aspects:
- Browser clients automatically persist the `kalano_token` httpOnly cookie returned in the `Set-Cookie` header.
- Cross-origin requests from the frontend (`localhost:3000`) to the backend (`localhost:8000`) require `credentials: "include"` in `fetch` requests. The backend CORS middleware already configures `allow_credentials=True` and `allow_origins=[settings.frontend_url]`.
- The frontend will also read user data from the response body to immediately populate user context without an extra round-trip.

---

## 7. Edge Cases & Error Handling

| Scenario | Handling Strategy | Expected Status Code & Payload |
|---|---|---|
| Email exists, password matches | Generate JWT, set httpOnly cookie, return token and user profile | `200 OK` |
| Email exists, password does not match | Return generic invalid credentials error to prevent timing/oracle leaks | `401 Unauthorized` with `INVALID_CREDENTIALS` |
| Email does not exist in database | Return generic invalid credentials error (same message and code) | `401 Unauthorized` with `INVALID_CREDENTIALS` |
| Email has leading/trailing whitespace or uppercase letters | Strip whitespace and convert to lowercase before database query | Matches user; `200 OK` if password matches |
| Missing `email` field | FastAPI/Pydantic validation fails | `422 Unprocessable Entity` |
| Missing `password` field | FastAPI/Pydantic validation fails | `422 Unprocessable Entity` |
| Stored `password_hash` is corrupted or invalid | Argon2 raises `InvalidHashError`; catch and treat as verification failure | `401 Unauthorized` with `INVALID_CREDENTIALS` |
| Supabase database is unreachable | Catch exception, log error, return platform-standard 500 error envelope | `500 Internal Server Error` |

---

## 8. Out of Scope

- ❌ Frontend login page and UI form components (handled in Spec 005).
- ❌ Auth dependency (`get_current_user`) and `GET /api/v1/auth/me` endpoint (handled in Spec 003).
- ❌ Next.js route protection middleware (handled in Spec 006).
- ❌ Refresh tokens or token rotation (simulated learning project; single access token per constitution §4.2).
- ❌ Password reset / "Forgot Password" workflow (out of scope per roadmap and constitution §1).
- ❌ Multi-factor authentication (MFA) or account lockout mechanisms.

---

## 9. Constitution Compliance

- ✅ **§4.1 Strict Backend Separation**: Authentication logic, Argon2 verification, token creation, and cookie setting reside entirely in FastAPI.
- ✅ **§4.2 Custom Authentication**: Does not use Supabase Auth; queries custom `users` table directly.
- ✅ **§4.2 Argon2 Password Verification**: Uses `argon2-cffi` to verify passwords against stored hashes.
- ✅ **§4.2 JWT in httpOnly Cookie**: Issues JWT signed with secret key and attaches via `httpOnly` cookie (`kalano_token`) with `samesite="lax"` and matching `max_age`.
- ✅ **§4.3 API Communication**: Endpoint is prefixed with `/api/v1/auth/login`, tagged with `Auth`, has explicit `summary` and `description`, and uses strongly typed Pydantic models.
- ✅ **§4.4 Standard Error Envelope**: All API error responses adhere to `{"error": {"code": "...", "message": "..."}}`.
- ✅ **§7 Naming Conventions**: Python functions and variables use `snake_case`, Pydantic models use `PascalCase`, and endpoint URL uses `kebab-case`.
- ✅ **§14 Testing**: Comprehensive Pytest coverage verifying success, wrong password, non-existent user, missing fields, and cookie presence.

---

## 10. Open Questions

- None. Requirements, cookie configuration, security parameters, and error behavior are fully specified.
