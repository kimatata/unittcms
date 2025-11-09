import { describe, it, expect } from 'vitest';
import en from './en.json';
import ja from './ja.json';
import ptBR from './pt-BR.json';

function getAllKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return getAllKeys(value, fullKey);
    }
    return [fullKey];
  });
}

describe('Locale message keys consistency', () => {
  const locales = [
    { name: 'en', data: en },
    { name: 'ja', data: ja },
    { name: 'pt-BR', data: ptBR },
  ];

  const base = locales[0];
  const baseKeys = getAllKeys(base.data);

  for (const locale of locales.slice(1)) {
    it(`should have the same keys as ${base.name} in ${locale.name}`, () => {
      const localeKeys = getAllKeys(locale.data);
      expect(localeKeys).toEqual(baseKeys);
    });
  }
});
