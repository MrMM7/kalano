---
name: compact-roadmap
description: >-
  Use this skill when the user asks to version, compact, archive, or split the
  roadmap into separate phase files. It reads `.specify/memory/roadmap.md`,
  extracts each completed phase into its own file under
  `.specify/memory/roadmaps/<version>/phase-name.md`, removes the detailed
  phase content from the main roadmap, and replaces it with a compact summary
  listing previous versions and any future phases appended at the end. Activate
  when the user says things like "version the roadmap", "compact the roadmap",
  "archive phases", "split roadmap into files", or "/compact-roadmap".
---

# Roadmap Versioner Skill

This skill automates the process of compacting a roadmap by extracting each
phase into its own standalone file and replacing the main roadmap with a clean,
compact summary.

## Workflow

### Step 1 — Read the Roadmap

Read `.specify/memory/roadmap.md` in its entirety. Parse and identify every
phase section. A phase is defined as a markdown `## ` heading that starts with
a checkbox pattern like `## [x] Phase N: Title` or `## [ ] Phase N: Title`.

For each phase, capture:
- The full phase heading (e.g., `## [x] Phase 1: Project Scaffolding`)
- The phase number (e.g., `1`)
- The phase title (e.g., `Project Scaffolding`)
- The completion status (`[x]` = completed, `[ ]` = incomplete)
- The entire content of the phase from its `## ` heading down to (but NOT
  including) the next `## ` heading or the end of the file
- All steps within the phase (the `### ` sub-headings and their content)

Also capture any content that appears BEFORE the first phase (the roadmap
header/preamble — title, description, notes, etc.).

### Step 2 — Ask the User for the Version Name

Use the `ask_question` tool to ask the user:

- **Version name**: "What version label should this roadmap snapshot use?"
  Provide options like `v1`, `v2`, `v1.0`, or let them write in a custom one.
  This version will be used as the folder name under
  `.specify/memory/roadmaps/`.

### Step 3 — Create the Version Directory and Phase Files (Parallel via Subagents)

After receiving the version name, create **all phase files in parallel** by
spawning one subagent per phase using `invoke_subagent`. This dramatically
speeds up execution compared to creating files sequentially.

**Target directory:**
```
.specify/memory/roadmaps/<version>/
```

**Target file per phase:**
```
.specify/memory/roadmaps/<version>/<phase-name>.md
```

Where `<phase-name>` is derived from the phase title in `kebab-case`
(e.g., `project-scaffolding.md`, `authentication.md`, `product-catalog.md`).

**How to parallelize:**

Use a single `invoke_subagent` call with **one subagent entry per phase** in
the `Subagents` array. Each subagent should:
- Have `TypeName` set to `self`
- Have `Role` set to something like `Phase N File Creator`
- Have `Model` set to `flash`
- Receive a `Prompt` containing:
  1. The exact phase content to write (copy it verbatim into the prompt)
  2. The target file path (`.specify/memory/roadmaps/<version>/<phase-name>.md`)
  3. Instructions to use `write_to_file` to create the file with the provided
     content, converting the `## ` phase heading to a `# ` heading

**CRITICAL — Faithful Copy Only**: Each phase file must contain an **exact
copy** of the phase content from the original roadmap. Do NOT add any external
details, commentary, annotations, metadata headers, or modifications. Simply
copy the phase heading and all its content (steps, bullet points, etc.)
verbatim into the file.

The file content should be structured as:
```markdown
# Phase N: Title

(exact content from the roadmap phase, preserving all markdown formatting,
checkboxes, steps, bullet points, and horizontal rules within the phase)
```

Note: Convert the `## ` phase heading to a `# ` heading since it's now the
top-level heading in its own file. Everything else stays exactly as-is.

**Wait for all subagents to complete** before proceeding to Step 4. You will
receive messages from each subagent as they finish — do NOT proceed until all
have reported back.

### Step 4 — Rewrite the Main Roadmap

After all phase files are created, rewrite `.specify/memory/roadmap.md` with a
compact format:

1. **Preserve the original preamble** (title, description block quote, and the
   first `---` separator) exactly as-is.

2. **For completed phases** (`[x]`): List them as a simple compact reference
   with just the phase number, title, and a link to their version file:

   ```markdown
   ## Previous Versions

   ### <version>

   - [x] **Phase 1: Project Scaffolding** — [Details](./roadmaps/<version>/project-scaffolding.md)
   - [x] **Phase 2: Authentication** — [Details](./roadmaps/<version>/authentication.md)
   ...
   ```

3. **For incomplete phases** (`[ ]`): Append them at the end of the roadmap in
   their **full original form** — preserving all steps, bullet points, and
   content exactly as they appeared in the original roadmap. These are the
   "next phases" that are still part of the active roadmap.

   If there are NO incomplete phases, simply end the file after the previous
   versions section.

The final structure of the rewritten roadmap should be:

```markdown
# Kalano — Development Roadmap

> (original preamble)

---

## Previous Versions

### <version>

- [x] **Phase 1: Title** — [Details](./roadmaps/<version>/phase-name.md)
- [x] **Phase 2: Title** — [Details](./roadmaps/<version>/phase-name.md)
...

---

## [ ] Phase N+1: Future Phase Title

### [ ] Step N+1.1 — Step Title

- (full original content preserved)

...
```

### Step 5 — Verify and Report

After rewriting the roadmap:

1. **Verify** that all phase files were created by listing the contents of
   `.specify/memory/roadmaps/<version>/`.
2. **Verify** that the main roadmap was rewritten by reading it back.
3. **Report** to the user:
   - How many phases were extracted into files
   - The version directory path
   - List of all created phase files
   - How many incomplete phases (if any) remain in the main roadmap
   - Confirm the main roadmap was compacted successfully

## Important Reminders

- **Faithful copies only.** When creating phase files, copy the content
  exactly. Do NOT add headers, metadata, timestamps, or commentary.
- **Preserve formatting.** All markdown formatting, checkboxes, code blocks,
  and structure must be preserved exactly.
- **Relative links.** The links in the compacted roadmap should use relative
  paths from `.specify/memory/roadmap.md` to
  `.specify/memory/roadmaps/<version>/`. Since they are siblings, use
  `./roadmaps/<version>/phase-name.md`.
- **All phases get files.** Even incomplete phases get their own files in the
  version directory, but they ALSO remain in full in the main roadmap.
- **Ask before acting.** Always ask for the version name before creating files.
- **Overwrite the roadmap.** The main roadmap file should be overwritten with
  the new compact version. Use `Overwrite: true` when writing back.
