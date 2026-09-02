# Spec: Monorepo Scaffolding

> **Roadmap Reference**: Phase 1, Step 1.1 — Initialize the full monorepo
> **Date**: 2026-09-02
> **Status**: Draft

---

## 1. Overview

This is the foundational step for the entire Kalano project. We scaffold a
monorepo containing a **Next.js 15.x frontend** and a **FastAPI backend**, both
fully configured with their respective tooling, linting, formatting, testing,
and environment setup. No business logic is implemented — this step purely
establishes the project skeleton, verifies both apps start locally, and provides
a health-check endpoint with tests as a smoke test for the backend.

---

## 2. Functional Requirements

### 2.1 — Frontend Scaffolding (Next.js)

- [ ] Initialize a Next.js 15.x app inside `frontend/` using `create-next-app`
      with App Router, TypeScript (strict mode), and TailwindCSS.
- [ ] Use `pnpm` as the package manager.
- [ ] Install and configure **shadcn/ui** (New York style, base preset).
- [ ] Install **TanStack Query** (`@tanstack/react-query`) and set up a
      `QueryClientProvider` in the root layout.
- [ ] Install **Zod** for runtime schema validation.
- [ ] Install and configure **Vitest** for testing.
- [ ] Configure **ESLint** (Next.js default config) and **Prettier**.
- [ ] Create `frontend/.env.example` with placeholder values for:
  - `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [ ] Create `frontend/.env.local` in `.gitignore`.
- [ ] Set up the `@/*` import alias for clean imports.
- [ ] Create a minimal root layout (`app/layout.tsx`) and home page
      (`app/page.tsx`) that renders a placeholder.

### 2.2 — Backend Scaffolding (FastAPI)

- [ ] Initialize a Python project inside `backend/` using `uv` with
      `pyproject.toml`.
- [ ] Target **Python 3.12+**.
- [ ] Install dependencies: `fastapi`, `uvicorn[standard]`, `supabase`,
      `python-jose[cryptography]`, `argon2-cffi`, `pydantic`,
      `pydantic-settings`.
- [ ] Install dev dependencies: `pytest`, `pytest-asyncio`, `httpx` (for test
      client), `ruff`.
- [ ] Create the directory structure:
  - `backend/app/__init__.py`
  - `backend/app/main.py` — FastAPI app instance with CORS middleware
  - `backend/app/routers/__init__.py`
  - `backend/app/routers/health.py` — Health-check router
  - `backend/app/models/__init__.py`
  - `backend/app/services/__init__.py`
  - `backend/app/dependencies/__init__.py`
  - `backend/app/dependencies/database.py` — Supabase client utility
  - `backend/app/dependencies/config.py` — Settings via pydantic-settings
  - `backend/app/utils/__init__.py`
  - `backend/tests/__init__.py`
  - `backend/tests/conftest.py` — Shared test fixtures
  - `backend/tests/test_health.py` — Health endpoint tests
- [ ] Configure **Ruff** for linting and formatting in `pyproject.toml`.
- [ ] Create `backend/.env.example` with placeholder values for:
  - `SUPABASE_URL=https://your-project.supabase.co`
  - `SUPABASE_KEY=your-anon-key`
  - `JWT_SECRET_KEY=your-secret-key`
  - `JWT_ALGORITHM=HS256`
  - `JWT_EXPIRATION_MINUTES=60`
  - `FRONTEND_URL=http://localhost:3000`

### 2.3 — FastAPI App Configuration

- [ ] Create the FastAPI app instance with title `"Kalano API"`, description,
      and version `"0.1.0"`.
- [ ] Add CORS middleware allowing the frontend origin
      (`http://localhost:3000`), with `allow_credentials=True`,
      `allow_methods=["*"]`, `allow_headers=["*"]`.
- [ ] Register the health-check router.

### 2.4 — Supabase Client Utility

- [ ] Create a function `get_supabase_client()` in
      `backend/app/dependencies/database.py` that:
  - Reads `SUPABASE_URL` and `SUPABASE_KEY` from environment/settings.
  - Returns a configured Supabase client instance.
  - Uses a module-level singleton pattern (create once, reuse).

### 2.5 — Health-Check Endpoint

- [ ] Create `GET /api/v1/health`.
- [ ] The endpoint checks Supabase connectivity by executing a lightweight
      query (e.g., selecting from `users` with `limit 0`, or using the Supabase
      REST health check).
- [ ] Return a JSON response indicating service health:
  - `{"status": "healthy", "database": "connected"}` on success.
  - `{"status": "degraded", "database": "disconnected", "error": "..."}` if
    Supabase is unreachable.
- [ ] Always return HTTP `200` — the `status` field differentiates healthy vs
      degraded.

### 2.6 — Root-Level Configuration

- [ ] Create/update the root `.gitignore` with entries for: `.env`, `.env.local`,
      `node_modules/`, `__pycache__/`, `.venv/`, `.next/`, `dist/`, `.ruff_cache/`.
- [ ] Ensure the root `README.md` is preserved (already exists).

---

## 3. Acceptance Criteria

- [ ] AC1: Running `pnpm dev` inside `frontend/` starts the Next.js dev server
      on port 3000 without errors.
- [ ] AC2: Running `uv run uvicorn app.main:app --reload` inside `backend/`
      starts the FastAPI server on port 8000 without errors.
- [ ] AC3: `GET http://localhost:8000/api/v1/health` returns a valid JSON
      response with `status` field.
- [ ] AC4: FastAPI's auto-generated docs are accessible at
      `http://localhost:8000/docs`.
- [ ] AC5: Running `pnpm lint` in `frontend/` completes with no errors.
- [ ] AC6: Running `ruff check .` in `backend/` completes with no errors.
- [ ] AC7: Running `ruff format --check .` in `backend/` completes with no
      changes needed.
- [ ] AC8: Running `pytest` in `backend/` passes all health-check tests.
- [ ] AC9: The `frontend/.env.example` and `backend/.env.example` files exist
      with documented placeholder values.
- [ ] AC10: `.gitignore` correctly excludes `.env`, `node_modules`,
      `__pycache__`, `.venv`.

---

## 4. API Contract

### `GET /api/v1/health`

**Summary**: Check the health of the Kalano API and its database connection.

**Tags**: `System`

**Request Body**: None

**Success Response** (`200` — healthy):
```json
{
  "status": "healthy",
  "database": "connected"
}
```

**Success Response** (`200` — degraded):
```json
{
  "status": "degraded",
  "database": "disconnected",
  "error": "string — description of the connection error"
}
```

**Pydantic Response Model**: `HealthResponse`
- `status`: `str` — `"healthy"` or `"degraded"`
- `database`: `str` — `"connected"` or `"disconnected"`
- `error`: `Optional[str]` — error message if database is disconnected

---

## 5. UI/UX Requirements

- **Page/Route**: `/` (home page)
- **Layout**: Minimal placeholder page with the text "Kalano" and a brief
  tagline. No navigation, no styling beyond TailwindCSS defaults. This is purely
  to verify the frontend starts correctly.
- **States**: N/A — static content only at this stage.

---

## 6. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Supabase credentials are missing or invalid | Health endpoint returns `{"status": "degraded", "database": "disconnected", "error": "..."}` — does NOT crash the server. |
| Supabase is down or unreachable | Same as above — graceful degradation. |
| `.env` file is missing entirely | Backend should fail to start with a clear error message from pydantic-settings validation. |
| Frontend can't reach the backend (CORS) | CORS middleware is configured to allow `http://localhost:3000`. |

---

## 7. Out of Scope

- ❌ Authentication endpoints (Phase 2)
- ❌ Any business logic or data models beyond health check
- ❌ Database migrations or table creation (schema is predefined in Supabase)
- ❌ Production deployment configuration (Docker, CI/CD)
- ❌ Frontend component library beyond shadcn/ui initialization
- ❌ Mobile responsive design
- ❌ Any Supabase JS client usage in the frontend

---

## 8. Constitution Compliance

- ✅ §4.1 — Frontend is a thin client; no backend logic in Next.js.
- ✅ §4.2 — No Supabase Auth; custom auth will be added in Phase 2.
- ✅ §4.3 — API prefix `/api/v1/` used for the health endpoint.
- ✅ §4.3 — Pydantic model with field descriptions for the health response.
- ✅ §4.5 — `.env.example` files created for both frontend and backend.
- ✅ §6 — Repository structure follows the defined monorepo layout.
- ✅ §7 — Naming conventions followed (snake_case for Python, kebab-case for
  frontend files).
- ✅ §14 — Health-check endpoint has pytest tests.
- ✅ §17 — No Supabase JS client imported in the frontend.

---

## 9. Open Questions

- None — all questions resolved during planning.
