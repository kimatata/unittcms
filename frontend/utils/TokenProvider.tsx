'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { TokenContextType, TokenType } from '@/types/user';
import { TokenProps } from '@/types/user';
import { useRouter, usePathname } from '@/src/navigation';
import { roles } from '@/config/selection';
import { ToastContext } from './ToastProvider';
const LOCAL_STORAGE_KEY = 'testplat-auth-token';

function storeTokenToLocalStorage(token: TokenType) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(token));
}

function removeTokenFromLocalStorage() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

const defaultContext = {
  token: {
    access_token: '',
    user: null,
  },
  isSignedIn: () => false,
  isAdmin: () => false,
  setToken: (token: TokenType) => {},
  storeTokenToLocalStorage,
  removeTokenFromLocalStorage,
};
const TokenContext = createContext<TokenContextType>(defaultContext);

const TokenProvider = ({ toastMessages, locale, children }: TokenProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const toastContext = useContext(ToastContext);

  const [hasRestoreFinished, setHasRestoreFinished] = useState(false);
  const [token, setToken] = useState<TokenType>({
    access_token: '',
    expires_at: 0,
    user: null,
  });

  const tokenExists = () => {
    if (token && token.user && token.user.username) {
      return true;
    } else {
      return false;
    }
  };

  const isTokenValid = () => {
    if (Date.now() < token.expires_at) {
      return true;
    } else {
      return false;
    }
  };

  const isSignedIn = () => {
    if (tokenExists() && isTokenValid()) {
      return true;
    } else {
      return false;
    }
  };

  const isAdmin = () => {
    if (tokenExists() && isTokenValid()) {
      const adminRoleIndex = roles.findIndex((entry) => entry.uid === 'administrator');
      if (token.user.role === adminRoleIndex) {
        return true;
      }
    } else {
      return false;
    }
  };

  const tokenContext = {
    token,
    isSignedIn,
    isAdmin,
    setToken,
    storeTokenToLocalStorage,
    removeTokenFromLocalStorage,
  };

  const restoreTokenFromLocalStorage = () => {
    const tokenString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (tokenString) {
      const restoredToken = JSON.parse(tokenString);
      setToken(restoredToken);
    }
    setHasRestoreFinished(true);
  };

  useEffect(() => {
    restoreTokenFromLocalStorage();
  }, []);

  useEffect(() => {
    // pravate paths are '/account', '/admin', '/projects/*'
    const isPrivatePath = (pathname: string) => {
      return (
        /^\/account(\/)?$/.test(pathname) || /^\/admin(\/)?$/.test(pathname) || /^\/projects(\/.*)?$/.test(pathname)
      );
    };

    const checkSignInPage = () => {
      if (!hasRestoreFinished) {
        return;
      }
      if (isPrivatePath(pathname) && !isSignedIn()) {
        if (tokenExists()) {
          toastContext.showToast(toastMessages.needSignedIn, 'default');
          router.push(`/account/signin`, { locale: locale });
          return;
        }
        if (isTokenValid()) {
          toastContext.showToast(toastMessages.sessionExpired, 'default');
          router.push(`/account/signin`, { locale: locale });
          return;
        }
      }
    };

    checkSignInPage();
  }, [pathname, hasRestoreFinished]);

  return <TokenContext.Provider value={tokenContext}>{children}</TokenContext.Provider>;
};

export { TokenContext };
export default TokenProvider;
