# Tasks: Monorepo Scaffolding & Initial Setup

> **Spec**: `specs/2026-09-03-monorepo-scaffolding/spec.md`  
> **Plan**: `specs/2026-09-03-monorepo-scaffolding/plan.md`  
> **Branch**: `feat/monorepo-scaffolding`  
> **Date**: 2026-09-03  
> **Status**: In Progress  

---

## Legend

- `[SEQUENTIAL]` — Must be completed in order; subsequent tasks depend on this output.
- `[PARALLEL]` — Can be executed simultaneously with other parallel tasks in the same batch.
- `[SUBAGENT]` — Suitable for delegation to a specialized or background subagent.

---

## Batch 1: Root Workspace Foundation `[SEQUENTIAL]`

### Task 1.1 — Create Root Monorepo Configuration Files

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `.gitignore`
  - Create: `pnpm-workspace.yaml`
  - Create: `package.json`
- **Description**:
  1. Create the root `.gitignore` containing exclusions for:
     - Local environments: `.env`, `.env*.local`, `.env.development`, `.env.test`, `.env.production` (allow `!.env.example`).
     - Frontend: `node_modules/`, `.next/`, `out/`, `dist/`, `.pnpm-store/`.
     - Backend: `__pycache__/`, `*.py[cod]`, `.venv/`, `env/`, `venv/`, `.pytest_cache/`, `.ruff_cache/`.
     - IDE/OS: `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`, `*.log`.
  2. Create `pnpm-workspace.yaml`:
     ```yaml
     packages:
       - "frontend"
     ```
  3. Create root `package.json` with scripts:
     ```json
     {
       "name": "kalano-monorepo",
       "version": "0.1.0",
       "private": true,
       "scripts": {
         "dev": "pnpm --filter frontend dev",
         "dev:backend": "cd backend && uv run uvicorn app.main:app --reload --port 8000",
         "build": "pnpm --filter frontend build",
         "lint": "pnpm --filter frontend lint && cd backend && uv run ruff check .",
         "format": "pnpm --filter frontend format && cd backend && uv run ruff format .",
         "test": "pnpm --filter frontend test && cd backend && uv run pytest"
       }
     }
     ```
- **Done when**: `.gitignore`, `pnpm-workspace.yaml`, and `package.json` exist in project root.

---

## Batch 2: Project Scaffolding `[PARALLEL]`

### Task 2.1 — Initialize Next.js Frontend `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create directory: `frontend/`
  - Create: `frontend/package.json`
  - Create: `frontend/tsconfig.json`
  - Create: `frontend/tailwind.config.ts` (or Tailwind v4 config)
  - Create: `frontend/app/layout.tsx`
  - Create: `frontend/app/page.tsx`
  - Create: `frontend/.env.example`
- **Description**:
  1. In the project root, run non-interactive `create-next-app` to scaffold `frontend`:
     ```bash
     pnpm create next-app frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --yes
     ```
  2. Verify `frontend/package.json` is created with Next.js, React, React DOM, TailwindCSS, and ESLint.
  3. Create `frontend/.env.example`:
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:8000
     ```
  4. Ensure `frontend/` builds or runs lint without errors.
- **Done when**: `frontend/` directory is scaffolded and `pnpm --filter frontend lint` completes cleanly.

### Task 2.2 — Initialize FastAPI Backend with uv & Ruff `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create directory: `backend/`
  - Create: `backend/pyproject.toml`
  - Create: `backend/.python-version`
  - Create: `backend/.env.example`
  - Create directory tree: `backend/app/`, `backend/tests/`
- **Description**:
  1. Create directory `backend/` and initialize Python project using `uv`:
     ```bash
     cd backend && uv init --app
     ```
  2. Pin Python 3.12:
     ```bash
     cd backend && uv python pin 3.12
     ```
  3. Add production dependencies:
     ```bash
     cd backend && uv add fastapi "uvicorn[standard]" supabase "python-jose[cryptography]" argon2-cffi pydantic pydantic-settings
     ```
  4. Add development dependencies:
     ```bash
     cd backend && uv add --dev pytest pytest-asyncio httpx ruff
     ```
  5. Configure `backend/pyproject.toml` with Ruff settings:
     ```toml
     [tool.ruff]
     line-length = 100
     target-version = "py312"

     [tool.ruff.lint]
     select = ["E", "F", "I", "N", "W"]
     ignore = []

     [tool.pytest.ini_options]
     asyncio_mode = "auto"
     testpaths = ["tests"]
     ```
  6. Create package directories and `__init__.py` files:
     - `backend/app/__init__.py`
     - `backend/app/routers/__init__.py`
     - `backend/app/models/__init__.py`
     - `backend/app/services/__init__.py`
     - `backend/app/dependencies/__init__.py`
     - `backend/app/utils/__init__.py`
     - `backend/tests/__init__.py`
  7. Create `backend/.env.example`:
     ```env
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_KEY=your-anon-key
     JWT_SECRET_KEY=your-secret-key-at-least-32-chars
     JWT_ALGORITHM=HS256
     JWT_EXPIRATION_MINUTES=60
     FRONTEND_URL=http://localhost:3000
     ```
  8. Verify environment using `cd backend && uv run ruff check .`.
- **Done when**: `backend/pyproject.toml` contains all dependencies and directory structure is initialized.

---

## Batch 3: Backend Core Implementation `[SEQUENTIAL]`

### Task 3.1 — Implement Backend Config & Supabase Client

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/dependencies/config.py`
  - Create: `backend/app/dependencies/database.py`
- **Description**:
  1. In `backend/app/dependencies/config.py`, create `Settings` using `pydantic_settings.BaseSettings`:
     - Fields: `supabase_url: str`, `supabase_key: str`, `jwt_secret_key: str`, `jwt_algorithm: str = "HS256"`, `jwt_expiration_minutes: int = 60`, `frontend_url: str = "http://localhost:3000"`.
     - Configure `model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")`.
     - Provide sensible default fallback strings for development so app starts even before `.env` is populated.
     - Instantiate global `settings = Settings()`.
  2. In `backend/app/dependencies/database.py`:
     - Import `Client, create_client` from `supabase` and `settings` from `app.dependencies.config`.
     - Implement module-level singleton `_supabase_client: Client | None = None`.
     - Implement `get_supabase_client() -> Client`: creates client if None and returns it.
- **Done when**: Config and database dependencies can be imported cleanly without syntax or type errors.

### Task 3.2 — Implement Health Pydantic Model & Health Router

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/health.py`
  - Create: `backend/app/routers/health.py`
- **Description**:
  1. In `backend/app/models/health.py`:
     - Define `HealthResponse(BaseModel)` with fields `status: str`, `database: str`, and `error: str | None = None` including descriptions and examples.
  2. In `backend/app/routers/health.py`:
     - Define router `router = APIRouter(prefix="/api/v1", tags=["System"])`.
     - Implement `GET /health` responding with `HealthResponse`.
     - Summarize as `"System Health and Connectivity Check"`.
     - Try executing probe: `client = get_supabase_client()`, `client.table("users").select("id", count="exact").limit(0).execute()`.
     - If successful, return `HealthResponse(status="healthy", database="connected", error=None)`.
     - Catch `Exception as e`, return `HealthResponse(status="degraded", database="disconnected", error=str(e))`.
- **Done when**: Health router and response model adhere strictly to OpenAPI standards (§4.3) and return HTTP 200.

### Task 3.3 — Implement FastAPI Main App with CORS & Router Registration

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/main.py`
- **Description**:
  1. In `backend/app/main.py`:
     - Instantiate `FastAPI` with `title="Kalano API"`, `version="0.1.0"`, `description="Multi-vendor e-commerce platform API for Kalano"`.
     - Add `CORSMiddleware` with `allow_origins=[settings.frontend_url]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.
     - Include health router: `app.include_router(health.router)`.
  2. Test starting the app via command line:
     `cd backend && uv run python -c "from app.main import app; print(app.title)"`
- **Done when**: App instance initializes and health router is included.

---

## Batch 4: Frontend Core & Backend Tests `[PARALLEL]`

### Task 4.1 — Configure shadcn/ui, TanStack Query, Vitest & Home Page `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/lib/query-client.ts`
  - Create: `frontend/lib/providers.tsx`
  - Create: `frontend/vitest.config.ts`
  - Create: `frontend/.prettierrc`
  - Modify: `frontend/package.json`
  - Modify: `frontend/app/layout.tsx`
  - Modify: `frontend/app/page.tsx`
  - Create components in: `frontend/components/ui/`
- **Description**:
  1. Add dependencies in `frontend/`:
     ```bash
     cd frontend && pnpm add @tanstack/react-query zod lucide-react class-variance-authority clsx tailwind-merge
     cd frontend && pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom prettier eslint-config-prettier
     ```
  2. Initialize **shadcn/ui** and install base components (`button`, `input`, `card`):
     ```bash
     cd frontend && pnpm dlx shadcn@latest init -d -c slate
     cd frontend && pnpm dlx shadcn@latest add button input card --yes
     ```
  3. Create `frontend/lib/query-client.ts` exporting `makeQueryClient()`.
  4. Create `frontend/lib/providers.tsx` with `"use client"`, instantiating query client in `useState` and wrapping with `<QueryClientProvider>`.
  5. Create `frontend/vitest.config.ts` configuring `jsdom` environment and `@/*` path alias.
  6. Add `"test": "vitest run"` and `"format": "prettier --write ."` to `frontend/package.json` scripts.
  7. Create `frontend/.prettierrc`:
     ```json
     {
       "semi": true,
       "singleQuote": false,
       "tabWidth": 2,
       "trailingComma": "es5"
     }
     ```
  8. Update `frontend/app/layout.tsx` to wrap children with `<Providers>`.
  9. Update `frontend/app/page.tsx` to render clean centered Kalano welcome screen using shadcn `Card`, `Button`, and `Input`.
  10. Create a smoke test `frontend/__tests__/home.test.tsx` verifying the home page mounts.
  11. Verify `pnpm --filter frontend test` and `pnpm --filter frontend lint` succeed.
- **Done when**: shadcn/ui components exist, providers wrap layout, and frontend tests pass.

### Task 4.2 — Implement Backend Health Pytest Suite `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/conftest.py`
  - Create: `backend/tests/test_health.py`
- **Description**:
  1. In `backend/tests/conftest.py`:
     - Create pytest fixture `client()` yielding `fastapi.testclient.TestClient(app)`.
  2. In `backend/tests/test_health.py`:
     - `test_health_status_code_200`: checks `GET /api/v1/health` returns HTTP 200.
     - `test_health_response_structure`: checks response JSON has `"status"` and `"database"` fields.
     - `test_health_connected_mock`: mock `app.dependencies.database.get_supabase_client` where `.table("users").select("id", count="exact").limit(0).execute()` succeeds. Verify `status == "healthy"` and `database == "connected"`.
     - `test_health_disconnected_mock`: mock `app.dependencies.database.get_supabase_client` to raise `Exception("Connection refused")`. Verify `status == "degraded"`, `database == "disconnected"`, and `error` is present.
  3. Run `cd backend && uv run pytest -v` to verify all 4 tests pass.
- **Done when**: All backend unit tests pass without requiring an external Supabase connection.

---

## Batch 5: Verification & Quality Assurance `[SEQUENTIAL]`

### Task 5.1 — Lint & Format Verification

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and formatters across both projects:
  - Backend: `cd backend && uv run ruff check . && uv run ruff format --check .`
  - Frontend: `pnpm --filter frontend lint`
  - Root: `pnpm lint` and `pnpm format`
- **Done when**: No lint errors or unformatted files exist.

### Task 5.2 — Execute Full Automated Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run full test suites:
  - Frontend: `pnpm --filter frontend test`
  - Backend: `cd backend && uv run pytest -v`
  - Root: `pnpm test`
- **Done when**: All tests across frontend and backend pass with exit code 0.

### Task 5.3 — Local Server Smoke Test

- **Type**: `[SEQUENTIAL]`
- **Description**:
  1. Start backend server: `cd backend && uv run uvicorn app.main:app --port 8000`.
  2. Check `http://localhost:8000/docs` in browser or curl — verify OpenAPI UI loads.
  3. Query `http://localhost:8000/api/v1/health` — verify valid JSON response.
  4. Start frontend server: `pnpm --filter frontend dev`.
  5. Check `http://localhost:3000` — verify Kalano placeholder page loads with shadcn components.
- **Done when**: Both services boot and interact cleanly without CORS or startup errors.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|----------------|---------------------|
| 1. Root Workspace Foundation | 1 | No | 1 |
| 2. Project Scaffolding | 2 | Yes | 2 |
| 3. Backend Implementation | 3 | No | 1 |
| 4. Frontend Core & Tests | 2 | Yes | 2 |
| 5. Verification & QA | 3 | No | 1 |
| **Total** | **11 Tasks** | | **Max 2 Concurrent** |

---

## Git Commit Plan

1. `chore: set up root pnpm workspace, package.json, and gitignore`
2. `chore(frontend): scaffold Next.js app with TypeScript and TailwindCSS`
3. `chore(backend): scaffold FastAPI app with uv, dependencies, and Ruff config`
4. `feat(backend): implement settings config and Supabase client singleton`
5. `feat(backend): implement health check model, router, and main app with CORS`
6. `test(backend): add pytest test suite for health check endpoint`
7. `feat(frontend): configure shadcn/ui, TanStack Query, Vitest, and placeholder page`
8. `test(frontend): add Vitest smoke test for home page`
9. `chore: verify linting, formatting, and end-to-end smoke test`
