---
name: spec-planner
description: >-
  Use this skill when the user asks to plan, spec out, or scaffold the next
  feature or phase of the project. It reads the roadmap to find the next
  uncompleted step, asks the user clarifying questions via ask_question,
  creates a new branch called verb/feature-name, and only then generates a
  dated specs folder containing spec.md, plan.md, and tasks.md. Activate when
  the user says things like "plan the next step", "create specs", "spec out the
  next phase", "what's next on the roadmap", or "/spec".
---

# Spec Planner Skill

This skill automates the creation of detailed, unambiguous specifications for
the next step in the Kalano roadmap.

> **CRITICAL**: Before generating ANY output, you MUST read and fully internalize
> the constitution at `.specify/memory/constitution.md`. Every decision in the
> spec, plan, and tasks MUST comply with it. This is non-negotiable.

## Workflow

### Step 1 — Read the Constitution

Read `.specify/memory/constitution.md` in its entirety. Internalize all rules,
conventions, tech stack requirements, architecture rules, and naming conventions.
Every artifact you produce must comply with this document.

### Step 2 — Read the Roadmap and Identify the Next Step

Read `.specify/memory/roadmap.md` and scan for the next uncompleted phase/step.

To determine what has already been completed:
1. Check the `specs/` directory for existing dated spec folders.
2. Look at the actual codebase (`frontend/`, `backend/`) for evidence of
   completed work (existing files, routes, components, endpoints).
3. Cross-reference with the roadmap to identify the first step that has NOT been
   fully implemented.

Present your finding to the user: state which phase and step you believe is
next, with a brief summary of what it entails.

### Step 3 — Ask Clarifying Questions

Use the `ask_question` tool to ask the user targeted questions that will help
produce the most precise and unambiguous spec. These questions should cover:

- **Scope confirmation**: "Is [Phase X, Step Y] the correct next step, or would
  you like to work on something else?"
- **Design decisions**: Any ambiguities in the roadmap step that need resolution
  (e.g., UI layout preferences, specific behavior on edge cases, error handling
  strategies).
- **Priority and constraints**: Are there any time constraints, specific
  requirements, or deviations from the roadmap the user wants?
- **Technical preferences**: Where the roadmap is vague, ask about specific
  implementation approaches.

You MUST ask at least one round of questions. Do NOT skip this step. If the
roadmap step is very clear, still confirm scope and ask about any edge cases or
preferences.

After receiving answers, if any responses raise new ambiguities, ask follow-up
questions. Iterate until you have enough clarity to write an unambiguous spec.

### Step 4 — Create the Feature Branch

Before creating any spec files or folders, create and switch to a dedicated git branch for the feature:

1. **Determine the branch name**: follow the pattern `verb/feature-name`.
   - **`verb`**: The Conventional Commits action type representing the work:
     - `feat` — for new features or capabilities (most common, e.g., `feat/user-registration-endpoint`, `feat/cart-frontend-page`)
     - `fix` — for bug fixes (e.g., `fix/cookie-auth-cors`)
     - `refactor` — for code restructuring without behavior changes
     - `chore` — for maintenance, dependencies, or scaffolding
   - **`feature-name`**: A concise, descriptive `kebab-case` name derived from the roadmap step (matching the folder name suffix).
   - Examples: `feat/user-registration-endpoint`, `feat/cart-frontend-page`, `feat/merchant-dashboard`.
2. **Create and check out the branch**:
   Run the git command using `run_command`:
   ```bash
   git checkout -b <verb>/<feature-name>
   ```
   (or `git switch -c <verb>/<feature-name>`)
3. **Confirm the switch**: Verify that git has switched to the new branch before proceeding.

> **CRITICAL**: You MUST create and switch to the new branch BEFORE writing any spec files. Do NOT start writing the specs until the branch is active. All specs and subsequent implementation code must live on this branch.

### Step 5 — Generate the Specs Folder

Only after the branch is created and checked out, generate the specs folder:

Create the folder: `specs/YYYY-MM-DD-feature-name/`

- Use today's date in `YYYY-MM-DD` format.
- Use the matching `feature-name` from the branch name (e.g., `user-registration-endpoint`, `cart-frontend-page`, `merchant-dashboard`).

Generate three files inside this folder, using the templates in the
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

#### 5b — `plan.md` (HOW we build it)

Read the template at [resources/plan-template.md](./resources/plan-template.md)
and fill it in. This file defines:

- Technical approach and architecture decisions
- File-by-file breakdown of what needs to be created or modified
- Dependencies between components
- Testing strategy (what tests to write, what to mock)
- Constitution compliance notes (how this plan adheres to the constitution)

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

### Step 6 — Present and Confirm

After generating all three files, present a brief summary to the user:
- Branch created and active (`verb/feature-name`)
- What phase/step was spec'd
- Key decisions captured
- Number of tasks and which are parallelizable
- Ask if they want any adjustments before execution

## Important Reminders

- **Constitution is law.** Every line of spec, plan, and tasks must comply with
  `.specify/memory/constitution.md`. If you find a conflict between the roadmap
  and the constitution, the constitution wins.
- **Always branch first.** NEVER start writing specs on `main`. Always create and
  switch to a new branch called `verb/feature-name` first, and only then start
  writing the specs.
- **Never assume — ask.** If something is ambiguous, use `ask_question`.
- **Be specific.** File paths, function names, endpoint URLs, Pydantic model
  names — include them all. Vague specs lead to bugs.
- **Think about tests.** Every endpoint needs tests. Include them in the tasks.
- **Think about parallelism.** Maximize use of subagents and parallel execution
  in the tasks. Independent work should be marked for parallel execution.
