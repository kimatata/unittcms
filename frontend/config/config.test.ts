import { afterEach, describe, expect, it, vi } from 'vitest';
import Config from './config';

describe('Config.apiServer', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('Prod / Docker (SSR) — NODE_ENV=production, window undefined, NEXT_PUBLIC_BACKEND_ORIGIN unset', () => {
    it('returns http://localhost:8000/api using defaults', () => {
      vi.stubEnv('NODE_ENV', 'production');
      // PORT and API_PATH not set — defaults to 8000 and /api

      expect(Config.apiServer).toBe('http://localhost:8000/api');
    });
  });

  describe('Source build prod (SSR) — NODE_ENV=production, window undefined, NEXT_PUBLIC_BACKEND_ORIGIN set', () => {
    it('returns NEXT_PUBLIC_BACKEND_ORIGIN when set', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('NEXT_PUBLIC_BACKEND_ORIGIN', 'http://localhost:8001');

      expect(Config.apiServer).toBe('http://localhost:8001');
    });
  });

  describe('Dev (browser) — NODE_ENV=development, window defined', () => {
    it('returns NEXT_PUBLIC_BACKEND_ORIGIN when set', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubGlobal('window', {});
      vi.stubEnv('NEXT_PUBLIC_BACKEND_ORIGIN', 'http://localhost:8001');

      expect(Config.apiServer).toBe('http://localhost:8001');
    });
  });

  describe('Dev (SSR) — NODE_ENV=development, window undefined', () => {
    it('returns NEXT_PUBLIC_BACKEND_ORIGIN when set', () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('NEXT_PUBLIC_BACKEND_ORIGIN', 'http://localhost:8001');

      expect(Config.apiServer).toBe('http://localhost:8001');
    });
  });
});
