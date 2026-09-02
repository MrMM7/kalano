# Tasks: Monorepo Scaffolding

> **Spec**: `specs/2026-09-02-monorepo-scaffolding/spec.md`
> **Plan**: `specs/2026-09-02-monorepo-scaffolding/plan.md`
> **Date**: 2026-09-02
> **Status**: Draft

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in
  the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Batch 1: Prerequisites & Root Config `[SEQUENTIAL]`

_Verify tooling is available and set up root-level configuration._

### Task 1.1 — Verify prerequisites

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - None (verification only)
- **Description**:
  1. Run `pnpm --version` and verify pnpm is installed.
  2. Run `uv --version` and verify uv is installed.
  3. Run `node --version` and verify Node.js 18+ is installed.
  4. Run `python --version` and verify Python 3.12+ is installed.
- **Done when**: All four commands return valid version numbers meeting minimum
  requirements.

### Task 1.2 — Create root `.gitignore`

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `.gitignore`
- **Description**:
  Create a comprehensive `.gitignore` at the repository root with entries for:
  ```
  # Environment
  .env
  .env.local
  .env*.local

  # Python
  __pycache__/
  *.py[cod]
  .venv/
  .ruff_cache/

  # Node
  node_modules/
  .next/
  dist/
  out/

  # IDE
  .vscode/
  .idea/

  # OS
  .DS_Store
  Thumbs.db
  ```
- **Done when**: `.gitignore` file exists at the repo root with all entries.

---

## Batch 2: Scaffold Frontend & Backend `[PARALLEL]`

_These two tasks are completely independent and can run simultaneously._

### Task 2.1 — Scaffold Next.js frontend `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/` (entire directory via `create-next-app`)
  - Create: `frontend/.env.example`
- **Description**:
  1. Run `pnpm create next-app@latest frontend --yes --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack` from the repo root.
  2. Verify the generated project structure.
  3. Create `frontend/.env.example`:
     ```
     # API Configuration
     NEXT_PUBLIC_API_URL=http://localhost:8000
     ```
  4. Verify `pnpm dev` starts without errors (start, check it compiles, then stop).
  5. Verify `pnpm lint` passes.
- **Done when**: `frontend/` directory exists with a working Next.js app. `pnpm dev`
  starts on port 3000. `pnpm lint` passes.

### Task 2.2 — Scaffold FastAPI backend `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/pyproject.toml`
  - Create: `backend/app/__init__.py`
  - Create: `backend/app/main.py` (minimal — just `app = FastAPI()`)
  - Create: `backend/app/routers/__init__.py`
  - Create: `backend/app/models/__init__.py`
  - Create: `backend/app/services/__init__.py`
  - Create: `backend/app/dependencies/__init__.py`
  - Create: `backend/app/utils/__init__.py`
  - Create: `backend/tests/__init__.py`
  - Create: `backend/.env.example`
- **Description**:
  1. Run `uv init backend --no-workspace` from the repo root (or `mkdir backend && cd backend && uv init`).
  2. Edit `pyproject.toml` to set:
     - `name = "kalano-backend"`
     - `requires-python = ">=3.12"`
     - Add Ruff configuration:
       ```toml
       [tool.ruff]
       target-version = "py312"
       line-length = 88

       [tool.ruff.lint]
       select = ["E", "F", "W", "I", "N", "UP", "B", "SIM"]

       [tool.pytest.ini_options]
       testpaths = ["tests"]
       ```
  3. Install production dependencies:
     ```
     uv add fastapi "uvicorn[standard]" supabase python-jose[cryptography] argon2-cffi pydantic pydantic-settings
     ```
  4. Install dev dependencies:
     ```
     uv add --dev pytest pytest-asyncio httpx ruff
     ```
  5. Create all `__init__.py` files for the package structure.
  6. Create a minimal `backend/app/main.py` with just `app = FastAPI()` (will be
     fleshed out in Batch 3).
  7. Create `backend/.env.example`:
     ```
     # Supabase
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_KEY=your-anon-key

     # JWT
     JWT_SECRET_KEY=your-secret-key-change-in-production
     JWT_ALGORITHM=HS256
     JWT_EXPIRATION_MINUTES=60

     # Frontend
     FRONTEND_URL=http://localhost:3000
     ```
  8. Verify `uv run uvicorn app.main:app` starts without errors (start, check, stop).
  9. Verify `uv run ruff check .` passes.
- **Done when**: `backend/` directory exists with all subdirectories, dependencies
  installed, and `uvicorn` starts the minimal app.

---

## Batch 3: Core Backend Implementation `[SEQUENTIAL]`

_These tasks build on each other within the backend._

### Task 3.1 — Implement Settings & Config

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/dependencies/config.py`
- **Description**:
  1. Create `Settings` class using `pydantic_settings.BaseSettings`:
     - Fields: `supabase_url` (str), `supabase_key` (str),
       `jwt_secret_key` (str), `jwt_algorithm` (str, default `"HS256"`),
       `jwt_expiration_minutes` (int, default `60`),
       `frontend_url` (str, default `"http://localhost:3000"`).
     - Configure `model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")`.
  2. Create a module-level `settings = Settings()` instance.
  3. Create a `.env` file in `backend/` by copying `.env.example` and filling in
     real Supabase credentials (instruct the user to do this manually).
- **Done when**: `from app.dependencies.config import settings` works and reads
  from `.env`.

### Task 3.2 — Implement Supabase Client

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/dependencies/database.py`
- **Description**:
  1. Import `create_client` and `Client` from `supabase`.
  2. Import `settings` from `app.dependencies.config`.
  3. Implement `get_supabase_client()` with singleton pattern:
     - Module-level `_supabase_client: Client | None = None`.
     - On first call, create client with `settings.supabase_url` and
       `settings.supabase_key`.
     - Return the cached client on subsequent calls.
- **Done when**: `get_supabase_client()` returns a valid Supabase client
  instance.

### Task 3.3 — Implement Health Model & Router

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `backend/app/models/health.py`
  - Create: `backend/app/routers/health.py`
- **Description**:
  1. Create `HealthResponse` Pydantic model in `models/health.py`:
     - `status: str` — Field with description
     - `database: str` — Field with description
     - `error: str | None = None` — Field with description
  2. Create health router in `routers/health.py`:
     - `router = APIRouter(prefix="/api/v1", tags=["System"])`
     - `GET /health` endpoint with `summary` and `description`.
     - Try to query Supabase (`table("users").select("id", count="exact").limit(0).execute()`).
     - Return `HealthResponse(status="healthy", database="connected")` on
       success.
     - Catch `Exception`, return
       `HealthResponse(status="degraded", database="disconnected", error=str(e))`.
- **Done when**: The health endpoint exists and handles both success and failure
  cases.

### Task 3.4 — Wire up main.py with CORS & Router

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `backend/app/main.py`
- **Description**:
  1. Import `CORSMiddleware` from `fastapi.middleware.cors`.
  2. Import `settings` from `app.dependencies.config`.
  3. Import `health` router from `app.routers.health`.
  4. Configure FastAPI with `title="Kalano API"`,
     `description="Multi-vendor e-commerce platform API"`,
     `version="0.1.0"`.
  5. Add CORS middleware:
     - `allow_origins=[settings.frontend_url]`
     - `allow_credentials=True`
     - `allow_methods=["*"]`
     - `allow_headers=["*"]`
  6. Register: `app.include_router(health.router)`.
  7. Verify the app starts: `uv run uvicorn app.main:app --reload`.
  8. Verify `/docs` shows the health endpoint.
- **Done when**: `GET /api/v1/health` returns a valid response. `/docs` shows the
  Swagger UI with the endpoint documented.

---

## Batch 4: Frontend Enhancement & Backend Tests `[PARALLEL]`

_Frontend work and backend tests are independent._

### Task 4.1 — Configure shadcn/ui, TanStack Query, Zod, Vitest `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/lib/query-client.ts`
  - Create: `frontend/lib/providers.tsx`
  - Modify: `frontend/app/layout.tsx`
  - Modify: `frontend/app/page.tsx`
  - Modify: `frontend/package.json` (via pnpm add)
- **Description**:
  1. **shadcn/ui**: Run `npx shadcn@latest init` inside `frontend/` with
     New York style. Accept defaults or use `--yes` flag. This configures
     `components.json`, adds CSS variables, and sets up the `components/ui/`
     directory.
  2. **TanStack Query**: Run `pnpm add @tanstack/react-query` inside `frontend/`.
  3. **Zod**: Run `pnpm add zod` inside `frontend/`.
  4. **Vitest**: Run `pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom` inside `frontend/`.
     Create `vitest.config.ts`:
     ```typescript
     import { defineConfig } from "vitest/config";
     import react from "@vitejs/plugin-react";
     import path from "path";

     export default defineConfig({
       plugins: [react()],
       test: {
         environment: "jsdom",
         setupFiles: [],
       },
       resolve: {
         alias: {
           "@": path.resolve(__dirname, "."),
         },
       },
     });
     ```
     Add `"test": "vitest run"` to `package.json` scripts.
  5. **Prettier**: Run `pnpm add -D prettier eslint-config-prettier` inside
     `frontend/`. Create `.prettierrc` with sensible defaults.
  6. Create `frontend/lib/query-client.ts`:
     - Export `makeQueryClient()` that returns a `QueryClient` with
       `staleTime: 60 * 1000`.
  7. Create `frontend/lib/providers.tsx`:
     - `"use client"` component.
     - Uses `useState` to create `queryClient` (ensures one per client).
     - Wraps children in `<QueryClientProvider>`.
  8. Modify `frontend/app/layout.tsx`:
     - Import and wrap `{children}` with `<Providers>`.
  9. Modify `frontend/app/page.tsx`:
     - Replace default content with a centered Kalano placeholder:
       ```tsx
       export default function Home() {
         return (
           <main className="flex min-h-screen flex-col items-center justify-center">
             <h1 className="text-4xl font-bold">Kalano</h1>
             <p className="mt-2 text-lg text-muted-foreground">
               Your multi-vendor marketplace
             </p>
           </main>
         );
       }
       ```
  10. Verify `pnpm dev` still works.
  11. Verify `pnpm lint` still passes.
  12. Verify `pnpm test` runs (even with no test files, it should exit cleanly
      or show "no tests found" without error).
- **Done when**: All libraries installed. Providers wrapping layout. Placeholder
  page renders. `pnpm dev`, `pnpm lint`, and `pnpm test` all work.

### Task 4.2 — Write backend health endpoint tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/conftest.py`
  - Create: `backend/tests/test_health.py`
- **Description**:
  1. Create `backend/tests/conftest.py`:
     ```python
     import pytest
     from fastapi.testclient import TestClient
     from app.main import app

     @pytest.fixture
     def client():
         return TestClient(app)
     ```
  2. Create `backend/tests/test_health.py` with these test cases:
     - **`test_health_endpoint_returns_200`**: `GET /api/v1/health` returns
       status code 200.
     - **`test_health_response_has_required_fields`**: Response JSON contains
       `status` and `database` fields.
     - **`test_health_db_connected`**: Mock `app.dependencies.database.get_supabase_client`
       to return a mock client whose `.table("users").select("id", count="exact").limit(0).execute()`
       returns successfully. Assert `status == "healthy"` and
       `database == "connected"`.
     - **`test_health_db_disconnected`**: Mock `app.routers.health.get_supabase_client`
       to raise an `Exception("Connection refused")`. Assert
       `status == "degraded"`, `database == "disconnected"`, and
       `error` contains `"Connection refused"`.
  3. Run `uv run pytest` and verify all 4 tests pass.
- **Done when**: All 4 tests pass. `uv run pytest` exits with code 0.

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and formatters on all files.
  - Backend: `cd backend && uv run ruff check . && uv run ruff format --check .`
  - Frontend: `cd frontend && pnpm lint`
  - Fix any issues found.
- **Done when**: No lint errors or formatting issues in either project.

### Task 5.2 — Full Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run the complete test suites.
  - Backend: `cd backend && uv run pytest -v`
  - Frontend: `cd frontend && pnpm test` (should exit cleanly)
- **Done when**: All backend tests pass. Frontend test runner works.

### Task 5.3 — Manual Smoke Test

- **Type**: `[SEQUENTIAL]`
- **Description**: Walk through the setup manually to verify everything works:
  1. Start backend: `cd backend && uv run uvicorn app.main:app --reload --port 8000`
  2. Visit `http://localhost:8000/docs` — Swagger UI loads with health endpoint.
  3. Hit `GET /api/v1/health` — returns JSON with `status` field.
  4. Start frontend: `cd frontend && pnpm dev`
  5. Visit `http://localhost:3000` — placeholder page renders with "Kalano"
     heading.
  6. Check browser console — no CORS errors.
  7. Verify `frontend/.env.example` and `backend/.env.example` exist with
     correct placeholder values.
- **Done when**: All 7 verification steps complete without errors.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|----------------|---------------------|
| 1 | 2 | No | 1 |
| 2 | 2 | Yes | 2 |
| 3 | 4 | No | 1 |
| 4 | 2 | Yes | 2 |
| 5 | 3 | No | 1 |
| **Total** | **13** | | **Max 2 concurrent** |

---

## Git Commit Plan

_Suggested commits following Conventional Commits (§13 of constitution)._

1. `chore: add root .gitignore`
2. `chore(frontend): scaffold Next.js app with TypeScript and Tailwind`
3. `chore(backend): scaffold FastAPI project with uv and dependencies`
4. `feat(backend): add settings and config management via pydantic-settings`
5. `feat(backend): add Supabase client utility with singleton pattern`
6. `feat(backend): add health check endpoint with database connectivity`
7. `feat(backend): configure CORS and register routers in main app`
8. `test(backend): add health endpoint tests with mocked database`
9. `feat(frontend): configure shadcn/ui, TanStack Query, Zod, and Vitest`
10. `feat(frontend): add providers wrapper and placeholder home page`
