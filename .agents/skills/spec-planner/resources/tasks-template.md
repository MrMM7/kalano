# Tasks: [Feature Name]

> **Spec**: `specs/NNN-feature-name/spec.md`
> **Plan**: `specs/NNN-feature-name/plan.md`
> **Branch**: `verb/phase-name`
> **Spec**: NNN of MMM in phase
> **Date**: YYYY-MM-DD
> **Status**: Draft

---

## Legend

- `[SEQUENTIAL]` — Must be completed before the next task starts.
- `[PARALLEL]` — Can be executed simultaneously with other `[PARALLEL]` tasks in
  the same batch.
- `[SUBAGENT]` — Should be delegated to a subagent for parallel execution.

---

## Prior Spec Dependencies

_List which earlier spec folders must be complete before this spec can be
executed._

- Depends on: `specs/NNN-feature-name/` (Status: ⬜ Pending / ✅ Complete)
- Or: None (this is the first spec in the phase)

---

## Batch 1: Foundation `[SEQUENTIAL]`

_These tasks must be done first as other tasks depend on them._

### Task 1.1 — [Task Title]

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Create: `path/to/file.py`
  - Modify: `path/to/existing.py`
- **Description**: _What exactly to do, step by step._
- **Done when**: _How to verify this task is complete._

---

## Batch 2: Core Implementation `[PARALLEL]`

_These tasks are independent and can be executed simultaneously._

### Task 2.1 — [Backend Task] `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/app/...`
- **Description**: _What exactly to do._
- **Done when**: _Verification criteria._

### Task 2.2 — [Frontend Task] `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/app/...`
- **Description**: _What exactly to do._
- **Done when**: _Verification criteria._

---

## Batch 3: Tests `[PARALLEL]`

_Test tasks can often be parallelized across backend and frontend._

### Task 3.1 — Backend Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `backend/tests/...`
- **Description**: _List each test case to implement._
- **Done when**: _All tests pass._

### Task 3.2 — Frontend Tests `[SUBAGENT]`

- **Type**: `[PARALLEL]`
- **Files**:
  - Create: `frontend/__tests__/...`
- **Description**: _List each test case to implement._
- **Done when**: _All tests pass._

---

## Batch 4: Integration & Wiring `[SEQUENTIAL]`

_Final tasks that connect everything together._

### Task 4.1 — [Integration Task]

- **Type**: `[SEQUENTIAL]`
- **Files**:
  - Modify: `path/to/file`
- **Description**: _Connect the pieces._
- **Done when**: _End-to-end flow works._

---

## Batch 5: Verification `[SEQUENTIAL]`

### Task 5.1 — Lint & Format

- **Type**: `[SEQUENTIAL]`
- **Description**: Run linters and formatters on all changed files.
  - Backend: `ruff check . && ruff format .`
  - Frontend: `pnpm lint && pnpm format`
- **Done when**: No lint errors or formatting issues.

### Task 5.2 — Full Test Suite

- **Type**: `[SEQUENTIAL]`
- **Description**: Run the complete test suite to ensure nothing is broken.
  - Backend: `pytest`
  - Frontend: `pnpm test`
- **Done when**: All tests pass.

### Task 5.3 — Manual Smoke Test

- **Type**: `[SEQUENTIAL]`
- **Description**: _Walk through the feature manually to verify it works
  end-to-end._
  1. Step 1: ...
  2. Step 2: ...
- **Done when**: All steps complete without errors.

---

## Execution Summary

| Batch | Tasks | Parallelizable | Estimated Subagents |
|-------|-------|---------------|---------------------|
| 1 | X | No | 1 |
| 2 | X | Yes | X |
| 3 | X | Yes | X |
| 4 | X | No | 1 |
| 5 | X | No | 1 |
| **Total** | **X** | | |

---

## Git Commit Plan

_Suggested commits following Conventional Commits (§13 of constitution)._

1. `feat(backend): add [feature] models and schemas`
2. `feat(backend): implement [feature] service layer`
3. `feat(backend): add [feature] API endpoints`
4. `test(backend): add tests for [feature] endpoints`
5. `feat(frontend): add [feature] page and components`
6. `test(frontend): add tests for [feature] components`
