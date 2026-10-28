# Tasks

## 1. Agent Entry Point

- [x] 1.1 Refactor `AGENTS.md` into the project identity and operating-rule entry point, preserving applicable coding conventions by reference, and verify it defines context loading, instruction precedence, blocking bootstrap behavior, and OpenSpec routing.

## 2. Durable Context

- [x] 2.1 Populate `.context/ARCHITECTURE.md` with the current Nuxt, Sanity, Netlify, caching, i18n, and data-flow contracts, and verify the content matches the repository implementation and existing documentation.
- [x] 2.2 Populate `.context/TOOLS.md` with canonical repository resources and commands plus the optional, explicitly activated Figma rule, and verify no absent Figma link is presented as a blocker.
- [x] 2.3 Populate `.context/TEAM.md` with the non-executing Planner role, allowed OpenSpec artifact writes, questioning behavior, task-quality requirements, and handoff boundary; verify product and owner-managed context edits are explicitly prohibited.
- [x] 2.4 Remove the empty `.context/SOUL.md` base file and verify `AGENTS.md` loads arbitrary `.context/*.md` extensions without naming Soul as required.

## 3. OpenSpec Guidance

- [x] 3.1 Configure `openspec/config.yaml` with concise project constraints and artifact rules for scoped proposals and ordered, verifiable tasks, and verify it does not duplicate discoverable architecture or application documentation.
- [x] 3.2 Document the post-archive retention workflow in `AGENTS.md`: exclude active changes, retain the 10 newest archive directories, verify durable spec synchronization before pruning, and verify the rule covers the safe and blocked eleventh-archive scenarios.
- [x] 3.3 Run strict OpenSpec validation for `add-agent-context-planner-workflow` and inspect the final diff to verify all specified context, Planner, Figma, Soul, routing, and archive-retention scenarios are represented consistently.

## Workflow follow-up

- Archive the change after implementation review, sync its new capability into the main specs, and apply the bounded archive-retention rule.
