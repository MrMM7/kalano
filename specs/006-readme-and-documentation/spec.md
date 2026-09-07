# Spec: README & Documentation

> **Roadmap Reference**: Phase 8, Step 8.6 — README & documentation
> **Branch**: `feat/polish-and-integration`
> **Spec**: 006 of 006 in phase
> **Date**: 2026-09-07
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

As the platform nears functional completeness with all core capabilities in place (user auth, catalog search, multi-seller offers, cart, checkout, order tracking, merchant dashboard, logistics pipeline, responsive layout, error states, and e2e tests), the repository documentation must reflect production standards.

This feature performs a documentation overhaul:
1. Revamping the root `README.md` to be a clear, developer-friendly guide covering platform architecture, role capabilities, prerequisites, local setup instructions for both frontend and backend, testing procedures, and API documentation endpoints.
2. Synchronizing and annotating `frontend/.env.example` and `backend/.env.example` with descriptions and safe placeholders.
3. Conducting a final, thorough compliance audit against `.specify/memory/constitution.md` to guarantee complete alignment with architectural standards.

## 2. Dependencies

- Depends on: `specs/001-shared-layout-and-navigation/` through `specs/005-end-to-end-smoke-test/` (documents all features, commands, and tests created throughout Phase 8).

## 3. Functional Requirements

### 3.1 — Root `README.md` Overhaul

The root `README.md` must contain:
- [ ] **Project Overview**: High-level explanation of Kalano as a multi-vendor marketplace where multiple merchants compete on price and stock for identical products. Prominent educational notice that all payments and fulfillment are simulated.
- [ ] **Architecture & Tech Stack Summary**:
  - Frontend: Next.js App Router, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, Vitest.
  - Backend: FastAPI, Pydantic, Supabase Python client, argon2 password hashing, Pytest, uv.
  - Clear statement of strict backend separation (Next.js is a thin client, no Supabase client in frontend).
- [ ] **User Roles & Workflows**: Detailed breakdown of Buyer, Merchant, and Logistics journeys.
- [ ] **Prerequisites & Tooling**: Node.js, pnpm, Python, uv.
- [ ] **Step-by-Step Setup Guide**:
  - Setting up the backend virtual environment, installing dependencies via uv, configuring `.env`.
  - Setting up the frontend dependencies via pnpm, configuring `.env.local`.
  - Starting backend server (`uv run uvicorn app.main:app --reload`).
  - Starting frontend development server (`pnpm dev`).
- [ ] **Testing & Quality Assurance**:
  - Running backend tests (`uv run pytest`).
  - Running frontend tests (`pnpm test`).
  - Running linters and formatters (`ruff check`, `pnpm lint`).
- [ ] **API Documentation**: Pointers to auto-generated OpenAPI Swagger docs at `/docs` and ReDoc at `/redoc`.

### 3.2 — Environment Variable Documentation

- [ ] Audit `backend/.env.example`:
  - `SUPABASE_URL`: Description and dummy format.
  - `SUPABASE_KEY`: Description and dummy format.
  - `JWT_SECRET_KEY`: Description and security guidance.
  - `JWT_ALGORITHM`: Default algorithm (HS256).
  - `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration setting.
  - `CORS_ORIGINS`: Comma-separated allowed origins (e.g. `http://localhost:3000`).
- [ ] Audit `frontend/.env.example`:
  - `NEXT_PUBLIC_API_URL`: Description pointing to FastAPI URL (e.g. `http://localhost:8000`).

### 3.3 — Final Constitution Compliance Audit

- [ ] Verify that no frontend code directly queries Supabase.
- [ ] Verify all backend endpoints use `/api/v1/` and return the standard error envelope.
- [ ] Verify all routes have tests.

## 4. Acceptance Criteria

- [ ] AC1: A new developer can clone the repository, follow `README.md`, and get both backend and frontend running locally within 10 minutes.
- [ ] AC2: All environment variables present in runtime `.env` files are documented in `.env.example` with clear comments.
- [ ] AC3: Test instructions accurately execute and pass on both frontend and backend.
- [ ] AC4: The educational disclaimer is prominently placed in the README.
- [ ] AC5: Zero constitutional violations remain in the repository.

## 5. API Contract

This spec manages documentation and environment configuration. No API endpoints are modified.

## 6. UI/UX Requirements

- Clean Markdown formatting with tables, badges, code block syntax highlighting, and expandable sections if needed.

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Developer forgets to copy `.env.example` | Clear troubleshooting note in README explaining common startup errors (e.g. missing environment variables). |
| Port conflicts | README mentions default ports (Frontend: 3000, Backend: 8000) and how to configure alternatives. |

## 8. Out of Scope

- ❌ Automated deployment scripts or cloud terraform provisioning (local setup focus).
- ❌ External documentation website (e.g. Docusaurus/GitBook).

## 9. Constitution Compliance

- ✅ Section 1: Prominently emphasizes that Kalano is built solely for educational purposes and payments/fulfillment are simulated.
- ✅ Section 4.1: Documents the strict backend separation rule.
- ✅ Section 4.5: Ensures `.env.example` files are fully maintained in both frontend and backend directories.

## 10. Open Questions

- None. Requirements directly reflect Step 8.6 of the roadmap.
