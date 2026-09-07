# Kalano — Multi-Vendor E-Commerce Platform

> **Educational Project Disclaimer**: Kalano is built solely for learning and software engineering portfolio purposes. All payments, monetary transactions, checkout mechanisms, and logistics fulfillment workflows are **completely simulated** — real payment processors and live logistics providers are never integrated.

Kalano is a modern **multi-vendor e-commerce platform** (modeled after marketplace architectures like Amazon) where multiple merchants can list competing offers for identical products. The platform automatically selects the cheapest in-stock offer by default, allows buyers to switch between merchant offers, and coordinates order fulfillment through a dedicated internal logistics dashboard.

---

## 1. System Architecture & Tech Stack

The repository is structured as a clean **monorepo** with strict separation of concerns between the presentation layer and the backend business domain.

```
kalano/
├── frontend/                  # Next.js App Router thin-client presentation layer
│   ├── app/                   # Next.js routes & server/client layouts
│   ├── components/            # Reusable UI primitives & role-specific views
│   ├── lib/                   # API client, React Query hooks, and Auth context
│   ├── types/                 # Shared TypeScript interfaces & schemas
│   ├── __tests__/             # Vitest unit, component, and accessibility test suites
│   ├── .env.example           # Frontend environment configuration template
│   └── package.json
├── backend/                   # FastAPI backend services & data layer
│   ├── app/
│   │   ├── main.py            # FastAPI application entry point & CORS configuration
│   │   ├── routers/           # REST API route controllers (/api/v1/ prefix)
│   │   ├── models/            # Pydantic data schemas & request/response models
│   │   ├── services/          # Pure business logic, inventory, & workflow engines
│   │   ├── dependencies/      # Injected dependencies (Auth, DB, Config)
│   │   └── utils/             # JWT tokens, password hashing, and helpers
│   ├── tests/                 # Pytest test suite & E2E smoke tests
│   ├── .env.example           # Backend environment configuration template
│   └── pyproject.toml         # Python project definition and dependencies (managed via uv)
├── specs/                     # Formal Spec-Driven Development (SDD) artifacts
├── .specify/                  # Project memory, constitution, and roadmap
├── DESIGN.md                  # UX/UI system design documentation
├── TECHNICAL.md               # Technical architecture & schema specifications
└── README.md
```

### Architectural Rules
- **Strict Backend Separation**: The Next.js frontend is strictly a **thin client**. All business rules, inventory decrements, cart computations, authentication hashing, and database operations reside exclusively in FastAPI.
- **Zero Frontend Supabase**: The frontend **never** imports or uses the Supabase JS client. All database access flows through FastAPI → Supabase Python client.
- **RESTful API Contract**: All endpoints are prefixed with `/api/v1/` and provide consistent error envelopes:
  ```json
  {
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "The requested item was not found."
    }
  }
  ```
- **Authentication**: Passwords are securely hashed using **Argon2** before storage. Session tokens are issued as JSON Web Tokens (JWT) stored in `httpOnly` cookies and forwarded via standard `Authorization: Bearer <token>` headers.

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router) | React framework with modern routing and layout composition |
| **Frontend Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe development with strict type checking |
| **Styling & Components** | [TailwindCSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) | Responsive styling and accessible UI primitives |
| **Server State** | [TanStack Query](https://tanstack.com/query) | Robust server state caching, optimistic updates, and queries |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) | High-performance asynchronous Python REST API framework |
| **Backend Tooling** | [uv](https://docs.astral.sh/uv/) | Ultra-fast Python package and project manager |
| **Validation & Modeling** | [Pydantic v2](https://docs.pydantic.dev/) | Strict schema validation and auto-generated OpenAPI documentation |
| **Database & Storage** | [Supabase](https://supabase.com/) (Python) | Managed PostgreSQL database and storage buckets |
| **Password Security** | [Argon2-cffi](https://argon2-cffi.readthedocs.io/) | Industry-standard password hashing algorithm |
| **Testing** | [Vitest](https://vitest.dev/) & [Pytest](https://docs.pytest.org/) | Automated frontend and backend testing frameworks |

---

## 2. User Roles & Capabilities

| Role | Responsibilities & User Experience |
|------|-----------------------------------|
| **Buyer** | • Search catalog products by name, brand, or description using substring matching.<br>• View product details with lowest-price seller offer highlighted.<br>• Compare all merchant offers (pricing, stock, delivery estimates) in a comparison table.<br>• Add items to server-persisted cart and adjust quantities.<br>• Complete simulated checkout with delivery address selection.<br>• Track real-time order progression (`pending` → `confirmed` → `shipped` → `delivered`) in order history. |
| **Merchant** | • Create new product listings in the shared catalog with image upload support.<br>• Add seller offers to existing catalog items with custom pricing and stock.<br>• Manage inventory: update price, adjust stock, and edit delivery estimates from `/dashboard`.<br>• View incoming customer orders and mark them as ready for courier pickup (`confirmed`). |
| **Logistics** | • Access dedicated `/logistics` dashboard restricted to internal company staff.<br>• Filter orders by fulfillment state (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `returned`).<br>• Transition orders through fulfillment state machine: `confirmed` → `shipped` → `delivered`.<br>• Process order cancellations and returns, automatically returning inventory to seller stock. |

---

## 3. Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **pnpm**: `v9.x` or higher
- **Python**: `3.12` or higher
- **uv**: `v0.5.x` or higher ([Installation guide](https://docs.astral.sh/uv/getting-started/installation/))
- **Supabase Account**: A Supabase project with the schema configured (see `TECHNICAL.md`).

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/MrMM7/kalano.git
cd kalano
```

---

### Step 2 — Backend Configuration & Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create your `.env` configuration from the template:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` variables with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   JWT_SECRET_KEY=your-secret-key-at-least-32-chars-long
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_MINUTES=60
   FRONTEND_URL=http://localhost:3000
   ```

4. Install Python dependencies using `uv`:
   ```bash
   uv sync
   ```

5. Start the FastAPI development server:
   ```bash
   uv run uvicorn app.main:app --reload --port 8000
   ```

The backend REST API will be accessible at:
- **API Root**: `http://localhost:8000/api/v1`
- **Interactive OpenAPI Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Interactive Docs**: `http://localhost:8000/redoc`

---

### Step 3 — Frontend Configuration & Setup

1. In a separate terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Create your `.env.local` configuration from the template:
   ```bash
   cp .env.example .env.local
   ```

3. Ensure `NEXT_PUBLIC_API_URL` points to your backend instance:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Install dependencies using `pnpm`:
   ```bash
   pnpm install
   ```

5. Start the Next.js development server:
   ```bash
   pnpm dev
   ```

The frontend web application will be accessible at:
- **Application URL**: `http://localhost:3000`

---

## 4. Testing & Quality Assurance

Kalano enforces comprehensive automated testing across both frontend and backend suites. Untested endpoints and critical user flows are not accepted.

### Backend Tests (Pytest)

Run all backend unit, integration, and router tests from the `backend/` directory:

```bash
cd backend
uv run pytest
```

To run tests with detailed verbose output:
```bash
uv run pytest -v
```

#### End-to-End Multi-Role Smoke Test

To run the full end-to-end integration test (`test_e2e_smoke.py`), which simulates the complete multi-role lifecycle (Merchant product creation → Buyer search & cart checkout → Inventory decrement → Merchant pickup confirmation → Logistics transit & delivery → Buyer history verification):

```bash
cd backend
uv run pytest tests/test_e2e_smoke.py -v
```

### Backend Linting & Formatting (Ruff)

Check linting rules and format compliance:
```bash
cd backend
uv run ruff check .
uv run ruff format --check .
```

To automatically apply fixes:
```bash
uv run ruff format .
```

---

### Frontend Tests (Vitest)

Run all frontend component, hook, layout, and accessibility tests from the `frontend/` directory:

```bash
cd frontend
pnpm test
```

### Frontend Linting & Formatting (ESLint & Prettier)

Check ESLint compliance:
```bash
cd frontend
pnpm lint
```

Format frontend code with Prettier:
```bash
cd frontend
pnpm format
```

---

## 5. Development Methodology: Spec-Driven Development (SDD)

Kalano is built using a formal **Spec-Driven Development (SDD)** lifecycle. Rather than ad-hoc coding, development proceeds through verifiable stages anchored by project memory:

1. **[Project Constitution](.specify/memory/constitution.md)**: The non-negotiable source of truth governing architecture, user roles, strict Next.js/FastAPI separation, database schemas, coding standards, accessibility, git conventions, and guidelines for AI agents.
2. **[Development Roadmap](.specify/memory/roadmap.md)**: The atomic, step-by-step master plan mapping out each phase from scaffolding to launch.

### Custom Agent Skills

The project includes specialized agent skills (under `.agents/skills/`) to automate the plan → execute → verify lifecycle:

- **`/spec-planner`**: Analyzes the roadmap, asks clarifying questions via interactive modals, creates a feature branch (`feat/phase-name`), and scaffolds numbered spec folders (`specs/001-feature-name/`) with `spec.md`, `plan.md`, and `tasks.md`.
- **`/spec-executor`**: Discovers the next incomplete spec folder, executes tasks in strict batch dependency order, leverages subagents for parallel execution, and enforces verification and atomic commits after every task.
- **`/spec-finisher`**: Runs full frontend and backend test suites, halts immediately on any test failure, cleans up completed spec folders upon 100% test success, and merges the feature branch into `main` with Conventional Commits.

---

## 6. License

This project is open-source and available under the [MIT License](LICENSE).
