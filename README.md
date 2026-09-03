# Kalano

A multi-vendor e-commerce platform (similar to Amazon) where multiple sellers can list offers for the same product. Buyers get the cheapest in-stock offer by default, or can manually pick a specific seller. Orders are fulfilled and tracked by Kalano's logistics team.

> **Note:** This is a learning project — not a real product. Payment-related features are simulated and do not involve real money or payment processors.
>
> Additionally, the frontend was created without being a primary priority; the project is significantly more backend learning-heavy than frontend-focused. All core business rules, validation, domain modeling, and data persistence remain centered in FastAPI and Python.

## User Roles

| Role | Description |
|------|-------------|
| **Buyer** | Browse/search products, compare seller offers, add items to cart, place orders, and track delivery status. |
| **Merchant** | Manage a seller dashboard — list products (or add offers to existing ones), set pricing and stock, and mark items as ready for pickup. |
| **Logistics** | Access a dedicated `/logistics` dashboard to manage pickups, deliveries, and order progress. |

## User Flow

Landing page → Search → Product page (cheapest offer + alternatives) → Add to cart → Checkout → Order placed & tracked

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js, TypeScript, TailwindCSS, Zod, Vitest |
| **Backend** | Python, FastAPI, Supabase, Pytest |

## Development Methodology: Spec-Driven Development (SDD)

Kalano is strictly developed using a **Spec-Driven Development (SDD)** workflow. Rather than ad-hoc coding, development proceeds through formalized, verifiable stages anchored by two core documents:

1. **[Project Constitution](.specify/memory/constitution.md)**: The non-negotiable source of truth governing architecture, user roles, strict Next.js/FastAPI separation, database schemas, coding standards, accessibility, git conventions, and guidelines for AI agents.
2. **[Development Roadmap](.specify/memory/roadmap.md)**: The atomic, step-by-step master plan mapping out each phase from scaffolding to launch.

Each phase is planned into numbered specifications (`spec.md`, `plan.md`, `tasks.md`), executed batch-by-batch with strict automated tests, verified, and cleanly merged.

## Agent Skills

This project uses three custom AI agent skills (located in `.agents/skills/`) that automate the plan → build → ship lifecycle:

### `/spec` — Spec Planner

Plans the next phase of development. It reads the project roadmap, asks you clarifying questions, creates a feature branch, and generates numbered spec folders (e.g. `specs/001-feature-name/`) each containing `spec.md`, `plan.md`, and `tasks.md`.

**Trigger by saying:** "plan the next step", "create specs", "spec out the next phase", or `/spec`

### `/build` — Spec Executor

Implements the next unfinished spec. It reads the spec/plan/tasks files, then executes every task in order — running sequential batches one-by-one and parallel batches via concurrent subagents. Stops after completing one spec unless told to "run all".

**Trigger by saying:** "implement this spec", "start building", "execute the spec", `/build`, or `/exec`

### `/finish` — Spec Finisher

Finalizes a phase after implementation. It runs all frontend and backend tests, **immediately halts if anything fails**, then cleans up spec folders, commits with a Conventional Commit message, and merges the feature branch into `main`.

**Trigger by saying:** "finish the spec", "run tests and merge", "wrap up this feature", `/finish`, or `/merge`
