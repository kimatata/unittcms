import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from './crypto.js';

describe('crypto', () => {
  const originalKey = process.env.SECRET_KEY;

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret-key-for-unit-tests!!';
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.SECRET_KEY;
    } else {
      process.env.SECRET_KEY = originalKey;
    }
  });

  it('encrypt and decrypt roundtrip returns original text', () => {
    const token = 'ghp_testtoken1234567890abcdef';
    expect(decrypt(encrypt(token))).toBe(token);
  });

  it('produces different ciphertext for same input (random IV)', () => {
    const token = 'ghp_testtoken1234567890abcdef';
    expect(encrypt(token)).not.toBe(encrypt(token));
  });

  it('encrypted format is iv:authTag:ciphertext (3 hex parts)', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);
    parts.forEach((part) => expect(part).toMatch(/^[0-9a-f]+$/));
  });

  it('throws if SECRET_KEY is not set', () => {
    delete process.env.SECRET_KEY;
    expect(() => encrypt('test')).toThrow('SECRET_KEY');
  });

  it('throws on tampered ciphertext (GCM auth tag integrity)', () => {
    const token = 'ghp_testtoken1234567890abcdef';
    const encrypted = encrypt(token);
    const parts = encrypted.split(':');
    parts[2] = 'deadbeef';
    expect(() => decrypt(parts.join(':'))).toThrow();
  });
});
