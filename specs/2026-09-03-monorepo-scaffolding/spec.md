# Spec: Monorepo Scaffolding & Initial Setup

> **Roadmap Reference**: Phase 1, Step 1.1 — Initialize the full monorepo  
> **Branch**: `feat/monorepo-scaffolding`  
> **Date**: 2026-09-03  
> **Status**: Ready for Implementation  

---

## 1. Overview

Kalano is a multi-vendor e-commerce platform built with a decoupled architecture: a **Next.js (App Router) frontend** as a thin client and a **FastAPI backend** handling all business logic, database communication with Supabase, and authentication.

This feature covers **Phase 1, Step 1.1** of the development roadmap. It establishes the full monorepo skeleton, root workspace orchestration via pnpm, standard linting/formatting pipelines (ESLint/Prettier for frontend, Ruff for backend), testing configurations (Vitest for frontend, Pytest for backend), a verified `GET /api/v1/health` endpoint with unit tests, and environment templates.

No e-commerce business logic is implemented in this step. Its sole purpose is to provide a robust, clean, and fully tested developer foundation for all subsequent phases.

---

## 2. Functional Requirements

### 2.1 — Monorepo Root & Workspace Orchestration
- [ ] Maintain a root `.gitignore` excluding all environment files, caches, build outputs, and virtual environments (`.env*`, `node_modules/`, `.next/`, `__pycache__/`, `.venv/`, `.pytest_cache/`, `.ruff_cache/`).
- [ ] Create a root `pnpm-workspace.yaml` declaring the frontend package.
- [ ] Create a root `package.json` with helper scripts delegating tasks across frontend and backend:
  - `pnpm dev` — starts Next.js frontend dev server.
  - `pnpm dev:backend` — runs FastAPI backend via `uv run uvicorn`.
  - `pnpm lint` — runs frontend ESLint and backend Ruff check.
  - `pnpm format` — runs frontend Prettier and backend Ruff format.
  - `pnpm test` — runs Vitest in frontend and Pytest in backend.

### 2.2 — Frontend Scaffolding (Next.js)
- [ ] Initialize a Next.js (latest 15.x) application in `frontend/` with TypeScript (strict mode) and Tailwind CSS using App Router.
- [ ] Use `pnpm` as the package manager for `frontend/`.
- [ ] Initialize **shadcn/ui** with slate/neutral theme and CSS variables. Pre-install base UI components: `button`, `input`, `card`.
- [ ] Install **Lucide React** (`lucide-react`) for standard UI icons.
- [ ] Install and configure **TanStack Query** (`@tanstack/react-query`) with client provider wrapper in `frontend/lib/providers.tsx` and attach it to the root layout `frontend/app/layout.tsx`.
- [ ] Install **Zod** for schema validation.
- [ ] Configure **Vitest** with `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` for client unit testing.
- [ ] Configure **ESLint** and **Prettier** with formatting script in `frontend/package.json`.
- [ ] Create `frontend/.env.example` defining `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- [ ] Replace default page with a clean placeholder showing the platform name ("Kalano"), subtitle, and sample shadcn UI elements.

### 2.3 — Backend Scaffolding (FastAPI & uv)
- [ ] Initialize a Python project in `backend/` using `uv` with `pyproject.toml` targeting **Python 3.12**.
- [ ] Install runtime dependencies:
  - `fastapi`
  - `uvicorn[standard]`
  - `supabase` (Python client)
  - `python-jose[cryptography]`
  - `argon2-cffi`
  - `pydantic`
  - `pydantic-settings`
- [ ] Install development dependencies:
  - `pytest`
  - `pytest-asyncio`
  - `httpx` (for FastAPI `TestClient`)
  - `ruff`
- [ ] Create backend directory structure matching §6 of the Constitution:
  - `backend/app/main.py`
  - `backend/app/routers/`
  - `backend/app/models/`
  - `backend/app/services/`
  - `backend/app/dependencies/`
  - `backend/app/utils/`
  - `backend/tests/`
- [ ] Configure **Ruff** in `pyproject.toml` with line length 100 and standard rules.
- [ ] Create `backend/.env.example` with placeholders for:
  - `SUPABASE_URL=https://your-project.supabase.co`
  - `SUPABASE_KEY=your-anon-key`
  - `JWT_SECRET_KEY=your-secret-key-at-least-32-chars`
  - `JWT_ALGORITHM=HS256`
  - `JWT_EXPIRATION_MINUTES=60`
  - `FRONTEND_URL=http://localhost:3000`

### 2.4 — FastAPI App Configuration & CORS
- [ ] Create the FastAPI app instance in `backend/app/main.py` with `title="Kalano API"`, `version="0.1.0"`, and custom description.
- [ ] Add `CORSMiddleware` configured with `allow_origins=[settings.frontend_url]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.
- [ ] Ensure OpenAPI docs are accessible at `/docs` with grouped tags.

### 2.5 — Supabase Client & Settings Dependency
- [ ] Create `backend/app/dependencies/config.py` using `pydantic-settings` with default fallback to `.env`.
- [ ] Create `backend/app/dependencies/database.py` with a singleton `get_supabase_client()` returning the authenticated Supabase Client.

### 2.6 — Health Check Endpoint & Testing
- [ ] Implement `GET /api/v1/health` in `backend/app/routers/health.py` with OpenAPI tags `["System"]`.
- [ ] The endpoint attempts a lightweight probe against Supabase (`client.table("users").select("id", count="exact").limit(0).execute()`).
- [ ] Return HTTP 200 with status model:
  - `{"status": "healthy", "database": "connected"}` when reachable.
  - `{"status": "degraded", "database": "disconnected", "error": "..."}` when connection fails.
- [ ] Implement unit tests in `backend/tests/test_health.py` covering healthy, degraded, and response schema checks using `pytest` and `httpx`.

---

## 3. Acceptance Criteria

- [ ] **AC1**: Running `pnpm dev` or `pnpm --filter frontend dev` boots Next.js at `http://localhost:3000` without errors.
- [ ] **AC2**: Running `pnpm dev:backend` or `cd backend && uv run uvicorn app.main:app --port 8000` boots FastAPI at `http://localhost:8000` without errors.
- [ ] **AC3**: `GET http://localhost:8000/api/v1/health` responds with HTTP 200 and a JSON body containing `status` and `database`.
- [ ] **AC4**: FastAPI OpenAPI Swagger UI is available at `http://localhost:8000/docs`.
- [ ] **AC5**: Running `ruff check .` and `ruff format --check .` in `backend/` passes with 0 errors.
- [ ] **AC6**: Running `pytest` in `backend/` executes and passes all health-check tests.
- [ ] **AC7**: Running `pnpm lint` in `frontend/` passes with 0 lint errors.
- [ ] **AC8**: Running `pnpm test` in `frontend/` executes Vitest successfully.
- [ ] **AC9**: Base shadcn/ui components (`button`, `input`, `card`) exist in `frontend/components/ui/` and compile without errors.
- [ ] **AC10**: `frontend/.env.example` and `backend/.env.example` exist with all required configuration keys documented.
- [ ] **AC11**: Git ignores all local environment files (`.env`, `.env.local`), build folders (`.next`), virtualenvs (`.venv`), and cache folders (`__pycache__`, `.pytest_cache`, `.ruff_cache`).
- [ ] **AC12**: Root workspace scripts (`pnpm dev`, `pnpm lint`, `pnpm format`, `pnpm test`) run as expected.

---

## 4. API Contract

### `GET /api/v1/health`

**Summary**: System Health and Database Connectivity Probe  
**Description**: Checks whether the FastAPI service is running and verifies connectivity to Supabase. Returns `status="healthy"` when the database responds, or `status="degraded"` with error details if the database is unreachable. Always returns HTTP 200.  
**Tags**: `System`  

#### Request Body
None.

#### Responses

**Success Response (Healthy)** (`200 OK`):
```json
{
  "status": "healthy",
  "database": "connected",
  "error": null
}
```

**Degraded Response (Database Unreachable)** (`200 OK`):
```json
{
  "status": "degraded",
  "database": "disconnected",
  "error": "Error details explaining failure"
}
```

#### Pydantic Model (`HealthResponse`)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `str` | Yes | `"healthy"` or `"degraded"` |
| `database` | `str` | Yes | `"connected"` or `"disconnected"` |
| `error` | `Optional[str]` | No | Detailed error string when degraded |

---

## 5. UI/UX Requirements

- **Page/Route**: `/` (Home page)
- **Layout**: Clean, centered desktop-first card layout using shadcn/ui and TailwindCSS.
  - Platform heading: "Kalano"
  - Subtitle: "A modern multi-vendor marketplace"
  - Card preview with sample shadcn `Button` and `Input` demonstrating working UI component integration.
  - Status indicator displaying connection state to backend API.
- **Theme**: Slate / neutral theme with CSS variables enabled.
- **States**: Static placeholder with responsive container.

---

## 6. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Supabase credentials missing or invalid | Health check catches exception and returns `status="degraded"`, `database="disconnected"`. Server stays alive. |
| Supabase service offline or timing out | Health check catches timeout/exception, logs warning, and returns HTTP 200 with degraded status. |
| Missing backend `.env` variables | `pydantic-settings` provides clear startup validation error indicating which environment variable is missing. |
| CORS origin mismatch from frontend | Fast, standardized 403 / CORS preflight block; easily configurable via `FRONTEND_URL` in `.env`. |
| Cross-platform path differences (Windows vs Unix) | Python imports and Next.js aliases configured strictly using forward slashes / path resolution. |

---

## 7. Out of Scope

- ❌ Real user registration or login endpoints (Phase 2).
- ❌ Supabase table creation or migrations (schema is predefined).
- ❌ Product browsing, search, or cart flows (Phases 3–5).
- ❌ Merchant or Logistics dashboards (Phases 6–7).
- ❌ Supabase JS client in frontend (strictly forbidden by Constitution §4.1).

---

## 8. Constitution Compliance

- ✅ **§3 & §6 Tech Stack & Monorepo Structure**: Next.js App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query, Vitest in `frontend/`; FastAPI, uv, Python 3.12, Supabase-py, argon2, Pytest, Ruff in `backend/`.
- ✅ **§4.1 Strict Backend Separation**: Frontend communicates only via REST to FastAPI; zero Supabase JS client in frontend.
- ✅ **§4.3 API Communication**: Endpoint prefixed with `/api/v1/health`, OpenAPI tags, summary, and description.
- ✅ **§4.4 Error Handling**: Models and responses adhere to consistent data structures.
- ✅ **§4.5 Environment & Configuration**: `.env` gitignored, `.env.example` templates committed.
- ✅ **§7 Naming Conventions**: `kebab-case` for frontend files, `snake_case` for Python files/functions.
- ✅ **§14 Testing**: Pytest suite implemented for backend health endpoint; Vitest setup verified for frontend.
- ✅ **§17 Rules for AI Agents**: Predefined Supabase schema respected; no database migration files created.

---

## 9. Open Questions

- None. All requirements and preferences (root pnpm workspace, Python 3.12, slate shadcn styling) confirmed.
