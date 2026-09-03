---
name: spec-executor
description: >-
  Use this skill when the user asks to execute, implement, build, or start
  working on a spec. It reads the specs/ directory, discovers numbered spec
  folders (001-feature-name, 002-feature-name, etc.), and by default executes
  only the NEXT incomplete spec folder. For that spec folder, it reads the
  tasks.md, plan.md, and spec.md, then systematically executes every task —
  running SEQUENTIAL batches one-by-one and PARALLEL batches via concurrent
  subagents. After completing the spec, it STOPS and reports — it does NOT
  automatically advance to the next spec unless the user explicitly says
  "run all", "execute all specs", or "run everything". Activate when the user
  says things like "implement this spec", "execute the spec", "start building",
  "run the tasks", "build this", "/build", or "/exec".
---

# Spec Executor Skill

This skill automates the implementation of **one spec at a time** by default.
It finds the next incomplete numbered spec folder, reads its task/plan/spec
files, and executes every task in the correct sequence — honoring sequential
dependencies and parallelizing independent work via subagents. After completing
one spec, it **stops and reports** rather than automatically continuing to the
next spec.

> **ONE-AT-A-TIME DEFAULT**: Execute only the next incomplete spec folder, then
> stop. Only execute multiple specs in sequence if the user explicitly requests
> it (e.g., "run all specs", "execute everything", "run specs 001 through 003").

> **CRITICAL**: Before executing ANY task, you MUST read and fully internalize
> the constitution at `.specify/memory/constitution.md`. Every implementation
> decision MUST comply with it. This is non-negotiable.

## Workflow

### Step 1 — Discover Spec Folders and Select Target

1. List the contents of the `specs/` directory to find all spec folders.
2. **Identify numbered spec folders**: Look for folders matching the pattern
   `NNN-feature-name` (e.g., `001-user-registration-endpoint`,
   `002-user-login-endpoint`).
3. **Sort by number prefix** in ascending order (`001` → `002` → `003` → ...).
4. If there is a `PHASE-INDEX.md` file in `specs/`, read it for context on
   the overall phase, dependencies, and execution notes.
5. **Skip completed specs**: If some spec folders have already been completed
   (their `tasks.md` shows `Status: Complete`), skip them.
6. **Select the target spec**:
   - **Default (one at a time)**: Pick only the **first incomplete** spec folder.
     This is the default behavior.
   - **User-specified**: If the user named a specific spec folder (e.g.,
     "run 003"), use that.
   - **Run all**: If the user explicitly requested running all specs (e.g.,
     "run all", "execute everything", "run specs 001 through 005"), select all
     incomplete specs for sequential execution.
7. Present the selection to the user: show which spec(s) will be executed, which
   were skipped as already complete, and confirm before proceeding.

### Step 2 — Execute the Target Spec Folder

For the selected spec folder (or for each selected spec in order if running
multiple), perform Steps 2a through 2f:

#### Step 2a — Read All Spec Documents

Read all three files from the current spec folder:

1. **`spec.md`** — Understand WHAT we are building (requirements, acceptance
   criteria, API contracts, edge cases, out-of-scope items).
2. **`plan.md`** — Understand HOW we are building it (technical approach,
   file-by-file breakdown, dependencies, implementation notes, testing
   strategy).
3. **`tasks.md`** — Understand the EXECUTION ORDER (batches, sequential vs
   parallel tasks, done criteria).

Also read the **constitution** at `.specify/memory/constitution.md` to
internalize all project rules and conventions (if not already read).

#### Step 2b — Parse the Task Structure

From `tasks.md`, extract the batch and task structure:

- **Batches** are numbered groups (e.g., "Batch 1", "Batch 2").
- Each batch has a type: `[SEQUENTIAL]` or `[PARALLEL]`.
- Each task within a batch has:
  - A **task ID** (e.g., "Task 1.1", "Task 2.1").
  - A **type**: `[SEQUENTIAL]`, `[PARALLEL]`, or `[SUBAGENT]`.
  - **Files** to create or modify.
  - A **description** with step-by-step instructions.
  - A **done when** criteria for verification.

#### Step 2c — Execute Batches in Order

Process each batch sequentially (Batch 1 before Batch 2, etc.). Within each
batch, respect the execution mode:

##### For `[SEQUENTIAL]` Batches:

Execute each task one at a time, in order (Task X.1, then Task X.2, etc.):

1. Read the task description and the relevant section from `plan.md` for
   implementation details.
2. Execute the task yourself — create files, run commands, modify code.
3. Verify the "done when" criteria before moving to the next task.
4. If a task fails verification, fix the issue before proceeding.

##### For `[PARALLEL]` Batches:

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

#### Step 2d — Verify After Each Batch

After each batch completes (all tasks done):

1. Check that all "done when" criteria are met.
2. Run any relevant lint/test commands mentioned in the task descriptions.
3. If any verification fails, fix the issues before proceeding to the next
   batch.

#### Step 2e — Spec-Level Final Verification

After ALL batches in the current spec are complete:

1. If the tasks include a "Verification" batch (usually the last batch), execute
   it fully:
   - Run all linters and formatters.
   - Run the full test suite.
   - Perform the manual smoke test steps (start servers, verify endpoints, etc).
2. Check ALL acceptance criteria from `spec.md` — every `[ ]` item should be
   satisfiable.
3. Review the constitution compliance checklist from `plan.md`.

#### Step 2f — Mark Spec as Complete and Report

1. Update the `tasks.md` in the current spec folder: change `Status: Draft` or
   `Status: In Progress` to `Status: Complete`.
2. If a `PHASE-INDEX.md` exists, update the current spec's status from
   `⬜ Pending` to `✅ Complete`.
3. Report a summary for this spec:
   - ✅ Spec `NNN-feature-name` completed.
   - Number of tasks executed.
   - Any issues encountered and resolved.
4. **Stop or continue**:
   - **Default (one at a time)**: **STOP HERE.** Do NOT automatically proceed to
     the next spec. Instead, tell the user the next spec available (if any) and
     suggest they run `/build` or `/exec` again when ready.
   - **Run-all mode**: If the user explicitly requested running all specs,
     proceed to the next spec folder (go back to Step 2a).

### Step 3 — Completion Report

After the spec (or all specs, if running in run-all mode) is done:

Present a summary to the user:

- ✅ Spec(s) completed successfully (with folder names).
- ❌ Any tasks that failed or need manual intervention.
- 📋 Any acceptance criteria that could not be verified automatically.
- 🔧 Any manual steps the user needs to perform.
- **Next up**: Name the next incomplete spec folder (if any remain), and suggest
  running `/build` or `/exec` to execute it.
- If **all** spec folders in the phase are now complete, suggest the user run
  `/finish` to finalize the phase (run tests, clean up specs, commit, and
  merge).

## Subagent Prompt Template

When delegating a task to a subagent, use this structure for the prompt:

```
You are implementing a task from a project spec. Follow these instructions
precisely.

## Context
- Project: [project name from spec.md]
- Spec: [path to spec.md]
- Working directory: [repo root]
- Current spec: [NNN-feature-name] (Spec N of M in the phase)

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
- **One spec at a time by default.** Execute only the next incomplete spec,
  then stop and report. Do NOT automatically chain to the next spec unless the
  user explicitly asked for it.
- **Specs are executed in order.** Never execute spec `002` before `001` is
  complete, unless the user explicitly requests it.
- **Verify everything.** Run the "done when" checks for every task. Don't assume
  success — prove it.
- **Parallel means parallel.** Use subagents for `[SUBAGENT]` tasks. Don't
  serialize what was designed to be parallel.
- **Report failures honestly.** If something doesn't work, say so. Don't hide
  errors.
- **Update task status.** After completing each task, update `tasks.md` to mark
  the task as done by changing `Status: Draft` to `Status: In Progress` when you
  start, and to `Status: Complete` when all tasks pass verification.
- **Cross-spec awareness.** Later specs may depend on files created by earlier
  specs. The `plan.md` in each spec should document these dependencies.
