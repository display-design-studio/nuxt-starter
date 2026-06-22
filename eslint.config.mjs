// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import tailwindcss from 'eslint-plugin-tailwindcss'

export default withNuxt(
  {
    ...tailwindcss.configs['recommended'],
    files: ['**/*.vue', '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    settings: {
      tailwindcss: {
        cssConfigPath: 'app/assets/css/main.css',
      },
    },
  },
)
