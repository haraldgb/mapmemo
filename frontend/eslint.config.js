import js from '@eslint/js'
import globals from 'globals'
import importPlugin from 'eslint-plugin-import'
import eslintConfigPrettier from 'eslint-config-prettier'
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
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-default-export': 'error',
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
      curly: ['error', 'all'],
      'no-throw-literal': 'error',
      // 'no-warning-comments': ['warn', { terms: ['TODO'], location: 'start' }],
      'no-unreachable': 'warn',
      'no-console': 'error',
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            'CallExpression[callee.name=/^(useEffect)|(useMemo)|(useCallback)/] > ArrowFunctionExpression',
          message:
            'Avoid anonymous arrow functions as hook arguments; use a named function instead.',
        },
        {
          selector:
            'VariableDeclarator[id.name=/^[A-Z]/] > ArrowFunctionExpression[body.type!="BlockStatement"]',
          message:
            'Use an explicit function body with return for PascalCase component arrow functions.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [],
        },
      ],
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    files: ['vite.config.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
])
