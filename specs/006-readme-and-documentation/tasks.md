# Tasks: README & Documentation

> **Spec**: `specs/006-readme-and-documentation/spec.md`
> **Plan**: `specs/006-readme-and-documentation/plan.md`
> **Branch**: `feat/polish-and-integration`
> **Spec**: 006 of 006 in phase
> **Date**: 2026-09-07
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. command invocations or minimal type references) are allowed, but **mock logic is
> strictly prohibited** (no function bodies, control flow, loops, or algorithms). Custom enums
> MUST be explained in pure text.

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

- Depends on: `specs/001-shared-layout-and-navigation/` through `specs/005-end-to-end-smoke-test/` (Status: ⬜ Pending).

---

## Batch 1: Environment Template Audit `[PARALLEL]`

### Task 1.1 — Update Backend Environment Template `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `backend/.env.example`
- **Description**: Audit backend configuration variables. Ensure `backend/.env.example` includes clear comments explaining `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, and `CORS_ORIGINS`.
- **Done when**: All backend environment variables are documented with safe example defaults and explanations.

### Task 1.2 — Update Frontend Environment Template `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Modify: `frontend/.env.example`
- **Description**: Audit frontend configuration variables. Ensure `frontend/.env.example` documents `NEXT_PUBLIC_API_URL` pointing to the FastAPI backend service.
- **Done when**: `frontend/.env.example` is documented clearly.

---

## Batch 2: Root Documentation Rewrite `[SEQUENTIAL]`

### Task 2.1 — Rewrite Root README.md

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `README.md`
- **Description**: Completely revamp `README.md`. Include:
  1. Project introduction with educational disclaimer.
  2. Architecture overview (monorepo structure, strict backend separation).
  3. Role features for Buyer, Merchant, and Logistics.
  4. Complete local setup guide using `uv` for backend and `pnpm` for frontend.
  5. How to run backend and frontend test suites and E2E smoke tests.
  6. OpenAPI interactive docs link (`http://localhost:8000/docs`).
- **Done when**: `README.md` is comprehensive, cleanly formatted, and accurate.

---

## Batch 3: Constitution Compliance Verification `[SEQUENTIAL]`

### Task 3.1 — Verify Monorepo Against Constitution

- **Type**: `[SEQUENTIAL]`
- **Description**: Conduct a final audit of the codebase against `.specify/memory/constitution.md`:
  1. Verify zero Supabase imports in frontend.
  2. Verify all endpoints use `/api/v1/` prefix.
  3. Verify consistent error envelopes in API responses.
  4. Verify test suites pass completely.
- **Done when**: Entire codebase is verified 100% compliant with the constitution.

---

## Batch 4: Verification `[SEQUENTIAL]`

### Task 4.1 — Markdown & Link Validation

- **Type**: `[SEQUENTIAL]`
- **Description**: Check markdown formatting and links in `README.md`.
- **Done when**: Markdown renders cleanly without broken relative links.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | 2 | Yes | 2 |
| 2 | 1 | No | 1 |
| 3 | 1 | No | 1 |
| 4 | 1 | No | 1 |
| **Total** | **5** | | |

---

## Git Commit Plan

1. `docs: update backend and frontend .env.example files with complete parameter docs`
2. `docs: overhaul README.md with comprehensive setup, architecture, and testing guides`
