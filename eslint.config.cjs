// const globals = require('globals');
// const pluginJs = require('@eslint/js');
// const tseslint = require('typescript-eslint');
// const pluginReact = require('eslint-plugin-react');
// const nextConfig = require('eslint-config-next');

const globals = require('globals');
const typesParser = require('@typescript-eslint/parser');
// const next = require('eslint-config-next');
// const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');
// const esRecommended = require('eslint/conf/eslint-recommended');
// const prettier = require('eslint-config-prettier');
// const tsRecommended = require('eslint-plugin-@typescript-eslint/recommended');

module.exports = [
  // next,
  // nextCoreWebVitals,
  // esRecommended,
  // prettier,
  // tsRecommended,
  {
    name: 'Frontend',
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typesParser,
      globals: {
        ...globals.browser,
      },
    },
    ignores: ['**/.next/', '**/node_modules/'],
  },
  {
    name: 'Backend',
    files: ['backend/**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
    ignores: ['**/node_modules/'],
    rules: {
      'no-console': 'off',
    },
  },
];
