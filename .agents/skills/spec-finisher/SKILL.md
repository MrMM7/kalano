---
name: spec-finisher
description: >-
  Use this skill when the user asks to finish, finalize, wrap up, or complete a
  spec or feature after implementation. It discovers and runs all available
  frontend and backend tests, immediately halts/cancels if any test fails, deletes
  the dated specs folder (YYYY-MM-DD-feature-name) upon 100% test success, commits
  all changes following Conventional Commits, and merges the current feature
  branch into main. Activate when the user says things like "finish the spec",
  "finalize the feature", "run tests and merge", "wrap up this feature",
  "complete the spec", "/finish", or "/merge".
---

# Spec Finisher Skill

This skill automates the completion and cleanup lifecycle of a feature or spec. It acts
as the quality gatekeeper before merging into `main` — running all available frontend
and backend tests, strictly halting on any failure to safeguard code health, cleaning
up the temporary spec folder upon success, committing all changes under Conventional
Commits, and merging the feature branch into `main`.

> **CRITICAL — ZERO TOLERANCE FOR TEST FAILURES**:
> If ANY test fails or is unsatisfied, you MUST **immediately cancel and halt** the rest
> of the instruction. Under NO circumstances should you delete the specs folder, commit
> changes, switch branches, or merge into `main` if tests fail. Report the exact failure
> details immediately so the issues can be resolved first.

---

## Workflow

### Step 1 — Identify the Active Feature Branch & Spec Folder

1. **Check the current git branch**:
   Run `git branch --show-current` using `run_command`.
   - **Guard**: If the current branch is `main`, **HALT IMMEDIATELY**. Explain to the user
     that `spec-finisher` must be run from an active feature/fix branch (e.g., `feat/...` or `fix/...`),
     not directly on `main`.
2. **Extract the feature name**:
   - Parse `<feature-name>` from the branch pattern `<verb>/<feature-name>` (e.g., `feat/monorepo-scaffolding` → `monorepo-scaffolding`).
3. **Locate the matching spec folder**:
   - Inspect the `specs/` directory.
   - Look for a folder matching `specs/YYYY-MM-DD-<feature-name>/` (e.g., `specs/2026-09-03-monorepo-scaffolding/`).
   - If the user explicitly provided a spec folder name, use that.
   - If no exact match is found or multiple candidates exist, list the folders in `specs/` and confirm with the user before proceeding.
4. **Check git working tree status**:
   - Run `git status` to verify modified, added, or untracked files.

---

### Step 2 — Run All Available Tests (Frontend & Backend)

Run all test suites across the monorepo. Tests must be executed and verified:

#### 2a. Frontend Tests (if present)
- Check if `frontend/` directory exists and has a test runner configured (e.g., `frontend/package.json` with `"test"` script or Vitest configuration).
- Run the frontend tests:
  ```bash
  pnpm --filter frontend test
  ```
  *(or `cd frontend && pnpm test` / `vitest run`)*
- Inspect the exit code and output:
  - If the exit code is non-zero or any test fails → **HALT IMMEDIATELY** (proceed to Step 3).
  - Note the count of passed tests.

#### 2b. Backend Tests (if present)
- Check if `backend/` directory exists and has a test runner configured (e.g., `backend/pyproject.toml` with `pytest` or `backend/tests/` folder).
- Run the backend tests:
  ```bash
  cd backend && uv run pytest
  ```
- Inspect the exit code and output:
  - If the exit code is non-zero or any test fails → **HALT IMMEDIATELY** (proceed to Step 3).
  - Note the count of passed tests.

#### 2c. Monorepo Shortcut (when both exist)
- Alternatively, if root `package.json` defines a combined test script, you can run:
  ```bash
  pnpm test
  ```
- Ensure both frontend and backend suites are fully executed and pass with code `0`.

---

### Step 3 — Hard Failure Guard (Cancel Immediately on Any Failure)

If **ANY** test fails, encounters an error, or cannot be satisfied:

1. **STOP IMMEDIATELY**: Do not proceed to Step 4, 5, 6, or 7.
2. **DO NOT delete the specs folder**: The spec files (`spec.md`, `plan.md`, `tasks.md`) must remain intact for debugging and reference.
3. **DO NOT commit changes**.
4. **DO NOT switch branches or merge into `main`**.
5. **Report the failure clearly to the user**:
   - Highlight the failing test file, test case, and error assertion.
   - Include the relevant stdout/stderr snippets.
   - Provide concrete guidance on what needs to be fixed before running `spec-finisher` again.

---

### Step 4 — Update Roadmap (Project Memory Maintenance)

Once all tests pass with 100% success:

1. Read `.specify/memory/roadmap.md`.
2. Find the roadmap step corresponding to this feature (e.g., `### [ ] Step 1.1 — ...`).
3. Update the checkbox to completed: `### [x] Step 1.1 — ...`.
4. If a parent phase has all its steps completed, mark the phase checkbox as complete as well: `## [x] Phase X: ...`.

---

### Step 5 — Delete the Spec Folder

Now that all tests have passed and requirements are verified:

1. Delete the dated spec directory `specs/YYYY-MM-DD-<feature-name>/`:
   - On Windows / PowerShell:
     ```powershell
     Remove-Item -Recurse -Force "specs/YYYY-MM-DD-<feature-name>"
     ```
   - Or on POSIX:
     ```bash
     rm -rf "specs/YYYY-MM-DD-<feature-name>"
     ```
2. Verify that the folder has been completely removed from `specs/`.

---

### Step 6 — Commit Changes

Follow Constitution Section 13 (Git Conventions) & Section 17 (Rules for AI Agents):

1. **Stage all changes**:
   ```bash
   git add -A
   ```
2. **Verify staged changes**:
   Run `git status` to verify:
   - The spec folder deletion is staged.
   - The roadmap update is staged.
   - Any implementation files or tests are staged.
3. **Draft a Conventional Commit message**:
   Format: `<type>(<scope>): <short description>`
   - Align `<type>` with the branch verb (`feat`, `fix`, `refactor`, `chore`).
   - Use the appropriate scope (e.g., `frontend`, `backend`, `auth`, `cart`, `monorepo`).
   - Example commit message:
     ```
     feat(monorepo): complete scaffolding and finalize spec

     - All frontend (Vitest) and backend (Pytest) tests passed
     - Removed ephemeral spec specs/2026-09-03-monorepo-scaffolding
     - Updated roadmap step 1.1 to completed
     ```
4. **Execute the commit**:
   ```bash
   git commit -m "<type>(<scope>): <description>"
   ```
5. **Verify commit creation**:
   Check `git rev-parse --short HEAD` to confirm the commit hash.

---

### Step 7 — Merge into Main

Merge the verified feature branch into the stable `main` branch:

1. **Switch to `main`**:
   ```bash
   git checkout main
   ```
2. **Pull latest changes (if remote exists)**:
   ```bash
   git pull origin main
   ```
   *(If no remote or upstream is configured, ignore remote fetch errors and proceed).*
3. **Merge the feature branch**:
   ```bash
   git merge <verb>/<feature-name>
   ```
4. **Verify merge status**:
   - Check `git status` to ensure a clean working tree.
   - Check `git log -1` to confirm `main` is now pointing to the latest merged commit.

---

### Step 8 — Report Completion Summary

Present a clean, structured summary to the user:

```markdown
## 🏁 Feature Finalization Complete

- 🧪 **Tests Verified**:
  - Frontend (Vitest): ✅ Passed
  - Backend (Pytest): ✅ Passed
- 🗑️ **Specs Cleaned**: Removed `specs/YYYY-MM-DD-<feature-name>/`
- 📋 **Roadmap Updated**: Marked Step X.Y as completed in `.specify/memory/roadmap.md`
- 📝 **Committed**: `[commit-hash]` - `<commit message>`
- 🔀 **Merged into main**: Branch `<verb>/<feature-name>` is now merged into `main`

### 🚀 Next Steps
You can run `/spec` or invoke the `spec-planner` skill to plan the next uncompleted step from the roadmap!
```

---

## Important Reminders

- **Constitution is law.** Adhere strictly to `.specify/memory/constitution.md` for git conventions, commit messages, and testing rules.
- **Never proceed past test failures.** If a test fails, abort immediately without modifying git branches or deleting specs.
- **Always verify branch before starting.** Never finalize while already on `main` — work must originate from the feature branch.
- **Clean up specs thoroughly.** The `specs/` directory contains transient execution artifacts; once verified, committed, and merged, they should be cleaned up as instructed.
