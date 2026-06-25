import antfu from '@antfu/eslint-config'
import sanity from '@sanity-labs/eslint-plugin'
import tailwindcss from 'eslint-plugin-tailwindcss'
import { groqSyntax } from './eslint-rules/groq-syntax.mjs'

export default antfu(
  {
    // Configures for antfu's config
  },
  {
    ignores: [
      '.nuxt/',
      '.output/',
      'dist/',
      'studio/',
      'studio/**',
    ],
  },

  // tailwindcss
  tailwindcss.configs.recommended,
  {
    files: ['**/*.vue', '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    settings: {
      tailwindcss: {
        cssConfigPath: 'app/assets/css/main.css',
      },
    },
  },

  // Sanity
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
