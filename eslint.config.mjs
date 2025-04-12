import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import * as eslintPluginImport from 'eslint-plugin-import';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import eslintPluginOnlyWarn from 'eslint-plugin-only-warn';
import eslintPluginNext from '@next/eslint-plugin-next';

export default tseslint.config(
  {
    name: 'unittcms/ignore-globally',
    ignores: ['**/node_modules/', '**/.next/', '**/docs/'],
  },
  {
    name: 'unittcms/load-plugins',
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      import: eslintPluginImport,
      'unused-imports': eslintPluginUnusedImports,
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      '@next/next': eslintPluginNext,
      'only-warn': eslintPluginOnlyWarn,
    },
    settings: {
      react: {
        version: 'detect',
      },
      next: {
        rootDir: './*',
      },
    },
  },
  // Following settings ar on/off rules
  {
    name: 'unittcms/global-tuning',
    extends: [eslint.configs.recommended],
    rules: {
      'import/order': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'unittcms/for-typescript',
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      tseslint.configs.strict,
      eslintPluginReact.configs.flat.recommended,
      eslintPluginReact.configs.flat['jsx-runtime'],
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'react/prop-types': 'off',
      ...eslintPluginReactHooks.configs.recommended.rules,
    },
  },
  {
    name: 'unittcms/for-nextjs',
    files: ['frontend/**/*.{ts,tsx,js,jsx}'],
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs['core-web-vitals'].rules,
    },
  },
  {
    name: 'eslint-config-prettier',
    ...eslintConfigPrettier,
  }
);
