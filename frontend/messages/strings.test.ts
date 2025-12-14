import { describe, it, expect } from 'vitest';
import de from './de.json';
import en from './en.json';
import ptBR from './pt-BR.json';
import zhCN from './zh-CN.json';
import ja from './ja.json';

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
    { name: 'de', data: de },
    { name: 'en', data: en },
    { name: 'pt-BR', data: ptBR },
    { name: 'zh-CN', data: zhCN },
    { name: 'ja', data: ja },
  ];

  const base = locales.find((locale) => locale.name === 'en');
  if (!base) throw new Error('Base locale not found');
  const baseKeys = getAllKeys(base.data);

  for (const locale of locales.slice(1)) {
    it(`should have the same keys as ${base.name} in ${locale.name}`, () => {
      const localeKeys = getAllKeys(locale.data);
      expect(localeKeys).toEqual(baseKeys);
    });
  }
});
