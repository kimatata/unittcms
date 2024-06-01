import { describe, expect, test } from 'vitest';
import { isPrivatePath, checkSignInPage, isAdmin } from './token';

describe('check account path', () => {
  test('"account/" is private', () => {
    expect(isPrivatePath('/account')).toBe(true);
  });
  test('"account/signin" is public', () => {
    expect(isPrivatePath('/account/signin')).toBe(false);
  });
  test('"account/signup" is public', () => {
    expect(isPrivatePath('/account/signup')).toBe(false);
  });
});

describe('check admin path', () => {
  test('"admin/" is private', () => {
    expect(isPrivatePath('/admin')).toBe(true);
  });
  test('"admin/something" is private', () => {
    expect(isPrivatePath('/admin/signin')).toBe(true);
  });
});

describe('check projects path', () => {
  test('"projects/" is private', () => {
    expect(isPrivatePath('/projects')).toBe(true);
  });
  test('"projects/1" is private', () => {
    expect(isPrivatePath('/projects/1')).toBe(true);
  });
});

const validAdminToken = {
  access_token: 'loremipsumdolorsitametconsecteturadipiscingelit',
  expires_at: Infinity,
  user: {
    id: 1,
    email: 'admin@example.com',
    password: 'hashedpassword',
    username: 'admin',
    role: 0,
    avatarPath: null,
    createdAt: '2024-06-01T00:18:03.859Z',
    updatedAt: '2024-06-01T00:18:03.859Z',
  },
};

const validUserToken = {
  access_token: 'loremipsumdolorsitametconsecteturadipiscingelit',
  expires_at: Infinity,
  user: {
    id: 2,
    email: 'user@example.com',
    password: 'hashedpassword',
    username: 'user',
    role: 1,
    avatarPath: null,
    createdAt: '2024-06-01T00:18:03.859Z',
    updatedAt: '2024-06-01T00:18:03.859Z',
  },
};

const expiredUserToken = {
  access_token: 'loremipsumdolorsitametconsecteturadipiscingelit',
  expires_at: 1717200000000,
  user: {
    id: 2,
    email: 'user@example.com',
    password: 'hashedpassword',
    username: 'user',
    role: 1,
    avatarPath: null,
    createdAt: '2024-06-01T00:18:03.859Z',
    updatedAt: '2024-06-01T00:18:03.859Z',
  },
};

describe('check user is admin or not', () => {
  test('user with admin role is admin', () => {
    expect(isAdmin(validAdminToken)).toBe(true);
  });

  test('user with user role is not admin', () => {
    expect(isAdmin(validUserToken)).toBe(false);
  });
});

describe('check sign in', () => {
  test('Access to public paths by not signed user will be allowed', () => {
    const token = {
      access_token: '',
      expires_at: 0,
      user: null,
    };

    const privatePath = '/';
    expect(checkSignInPage(token, privatePath)).toStrictEqual({
      ok: true,
      reason: '',
      redirectPath: '',
    });
  });

  test('Access to private paths by not signed user in will be redirected', () => {
    const token = {
      access_token: '',
      expires_at: 0,
      user: null,
    };

    const privatePath = '/account';
    expect(checkSignInPage(token, privatePath)).toStrictEqual({
      ok: false,
      reason: 'notoken',
      redirectPath: '/account/signin',
    });
  });

  test('Access to private paths by signed in user will be allowed', () => {
    const privatePath = '/account';
    expect(checkSignInPage(validAdminToken, privatePath)).toStrictEqual({
      ok: true,
      reason: '',
      redirectPath: '',
    });
  });

  test('Access to private paths by user whose token expired will be redirected', () => {
    const privatePath = '/account';
    expect(checkSignInPage(expiredUserToken, privatePath)).toStrictEqual({
      ok: false,
      reason: 'expired',
      redirectPath: '/account/signin',
    });
  });
});
