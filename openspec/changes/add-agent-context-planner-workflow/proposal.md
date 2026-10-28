# Proposal

## Why

The starter has technical guidance for coding agents but no explicit contract for project context, planning responsibility, or when work must be formalized in OpenSpec. A consistent context and planning workflow will keep derived projects grounded without duplicating transient requirements across documentation.

## What Changes

- Define `AGENTS.md` as the source for project identity and the entry point for agent operating rules.
- Add canonical architecture, tool, and agent-role documents under `.context/` and load every Markdown file in that directory before substantive planning.
- Define a single Planner role that investigates and decomposes work without modifying product or project configuration.
- Require OpenSpec artifacts for features, refactors, and architectural decisions while allowing minor fixes and maintenance to be planned without a change.
- Retain at most the 10 most recent archived changes in the working tree, excluding active changes and pruning only archives whose specifications have been synchronized.
- Configure OpenSpec artifact guidance without duplicating repository context.
- Remove the empty `SOUL.md` from the base contract while allowing projects to add optional context documents later.

## Capabilities

### New Capabilities

- `agent-planning-workflow`: Defines context loading, project bootstrap, Planner boundaries, and OpenSpec routing for agent work.

### Modified Capabilities

None.

## Impact

This affects `AGENTS.md`, `.context/`, `openspec/config.yaml`, and archived-change maintenance under `openspec/changes/archive/`. It introduces no application APIs, runtime dependencies, or Nuxt behavior changes.
