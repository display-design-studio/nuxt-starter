// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import tailwindcss from 'eslint-plugin-tailwindcss'
import sanity from '@sanity-labs/eslint-plugin'
import { groqSyntax } from './eslint-rules/groq-syntax.mjs'

export default withNuxt(
  { ignores: ['.nuxt/', '.output/', 'dist/'] },
  tailwindcss.configs['recommended'],
  {
    files: ['**/*.vue', '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    settings: {
      tailwindcss: {
        cssConfigPath: 'app/assets/css/main.css',
      },
    },
  },
  ...sanity.configs.groq,
  {
    settings: {
      sanity: {
        schemaPath: '/studio/types/schema.json',
      },
    },
  },
  {
    files: ['shared/utils/**/*.ts'],
    plugins: { local: { rules: { 'groq-syntax': groqSyntax } } },
    rules: {
      'local/groq-syntax': 'error',
      'sanity/groq-unknown-field': 'warn',
      'sanity/groq-invalid-type-filter': 'error',
    },
  },
)
