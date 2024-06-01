import { TokenType } from '@/types/user';
import { roles } from '@/config/selection';

function tokenExists(token: TokenType) {
  if (token && token.user && token.user.username) {
    return true;
  } else {
    return false;
  }
}

function isTokenValid(token: TokenType) {
  if (Date.now() < token.expires_at) {
    return true;
  } else {
    return false;
  }
}

function isSignedIn(token: TokenType): boolean {
  if (tokenExists(token) && isTokenValid(token)) {
    return true;
  } else {
    return false;
  }
}

function isAdmin(token: TokenType) {
  if (tokenExists(token) && isTokenValid(token)) {
    const adminRoleIndex = roles.findIndex((entry) => entry.uid === 'administrator');
    if (token.user.role === adminRoleIndex) {
      return true;
    }
  }

  return false;
}

// pravate paths are '/account', '/admin', '/projects/*'
const isPrivatePath = (pathname: string) => {
  return /^\/account(\/)?$/.test(pathname) || /^\/admin(\/.*)?$/.test(pathname) || /^\/projects(\/.*)?$/.test(pathname);
};

function checkSignInPage(token: TokenType, pathname: string) {
  let ret = {
    ok: true,
    reason: '',
    redirectPath: '',
  };

  if (isPrivatePath(pathname) && !isSignedIn(token)) {
    if (!tokenExists(token)) {
      ret.ok = false;
      ret.reason = 'notoken';
      ret.redirectPath = '/account/signin';
      return ret;
    }
    if (!isTokenValid(token)) {
      ret.ok = false;
      ret.reason = 'expired';
      ret.redirectPath = '/account/signin';
      return ret;
    }
  }

  return ret;
}

export { isSignedIn, isAdmin, isPrivatePath, checkSignInPage };
