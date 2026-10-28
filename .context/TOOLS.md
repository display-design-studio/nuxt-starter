# Tools and Resources

This document records canonical project resources and how agents may use them. Keep links current when a derived project changes repository, design board, CMS, or deployment ownership.

## Canonical Resources

| Resource | Location | Usage rule |
|---|---|---|
| GitHub repository | https://github.com/display-design-studio/nuxt-starter | Canonical remote for source history, issues, and collaboration |
| Human documentation | `README.md` | Product setup and maintenance documentation |
| Agent entry point | `AGENTS.md` | Project identity and operating rules |
| Durable agent context | `.context/*.md` | Read all Markdown files before substantive work |
| OpenSpec | `openspec/` | Durable capabilities and planning artifacts for substantive changes |
| Figma board | Not configured | Optional; access only after an explicit user request to use Figma |
| Sanity Studio | `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL` | Use only when configured and relevant to preview or content work |
| Netlify site | Derived from project deployment configuration | Do not infer production access or mutate deployment state without user authorization |

When this starter becomes a project, the owner must replace the GitHub URL and add project-specific resources. A missing optional resource is not a bootstrap blocker unless the user explicitly requests work that depends on it.

## Package and Runtime Commands

Use Bun as the package manager and script runner.

```bash
bun install        # install dependencies
bun run dev        # start the development server at http://localhost:3000
bun run build      # create a production build
bun run generate   # generate a static site
bun run preview    # preview a production build
bun run lint       # run ESLint without rewriting files
bun run lint:fix   # run ESLint with fixes; use only during authorized implementation
bun run test       # run focused unit tests
bun run typecheck  # run Nuxt/Vue type checking
```

Choose checks proportionate to the change. Documentation-only changes do not require an application build unless they alter executable examples or configuration.

## OpenSpec Commands

OpenSpec is already initialized with the `spec-driven` schema.

```bash
openspec list --json
openspec list --specs --json
openspec status --change <name> --json
openspec validate <name> --strict
openspec archive <name>
```

- Use OpenSpec for features, refactors, architectural decisions, and durable behavior changes.
- Use the installed OpenSpec skills for explore, propose, update, apply, sync, and archive workflows.
- Do not hand-create change scaffolds; use `openspec new change <name>` through the appropriate workflow.
- Follow the archive-retention contract in `AGENTS.md` after successful archival.

## Source Inspection

- Prefer `rg` and `rg --files` for repository search.
- Inspect existing implementation, tests, types, and configuration before asking discoverable questions.
- Treat `nuxt.config.ts`, `package.json`, source files, and generated type boundaries as implementation truth.
- Treat `AGENTS.md` and `.context/` as owner-managed policy rather than automatically inferred documentation.

## Figma Activation

Figma is opt-in for this starter:

- Do not open, search, inspect, or modify Figma unless the user explicitly asks to use it.
- When explicitly requested, use the board link recorded above.
- If no link is configured, ask the user to supply the relevant board or file.
- Do not block unrelated planning or implementation because Figma is absent.

## Secrets and External Mutations

- Never print, commit, or expose `.env` values, Sanity tokens, webhook secrets, or private preview identifiers.
- Reading public resources is distinct from changing external systems.
- Require explicit user scope before publishing, deploying, modifying CMS content, changing repository settings, or writing to external design tools.
