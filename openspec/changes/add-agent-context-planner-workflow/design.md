# Design

## Context

`AGENTS.md` currently combines commands, architecture, and coding conventions. `.context/` already contains four empty files, while OpenSpec is initialized with the default spec-driven schema but has no project guidance. The change needs a clear ownership model so stable context is loaded without copying change-specific requirements into multiple files.

## Goals / Non-Goals

**Goals:**

- Give agents one deterministic context-loading sequence.
- Separate project identity, durable knowledge, agent roles, and change-specific requirements.
- Make the Planner useful for both small tasks and OpenSpec-based substantive changes while preventing product edits.
- Keep derived projects extensible without requiring a fixed list of context documents.
- Keep recent implementation context available without accumulating every archived change in the working tree.

**Non-Goals:**

- Define an implementation or review agent.
- Automate validation of context completeness.
- Add application behavior, dependencies, or runtime configuration.
- Require Figma or a brand/experience document for every project.

## Decisions

### Keep `AGENTS.md` as a thin entry point

`AGENTS.md` will own project identity, instruction precedence, bootstrap behavior, and routing into `.context` and OpenSpec. Detailed architecture and tool inventories move to `.context` so they have a single agent-facing source of truth.

Alternative considered: keep the current architecture in `AGENTS.md` and mirror it in `.context`. This was rejected because duplicated guidance would drift.

### Load `.context/*.md` as an extensible knowledge set

The base set will be `ARCHITECTURE.md`, `TOOLS.md`, and `TEAM.md`. Agents load every Markdown file in the directory rather than relying on a hard-coded filename list. `SOUL.md` is removed from the base but can be added by projects whose brand or experience principles affect decisions.

Alternative considered: retain an empty optional `SOUL.md`. This was rejected because empty contract files create ambiguity about whether onboarding is complete.

### Make project context owner-managed

When identity or essential context is missing, the Planner asks focused questions and proposes exact text. It does not write `AGENTS.md` or `.context`; the project owner approves and applies that configuration.

Alternative considered: let the Planner update context after confirmation. Owner management was selected to keep durable instructions deliberate and prevent planning output from silently becoming policy.

### Define one non-executing Planner role

`TEAM.md` will initially define only the Planner. It may inspect files and create OpenSpec planning artifacts, but it cannot edit product code, runtime configuration, or owner-managed context. Its output must be an ordered, verifiable plan suitable for a later executor.

Alternative considered: define a full multi-agent team. This was deferred until the responsibilities and handoffs of additional roles are known.

### Route work by durability and scope

Features, refactors, and architectural decisions use OpenSpec. Narrow fixes and routine maintenance may remain a chat plan when they do not alter a durable capability or architectural contract. `openspec/config.yaml` will add artifact rules for concise scope and verifiable tasks, but will not copy repository architecture.

Alternative considered: require OpenSpec for every modification. This was rejected because the ceremony is disproportionate for small maintenance work.

### Treat Figma as explicitly activated

`TOOLS.md` will record an optional Figma board field, but agents must not access Figma unless the user explicitly requests it. An absent board is therefore not a bootstrap failure.

Alternative considered: automatically consult Figma for visual work. Explicit activation was selected to match owner intent and avoid unintended external access.

### Retain only the 10 most recent archived changes

Active changes are excluded from the limit because they represent unfinished work and must never be pruned. After a successful archive operation, count the dated change directories under `openspec/changes/archive/`; when there are more than 10, remove the oldest only after confirming its delta has been synchronized into the durable specs. Git remains the recovery mechanism for pruned archive directories.

Alternative considered: limit active and archived changes together. This was rejected because retention pressure must not delete or block work in progress. Keeping every archive was also rejected because the working tree would accumulate transient planning detail already represented by durable specs and Git history.

## Risks / Trade-offs

- [Owner-managed context can slow initial setup] → The Planner supplies exact proposed text so the owner only needs to review and apply it.
- [The substantive/minor boundary requires judgment] → `AGENTS.md` provides concrete categories and defaults uncertain cases to OpenSpec.
- [Moving details out of `AGENTS.md` may hide familiar commands] → `AGENTS.md` links the context files and `TOOLS.md` preserves the command inventory.
- [No executor role means the workflow stops after planning] → State this explicitly in `TEAM.md`; later roles can be added without changing context loading.
- [Pruning could remove the only copy of an unsynchronized decision] → Verify the archive's spec changes exist in the durable specs before removal; stop pruning when verification fails.
- [A fixed count loses convenient access to older rationale] → Keep the 10 newest archives locally and rely on Git history for older artifacts.

## Migration Plan

1. Replace duplicated architecture and command sections in `AGENTS.md` with project identity and operating rules.
2. Populate the three canonical `.context` documents and remove the empty soul document.
3. Add focused OpenSpec context and artifact rules to `openspec/config.yaml`.
4. Add the post-archive retention rule and safe-pruning checks.
5. Validate the change artifacts and manually inspect the resulting instruction hierarchy.

Rollback consists of restoring `AGENTS.md` and removing the new `.context` content and OpenSpec configuration rules; there is no runtime state to migrate.
