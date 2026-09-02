---
name: spec-executor
description: >-
  Use this skill when the user asks to execute, implement, build, or start
  working on a spec. It reads the tasks.md, plan.md, and spec.md from a
  specs/ folder, then systematically executes every task — running SEQUENTIAL
  batches one-by-one and PARALLEL batches via concurrent subagents. Activate
  when the user says things like "implement this spec", "execute the spec",
  "start building", "run the tasks", "build this", "/build", or "/exec".
---

# Spec Executor Skill

This skill automates the implementation of a spec by reading its tasks, plan,
and spec files, then executing every task in the correct order — honoring
sequential dependencies and parallelizing independent work via subagents.

> **CRITICAL**: Before executing ANY task, you MUST read and fully internalize
> the constitution at `.specify/memory/constitution.md`. Every implementation
> decision MUST comply with it. This is non-negotiable.

## Workflow

### Step 1 — Identify the Spec Folder

1. List the contents of the `specs/` directory to find all dated spec folders.
2. If the user specified a spec folder name, use that.
3. If the user did NOT specify, pick the **most recent** spec folder by date
   prefix (e.g., `specs/2026-09-02-monorepo-scaffolding/`).
4. Confirm with the user which spec to execute if there is any ambiguity.

### Step 2 — Read All Spec Documents

Read all three files from the spec folder in order:

1. **`spec.md`** — Understand WHAT we are building (requirements, acceptance
   criteria, API contracts, edge cases, out-of-scope items).
2. **`plan.md`** — Understand HOW we are building it (technical approach,
   file-by-file breakdown, dependencies, implementation notes, testing
   strategy).
3. **`tasks.md`** — Understand the EXECUTION ORDER (batches, sequential vs
   parallel tasks, done criteria).

Also read the **constitution** at `.specify/memory/constitution.md` to
internalize all project rules and conventions.

### Step 3 — Parse the Task Structure

From `tasks.md`, extract the batch and task structure:

- **Batches** are numbered groups (e.g., "Batch 1", "Batch 2").
- Each batch has a type: `[SEQUENTIAL]` or `[PARALLEL]`.
- Each task within a batch has:
  - A **task ID** (e.g., "Task 1.1", "Task 2.1").
  - A **type**: `[SEQUENTIAL]`, `[PARALLEL]`, or `[SUBAGENT]`.
  - **Files** to create or modify.
  - A **description** with step-by-step instructions.
  - A **done when** criteria for verification.

### Step 4 — Execute Batches in Order

Process each batch sequentially (Batch 1 before Batch 2, etc.). Within each
batch, respect the execution mode:

#### For `[SEQUENTIAL]` Batches:

Execute each task one at a time, in order (Task X.1, then Task X.2, etc.):

1. Read the task description and the relevant section from `plan.md` for
   implementation details.
2. Execute the task yourself — create files, run commands, modify code.
3. Verify the "done when" criteria before moving to the next task.
4. If a task fails verification, fix the issue before proceeding.

#### For `[PARALLEL]` Batches:

Launch all `[SUBAGENT]`-tagged tasks concurrently using `invoke_subagent`:

1. For each `[PARALLEL]`/`[SUBAGENT]` task in the batch, create a subagent with
   a detailed prompt that includes:
   - The full task description from `tasks.md`.
   - The relevant implementation notes from `plan.md`.
   - The relevant requirements from `spec.md`.
   - The constitution rules that apply.
   - Clear instructions on what files to create/modify.
   - The "done when" verification criteria.
2. Launch all subagents for the batch at the same time.
3. Wait for ALL subagents in the batch to complete before moving to the next
   batch.
4. Review each subagent's output to verify success. If a subagent failed, fix
   the issue before proceeding.

> **IMPORTANT**: Even within a `[PARALLEL]` batch, if a task is NOT marked
> `[SUBAGENT]`, execute it yourself rather than delegating.

### Step 5 — Verify After Each Batch

After each batch completes (all tasks done):

1. Check that all "done when" criteria are met.
2. Run any relevant lint/test commands mentioned in the task descriptions.
3. If any verification fails, fix the issues before proceeding to the next
   batch.

### Step 6 — Final Verification

After ALL batches are complete:

1. If the tasks include a "Verification" batch (usually the last batch), execute
   it fully:
   - Run all linters and formatters.
   - Run the full test suite.
   - Perform the manual smoke test steps (start servers, verify endpoints, etc).
2. Check ALL acceptance criteria from `spec.md` — every `[ ]` item should be
   satisfiable.
3. Review the constitution compliance checklist from `plan.md`.

### Step 7 — Report Results

Present a summary to the user:

- ✅ List all tasks completed successfully.
- ❌ List any tasks that failed or need manual intervention.
- 📋 List any acceptance criteria from `spec.md` that could not be verified
  automatically (e.g., "check browser console for CORS errors").
- 🔧 Note any manual steps the user needs to perform (e.g., "copy
  `.env.example` to `.env` and fill in credentials").
- Suggest the git commits from the "Git Commit Plan" in `tasks.md` if present.

## Subagent Prompt Template

When delegating a task to a subagent, use this structure for the prompt:

```
You are implementing a task from a project spec. Follow these instructions
precisely.

## Context
- Project: [project name from spec.md]
- Spec: [path to spec.md]
- Working directory: [repo root]

## Constitution Rules
[Paste the relevant constitution rules that apply to this task]

## Task: [Task ID] — [Task Title]

### Files
- Create: [list of files to create]
- Modify: [list of files to modify]

### Instructions
[Paste the full description from tasks.md]

### Implementation Details (from plan.md)
[Paste the relevant section from plan.md with code snippets, architecture
notes, etc.]

### Requirements (from spec.md)
[Paste the relevant requirements section from spec.md]

### Verification
[Paste the "done when" criteria]

After completing all steps, verify the "done when" criteria by running the
specified checks. Report back with the results.
```

## Important Reminders

- **Constitution is law.** Every line of code must comply with
  `.specify/memory/constitution.md`. If you find a conflict, the constitution
  wins.
- **Plan is your blueprint.** The `plan.md` has detailed implementation notes
  with code snippets — USE THEM. Don't reinvent what's already specified.
- **Spec is your acceptance test.** Every acceptance criterion in `spec.md` must
  be met by the end of execution.
- **Tasks define order.** Never execute a later batch before an earlier one
  finishes. Sequential means sequential.
- **Verify everything.** Run the "done when" checks for every task. Don't assume
  success — prove it.
- **Parallel means parallel.** Use subagents for `[SUBAGENT]` tasks. Don't
  serialize what was designed to be parallel.
- **Report failures honestly.** If something doesn't work, say so. Don't hide
  errors.
- **Update task status.** After completing each task, update `tasks.md` to mark
  the task as done by changing `Status: Draft` to `Status: In Progress` when you
  start, and to `Status: Complete` when all tasks pass verification.
