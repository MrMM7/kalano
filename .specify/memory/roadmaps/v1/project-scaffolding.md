# [x] Phase 1: Project Scaffolding

### [x] Step 1.1 — Initialize the full monorepo

- Create `frontend/` and `backend/` top-level directories.
- **Frontend**: Initialize Next.js with TypeScript, TailwindCSS, App Router. Install and configure
  shadcn/ui, TanStack Query, Zod, Vitest. Set up ESLint + Prettier.
- **Backend**: Initialize FastAPI with uv and `pyproject.toml`. Install supabase-py, python-jose
  (JWT), argon2-cffi, pytest. Set up Ruff. Create the folder structure (`app/main.py`,
  `app/routers/`, `app/models/`, `app/services/`, `app/dependencies/`, `app/utils/`).
- Create the FastAPI app instance in `main.py` with CORS middleware. Add a health-check endpoint
  (`GET /api/v1/health`) and a test for it.
- Create a Supabase client utility in `app/dependencies/` that reads credentials from `.env`.
- Create `.env.example` files for both frontend and backend. Add `.gitignore` entries for `.env`,
  `node_modules`, `__pycache__`, `.venv`.
- Verify both apps start locally (`pnpm dev` and `uv run uvicorn`) and lint/format commands run
  cleanly.
