# AGENTS

This file guides agentic coding tools working in this repo.
Keep changes aligned with existing Nuxt + Vue + TypeScript conventions.

## Repository Overview

- Framework: Nuxt 4 + Vue 3 (SFC, `<script setup lang="ts">`).
- Language: TypeScript (ESM, module type).
- Linting: ESLint via Nuxt config (`eslint.config.mjs`).
- CMS: Sanity via `@nuxtjs/sanity`, typegen enabled.
- Generated: `.nuxt/` is build output; do not edit.

## Commands

Use your preferred package manager (npm, pnpm, yarn, bun). Examples show npm.

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Static Generate

```bash
npm run generate
```

### Preview Build

```bash
npm run preview
```

### Postinstall (Nuxt prepare)

```bash
npm run postinstall
```

### Lint

- No `lint` script is configured in `package.json`.
- ESLint is installed; run it directly:

```bash
npx eslint .
```

### Tests

- No test runner is configured in this repo.
- There is no single-test command until a runner is added.
- If you add a test runner later, document `test` and single-test commands here.

## File Layout

- `app/app.vue`: Root app shell.
- `app/pages/`: File-based pages (Nuxt routing).
- `public/`: Static assets.
- `nuxt.config.ts`: Nuxt configuration.
- `.env` / `.env.example`: Runtime secrets and examples.
- `.nuxt/` and `.output/`: Generated build artifacts.

## Code Style Guidelines

### Vue SFC Conventions

- Use `<script setup lang="ts">` for components and pages.
- Keep scripts above templates.
- Prefer `await useAsyncData` / `useSanityQuery` with top-level `await`.
- Keep templates minimal; move logic to script.

### TypeScript

- Use explicit type imports (e.g. `import type { X } ...`).
- Use inferred types when obvious; add explicit types at boundaries.
- Prefer `const` for values and queries.
- Avoid `any`; use `unknown` and narrow when needed.

### Imports

- Order: type-only imports first, then value imports.
- Group imports by source (builtins, framework, local) with blank lines between.
- Use Nuxt aliases (e.g. `#build/types/...`) when provided.

### Formatting

- Use 2-space indentation.
- Use semicolons.
- Use double quotes in TS/JS.
- Include trailing commas in multiline objects/arrays.

### Naming

- Components: `PascalCase` (e.g. `ProductCard.vue`).
- Composables: `useX` (e.g. `useProducts`).
- Variables: `camelCase`.
- Constants: `camelCase` or `UPPER_SNAKE` for truly static values.
- Files in `app/pages/`: prefer kebab-case unless Nuxt routing requires nesting.

### Error Handling

- Prefer Nuxt helpers: `createError`, `showError`, `useError`.
- Wrap async calls with `try/catch` when failure is expected.
- Surface meaningful errors to the page; avoid silent failures.
- Log only actionable context; avoid leaking secrets.

### Data Fetching (Sanity)

- Use `groq` tagged templates for queries.
- Use `useSanityQuery<T>()` with generated types.
- Keep queries minimal and scoped to what the page needs.
- Avoid runtime mutation of query strings.

### Nuxt Config

- Keep `runtimeConfig` secrets in environment variables.
- Current Sanity env vars:
  - `SANITY_PROJECT_ID`
  - `NUXT_SANITY_TOKEN`
  - `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL`
- Do not commit secrets; use `.env.example` as a template.

## Agent Rules (Local)

- `.opencode/` exists but is currently empty.
- No Cursor rules found in `.cursor/rules/` or `.cursorrules`.
- No Copilot rules found in `.github/copilot-instructions.md`.

## External Agent Skills (antfu/skills)

Reference these skills if your agent can load them:

- `antfu`
- `nuxt`
- `vue`
- `pinia`
- `vite`
- `vitest`
- `vitepress`
- `unocss`
- `pnpm`
- `slidev`
- `tsdown`
- `turborepo`
- `vueuse-functions`
- `vue-best-practices`
- `vue-router-best-practices`
- `vue-testing-best-practices`
- `web-design-guidelines`

Source: https://github.com/antfu/skills

## Working Agreement

- Do not edit generated files in `.nuxt/` or `.output/`.
- Keep changes minimal and aligned with existing patterns.
- Update this file if new scripts, rules, or test tooling are added.
