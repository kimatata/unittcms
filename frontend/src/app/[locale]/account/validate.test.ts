import { describe, expect, test } from 'vitest';
import { isValidEmail, isValidPassword } from './validate';

describe('account validation', () => {
  test('validate email', () => {
    const email1 = 'aaa@gmail.com';
    expect(isValidEmail(email1)).toBe(true);

    const email2 = 'gmail.com';
    expect(isValidEmail(email2)).toBe(false);

    const email23 = '';
    expect(isValidEmail(email23)).toBe(false);
  });

  test('validate password', () => {
    const pass1 = 'aaaaaaaa';
    expect(isValidPassword(pass1)).toBe(true);

    const pass2 = 'abcdefg';
    expect(isValidPassword(pass2)).toBe(false);

    const pass3 = '';
    expect(isValidPassword(pass3)).toBe(false);
  });
});
