import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/node_modules/**', 'docs/**', '**/.next/**'],
      provider: 'v8',
    },
  },
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, './frontend') }],
  },
});
