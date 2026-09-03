---
name: spec-planner
description: >-
  Use this skill when the user asks to plan, spec out, or scaffold the next
  feature or phase of the project. It reads the roadmap to find the next
  uncompleted phase, asks the user clarifying questions via ask_question,
  creates a new branch called verb/phase-name, and then generates a separate
  numbered spec folder for EACH step in the phase using the 001-feature-name
  template naming convention. Each spec folder contains spec.md, plan.md, and
  tasks.md. Activate when the user says things like "plan the next step",
  "create specs", "spec out the next phase", "what's next on the roadmap", or
  "/spec".
---

# Spec Planner Skill

This skill automates the creation of detailed, unambiguous specifications for
the **entire next phase** in the Kalano roadmap. Each step within the phase gets
its own numbered spec folder.

> **CRITICAL**: Before generating ANY output, you MUST read and fully internalize
> the constitution at `.specify/memory/constitution.md`. Every decision in the
> spec, plan, and tasks MUST comply with it. This is non-negotiable.

## Workflow

### Step 1 — Read the Constitution

Read `.specify/memory/constitution.md` in its entirety. Internalize all rules,
conventions, tech stack requirements, architecture rules, and naming conventions.
Every artifact you produce must comply with this document.

### Step 2 — Read the Roadmap and Identify the Next Phase

Read `.specify/memory/roadmap.md` and scan for the next uncompleted **phase**.

To determine what has already been completed:
1. Check the `specs/` directory for existing numbered spec folders.
2. Look at the actual codebase (`frontend/`, `backend/`) for evidence of
   completed work (existing files, routes, components, endpoints).
3. Cross-reference with the roadmap to identify the first **phase** that has NOT
   been fully implemented.

Present your finding to the user: state which **phase** you believe is next,
list **all the steps** within that phase, and provide a brief summary of what
the whole phase entails.

### Step 3 — Ask Clarifying Questions

Use the `ask_question` tool to ask the user targeted questions that will help
produce the most precise and unambiguous specs. These questions should cover:

- **Scope confirmation**: "Is [Phase X] the correct next phase, or would you
  like to work on something else?"
- **Step selection**: "Do you want to spec the entire phase (all N steps), or
  only a subset?"
- **Design decisions**: Any ambiguities in the phase's steps that need resolution
  (e.g., UI layout preferences, specific behavior on edge cases, error handling
  strategies).
- **Priority and constraints**: Are there any time constraints, specific
  requirements, or deviations from the roadmap the user wants?
- **Technical preferences**: Where the roadmap is vague, ask about specific
  implementation approaches.

You MUST ask at least one round of questions. Do NOT skip this step. If the
roadmap steps are very clear, still confirm scope and ask about any edge cases or
preferences.

After receiving answers, if any responses raise new ambiguities, ask follow-up
questions. Iterate until you have enough clarity to write unambiguous specs for
every step in the phase.

### Step 4 — Create the Phase Branch

Before creating any spec files or folders, create and switch to a dedicated git
branch for the **entire phase**:

1. **Determine the branch name**: follow the pattern `verb/phase-name`.
   - **`verb`**: The Conventional Commits action type representing the work:
     - `feat` — for new features or capabilities (most common, e.g.,
       `feat/authentication`, `feat/product-catalog`)
     - `fix` — for bug fixes
     - `refactor` — for code restructuring without behavior changes
     - `chore` — for maintenance, dependencies, or scaffolding
   - **`phase-name`**: A concise, descriptive `kebab-case` name derived from the
     phase title (e.g., `authentication`, `product-catalog`, `cart`,
     `checkout-and-orders`, `merchant-dashboard`).
   - Examples: `feat/authentication`, `feat/product-catalog`,
     `feat/merchant-dashboard`.
2. **Create and check out the branch**:
   Run the git command using `run_command`:
   ```bash
   git checkout -b <verb>/<phase-name>
   ```
3. **Confirm the switch**: Verify that git has switched to the new branch before
   proceeding.

> **CRITICAL**: You MUST create and switch to the new branch BEFORE writing any
> spec files. Do NOT start writing the specs until the branch is active. All
> specs and subsequent implementation code must live on this branch.

### Step 5 — Generate Numbered Spec Folders (One Per Step)

Only after the branch is created and checked out, generate the spec folders.

**Create one folder per step** in the phase, using this naming convention:

```
specs/NNN-feature-name/
```

Where:
- **`NNN`** is a zero-padded sequential number starting from `001`, representing
  the execution order of the step within the phase.
- **`feature-name`** is a concise `kebab-case` name derived from the step title
  (e.g., `user-registration-endpoint`, `user-login-endpoint`,
  `auth-context-and-middleware`).

**Examples for Phase 2 (Authentication):**
```
specs/001-user-registration-endpoint/
specs/002-user-login-endpoint/
specs/003-auth-dependency-and-current-user/
specs/004-frontend-signup-page/
specs/005-frontend-login-page/
specs/006-auth-context-and-middleware/
```

For each spec folder, generate three files using the templates in the
[resources/](./resources/) directory:

#### 5a — `spec.md` (WHAT we are building)

Read the template at [resources/spec-template.md](./resources/spec-template.md)
and fill it in. This file defines:

- Feature overview and context (which roadmap phase/step this addresses)
- Detailed functional requirements (what the feature must do)
- Acceptance criteria (how we know it's done)
- Edge cases and error scenarios
- UI/UX requirements (if applicable)
- API contract details (endpoints, request/response shapes, if applicable)
- What is explicitly OUT of scope

> **IMPORTANT**: Each spec.md should reference the **phase-level branch** (e.g.,
> `feat/authentication`) and its **sequence number** (e.g., `Spec 001 of 006`).

#### 5b — `plan.md` (HOW we build it)

Read the template at [resources/plan-template.md](./resources/plan-template.md)
and fill it in. This file defines:

- Technical approach and architecture decisions
- File-by-file breakdown of what needs to be created or modified
- Dependencies between components
- Testing strategy (what tests to write, what to mock)
- Constitution compliance notes (how this plan adheres to the constitution)

> **IMPORTANT**: Each plan.md should note **dependencies on prior specs** (e.g.,
> "Depends on `specs/001-user-registration-endpoint/` being completed first").

#### 5c — `tasks.md` (Execution steps)

Read the template at
[resources/tasks-template.md](./resources/tasks-template.md) and fill it in.
This file defines:

- Numbered, atomic tasks that can be executed sequentially
- Clear identification of which tasks can be parallelized (mark with
  `[PARALLEL]` tag)
- Each task should reference the specific files to create/modify
- Each task should have clear "done" criteria
- Tasks should be sized so each can be completed by a single subagent
- Where possible, group independent tasks into parallel batches

**Parallelization rules:**
- Backend and frontend tasks that don't depend on each other → `[PARALLEL]`
- Multiple independent test files → `[PARALLEL]`
- Tasks that modify the same file → `[SEQUENTIAL]`
- Frontend tasks that need API responses → `[SEQUENTIAL]` (after backend)

### Step 6 — Generate Phase Index

After generating all spec folders, create a `specs/PHASE-INDEX.md` file that
serves as an overview and execution guide for the entire phase:

```markdown
# Phase Index: [Phase Name]

> **Roadmap Reference**: Phase X — [Phase Title]
> **Branch**: `verb/phase-name`
> **Date**: YYYY-MM-DD
> **Total Specs**: N

---

## Execution Order

| # | Spec Folder | Step | Status |
|---|-------------|------|--------|
| 001 | `specs/001-feature-name/` | Step X.1 — [Title] | ⬜ Pending |
| 002 | `specs/002-feature-name/` | Step X.2 — [Title] | ⬜ Pending |
| ... | ... | ... | ... |

## Dependencies

- Spec 002 depends on Spec 001 (login requires user registration)
- Spec 004–006 depend on Specs 001–003 (frontend needs backend APIs)
- Specs 004 and 005 are independent of each other (can be parallelized)

## Notes

_Any phase-level notes, constraints, or decisions._
```

### Step 7 — Present and Confirm

After generating all spec folders and the phase index, present a brief summary
to the user:
- Branch created and active (`verb/phase-name`)
- Which phase was spec'd
- Number of spec folders created, with their names listed
- Key decisions captured
- Total number of tasks across all specs and which specs can be parallelized
- The dependency graph between specs
- Ask if they want any adjustments before execution

## Important Reminders

- **Constitution is law.** Every line of spec, plan, and tasks must comply with
  `.specify/memory/constitution.md`. If you find a conflict between the roadmap
  and the constitution, the constitution wins.
- **Always branch first.** NEVER start writing specs on `main`. Always create and
  switch to a new branch called `verb/phase-name` first, and only then start
  writing the specs.
- **One branch per phase.** All steps within a phase share a single branch.
- **One folder per step.** Each roadmap step gets its own numbered spec folder
  with its own `spec.md`, `plan.md`, and `tasks.md`.
- **Sequential numbering.** Use `001`, `002`, `003`, etc. This ensures correct
  sort order and clearly communicates execution order.
- **Never assume — ask.** If something is ambiguous, use `ask_question`.
- **Be specific.** File paths, function names, endpoint URLs, Pydantic model
  names — include them all. Vague specs lead to bugs.
- **Think about tests.** Every endpoint needs tests. Include them in the tasks.
- **Think about parallelism.** Maximize use of subagents and parallel execution
  in the tasks. Independent work should be marked for parallel execution.
- **Cross-spec dependencies.** Clearly document which specs depend on which.
  Later specs may reference files/modules created by earlier specs.
