import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/node_modules/**', 'docs/**', '**/.next/**'],
      provider: 'v8',
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/e2e/**',
    ],
  },
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, './frontend') }],
  },
});
