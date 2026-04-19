import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // react-hooks v7 : règles liées au React Compiler — trop strictes pour ce codebase
      // (useEffect + setState, useMemo manuels). À réactiver si on migre vers le modèle Compiler.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      // Navigation SPA / APIs navigateur : le linter interdit à tort window.location, etc.
      'react-hooks/immutability': 'off',
    },
  },
  {
    files: ['vite.config.ts'],
    rules: {
      // Middleware dev : JSON dynamique + imports .mjs sans types déclarés
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
])
