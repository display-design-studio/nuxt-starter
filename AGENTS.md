# AGENTS.md

This file is the entry point for agents working in this repository. Human-facing documentation lives in `README.md`; durable agent knowledge lives in `.context/`.

## Project Identity

- **Name:** Nuxt Starter
- **Mode:** starter
- **Type:** full-stack Nuxt and Sanity web project starter
- **Purpose:** provide Display projects with a production-oriented baseline for content-driven websites deployed on Netlify

When creating a project from this starter, the project owner must replace this section with the new project's name, mode, type, and purpose. Until that definition is complete, the Planner must stop substantive planning, ask focused questions, and propose exact replacement text. The project owner applies changes to this file and `.context/`.

## Context Contract

Before substantive planning or implementation:

1. Read this file.
2. Read every Markdown file currently present in `.context/`.
3. Read the relevant active OpenSpec change, when one exists.
4. Inspect the repository sources needed to validate discoverable facts.

Repository-level instructions are resolved in this order:

1. Current user request
2. `AGENTS.md`
3. `.context/*.md`
4. Active OpenSpec change artifacts

Higher-level system or tool restrictions still take precedence. If repository sources conflict, follow the order above and report conflicts that affect the result.

The base context is:

- `.context/ARCHITECTURE.md` — technical architecture and conventions
- `.context/TOOLS.md` — canonical resources, commands, and activation rules
- `.context/TEAM.md` — agent roles and handoff boundaries

The list is intentionally extensible: load every `.context/*.md` file, including project-specific additions. No `SOUL.md` file is required; add one only when brand, editorial, or experience principles materially guide the project.

## Planning Workflow

The initial team contains only the non-executing Planner defined in `.context/TEAM.md`.

- Features, refactors, architectural decisions, and durable behavior changes must be formalized as OpenSpec changes.
- Narrow fixes and routine maintenance may use a decision-complete plan in chat when they do not change a durable capability or architectural contract.
- When classification is uncertain, default to OpenSpec.
- The Planner may create or update OpenSpec planning artifacts but must not implement product changes or edit owner-managed context.

Implementation begins only through an explicitly selected execution workflow after the plan or OpenSpec change is ready.

## OpenSpec Archive Retention

Keep at most the 10 most recent archived change directories under `openspec/changes/archive/`. Active changes are never counted or removed.

After archiving a change:

1. Confirm the archive operation synchronized its delta requirements into the durable specs under `openspec/specs/`.
2. List archived change directories in chronological order.
3. If there are more than 10, identify the oldest archive.
4. Verify again that the oldest archive's requirements are represented in the durable specs.
5. Remove that oldest archive from the working tree only after verification succeeds.
6. Repeat until 10 archives remain.

If synchronization cannot be verified, stop pruning and report the blocker. Older removed archives remain recoverable from Git history.

## Project Conventions

Commands and external resources are defined in `.context/TOOLS.md`. Architecture, environment variables, data flow, styling, i18n, caching, and code-style conventions are defined in `.context/ARCHITECTURE.md`.
