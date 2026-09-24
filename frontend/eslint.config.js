import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

// Safely spread config rules with null coalescing
const jsRules = js.configs?.recommended?.rules ?? {};
const tsRecommendedRules = tsPlugin.configs?.recommended?.rules ?? {};
const tsTypeCheckingRules = tsPlugin.configs?.['recommended-requiring-type-checking']?.rules ?? {};
const reactRecommendedRules = reactPlugin.configs?.recommended?.rules ?? {};
const reactHooksRecommendedRules = reactHooksPlugin.configs?.recommended?.rules ?? {};
const nextRecommendedRules = nextPlugin.configs?.recommended?.rules ?? {};

export default [
  {
    ignores: ['dist', 'build', '.next', 'node_modules', 'coverage'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        projectService: {
          allowDefaultProject: ['eslint.config.js', 'next.config.js', 'postcss.config.js', 'tailwind.config.js'],
        },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        EventSource: 'readonly',
        alert: 'readonly',
        prompt: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        getComputedStyle: 'readonly',
        crypto: 'readonly',
        // Node.js globals available in Next.js and config files
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: '19',
      },
    },
    rules: {
      ...jsRules,
      ...tsRecommendedRules,
      ...tsTypeCheckingRules,
      ...reactRecommendedRules,
      ...reactHooksRecommendedRules,
      ...nextRecommendedRules,
      // React 19 specific overrides
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // TypeScript handles ambient types (e.g., NodeJS from @types/node); ESLint's no-undef is redundant
      'no-undef': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*accessibility.test.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      'no-undef': 'off',
    },
  },
];
